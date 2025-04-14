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

test("mergeFiles respects custom ignore extensions", (t) => {
  const outFile = path.join(outputDir, "output-ignore.txt");

  mergeFiles({
    dir: testDataDir,
    out: outFile,
    blacklist: [".js"],
  });

  t.true(fs.existsSync(outFile), "Output file should exist");
  const content = fs.readFileSync(outFile, "utf8");

  t.true(
    content.includes("This is file 1 content"),
    "Output should contain file1.txt content"
  );
  t.false(
    content.includes('console.log("This is file 2 content");'),
    "Output should not contain file2.js content"
  );
});

test("mergeFiles handles multiple ignore extensions", (t) => {
  const outFile = path.join(outputDir, "output-multi-ignore.txt");

  mergeFiles({
    dir: testDataDir,
    out: outFile,
    blacklist: [".txt", ".js"],
  });

  t.true(fs.existsSync(outFile), "Output file should exist");
  const content = fs.readFileSync(outFile, "utf8");

  t.false(
    content.includes("This is file 1 content"),
    "Output should not contain file1.txt content"
  );
  t.false(
    content.includes('console.log("This is file 2 content");'),
    "Output should not contain file2.js content"
  );
  t.false(
    content.includes("This is a nested file"),
    "Output should not contain nested text file content"
  );
});
