# CiteApply Product Requirements Document

Status: Approved and locked at G2 local-first upstream alignment; product requirements and release acceptance remain unchanged
Date: 2026-08-27
Product: CiteApply (working codename)
Upstream contract candidate: `scope.md`, SHA-256 `26b8b0fb1a68a2131a6d654198cb93f8c4bc32363e559a1d7a65747db642aa1a`

## Product Summary

CiteApply is the fictional **Horizon Education Aid — Need-Based Scholarship** portal. A student may complete its document-backed application manually or let an external browser agent help through six WebMCP tools. In both paths, CiteApply—not the agent—decides which parsed synthetic source claims may support each answer, whether accepted sources conflict, and whether the exact application is ready to review.

The memorable product behavior is **fast visible assistance followed by principled refusal**. The agent links supported identity and household claims, which visibly reveals the guardian branch. When two accepted income sources disagree, the portal applies no income value, returns `conflict_requires_human`, and requires the applicant to inspect both sources. The agent may propose a synthetic contact email, but only the applicant can declare it. The agent may prepare review metadata after those human decisions; it never receives a declaration, conflict-resolution, confirmation, submission, or export capability.

The final commitment is one visible **Confirm and submit this review** action in the normal UI. A successful action creates one immutable, session-bounded receipt. Its screen, JSON, and print views are semantically equal projections of the exact accepted review.

## Product Goals

1. Help a student understand which active questions require which source class.
2. Make every accepted evidence answer inspectably source-linked.
3. Let an external agent perform meaningful multi-step drafting in the live visible form without receiving an answer map.
4. Refuse automatic resolution when two accepted sources disagree.
5. Preserve visible applicant authority over the email declaration, evidence-conflict choice, review decision, and submission.
6. Make the complete application usable without WebMCP and subject to identical policy.
7. Recover honestly from refresh, stale pages, aborted callbacks, retries, response loss, export failure, and session expiry.
8. Produce a coherent, accessible, testable product that demonstrates WebMCP value without overclaiming real-world validation or production readiness.

## Product Non-Claims

CiteApply does not:

- authenticate a document, identity, applicant, or browser actor;
- decide scholarship eligibility, approve funding, or submit to a real institution;
- support real personal data, arbitrary uploads, image PDFs, OCR, model extraction, or general documents;
- support unmodified third-party sites, browser scraping, generic cross-site autofill, or a second portal/client claim;
- let an agent declare, resolve a conflict, confirm, submit, download, or print;
- claim that Revoke retracts returned or already-final-authorized information;
- claim that post-dispatch browser abort rolls back an operation;
- promise collaborative tabs, offline work, BFCache recovery, unsaved-input transfer, session renewal, or physical deletion at expiry; or
- claim adoption, customer validation, production readiness, time savings, accuracy improvement, willingness to pay, or ROI without evidence.

## Target Users And Stakeholders

### Primary user

A first-time student completing a need-based scholarship application who is unsure which document supports each answer. A guardian may assist, but the student remains the applicant and owns every human-only decision and the final action.

### Hypothesized buyer

A scholarship foundation or university aid team operating a document-backed program. The future value hypothesis is fewer incomplete applications, fewer clarification contacts, less reviewer source-matching time, and higher applicant completion. These are future pilot measures, not hackathon outcome claims.

### Community user

A nonprofit program or agent developer that wants a reusable example of site-owned evidence policy, informed WebMCP disclosure, deterministic refusal, accessible human fallback, and receipt reconciliation. The public repository will expose the schema, synthetic fixtures, goldens, contract tests, and reference portal under an Amit-approved open-source license.

## Experience Principles

- **Synthetic by construction.** Every route and artifact states that the program and data are fictional. No control asks for real information.
- **The site owns readiness.** The portal evaluates source policy and conflicts independently of the chosen agent.
- **Evidence, not plausible text.** Evidence-required fields accept policy-allowed parsed claims, never free-typed values or declarations.
- **Visible collaboration.** Accepted and refused agent operations produce immediate, understandable form and activity changes.
- **Informed, least-disclosure assistance.** The applicant sees categories, actions, exclusions, scope, and in-flight limitations before Allow.
- **Human decisions stay human.** Declaration, conflict resolution, return/edit, commitment, and submission exist only in the normal UI.
- **Manual parity.** Declining or lacking WebMCP never disables or weakens the application.
- **Honest recovery.** The product distinguishes saved state, unsaved local text, uncertain network outcome, stale page, and expired session without inventing success.
- **One clear next action.** Every blocked or exceptional state explains what happened, what was preserved, whether anything was submitted, and one safe recovery.

## Demo Program And Fixture Contract

### Program identity

- Program: **Horizon Education Aid — Need-Based Scholarship**
- Persistent badge: **Fictional demo · Synthetic data only**
- Persistent warning: **Do not enter real personal or financial information. This does not submit a real scholarship application.**
- Document watermark: **SYNTHETIC — NOT VALID**
- Session length: exactly 60 minutes from successful demo creation; activity never extends it.

### Exact application fields

| Field | Initial visibility | Readiness rule | Human interaction |
|---|---|---|---|
| Full legal name | Visible | Must bind the enrollment-record name claim | Choose, inspect, change, or clear allowed source |
| Student ID | Visible | Must bind the enrollment-record student-ID claim | Choose, inspect, change, or clear allowed source |
| Institution | Visible | Must bind the enrollment-record institution claim | Choose, inspect, change, or clear allowed source |
| Preferred contact email | Visible | Exact saved `.test` value must be visibly declared by applicant | Type/save/discard/declare; inspect declaration |
| Financially dependent on a guardian | Visible | Must bind the household dependency claim | Choose, inspect, change, or clear allowed source |
| Annual household income | Visible | Supported requires canonical plus corroborating agreement; Conflict requires human source resolution | Inspect both; human selects source and reason when conflicting |
| Guardian full name | Hidden until dependency `Yes` | Must bind household guardian-name claim while active | Choose, inspect, change, or clear allowed source |
| Household size | Hidden until dependency `Yes` | Must bind household-size claim while active | Choose, inspect, change, or clear allowed source |

Both committed packets contain dependency `Yes`, so every primary journey reveals guardian full name and household size. Clearing the saved dependency binding closes the branch and clears/excludes both conditional answers after a visible applicant confirmation. Inactive fields never affect readiness, review, agent output, receipt, or progress counts.

### Exact synthetic values

Both packets describe the same fictional applicant so that one income disagreement is the only material behavioral difference:

| Item | Committed value |
|---|---|
| Full legal name | `Anaya Rao` |
| Student ID | `HZN-2026-0142` |
| Institution | `Northstar Community College` |
| Prompt-supplied contact email | `anaya.rao@example.test` |
| Financially dependent on guardian | `Yes` |
| Guardian full name | `Meera Rao` |
| Household size | `4` |
| Household-statement annual income | `INR 480,000` |
| Supported income-statement value | `INR 480,000` |
| Conflict income-statement value | `INR 540,000` |

The recorded external-client prompt includes the exact `.test` email. If the current instruction does not explicitly provide that exact value, the agent leaves email missing rather than deriving or inventing it.

### Exactly three PDFs per packet

1. **Synthetic Enrollment Record** — legal name, student ID, institution.
2. **Synthetic Household Statement** — dependency, guardian name, household size, one accepted income claim.
3. **Synthetic Income Statement** — the second accepted income claim.

Each packet therefore yields exactly eight normalized source claims: three enrollment claims, four household claims, and one additional income claim. Production behavior derives these claims from the six committed PDF byte streams. No tool result or production fixture supplies a field-to-answer assignment.

For Supported, the income statement is the canonical displayed binding and the equal household claim remains inspectable corroboration. For Conflict, both income claims remain unresolved; neither evidence class automatically wins.

## Information Architecture

Only three user pages exist.

| Page | Required regions and modes |
|---|---|
| Landing | Program/synthetic explanation, two packet choices, 60-minute boundary, Start, parsing, capacity error, parse failure |
| Application | Synthetic/session header, readiness summary, assistance panel, eight-field form, source viewer, conflict resolver, activity summary, Draft mode, Review mode, stale/read-only mode, expired state |
| Receipt | Safe loading state, accepted receipt, JSON/print controls, export failure, session-expired state |

Review is a mode of Application, not a fourth page. Source inspection and conflict resolution are focused overlays within Application. There is no account, dashboard, upload area, operator interface, analytics view, or separate confirmation page.

## User-Visible State Model

### Primary stages

1. **Packet selection** — no application exists.
2. **Parsing** — the chosen packet is being checked; no partial form exists.
3. **Draft** — saved application answers may be changed; Review may be requested.
4. **Review** — one immutable current review is visible; answers are read-only until Return.
5. **Submitted** — one accepted receipt exists; application is read-only.
6. **Session expired** — application and receipt access have ended.

### Bounded exceptional presentations

- **Parse failed** — no application exists.
- **Stale page** — saved content may remain visible but is read-only because a newer page is authoritative.
- **Checking latest state** — bounded reconciliation after abort, response loss, or uncertain submit; when authority can be reached it resolves to Draft, Review, Submitted, Stale page, or Session expired.
- **Connection unavailable** — automatic reconciliation stopped without learning the authoritative state; no state-changing action is enabled.
- **Checking receipt** — the value-free Receipt shell has not yet established an authenticated Submitted record and makes no acceptance claim.
- **Receipt unavailable** — Submitted is authoritative, but the canonical receipt could not currently be loaded.
- **Receipt export failed** — Submitted remains authoritative.
- **At capacity** — no application exists and the user may retry at the displayed time.

There is no persistent Confirmed, Approved, Cancelled, Submission pending, recovery-token, page-lineage, or renewed-session stage.

### Assistance overlay

Assistance never changes the primary workflow. Its only visible modes are:

- **Off** — initial, declined, revoked, refreshed/taken over, review prepared, or expired.
- **Allowed for this page/session** — protected operations may be finally authorized while this page and session remain current.
- **Unavailable** — WebMCP is unsupported; every manual control remains usable.

### Canonical field status language

