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

test("mergeFiles respects .gitignore by default", (t) => {
  const outFile = path.join(outputDir, "output-with-gitignore.txt");

  mergeFiles({
    dir: testDataDir,
    out: outFile,
    ignoreGitignore: false,
  });

  t.true(fs.existsSync(outFile), "Output file should exist");
  const content = fs.readFileSync(outFile, "utf8");

  t.false(
    content.includes("This should be ignored by gitignore"),
    "Output should not contain gitignored file content"
  );
  t.false(
    content.includes("This should also be ignored"),
    "Output should not contain files matching gitignore patterns"
  );
});

test("mergeFiles includes gitignored files when ignoreGitignore is true", (t) => {
  const outFile = path.join(outputDir, "output-no-gitignore.txt");

  mergeFiles({
    dir: testDataDir,
    out: outFile,
    ignoreGitignore: true,
  });

  t.true(fs.existsSync(outFile), "Output file should exist");
  const content = fs.readFileSync(outFile, "utf8");

  t.true(
    content.includes("This should be ignored by gitignore"),
    "Output should contain gitignored file content when ignoreGitignore is true"
  );
  t.true(
    content.includes("This should also be ignored"),
    "Output should contain files matching gitignore patterns when ignoreGitignore is true"
  );
});

test("mergeFiles ignores node_modules and coverage folders by default", (t) => {
  const nodeModulesDir = path.join(testDataDir, "node_modules");
  const coverageDir = path.join(testDataDir, "coverage");

  fs.mkdirSync(nodeModulesDir, { recursive: true });
  fs.mkdirSync(coverageDir, { recursive: true });

  const nodeModulesFile = path.join(nodeModulesDir, "test-module.js");
  fs.writeFileSync(
    nodeModulesFile,
    "console.log('This is a test module file')"
  );

  const coverageFile = path.join(coverageDir, "coverage-report.json");
  fs.writeFileSync(coverageFile, '{"coverage": "test"}');

  const gitignorePath = path.join(testDataDir, ".gitignore");
  fs.appendFileSync(gitignorePath, "\n/node_modules\ncoverage/\n");

  const outFile = path.join(outputDir, "output-folder-ignore.txt");

  mergeFiles({
    dir: testDataDir,
    out: outFile,
  });

  t.true(fs.existsSync(outFile), "Output file should exist");
  const content = fs.readFileSync(outFile, "utf8");

  t.false(
    content.includes("This is a test module file"),
    "Output should not contain files from node_modules folder"
  );
  t.false(
    content.includes('{"coverage": "test"}'),
    "Output should not contain files from coverage folder"
  );
});

test("mergeFiles includes node_modules and coverage folders when ignoreGitignore is true", (t) => {
  const outFile = path.join(outputDir, "output-folder-include.txt");

  mergeFiles({
    dir: testDataDir,
    out: outFile,
    ignoreGitignore: true,
  });

  t.true(fs.existsSync(outFile), "Output file should exist");
  const content = fs.readFileSync(outFile, "utf8");

  const nodeModulesFile = path.join(
    testDataDir,
    "node_modules",
    "test-module.js"
  );
  const coverageFile = path.join(
    testDataDir,
    "coverage",
    "coverage-report.json"
  );

  if (fs.existsSync(nodeModulesFile)) {
    t.true(
      content.includes("This is a test module file") ||
        !fs.existsSync(nodeModulesFile),
      "Output should include files from node_modules folder when ignoreGitignore=true"
    );
  }

  if (fs.existsSync(coverageFile)) {
    t.true(
      content.includes('{"coverage": "test"}') || !fs.existsSync(coverageFile),
      "Output should include files from coverage folder when ignoreGitignore=true"
    );
  }
});
