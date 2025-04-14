import test from "ava";
import fs from "fs";
import path from "path";
import {
  isBinaryFile,
  isIgnoredByGitignore,
  walkDirectory,
} from "../mergerocket.js";
import {
  setupTestEnvironment,
  cleanupTestEnvironment,
  testDataDir,
} from "./helpers.js";

test.beforeEach(() => {
  setupTestEnvironment();
});

test.afterEach.always(() => {
  cleanupTestEnvironment();
});

test("isBinaryFile correctly identifies binary files", (t) => {
  const binaryFilePath = path.join(testDataDir, "binary.bin");
  const textFilePath = path.join(testDataDir, "file1.txt");

  t.true(isBinaryFile(binaryFilePath), "Should detect binary file");
  t.false(isBinaryFile(textFilePath), "Should not detect text file as binary");
  t.true(
    isBinaryFile("non-existent-file.xyz"),
    "Should handle non-existent files gracefully"
  );
});

test("isIgnoredByGitignore correctly checks patterns", (t) => {
  const ignoredFile = path.join(testDataDir, "ignore-me.txt");
  const normalFile = path.join(testDataDir, "file1.txt");
  const ignoredByPattern = path.join(testDataDir, "test.ignored");

  const patterns = ["ignore-me.txt", "*.ignored"];

  t.true(
    isIgnoredByGitignore(ignoredFile, testDataDir, patterns),
    "Should detect explicitly ignored file"
  );
  t.false(
    isIgnoredByGitignore(normalFile, testDataDir, patterns),
    "Should not ignore normal file"
  );
  t.true(
    isIgnoredByGitignore(ignoredByPattern, testDataDir, patterns),
    "Should detect file ignored by pattern"
  );
  t.false(
    isIgnoredByGitignore(normalFile, testDataDir, []),
    "Should not ignore when patterns empty"
  );
});

test("walkDirectory correctly traverses directories with keepHidden flag", (t) => {
  const visibleFilesOnly = [];
  walkDirectory(
    testDataDir,
    (filePath) => {
      visibleFilesOnly.push(filePath);
    },
    { keepHidden: false, ignoreGitignore: true }
  );

  t.false(
    visibleFilesOnly.some((file) => path.basename(file).startsWith(".")),
    "Should not include hidden files when keepHidden is false"
  );

  const allFiles = [];
  walkDirectory(
    testDataDir,
    (filePath) => {
      allFiles.push(filePath);
    },
    { keepHidden: true, ignoreGitignore: true }
  );

  t.true(
    allFiles.some((file) => path.basename(file).startsWith(".")),
    "Should include hidden files when keepHidden is true"
  );
});

test("walkDirectory handles errors gracefully", (t) => {
  const restrictedDir = path.join(testDataDir, "restricted");
  if (!fs.existsSync(restrictedDir)) {
    fs.mkdirSync(restrictedDir);
  }

  t.notThrows(() => {
    walkDirectory(testDataDir, () => {}, {
      keepHidden: true,
      ignoreGitignore: true,
    });
  });
});

test("walkDirectory respects gitignore and keepHidden options together", (t) => {
  const visibleNonIgnoredFiles = [];
  walkDirectory(
    testDataDir,
    (filePath) => {
      visibleNonIgnoredFiles.push(filePath);
    },
    {
      keepHidden: false,
      ignoreGitignore: false,
      gitignorePatterns: ["ignore-me.txt", "*.ignored"],
      baseDir: testDataDir,
    }
  );

  t.false(
    visibleNonIgnoredFiles.some((file) => path.basename(file).startsWith(".")),
    "Should not include hidden files"
  );
  t.false(
    visibleNonIgnoredFiles.some(
      (file) => path.basename(file) === "ignore-me.txt"
    ),
    "Should not include gitignored files"
  );
  t.false(
    visibleNonIgnoredFiles.some((file) =>
      path.basename(file).endsWith(".ignored")
    ),
    "Should not include files matching gitignore patterns"
  );
});
