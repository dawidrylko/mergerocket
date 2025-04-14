import test from "ava";
import fs from "fs";
import path from "path";
import { mergeFiles, DEFAULT_CONFIG } from "../mergerocket.js";
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

test("mergeFiles creates output file with correct content", (t) => {
  const outFile = path.join(outputDir, "output1.txt");

  const result = mergeFiles({
    dir: testDataDir,
    out: outFile,
  });

  t.true(fs.existsSync(outFile), "Output file should exist");
  const content = fs.readFileSync(outFile, "utf8");

  t.true(
    content.includes("This is file 1 content"),
    "Output should contain file1.txt content"
  );
  t.true(
    content.includes('console.log("This is file 2 content");'),
    "Output should contain file2.js content"
  );
  t.true(
    content.includes("This is a nested file"),
    "Output should contain nested file content"
  );

  t.false(
    content.includes("This is a hidden file"),
    "Output should not contain hidden files"
  );
  t.false(
    content.includes("This is a hidden nested file"),
    "Output should not contain hidden nested files"
  );

  t.true(
    content.includes("[SKIP] Binary file:"),
    "Output should indicate binary files are skipped"
  );

  t.true(result.mergedCount > 0, "Should have merged some files");
  t.true(result.textFileCount > 0, "Should have processed some text files");
  t.true(result.binarySkippedCount > 0, "Should have skipped binary files");
});

test("mergeFiles uses default markers", (t) => {
  const outFile = path.join(outputDir, "output-default-markers.txt");

  mergeFiles({
    dir: testDataDir,
    out: outFile,
  });

  t.true(fs.existsSync(outFile), "Output file should exist");
  const content = fs.readFileSync(outFile, "utf8");

  t.true(
    content.includes(
      DEFAULT_CONFIG.defaultStartTemplate.replace(
        "{file}",
        path.join(testDataDir, "file1.txt")
      )
    ),
    "Output should contain default start marker"
  );
  t.true(
    content.includes(
      DEFAULT_CONFIG.defaultEndTemplate.replace(
        "{file}",
        path.join(testDataDir, "file1.txt")
      )
    ),
    "Output should contain default end marker"
  );
});
