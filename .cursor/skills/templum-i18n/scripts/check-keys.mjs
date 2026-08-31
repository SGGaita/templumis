#!/usr/bin/env node
/**
 * Compare nested keys of every TemplumIS locale file against en.js.
 * Usage (repo root): node .cursor/skills/templum-i18n/scripts/check-keys.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const LOCALES = [
  "en",
  "sw",
  "ar",
  "fr",
  "pt",
  "es",
  "id",
  "ms",
  "hi",
  "zh",
  "th",
  "lo",
  "my",
  "ko",
  "vi",
];

function findLocaleDir(start) {
  let dir = start;
  for (let i = 0; i < 10; i++) {
    const candidate = path.join(dir, "frontend", "src", "lib", "i18n");
    if (fs.existsSync(path.join(candidate, "en.js"))) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("Could not find frontend/src/lib/i18n (run from the templumIS repo).");
}

function loadLocale(filePath, code) {
  let src = fs.readFileSync(filePath, "utf8");
  src = src.replace(/^\s*import\s+.*$/gm, "");
  src = src.replace(/export\s+default\s+\w+\s*;?\s*$/m, "");
  const fn = new Function(`${src}\nreturn ${code};`);
  return fn();
}

function flatten(value, prefix = "") {
  const out = [];
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    for (const [k, v] of Object.entries(value)) {
      const next = prefix ? `${prefix}.${k}` : k;
      out.push(...flatten(v, next));
    }
    return out;
  }
  if (Array.isArray(value)) {
    value.forEach((item, i) => {
      out.push(...flatten(item, `${prefix}[${i}]`));
    });
    return out;
  }
  out.push(prefix);
  return out;
}

const localeDir = findLocaleDir(__dirname);
const trees = {};

for (const code of LOCALES) {
  const filePath = path.join(localeDir, `${code}.js`);
  if (!fs.existsSync(filePath)) {
    console.error(`Missing locale file: ${filePath}`);
    process.exit(1);
  }
  try {
    trees[code] = loadLocale(filePath, code);
  } catch (err) {
    console.error(`Failed to parse ${code}.js: ${err.message}`);
    process.exit(1);
  }
}

const enKeys = new Set(flatten(trees.en));
let failed = false;

for (const code of LOCALES) {
  if (code === "en") continue;
  const keys = new Set(flatten(trees[code]));
  const missing = [...enKeys].filter((k) => !keys.has(k));
  const extra = [...keys].filter((k) => !enKeys.has(k));

  if (missing.length || extra.length) {
    failed = true;
    console.error(`\n[${code}] key mismatch vs en.js`);
    if (missing.length) {
      console.error(`  missing (${missing.length}):`);
      missing.slice(0, 40).forEach((k) => console.error(`    - ${k}`));
      if (missing.length > 40) console.error(`    … ${missing.length - 40} more`);
    }
    if (extra.length) {
      console.error(`  extra (${extra.length}):`);
      extra.slice(0, 40).forEach((k) => console.error(`    + ${k}`));
      if (extra.length > 40) console.error(`    … ${extra.length - 40} more`);
    }
  }
}

if (failed) {
  console.error("\nLocale key trees must match en.js. Add the missing keys, then re-run.");
  process.exit(1);
}

console.log(`OK: ${enKeys.size} keys match across ${LOCALES.length} locales.`);
