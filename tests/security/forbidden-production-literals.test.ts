import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative, resolve } from "node:path";
import test from "node:test";

const sourceRoot = resolve("src");
const extensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

const fixtureDerivedLiterals = [
  "Anaya Rao",
  "HZN-2026-0142",
  "Northstar Community College",
  "Meera Rao",
  "INR 480,000",
  "INR 540,000",
  "480000",
  "540000",
] as const;

const forbiddenImportFragments = [
  "tests/goldens",
  "scripts/generate-fixtures",
  "from \"pdf-lib\"",
  "from 'pdf-lib'",
] as const;

async function filesBelow(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await filesBelow(path)));
    else if (entry.isFile() && extensions.has(extname(entry.name))) files.push(path);
  }
  return files;
}

test("production source contains no fixture-derived applicant answer", async () => {
  const findings: string[] = [];
  for (const path of await filesBelow(sourceRoot)) {
    const source = await readFile(path, "utf8");
    for (const literal of fixtureDerivedLiterals) {
      if (source.includes(literal)) {
        findings.push(`${relative(process.cwd(), path)} contains ${JSON.stringify(literal)}`);
      }
    }
  }
  assert.deepEqual(findings, []);
});

test("production source cannot import goldens, fixture generator, or pdf-lib", async () => {
  const findings: string[] = [];
  for (const path of await filesBelow(sourceRoot)) {
    const source = await readFile(path, "utf8");
    for (const fragment of forbiddenImportFragments) {
      if (source.includes(fragment)) {
        findings.push(`${relative(process.cwd(), path)} contains ${JSON.stringify(fragment)}`);
      }
    }
  }
  assert.deepEqual(findings, []);
});