| Visible status | Meaning | Ready? |
|---|---|---:|
| **Missing — choose a source** | Active evidence-required field has no saved binding | No |
| **Source linked** | One allowed source claim supports the saved value | Yes |
| **Corroborated by 2 sources** | Canonical income claim agrees with the second accepted source | Yes |
| **Conflict — your choice required** | Accepted sources disagree and no human resolution exists | No |
| **Source linked · Resolved by you** | Applicant committed one accepted conflicting source and one bounded reason | Yes |
| **Needs your declaration** | Saved email exists but applicant has not declared that exact value | No |
| **Declared by you** | Applicant declared the exact saved `.test` email | Yes |
| **Unsaved — not in your application** | Local email input differs from saved state | No; Review blocked |
| **Not required** | Conditional field is inactive and excluded | Not counted |

Agent-attributed fields also show **Updated through assisted access** without using attribution as a readiness status.

For an unresolved income conflict, **Conflict — your choice required** remains the primary status while an incomplete local source/reason choice shows secondary text **Selection not saved**. A local edit to a previously committed resolution leaves **Source linked · Resolved by you** authoritative, shows **Selection not saved**, and blocks Review until the applicant saves or discards that edit.

### Readiness summary

The Application header shows active progress such as **4 of 8 active answers ready** and a text list of blockers. Before dependency is saved as `Yes`, there are six active fields; afterward there are eight. Progress never counts inactive fields, local unsaved text, a proposed-but-undeclared email, or unresolved conflicting income.

When a committed income resolution is ready but the applicant starts an unsaved replacement, the prior authoritative **n of the current active-field total saved answers ready** count remains unchanged and a separate warning says **1 unsaved change blocks Review**. Before the guardian branch opens the denominator may be six; afterward it is eight. The canonical otherwise-ready example is **8 of 8 saved answers ready · 1 unsaved change blocks Review**; incomplete examples include **5 of 6** or **7 of 8** with the same separate warning. The local selection is not counted as another answer and cannot be reviewed or submitted until saved or discarded.

## Core User Journeys

### Canonical Conflict journey

1. The student chooses Conflict and starts a 60-minute synthetic demo.
2. CiteApply checks the three PDFs and opens Draft with six active requirements.
3. The external client discovers all six tools. A protected pre-consent call returns value-free `consent_required`.
4. The student reads the complete assisted-access disclosure and selects **Allow assisted access**.
5. The agent separately reads application state, requirements, and normalized evidence claims.
6. The first atomic batch binds legal name, student ID, institution, and dependency. The visible form changes; dependency `Yes` reveals and announces two new questions.
7. The agent re-reads current state/active requirements. A second atomic batch binds guardian name and household size and proposes `anaya.rao@example.test`; email remains **Needs your declaration**.
8. The agent attempts the disputed income binding separately. CiteApply returns `conflict_requires_human`, applies nothing, and shows **Income was refused; no value changed.**
9. Validation and premature review preparation identify exactly two blockers: income conflict and email declaration. No review is created.
10. The student opens both exact income excerpts, selects one accepted source, chooses a bounded reason, and activates **Use selected income source**.
11. The student reviews the exact email value and activates **Declare this email**.
12. Validation reaches zero blockers. The agent prepares review metadata; assisted access turns Off and the complete review appears only in Application.
13. The student may Return, edit, and prepare again. In the canonical demo they select **Confirm and submit this review**.
14. Submitted opens the canonical receipt. Screen, JSON, and print show semantically equal accepted information.

### Supported assisted journey

The same tools, ordering, prompts, and policies run against Supported. Equal income becomes the canonical income-statement binding plus household corroboration. Immediately before declaration, email is the only blocker. After applicant declaration, agent review preparation succeeds and the same human-only submission/receipt path completes.

### Complete manual journey

The student declines or lacks WebMCP, uses visible source selectors for every evidence-required field, resolves any conflict through the same human comparison, saves and declares the `.test` email, selects **Review application**, and submits through the same Review and Receipt. For identical authoritative application content, manual and assisted preparation produce identical field values, bindings, declaration, resolution, readiness, submitted application content, and canonical application-content hash. Both use the same Receipt schema and projection rules; truthful assisted attribution and activity counts may differ by journey.

### Review-return journey

The student prepares Review, notices an error, and selects **Return to application**. CiteApply invalidates that review, preserves valid saved answers/resolution, returns to Draft, and leaves assistance Off. The student edits, re-declares if needed, and prepares a new current review. Re-preparing unchanged content may reproduce the same canonical content hash but creates a new review identity; only the current review may submit.

### Interruption journey

Refresh/newer-page takeover restores saved Draft, Review, or Submitted state but clears assistance and open confirmation presentation. An interrupted assisted draft request may say **The assistant stopped waiting. This action may have completed. Checking the latest application.** Human-submit uncertainty instead says **We couldn't confirm the response. Checking whether your application was submitted. Do not submit again.** The user sees either unchanged state or one complete committed effect—never a partial change, duplicate receipt, or optimistic success. If authoritative state remains unreachable after bounded automatic checks, CiteApply stops and presents Connection unavailable with no enabled mutation or submit action.

## Epics And User Stories

The story identifiers below are stable references for the replacement specification, checklist, tests, reviews, and demo evidence. Acceptance criteria describe externally observable behavior. They do not prescribe implementation structure.

### Epic 1 — Start a truthful, bounded synthetic application

#### CA-START-01 — Understand the demonstration before starting

As a student or judge, I want to know that the scholarship and records are fictional so that I do not mistake the demonstration for a real aid application or enter personal information.

Acceptance criteria:

- Landing visibly names **Horizon Education Aid** and places **Fictional demo · Synthetic data only** beside the main heading rather than in footer-only fine print.
- The page explains in plain language that CiteApply demonstrates source-backed form completion, that all included records are synthetic, and that nothing is sent to a real scholarship provider.
- A prominent notice tells the visitor not to enter personal or confidential data. No control requests a real email, identity, payment, authentication secret, or uploaded document.
- Both packet cards label every document **SYNTHETIC — NOT VALID** and summarize the intended difference: Supported has agreeing income sources; Conflict has disagreeing income sources.
- The only primary start action is **Start 60-minute demo** after one packet is selected. Start is unavailable until the visitor makes that visible choice.
- Starting one packet cannot accidentally create two visible applications when the button is double-activated, the response is delayed, or the page is refreshed during start.

#### CA-START-02 — See a real parse boundary

As a judge, I want the selected PDFs to be checked at runtime so that the product demonstrates actual document grounding rather than a prefilled answer map.

Acceptance criteria:

- After Start, the visible stage is **Parsing** and explicitly says that the three selected synthetic PDFs are being checked. It does not show a partially filled application.
- Successful parsing opens exactly one Draft whose claim inventory corresponds to the selected packet.
- Every displayed evidence excerpt can later be traced to its document name and one-based page number; no excerpt is invented from an answer value.
- In test only, an independently reviewed mutated PDF may be admitted under its own test allowlist entry through the same production parser/extractor. Changing its source text must change the corresponding normalized value or exact anchor; invoking a parser while ignoring its output fails this requirement.
- Separately, changing any committed production PDF byte while presenting its original allowlisted hash must fail before application creation.
- A static production import/bundle check must prove that production cannot import test goldens, precomputed claims, a production claim manifest, or a hardcoded field-to-answer map.
- If any required document is missing, altered, too large, too long, unreadable, or lacks an exact required anchor, parsing fails closed. No application or partial evidence index is created.
- Parse failure explains which synthetic document could not be accepted without exposing stack traces, storage paths, parser internals, or secret values. The only recovery action is **Return to packet selection**.
- Retrying after a parse failure starts a fresh attempt. The failed attempt cannot be reopened as a Draft.

#### CA-START-03 — Enter a fixed 60-minute session

As a participant, I want clear time boundaries so that I understand how long the synthetic application and receipt remain accessible.

Acceptance criteria:

- A successful start communicates that the application is available for 60 minutes and shows an understandable remaining-time presentation in Application and Receipt.
- At minute 50, a non-modal warning announces that ten minutes remain and offers no misleading extension or renewal action. If a background browser throttles timers, it appears and announces immediately at the next foreground/focus opportunity after minute 50.
- At minute 60, no new application or receipt request can be authorized. The visible destination is **Session expired** with **Start a new synthetic demo**. An operation whose final authorization won before the deadline may still complete or deliver its already-authorized bounded result; the page does not reopen access or enable another action.
- A refresh cannot renew the session, create a replacement authority silently, or extend the original deadline.
- A JSON receipt already downloaded by the participant remains a local file outside CiteApply; the product does not imply it can retract that file.
- Product copy makes no promise that database rows, host backups, or logs are physically erased at the access deadline.

#### CA-START-04 — Handle capacity without pretending an application exists

As a visitor, I want an honest capacity response so that I know whether to retry rather than waiting inside a broken application.

Acceptance criteria:

- When the bounded public demo cannot admit another session, Landing shows **At capacity**, a safe retry time, and no application identifier or partial form.
- Capacity refusal does not parse documents, allocate a usable application, or claim that data was saved.
- Repeated activation during the same refusal window does not create hidden applications.
- The presentation remains keyboard accessible and retains the packet choice so the visitor can retry deliberately.

### Epic 2 — Complete the source-backed form manually

#### CA-FORM-01 — Understand active requirements and progress

As an applicant, I want to see which questions currently apply and why so that I can complete the form without an agent.

Acceptance criteria:

- Draft initially shows six active fields. Before dependency `Yes`, guardian name and household size controls are absent from the editable form; a collapsed **Not currently required** summary names both with status **Not required**, so the eight-field program remains understandable without exposing unusable controls.
- Each active evidence-required field identifies the allowed source document or documents and begins as **Missing — choose a source** unless a valid source binding is already saved.
- Saving dependency `Yes` reveals guardian name and household size, moves the count to eight active fields, and announces the change to assistive technology without moving focus unexpectedly.
- Progress counts only ready active fields. It never counts inactive fields, unsaved local text, a proposed email without declaration, or unresolved income.
- The blocker summary uses the same terms as the affected fields and links or moves focus to the first relevant control.
- A returning current page reconstructs the authoritative saved answers and statuses instead of relying on stale visual state.

#### CA-FORM-02 — Bind evidence-required answers through visible sources

As an applicant, I want to choose a permitted source claim rather than type an unsupported value so that each required answer remains auditable.

Acceptance criteria:

