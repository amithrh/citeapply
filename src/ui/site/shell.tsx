import Link from "next/link";

/**
 * The site shell every route wears.
 *
 * CiteApply is a demonstration, but a judge has to believe the portal it is
 * demonstrated inside. So Horizon Education Aid gets what an aid office
 * actually has: a masthead with the program's own mark, a way back to every
 * part of the site, and a footer that says who to write to — and, in the same
 * breath and the same weight, that none of it is real.
 *
 * The mark repeats the product's two colours, which are its whole argument:
 * teal is the office speaking with a record behind it, ochre is the office
 * declining to decide. It is drawn inline, because the content security policy
 * is `default-src 'self'` and nothing here is worth an exception.
 */

export function HorizonMark() {
  return (
    <svg
      className="mark"
      viewBox="0 0 32 32"
      role="img"
      aria-label="Horizon Education Aid"
      focusable="false"
    >
      <rect width="32" height="32" rx="7" fill="currentColor" />
      <rect x="8" y="6" width="16" height="20" rx="1.5" fill="#fafbfc" />
      <rect x="8" y="6" width="2.5" height="20" fill="#c98a2e" />
      <rect x="13" y="10" width="8" height="2" rx="1" fill="#0f6e6b" />
      <rect x="13" y="14.5" width="8" height="2" rx="1" fill="#0f6e6b" />
      <rect x="13" y="19" width="5" height="2" rx="1" fill="#c98a2e" />
    </svg>
  );
}

const NAV = [
  { href: "/#scholarship", label: "Scholarship" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#apply", label: "Apply" },
  { href: "/agents", label: "For agents" },
] as const;

export function SiteHeader() {
  return (
    <header className="site-header" data-print="hide">
      <div className="site-header-inner">
        <Link className="wordmark" href="/">
          <HorizonMark />
          <span>
            <strong>Horizon Education Aid</strong>
            <span className="wordmark-sub">Need-Based Scholarship</span>
          </span>
        </Link>
        <nav aria-label="Site">
          <ul>
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer" data-print="hide">
      <div className="site-footer-inner">
        <div className="footer-disclaimer">
          <HorizonMark />
          <p>
            Horizon Education Aid is an invented program. The scholarship, the
            applicant, the three source records and every figure on this site
            are synthetic, nothing is submitted anywhere, and each demonstration
            session lasts 60 minutes. Please keep real personal and financial
            information out of it.
          </p>
        </div>
        <div className="footer-columns">
          <section aria-labelledby="footer-program">
            <h2 id="footer-program">Program office</h2>
            <ul>
              <li>Placeholder address: Aid Office, Horizon Education Aid</li>
              <li>
                <span className="footer-mono">aid-office@horizon.test</span>
              </li>
              <li>Placeholder line: +00 0000 000000</li>
            </ul>
          </section>
          <section aria-labelledby="footer-site">
            <h2 id="footer-site">This site</h2>
            <ul>
              <li>
                <Link href="/#how-it-works">How the application works</Link>
              </li>
              <li>
                <Link href="/agents">Bringing an assistant</Link>
              </li>
              <li>
                <Link href="/#faq">Common questions</Link>
              </li>
            </ul>
          </section>
          <section aria-labelledby="footer-repo">
            <h2 id="footer-repo">Source and documents</h2>
            <ul>
              <li>
                The{" "}
                <a href="https://github.com/amithrh/citeapply">repository</a> is
                MIT licensed. Read its{" "}
                <a href="https://github.com/amithrh/citeapply/blob/main/LICENSE">
                  LICENSE
                </a>{" "}
                and{" "}
                <a href="https://github.com/amithrh/citeapply/blob/main/README.md">
                  README
                </a>
                .
              </li>
              <li>
                Judge walkthrough:{" "}
                <a href="https://github.com/amithrh/citeapply/blob/main/docs/JUDGE-TESTING.md">
                  docs/JUDGE-TESTING.md
                </a>
              </li>
              <li>
                Chrome verification:{" "}
                <a href="https://github.com/amithrh/citeapply/blob/main/docs/verification/genuine-chrome-webmcp.md">
                  docs/verification/genuine-chrome-webmcp.md
                </a>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </footer>
  );
}
