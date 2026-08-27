# Product Requirements Document

Status: Approved and locked at G2; changes require the gate to reopen  
Date: 2026-08-27  
Product: CiteApply (working codename)

## Product Summary

CiteApply is an owned, WebMCP-enabled portal for a synthetic need-based scholarship application. It lets an external browser agent read the live application rules, inspect consented structured evidence claims, and draft answers in the same form the student sees. The portal—not the agent—decides whether each field has a policy-allowed source binding, whether evidence conflicts, and whether the application is ready for review.

The memorable behavior is refusal, not autofill speed: when two accepted documents disagree about a required value, the site leaves that field unresolved, returns a structured conflict, and requires a visible applicant resolution. No WebMCP tool or agent-facing API can submit. The normal UI requires a version-bound review confirmation and final Submit action, then produces a persisted provenance receipt.

This prototype proves a trustworthy interaction pattern on one participating site using conspicuously synthetic data. It does not authenticate documents, decide eligibility, prove a browser actor is human, support arbitrary sites, or claim production adoption or ROI.

## Target User

### Primary user

A first-time student completing a document-backed, need-based scholarship application who is unsure which evidence supports each answer. A guardian may help, but the student is the applicant and final approver.

### Hypothesized buyer

The scholarship foundation or university aid team operating the program. The value hypothesis is fewer incomplete submissions, clarification loops, and manual source-matching steps. These outcomes and willingness to pay remain unvalidated until measured with a design partner.

### Community user

Nonprofit form operators and browser-agent developers who can reuse the open evidence-policy schema, synthetic fixtures, compatibility tests, and reference portal.

### Commercial and community boundary

Applicant use has no fee or paywall. The commercial hypothesis is an operator-hosted or managed B2B deployment priced per active aid program, with usage tiers based on completed applications; billing is not built in v1. Operator value comes from the enforced submission boundary and provenance record, not from a back-office dashboard. The v1 community deliverables are the open schema, fixtures/goldens, compatibility tests, reference portal, setup instructions, and license. Willingness to pay and hosted nonprofit pricing remain unvalidated.

## Product Goals

1. Make the current application's requirements and branch state understandable to both the student and an external WebMCP client.
2. Ensure every submission-ready value has a binding allowed by that field's versioned policy.
3. Make source support, uncertainty, and conflict visible and inspectable in the live form.
4. Let the agent handle structured drafting while preserving visible applicant control over declarations, conflict resolution, review, and submission.
5. Demonstrate a genuine, non-hardcoded WebMCP flow that produces different behavior from the happy and contradictory evidence packets.
6. Leave a receipt that exactly describes the accepted application version, field bindings, resolutions, and controlled commitment.

## Non-Goals

- Scholarship discovery, recommendations, essay generation, eligibility scoring, award decisions, fraud detection, identity verification, or document-authenticity claims.
- Generic cross-site autofill, DOM scraping, coordinate clicking, browser-extension support for unmodified sites, or agent-controlled submission.
- Real applicant records, arbitrary uploads, image OCR, model-based extraction, production retention, enterprise administration, billing, or caseworker tooling.
- A second portal, second industry, or second conditional branch in the submission build.
- Proof that the visible UI was actuated by a biological person rather than privileged browser automation.

## Experience Principles

- **The site enforces trust.** Prompts may request caution, but readiness comes from deterministic portal policy.
- **Visible collaboration.** Every accepted agent mutation appears in the normal form immediately; no hidden parallel application exists.
- **Fail closed, explain clearly.** Missing, conflicting, invalid, or policy-disallowed evidence and stale operations never become silently ready or overwrite newer work.
- **Source before confidence.** A confidence label is an extraction signal, not a truth score. The user can inspect exact source text.
- **Human commitment.** Only the normal UI creates declarations, resolves conflicts, confirms the review snapshot, and exposes final submission.
- **Least disclosure.** Every value-bearing WebMCP output is consent-gated. Tools expose bounded structured values and opaque handles where required, never document bodies or exact source snippets.
- **Honest demo.** Synthetic data is unmistakable; genuine WebMCP calls and production handlers are shown; waiting may be edited but behavior is never simulated.
- **Human UI always works.** WebMCP enhances the application but does not replace accessible semantic form controls.

## Demo Program And Data

### Program

