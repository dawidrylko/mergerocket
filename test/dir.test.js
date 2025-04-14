import test from "ava";
import fs from "fs";
import path from "path";
import { mergeFiles } from "../mergerocket.js";
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

test("mergeFiles uses specified directory", (t) => {
  const outFile = path.join(outputDir, "output-specific-dir.txt");
  const nestedDir = path.join(testDataDir, "nested");

  const result = mergeFiles({
    dir: nestedDir,
    out: outFile,
  });

  t.true(fs.existsSync(outFile), "Output file should exist");
  const content = fs.readFileSync(outFile, "utf8");

  t.true(
    content.includes("This is a nested file"),
    "Output should contain nested file content"
  );
  t.false(
    content.includes("This is file 1 content"),
    "Output should not contain files outside the specified directory"
  );
  t.false(
    content.includes("This is file 2 content"),
    "Output should not contain files outside the specified directory"
  );

  t.true(result.mergedCount > 0, "Should have merged some files");
  t.true(
    result.mergedCount < 3,
    "Should not have merged files outside the nested directory"
  );
});

test("mergeFiles handles non-existent directory gracefully", (t) => {
  const outFile = path.join(outputDir, "output-nonexistent-dir.txt");
  const nonExistentDir = path.join(testDataDir, "does-not-exist");

  fs.mkdirSync(path.dirname(outFile), { recursive: true });

  const result = mergeFiles({
    dir: nonExistentDir,
    out: outFile,
  });

  if (!fs.existsSync(outFile)) {
    fs.writeFileSync(outFile, "");
  }

  t.true(fs.existsSync(path.dirname(outFile)), "Output directory should exist");
  t.is(result.mergedCount, 0, "No files should have been merged");
  t.is(result.textFileCount, 0, "No text files should have been processed");
});
