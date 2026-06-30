#!/usr/bin/env node
import childProcess from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const target = path.resolve(process.argv[2] ?? ".");
const targetRealPath = fs.realpathSync(target);

const requiredFiles = [
  ".editorconfig",
  ".gitattributes",
  ".prettierignore",
  ".vscode/settings.json",
];

const optionalButExpected = [".prettierrc.json", "AGENTS.md", "package.json"];
const formatterConfigFiles = [
  ".prettierrc",
  ".prettierrc.json",
  ".prettierrc.yaml",
  ".prettierrc.yml",
  ".prettierrc.js",
  ".prettierrc.cjs",
  ".prettierrc.mjs",
  "prettier.config.js",
  "prettier.config.cjs",
  "prettier.config.mjs",
  "biome.json",
  "biome.jsonc",
  "dprint.json",
  "deno.json",
  "deno.jsonc",
];
const sourceExtensions = new Set([
  ".astro",
  ".cjs",
  ".css",
  ".cts",
  ".html",
  ".js",
  ".jsx",
  ".json",
  ".jsonc",
  ".md",
  ".mjs",
  ".mts",
  ".scss",
  ".svelte",
  ".ts",
  ".tsx",
  ".vue",
  ".yaml",
  ".yml",
]);
const jsTsExtensions = new Set([
  ".astro",
  ".cjs",
  ".cts",
  ".js",
  ".jsx",
  ".mjs",
  ".mts",
  ".svelte",
  ".ts",
  ".tsx",
  ".vue",
]);
const ignoredDirectories = new Set([
  ".git",
  ".next",
  ".nuxt",
  ".output",
  ".pnpm-store",
  ".svelte-kit",
  ".turbo",
  ".vite",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "out",
]);

function exists(relativePath) {
  return fs.existsSync(path.join(target, relativePath));
}

function readJson(relativePath) {
  const filePath = path.join(target, relativePath);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function isSourceFile(relativePath) {
  return sourceExtensions.has(path.extname(relativePath));
}

function isJsTsFile(relativePath) {
  return jsTsExtensions.has(path.extname(relativePath));
}

function walkFiles(directory, relativeBase = "") {
  if (!fs.existsSync(directory)) return [];

  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.isSymbolicLink()) continue;

    const relativePath = path.join(relativeBase, entry.name);
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        files.push(...walkFiles(absolutePath, relativePath));
      }
      continue;
    }

    if (entry.isFile()) files.push(relativePath);
  }

  return files;
}

function getIndentStats(content) {
  const stats = { tabIndented: 0, spaceIndented: 0, mixedPrefix: 0 };

  for (const line of content.split(/\r?\n/)) {
    if (/^[ \t]+\S/.test(line)) {
      const prefix = line.match(/^[ \t]+/)?.[0] ?? "";
      if (prefix.includes("\t") && prefix.includes(" ")) stats.mixedPrefix += 1;
      else if (prefix.includes("\t")) stats.tabIndented += 1;
      else stats.spaceIndented += 1;
    }
  }

  return stats;
}

function hasMeaningfulIndent(stats) {
  return stats.tabIndented > 0 || stats.spaceIndented > 0 || stats.mixedPrefix > 0;
}

function hasMixedIndent(stats) {
  return stats.mixedPrefix > 0 || (stats.tabIndented > 0 && stats.spaceIndented > 0);
}

function formatStats(stats) {
  return `tabs=${stats.tabIndented} spaces=${stats.spaceIndented} mixed-prefix=${stats.mixedPrefix}`;
}

