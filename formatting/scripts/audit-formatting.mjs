#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const target = path.resolve(process.argv[2] ?? ".");

const requiredFiles = [
  ".editorconfig",
  ".gitattributes",
  ".prettierignore",
  ".vscode/settings.json",
];

const optionalButExpected = [".prettierrc.json", "AGENTS.md", "package.json"];

function exists(relativePath) {
  return fs.existsSync(path.join(target, relativePath));
}

function readJson(relativePath) {
  const filePath = path.join(target, relativePath);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const missingRequired = requiredFiles.filter((file) => !exists(file));
const missingExpected = optionalButExpected.filter((file) => !exists(file));
const notes = [];

if (exists("package.json")) {
  const pkg = readJson("package.json");
  const scripts = pkg.scripts ?? {};

  for (const scriptName of ["format", "format:check"]) {
    if (!scripts[scriptName]) {
      notes.push(`package.json missing scripts.${scriptName}`);
    }
  }

  if (scripts.format?.includes("prettier") && !exists(".prettierrc.json")) {
    notes.push("format script uses Prettier but .prettierrc.json is missing");
  }

  if (scripts.format?.includes("oxfmt") && scripts.format?.includes("prettier")) {
    notes.push("format script appears to mix Oxfmt and Prettier");
  }
}

if (exists(".vscode/settings.json")) {
  const settings = readJson(".vscode/settings.json");

  if (settings["prettier.requireConfig"] !== true && settings["oxc.enable.oxfmt"] !== true) {
    notes.push("VS Code should require project Prettier config unless Oxfmt is explicitly enabled");
  }

  if (settings["oxc.enable.oxfmt"] === true && exists(".prettierrc.json")) {
    notes.push("Oxfmt is enabled while Prettier config exists; verify formatter ownership by file type");
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

if (notes.length > 0) {
  console.log("\nNotes:");
  for (const note of notes) console.log(`- ${note}`);
}

if (missingRequired.length === 0 && notes.length === 0) {
  console.log("\nFormatting posture looks consistent.");
}

process.exitCode = missingRequired.length > 0 ? 1 : 0;
