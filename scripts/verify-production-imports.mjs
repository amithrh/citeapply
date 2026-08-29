import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const sourceRoot = join(projectRoot, "src");
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const forbiddenPackages = new Set([
  "@axe-core/playwright",
  "@playwright/test",
  "fast-check",
  "pdf-lib",
  "node:test",
]);
const forbiddenPathFragments = [
  "/tests/",
  "/tests/goldens/",
  "/goldens/",
  "/scripts/generate-fixtures",
  "/fixtures/",
];

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await listFiles(path)));
    else if (entry.isFile() && sourceExtensions.has(extname(entry.name))) files.push(path);
  }
  return files;
}

function importSpecifiers(source) {
  const matches = [];
  const patterns = [
    /(?:import|export)\s+(?:[^"']*?\sfrom\s*)?["']([^"']+)["']/gu,
    /import\(\s*["']([^"']+)["']\s*\)/gu,
    /require\(\s*["']([^"']+)["']\s*\)/gu,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) matches.push(match[1]);
  }
  return matches.filter((value) => typeof value === "string");
}

function normalizeProjectSpecifier(sourcePath, specifier) {
  if (specifier.startsWith(".")) {
    return `/${relative(projectRoot, resolve(sourcePath, "..", specifier)).split(sep).join("/")}`;
  }
  return specifier;
}

const findings = [];
const files = await listFiles(sourceRoot);
for (const file of files) {
  const source = await readFile(file, "utf8");
  const displayPath = relative(projectRoot, file).split(sep).join("/");
  for (const specifier of importSpecifiers(source)) {
    const normalized = normalizeProjectSpecifier(file, specifier);
    const packageName = normalized.startsWith("@")
      ? normalized.split("/").slice(0, 2).join("/")
      : normalized.split("/")[0];
    if (forbiddenPackages.has(packageName)) {
      findings.push(`${displayPath}: forbidden production package import ${specifier}`);
    }
    if (forbiddenPathFragments.some((fragment) => normalized.includes(fragment))) {
      findings.push(`${displayPath}: forbidden production path import ${specifier}`);
    }
  }
}

if (findings.length > 0) {
  process.stderr.write(`${findings.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    `Production import boundary: PASS (${files.length} source files, no test/golden/generator/fixture/dev-only imports).\n`,
  );
}
