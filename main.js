#!/usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { mergeFiles, DEFAULT_CONFIG } from "./mergerocket.js";

const argv = yargs(hideBin(process.argv))
  .option("dir", {
    alias: "d",
    type: "string",
    description: "Base directory to process",
    default: DEFAULT_CONFIG.defaultDir,
  })
  .option("out", {
    alias: "o",
    type: "string",
    description: "Output file path",
    default: DEFAULT_CONFIG.defaultOutput,
  })
  .option("blacklist", {
    type: "string",
    description: "File extensions to ignore (comma separated)",
    default: DEFAULT_CONFIG.defaultIgnore,
  })
  .option("start", {
    type: "string",
    description: "Start marker template for files",
    default: DEFAULT_CONFIG.defaultStartTemplate,
  })
  .option("end", {
    type: "string",
    description: "End marker template for files",
    default: DEFAULT_CONFIG.defaultEndTemplate,
  })
  .option("keep-hidden", {
    type: "boolean",
    description: "Keep hidden files",
    default: false,
  })
  .option("ignore-gitignore", {
    type: "boolean",
    description: "Ignore .gitignore rules",
    default: false,
  })
  .option("attach-summary", {
    type: "boolean",
    description: "Add summary to the output file",
    default: false,
  })
  .help().argv;

const baseDir = argv.dir;
const outFile = argv.out;
const ignoreExts = argv.blacklist.split(",").map((ext) => ext.trim().toLowerCase());
const startMarker = argv.start;
const endMarker = argv.end;
const keepHidden = argv["keep-hidden"];
const ignoreGitignore = argv["ignore-gitignore"];
const attachSummary = argv["attach-summary"];

console.log("Merging text file contents...");

const result = mergeFiles({
  dir: baseDir,
  out: outFile,
  blacklist: ignoreExts,
  start: startMarker,
  end: endMarker,
  keepHidden,
  ignoreGitignore,
  attachSummary,
});

console.log(result.summaryText);
console.log(`Merge completed: ${result.mergedCount} files processed into ${result.outFile}`);
