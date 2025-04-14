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

test("mergeFiles creates output with custom filename", (t) => {
  const customOutFile = path.join(outputDir, "custom-output-name.txt");

  const result = mergeFiles({
    dir: testDataDir,
    out: customOutFile,
  });

  t.true(fs.existsSync(customOutFile), "Custom named output file should exist");
  t.is(
    result.outFile,
    customOutFile,
    "Result should contain correct output file path"
  );
});

test("mergeFiles overwrites existing output file", (t) => {
  const outFile = path.join(outputDir, "overwrite-test.txt");

  fs.writeFileSync(outFile, "Initial content that should be overwritten");

  mergeFiles({
    dir: testDataDir,
    out: outFile,
  });

  const content = fs.readFileSync(outFile, "utf8");
  t.false(
    content.includes("Initial content that should be overwritten"),
    "Output file should be overwritten, not appended to"
  );
});
