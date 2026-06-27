#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const formattingRoot = path.resolve(__dirname, "..");

const DEFAULT_REPOS = ["allotype", "stronk", "ledger", "entity"];
const STANDARD_FILES = [
  ".editorconfig",
  ".gitattributes",
  ".prettierrc.json",
  ".prettierignore",
  ".vscode/settings.json",
];

function parseArgs(argv) {
  const args = new Map();
  const flags = new Set();

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;

    const key = token.slice(2);
    const next = argv[i + 1];

    if (!next || next.startsWith("--")) {
      flags.add(key);
    } else {
      args.set(key, next);
      i += 1;
    }
  }

  return { args, flags };
}

function expandHome(value) {
  if (value === "~") return os.homedir();
  if (value.startsWith("~/")) return path.join(os.homedir(), value.slice(2));
  return value;
}

function copyFile(sourceRoot, targetRoot, relativePath, dryRun) {
  const source = path.join(sourceRoot, relativePath);
  const target = path.join(targetRoot, relativePath);

  if (!fs.existsSync(source)) return false;

  if (dryRun) {
    console.log(`  - would copy ${relativePath}`);
    return true;
  }

  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
  console.log(`  - copied ${relativePath}`);
  return true;
}

function extractAgentFormattingSection(agentText) {
  const match = agentText.match(/```md\n([\s\S]*?)\n```/);
  return match ? match[1].trim() : agentText.trim();
}

function mergeAgentInstructions(targetRoot, dryRun) {
  const source = path.join(formattingRoot, "agent-instructions.md");
  const target = path.join(targetRoot, "AGENTS.md");

  if (!fs.existsSync(source)) return;

  const section = extractAgentFormattingSection(fs.readFileSync(source, "utf8"));

  if (!fs.existsSync(target)) {
    if (dryRun) {
      console.log("  - would create AGENTS.md with Formatting section");
    } else {
      fs.writeFileSync(target, `# Agent Instructions\n\n${section}\n`);
      console.log("  - created AGENTS.md with Formatting section");
    }
    return;
  }

  const current = fs.readFileSync(target, "utf8");
  if (current.includes("## Formatting")) {
    console.log("  - AGENTS.md already has Formatting section");
    return;
  }

  if (dryRun) {
    console.log("  - would append Formatting section to AGENTS.md");
  } else {
    fs.writeFileSync(target, `${current.trim()}\n\n${section}\n`);
    console.log("  - appended Formatting section to AGENTS.md");
  }
}

function updatePackageJson(targetRoot, variant, dryRun) {
  const packagePath = path.join(targetRoot, "package.json");
  if (!fs.existsSync(packagePath)) {
    console.log("  - no package.json; skipped package scripts");
    return;
  }

  const before = fs.readFileSync(packagePath, "utf8");
  const pkg = JSON.parse(before);
  pkg.scripts ??= {};
  pkg.devDependencies ??= {};

  const existingLint = Boolean(pkg.scripts.lint);
  const lintScript = existingLint ? "lint:formatting" : "lint";
  const lintFixScript = existingLint ? "lint:formatting:fix" : "lint:fix";

  pkg.scripts.format ??= "prettier --write .";
  pkg.scripts["format:check"] ??= "prettier --check .";

  if (variant === "oxc-ready") {
    pkg.scripts[lintScript] ??= "oxlint .";
    pkg.scripts[lintFixScript] ??= "oxlint . --fix";
    pkg.scripts.check ??= `pnpm format:check && pnpm ${lintScript}`;
    pkg.devDependencies.prettier ??= "latest";
    pkg.devDependencies.oxlint ??= "latest";
  } else {
    pkg.scripts.check ??= "pnpm format:check";
    pkg.devDependencies.prettier ??= "latest";
  }

  const after = `${JSON.stringify(pkg, null, 2)}\n`;

  if (after === before) {
    console.log("  - package.json already compatible");
    return;
  }

  if (dryRun) {
    console.log("  - would update package.json scripts/devDependencies");
  } else {
    fs.writeFileSync(packagePath, after);
    console.log("  - updated package.json scripts/devDependencies");
  }
}

function rolloutRepo({ baseDir, repo, variant, dryRun }) {
  const targetRoot = path.join(baseDir, repo);
  const sourceRoot = path.join(formattingRoot, "baseline", variant);

  console.log(`\n== ${repo} ==`);

  if (!fs.existsSync(targetRoot)) {
    console.log(`  - skipped: missing ${targetRoot}`);
    return;
  }

  if (!fs.existsSync(sourceRoot)) {
    console.log(`  - skipped: unknown variant ${variant}`);
    return;
  }

  for (const relativePath of STANDARD_FILES) {
    copyFile(sourceRoot, targetRoot, relativePath, dryRun);
  }

  mergeAgentInstructions(targetRoot, dryRun);
  updatePackageJson(targetRoot, variant, dryRun);
}

const { args, flags } = parseArgs(process.argv.slice(2));
const repos = (args.get("repos") ?? DEFAULT_REPOS.join(","))
  .split(",")
  .map((repo) => repo.trim())
  .filter(Boolean);

const config = {
  baseDir: path.resolve(expandHome(args.get("base-dir") ?? "~/GitHub")),
  variant: args.get("variant") ?? "oxc-ready",
  dryRun: flags.has("dry-run"),
};

console.log("Local formatting standard rollout");
console.log(`- base dir: ${config.baseDir}`);
console.log(`- repos: ${repos.join(", ")}`);
console.log(`- variant: ${config.variant}`);
console.log(`- dry run: ${config.dryRun ? "yes" : "no"}`);

for (const repo of repos) {
  rolloutRepo({ ...config, repo });
}

console.log("\nNext steps per repo:");
console.log("1. Review git diff.");
console.log("2. Run pnpm install if package.json changed.");
console.log("3. Run pnpm format:check and pnpm lint or pnpm lint:formatting.");
console.log("4. Commit as: chore: add formatting standard.");
