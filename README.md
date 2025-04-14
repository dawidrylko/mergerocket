# 🚀 Mergerocket

**Mergerocket** is a fast CLI tool for merging text file contents from a given directory. It scans directories recursively, concatenates the contents of text files while ignoring binary files (and optionally files excluded by .gitignore), and inserts customizable start and end markers around each file's content. With additional options like keeping hidden files and appending a detailed summary, **Mergerocket** is perfect for developers and testers who need to aggregate file contents quickly and efficiently.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/npm/v/mergerocket.svg)](https://www.npmjs.com/package/mergerocket)

## ✨ Features

- **Fast File Merging:** Quickly merge text file contents from a directory while skipping binary files.
- **Customizable Markers:** Define your own start and end markers (with a `{file}` placeholder) to separate contents from different files.
- **Selective Merging:** Exclude files based on extension (e.g. `.png`, `.jpg`, etc.) via a configurable blacklist.
- **Gitignore Integration:** Optionally respect a directory's `.gitignore` file to avoid merging ignored files.
- **Hidden Files Option:** Toggle inclusion of hidden files with a simple flag.
- **Comprehensive Summary Report:** Generate a summary with details such as execution duration, file counts, and file type statistics.
- **Flexible Input/Output:** Specify the base directory to search and the output file name for the merged result.

## 📥 Installation

You can install **Mergerocket** using your favorite package manager: npm, Yarn, or pnpm.

### Global Installation

- **Using npm:**

  ```bash
  npm install -g mergerocket
  ```

- **Using Yarn:**

  ```bash
  yarn global add mergerocket
  ```

- **Using pnpm:**

  ```bash
  pnpm install -g mergerocket
  ```

### Local Installation (Development Dependency)

- **Using npm:**

  ```bash
  npm install --save-dev mergerocket
  ```

- **Using Yarn:**

  ```bash
  yarn add --dev mergerocket
  ```

- **Using pnpm:**

  ```bash
  pnpm add -D mergerocket
  ```

## 💻 Usage

Run **mergerocket** from the command line with the following syntax:

```bash
mergerocket [OPTIONS]
```

By default, if no additional parameters are supplied, it merges the contents of text files from the current directory into a file named similar to `merged_<timestamp>.txt`.

### Command-line Arguments

- **`--dir`, `-d`**:  
  Specify the base directory from which to start merging files.  
  _Default:_ Current directory (`.`).

- **`--out`, `-o`**:  
  Define the output file where merged content will be saved.  
  _Default:_ `merged_<timestamp>.txt`.

- **`--blacklist`**:  
  Provide a comma-separated list of file extensions to ignore (e.g., `.png,.jpg,.zip,...`).  
  _Default:_ `.png,.jpg,.jpeg,.gif,.bmp,.ico,.zip,.gz,.tar,.rar,.exe`.

- **`--start`**:  
  Customize the start marker that will be inserted before each file's content. Use the `{file}` placeholder for dynamic file path info.  
  _Default:_ `--- START: {file} ---`.

- **`--end`**:  
  Customize the end marker that will be appended after each file's content. Use the `{file}` placeholder for dynamic file path info.  
  _Default:_ `--- END: {file} ---`.

- **`--keep-hidden`**:  
  Include hidden files (files beginning with a dot) in the merge process.

- **`--ignore-gitignore`**:  
  Ignore the `.gitignore` file (if present) so that files excluded by Git are merged anyway.

- **`--attach-summary`**:  
  Append a summary report to the merged file which includes execution date, duration, and counts of processed files, text files merged, binary files skipped, and more.

### Examples

#### 1. Basic Merge from the Current Directory

Merge all eligible text files in the current directory using default settings:

```bash
mergerocket
```

#### 2. Specify Source Directory (--dir, -d)

Merge files from the `src` directory:

```bash
mergerocket --dir src
# or using the short option:
mergerocket -d src
```

#### 3. Specify Output File (--out, -o)

Save the merged content to a specific file:

```bash
mergerocket --out merged_output.txt
# or using the short option:
mergerocket -o merged_output.txt
```

#### 4. Customize File Extension Blacklist (--blacklist)

Add additional file extensions to skip during merging:

```bash
mergerocket --blacklist ".png,.jpg,.pdf,.docx,.mp3,.mp4"
```

#### 5. Customize Markers (--start, --end)

Set custom start and end markers for each file:

```bash
mergerocket --start "/** BEGIN FILE: {file} **/" --end "/** END FILE: {file} **/"
```

#### 6. Include Hidden Files (--keep-hidden)

Include files that start with a dot (hidden files):

```bash
mergerocket --keep-hidden
```

#### 7. Ignore Gitignore Rules (--ignore-gitignore)

Process all files even if they are excluded in .gitignore:

```bash
mergerocket --ignore-gitignore
```

#### 8. Add Summary Report (--attach-summary)

Add a comprehensive summary at the beginning of the output file:

```bash
mergerocket --attach-summary
```

#### 9. Combine Multiple Options

You can combine multiple options for a more tailored experience:

```bash
mergerocket --dir src --out code_bundle.txt --keep-hidden --attach-summary
```

```bash
mergerocket -d src/frontend -o frontend_bundle.txt --blacklist ".test.js,.spec.js,.d.ts" --start "// BEGIN {file}" --end "// END {file}"
```

## 📜 License

This project is licensed under the MIT License – see the [LICENSE](./LICENSE) file for details.

## 👨‍💻 Author

Developed and maintained by [Dawid Ryłko](https://dawidrylko.com).
