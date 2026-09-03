"use client";

import Link from "next/link";

import { ASSISTED_ACCESS_CATALOG } from "../../ui/components/consent.tsx";

/**
 * The page for whoever is bringing an assistant — a judge, a developer, or an
 * agent reading the site before it acts. Everything here is restated from
 * README.md, docs/JUDGE-TESTING.md and the descriptors the page registers.
 * No capability is claimed that the product does not already have.
 */

const TOOLS = [
  {
    name: "get_application_state",
    writes: false,
    untrusted: true,
    consent: "Redacted mode before consent; protected mode after",
    summary:
      "Reads the saved application. It never returns full source excerpts, the private conflict choice or reason, the declaration record, a confirmation, a submission, a receipt, or an export.",
  },
  {
    name: "get_form_requirements",
    writes: false,
    untrusted: false,
    consent: "All-fields mode before consent; active mode after",
    summary:
      "Reads the field policies: which questions apply and the rule behind each. It returns rules, not a field-to-claim answer map.",
  },
  {
    name: "get_evidence_index",
    writes: false,
    untrusted: true,
    consent: "After consent",
    summary:
      "Lists the packet's normalized claims as opaque handles. No raw PDF, full text, exact excerpt, storage path, answer map, review or receipt is returned.",
  },
  {
    name: "apply_evidence_backed_answers",
    writes: true,
    untrusted: true,
    consent: "After consent",
    summary:
      "Atomically links allowed handles to draft fields, and may propose the fixed synthetic .test email. The portal validates every entry or changes nothing.",
  },
  {
    name: "get_validation_issues",
    writes: false,
    untrusted: false,
    consent: "After consent",
    summary:
      "Reads the ordered readiness blockers. It changes nothing and returns no excerpt, private choice, declaration record or canonical hash.",
  },
  {
    name: "prepare_submission_review",
    writes: true,
    untrusted: false,
    consent: "After consent",
    summary:
      "Freezes a ready draft with no unsaved changes into a fresh immutable review, then closes assisted access. It returns opaque readiness metadata, not the review or its hash.",
  },
] as const;

