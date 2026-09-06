import fs from "fs";
import path from "path";

/**
 * @typedef {Object} DefaultConfig
 * @property {string} defaultDir - Default directory to process
 * @property {string} defaultOutput - Default output file path
 * @property {string} defaultIgnore - Default file extensions to ignore (comma separated)
 * @property {string} defaultStartTemplate - Default start marker template
 * @property {string} defaultEndTemplate - Default end marker template
 */

/**
 * @type {DefaultConfig}
 */
export const DEFAULT_CONFIG = {
  defaultDir: ".",
  defaultOutput: `merged_${Date.now()}.txt`,
  defaultIgnore: ".png,.jpg,.jpeg,.gif,.bmp,.ico,.zip,.gz,.tar,.rar,.exe",
  defaultStartTemplate: "--- START: {file} ---",
  defaultEndTemplate: "--- END: {file} ---",
};

/**
 * @typedef {Object} MergeOptions
 * @property {string} [dir=DEFAULT_CONFIG.defaultDir] - Base directory to process
 * @property {string} [out=DEFAULT_CONFIG.defaultOutput] - Output file path
 * @property {string[]} [blacklist] - File extensions to ignore
 * @property {string} [start=DEFAULT_CONFIG.defaultStartTemplate] - Start marker template
 * @property {string} [end=DEFAULT_CONFIG.defaultEndTemplate] - End marker template
 * @property {boolean} [keepHidden=false] - Whether to include hidden files
 * @property {boolean} [ignoreGitignore=false] - Whether to ignore .gitignore rules
 * @property {boolean} [attachSummary=false] - Whether to add summary to output file
 */

/**
 * @typedef {Object} MergeResult
 * @property {number} mergedCount - Total number of files processed
 * @property {number} textFileCount - Number of text files merged
 * @property {number} binarySkippedCount - Number of binary files skipped
 * @property {number} failedReadCount - Number of files that failed to read
 * @property {Object.<string, number>} fileTypeCounts - Count of files by extension
 * @property {string} summaryText - Generated summary text
 * @property {string} outFile - Path to the output file
 * @property {number} durationMs - Duration of the operation in milliseconds
 */

/**
 * @typedef {Object} WalkDirectoryOptions
 * @property {boolean} [keepHidden=false] - Whether to include hidden files and directories
 * @property {boolean} [ignoreGitignore=false] - Whether to ignore .gitignore rules
 * @property {string[]} [gitignorePatterns=[]] - Patterns from .gitignore file
 * @property {string} [baseDir] - Base directory for resolving relative paths
 * @property {Set<string>} [visited] - Real paths already walked, used internally to break symlink cycles
 */

/**
 * Reads gitignore patterns from a directory
 * @param {string} baseDir - Base directory to look for .gitignore
 * @returns {string[]} - Array of gitignore patterns
 */
const readGitignorePatterns = (baseDir) => {
  const gitignorePath = path.join(baseDir, ".gitignore");
  if (!fs.existsSync(gitignorePath)) {
    return [];
  }

  try {
    const gitignoreContent = fs.readFileSync(gitignorePath, "utf8");
    return gitignoreContent
      .split(/\r?\n/)
      .filter((line) => {
        line = line.trim();
        return line && !line.startsWith("#");
      })
      .map((line) => line.trim());
  } catch {
    return [];
  }
};

/**
 * Generates summary text based on merge results
 * @param {Object} params - Parameters for generating summary
 * @param {number} params.mergedCount - Total files processed
 * @param {number} params.textFileCount - Text files processed
 * @param {number} params.binarySkippedCount - Binary files skipped
 * @param {number} params.failedReadCount - Files failed to read
 * @param {Object.<string, number>} params.fileTypeCounts - Count by file type
 * @param {number} params.durationMs - Duration in milliseconds
 * @param {string} params.startMarker - Start marker template
 * @param {string} params.endMarker - End marker template
 * @returns {string} - Generated summary text
 */
const generateSummaryText = ({
  mergedCount,
  textFileCount,
  binarySkippedCount,
  failedReadCount,
  fileTypeCounts,
  durationMs,
  startMarker,
  endMarker,
}) => {
  const summaryHeader = "Merged File Summary";
  const summaryLines = [];
  
  summaryLines.push(startMarker.replace("{file}", summaryHeader));
  summaryLines.push(`Execution Date: ${new Date().toLocaleString()}`);
  summaryLines.push(`Duration: ${durationMs} ms`);
  summaryLines.push(`Files processed for merging: ${mergedCount}`);
  summaryLines.push(`Text files merged: ${textFileCount}`);
  summaryLines.push(`Binary files skipped: ${binarySkippedCount}`);
  summaryLines.push(`Files failed to read: ${failedReadCount}`);
  summaryLines.push("Merged file count by type:");
  
  Object.entries(fileTypeCounts).forEach(([ext, count]) => {
    summaryLines.push(`  ${ext || "[none]"}: ${count}`);
  });
  
  summaryLines.push(endMarker.replace("{file}", summaryHeader));
  return summaryLines.join("\n");
};

