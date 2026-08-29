import { access, readdir, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { extname, join, relative, resolve, sep } from "node:path";

const buildRoot = resolve(".next");
const scanRoots = [join(buildRoot, "server"), join(buildRoot, "standalone")];
const textExtensions = new Set([".js", ".mjs", ".cjs", ".json", ".map", ".html"]);
const forbiddenLiterals = [
  "Anaya Rao",
  "HZN-2026-0142",
  "Northstar Community College",
  "Meera Rao",
  "INR 480,000",
  "INR 540,000",
  "tests/goldens",
  "scripts/generate-fixtures",
];

async function exists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function filesBelow(directory) {
  if (!(await exists(directory))) return [];
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    if (entry.name === "node_modules" || entry.name === "fixtures") continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await filesBelow(path)));
    else if (entry.isFile() && textExtensions.has(extname(entry.name))) files.push(path);
  }
  return files;
}

if (!(await exists(buildRoot))) {
  throw new Error("Missing .next build output; run the production build first.");
}

const findings = [];
const files = (await Promise.all(scanRoots.map(filesBelow))).flat();
for (const file of files) {
  const source = await readFile(file, "utf8");
  for (const literal of forbiddenLiterals) {
    if (source.includes(literal)) {
      findings.push(
        `${relative(process.cwd(), file).split(sep).join("/")} contains ${JSON.stringify(literal)}`,
      );
    }
  }
}

if (files.length === 0) findings.push("No production server output was available to scan.");
if (findings.length > 0) {
  process.stderr.write(`${findings.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    `Built anti-hardcode scan: PASS (${files.length} production text artifacts).\n`,
  );
}
