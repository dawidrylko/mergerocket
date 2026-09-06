import test from "ava";
import fs from "fs";
import path from "path";
import { walkDirectory, mergeFiles } from "../mergerocket.js";
import {
  setupTestEnvironment,
  cleanupTestEnvironment,
  testDataDir,
  outputDir,
} from "./helpers.js";

test.beforeEach(() => {
  setupTestEnvironment();
});

test.afterEach.always(() => {
  cleanupTestEnvironment();
});

const countByRealPath = (paths) => {
  const counts = new Map();
  paths.forEach((filePath) => {
    const real = fs.realpathSync(filePath);
    counts.set(real, (counts.get(real) || 0) + 1);
  });
  return counts;
};

test.serial("walkDirectory visits each file once when a symlink points back at an ancestor", (t) => {
  fs.symlinkSync(testDataDir, path.join(testDataDir, "loop"), "dir");

  const visited = [];
  walkDirectory(
    testDataDir,
    (filePath) => {
      visited.push(filePath);
    },
    { keepHidden: false, ignoreGitignore: true }
  );

  const repeated = [...countByRealPath(visited).entries()].filter(
    ([, count]) => count > 1
  );

  t.deepEqual(repeated, [], "No file should be visited more than once");
  t.true(
    visited.some((filePath) => path.basename(filePath) === "file1.txt"),
    "Files outside the loop should still be visited"
  );
});

test.serial("walkDirectory visits a directory once when two symlinks point at it", (t) => {
  fs.symlinkSync(
    path.join(testDataDir, "nested"),
    path.join(testDataDir, "first-link"),
    "dir"
  );
  fs.symlinkSync(
    path.join(testDataDir, "nested"),
    path.join(testDataDir, "second-link"),
    "dir"
  );

  const visited = [];
  walkDirectory(
    testDataDir,
    (filePath) => {
      visited.push(filePath);
    },
    { keepHidden: false, ignoreGitignore: true }
  );

  const nestedFile = fs.realpathSync(
    path.join(testDataDir, "nested", "nested-file.txt")
  );

  t.is(
    countByRealPath(visited).get(nestedFile),
    1,
    "A directory reachable by several paths should be walked once"
  );
});

// Deliberately no loop here. On the unfixed code a loop plus a reachable
// output file makes the merge append the output to itself once per level,
// which grows exponentially and fills the disk rather than failing.
test.serial("mergeFiles does not merge the output file into itself through a symlink", (t) => {
  const outFile = path.join(outputDir, "merged.txt");
  fs.symlinkSync(outputDir, path.join(testDataDir, "out-link"), "dir");

  const result = mergeFiles({
    dir: testDataDir,
    out: outFile,
    ignoreGitignore: true,
  });

  const content = fs.readFileSync(outFile, "utf8");
  const selfMarkers = content
    .split("\n")
    .filter((line) => line.includes("START:") && line.includes("out-link"));

  t.deepEqual(
    selfMarkers,
    [],
    "The output file must not appear in its own content"
  );
  t.true(
    result.mergedCount > 0,
    "The merge should still process the real files"
  );
});

const START_PREFIX = "--- START: ";
const START_SUFFIX = " ---";

const mergedRealPaths = (outFile) =>
  fs
    .readFileSync(outFile, "utf8")
    .split("\n")
    .filter((line) => line.startsWith(START_PREFIX))
    .map((line) =>
      line.slice(START_PREFIX.length, line.length - START_SUFFIX.length)
    )
    .map((filePath) => fs.realpathSync(filePath));

test.serial("mergeFiles merges each real file once when the tree loops", (t) => {
  const outFile = path.join(outputDir, "merged.txt");
  fs.symlinkSync(testDataDir, path.join(testDataDir, "nested", "loop"), "dir");

  mergeFiles({
    dir: path.join(testDataDir, "nested"),
    out: outFile,
    ignoreGitignore: true,
  });

  const merged = mergedRealPaths(outFile);
  const counts = new Map();
  merged.forEach((filePath) => {
    counts.set(filePath, (counts.get(filePath) || 0) + 1);
  });
  const repeated = [...counts.entries()].filter(([, count]) => count > 1);

  t.deepEqual(repeated, [], "No file should be merged more than once");
  t.true(
    merged.length > 1,
    "The symlinked directory should still contribute its files"
  );
});