- Legal name, student ID, institution, dependency, guardian name, household size, and household income cannot be satisfied through arbitrary free-text entry or applicant declaration.
- An allowed choice displays the normalized candidate value, source document, page number, and an action to inspect the exact excerpt before saving.
- Saving a source choice changes the field to **Source linked**, or **Corroborated by 2 sources** only when the accepted income sources agree under the product rules.
- Re-selecting the same source is idempotent from the applicant's perspective: it does not create duplicate attribution, duplicate activity, or a phantom revision.
- Choosing another allowed source deliberately replaces the binding and makes any affected prepared review invalid before a new review can be submitted.
- If the source claim is no longer part of the current parsed packet, the save is refused as **Evidence unavailable** and no answer changes.

#### CA-FORM-03 — Inspect exact evidence in context

As an applicant, I want to inspect the exact text behind a candidate so that I can judge whether the source supports the displayed answer.

Acceptance criteria:

- Opening evidence shows the document title, one-based page, normalized value, and exact inert text excerpt together.
- The evidence view distinguishes normalized value from exact source text and never suggests that normalization changed the source document.
- Closing the evidence view returns focus to the control that opened it. Escape, close button, and keyboard navigation work without trapping focus.
- Exact source text is rendered as text, never interpreted as markup, executable content, a link, or an instruction to an agent.
- Raw PDF bytes, complete document text, storage locations, and unrelated excerpts are not exposed through assisted access. The human-visible evidence view remains available without WebMCP.
- At 320 CSS pixels and 200% zoom, the source identity and exact excerpt remain readable without loss of controls or two-dimensional page scrolling.

#### CA-FORM-04 — Exercise the dependency branch safely

As an applicant, I want conditional questions to follow my dependency answer so that the form includes what applies and excludes what does not.

Acceptance criteria:

- Saving dependency `Yes` activates guardian name and household size in the same authoritative change and updates requirements before a later action can assume the old branch.
- Both Supported and Conflict packets take this `Yes` branch in the committed demonstration data.
- If a human clears the saved dependency binding while either conditional field contains a saved value, CiteApply requires a visible confirmation that the dependency, guardian name, and household size will be cleared and the two conditional fields excluded.
- Cancelling that confirmation preserves the dependency and both conditional values unchanged.
- Confirming the change clears both values, excludes them from readiness, review, submission, and receipt, and announces the result.
- Assisted access cannot silently close a populated conditional branch. An assisted request that would require that destructive confirmation is refused with no changes.

#### CA-FORM-05 — Handle agreeing and disagreeing income sources

As an applicant, I want the portal to distinguish corroboration from contradiction so that it never chooses a financially significant value merely because an agent asked.

Acceptance criteria:

- In Supported, both income excerpts display INR 480,000. The Synthetic Income Statement is the canonical binding and the Synthetic Household Statement appears as corroboration.
- Supported income displays **Corroborated by 2 sources** and does not ask the applicant to manufacture a conflict reason.
- In Conflict, the household statement displays INR 480,000 and the income statement displays INR 540,000. Neither value is selected automatically.
- Conflict shows **Income sources disagree**, both exact source excerpts, a single selection between the two accepted values, and these exact ordered reason choices: `more_recent` — **This document is more recent**; `corrected_record` — **This document contains the corrected amount**; and `confirmed_for_application` — **I confirmed this amount for this application**.
- **Use selected income source** stays unavailable until both a source and reason are selected. Saving records the applicant's resolution and changes the field to a ready, visibly human-resolved state.
- Before the first commitment, a partial local selection keeps **Conflict — your choice required** and adds **Selection not saved**. After commitment the field shows **Source linked · Resolved by you**, chosen document/page, amount, and visible reason label.
- Starting a change to a committed resolution preserves the saved resolution, adds **Selection not saved**, and blocks Review. **Discard changes** restores the committed source/reason. **Use selected income source** atomically replaces both. **Clear resolution** requires a deliberate human action, clears income and reason together, and returns the field to **Conflict — your choice required**.
- The agent can discover that a conflict exists but cannot select the source, choose the reason, or invoke a semantic equivalent of the human resolution.
- Editing or invalidating a resolved source later clears or updates the resolution as necessary; an obsolete resolution cannot survive into review.

#### CA-FORM-06 — Save and declare the synthetic email

As an applicant, I want to declare the one human-provided contact value myself so that agent assistance cannot assert a personal declaration on my behalf.

Acceptance criteria:

- The only allowed email is a syntactically valid `.test` address. The fixed demonstration value is `anaya.rao@example.test`.
- An applicant may type and save the email; an agent may propose that exact bounded value. Neither path makes the field ready until the applicant activates **Declare this email** for the exact saved value.
- Before declaration, the status is **Needs your declaration**. After the visible human action it is **Declared by you**.
- If local email text differs from the saved value, the field displays **Unsaved — not in your application**, Review is blocked, and the page offers explicit Save and Discard choices.
- Saving a changed email invalidates the prior declaration. Discard restores the exact saved value and its authoritative declaration state.
- No WebMCP operation can create, forge, replay, or infer the declaration. A request that includes declaration intent is refused without changing the email or any other batched answer.
- Email values do not appear in URLs, browser storage, analytics, console output, or diagnostic error text.

#### CA-FORM-07 — Reach readiness manually without WebMCP

As a participant without a compatible agent, I want the entire application to remain complete so that WebMCP is an enhancement rather than a requirement.

Acceptance criteria:

- Selecting **Continue manually**, declining consent, revoking consent, or using an unsupported browser never disables packet parsing, field completion, evidence inspection, conflict resolution, email declaration, Review, Return, submit, or receipt export.
- Unsupported WebMCP produces one nonblocking explanation and does not repeatedly interrupt the form.
- For identical authoritative application content, manual and assisted paths display the same field status, blocker count, application-content hash, and submitted application content. They use the same Receipt schema/projection, while the assisted-attribution/activity section truthfully differs when assistance occurred.
- The manual Conflict journey can progress from packet selection to a matching receipt using visible controls only.
- No hidden tool invocation, automation-only route, or test harness action is required for manual completion.

### Epic 3 — Give informed, revocable assisted access

#### CA-CONSENT-01 — See exactly what assisted access permits

As an applicant, I want a complete disclosure before protected access so that I understand the categories and actions I am authorizing.

Acceptance criteria:

- Draft presents **Allow assisted access?** before any protected value-bearing tool result can be released.
- The disclosure identifies this current synthetic application, this current page, and this 60-minute session as the maximum authority boundary.
- The primary disclosure uses applicant language, not protocol terms, and includes this literal substance: **The assistant may receive your saved form answers—including the preferred contact email—and values extracted from the three synthetic records, including name, student ID, institution, household details and income. It may also receive document names/pages, which questions currently apply and their source rules, current blockers and limited review status. CiteApply's assisted tools may link allowed sources to draft answers and propose the synthetic email.**
- It then states: **CiteApply's six assisted tools will not receive full PDFs, complete excerpts, your declaration record, conflict choice or reason, full review, confirmation, submission or exports. Those tools cannot choose a packet, make your declaration, resolve the income conflict, return from Review, confirm, submit or export. Because current blockers and limited readiness are included, the assistant may learn that a required human step is complete, but not the private conflict choice or reason.**
- It also states: **This choice controls only CiteApply's six assisted tools. It does not change permissions you separately grant your browser, extension or assistant.**
- Its revocation limitation states: **Revoking blocks new access, but an action CiteApply already accepted may still finish, and information already returned cannot be recalled. If a request stops waiting after CiteApply received it, the page checks the saved application instead of promising that the action was cancelled.**
- A secondary **Technical details** disclosure may explain current-page/session authority and final-authorization ordering, but those terms cannot replace the plain-language text.
- Visible-copy completeness tests assert every included category, allowed action, exclusion, separate-permissions caveat, and in-flight limit. The disclosure is fully reachable/readable by keyboard, and the canonical Conflict VoiceOver pass verifies heading, scope, choices, and exclusions before Allow.

#### CA-CONSENT-02 — Choose assisted or manual continuation

As an applicant, I want a real choice so that an agent cannot force access by discovering tools.

Acceptance criteria:

- The visible choices are **Allow assisted access** and **Continue manually**. Neither is preselected, visually hidden, or described as required to finish.
- Before Allow, protected modes and state-changing operations return a value-free `consent_required` outcome. The result contains no applicant value, evidence value, active-field inference, saved blocker detail, or authority-bearing identifier.
- Two safe discovery modes are intentionally available before Allow: redacted `get_application_state` may return only access status `consent_required` and the stage-agnostic safe next action **Use the visible CiteApply application**; the visible Draft application itself continues to offer **Allow assisted access** and **Continue manually**. This machine action stays truthful after Draft because it does not promise that Allow is currently available, and it never varies by protected stage. `get_form_requirements` with mode `all` may return the eight static field names, policy classes, conditional relationship, and accepted document classes. Neither mode returns packet identity, stage, active/inactive status, application or requirements versions, progress, values, claims, handles, blockers, activity, or review metadata.
- Tool discovery alone does not create consent or reveal protected values.
- Allow changes the assistance overlay to **Allowed for this page/session** and makes the current authority visible near the application status.
- Continue manually leaves assistance Off and dismisses the disclosure without harming the manual path. The applicant may choose Allow later while Draft and current.
- If WebMCP is unavailable, the choice is not faked; assistance shows **Unavailable** and manual completion remains intact.

#### CA-CONSENT-03 — Revoke access with honest race semantics

As an applicant, I want to stop future assisted access so that I retain understandable control even when a call is already in flight.

Acceptance criteria:

- While access is allowed, **Revoke access** is visible and keyboard reachable.
- If Revoke becomes authoritative before a protected operation's final authorization, that operation returns a value-free consent refusal and produces no protected effect.
- If the operation's final authorization becomes authoritative first, its bounded result or complete atomic effect may arrive after Revoke. CiteApply does not claim to retract it.
- The application ignores stale-page visual callbacks and rereads current state when an outcome is uncertain.
- Revoke turns assistance Off without clearing valid saved application answers or applicant decisions.
- Later protected calls require a fresh visible Allow while the same page remains current. A request identifier from the prior authority cannot bypass the new consent boundary.

#### CA-CONSENT-04 — Clear assistance at every authority boundary

As an applicant, I want temporary authority to end predictably so that consent does not silently survive a context change.

Acceptance criteria:

- Refresh, a newer-page takeover, successful Review preparation, Return from Review, submission, and session expiry all leave assistance Off.
- A restored page never displays allowed access until the applicant performs a new Allow action on that page.
- The old page becomes **Stale page**, is read-only, and cannot regain authority through a protected call, browser back navigation, or a delayed callback.
- Review and Receipt do not offer Allow because assisted mutation is outside those stages.
- The product does not describe consent as account-wide, device-wide, browser-wide, or reusable across applications.

### Epic 4 — Let an agent compose within portal policy

#### CA-ASSIST-01 — Discover one truthful six-operation capability

As an external client, I want a small semantic contract so that I can collaborate with the visible application without scraping controls or receiving hidden submission power.

Acceptance criteria:

- A compatible client discovers exactly six CiteApply operations for current state, requirements, evidence index, evidence-backed answer application, validation issues, and Review preparation.
- Their locked names are `get_application_state`, `get_form_requirements`, `get_evidence_index`, `apply_evidence_backed_answers`, `get_validation_issues`, and `prepare_submission_review`.
- Operations are registered once for the current application experience; navigation or rerendering does not create duplicate names or ghost capabilities.
- Descriptions accurately distinguish reads, state-changing draft composition, and Review preparation, and explicitly state required consent and human-only exclusions.
- There is no semantic operation for packet selection, exact source-excerpt retrieval, declaration, conflict resolution, Return, confirmation, submission, receipt access, JSON export, or print.
- The visible manual interface remains the source of truth for human-only actions; the product never presents a scripted animation as an external invocation.

#### CA-ASSIST-02 — Read state, rules, and evidence separately

As an agent, I want separate bounded views of saved state, current requirements, and normalized claims so that I must compose across the site's semantics instead of receiving a precomputed answer sheet.

Acceptance criteria:

- After Allow, the current-state result identifies the authoritative stage, revision, active field statuses, saved values where allowed, assistance state, and blocker count without embedding requirements or source excerpts. After the applicant resolves Conflict income, every agent-facing state projection exposes only **ready · human action complete** for that field—never the resolved amount, source, reason/category, or history. Before Allow it has only the redacted mode defined in CA-CONSENT-02.
- The requirements result in protected `active` mode identifies currently active fields, accepted source categories, evidence/declaration/human-resolution policies, and the current requirements version without assigning claims to answers. Its public static `all` mode is packet/application-value independent and has only the fields defined in CA-CONSENT-02.
- The evidence-index result lists the eight normalized packet claims with bounded document/page/source identifiers and normalized values, but not raw PDFs, complete excerpts, or a portal-authored field-to-claim answer map.
- Dependency `Yes` changes the active requirements. An agent that read the six-field version must reread before safely composing the two revealed fields.
- Every protected read applies current session, page, and consent authority before releasing values. A replay request cannot project a prior value-bearing result after authority has ended.
- Results are bounded and deterministic for the fixed packet; they do not include model-generated explanations or undocumented fields.

#### CA-ASSIST-03 — Apply valid draft changes atomically

As an applicant, I want an agent's proposed batch to be evaluated as one portal-controlled change so that I never receive a half-applied form.

Acceptance criteria:

- A batch names the expected current application and requirements versions and references only claims returned by the current evidence index, plus the bounded email proposal where allowed.
- All entries are checked against active requirements, source policy, current authority, and human-only boundaries before any entry is committed.
- If every entry is valid, the complete batch appears as one authoritative application revision and affected fields show **Updated through assisted access**.
- If any entry is stale, unavailable, conflicting, undeclared-as-human action, destructive branch close, malformed, duplicated inconsistently, or otherwise invalid, no entry in that batch changes.
- Repeating the exact accepted request does not create a second application change. Reusing its identifier with different content is refused as `request_reuse_mismatch`.
- An accepted change is visible in the ordinary form without refresh and survives an authoritative refresh. A test-only or agent-only state is not considered accepted.

#### CA-ASSIST-04 — Demonstrate the branch and reread

As a judge, I want to see an agent adapt after a conditional answer so that the demonstration proves live composition rather than one static fill call.

Acceptance criteria:

- The canonical first batch binds Anaya Rao, HZN-2026-0142, Northstar Community College, and dependency `Yes`.
- The visible application reveals guardian name and household size and changes the current requirements version.
- A second batch based on the earlier six-field requirements is refused as stale rather than silently applying against newly active fields.
- After a fresh state/requirements read, the canonical second batch binds Meera Rao and household size 4 and proposes `anaya.rao@example.test`.
- The resulting email is visibly **Needs your declaration** and cannot be reported as complete merely because the agent supplied its text.
- The trace and visible application establish the causal order: first batch, branch reveal, reread, second batch.

#### CA-ASSIST-05 — Refuse disputed income without collateral changes

As an applicant, I want the portal to refuse an agent's attempt to choose between contradictory sources so that the safety boundary is enforced by the website.

Acceptance criteria:

- Against Conflict, an assisted request to bind either income claim returns `conflict_requires_human`.
- The response identifies household income as requiring applicant action but does not select a value, forge a reason, expose the full excerpts, or alter another field.
- The application shows **Income was refused; no value changed.** and preserves the prior revision.
- Immediately before applicant action, validation and premature Review preparation report exactly two blockers: income conflict and email declaration.
- Against Supported, the same income policy accepts the canonical income-statement claim and records the household claim only as corroboration; there is no human conflict step.
- The distinction is driven by the parsed packet values, not by a special demo route or client-selected mode flag after application creation.

#### CA-ASSIST-06 — Prepare but never submit Review

As an applicant, I want an agent to help reach a reviewable snapshot without having submission authority so that I personally control the irreversible step.

Acceptance criteria:

- Validation reports a stable, ordered list of current blockers and produces no form change.
- Review preparation with any blocker returns `not_ready_for_review`, creates no review identity, keeps Draft editable, and shows the same grouped error summary. An external assisted attempt announces that summary once without moving the applicant's current focus; activating its first link moves focus to the first blocker. Applicant-activated **Review application** retains CA-REVIEW-01 focus behavior.
- Successful preparation creates one immutable current Review from the exact authoritative saved state, returns only a fresh opaque non-content-derived Review identity, readiness, and necessary current-version metadata, closes assisted access, and always enters the normal Review presentation. It returns no canonical content hash or other deterministic digest over declaration or conflict-resolution content. The Review heading receives programmatic focus and its status announces that assistance is Off.
- The agent receives neither the selected conflicting source, resolution reason text/category, conflict history, complete diff, exact evidence excerpts, declaration details, confirmation control, nor receipt. Where needed, it may learn only that the field is ready after applicant action.
- No later agent call can confirm or submit. The only acceptance action is the applicant-visible **Confirm and submit this review**.
- Manual **Review application** and assisted preparation apply the same readiness rules and produce the same canonical content hash for identical state.

### Epic 5 — Preserve applicant judgment and authorship

#### CA-HUMAN-01 — Keep declaration visibly human-only

As an applicant, I want the product to distinguish a proposed email from my declaration so that the final record does not misattribute an agent action to me.

Acceptance criteria:

- A proposed or saved email never receives **Declared by you** until the applicant activates the visible declaration control on the current page.
- The declaration presentation repeats the exact saved email and explains that the applicant is asserting it as the preferred contact for this synthetic application.
- The declaration action cannot be bundled with another manual save, assisted apply, Review preparation, or submission.
- Changing the saved email removes the previous declaration immediately and blocks Review until the new exact value is declared.
- Returning from Review preserves a still-matching declaration; changing the email afterward invalidates it.
- Activity and Review attribute the declaration to the applicant-facing action, not to assisted access.

#### CA-HUMAN-02 — Keep conflict resolution visibly human-only

As an applicant, I want to compare both accepted income sources and record my bounded reason so that the portal preserves a meaningful judgment rather than hiding a model guess.

Acceptance criteria:

- The comparison is available in the normal UI even when no external client is connected.
- Both choices include document name, page, normalized amount, and exact excerpt; neither choice receives visual priority based on packet order or agent preference.
- The bounded reason choices are understandable and do not invite free-form personal data. The selected reason is shown again in Review and Receipt.
- One deliberate **Use selected income source** action saves the source, value, and reason together. Partial local selections do not count as a resolution.
- Agent requests, URL parameters, browser storage, delayed callbacks, or replayed request identifiers cannot invoke or manufacture the resolution.
- If the underlying selected claim is unavailable or the packet identity changes, the resolution is rejected or invalidated; it cannot be silently reassigned to the other amount.

#### CA-HUMAN-03 — Make every assisted effect legible

As an applicant, I want to know what assistance changed so that I can inspect rather than blindly trust the draft.

Acceptance criteria:

- Every value originating in an accepted assisted batch shows **Updated through assisted access** for the lifetime of that saved value, including Draft and Review, until the applicant manually replaces or clears it; this label never substitutes for source status.
- A bounded activity presentation identifies allowed/revoked events, accepted assisted batches, refusals, and successful Review preparation without displaying secrets or full source excerpts.
- An atomic batch appears as one event with the affected field names; it does not imply that refused entries succeeded.
- Refusal messages explicitly say **no value changed** when the batch is rejected.
- The product never claims an AI checked truth, approved eligibility, or verified identity. It says the portal enforced its declared evidence rules.
- The Review diff makes agent-attributed changes inspectable alongside human changes without ranking either as inherently correct.

#### CA-HUMAN-04 — Avoid false personhood or browser-security claims

As a judge or operator, I want precise claims about control so that the demonstration is credible.

Acceptance criteria:

- Product and submission copy say that declaration, conflict resolution, Return, confirmation, submission, and export are absent from the semantic assisted contract and require visible UI actions.
- Copy does not claim cryptographic proof that a physical person clicked, immunity from privileged browser automation, prevention of all malicious extensions, legal consent, identity verification, or regulatory compliance.
- The product does claim and prove that its own WebMCP operations cannot perform those human-only domain actions.
- Security evidence distinguishes website-enforced authorization from client-side button visibility.
- Any future stronger assurance is described as future work, not as a completed hackathon capability.

### Epic 6 — Review, return, and prepare a fresh snapshot

#### CA-REVIEW-01 — Attempt Review from every Draft

As an applicant, I want a consistent Review entry point so that I can discover remaining work without an agent.

Acceptance criteria:

- Draft always exposes **Review application**, including when blockers remain.
- Activating it while blocked creates no review, shows the same ordered blockers as validation, and moves focus to the grouped error-summary heading. Activating the summary's first link then moves focus to the first affected field or action.
- In canonical Conflict immediately before the two human actions, the summary contains exactly income conflict and email declaration—no stale or duplicate blocker.
- Unsaved local email or reason input is a blocker and is clearly distinguished from a saved-but-incomplete value.
- Activating Review while ready creates an immutable current Review and turns assistance Off through the same behavior as assisted preparation.
- Repeated activation while a creation response is uncertain resolves to one current Review, not multiple visible reviews.

#### CA-REVIEW-02 — Inspect the complete immutable review

As an applicant, I want one coherent snapshot so that I know exactly what confirmation will submit.

Acceptance criteria:

- Review is read-only and shows all eight active fields in a fixed understandable order. Every field shows its initial-to-current change, final value, readiness and origin attribution, source document/page for evidence-required values, and an exact accessible excerpt or mandatory **View exact excerpt** control.
- It includes the applicant's exact declared email and declaration attribution. When a conflict existed, it shows both source claims and exact excerpts, the committed source and amount, the exact visible reason label, and **Resolved by you**.
- It includes the complete field-level diff, consent/activity summary, warnings, canonical application-content hash, and distinct current review identity. Preparation mechanism and path-specific activity are excluded from the canonical application-content hash; field values, active-field set, evidence bindings, declaration, and conflict resolution are included.
- Hashes and review identities appear under expandable **Technical details** with short plain-language references in the primary content; the applicant never needs to interpret a raw identifier to understand or act.
- The review identity is new on every successful preparation. Identical content may have the same canonical content hash without reusing the prior review identity.
- The only primary actions are **Return to application** and **Confirm and submit this review**. Review offers no editable fields or assisted-access control.

#### CA-REVIEW-03 — Return safely to Draft

As an applicant, I want to correct a review without losing valid work so that I can submit a fresh snapshot.

Acceptance criteria:

- **Return to application** invalidates the current review before Draft becomes editable, preserves valid saved answers/resolutions/declaration, and leaves assistance Off.
- A delayed or duplicate submit using the invalidated review returns `review_invalidated` and creates no submission.
- The returned Draft clearly says that the previous review can no longer be submitted and that changes require a new Review.
- Editing any review-covered value or decision keeps the old review invalid. Browser back cannot reactivate it.
- A new successful preparation creates a new review identity. If content is unchanged, the canonical content hash remains equal; if content changed, the hash changes.
- Only the single current valid review can reach submission.

#### CA-REVIEW-04 — Block stale or mismatched review confirmation

As an applicant, I want confirmation bound to the review I can see so that an old page cannot submit another snapshot.

Acceptance criteria:

- The exact confirmation is: **Submit this fictional application?** followed by **This submits Review `[short identifier]` exactly as shown. You cannot edit it afterward.** Its controls are **Cancel** and **Confirm and submit this review**.
- This confirmation is transient, contains exactly one commitment activation, and creates no durable confirmation, approval, or pending state.
- If the application revision, current review identity, canonical hash, session, or page authority no longer matches, confirmation is refused without creating a receipt.
- A stale page remains read-only and offers Reload rather than an enabled confirmation.
- A second tab taking authority clears the first tab's open confirmation presentation.
- Failed stale confirmation does not consume or invalidate the still-current review on the authoritative page.

### Epic 7 — Submit once and preserve one canonical receipt

#### CA-SUBMIT-01 — Require deliberate visible confirmation

As an applicant, I want a final explicit action so that reaching Review cannot itself submit the application.

Acceptance criteria:

- Review preparation, page navigation, external-client activity, Enter on an unrelated control, and refresh never submit.
- **Confirm and submit this review** uses a deliberate confirmation presentation that identifies the irreversible synthetic-demo action.
- While confirmation is being resolved, the control is not multiply enabled and the page does not announce success optimistically.
- Cancelling leaves the same current Review valid and produces no submission event.
- Successful confirmation creates one Submitted state and one receipt; the application is thereafter read-only.
- There is no persistent Confirmed, Approved, or Submission pending state before the accepted transaction.

#### CA-SUBMIT-02 — Recover honestly from an uncertain response

As an applicant, I want response loss to resolve against authoritative state so that I do not submit twice or see a false failure.

Acceptance criteria:

- If the visible human submission response is lost, the page says **We couldn't confirm the response. Checking whether your application was submitted. Do not submit again.** Assisted draft interruption uses the separate assistant wording in the Interruption journey and never appears as authorship of submission.
- While authority is reachable, **Checking latest state** resolves to Submitted with the existing receipt, the unchanged current Review ready for deliberate confirmation again, Stale page, or Session expired.
- CiteApply makes at most three automatic reconciliation attempts within ten seconds. If it still cannot retrieve current authority, it stops the busy presentation and shows **We couldn't load the latest application state. No new action is enabled until the current state is known.** The only control is **Reload current application**.
- An exact retry after a committed submission returns the existing canonical receipt rather than creating another submission.
- A changed or mismatched retry is refused and cannot project the prior receipt to an unauthorized page.
- If expiry finalizes first, submission returns `session_expired` and creates nothing. If submission final authorization wins first, one submission may commit even if its response arrives later; no new request is accepted after expiry and receipt access remains bounded by the original session deadline.
- If the access deadline passes while outcome remains unknown because connectivity is unavailable, Session expired says that CiteApply could not confirm whether the earlier action completed before expiry. It does not claim acceptance, enable resubmission, or introduce an out-of-band recovery token.
- The product never asks the applicant to reconcile encrypted tokens, approve a hidden phase, or reason about internal transaction states.

#### CA-SUBMIT-03 — Show one canonical receipt in three projections

As an applicant or judge, I want screen, JSON, and print to agree so that the submitted proof is internally consistent.

Acceptance criteria:

- The Receipt route begins with value-free **Checking receipt**. It claims neither Submitted nor failure until authenticated current application state establishes an accepted submission and its canonical receipt.
- Once authoritative, Receipt shows the accepted active fields, source bindings, email declaration, preserved conflict resolution when applicable, review content hash, accepted application revision, bounded assisted-activity summary, submission timestamp, and one receipt identifier.
- Screen, downloaded JSON, and printed semantic content derive from the same accepted receipt record. Formatting, ordering for presentation, and print pagination may differ, but values and identifiers may not.
- Inactive conditional fields never appear as submitted answers. Both committed packets include the active guardian branch.
- JSON download is a deliberate human-visible action and the only CiteApply-generated download containing receipt values. Browser printing, including **Save as PDF**, may create a user-controlled local copy outside CiteApply.
- Print uses the semantic Receipt page; it is not a separately generated PDF with divergent content.
- Refresh during the accessible session returns the same receipt. No later Draft or Review can be created for that application.

#### CA-SUBMIT-04 — Treat export failure as an export problem

As an applicant, I want a failed download or print attempt not to undermine the accepted application.

Acceptance criteria:

- If product-detectable JSON creation/delivery or print-view preparation fails, the primary stage stays Submitted and the screen receipt stays available.
- The page shows **Receipt export failed**, explains that submission remains accepted, and offers a bounded retry while the session is valid.
- Retrying export cannot create or modify a submission and cannot change the receipt identifier or content.
- Cancelling the browser print dialog, choosing Save as PDF, or encountering a local printer failure has no canonical CiteApply outcome and is never reported as application failure.
- After session expiry, CiteApply does not promise a new export; an already downloaded file remains the participant's responsibility.

#### CA-SUBMIT-05 — Load an accepted receipt without guessing

As an applicant, I want receipt loading to distinguish an unknown submission outcome from a temporarily unavailable accepted record so that I never receive unsafe resubmission advice.

Acceptance criteria:

- A value-free Receipt shell that has not established Submitted remains **Checking receipt**, exposes no receipt value, and never offers Submit.
- If current authority says Draft or Review, the page returns to that authoritative Application state; it does not label the earlier action failed or create a second confirmation automatically.
- If current authority establishes Submitted but receipt retrieval temporarily fails, show **We couldn't load your receipt. Your submission remains accepted.** with **Try loading receipt again**. No Submit control is present.
- If neither current state nor receipt can be reached after the bounded three-attempt/ten-second reconciliation, show Connection unavailable with **Reload current application** and no acceptance claim.
- Expiry overrides Receipt loading. Unauthenticated or cross-session shell access remains value-free and cannot reveal whether a receipt identifier exists.
- Refresh, response loss, temporary receipt unavailability, unauthenticated shell access, and expiry each have browser coverage.

### Epic 8 — Remain safe and understandable under interruption

#### CA-RECOVER-01 — Make newer-page takeover explicit

As an applicant with two tabs, I want one authoritative page so that delayed actions cannot overwrite newer work.

Acceptance criteria:

- When a newer page becomes authoritative, the older page changes to **Stale page** with **Reload** and turns every state-changing control read-only.
- Stale presentation may show previously rendered values but says they may be out of date. It does not fetch or reveal new protected values.
- A protected operation whose final authority check loses to takeover returns `stale_page` without a state change or value-bearing result.
- An operation whose final authority wins first may complete; the stale page reconciles without applying a delayed optimistic callback.
- Reload fetches saved state and becomes the sole authoritative page if the session remains valid; it does not create collaborative authority. Draft requires a fresh assisted-access Allow.
- Page takeover never duplicates the application, review, submission, or receipt.

#### CA-RECOVER-02 — Resolve stale versions and request reuse

As an agent or applicant, I want stale work rejected predictably so that a delayed request cannot overwrite newer state.

Acceptance criteria:

- A well-formed state-changing request based on an old application or requirements version returns `stale_state` and applies nothing.
- The result supplies only bounded current version metadata needed to reread; it does not leak protected values after authority loss.
- Exact request replay under current authority returns the already committed bounded result without another effect.
- Reusing a request identifier with different canonical content returns `request_reuse_mismatch` and applies nothing.
- Human edits and assisted batches follow the same lost-update protection from the applicant's perspective.
- The recovery instruction is to reread current state and requirements, never to force the old change.

#### CA-RECOVER-03 — Apply deterministic authority precedence

As a security reviewer, I want concurrent losses of authority to produce stable outcomes so that error ordering cannot leak data or bypass policy.

Acceptance criteria:

- For otherwise well-formed protected operations, final outcomes use this visible precedence: `session_expired`, then `stale_page`, then `consent_required`, then request/version errors, then domain-policy errors.
- An expired call cannot reveal whether consent existed, which field conflicted, or whether a request identifier was previously used.
- A stale page cannot use a prior consent to obtain current values or replay an earlier value-bearing result.
- A revoked current page receives value-free consent refusal before domain details.
- Malformed public envelopes may receive bounded input errors without inspecting protected application state; test evidence distinguishes that validation boundary from the protected precedence above.
- Every raced outcome is one complete effect or no effect. Partial batches, half-created reviews, and duplicate receipts are prohibited.
- For protected reads, apply, Review preparation, submit, receipt fetch, and export: expiry-first returns `session_expired` with no new protected result/effect; final-authorization-first may complete and its response may arrive after the deadline, but no new request is accepted after expiry.
- Read, apply, and Review preparation are tested in both final-authorization-first and authority-loss-first order across Revoke, successful Review close, newer-page takeover, and expiry.
- If Review preparation commits before response loss, exactly one Review exists, assistance is Off, and the normal UI reveals it after reconciliation. A replay after Review closed cannot redisclose protected preparation metadata.

#### CA-RECOVER-04 — Bound the public synthetic demo without workflow growth

As an operator and legitimate participant, I want the fixed demo to reject oversized or excessive public use safely without adding user-visible workflow machinery.

Acceptance criteria:

- Public session creation is admission controlled. A refused start shows Landing-only **At capacity**, creates no application, and supplies a safe retry time.
- The product accepts only the two fixed packets, their six allowlisted bounded PDFs, eight known fields, bounded reason choices, bounded request bodies, and bounded result/activity summaries.
- Oversized, excessive, cross-session, or non-allowlisted requests fail closed without partial state, applicant values in errors, or a claim that work was saved.
- When the bounded synthetic-session ledger cannot admit a non-closing change without consuming the remaining manual closing path, `demo_change_limit` saves nothing, consumes no request identity, exposes no number, and directs the participant to finish in the visible application or start a new synthetic demo. It is not a stage, quota display, or retry promise.
- Exact replay and response-loss recovery preserve the normal idempotency contract; throttling cannot convert one accepted action into a duplicate or contradictory outcome.
- Request throttling is a public value-free transport preflight outside protected-operation authority precedence. It performs no application, session, page, consent, request-replay, or domain lookup and may therefore return **Please wait before trying again** before any authority outcome. It changes nothing, supplies only a bounded `Retry-After`, and clears the local busy indicator. After the delay, a fresh admitted request follows `session_expired` → `stale_page` → `consent_required` → request/version → domain precedence; a state-changing client rereads rather than blindly resending uncertain work. G3 may choose counters and thresholds, but not this visible ordering or add workflow meaning.
- The ordinary manual and assisted journeys remain usable without numerical call/change/review counters becoming applicant workflow states.
- Detailed rate, payload, output, and admission thresholds belong to the security/technical specification and must fit the locked `rate_buckets` admission path, existing page/API/table/race caps, and public-demo load evidence. They cannot add a new persistent application stage or hackathon feature.

#### CA-RECOVER-05 — Keep sensitive values out of ambient surfaces

As an applicant, I want application values confined to the authenticated experience so that routine navigation and diagnostics do not spread them.

Acceptance criteria:

- Applicant values, normalized claims, exact excerpts, session secrets, review identifiers capable of authority, and receipt content do not appear in URLs or referrers.
- Browser local/session storage, caches intended for offline reuse, analytics payloads, console messages, server diagnostic messages, and public error pages contain no application values or exact excerpts.
- Error outcomes use bounded codes and safe copy. They do not echo submitted payloads.
- Exact excerpts are inert and only shown inside the current human evidence/review experience; assisted evidence results expose normalized bounded metadata only.
- The JSON receipt is an explicit applicant-initiated exception and is labelled as containing the synthetic submitted record.
- Synthetic status reduces real-person risk but does not relax these handling requirements.

#### CA-RECOVER-06 — Treat native abort as stopped waiting, not rollback

As an applicant, I want an interrupted assisted request reconciled honestly so that stopping the client wait does not create a false cancellation or a blind duplicate.

Acceptance criteria:

- If the client signal is already aborted or aborts before dispatch, no request reaches CiteApply, no activity entry is created, and no application effect occurs.
- If abort happens after server acceptance, the client reports only **The assistant stopped waiting. This action may have completed.** A protected read may yield no result or one already-final-authorized bounded result; a state-changing operation may have no effect or exactly one complete atomic effect. There is never a partial batch, duplicate effect, rollback claim, or guaranteed cancellation.
- The interrupted action's retry control remains disabled. CiteApply uses the existing three-attempt/ten-second authoritative reconciliation before permitting any newly computed action.
- Deterministic browser/contract barriers prove both pre-dispatch and post-server-acceptance cases for protected read, apply, and Review preparation, including response loss after a committed effect.
- This behavior reuses the existing operations and authority/replay race family. It must not introduce a server cancellation request, tombstone, durable cancellation state, rollback protocol, page stage, API family, table, or additional PostgreSQL concurrency-proof family.

## Observable Failure And Recovery Contract

The contract separates machine/domain outcomes, nested readiness blockers, and human/browser presentations. Protocol-level schema failures may use the selected WebMCP client's standard bounded validation presentation, but they must not inspect or echo protected state. New domain meanings or persistent states require G2 reopening rather than ad hoc strings during implementation.

### Machine and shared domain outcomes

| Outcome | When it is observable | Effect | Required recovery |
|---|---|---|---|
| `consent_required` | A protected final authorization finds no current Allow | No protected value and no protected effect | Applicant may Allow visibly in current Draft or continue manually |
| `stale_page` | A newer page owns authority | No new protected value/effect from the losing operation | Reload current state; Allow again if desired |
| `session_expired` | The 60-minute boundary wins final authorization | No new protected result/effect | Start a new synthetic demo |
| `stale_state` | Expected application or requirements version is no longer current | Entire request applies nothing | Reread state and requirements, then recompute |
| `request_reuse_mismatch` | One request identity is reused with different canonical intent | Applies nothing | Use a fresh identity after rereading; never force the mismatch |
| `evidence_unavailable` | A claim/source is absent, inactive, or no longer accepted | Entire request applies nothing | Inspect current accepted evidence and choose again |
| `conflict_requires_human` | Assisted access attempts disputed income resolution | Entire request applies nothing | Applicant resolves through the visible comparison |
| `not_ready_for_review` | One or more current readiness blockers remain | No Review exists | Return the ordered nested blockers; complete them in Draft |
| `review_invalidated` | Visible Return invalidated the named Review, or the supplied Review is no longer current | No submission | Prepare and inspect a fresh current Review |
| `demo_change_limit` | Another non-closing change would consume the bounded demo's remaining manual closing path | No operation, request reservation, or saved change | Finish the remaining visible steps with a fresh request identity, or start a new synthetic demo |

Current authority precedes request/version and domain detail. For otherwise well-formed protected calls, precedence is `session_expired`, `stale_page`, `consent_required`, request/version errors, then domain-policy outcomes. Exact authorized replay produces no second effect, but current authority may refuse redisclosure.

### Nested readiness blocker codes

`not_ready_for_review` contains an ordered list drawn only from `missing_evidence`, `conflict_requires_human`, `declaration_required`, `invalid_email`, and `unsaved_changes`. In the canonical Conflict journey immediately before human action, the list is exactly `conflict_requires_human` for annual household income followed by `declaration_required` for preferred contact email. A nested blocker is not a separate Review-preparation result.

### Human and browser presentations

| Presentation | Claim and recovery |
|---|---|
| **Parse failed** | No application exists; **Return to packet selection** |
| **WebMCP unavailable** | No assisted capability is claimed; **Continue manually** |
| **At capacity** | Landing-only admission refusal; no application exists; retry at displayed time |
| **Checking latest state** | Bounded, non-authoritative reconciliation; all mutation/submit controls disabled |
| **Connection unavailable** | Latest authority is unknown after three attempts/ten seconds; **Reload current application** |
| **Checking receipt** | Value-free Receipt shell; no Submitted claim until authenticated state is known |
| **Receipt unavailable** | Submitted is already authoritative; **Try loading receipt again** |
| **Receipt export failed** | Only product-detectable JSON delivery or print-view preparation failed; receipt is unchanged; retry export |
| **Stale page** | Rendered values may be old and controls are read-only; **Reload** |
| **Session expired** | New application/receipt access is closed; **Start a new synthetic demo** |

Additional copy and behavior rules:

- A refusal never uses success styling, never increments ready progress, and never applies optimistic values that later disappear.
- When a whole batch is rejected, the visible message says **no value changed**. It does not imply that earlier entries succeeded.
- A safe refusal contains field names only when current authority permits that detail. Authority-loss outcomes are value-free and precede domain detail.
- Recovery actions are specific: Reload current application, Return to packet selection, Continue manually, Allow assisted access, inspect the named blocker, try loading the already-accepted receipt, retry export, or Start a new synthetic demo. Generic **Try again** is insufficient when it could duplicate an effect.
- Machine/domain codes are available to relevant clients and tests. Technical identifiers/codes are secondary details; primary human copy explains meaning and recovery without requiring protocol knowledge.
- Unknown internal failures show safe generic copy, one support-safe correlation reference, no stack trace/payload, and a context-safe recovery control. They cannot be relabelled as a known success/failure unless that outcome is authoritative.

## Cross-Cutting Product Requirements

### Accessibility and inclusive interaction

CiteApply is not complete if a keyboard or screen-reader participant can only watch the assisted path. All authoritative human actions must remain operable and understandable without pointer precision, color perception, animation, or WebMCP.

