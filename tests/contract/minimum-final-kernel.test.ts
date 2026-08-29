import assert from "node:assert/strict";
import test from "node:test";

import {
  TOOL_ANNOTATIONS,
  TOOL_DESCRIPTIONS,
  TOOL_INPUT_SCHEMAS,
  TOOL_NAMES,
  type ToolName,
} from "../../src/contracts/webmcp.ts";
import {
  projectActiveRequirements,
  projectApplySuccess,
  projectEvidenceIndex,
  projectProtectedState,
  projectRedactedState,
  projectStaticRequirements,
  projectValidationIssues,
} from "../../src/domain/agent-projectors.ts";
import { CITEAPPLY_DESCRIPTORS } from "../../src/webmcp/descriptors.ts";
import { applyAssistedDraftChanges, createInitialDraft } from "../../src/domain/draft.ts";
import { canonicalizeAssistedChanges } from "../../src/contracts/webmcp.ts";
import { parseRegisteredPacket } from "../../src/evidence/extract-claims.server.ts";

const VERSIONS = { applicationRevision: 1, requirementsVersion: 1 } as const;

const HUMAN_ONLY_SYNONYMS = [
  "declare",
  "resolve",
  "confirm",
  "submit",
  "receipt",
  "export",
  "return",
];

test("the registered tool set is exactly the six locked names", () => {
  assert.equal(TOOL_NAMES.length, 6);
  assert.equal(new Set(TOOL_NAMES).size, 6);
  assert.deepEqual(
    CITEAPPLY_DESCRIPTORS.map((descriptor) => descriptor.name),
    [...TOOL_NAMES],
  );
});

test("no descriptor name is a human-only action synonym", () => {
  for (const name of TOOL_NAMES) {
    for (const synonym of HUMAN_ONLY_SYNONYMS) {
      assert.ok(
        !name.includes(synonym),
        `${name} must not read as the human-only action ${synonym}`,
      );
    }
  }
});

test("descriptors stay inside the WebMCP bounds", () => {
  for (const descriptor of CITEAPPLY_DESCRIPTORS) {
    assert.ok(descriptor.description.length < 500);
    assert.equal(
      (descriptor.inputSchema as { additionalProperties?: unknown })
        .additionalProperties,
      false,
    );
    assert.equal(
      typeof TOOL_ANNOTATIONS[descriptor.name].readOnlyHint,
      "boolean",
    );
    assert.equal(TOOL_DESCRIPTIONS[descriptor.name], descriptor.description);
  }
});

test("exactly the two mutating tools declare themselves mutating", () => {
  const mutating = TOOL_NAMES.filter(
    (name) => !TOOL_ANNOTATIONS[name].readOnlyHint,
  );
  assert.deepEqual(mutating, [
    "apply_evidence_backed_answers",
    "prepare_submission_review",
  ]);
});

test("tool inputs reject authority tokens and unknown keys", () => {
  const rejected: Record<ToolName, unknown> = {
    get_application_state: { mode: "protected", pageCapability: "x" },
    get_form_requirements: { mode: "all", consentCapability: "x" },
    get_evidence_index: { sessionCredential: "x" },
    get_validation_issues: { pageEpoch: 1 },
    apply_evidence_backed_answers: {
      requestId: "00000000-0000-4000-8000-000000000000",
      expectedApplicationRevision: 1,
      expectedRequirementsVersion: 1,
      changes: [],
    },
    prepare_submission_review: {
      requestId: "00000000-0000-4000-8000-000000000000",
      expectedApplicationRevision: 1,
      expectedRequirementsVersion: 1,
      reviewId: "00000000-0000-4000-8000-000000000000",
    },
  };

  for (const name of TOOL_NAMES) {
    assert.equal(
      TOOL_INPUT_SCHEMAS[name].safeParse(rejected[name]).success,
      false,
      `${name} must reject that input`,
    );
  }
});

test("the redacted projection exposes no application content", () => {
  const redacted = projectRedactedState();
  assert.deepEqual(redacted, {
    access: "consent_required",
    safeActions: ["use_visible_application"],
  });
});

test("a conflicting income never reaches the agent as a value", async () => {
  const packet = await parseRegisteredPacket("conflict");
  const draft = createInitialDraft(packet);
  const state = projectProtectedState(draft, VERSIONS);
  const income = state.fields.at(-1);
  assert.ok(income !== undefined);

  assert.equal(income.field, "annual_household_income");
  assert.equal(income.status, "needs_human_action");
  assert.ok(!("value" in income));

  const issues = projectValidationIssues(draft, VERSIONS, false);
  assert.ok(
    issues.blockers.some((blocker) => blocker.code === "conflict_requires_human"),
  );
});

test("a supported income is corroborated and bindable", async () => {
  const packet = await parseRegisteredPacket("supported");
  const draft = createInitialDraft(packet);
  const statement = packet.claims[7];
  const transition = applyAssistedDraftChanges({
    draft,
    packet,
    changes: canonicalizeAssistedChanges([
      {
        kind: "bind_claim",
        field: "annual_household_income",
        claimHandle: statement.claimHandle,
      },
    ]),
  });

  assert.equal(transition.outcome, "applied");
  if (transition.outcome !== "applied") return;
  const income = transition.draft.fields[7];
  assert.equal(income.status, "ready");
  if (income.status !== "ready" || income.field !== "annual_household_income") {
    return;
  }
  assert.equal(income.resolution, "source_supported");
});

test("closing the branch changes the active requirement set", async () => {
  const packet = await parseRegisteredPacket("supported");
  const draft = createInitialDraft(packet);
  assert.equal(projectActiveRequirements(draft, VERSIONS).fields.length, 6);

  const dependency = packet.claims[3];
  const transition = applyAssistedDraftChanges({
    draft,
    packet,
    changes: canonicalizeAssistedChanges([
      {
        kind: "bind_claim",
        field: "dependency",
        claimHandle: dependency.claimHandle,
      },
    ]),
  });
  assert.equal(transition.outcome, "applied");
  if (transition.outcome !== "applied") return;

  assert.equal(
    projectActiveRequirements(transition.draft, VERSIONS).fields.length,
    8,
  );
  const applied = projectApplySuccess(VERSIONS, transition.updatedFields);
  assert.equal(applied.rereadRequirements, true);
});

test("the static requirement set is packet independent", () => {
  const requirements = projectStaticRequirements();
  assert.equal(requirements.length, 8);
  const policies = requirements.map((requirement) => requirement.policy);
  assert.equal(policies.filter((policy) => policy === "evidence").length, 6);
  // The two fields the agent can never satisfy alone carry their own policies.
  assert.equal(
    policies.filter((policy) => policy === "applicant_declared_test_email")
      .length,
    1,
  );
  assert.equal(policies.filter((policy) => policy === "income_policy").length, 1);
});

test("the evidence index carries handles, never excerpts", async () => {
  const packet = await parseRegisteredPacket("conflict");
  const index = projectEvidenceIndex(packet);
  assert.equal(index.claims.length, 8);
  for (const claim of index.claims) {
    assert.ok(!("anchor" in claim));
    assert.ok(!("fingerprint" in claim));
    assert.ok(!("documentHash" in claim));
  }
  for (const document of index.documents) {
    assert.ok(!("pageText" in document));
  }
});
