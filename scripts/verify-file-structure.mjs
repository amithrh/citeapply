import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { access, readdir, readFile } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";

const projectRoot = process.cwd();
const canonicalPath = resolve("docs/hackathon-build/file-producers.json");
const runtimePath = resolve("tests/contract/file-structure-producers.json");
const frozenContractsPath = resolve("tests/contract/frozen-contract-hashes.json");

const FROZEN_CONTRACT_SCHEMA = "citeapply-frozen-contract-hashes-v2";
const FROZEN_CONTRACT_GATE = "W0-CONTRACTS";
const DIGEST_ALGORITHM = "SHA-256";
const CONTRACT_SET_DOMAIN = "citeapply-w0-contracts-v1";
const ERRATUM_SET_DOMAIN = "citeapply-w0-erratum-proof-v1";
const LOCKED_PRODUCER_SHA256 =
  "42f69d1d0ac8ca8b0eebefe229cd42f36e12cfd078cb8663ea0a52db2b2905a6";
const EXPECTED_RUNTIME = Object.freeze({
  node: "24.20.0",
  npm: "11.19.0",
  typescript: "6.0.3",
  zod: "4.4.3",
});
const CONTRACT_PATHS = Object.freeze([
  "src/contracts/common.ts",
  "src/contracts/outcomes.ts",
  "src/contracts/http.ts",
  "src/contracts/webmcp.ts",
  "tests/contract/webmcp.schema.json",
]);
const ERRATUM_PROOF_PATHS = Object.freeze([
  "scripts/verify-file-structure.mjs",
  "src/server/observability/safe-events.ts",
  "src/ui/components/consent.tsx",
  "tests/accessibility/consent-kernel.test.ts",
  "tests/contract/http-contract.test.ts",
  "tests/security/safe-events.test.ts",
]);
const PRODUCER_MANIFEST_PATH = "tests/contract/file-structure-producers.json";
const HASH_PATTERN = /^[0-9a-f]{64}$/u;
const PATH_PATTERN = /[{}*?\[\]]/u;
const NUL = Buffer.from([0]);
const LF = Buffer.from([0x0a]);

function parseCli(rawArguments) {
  let contractsOnly = false;
  let surfaceOnly = false;
  let requestedGate;

  for (let index = 0; index < rawArguments.length; index += 1) {
    const argument = rawArguments[index];
    if (argument === "--contracts-only") {
      if (contractsOnly) throw new Error("Duplicate --contracts-only mode.");
      contractsOnly = true;
      continue;
    }
    if (argument === "--surfaces") {
      if (surfaceOnly) throw new Error("Duplicate --surfaces mode.");
      surfaceOnly = true;
      continue;
    }
    if (argument === "--gate") {
      if (requestedGate !== undefined) throw new Error("Duplicate --gate argument.");
      const value = rawArguments[index + 1];
      if (value === undefined || value.length === 0 || value.startsWith("--")) {
        throw new Error("--gate requires exactly one value.");
      }
      requestedGate = value;
      index += 1;
      continue;
    }
    if (argument.startsWith("--gate=")) {
      if (requestedGate !== undefined) throw new Error("Duplicate --gate argument.");
      const value = argument.slice("--gate=".length);
      if (value.length === 0) throw new Error("--gate requires exactly one value.");
      requestedGate = value;
      continue;
    }
    throw new Error(`Unknown verifier argument: ${argument}`);
  }

  if (contractsOnly && (surfaceOnly || requestedGate !== undefined)) {
    throw new Error("--contracts-only is exclusive and cannot be combined with --surfaces or --gate.");
  }

  return { contractsOnly, requestedGate, surfaceOnly };
}

async function exists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function parseJsonObject(bytes, label) {
  let value;
  try {
    value = JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`${label} is not valid JSON.`, { cause: error });
  }
  if (!isRecord(value)) throw new Error(`${label} must contain one JSON object.`);
  return value;
}

