import { constants } from "node:fs";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CHECK_ONLY = process.argv.includes("--check");
const UNKNOWN_ARGUMENTS = process.argv.slice(2).filter((argument) => argument !== "--check");
const FIXED_DATE = new Date("2026-01-01T00:00:00.000Z");
const PAGE_SIZE = [612, 792];

if (UNKNOWN_ARGUMENTS.length > 0) {
  throw new Error(`Unknown fixture-generator argument: ${UNKNOWN_ARGUMENTS.join(" ")}`);
}

const enrollment = Object.freeze({
  title: "Synthetic Enrollment Record",
  lines: Object.freeze([
    "Legal name: Anaya Rao",
    "Student ID: HZN-2026-0142",
    "Institution: Northstar Community College",
  ]),
});

const household = Object.freeze({
  title: "Synthetic Household Statement",
  lines: Object.freeze([
    "Dependent on guardian: Yes",
    "Guardian name: Meera Rao",
    "Household size: 4",
    "Annual household income: INR 480,000",
  ]),
});

const supportedIncome = Object.freeze({
  title: "Synthetic Income Statement",
  lines: Object.freeze(["Annual household income: INR 480,000"]),
});

const conflictIncome = Object.freeze({
  title: "Synthetic Income Statement",
  lines: Object.freeze(["Annual household income: INR 540,000"]),
});

const documents = Object.freeze([
  ["fixtures/packets/supported/enrollment.pdf", enrollment],
  ["fixtures/packets/supported/household.pdf", household],
  ["fixtures/packets/supported/income.pdf", supportedIncome],
  ["fixtures/packets/conflict/enrollment.pdf", enrollment],
  ["fixtures/packets/conflict/household.pdf", household],
  ["fixtures/packets/conflict/income.pdf", conflictIncome],
]);

async function buildDocument({ title, lines }) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(title);
  pdf.setAuthor("CiteApply");
  pdf.setSubject("Conspicuously synthetic education-aid demonstration record");
  pdf.setKeywords(["synthetic", "fictional", "not-valid", "citeapply"]);
  pdf.setProducer("CiteApply deterministic fixture generator");
  pdf.setCreator("CiteApply deterministic fixture generator");
  pdf.setCreationDate(FIXED_DATE);
  pdf.setModificationDate(FIXED_DATE);

  const page = pdf.addPage(PAGE_SIZE);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  page.drawText("SYNTHETIC — NOT VALID", {
    x: 54,
    y: 724,
    size: 18,
    font: bold,
    color: rgb(0.72, 0.08, 0.08),
  });
  page.drawText(title, {
    x: 54,
    y: 676,
    size: 20,
    font: bold,
    color: rgb(0.08, 0.12, 0.2),
  });
  page.drawText("Horizon Education Aid — fictional demonstration only", {
    x: 54,
    y: 646,
    size: 11,
    font: regular,
    color: rgb(0.22, 0.25, 0.3),
  });

  lines.forEach((line, index) => {
    page.drawText(line, {
      x: 72,
      y: 584 - index * 34,
      size: 13,
      font: regular,
      color: rgb(0.05, 0.07, 0.1),
    });
  });

  page.drawText("Fictional demo. Do not use as an identity, enrollment, or financial record.", {
    x: 54,
    y: 72,
    size: 9,
    font: regular,
    color: rgb(0.3, 0.32, 0.36),
  });

  return pdf.save({
    addDefaultPage: false,
    useObjectStreams: false,
    updateFieldAppearances: false,
  });
}

async function fileExists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

for (const [relativePath, definition] of documents) {
  const outputPath = resolve(PROJECT_ROOT, relativePath);
  const expectedBytes = Buffer.from(await buildDocument(definition));

  if (CHECK_ONLY) {
    if (!(await fileExists(outputPath))) {
      throw new Error(`Missing generated fixture: ${relativePath}`);
    }
    const actualBytes = await readFile(outputPath);
    if (!actualBytes.equals(expectedBytes)) {
      throw new Error(`Generated fixture differs from committed bytes: ${relativePath}`);
    }
    continue;
  }

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, expectedBytes);
}

process.stdout.write(
  `${CHECK_ONLY ? "Verified" : "Generated"} ${documents.length} deterministic synthetic one-page PDFs.\n`,
);