The single demo program is **Horizon Education Aid — Need-Based Scholarship**. Every screen and document includes a visible “Synthetic demo — not a real application” label.

### Application fields

| Field | Required | Allowed binding and evidence class | Validation | Visibility |
|---|---:|---|---|---|
| Full legal name | Yes | Source claim; `student_verification` | Trimmed text, 2–80 characters | Initial |
| Date of birth | Yes | Source claim; `student_verification` | Valid ISO date earlier than today and not before 1900; no eligibility inference | Initial |
| Student ID | Yes | Source claim; `student_verification` | 4–24 uppercase letters, digits, or hyphens | Initial |
| Institution | Yes | Source claim; `enrollment_record` | Trimmed text, 2–120 characters | Initial |
| Course or program | Yes | Source claim; `enrollment_record` | Trimmed text, 2–120 characters | Initial |
| Preferred contact email | Yes | Human declaration allowed | Valid email shape, maximum 254 characters | Initial |
| Financially dependent on guardian | Yes | Source claim; `household_record` | Boolean `yes`/`no`; controls the only branch | Initial |
| Annual household income | Yes | Source claim; `income_record` or portal-accepted income claim in `household_record` | Whole INR amount from 0–100,000,000 | Initial; deliberate conflict field |
| Guardian full name | When dependent | Source claim; `household_record` | Trimmed text, 2–80 characters | Conditional |
| Household size | When dependent | Source claim; `household_record` | Integer from 1–20 | Conditional |

The exact displayed labels and help text may be polished, but field IDs, policies, and branch meaning stay stable after G2.

### Evidence packets

Both packets describe a conspicuously fictional applicant and contain three versioned text PDFs. The same deterministic parser and application handlers process both.

- **Student verification/enrollment letter:** full legal name, date of birth, student ID, institution, and program.
- **Household composition certificate:** dependency status, guardian name, household size, and an accepted income claim.
- **Income certificate:** a second accepted annual-income claim.

- **Supported packet:** the household and income certificates agree; all required claims can become ready after the student confirms the declaration-allowed contact email.
- **Conflict packet:** the household and income certificates disagree about annual household income. Other claims remain usable so the conflict is isolated and understandable.

For the declaration demonstration, the recorded synthetic user prompt explicitly supplies `anaya.rao@example.test` as the preferred contact email. The agent may propose only that exact prompt-supplied value. If no email is supplied in the current user instruction, the field stays missing; the agent must not invent one.

Each document is visibly watermarked `SYNTHETIC — NOT VALID`. Reviewed golden data records its content hash, page, exact authored text span, normalized claim, evidence class, and expected extraction result. There is no demo-only answer map.

## Information Architecture

The product has five user-visible stages within one application:

1. **Choose evidence** — select the supported or conflict packet and see what synthetic documents it contains.
2. **Authorize collaboration** — review the categories that the current page session may expose through WebMCP; allow or revoke access.
3. **Complete application** — view the live form, source/status chips, conditional fields, evidence drawer, and bounded agent activity.
4. **Review and confirm** — inspect the exact diff, bindings, declarations, conflict history, warnings, and data disclosure summary.
5. **Submitted receipt** — view the persisted accepted snapshot, which is locked against further editing through the product, and export JSON or print its semantic HTML representation.

On desktop, the form is primary and the evidence/status rail is secondary. On narrow screens, the same content becomes a single logical reading order; no core action requires side-by-side layout.

## User-Visible Application States

Evidence access is an independent on/off permission; it never implies readiness or confirmation.

| Application state | What the student sees | Allowed next actions |
|---|---|---|
| Draft — incomplete | Specific missing, conflicting, low-confidence, invalid, or declaration-needed items | Edit manually, bind a source, authorize/revoke assisted access, ask the agent to retry, switch packet, or reset |
| Parsing | Per-document progress and any deterministic extraction failure | Wait, retry a failed packet setup, or reset; no ready claims are invented |
| Draft — ready | Every active required field satisfies its current policy | Edit or prepare review |
| Review prepared | Frozen version/hash, exact diff, bindings, declarations, conflict history, disclosures, and warnings | Return to edit or confirm |
| Confirmed | Confirmation tied to the displayed review; Submit available | Submit or cancel confirmation; any content change returns to Draft |
| Review invalidated or confirmation expired | Existing application data is preserved and the reason is announced | Return to the same review, re-prepare if data changed, and confirm again |
| Submission checking | Outcome is temporarily unknown; duplicate action is disabled while the existing request is reconciled | Wait or safely recheck status; never submit blindly |
| Submission rejected | No submission was created; the exact rejection and preserved review state are shown | Correct the stated issue or safely confirm/retry the same version |
| Submitted | Locked success state and matching receipt | View, export JSON, or print |
| Receipt unavailable | Submission identity is preserved but the receipt could not be fetched/exported | Retry receipt lookup/export or use Print; never resubmit |