function git(args) {
  return childProcess.execFileSync("git", ["-C", target, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
}

function getGitWorktreeRoot() {
  try {
    return git(["rev-parse", "--show-toplevel"]).trim();
  } catch {
    return null;
  }
}

function getChangedFiles() {
  const root = getGitWorktreeRoot();
  if (!root) return [];
  const rootRealPath = fs.realpathSync(root);

  const lines = new Set();
  for (const args of [
    ["diff", "--name-only", "--diff-filter=ACMRT"],
    ["diff", "--cached", "--name-only", "--diff-filter=ACMRT"],
  ]) {
    for (const line of git(args).split(/\r?\n/)) {
      if (line.trim()) lines.add(line.trim());
    }
  }

  return [...lines].filter((file) => {
    const absolutePath = path.join(rootRealPath, file);
    const relativeToTarget = path.relative(targetRealPath, absolutePath);
    return !relativeToTarget.startsWith("..") && !path.isAbsolute(relativeToTarget);
  });
}

function getHeadContent(relativePath) {
  try {
    return git(["show", `HEAD:${relativePath}`]);
  } catch {
    return null;
  }
}

const missingRequired = requiredFiles.filter((file) => !exists(file));
const missingExpected = optionalButExpected.filter((file) => !exists(file));
const notes = [];
const findings = [];
const files = walkFiles(target);
const sourceFiles = files.filter(isSourceFile);
const jsTsFiles = files.filter(isJsTsFile);
const hasFormatterConfig = formatterConfigFiles.some((file) => exists(file));

if (exists("package.json")) {
  const pkg = readJson("package.json");
  const scripts = pkg.scripts ?? {};

  for (const scriptName of ["format", "format:check"]) {
    if (!scripts[scriptName]) {
      notes.push(`package.json missing scripts.${scriptName}`);
    }
  }

  if (scripts.format?.includes("prettier") && !exists(".prettierrc.json")) {
    findings.push("format script uses Prettier but .prettierrc.json is missing");
  }

  if (scripts.format?.includes("oxfmt") && scripts.format?.includes("prettier")) {
    findings.push("format script appears to mix Oxfmt and Prettier");
  }
}

if (jsTsFiles.length > 0 && !hasFormatterConfig) {
  findings.push(
    "JS/TS-like files found but no checked-in formatter config was found; add Stage 1 baseline before agent formatting",
  );
}

if (exists(".vscode/settings.json")) {
  const settings = readJson(".vscode/settings.json");

  if (settings["prettier.requireConfig"] !== true && settings["oxc.enable.oxfmt"] !== true) {
    notes.push("VS Code should require project Prettier config unless Oxfmt is explicitly enabled");
  }

  if (settings["oxc.enable.oxfmt"] === true && exists(".prettierrc.json")) {
    notes.push(
      "Oxfmt is enabled while Prettier config exists; verify formatter ownership by file type",
    );
  }
}

const mixedIndentFiles = [];
for (const file of sourceFiles) {
  const stats = getIndentStats(fs.readFileSync(path.join(target, file), "utf8"));
  if (hasMixedIndent(stats)) mixedIndentFiles.push({ file, stats });
}

const indentChurnFiles = [];
for (const file of getChangedFiles().filter(isSourceFile)) {
  const workingPath = path.join(getGitWorktreeRoot() ?? target, file);
  if (!fs.existsSync(workingPath)) continue;

  const headContent = getHeadContent(file);
  if (headContent === null) continue;

  const headStats = getIndentStats(headContent);
  const workingStats = getIndentStats(fs.readFileSync(workingPath, "utf8"));

  if (!hasMeaningfulIndent(headStats) && !hasMeaningfulIndent(workingStats)) continue;

  const tabsIntroduced = headStats.tabIndented === 0 && workingStats.tabIndented > 0;
  const mixedPrefixesIntroduced = headStats.mixedPrefix === 0 && workingStats.mixedPrefix > 0;
  const spacesReplacedByTabs =
    headStats.spaceIndented > 0 && workingStats.spaceIndented === 0 && workingStats.tabIndented > 0;

  if (tabsIntroduced || mixedPrefixesIntroduced || spacesReplacedByTabs) {
    indentChurnFiles.push({ file, headStats, workingStats });
  }
}

console.log(`Formatting audit: ${target}`);

if (missingRequired.length > 0) {
  console.log("\nMissing required files:");
  for (const file of missingRequired) console.log(`- ${file}`);
}

if (missingExpected.length > 0) {
  console.log("\nMissing expected files:");
  for (const file of missingExpected) console.log(`- ${file}`);
}

if (findings.length > 0) {
  console.log("\nFindings:");
  for (const finding of findings) console.log(`- ${finding}`);
}

if (mixedIndentFiles.length > 0) {
  console.log("\nFiles with mixed leading tabs/spaces:");
  for (const { file, stats } of mixedIndentFiles) console.log(`- ${file} (${formatStats(stats)})`);
}

if (indentChurnFiles.length > 0) {
  console.log("\nChanged files with indentation churn versus HEAD:");
  for (const { file, headStats, workingStats } of indentChurnFiles) {
    console.log(
      `- ${file}: HEAD ${formatStats(headStats)} -> worktree ${formatStats(workingStats)}`,
    );
  }
}

if (notes.length > 0) {
  console.log("\nNotes:");
  for (const note of notes) console.log(`- ${note}`);
}

if (
  missingRequired.length === 0 &&
  findings.length === 0 &&
  mixedIndentFiles.length === 0 &&
  indentChurnFiles.length === 0 &&
  notes.length === 0
) {
  console.log("\nFormatting posture looks consistent.");
}

process.exitCode =
  missingRequired.length > 0 ||
  findings.length > 0 ||
  mixedIndentFiles.length > 0 ||
  indentChurnFiles.length > 0
    ? 1
    : 0;