/**
 * Resolves a path to the real file it names, following symlinks.
 * Falls back to a normalized absolute path when the target does not exist yet.
 * @param {string} filePath - Path to resolve
 * @returns {string} - Real path, or the normalized absolute path
 */
const resolveRealPath = (filePath) => {
  try {
    return fs.realpathSync(filePath);
  } catch {
    return path.resolve(filePath);
  }
};

/**
 * Checks if a file is binary
 * @param {string} filePath - Path to the file
 * @returns {boolean} - True if the file is binary
 */
export const isBinaryFile = (filePath) => {
  const BUF_LENGTH = 8000;
  const buffer = Buffer.alloc(BUF_LENGTH);
  let fd;
  
  try {
    fd = fs.openSync(filePath, "r");
    const bytesRead = fs.readSync(fd, buffer, 0, BUF_LENGTH, 0);
    
    for (let i = 0; i < bytesRead; i++) {
      if (buffer[i] === 0) {
        return true;
      }
    }
    return false;
  } catch {
    return true;
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
  }
};

/**
 * Checks if a pattern matches a path using glob-like matching
 * @param {string} relativePath - Path relative to base directory
 * @param {string} pattern - The glob pattern to match
 * @returns {boolean} - True if the path matches the pattern
 */
const globMatch = (relativePath, pattern) => {
  const regexPattern = pattern
    .replace(/\./g, "\\.")
    .replace(/\*/g, ".*")
    .replace(/\?/g, ".");
  
  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(relativePath);
};

/**
 * Checks if a file is ignored by gitignore patterns
 * @param {string} filePath - Path to the file
 * @param {string} baseDir - Base directory for relative paths
 * @param {string[]} gitignorePatterns - Patterns from .gitignore
 * @returns {boolean} - True if the file should be ignored
 */
export const isIgnoredByGitignore = (filePath, baseDir, gitignorePatterns) => {
  if (!gitignorePatterns.length) {
    return false;
  }
  
  const relativePath = path
    .relative(baseDir, filePath)
    .split(path.sep)
    .join("/");

  for (const pattern of gitignorePatterns) {
    const normalizedPattern = pattern.startsWith("/")
      ? pattern.substring(1)
      : pattern;

    // Exact match
    if (
      relativePath === normalizedPattern ||
      relativePath === normalizedPattern.replace(/\/$/, "")
    ) {
      return true;
    }

    // Directory match
    if (normalizedPattern.endsWith("/")) {
      const folderPattern = normalizedPattern.slice(0, -1);
      if (
        relativePath === folderPattern ||
        relativePath.startsWith(`${folderPattern}/`)
      ) {
        return true;
      }
    }
    // Non-globbing pattern
    else if (
      !normalizedPattern.includes("*") &&
      !normalizedPattern.includes("?")
    ) {
      const segments = relativePath.split("/");
      if (segments.includes(normalizedPattern)) {
        return true;
      }

      if (relativePath.startsWith(`${normalizedPattern}/`)) {
        return true;
      }
    }

    // Glob pattern matching
    if (normalizedPattern.includes("*") || normalizedPattern.includes("?")) {
      if (globMatch(relativePath, normalizedPattern)) {
        return true;
      }

      const segments = relativePath.split("/");
      const lastSegment = segments[segments.length - 1];

      // Extension pattern like *.js
      if (
        normalizedPattern.startsWith("*") &&
        normalizedPattern.includes(".")
      ) {
        if (globMatch(lastSegment, normalizedPattern)) {
          return true;
        }
      }

      // Directory wildcard pattern like dir/*
      if (normalizedPattern.endsWith("/*")) {
        const folderPrefix = normalizedPattern.slice(0, -2);
        if (relativePath.startsWith(`${folderPrefix}/`)) {
          return true;
        }
      }
    }
  }

  return false;
};

/**
 * Recursively walks through a directory and processes files
 * @param {string} dirPath - Directory path to walk
 * @param {Function} callback - Function to call for each file
 * @param {WalkDirectoryOptions} options - Options for walking
 */
export const walkDirectory = (dirPath, callback, options = {}) => {
  const { keepHidden = false, ignoreGitignore = false, gitignorePatterns = [] } = options;
  const baseDir = options.baseDir || dirPath;
  const visited = options.visited || new Set();

  let realDirPath;
  try {
    realDirPath = fs.realpathSync(dirPath);
  } catch {
    return;
  }

  if (visited.has(realDirPath)) {
    return;
  }
  visited.add(realDirPath);

  try {
    fs.readdirSync(dirPath).forEach((file) => {
      const fullPath = path.join(dirPath, file);
      
      try {
        const stat = fs.statSync(fullPath);
        const isHidden = file.startsWith(".");
        
        if (!keepHidden && isHidden) {
          return;
        }
        
        if (!ignoreGitignore && isIgnoredByGitignore(fullPath, baseDir, gitignorePatterns)) {
          return;
        }

        if (stat.isDirectory()) {
          walkDirectory(fullPath, callback, { ...options, baseDir, visited });
        } else {
          callback(fullPath);
        }
      } catch {
        // Skip files that can't be accessed
      }
    });
  } catch {
    // Skip directories that can't be accessed
  }
};