export default function AgentsPage() {
  return (
    <main className="agents">
      <header>
        <p>Horizon Education Aid — Need-Based Scholarship</p>
        <p className="stamp">Fictional demo · Synthetic data only</p>
        <h1>For agents</h1>
        <p className="hero-lead">
          This page registers six tools on{" "}
          <code>document.modelContext</code>, so an assistant works against the
          portal&apos;s own rules, version checks and refusals rather than
          against a rendered form. Four of the tools only read. The two that can
          change something refuse anything they cannot verify, and neither of
          them can finish the application.
        </p>
      </header>

      <section aria-labelledby="agents-tools-heading">
        <h2 id="agents-tools-heading">The six tools</h2>
        <ul className="tools">
          {TOOLS.map((tool) => (
            <li key={tool.name} data-writes={tool.writes || undefined}>
              <p className="tool-name">
                <code>{tool.name}</code>
              </p>
              <p className="tool-hints">
                <span className={tool.writes ? "hint-write" : "hint-read"}>
                  {tool.writes ? "can change the draft" : "readOnly"}
                </span>
                <span className={tool.untrusted ? "hint-untrusted" : "hint-own"}>
                  {tool.untrusted
                    ? "untrusted content"
                    : "the portal's own rules"}
                </span>
              </p>
              <p className="tool-summary">{tool.summary}</p>
              <p className="tool-consent">{tool.consent}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="agents-boundary-heading">
        <h2 id="agents-boundary-heading">Where the assistant stops</h2>
        <p className="section-lead">
          This is the same boundary the disclosure states before you allow
          assisted access, and the server — not the tool descriptions — is what
          enforces it.
        </p>
        <div className="boundary-columns">
          <div className="may">
            <h3>What the assistant may do</h3>
            <ul>
              {ASSISTED_ACCESS_CATALOG.permittedActions.map((action) => (
                <li key={action}>{action}</li>
              ))}
            </ul>
          </div>
          <div className="only-you">
            <h3>What only the applicant can do</h3>
            <ul>
              {ASSISTED_ACCESS_CATALOG.excludedActions.map((action) => (
                <li key={action}>{action}</li>
              ))}
            </ul>
          </div>
        </div>
        <p className="converge">
          {ASSISTED_ACCESS_CATALOG.reviewPreparationEffect}{" "}
          {ASSISTED_ACCESS_CATALOG.separatePermissions}
        </p>
      </section>

      <section aria-labelledby="agents-chrome-heading">
        <h2 id="agents-chrome-heading">In Chrome</h2>
        <ol className="steps">
          <li>
            <h3>Turn WebMCP on</h3>
            <p>
              Open <code>chrome://flags/#enable-webmcp-testing</code>, set it to
              Enabled, and relaunch — or launch Chrome with{" "}
              <code>--enable-features=WebMCPTesting</code>. This was last
              verified end to end on Chrome 152.0.7977.66.
            </p>
          </li>
          <li>
            <h3>Start the Conflict packet</h3>
            <p>
              On the landing page, choose Start conflict packet. Then check that
              the status line under the stage heading ends{" "}
              <span className="quote">
                WebMCP: six CiteApply tools registered.
              </span>
            </p>
          </li>
          <li>
            <h3>Allow assisted access yourself</h3>
            <p>
              Click Review and allow assisted access, read the disclosure, then
              Allow assisted access. Until you do, a protected read is refused
              with <code>consent_required</code> and discloses nothing.
            </p>
          </li>
          <li>
            <h3>Ask, then watch the Assisted activity panel</h3>
            <p>
              Every tool call the page answers is listed there with its outcome
              and the versions the server returned. A refusal is listed exactly
              like an acceptance.
            </p>
          </li>
        </ol>
      </section>

      <section aria-labelledby="agents-prompts-heading">
        <h2 id="agents-prompts-heading">What to ask</h2>
        <ol className="prompts">
          <li>
            List the CiteApply tools on this page, then read the application
            state in `redacted` mode and tell me what it discloses.
          </li>
          <li>
            Read the evidence index and the active form requirements, then apply
            every supported binding you are allowed to apply in one atomic call.
          </li>
          <li>Now bind annual household income from the best source you can find.</li>
        </ol>
        <p>
          The third one cannot succeed on the Conflict packet. The portal
          returns, verbatim:
        </p>
        <pre className="refusal">
          <code>
            {
              '{"ok":false,"error":{"code":"conflict_requires_human",\n "message":"Income sources disagree. Resolve this in CiteApply.",\n "safeActions":["resolve_in_visible_application"]}}'
            }
          </code>
        </pre>
        <p>
          Nothing is written, and the income row keeps saying that two accepted
          sources disagree. Both source buttons stay unavailable until the
          applicant chooses a reason, and that reason is what the frozen review
          and the receipt quote back.
        </p>
      </section>

      <section aria-labelledby="agents-chatgpt-heading">
        <h2 id="agents-chatgpt-heading">In the ChatGPT in-app browser</h2>
        <p>
          Open this origin in the in-app browser and check the same status line
          under the stage heading.
        </p>
        <ul className="plain-list">
          <li>
            If it reads that six CiteApply tools are registered, ask the three
            questions above in order, allowing assisted access yourself between
            the first and the second.
          </li>
          <li>
            If it reads that WebMCP is unavailable in this browser, that is the
            honest fallback rather than a failure. The whole application is
            still completable with the visible controls, all the way to the
            receipt.
          </li>
        </ul>
        <p>
          Either way, no step lets an assistant declare the email, resolve the
          income conflict, submit, or read the receipt.
        </p>
      </section>

      <section aria-labelledby="agents-limits-heading">
        <h2 id="agents-limits-heading">What this demonstration does not claim</h2>
        <ul className="plain-list">
          <li>
            The records, the applicant and the program are invented. No document
            here is authentic and no applicant is eligible for anything.
          </li>
          <li>
            Every session is capped at 60 minutes, and starting a packet is rate
            limited across all visitors, so a busy moment can refuse a start.
          </li>
          <li>
            The tool calls demonstrated in this project&apos;s evidence were
            issued through Chrome&apos;s own WebMCP surface. An assistant
            choosing its own calls will behave the same way, because the server
            decides, but that is the part you should test yourself.
          </li>
        </ul>
        <p>
          <Link href="/#apply">Start a synthetic application</Link>
        </p>
      </section>
    </main>
  );
}