function parseCanonicalJsonObject(bytes, label) {
  const value = parseJsonObject(bytes, label);
  const canonicalBytes = Buffer.from(`${JSON.stringify(value, null, 2)}\n`, "utf8");
  if (!bytes.equals(canonicalBytes)) {
    throw new Error(`${label} is not canonical two-space JSON with one final newline.`);
  }
  return value;
}

function assertExactKeys(value, expectedKeys, label) {
  if (!isRecord(value)) throw new Error(`${label} must be an object.`);
  const actualKeys = Object.keys(value);
  if (JSON.stringify(actualKeys) !== JSON.stringify(expectedKeys)) {
    throw new Error(`${label} key set or key order drift.`);
  }
}

function assertHash(value, label) {
  if (typeof value !== "string" || !HASH_PATTERN.test(value)) {
    throw new Error(`${label} must be one lowercase 64-character SHA-256 value.`);
  }
}

function assertByteLength(value, label) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${label} must be one positive safe integer.`);
  }
}

function setDigestDescription(domain) {
  return `UTF8(${domain}) || 0x00 || for each listed file: UTF8(path) || 0x00 || UTF8(sha256) || 0x00 || UTF8(byteLength) || 0x0a`;
}

function orderedSetDigest(domain, members) {
  const chunks = [Buffer.from(domain, "utf8"), NUL];
  for (const member of members) {
    chunks.push(
      Buffer.from(member.path, "utf8"),
      NUL,
      Buffer.from(member.sha256, "utf8"),
      NUL,
      Buffer.from(String(member.bytes), "utf8"),
      LF,
    );
  }
  return sha256(Buffer.concat(chunks));
}

function validateMemberRows(rows, expectedPaths, label) {
  if (!Array.isArray(rows) || rows.length !== expectedPaths.length) {
    throw new Error(`${label} member cardinality drift: expected ${expectedPaths.length}.`);
  }

  const seenPaths = new Set();
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    assertExactKeys(row, ["path", "sha256", "bytes"], `${label} member ${index}`);
    if (typeof row.path !== "string") throw new Error(`${label} member path must be a string.`);
    if (seenPaths.has(row.path)) throw new Error(`${label} contains a duplicate member: ${row.path}`);
    seenPaths.add(row.path);
    if (row.path !== expectedPaths[index]) {
      throw new Error(
        `${label} member order drift at index ${index}: expected ${expectedPaths[index]}, received ${row.path}`,
      );
    }
    assertHash(row.sha256, `${label} member SHA-256: ${row.path}`);
    assertByteLength(row.bytes, `${label} member byte length: ${row.path}`);
  }
}

async function readActualMembers(expectedPaths, label) {
  const members = [];
  for (const path of expectedPaths) {
    let bytes;
    try {
      bytes = await readFile(resolve(path));
    } catch (error) {
      throw new Error(`${label} member is unavailable: ${path}`, { cause: error });
    }
    members.push({ path, sha256: sha256(bytes), bytes: bytes.length });
  }
  return members;
}

async function verifyMemberClosure({ declaredDigest, domain, expectedPaths, label, rows }) {
  validateMemberRows(rows, expectedPaths, label);
  assertHash(declaredDigest, `${label} set SHA-256`);

  const actualMembers = await readActualMembers(expectedPaths, label);
  for (let index = 0; index < actualMembers.length; index += 1) {
    const actual = actualMembers[index];
    const recorded = rows[index];
    if (recorded.bytes !== actual.bytes) {
      throw new Error(`${label} member byte-length drift: ${actual.path}`);
    }
    if (recorded.sha256 !== actual.sha256) {
      throw new Error(`${label} member SHA-256 drift: ${actual.path}`);
    }
  }

  const actualDigest = orderedSetDigest(domain, actualMembers);
  if (declaredDigest !== actualDigest) throw new Error(`${label} ordered set-digest drift.`);
  return actualDigest;
}

async function verifyFrozenContracts(canonicalBytes, runtimeBytes) {
  if (process.version !== `v${EXPECTED_RUNTIME.node}`) {
    throw new Error(`Contract closure requires Node ${EXPECTED_RUNTIME.node}; received ${process.version}.`);
  }

  const canonicalHash = sha256(canonicalBytes);
  const producerHash = sha256(runtimeBytes);
  if (canonicalHash !== LOCKED_PRODUCER_SHA256 || producerHash !== LOCKED_PRODUCER_SHA256) {
    throw new Error("Producer manifests do not match the locked planning SHA-256.");
  }

  const frozenBytes = await readFile(frozenContractsPath);
  const frozen = parseCanonicalJsonObject(frozenBytes, "Frozen-contract manifest");
  if (frozen.schema !== FROZEN_CONTRACT_SCHEMA) throw new Error("Frozen-contract schema drift.");
  assertExactKeys(
    frozen,
    [
      "schema",
      "gate",
      "digestAlgorithm",
      "setDigestPreimage",
      "setSha256",
      "runtime",
      "files",
      "erratumProof",
      "producerManifest",
    ],
    "Frozen-contract manifest",
  );

  if (frozen.gate !== FROZEN_CONTRACT_GATE) throw new Error("Frozen-contract gate drift.");
  if (frozen.digestAlgorithm !== DIGEST_ALGORITHM) {
    throw new Error("Frozen-contract digest algorithm drift.");
  }
  if (frozen.setDigestPreimage !== setDigestDescription(CONTRACT_SET_DOMAIN)) {
    throw new Error("Contract set-digest preimage description drift.");
  }

  assertExactKeys(frozen.runtime, ["node", "npm", "typescript", "zod"], "Frozen runtime");
  for (const [name, version] of Object.entries(EXPECTED_RUNTIME)) {
    if (frozen.runtime[name] !== version) throw new Error(`Frozen runtime drift: ${name}`);
  }

  assertExactKeys(
    frozen.erratumProof,
    ["setDigestPreimage", "setSha256", "files"],
    "Erratum-proof closure",
  );
  if (frozen.erratumProof.setDigestPreimage !== setDigestDescription(ERRATUM_SET_DOMAIN)) {
    throw new Error("Erratum-proof set-digest preimage description drift.");
  }

  assertExactKeys(
    frozen.producerManifest,
    ["path", "sha256", "bytes"],
    "Producer-manifest closure",
  );
  if (frozen.producerManifest.path !== PRODUCER_MANIFEST_PATH) {
    throw new Error("Producer-manifest path drift.");
  }
  assertHash(frozen.producerManifest.sha256, "Producer-manifest SHA-256");
  assertByteLength(frozen.producerManifest.bytes, "Producer-manifest byte length");

  const contractDigest = await verifyMemberClosure({
    declaredDigest: frozen.setSha256,
    domain: CONTRACT_SET_DOMAIN,
    expectedPaths: CONTRACT_PATHS,
    label: "Contract closure",
    rows: frozen.files,
  });
  const erratumDigest = await verifyMemberClosure({
    declaredDigest: frozen.erratumProof.setSha256,
    domain: ERRATUM_SET_DOMAIN,
    expectedPaths: ERRATUM_PROOF_PATHS,
    label: "Erratum-proof closure",
    rows: frozen.erratumProof.files,
  });

  if (frozen.producerManifest.bytes !== runtimeBytes.length) {
    throw new Error("Producer-manifest byte-length drift.");
  }
  if (
    frozen.producerManifest.sha256 !== producerHash ||
    frozen.producerManifest.sha256 !== LOCKED_PRODUCER_SHA256
  ) {
    throw new Error("Producer-manifest SHA-256 drift.");
  }

  return {
    contractDigest,
    erratumDigest,
    frozenManifestHash: sha256(frozenBytes),
    producerHash,
  };
}

function validateProducerManifest(manifest) {
  const paths = manifest.entries.map((entry) => entry.path);
  const sortedPaths = [...paths].sort();
  if (JSON.stringify(paths) !== JSON.stringify(sortedPaths)) {
    throw new Error("Tracked producer paths are not in canonical lexical order.");
  }
  if (new Set(paths).size !== paths.length) throw new Error("Duplicate tracked producer path.");
  if (paths.some((path) => PATH_PATTERN.test(path) || path.startsWith("/") || path.includes(".."))) {
    throw new Error("Producer manifest contains a nonliteral or escaping path.");
  }

  const fileUnits = new Map();
  const unitSchedules = new Map();
  const unitDependencies = new Map();
  for (const entry of manifest.entries) {
    if (entry.tracked !== true || entry.cardinality !== 1) {
      throw new Error(`Tracked producer invariant failed: ${entry.path}`);
    }
    if (fileUnits.has(entry.createUnit)) throw new Error(`Duplicate file unit: ${entry.createUnit}`);
    fileUnits.set(entry.createUnit, entry.path);
    unitSchedules.set(entry.createUnit, entry.schedule);
    unitDependencies.set(entry.createUnit, entry.dependsOn);
    for (const modifier of entry.modifiers) {
      if (modifier.outputPath !== entry.path) {
        throw new Error(`Modifier output path mismatch: ${modifier.unit}`);
      }
      if (fileUnits.has(modifier.unit)) throw new Error(`Duplicate file unit: ${modifier.unit}`);
      fileUnits.set(modifier.unit, entry.path);
      unitSchedules.set(modifier.unit, modifier.schedule);
      unitDependencies.set(modifier.unit, modifier.dependsOn);
    }
  }
  for (const entry of manifest.excludedOperationalFiles) {
    if (entry.tracked !== false || entry.cardinality !== 1 || PATH_PATTERN.test(entry.path)) {
      throw new Error(`Excluded operational-file invariant failed: ${entry.path}`);
    }
    if (fileUnits.has(entry.createUnit)) throw new Error(`Duplicate file unit: ${entry.createUnit}`);
    fileUnits.set(entry.createUnit, entry.path);
    unitSchedules.set(entry.createUnit, entry.schedule);
    unitDependencies.set(entry.createUnit, entry.dependsOn);
    for (const modifier of entry.modifiers) {
      if (modifier.outputPath !== entry.path || fileUnits.has(modifier.unit)) {
        throw new Error(`Excluded modifier invariant failed: ${modifier.unit}`);
      }
      fileUnits.set(modifier.unit, entry.path);
      unitSchedules.set(modifier.unit, modifier.schedule);
      unitDependencies.set(modifier.unit, modifier.dependsOn);
    }
  }

  function assertFixedOrder(producerUnit, consumerUnit, relation) {
    const producer = unitSchedules.get(producerUnit);
    const consumer = unitSchedules.get(consumerUnit);
    if (
      producer?.mode === "fixed" &&
      consumer?.mode === "fixed" &&
      producer.clock === consumer.clock &&
      producer.endTick > consumer.startTick
    ) {
      throw new Error(
        `${relation} producer-after-consumer: ${producerUnit} ends ${producer.endTick}, ${consumerUnit} starts ${consumer.startTick}`,
      );
    }
  }

  for (const entry of [...manifest.entries, ...manifest.excludedOperationalFiles]) {
    for (const consumer of entry.firstConsumers) {
      if (unitSchedules.has(consumer)) {
        assertFixedOrder(entry.createUnit, consumer, "firstConsumer");
      }
    }
  }
  for (const [consumer, dependencies] of unitDependencies) {
    for (const dependency of dependencies) {
      if (unitSchedules.has(dependency)) {
        assertFixedOrder(dependency, consumer, "dependsOn");
      }
    }
  }

  if (manifest.entries.length !== manifest.policy.expectedTrackedRows) {
    throw new Error("Tracked producer row count drift.");
  }
  if (manifest.excludedOperationalFiles.length !== manifest.policy.expectedExcludedOperationalRows) {
    throw new Error("Excluded operational row count drift.");
  }
  if (fileUnits.size !== manifest.policy.expectedUniqueFileUnits) {
    throw new Error("Unique file-unit count drift.");
  }
  const modifierCount = [...manifest.entries, ...manifest.excludedOperationalFiles].reduce(
    (total, entry) => total + entry.modifiers.length,
    0,
  );
  if (modifierCount !== manifest.policy.expectedModifierUnits) {
    throw new Error("Modifier count drift.");
  }

  return paths;
}

async function verifyTree({ gateArgument, manifest, paths, runtimeBytes, surfaceOnly }) {
  const legalGates = manifest.policy.legalRequiredGates;
  const requestedGate =
    gateArgument ?? ((await exists(resolve("src/app/receipt/page.tsx"))) ? "FINAL" : "W0-C0");
  if (!legalGates.includes(requestedGate) && requestedGate !== "FINAL") {
    throw new Error(`Unknown required gate: ${String(requestedGate)}`);
  }

  const gateIndex = (gate) => {
    if (gate === "FINAL") return Number.POSITIVE_INFINITY;
    return legalGates.indexOf(gate);
  };
  const requestedIndex = gateIndex(requestedGate);
  const expectedEntries = manifest.entries.filter(
    (entry) => gateIndex(entry.requiredGate) <= requestedIndex,
  );
  const expectedPaths = new Set(expectedEntries.map((entry) => entry.path));

  if (!surfaceOnly) {
    const missing = [];
    for (const path of expectedPaths) {
      if (!(await exists(resolve(path)))) missing.push(path);
    }

    const managedRoots = [
      "src",
      "db",
      "fixtures",
      "scripts",
      "tests",
      "docs/verification",
      ".github/workflows",
    ];
    async function listManaged(directory) {
      if (!(await exists(directory))) return [];
      const entries = await readdir(directory, { withFileTypes: true });
      const files = [];
      for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
        if (
          ["node_modules", ".next", "coverage", "playwright-report", "test-results"].includes(
            entry.name,
          )
        ) {
          continue;
        }
        const path = join(directory, entry.name);
        if (entry.isDirectory()) files.push(...(await listManaged(path)));
        else if (entry.isFile()) files.push(relative(projectRoot, path).split(sep).join("/"));
      }
      return files;
    }

    const actualManaged = (await Promise.all(managedRoots.map((root) => listManaged(resolve(root))))).flat();
    const unexpected = actualManaged.filter((path) => !expectedPaths.has(path));
    const future = actualManaged.filter((path) => paths.includes(path) && !expectedPaths.has(path));
    if (missing.length > 0 || unexpected.length > 0 || future.length > 0) {
      const lines = [
        ...missing.map((path) => `missing:${path}`),
        ...unexpected.map((path) => `unexpected:${path}`),
        ...future.map((path) => `future:${path}`),
      ];
      throw new Error(`Candidate tree does not match ${requestedGate}:\n${lines.join("\n")}`);
    }
  }

  const existingExpectedPaths = [];
  for (const path of expectedPaths) {
    if (await exists(resolve(path))) existingExpectedPaths.push(path);
  }

  const pagePaths = existingExpectedPaths.filter(
    (path) => /^src\/app\/(?:[^/]+\/)*page\.tsx$/u.test(path) && !path.includes("/api/"),
  );
  const apiPaths = existingExpectedPaths.filter((path) =>
    /^src\/app\/api\/.+\/route\.ts$/u.test(path),
  );
  const migrationPaths = existingExpectedPaths.filter((path) =>
    /^db\/migrations\/\d{4}_[a-z0-9_]+\.sql$/u.test(path),
  );
  const declaredRaceCaseFamilies = new Set(
    manifest.entries.flatMap((entry) => {
      const match = /^tests\/races\/cases\/f([1-9]\d*)\//u.exec(entry.path);
      return match === null ? [] : [Number(match[1])];
    }),
  );
  const declaredRaceRunnerFamilies = new Set(
    manifest.entries.flatMap((entry) => {
      const match = /^tests\/races\/runners\/family-([1-9]\d*)\.test\.ts$/u.exec(entry.path);
      return match === null ? [] : [Number(match[1])];
    }),
  );
  const sortedRaceCaseFamilies = [...declaredRaceCaseFamilies].sort((left, right) => left - right);
  const sortedRaceRunnerFamilies = [...declaredRaceRunnerFamilies].sort(
    (left, right) => left - right,
  );
  if (JSON.stringify(sortedRaceCaseFamilies) !== JSON.stringify(sortedRaceRunnerFamilies)) {
    throw new Error("Declared race-case and runner families do not match.");
  }
  if (sortedRaceCaseFamilies.some((family, index) => family !== index + 1)) {
    throw new Error("Declared race families must be contiguous from family 1.");
  }
  const snapshot = JSON.parse(await readFile(resolve("tests/contract/webmcp.schema.json"), "utf8"));
  const surfaceGate = requestedGate === "FINAL" ? "FINAL" : "W0-C0";
  const expectedSurface = manifest.surfaceGates[surfaceGate];
  const actualSurface = {
    userPages: pagePaths.length,
    apiFamilies: apiPaths.length,
    productTables: migrationPaths.length,
    raceFamilies: declaredRaceCaseFamilies.size,
    webmcpTools: new Set(snapshot.tools.map((tool) => tool.name)).size,
  };
  for (const [name, value] of Object.entries(expectedSurface)) {
    if (actualSurface[name] !== value) {
      throw new Error(
        `Surface ${name} drift at ${surfaceGate}: expected ${value}, received ${actualSurface[name]}`,
      );
    }
  }

  const pdfPaths = existingExpectedPaths.filter((path) => path.endsWith(".pdf"));
  if (surfaceGate === "W0-C0" && pdfPaths.length !== 6) throw new Error("W0 must contain six PDFs.");
  if (migrationPaths.length !== 5) throw new Error("Candidate must contain exactly five migrations.");

  process.stdout.write(
    `${surfaceOnly ? "Surface" : "File-structure"} verification: PASS gate=${requestedGate} manifest=${sha256(runtimeBytes)} paths=${expectedEntries.length} surfaces=${JSON.stringify(actualSurface)}\n`,
  );
}

async function main() {
  const { contractsOnly, requestedGate, surfaceOnly } = parseCli(process.argv.slice(2));

  if (new Set([...CONTRACT_PATHS, ...ERRATUM_PROOF_PATHS]).size !== 11) {
    throw new Error("Verifier configuration contains duplicate cross-closure members.");
  }
  if (CONTRACT_SET_DOMAIN === ERRATUM_SET_DOMAIN) {
    throw new Error("Verifier configuration requires distinct closure domains.");
  }
  if (JSON.stringify(ERRATUM_PROOF_PATHS) !== JSON.stringify([...ERRATUM_PROOF_PATHS].sort())) {
    throw new Error("Verifier configuration requires lexical erratum-proof order.");
  }

  const canonicalBytes = await readFile(canonicalPath);
  const runtimeBytes = await readFile(runtimePath);
  if (!canonicalBytes.equals(runtimeBytes)) {
    throw new Error("Runtime producer manifest is not byte-identical to the locked planning manifest.");
  }
  parseJsonObject(canonicalBytes, "Canonical producer manifest");
  const manifest = parseJsonObject(runtimeBytes, "Runtime producer manifest");
  const paths = validateProducerManifest(manifest);

  if (contractsOnly) {
    const result = await verifyFrozenContracts(canonicalBytes, runtimeBytes);
    process.stdout.write(
      `Contract closure verification: PASS gate=${FROZEN_CONTRACT_GATE} manifest=${result.frozenManifestHash} contracts=${CONTRACT_PATHS.length}:${result.contractDigest} erratum=${ERRATUM_PROOF_PATHS.length}:${result.erratumDigest} producer=${result.producerHash}\n`,
    );
    return;
  }

  await verifyTree({
    gateArgument: requestedGate,
    manifest,
    paths,
    runtimeBytes,
    surfaceOnly,
  });
}

await main();