## Core User Journey

### Supported path

1. The student lands in a fresh synthetic session and sees the program, privacy boundary, and two packet choices.
2. They choose the supported packet. The page shows the included PDFs and successful extraction state without pretending the files are real records. They may instead choose a complete-manually path that uses the same field policy and source picker.
3. They review a short disclosure summary and choose **Allow value-bearing WebMCP access for this page session**.
4. The consent-gated capabilities become available. The external agent reads requirements and the evidence index, then applies claim-bound answers using the current application version.
5. The page visibly fills supported fields. Binding chips identify source document/page; activating a chip opens the exact synthetic excerpt.
6. Binding `financially dependent on guardian = yes` reveals guardian full name and household size. Annual household income is already required for every applicant. The agent re-reads live state and fills the new branch fields from allowed claims.
7. The agent may propose a contact email, but the field remains `Needs your declaration`. The student reviews the exact value and confirms it through the normal UI.
8. The agent prepares review. The student inspects the final diff, evidence/declaration groups, disclosures, and readiness summary.
9. The student selects **Confirm this review**. The exact review version becomes confirmed and Submit is enabled.
10. The student selects **Submit application**. A success screen and matching provenance receipt appear.

### Conflict path

1. The student chooses the conflict packet and authorizes the same bounded evidence access.
2. The external agent invokes the same production tools and handlers as the supported path.
3. Supported fields fill, the conditional branch opens, and annual household income remains unresolved.
4. The page and tool result identify a structured conflict without choosing a convenient value.
5. The student opens the comparison, sees both synthetic source excerpts, selects the current policy-supported source, and records a short resolution reason.
6. The original conflict remains in history; the resolution does not authenticate either document or erase disagreement.
7. The agent re-reads validation and prepares review only after all other requirements are satisfied.
8. Review, visible confirmation, submission, and receipt follow the same path as the supported packet.

### Blocked path

If no claim satisfies an evidence-required field, the application stays not ready. The UI explains which evidence class is required. Because arbitrary upload is outside the committed slice, the synthetic demo offers **Reset and choose another packet**, not a fake corrected-document upload.

### Manual path

If WebMCP is unavailable, denied, revoked, or fails, the student can complete the same semantic form manually. They select an allowed source claim from the visible evidence drawer for evidence-required fields and use the visible declaration flow for declaration-allowed fields. There is no non-agent “fill everything” button, hidden answer map, or weaker readiness policy.

## Status Language

Every active field exposes a text label and icon; color is supplemental.

| Status | Meaning | Can be submission-ready? |
|---|---|---:|
| Source linked | Value is bound to an allowed claim and current policy/version | Yes, if all other rules pass |
| User declared | Visible UI recorded a declaration for a declaration-allowed field | Yes |
| Needs your declaration | Agent proposed an unbound value for a declaration-allowed field | No |
| Missing | No value or permitted binding exists | No |
| Conflicting | Multiple accepted claims disagree and no valid resolution is recorded | No |
| Low confidence | Parser flagged the source extraction below that field's accepted threshold | No unless field policy explicitly permits a human correction path; committed required-evidence fields do not |
| Invalid | Value fails the field's format or business rule | No |

`Stale` is an operation error caused by an outdated application version, not a permanent evidence status. The UI keeps newer data and offers a refresh/retry path; it never overwrites silently.

## Epics And User Stories

### Epic 1: Understand and start a synthetic application

As a student, I want to understand the program and select a safe demo evidence packet so that I can explore the workflow without exposing real personal information.

Acceptance criteria:

