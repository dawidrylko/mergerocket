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

test("mergeFiles includes hidden files when keepHidden is true", (t) => {
  const outFile = path.join(outputDir, "output-with-hidden.txt");

  mergeFiles({
    dir: testDataDir,
    out: outFile,
    keepHidden: true,
    ignoreGitignore: true,
  });

  t.true(fs.existsSync(outFile), "Output file should exist");
  const content = fs.readFileSync(outFile, "utf8");

  t.true(
    content.includes("This is a hidden file"),
    "Output should contain hidden file content when keepHidden is true"
  );
  t.true(
    content.includes("This is a hidden nested file"),
    "Output should contain hidden nested file content when keepHidden is true"
  );
});

test("mergeFiles excludes hidden files by default", (t) => {
  const outFile = path.join(outputDir, "output-without-hidden.txt");

  mergeFiles({
    dir: testDataDir,
    out: outFile,
    ignoreGitignore: true,
  });

  t.true(fs.existsSync(outFile), "Output file should exist");
  const content = fs.readFileSync(outFile, "utf8");

  t.false(
    content.includes("This is a hidden file"),
    "Output should not contain hidden file content by default"
  );
  t.false(
    content.includes("This is a hidden nested file"),
    "Output should not contain hidden nested file content by default"
  );
});
