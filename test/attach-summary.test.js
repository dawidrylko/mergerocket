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

test("mergeFiles adds summary header when attachSummary is true", (t) => {
  const outFile = path.join(outputDir, "output-with-summary.txt");

  mergeFiles({
    dir: testDataDir,
    out: outFile,
    attachSummary: true,
  });

  t.true(fs.existsSync(outFile), "Output file should exist");
  const content = fs.readFileSync(outFile, "utf8");

  t.true(
    content.includes("Merged File Summary"),
    "Output should contain summary header"
  );
  t.true(
    content.includes("Files processed for merging:"),
    "Output should contain summary statistics"
  );
  t.true(
    content.includes("Text files merged:"),
    "Output should contain text file count"
  );
  t.true(
    content.includes("Binary files skipped:"),
    "Output should contain binary file count"
  );
  t.true(
    content.includes("Duration:"),
    "Output should contain processing duration"
  );
});

test("mergeFiles does not add summary by default", (t) => {
  const outFile = path.join(outputDir, "output-without-summary.txt");

  mergeFiles({ dir: testDataDir, out: outFile });

  t.true(fs.existsSync(outFile), "Output file should exist");
  const content = fs.readFileSync(outFile, "utf8");

  t.false(
    content.includes("Merged File Summary"),
    "Output should not contain summary header by default"
  );
});

test("summary contains proper file type counts", (t) => {
  const outFile = path.join(outputDir, "output-summary-types.txt");

  const result = mergeFiles({
    dir: testDataDir,
    out: outFile,
    attachSummary: true,
  });

  t.true(fs.existsSync(outFile), "Output file should exist");

  t.true(
    result.summaryText.includes("Merged file count by type:"),
    "Summary should include file type counts"
  );

  if (result.fileTypeCounts[".txt"] > 0) {
    t.true(
      result.summaryText.includes(".txt:"),
      "Summary should count .txt files"
    );
  }

  if (result.fileTypeCounts[".js"] > 0) {
    t.true(
      result.summaryText.includes(".js:"),
      "Summary should count .js files"
    );
  }
});