- **E1-AC1:** A first visit clearly names the fictional program, identifies the experience as synthetic, and states that it is not an eligibility or authenticity check.
- **E1-AC2:** Exactly two packet choices are available: supported and conflict. Each lists its synthetic PDFs and a plain-language scenario description.
- **E1-AC2a:** A keyboard-reachable **Complete manually** path is available and uses the same source-binding, declaration, conflict, readiness, review, and submission rules.
- **E1-AC3:** Selecting a packet creates or resets a demo-scoped application and shows extraction progress, success, or a specific failure per document.
- **E1-AC4:** Both packet choices travel through the same product parser and handlers. The page exposes no “demo success” bypass.
- **E1-AC5:** Switching packet or resetting after work exists requires destructive confirmation and explains that claim handles, drafts, conflicts/resolutions, prepared review/confirmation state, and consent will be cleared. On confirmation, no data or handle from the prior packet remains available and focus returns to packet selection.
- **E1-AC6:** A parser failure marks affected claims missing/low-confidence, preserves unaffected claims, and prevents any affected required field from becoming ready.

### Epic 2: Control evidence disclosure to the page's WebMCP session

As a student, I want to control when this page exposes structured applicant/evidence data through WebMCP so that no value-bearing tool result is available before I consent.

Acceptance criteria:

- **E2-AC1:** Before authorization, always-available results are limited to form requirements, field identifiers, accepted evidence classes, and coarse progress with no applicant values, source/conflict/declaration metadata, branch answers, or value-bearing validation details.
- **E2-AC2:** The authorization screen lists data categories, purpose, session scope, and how to revoke; it does not imply CiteApply can authenticate the external agent's identity. It states that consent governs CiteApply's structured WebMCP disclosure, not a privileged client's separate ability to observe information already rendered in the page.
- **E2-AC3:** A visible student action enables consent-gated capabilities for the current page/application session.
- **E2-AC4:** Consent is required for every tool output containing field values, claim values/handles, declaration values, conflict values/source metadata, branch answers, or value-bearing validation details. Exact source snippets/document content and the complete review diff are human-UI-only. Agent review preparation returns readiness and review identifiers/metadata, not the exact diff.
- **E2-AC5:** Revocation blocks future consent-gated tool reads/mutations. Values already applied remain visible and attributed so the student may edit them individually; manual work is preserved. Bulk removal is post-v1.
- **E2-AC6:** Refresh restores authoritative application state with evidence access off. The student must visibly authorize sensitive capabilities again for the new page session.
- **E2-AC7:** Wrong-session, wrong-packet, forged-handle, cross-application, pre-consent, and post-revocation calls to every registered read/review/mutation capability make no mutation and return no protected value.
- **E2-AC8:** A consent-gated call that has not returned/committed when access is revoked returns no protected data and produces no later mutation. If a whole mutation committed first, it remains visibly applied with an activity time. Revocation cannot retract information already returned, revoke separate browser/extension permissions, or be followed by a surprise delayed update.
- **E2-AC9:** A black-box test manually enters and declares values before consent, invokes every registered read/review tool, and observes no value-bearing output; granting consent exposes only scoped values, and revocation redacts/denies every value-bearing output again.

### Epic 3: Collaborate through the live WebMCP application contract

As a student using an external browser agent, I want the agent to read live requirements and visibly draft the same form I see so that collaboration is reliable and inspectable.

Acceptance criteria:

- **E3-AC1:** The blocking feasibility spike proves that the primary tested external client discovers real imperative WebMCP tools on the running product and can invoke one read, one version-checked mutation, and cancellation. This minimum spike is not sufficient for final WebMCP acceptance.
- **E3-AC2:** Every successful mutation updates the normal semantic form and status summary immediately; there is no hidden agent-only draft.
- **E3-AC3:** The supported and conflict packets use identical registered tools and production handlers but return state-derived differences.
- **E3-AC3a:** Final external-client acceptance shows the client reading requirements and consented evidence, independently composing multiple claim-to-field bindings from those results, applying them with the current version, re-reading after the conditional branch appears, and changing its next action after a structured conflict or stale result. No tool returns a precomputed field-to-answer assignment.
- **E3-AC4:** Applying the dependency claim reveals guardian name and household size; annual household income remains required in either branch. A subsequent state read reports the new branch and requirements.
- **E3-AC5:** A batch is atomic from the user's perspective: rejected or cancelled mutations do not leave a partial mix of old and new field values.
- **E3-AC6:** A request using an old application version is rejected as stale, preserves the newer application, and tells the client/user to refresh state.
- **E3-AC7:** Unknown fields, malformed values, disallowed evidence classes, invalid claim IDs, hash mismatches, and wrong-session handles produce specific errors and no unauthorized mutation.
- **E3-AC8:** Cancellation before commitment leaves no changes and returns cancelled. If the full atomic mutation committed first, the visible result/activity says it completed; the product never reports cancelled and then applies a surprise update.
- **E3-AC9:** Repeating an accepted request with the same request ID and payload does not duplicate changes; reusing that ID with a different payload fails visibly.
- **E3-AC10:** The visible activity summary shows tool name, state, time, and affected field count without logging document text, source snippets, or synthetic PII values.
- **E3-AC11:** Without WebMCP assistance, the student can manually select allowed claims for evidence-required fields and reach the same readiness/review flow; no manual action bypasses policy.
- **E3-AC12:** Reset invalidates all in-flight operations, claim handles, request IDs, reviews, and confirmations for the deleted draft. A late result cannot disclose data or recreate the application.

