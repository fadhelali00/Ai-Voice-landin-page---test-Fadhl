# Tamnex marketing page (pre-launch)

- `site/`: the page to publish on tamnex.com (static HTML/CSS/JS, self-hosted fonts, `api/interest.php` for sign-ups).
- `site/assets/readiness.js`: the close-readiness demo engine (synthetic data, single state).
- `tests/`: `node --test tests/readiness.test.mjs` (engine) and `tests/e2e.cjs` (browser, see its header).
- `marketing/CLAIMS.md`: what the page may say and why. `marketing/SOCIAL.md`: social drafts.
- `DEPLOY.md`: publishing steps and post-deploy checks.
- `brand/`: identity tokens (D90) and notes.

## Deviation from the website methodology (recorded 2026-11-03)
`erp-system-2026/docs/07-go-to-market/WEBSITE-AND-KNOWLEDGE-CENTER-METHODOLOGY.md` stage 3 names `apps/website`
(Next.js + Tailwind static export, D19), a `claim-id` on every feature card with a failing build when a source is
missing, and one `modules.json` data file. This pre-launch page deviates on purpose:
- **Static HTML/CSS/JS in this sandbox repo**, because D133 has no recorded exception for building the website in
  erp-system-2026 (coordinator reply, D62), and the founder asked for a pre-launch page now. The output is the same
  kind the methodology asks for (a static export), so moving it into `apps/website` later is a port, not a rewrite.
- **Claims are tracked in `marketing/CLAIMS.md`** (claim, source, status, allowed wording) instead of `claim-id`
  attributes and a build gate. To add when ported: `data-claim` on each card plus a test that fails without a source.
- **Modules and AI features are inline tables** instead of `modules.json`. To extract when ported.
- D39 holds: no reference product or competitor is named on the page.
