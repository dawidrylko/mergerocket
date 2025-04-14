import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testDataDir = path.join(__dirname, "test-data");
const outputDir = path.join(__dirname, "output");

function removeDirectoryRecursive(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach((file) => {
      const curPath = path.join(dirPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        removeDirectoryRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(dirPath);
  }
}

export function setupTestEnvironment() {
  cleanupTestEnvironment();

  fs.mkdirSync(testDataDir, { recursive: true });
  fs.mkdirSync(outputDir, { recursive: true });

  fs.writeFileSync(
    path.join(testDataDir, "file1.txt"),
    "This is file 1 content"
  );
  fs.writeFileSync(
    path.join(testDataDir, "file2.js"),
    'console.log("This is file 2 content");'
  );

  fs.writeFileSync(
    path.join(testDataDir, ".gitignore"),
    "ignore-me.txt\n# This is a comment\n*.ignored"
  );

  fs.writeFileSync(
    path.join(testDataDir, "ignore-me.txt"),
    "This should be ignored by gitignore"
  );

  fs.writeFileSync(
    path.join(testDataDir, "test.ignored"),
    "This should also be ignored"
  );

  fs.writeFileSync(
    path.join(testDataDir, ".hidden.txt"),
    "This is a hidden file"
  );

  const nestedDir = path.join(testDataDir, "nested");
  fs.mkdirSync(nestedDir, { recursive: true });
  fs.writeFileSync(
    path.join(nestedDir, "nested-file.txt"),
    "This is a nested file"
  );
  fs.writeFileSync(
    path.join(nestedDir, ".hidden-nested.txt"),
    "This is a hidden nested file"
  );

  const binaryFilePath = path.join(testDataDir, "binary.bin");
  const buffer = Buffer.alloc(10);
  buffer[5] = 0;
  fs.writeFileSync(binaryFilePath, buffer);

  const restrictedDir = path.join(testDataDir, "restricted");
  fs.mkdirSync(restrictedDir, { recursive: true });
}

export function cleanupTestEnvironment() {
  try {
    if (fs.existsSync(testDataDir)) {
      removeDirectoryRecursive(testDataDir);
    }
    if (fs.existsSync(outputDir)) {
      removeDirectoryRecursive(outputDir);
    }
  } catch (err) {
    console.error("Error during cleanup:", err);
  }
}

export { testDataDir, outputDir };