### Epic 4: Inspect source support and handle uncertainty

As a student, I want to see why each value was accepted or blocked so that I can correct the application rather than trusting a plausible guess.

Acceptance criteria:

- **E4-AC1:** Every source-linked field has a keyboard-operable source chip with document title, page, evidence class, and status.
- **E4-AC2:** Opening a source chip shows the exact authored synthetic text span and enough surrounding context to understand it; this view is delivered through the human UI, not the evidence-index tool.
- **E4-AC3:** Extraction confidence is labeled as a parser signal and never described as truth, authenticity, or eligibility confidence.
- **E4-AC4:** Missing, invalid, low-confidence, and conflicting states use distinct text, icons, help, and remediation. None relies on color alone.
- **E4-AC5:** Conflict comparison displays both values and source excerpts, accepted evidence classes, date/version metadata, and a warning that selecting a source does not authenticate it.
- **E4-AC6:** The student can select a current policy-supported source and must record a resolution reason. The original conflict and both source handles remain in history.
- **E4-AC7:** If neither source is policy-valid, no resolution control can force readiness; the blocked-path explanation and reset option remain available.
- **E4-AC8:** Hostile or instruction-like document text is displayed as quoted evidence data and never changes the UI instructions, tool policy, or application rules.
- **E4-AC9:** Editing the displayed value of a source-linked field immediately removes its prior claim binding and `Source linked` status, increments application state, records the change in activity/history, and invalidates review/confirmation. An evidence-required field remains not ready until the student explicitly selects an allowed claim again; typing the same visible string does not recreate provenance. Editing a declared value also invalidates that declaration, and no receipt may pair a value with a mismatching claim.
- **E4-AC10:** Inactive guardian fields cannot be mutated and never affect readiness/tool output/review/receipt. If closing a populated dependency branch would discard guardian name or household size, an agent request returns `requires_user_action` and the visible UI warns what will be cleared. Human confirmation clears those values/bindings, closes the branch, increments version, and invalidates review/confirmation. Reopening starts both fields empty/missing.
- **E4-AC11:** Two allowed claims whose normalized values are equal do not create a conflict. Portal policy selects `income_record` as the displayed primary binding over `household_record`, while both sources remain inspectable/corroborating in provenance.

### Epic 5: Keep declarations human-visible and policy-limited

As a student, I want to explicitly declare only values that the form allows me to declare so that an agent cannot impersonate my attestation.

Acceptance criteria:

- **E5-AC1:** An agent may propose the preferred contact email only when the current user instruction explicitly supplies that exact value. It may not infer or invent an email from documents or names. The field remains `Needs your declaration` and blocks review readiness until the student acts.
- **E5-AC2:** The declaration action exists only in the normal visible UI, restates the exact field/value, and requires affirmative user activation.
- **E5-AC3:** Evidence-required fields never display a declaration action and cannot become ready through an unbound note or proposed value.
- **E5-AC4:** A declaration is tied to the exact field, value, application version, declaration-policy version, demo session, and time.
- **E5-AC5:** Editing the value invalidates its prior declaration and returns the field to `Needs your declaration`.
- **E5-AC6:** Agent/API attempts to mark a value declared, reuse a declaration for another field/value/version, or forge the declaration actor fail without changing readiness.
- **E5-AC7:** Product wording promises that WebMCP and agent-facing APIs cannot create declarations; it does not claim that privileged browser automation can never actuate visible controls.

