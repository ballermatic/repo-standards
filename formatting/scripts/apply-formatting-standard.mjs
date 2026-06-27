#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const variantIndex = args.indexOf("--variant");
const targetIndex = args.indexOf("--target");
const dryRun = args.includes("--dry-run");

const variant = variantIndex >= 0 ? args[variantIndex + 1] : "oxc-ready";
const target = path.resolve(targetIndex >= 0 ? args[targetIndex + 1] : ".");
const source = path.resolve(__dirname, "..", "baseline", variant);

if (!fs.existsSync(source)) {
  console.error(`Unknown formatting baseline variant: ${variant}`);
  process.exit(1);
}

const files = [
  ".editorconfig",
  ".gitattributes",
  ".prettierrc.json",
  ".prettierignore",
  ".vscode/settings.json",
];

for (const file of files) {
  const from = path.join(source, file);
  const to = path.join(target, file);

  if (!fs.existsSync(from)) continue;

  if (dryRun) {
    console.log(`Would copy ${file}`);
    continue;
  }

  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  console.log(`Copied ${file}`);
}

const agentSource = path.resolve(__dirname, "..", "agent-instructions.md");
const agentTarget = path.join(target, "AGENTS.formatting.md");

if (fs.existsSync(agentSource)) {
  if (dryRun) {
    console.log("Would copy AGENTS.formatting.md");
  } else {
    fs.copyFileSync(agentSource, agentTarget);
    console.log("Copied AGENTS.formatting.md");
  }
}

console.log(dryRun ? "Dry run complete." : "Formatting standard applied.");