- Every Landing, Parsing, Parse failed, Draft, consent, evidence, conflict, declaration, stale-page, Review, confirmation, Submitted, Receipt export failed, and Session expired presentation has one programmatically identifiable page heading and a meaningful document title.
- Fields have persistent text labels, descriptions, error association, and status text. Color and icons may reinforce but never carry the only distinction among ready, missing, conflict, unsaved, declared, and inactive.
- All actions are keyboard reachable in a logical order. Visible focus is never hidden by sticky content, dialogs trap and restore focus correctly, and no flow requires drag, hover, or timing-sensitive input.
- Dynamic changes such as branch reveal, saved batch, conflict refusal, blocker count, stale takeover, review creation, and submission are announced once with concise live-region text. Routine countdown changes do not create announcement spam.
- On applicant-activated failed Review, focus moves to the grouped error summary and the summary links to the first blocker. An external assisted refusal updates and announces that summary without moving the applicant's focus. On field save failure, focus stays at the affected context. On dialog close, focus returns to the opener.
- At 320 CSS pixels, the entire journey works without missing information or horizontal page scrolling, except that an inert exact source line may wrap. At 200% browser zoom, content reflows and controls remain available.
- Reduced-motion preference removes nonessential transitions and preserves state-change clarity. There is no auto-advancing content, flashing content, or motion required to understand an agent action.
- Text and interactive contrast meet applicable WCAG 2.2 Level A/AA requirements. Touch targets and spacing avoid accidental adjacent activation.
- Full keyboard/focus/semantic coverage and automated A/AA checks cover every primary and exceptional presentation. One complete VoiceOver pass covers the canonical Conflict journey through consent, assisted mutation/refusal, human resolution/declaration, Review, submission, and Receipt; one manual/no-WebMCP fallback smoke confirms source selection, Review entry, and focus/error behavior.
- Any known material WCAG A/AA defect blocks the relevant stage and public release. Accessibility evidence records tool versions, manual checks, defects, and remediation rather than only a score.

### Responsive and visual quality

- The three-page experience has one coherent visual system for type, spacing, focus, source cards, statuses, warnings, and primary/secondary actions.
- Synthetic/demo context remains visible without overwhelming the task. Safety boundaries read as product language, not as raw protocol or legal boilerplate.
- Long identifiers and exact excerpts wrap without covering actions. Currency is displayed consistently as INR with unambiguous separators and an accessible full-text label.
- Busy states preserve context and identify the operation. Parsing, saving, preparing Review, submitting, and checking latest state never show an unexplained blank page.
- Skeletons or animation cannot display fabricated applicant values. Authoritative values appear only after the corresponding state is known.
- Desktop judge presentation is polished at the recorded viewport, while mobile-width behavior remains fully functional.

### Performance and feedback

- A pointer or keyboard activation receives visible acknowledgement within 100 milliseconds unless navigation replaces the view immediately.
- When an ordinary save, validation, review preparation, submission, or receipt retrieval exceeds one second, the affected action shows a named busy state and prevents ambiguous duplicate activation.
- Parsing may take longer than an ordinary save, but the page continuously names the three-document check and gives a safe failure rather than partial results.
- Three consecutive unedited primary-client runs of state, requirements, evidence, first apply, branch reread, second apply, issues, conflict refusal, and Review-preparation attempt each complete within 120 seconds under the release environment. Waiting may be compressed in the narrated video only when labelled; the raw trace is not edited.
- Performance tests cannot depend on precomputed production claims, production goldens, a hardcoded answer map, or a bypass path.
- Public-release verification records meaningful page and operation timings. The product makes no universal production SLA claim from hackathon measurements.

### Data integrity and consistency

- The visible page, assisted results, Review, accepted submission, Receipt screen, JSON, and print never disagree about the authoritative saved value or current stage.
- Evidence-required values always retain an accepted current source. Human resolution and declaration retain their distinct attribution.
- One accepted action advances state completely or leaves it unchanged. There are no partial batches, editable Reviews, multiple current Reviews, duplicate submissions, or divergent receipts.
- The canonical application-content hash includes the active-field set, final field values, evidence bindings and corroboration, applicant declaration, and conflict resolution. It excludes application/requirements revisions, preparation mechanism, assisted-origin attribution, consent/activity history, display-only ordering, review identity, and timestamps. Semantically identical application content therefore hashes equally across manual and assisted preparation; every preparation still receives a new review identity. This hash appears only in the human Review/Receipt and their human-initiated projections, never in an assisted result.
- Time, currency, identifiers, document/page labels, and statuses use one user-facing convention across all three pages and artifacts.
- Test fixtures may contain independently reviewed expected claims, but production behavior and the filmed demonstration must use the runtime parser and current saved state.

### Security and privacy behavior

- All protected disclosures and effects require current session, page, and consent authority at final authorization, with the precedence defined above.
- Human-only actions are absent from the assisted semantic surface and rejected if smuggled into an allowed action.
- Source text is treated as untrusted inert content. It cannot alter tool descriptions, application rules, or visible controls.
- Cross-site or unauthenticated requests cannot read or mutate application state. A copied value-free shell URL is not sufficient to retrieve a receipt.
- Public demo inputs are fixed or tightly bounded. No arbitrary upload, free-form personal narrative, executable document, external URL fetch, or general-purpose prompt is accepted.
- Rate/capacity refusals and session expiry fail closed without revealing another session's existence or data.
- Security claims are accompanied by negative tests for pre-consent, post-revoke, stale page, expiry, replay, mismatched replay, forged declaration/resolution, stale Review, duplicated submit, excerpt injection, and ambient-data leakage.

### Browser and external-client compatibility

- The manual journey works in the supported current desktop browser even when WebMCP discovery is absent or disabled.
- The exact primary external client, browser/runtime version, feature settings, discovery steps, and verification date are named in the release evidence and judge instructions.
- A compatible external client must discover the actual six operations, observe the real value-free pre-consent refusal, receive protected results only after visible Allow, and cause a genuine visible persisted Draft change in the same application.
- The exact primary external client must also complete at least one Supported run through canonical corroborated income, applicant email declaration, Review, visible submission, and matching Receipt. A harness cannot satisfy this proof.
- A product-owned harness may supplement deterministic contract tests but cannot be the only integration evidence and cannot appear in the video as the external client.
- If the exact primary client cannot complete the required sequence reliably, the stage fails and capacity/scope is reopened; a simulated invocation is not an acceptable fallback.

## Required Edge And Adversarial Scenarios

The specification and checklist must map each scenario below to deterministic automated coverage where feasible and to manual/external-client evidence where the boundary is inherently interactive.

1. Supported and Conflict parse successfully from all six committed PDF byte streams with independently reviewed exact anchors.
2. One changed production byte under the original hash, missing file, extra page, excessive bytes/text, unreadable content, and missing exact anchor each fail before application creation.
3. A test-only mutated PDF admitted under its own test hash through the same production parser/extractor produces the changed normalized value or exact anchor, while a static import/bundle assertion rejects production imports of goldens, precomputed claims, a claim manifest, or a hardcoded answer map.
4. Double Start and response loss during Start yield at most one visible application or an honest no-application retry.
5. One complete manual Conflict journey reaches Receipt without any hidden tool action; Supported manual behavior receives targeted source/corroboration and Review regression coverage.
6. Before Allow, redacted state and static `all` requirements expose only their locked public fields; every protected mode/action discloses nothing protected.
7. Allow then Revoke works visibly; later calls refuse, while final-authorization-first read may deliver its bounded result without a false retraction claim.
8. Read/apply/prepare each exercise both final-authorization-first and authority-loss-first against Revoke, Review close, takeover, and expiry; committed effects occur once and losing operations disclose nothing protected.
9. Response loss after a committed apply or Review preparation is reconciled by normal state; exact replay does not duplicate, changed replay is rejected, and closed authority cannot redisclose protected metadata.
10. Pre-dispatch/already-aborted barriers produce no request, activity, or effect. Post-server-acceptance abort produces no effect or one complete effect, disables blind retry, and enters bounded reconciliation without cancellation/rollback machinery.
11. Across all two-source × three-reason Conflict resolutions, agent-visible current state and assisted-preparation payloads are indistinguishable after normalizing current revisions and fresh opaque identities; no value, source, reason/history, canonical hash, or deterministic digest leaks the choice.
12. Dependency `Yes` reveals the two conditional fields and makes an old-requirements batch stale. Human branch clearing with populated values requires confirmation; agent branch clearing is refused.
13. Supported equal income becomes one canonical source plus corroboration. Conflict unequal income refuses assisted choice and preserves exactly two pre-human blockers.
14. Forged, replayed, assisted, or mismatched email declaration is rejected. Saving a changed email invalidates the prior declaration; Discard restores authoritative content.
15. Conflict source without reason, reason without source, unavailable source, local edit/discard, clear, Return/edit, and agent resolution produce the exact locked statuses/effects.
16. Review while blocked creates no identity; ready manual and assisted preparations from identical application content produce equal canonical hashes and distinct preparation identities.
17. Return invalidates the Review, preserves valid Draft work, closes assistance, and makes stale Review submission fail.
18. Two tabs race edit, Review preparation, Return, and confirmation; one page remains authoritative and the loser becomes read-only.
19. Double confirmation, exact retry, changed retry, response loss, and refresh create at most one submission and one canonical receipt.
20. Expiry exercises both orderings for protected reads, apply, Review preparation, submission, receipt fetch, and export: expiry-first refuses; final-authorization-first may complete and arrive later, with no new post-expiry request.
21. Receipt response loss, authenticated Submitted-but-temporarily-unavailable fetch, unauthenticated shell, refresh, and expiry produce the specified value-free or authoritative presentations.
22. Screen, JSON, and print compare semantically equal within each accepted Supported and Conflict submission, including identifiers, review hash, active fields, attribution, and conflict resolution.
23. Export failure leaves Submitted and the screen receipt unchanged; retry returns the same content.
24. Public admission refusal and oversized input/output fail closed. Deterministic cases combine the public throttle preflight with expired, stale, and unconsented requests; all receive the same value-free transport refusal with no application lookup/effect, while a fresh admitted post-delay request follows normal authority precedence. No case adds an application workflow state or corrupts replay/submission recovery.
25. Exact excerpts containing markup-like text, URLs, instructions, Unicode edge cases, or very long allowed lines remain inert, escaped, readable, and excluded from ambient logs.
26. Full keyboard, automated A/AA, 320-pixel, 200%-zoom, reduced-motion, focus, announcement, and contrast checks cover every presentation; VoiceOver covers canonical Conflict plus one manual-fallback smoke.
27. URLs, referrers, storage, cache inspection, analytics, console, error capture, and logs contain no applicant values, claims, exact excerpts, or authority secrets.

## What We Are Building

For the hackathon, CiteApply is exactly:

- one polished fictional Horizon Education Aid portal with Landing, Application, and Receipt pages;
- two fixed synthetic packets, each containing three runtime-parsed one-page text PDFs and the same eight-claim applicant;
- eight bounded fields, including one always-exercised dependency branch, one applicant declaration, and one supported-or-conflicting income policy;
- one complete visible manual journey and one real six-operation WebMCP collaboration over the same authoritative application;
- informed page/session consent, explicit Revoke, honest in-flight semantics, versioned atomic draft changes, and bounded activity;
- immutable Review, Return/edit/reprepare, one human-visible confirmation, one accepted submission, and one canonical screen/JSON/print receipt;
- deterministic domain, parser, integration, race, accessibility, privacy, build, and real-client verification evidence;
- a truthful public repository and Devpost package only after the explicit release authorization gate.

## Explicitly Not In This Build

- Real scholarship applications, real applicants, authentication accounts, document upload, OCR, arbitrary PDFs, or production personal data.
- Multi-program schemas, an admin/program builder, eligibility scoring, award decisions, reviewer workbench, notifications, or integrations with schools, aid systems, email, or identity providers.
- Shopping, general browser automation, cross-site actions, cloud-incident management, or support for websites that do not expose CiteApply's own semantic tools.
- A model-generated extraction pipeline, heuristic confidence UI, silent source selection, free-form conflict explanation, or a generalized evidence ontology.
- More fields, packets, pages, tools, persistent workflow states, API families, storage entities, or concurrency proof families than the locked scope permits.
- Dynamic tool registration, raw PDF/excerpt delivery to agents, agent packet selection, declaration, conflict resolution, Return, confirmation, submission, receipt access, download, or print.
- Server-side cancellation tombstones, two-phase confirmation, encrypted recovery tokens, persistent approval/confirmed/pending states, undo after submission, or immediate physical-deletion promises.
- Generated receipt PDF, pixel-identical screen/JSON/print formatting, universal browser/client compatibility, cryptographic proof of human action, or compliance certification.
- Claimed customer demand, measured ROI, reduced processing cost, completed user study, production readiness, or real-world adoption without collected evidence.
- Public deployment, public repository mutation, video upload, Devpost submission, provider provisioning, or external outreach before explicit user authorization.

## With More Time — Future Hypotheses, Not Stretch Scope

Future work begins only after hackathon submission and fresh validation. Candidate directions are real-program schema onboarding, authenticated applicant accounts, operator evidence-policy configuration, accessible upload/OCR review, reviewer source navigation, multilingual support, and additional receiving-site verticals. Commercial discovery would test whether scholarship operators pay to reduce incomplete applications, clarification contacts, and source-matching time. Community discovery would test whether an open reference implementation helps nonprofits and agent builders add constrained receiving-site automation safely.

None of these items may enter the hackathon build as a “small stretch.” Any future experiment needs its own privacy model, threat review, accessible journey, capacity estimate, and evidence. The present product wins by completing one credible closed loop rather than implying a platform it has not built.

## Judge Narrative And Demonstration Proof

### One-sentence thesis

**CiteApply lets an external agent compose a runtime-parsed synthetic source-backed scholarship draft through the website's own six semantic operations, while the website itself refuses contradictory evidence and reserves declaration, judgment, review, and submission for the visible applicant experience.**

### Why this is materially more than ordinary form filling

- The agent receives state, current rules, and normalized evidence separately and must compose them; it is not handed an answer map.
- One accepted mutation changes the live persisted form and reveals new requirements, which the agent must reread before continuing.
- The same operation that can accept corroborated income deterministically refuses conflicting income, leaving the website—not the model—in control of policy.
- Consent is server-observable: pre-consent and post-revoke calls return value-free refusals, and authority races have bounded honest outcomes.
- The agent may prepare the exact Review but has no semantic path to declaration, conflict judgment, confirmation, submission, or receipt.
- A non-agent participant can complete the identical product and reach the same submitted application-content model and Receipt schema; the assisted-activity section remains truthfully path-specific.

### Canonical sub-three-minute sequence

| Target time | Visible proof |
|---:|---|
| 0:00–0:08 | Labelled same-session cold open: external-client call causes a genuine visible Draft mutation |
| 0:08–0:22 | Start chronology; choose Conflict; show three real synthetic PDFs passing runtime parsing |
| 0:22–0:45 | Pre-consent refusal, visible disclosure/Allow, separate state/rules/evidence results |
| 0:45–1:05 | First batch, dependency branch reveal, reread, second batch, undeclared email |
| 1:05–1:26 | Separate income attempt refused with no change; validation shows exactly two blockers |
| 1:26–1:45 | Applicant compares sources, resolves income, and declares exact `.test` email |
| 1:45–2:08 | Agent prepares Review; access closes; applicant inspects and confirms visibly |
| 2:08–2:27 | Matching Receipt screen and JSON identifiers/content |
| 2:27–2:48 | Compact proof panel: manual parity, raw trace, test evidence, honest limitations |

The internal encoded-video maximum is 2:50, leaving at least ten seconds below the official limit for platform duration handling. The 0:00 cold open and later chronology use the same captured session and request; editing may reorder footage but cannot imply a different causal relationship. Any compressed wait is labelled. A complete unedited primary-client trace remains available as release evidence.

### Required proof artifacts

- Runtime-parser evidence for every committed PDF, independently reviewed golden anchors, changed-production-byte failure, a test-only accepted mutation whose parser output/anchor changes, and the production import/bundle anti-hardcoding assertion.
- Three consecutive unedited exact-primary-client runs under 120 seconds with all six operations discoverable and the required sequence complete.
- At least one complete Supported journey in the exact primary external client through corroboration, applicant declaration, Review, visible submission, and matching Receipt; a harness cannot satisfy it.
- Same-session call/result/UI correlation for pre-consent refusal, first persisted apply, branch reread, conflict refusal, Review preparation, and access closure.
- One complete manual Conflict/no-WebMCP release-evidence journey, plus targeted Supported manual corroboration/Review regression evidence.
- Deterministic race/replay/submission/receipt suites and a semantic screen/JSON/print comparison.
- Accessibility matrix with full automated/keyboard/reflow/reduced-motion/contrast evidence, one complete canonical-Conflict VoiceOver pass, and one manual/no-WebMCP fallback smoke.
- Privacy inspection covering URLs, storage, analytics, console, error capture, and logs.
- `docs/verification/impact-evidence.md` with observed task results and limitations. If no external user validation occurred, it must say **No user validation occurred** rather than imply a study.
- Exact release environment, primary client/version/settings/date, public HTTPS URL, public repository/commit, approved OSI license, setup instructions, narrated video URL, and Devpost requirement checklist after authorization.

## Official Release Acceptance

These requirements are normative but do not authorize external mutation. Public release passes only when:

- one usable public HTTPS deployment remains available through the official judging period;
- one complete public source repository points to the exact release commit, includes reproducible setup/judge instructions, and displays an Amit-approved OSI-compatible open-source license;
- one public YouTube video has audible narration, an encoded duration strictly below 180 seconds, and an internal target no longer than 2:50;
- release evidence names the exact tested external client/application, model where applicable, browser/runtime versions, feature settings, and verification date;
- judge instructions reproduce Supported, Conflict, and the complete manual/no-WebMCP journey without a harness standing in for genuine-client evidence;
- the Devpost entry includes the working URL, repository, video, tested-client list, WebMCP fit, human-agent collaboration, user-experience value, implementation explanation, limitations, and truthful AI-use disclosure;
- the complete submission is accepted before `2026-09-03T20:00:00Z` (`2026-09-04 01:30 IST`); and
- public name/license selection, repository creation or push, provider provisioning, deployment/origin configuration, video upload, Devpost mutation, and external outreach receive explicit user authorization by `2026-08-30T20:00:00Z`. If authorization is absent then, public release is no-go; authorization is never inferred from build permission.

## Success Measures

Hackathon success is demonstrated by evidence, not by forecasts:

- all six real operations are discoverable in the exact primary client, the canonical Conflict trace completes three consecutive times within 120 seconds, and one complete Supported primary-client run reaches a matching Receipt;
- the first accepted assisted batch visibly persists and reveals the dependency branch in the same application;
- the disputed income call is refused atomically, with no value changed and exactly two pre-human blockers;
- applicant-only resolution and declaration remove those blockers; agent or forged equivalents are rejected;
- assisted and manual preparation from identical state produce the same canonical content hash;
- Return invalidates the prior review, one visible confirmation produces at most one submission, and all receipt projections agree semantically;
- Supported, Conflict, complete manual, parser failure, stale-page, response-loss, expiry, public-capacity, connection-loss, receipt-load, and export-failure journeys pass their specified tests;
- no known material accessibility A/AA defect, privacy leak, fake integration, mismatching receipt, unremediated P0/P1 finding, or unsupported claim remains;
- the final submission is understandable in under three minutes and all public evidence is reproducible from the documented commit.

Commercial outcomes remain hypotheses. A post-hackathon pilot would measure incomplete-application rate, clarification contacts per application, reviewer source-matching time, applicant completion, and operator willingness to pay. The hackathon artifact may state these proposed measures but may not report improvement without a real study.

## G2 Exit Criteria

This PRD may move from Draft to Approved only when all of the following are true:

- it is consistent with the exact locked G1 scope hash and introduces no additional page, field, packet, tool, human-only action, persistent state, or product promise;
- every in-scope user journey has stable story identifiers and externally testable acceptance criteria;
- manual parity, informed consent, authority ordering, branch behavior, conflict refusal, declaration, Review/Return, single submission, receipt equality, expiry, bounded public admission/payloads, accessibility, privacy, and real-client proof are unambiguous;
- explicit non-goals prevent the historical specification from regrowing;
- the replacement technical specification can map every story to a bounded design without making new product decisions;
- independent product/UX, engineering/security/test, and Devpost-judge reviewers inspect the same exact SHA-256 artifact;
- every P0/P1 finding is remediated and each lane rechecks the final exact hash; P2 findings are either remediated or explicitly accepted with a documented reason;
- `reviews/02b-prd.md`, `build-notes.md`, `status.md`, `learner-profile.md`, `.devpost-hackathon-state.json`, and `AGENTS.md` identify the same gate result and next command;
- the final metadata-only status change is hash-checked again so that **Approved** never refers to an unreviewed byte sequence.

Status remains Draft until that review process completes. Approval authorizes only replacement technical specification work; it does not authorize implementation, deployment, external provisioning, publication, outreach, video upload, or Devpost submission.