### Epic 6: Prepare, confirm, submit, and receive an exact record

As a student, I want to review the exact application version and retain a matching receipt so that I know what I chose to submit.

Acceptance criteria:

- **E6-AC1:** Review cannot be prepared while any active required field is missing, invalid, low-confidence, conflicting, or waiting for a declaration, or while the latest operation requires a state refresh.
- **E6-AC2:** The review screen groups source-linked and user-declared values; shows conditional branch state, conflict/resolution history, warnings, and data disclosed to tools; and provides the exact diff from the initial application.
- **E6-AC3:** Preparing review creates a visibly identified snapshot/version. No WebMCP tool or agent-facing API can confirm or submit it.
- **E6-AC4:** **Confirm this review** is available only in the normal UI and enables submission for that exact snapshot.
- **E6-AC5:** Any field edit, declaration change, branch change, evidence resolution, policy/application-version change, or reset invalidates confirmation, disables Submit, and returns the user to draft/review preparation.
- **E6-AC6:** Missing confirmation keeps the current review unconfirmed. Expired or explicitly cancelled confirmation transitions to **Review prepared**, disables Submit, and offers confirmation again without data re-entry. Wrong-version or mismatched-review confirmation returns the legitimate application to current **Draft** with a new-review requirement. A wrong-session request does not alter the legitimate session.
- **E6-AC6a:** A used confirmation tied to a successful submission resolves to the existing **Submitted** state and receipt. No rejection state leaves Submit enabled in a permanent failure loop.
- **E6-AC7:** Repeating the accepted submission request returns the same success/receipt rather than creating a second submission; a different payload cannot reuse the approval.
- **E6-AC7a:** If a network failure leaves submission outcome unknown, the UI enters **Checking submission status**, disables duplicate submission, and queries the existing request. It resolves to the original receipt if accepted or returns to the same still-valid confirmed review only if the server establishes that submission did not occur.
- **E6-AC8:** Successful submission shows the application ID, submitted time, accepted version/hash, active submitted fields, binding metadata/anchor references, declaration record, conflict resolution history, relevant policy versions, and bounded WebMCP activity summary. It excludes inactive branch values, document bodies/full source snippets, approval secrets, and internal diagnostics.
- **E6-AC9:** On-screen receipt, JSON export, and print contain the same substantive active record and exactly match the confirmed review. Each is visibly synthetic, warns that the export contains displayed synthetic application values, and never claims authenticity, eligibility, or cryptographic certification.
- **E6-AC10:** Refreshing a submitted session returns to the same receipt rather than an editable draft.

### Epic 7: Recover safely from interruption and failure

As a student, I want clear recovery when the browser, client, or application state changes so that I do not lose work or submit stale data.

Acceptance criteria:

- **E7-AC1:** Refresh restores the latest authoritative Draft/conflicts/declarations/branch. A still-current prepared review may be reconstructed; visible confirmation never silently survives a new page session and returns to **Review prepared** with Submit disabled. Refresh during **Submission checking** resumes reconciliation without exposing a second Submit action. Accepted submission restores only the locked receipt. A changed application/policy version discards the old review and returns to Draft with an explanation.
- **E7-AC2:** If WebMCP is unavailable, the page says so without blocking the normal human form path or implying arbitrary-browser compatibility.
- **E7-AC3:** Network/server failures preserve the latest authoritative persisted state, show a safe retry/recheck action, and do not optimistically claim a mutation or submission succeeded.
- **E7-AC4:** Each state family—packet processing, consent, agent action, field readiness, review/confirmation, and submission/receipt—shows what happened, what was preserved, whether submission occurred or remains unknown, and one safe next action.
- **E7-AC5:** An unexpected error exposes a safe reference ID, not document text, source excerpts, field values, stack traces, or approval secrets.
- **E7-AC6:** **Reset draft** is available only before submission. After destructive confirmation it deletes the unsubmitted application, claims, consent, review, and confirmation according to the G3 retention contract; every old handle/approval fails afterward. The visible copy states the automatic synthetic-session retention period.
- **E7-AC7:** A submitted application cannot be packet-switched, reset, or edited. V1 offers only receipt view, JSON export, and print until automatic expiry; starting another demo and an explicit delete-demo-data action are post-v1.
- **E7-AC8:** Receipt export failure leaves the existing receipt and submission untouched and offers **Retry export** and **Print**. It never triggers or repeats submission.