/**
 * Processes a single file and appends its content to the output file
 * @param {Object} params - Parameters for processing file
 * @param {string} params.filePath - Path to the file
 * @param {string} params.outFile - Output file path
 * @param {string} params.startMarker - Start marker template
 * @param {string} params.endMarker - End marker template
 * @param {boolean} params.isFirstFile - Whether this is the first file
 * @returns {Object} - Processing results
 */
const processFile = ({
  filePath,
  outFile,
  startMarker,
  endMarker,
  isFirstFile,
}) => {
  const result = {
    textProcessed: false,
    binary: false,
    failed: false,
    fileExt: path.extname(filePath).toLowerCase(),
  };

  const startText = startMarker.replace("{file}", filePath);
  
  if (!isFirstFile) {
    fs.appendFileSync(outFile, "\n");
  }
  
  fs.appendFileSync(outFile, `${startText}\n`);
  
  if (!isBinaryFile(filePath)) {
    try {
      const content = fs.readFileSync(filePath, "utf8");
      fs.appendFileSync(outFile, content);
      result.textProcessed = true;
    } catch {
      fs.appendFileSync(outFile, `[SKIP] Failed to read file: ${filePath}`);
      result.failed = true;
    }
  } else {
    fs.appendFileSync(outFile, `[SKIP] Binary file: ${filePath}`);
    result.binary = true;
  }
  
  fs.appendFileSync(outFile, `\n${endMarker.replace("{file}", filePath)}\n`);
  
  return result;
};

/**
 * Merges multiple files into a single output file
 * @param {MergeOptions} options - Merge options
 * @returns {MergeResult} - Result of the merge operation
 */
export const mergeFiles = (options = {}) => {
  const {
    dir = DEFAULT_CONFIG.defaultDir,
    out = DEFAULT_CONFIG.defaultOutput,
    blacklist = DEFAULT_CONFIG.defaultIgnore.split(",").map((ext) => ext.trim().toLowerCase()),
    start = DEFAULT_CONFIG.defaultStartTemplate,
    end = DEFAULT_CONFIG.defaultEndTemplate,
    keepHidden = false,
    ignoreGitignore = false,
    attachSummary = false,
  } = options;

  if (fs.existsSync(out)) {
    fs.unlinkSync(out);
  }

  const outDir = path.dirname(out);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const gitignorePatterns = ignoreGitignore ? [] : readGitignorePatterns(dir);

  const outRealPath = path.join(
    resolveRealPath(path.dirname(out)),
    path.basename(out)
  );

  let mergedCount = 0;
  let textFileCount = 0;
  let binarySkippedCount = 0;
  let failedReadCount = 0;
  let fileTypeCounts = {};
  let isFirstFile = true;
  
  const startTime = Date.now();

  walkDirectory(
    dir,
    (filePath) => {
      if (resolveRealPath(filePath) === outRealPath) {
        return;
      }
      
      const ext = path.extname(filePath).toLowerCase();
      if (blacklist.includes(ext)) {
        return;
      }
      
      mergedCount++;
      
      const result = processFile({
        filePath,
        outFile: out,
        startMarker: start,
        endMarker: end,
        isFirstFile,
      });
      
      if (result.textProcessed) {
        textFileCount++;
        fileTypeCounts[result.fileExt] = (fileTypeCounts[result.fileExt] || 0) + 1;
      }
      
      if (result.binary) binarySkippedCount++;
      if (result.failed) failedReadCount++;
      
      isFirstFile = false;
    },
    {
      keepHidden,
      ignoreGitignore,
      gitignorePatterns,
      baseDir: dir,
    }
  );

  const durationMs = Date.now() - startTime;

  const summaryText = generateSummaryText({
    mergedCount,
    textFileCount,
    binarySkippedCount,
    failedReadCount,
    fileTypeCounts,
    durationMs,
    startMarker: start,
    endMarker: end,
  });

  if (attachSummary && fs.existsSync(out)) {
    const mergedContent = fs.readFileSync(out, "utf8");
    fs.writeFileSync(out, `${summaryText}\n\n${mergedContent}`);
  }

  return {
    mergedCount,
    textFileCount,
    binarySkippedCount,
    failedReadCount,
    fileTypeCounts,
    summaryText,
    outFile: out,
    durationMs,
  };
};