### Epic 8: Make the complete path accessible and demo-verifiable

As a student using keyboard, zoom, reduced motion, or assistive technology, I want the same evidence, conflict, review, and submission capability without losing context.

Acceptance criteria:

- **E8-AC1:** The entire supported and conflict journeys are operable by keyboard with visible focus and logical order, including packet selection, consent, source inspection, conflict resolution, declaration, confirmation, submission, and receipt export.
- **E8-AC2:** Inputs have programmatic labels/instructions; status changes and validation summaries are announced without stealing focus; errors link to affected controls.
- **E8-AC3:** Dialogs/drawers manage focus predictably, Escape behavior is safe, and focus returns to the invoking control.
- **E8-AC4:** Text and controls meet the chosen WCAG 2.2 AA contrast target, content reflows at 200% zoom and a 320 CSS-pixel viewport, and meaning never depends on color, position, animation, hover, or pointer precision alone. All essential pointer targets meet a 24×24 CSS-pixel minimum or an allowed documented exception.
- **E8-AC5:** Reduced-motion preference removes nonessential animation. Expiration never loses application data or permanently blocks the task; an expired confirmation returns to the same review and can be reconfirmed without re-entry. Where practical, impending expiry is announced without interrupting the user.
- **E8-AC6:** Combined automated and manual checks report no known WCAG 2.2 A/AA violations on each named stage: Choose evidence, Authorize collaboration, Complete application, Review and confirm, and Submitted receipt. Scanner limitations are supplemented by full keyboard and named screen-reader/browser checks for both packet flows. Any known A/AA failure blocks the gate.
- **E8-AC7:** The recorded demo shows a genuine external-client invocation and resulting visible mutation by second 10, preserves the complete real call/result relationship, and does not substitute a simulated animation or testing harness.
- **E8-AC8:** The external-client trace, visible mutations, review snapshot, and receipt reconcile for the recorded session.
- **E8-AC9:** Failed review or submit validation moves focus to a linked error summary. Source evidence is available as selectable semantic text with document name and page; a PDF canvas or visual preview is never the only accessible representation.

## Global Acceptance Rules

These apply to every epic:

- A “pass” requires observable behavior in the running product plus the applicable automated/manual evidence; screenshots alone do not satisfy state or security requirements.
- All public fixtures, screenshots, test artifacts, logs, and demo recordings use conspicuously synthetic data.
- The normal UI and WebMCP handlers apply the same versioned field/evidence/readiness policy.
- Tool schemas and client-side validation improve guidance but never replace authoritative policy and session checks.
- Claims that both packets use the same parser/handlers and no bypass require behavioral evidence from both packets, parser-failure/modified-hash tests, and public-source inspection; screenshots alone cannot prove them.
- No document body, evidence excerpt, synthetic PII value, approval secret, or sensitive tool result appears in application logs, analytics, traces, browser console errors, or test-report titles.
- Compatibility claims name exact tested client/browser versions and required setup. Untested clients are described as unverified.
- A material change to the locked scope or any acceptance rule reopens the relevant planning gate.

## Edge Cases

- A packet is selected while an earlier session is submitted.
- One PDF parses and another fails or its content hash changes.
- Two claims normalize to the same value but have different formatting or dates.
- Two allowed claims conflict, and the student abandons the comparison.
- A proposed email is changed after it was declared.
- The dependency answer changes and conditional fields become inactive.
- An agent retries after the human edited the form and its expected version is stale.
- Consent is revoked while a tool call is running.
- A tool call is cancelled after validation but before mutation completion.
- Review is open in one tab while another tab changes the draft.
- Confirmation expires before Submit.
- Submit is double-clicked, retried after a network timeout, or replayed from another session.
- The user refreshes during parsing, conflict resolution, prepared review, confirmed review, or after submission.
- A source contains prompt-like language, extremely long values, markup, or schema-shaped text.
- A source handle belongs to the other synthetic packet or application.
- WebMCP API is absent, changes, or the external client cannot invoke a registered tool.
- The viewport is narrow, text is zoomed, reduced motion is active, or a screen reader announces rapid multi-field updates.

## Quality And Learning Measures

### Product correctness

- 100% of ready fields in the committed golden corpus have a policy-allowed claim binding or visible human declaration.
- 0 tested evidence-required fields reach ready state using only an unbound proposal/declaration.
- 0 tested stale, forged, cross-session, cancelled, or unauthorized requests produce a partial/unauthorized mutation.
- Both evidence packets match reviewed extraction/source-anchor goldens.
- The receipt matches the accepted review snapshot exactly in every E2E run.

### Prototype learning

- Report completion without unresolved evidence gaps for each observed or automated scenario.
- Report the count of clarification-required fields per scenario.
- If at least three representative participants are available, observe synthetic-data sessions, report sample size and findings, and distinguish usability observations from customer validation.
- If no participants are available, state plainly that no user validation occurred.
- Do not convert synthetic test results into adoption, accuracy-improvement, time-savings, or ROI claims.

## What We Are Building

### Must ship

- The complete locked single-application journey above plus its cross-cutting recovery, accessibility, privacy, and verification requirements.
- Two real synthetic text-PDF packets and deterministic extraction with golden anchors.
- One conditional dependency branch and one deliberate income conflict.
- Consent-gated imperative WebMCP collaboration in at least one proven external client.
- Human-only declarations, policy-valid conflict resolution, version-bound review/confirmation, idempotent submission, and matching receipt.
- Responsive, accessible normal UI; privacy/security failure behavior; refresh/resume; automated and manual verification evidence.
- Open schema, fixtures, compatibility tests, setup instructions, visible open-source license, CI, deployable app, and exact compatibility record.

### May ship only after must-ship gates pass

- Additional visual polish that does not change behavior.
- A second external client if verified without consuming contingency.

## What We Would Add With More Time

- User-supplied text-PDF upload with safe parsing, limits, quarantine, deletion, and hostile-file handling.
- Image OCR and region anchors, then model-assisted extraction behind the same deterministic policy boundary.
- Corrected-evidence replacement within an application.
- Additional conditional branches and aid-program policy templates.
- Operator review workflow and design-partner metrics.
- Tenant isolation, real authentication, retention controls, audit exports, enterprise administration, and managed deployment.
- A hosted free nonprofit tier and broader open compatibility corpus.
- Bulk removal of agent-applied values, starting another demo after submission, and an explicit delete-demo-data workflow.
- Only after separate validation: other high-stakes participating form categories.

## Submission Proof Points

### Video proof

- A real external client discovers tools, reads live requirements and consented evidence, composes multiple bindings, applies a visible version-checked mutation, re-reads the revealed branch, receives a structured conflict, changes course instead of guessing, and prepares review metadata.
- Both packets use the same production contract and diverge because the actual page/evidence state differs.
- The student resolves the conflict in the visible UI, reviews the exact diff, visibly confirms/submits, and opens the matching receipt.
- The first genuine mutation is visible by second 10; edited waiting never breaks the real call/result/UI relationship.

### Repository and test evidence

- Reproducible evidence covers stale writes, cancellation races, malformed/forged/cross-session handles, consent absence/revocation, declaration forgery, review invalidation, approval replay/idempotency, hostile evidence, log leakage, receipt reconciliation, and accessibility regression.
- Public source/tests prove the shared handlers/parser, absence of a demo bypass, and clean-client compatibility. The submission claims only evidence actually linked and reproducible.

### Judge mapping

- **WebMCP leverage:** multi-step reads, composed bindings, live branch re-read, structured conflict, and shared visible state—not an opaque autofill action.
- **Execution:** one coherent hosted journey covers packet selection through persisted receipt, backed by failure/recovery, accessibility, and clean-client verification.
- **Potential impact:** the applicant problem, operator buyer, B2B unit, community deliverables, and validation gaps are named precisely; tested correctness is separated from unvalidated market outcomes.
- **Creativity and ambition:** trust comes from a receiving-site evidence contract, human-only declarations, structured refusal, and version-bound commitment—not from asking one preferred model to be cautious.

## G2 Exit Criteria

- Product, accessibility/UX, security/abuse, testability, and Devpost-judge reviewers approve the observable requirements.
- Every P0/P1 finding is resolved or explicitly accepted with rationale.
- User journey, status semantics, exact fields, packet behavior, consent, declarations, conflict resolution, review, submission, receipt, recovery, and non-goals are internally consistent.
- The PRD remains non-architectural enough for G3 to choose implementation details, while all user-visible and black-box behavior is testable.
- State, status, build notes, and review evidence are updated before the technical spec begins.
