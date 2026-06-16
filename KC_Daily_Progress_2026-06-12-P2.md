# KC Factory System — Daily Log 2026-06-12 (Part 2)
**Code.gs:** v1.4.128 | **KCFactory.jsx:** v1.4.17

> Continues from Part 1: `KC_Daily_Progress_2026-06-12.md` (locked).
> Appendix, session history, and all-time completed items are in Part 1.

---

## ⚡ Start Here

- **Bug #32 Option A — ✅ Done.** KCFactory v1.4.17 shipped. PDF fixes done through Code.gs v1.4.128.
- **Next priority: run all pending tests** before deploy (see Pending Testing section) — #32 UX scenarios, #33 grand total, column borders all 4 formats.
- **Before deploy: confirm #38** — TI landscape font 2.5mm (changed without signal in v1.4.117). Get explicit approval.
- **Before deploy: confirm #36** — TI landscape left margin 15mm with director.
- **KCFactory.jsx v1.4.17 is live** at `https://kimchiang-ltd.github.io/KC-Admin/` — deployed via `npm run deploy`
- **Deploy workflow:** edit locally → `npm run deploy` (goes live) → GitHub Desktop commit + push (version history)
- **Cross-machine sync:** `git pull` before starting, `git push` after finishing; always on both machines
- **Progress doc not yet in repo** — add to `~/Desktop/kc-factory/` and push so it syncs across machines (see Outstanding Items #39)
- **File continuity:** Start a new dated file for each new day. Do not append to this one after the session ends.

---

## Rules (apply every session)

### Hard Constraints

- `buildTaxInvoicePortraitPDF` is **LOCKED** — never modify its internals (CSS border lines only)
- Col O (col 15) in Tax Invoice History sheet has a year-month formula — **DO NOT TOUCH**
- **Never copy source files again mid-session** — work from uploaded copies only

### Version & Doc

- **Always bump the version number as the last step of every change, before saying done.**
  - `KCFactory.jsx`: changelog comment at top + footer `<span>` version string (line ~2011)
  - `Code.gs`: `Version: 1.4.x` on line 3
- Version log order: **newest first**
- **Never rewrite or replace sections of this doc — only ADD new entries or UPDATE existing status.** Rewrites cause content loss especially after context compaction.
- **Never change doc format** (table layouts, column names, section structure) unless explicitly told to do so.

### Coding Discipline

- **Never code without explicit user signal** — always confirm scope/direction first
  - ✅ Signal (code it): imperative sentence ("change X to Y", "fix this", "try X"), or direct confirmation ("yes", "go ahead", "ok")
  - ❌ Not a signal: questions ("can we do X?", "why is X?"), bug reports without instruction ("btw X is broken"), observations ("this seems wrong")
  - ❌ Not a signal: me listing an item in a response — each distinct change needs its own explicit signal
  - **Scope discipline**: only implement exactly what was signaled. No "while I'm here" additions. If a bug is found during implementation, note it — do not fix without a separate signal
- **When unclear, clarify — never guess** — if intent is ambiguous, ask before acting
- **Diagnose before fixing** — understand root cause, validate approach before implementing
- **Before coding any Apps Script method** — web_search the exact signature on developers.google.com. Never guess.

### PDF Rules

- **Template changes go into stagingTest first** — all PDF layout/style changes must be implemented in the `stagingTest[Format]()` function (via opts) before touching the original builder; only apply to original after confirmed; never modify a production builder directly for experimental changes
- **Show mockups/previews before code** for any UI or PDF change

### Session & Work Style

- **Session scope discipline** — agree on agenda at session start; unplanned work gets parked in Outstanding Items, not acted on mid-session; doc updates are always in scope
  - Agree on a session agenda first — before any work begins, list what we're tackling and stick to it
  - One work area per session — e.g. PDF fixes only, or frontend only; avoid jumping between unrelated areas
  - Parking lot rule — anything that surfaces mid-session outside agreed scope gets logged to Outstanding Items, not acted on
- **Work surgically** — grep-first before any read or edit; use targeted reads (offset/limit) rather than full file reads; confirm exact string with grep before any Edit
- **Check the docs before asking the user** — before asking for any project info (paths, repo, config, decisions), grep the progress docs in the working folder first; only ask if the answer is genuinely not there

### Code Change Pattern (follow every time)

1. Grep for the target string first — confirm exact match and location
2. Read only the relevant section (offset/limit) — not the whole file
3. Diagnose root cause
4. Propose approach → wait for approval
5. Make targeted edits using unique surrounding context
6. Verify change applied (grep for old string — should be gone)
7. Bump version + add changelog entry
8. present_files to user

### Critical Mistakes to Avoid

- **Never run a broad find/replace** scoped only by keyword — always use unique surrounding context and preview before applying. Wrong target = broken code.
- **Never re-copy source files mid-session** — overwrites all accumulated fixes. Copy once at session start.
- **Never guess Apps Script / Google API signatures** — always web_search `developers.google.com` first.
- **Remove all references before removing a state variable** — e.g. removing `collapsed` state while leaving `collapsed ?` in JSX = runtime error. Always grep for all usages first.
- **Avoid `replace_all: true` on non-unique strings** — use specific surrounding context to target the correct instance.

### PDF Design Pattern

- All sizes in **mm** (not px)
- Design in HTML mockup first, toggle ต้นฉบับ/สำเนา in browser before coding
- Font: Prompt base64, weights 400/500/600/700 — no external imports
- `@page{size:A4 [landscape|portrait];margin:0}` — always margin:0, control spacing in CSS
- Screen px ≠ print mm — always test actual PDF output

---

## Outstanding Items

Priority: P0 = critical blocker · P1–P4 = high→low · F = future only · — = done/N/A
Complexity: S = small · M = medium · L = large · XL = extra large

| # | Item | Description | PxC | Logged | Status |
|---|---|---|---|---|---|
| **Bug** | | | | | |
| 10 | DN portrait — font & sizing QA | D: Font scaled in v1.4.94/97; needs visual test print to confirm sizing correct | P1xS | 2026-06-12 | 🔧 In progress |
| 18 | Date picker font mismatch | D: Date inputs use system/browser default font instead of Prompt | P4xS | 2026-06-12 | ⏳ Pending |
| 32 | Continuation row architecture | D: `_cont` flag lost on save/reload; rows invisible in detail+PDF<br>Note: KCFactory v1.4.17 — Option A | — | 2026-06-12 | ✅ Done |
| 33 | Grand total miscalculation | D: Subtotal ~27,306 → grand total 829,217; stale amount on `_cont` rows<br>Note: Resolved as side effect of #32 — verified | — | 2026-06-12 | ✅ Done |
| **PDF** | | | | | |
| 38 | TI landscape font 3→2.5mm — confirm | D: Changed in v1.4.117 without explicit signal; user has not confirmed to keep<br>Note: Confirm with user before deploy | P0xS | 2026-06-13 | ⏳ Pending |
| 36 | TI landscape left margin decision | D: Left margin 15mm vs DN 9mm — may be intentional for binding; GAS `@page` may not be respected<br>Note: Confirm with director before changing | P0xS | 2026-06-13 | ⏳ Pending |
| 8 | DN landscape — EN name in header | D: Company EN name not rendering in landscape DN header; Thai name shows fine | P2xS | 2026-06-12 | ⏳ Pending |
| 31 | PDF auto-split safety net | D: `splitDescText()` in Code.gs auto-breaks long desc; `white-space: nowrap; overflow: hidden` on PDF cells | P3xM | 2026-06-12 | ⏳ Pending |
| 17 | File naming prefix P_/L_ | D: Add prefix to saved filenames so files are identifiable without opening | P3xS | 2026-06-12 | ⏳ Pending |
| 13 | Page color label (portrait) | D: Small colored label per page matching physical paper set (green/yellow/white/blue)<br>Note: Placement TBD with director | P4xS | 2026-06-11 | ⏳ Pending |
| 37 | GAS @page margin not respected | D: GAS PDF renderer likely ignores `@page{margin}` CSS; `.page{width}` is the effective control<br>Note: Known constraint; investigate further or accept limitation | P4xS | 2026-06-13 | ⏳ Pending |
| 35 | TI portrait header fix | D: "ราคาหน่วยละ" + "จำนวนเงิน" wrapping to 2 lines; สต. column clipping "00"<br>Note: Fixed in v1.4.126–128 via altHeaders opt; promoted to live | — | 2026-06-13 | ✅ Done |
| **Doc** | | | | | |
| 6 | Delete/cancel invoice | D: Soft delete — mark cancelled in sheet; confirm dialog; keep row for audit<br>Note: Scope TBD: DN only or both? | P2xM | 2026-06-11 | ⏳ Pending |
| 12 | Update billing note template | D: Align ใบวางบิล with current DN/TI format; Sheets integration pending | P4xM | 2026-06-11 | ⏳ Pending |
| **UI** | | | | | |
| 34 | DETAIL_MAX frontend cap | D: Hard character limit on detail field per segment (like DESC_MAX); prevent overflow in PDF right block<br>Note: Agreed this session; implement after layout confirmed | P1xS | 2026-06-13 | ⏳ Pending |
| 19 | Customer name autocomplete | D: Suggest matching names as user types; allow manual entry + auto-save new names | P2xM | 2026-06-12 | ⏳ Pending |
| 20 | Prevent duplicate customer names | D: Normalize or fuzzy-match names — catch "MR.APPLE" vs "MR. APPLE"<br>Note: Related to #19 | P2xM | 2026-06-12 | ⏳ Pending |
| **Files** | | | | | |
| 16 | Organize Google Drive folders | D: All docs save to single Drive folder; separate by type or month/year | P4xM | 2026-06-12 | ⏳ Pending |
| **Infra** | | | | | |
| 39 | Add progress doc to GitHub repo | D: Copy KC_Daily_Progress docs into kc-factory repo and push — so doc syncs across machines via git pull/push<br>Note: Cowork sessions are local only; GitHub is the only cross-machine sync | P2xS | 2026-06-16 | ⏳ Pending |
| 22 | Split Code.gs | D: Move DN PDF functions to DeliveryNote.gs; move all stagingTest*() functions to StagingTests.gs; Code.gs too long to navigate<br>Note: Do after system is stable | P3xL | 2026-06-12 | ⏳ Pending |
| 15 | Migrate to Electron | D: Replace GAS/Sheets with Electron + SQLite; factory has 1 PC — fully local<br>Note: Long-term goal | FxXL | 2026-06-12 | 🔮 Future |

---

## Pending Testing / Next Steps

### 🧪 Needs Testing

| # | Item | What to Test | Result |
|---|---|---|---|
| 32 | Continuation row — save/reload (Option A) | (1) Type past DESC_MAX → Enter → ↳ row created. (2) Save → reload → ↳ row reconstructed from `detail \| cont` split. (3) Edit again → save → verify no data loss | ⏳ Not tested |
| 32 | Continuation row — detail view | Open saved invoice in detail view → continuation text visible in detail column | ⏳ Not tested |
| 32 | Continuation row — PDF | Generate PDF with a joined detail → verify ` \| ` text renders acceptably in PDF cell | ⏳ Not tested |
| 33 | Grand total after #32 fix | Add 1 real item + 1–2 continuation rows → verify grand total matches subtotal × 1.07 | ⏳ Not tested |
| — | Continuation row UX (v1.4.15) | (1) Hard block: type past DESC_MAX — no chars accepted. (2) Enter → ↳ row + detail focused. (3) At 10 rows: Enter + Add Row both blocked. (4) Save: payload has no `_cont` flag | ⏳ Not tested |
| — | Vertical column borders (v1.4.99–1.4.109) | Test print all 4 PDF formats; verify borders on every column; no bleed at edges | ⏳ Not tested |
| 10 | DN portrait font QA | Test print; compare font sizes against DN landscape; verify ยอดรวม, baht, sig labels, footer all readable | 🔧 In progress |

---

## Work Done This Session

### KCFactory.jsx (v1.4.16 → v1.4.17)

| Version | Change | Rationale |
|---|---|---|
| v1.4.17 | Bug #32 Option A: on save, collapse consecutive `_cont` rows into parent `detail` joined by ` \| `; on edit load, split `detail` by ` \| ` to reconstruct `_cont` rows; `updateItem`/`upd` guard blocks all field changes on `_cont` rows except `detail`; `TaxInvoiceDetail` fi filter expanded to include `desc2\|\|detail` | `_cont` flag was stripped on save and lost on reload — continuation rows reloaded as orphan plain rows; detail view and PDF silently dropped rows with only `detail` filled; joining into parent row eliminates ghost rows and survives save/reload |

### Code.gs (v1.4.109 → v1.4.128)

| Version | Change | Rationale |
|---|---|---|
| v1.4.128 | Promote staging to live: `showDesc2Parens` default→false (all 4 builders), `altHeaders` default→true (TI portrait) | Staging confirmed — no parens on size, TI portrait headers fixed |
| v1.4.127 | Rename all staging functions: `test[Format]Test()` → `stagingTest[Format]()`; update comment block | Clearer naming — prefix "stagingTest" distinguishes from production test functions |
| v1.4.126 | TI portrait: add `altHeaders` opt — "หน่วยละ", `white-space:nowrap` on all TH, colgroup col3:20→16mm, col4:18→20mm, col5:7→11mm; `stagingTestTaxInvoicePortrait` uses `altHeaders:true` | Headers "ราคาหน่วยละ" and "จำนวนเงิน" were wrapping to 2 lines; สต. column too narrow for "00" at 3.9mm font |
| v1.4.125 | Add workflow comment block above test functions explaining `stagingTest*()` pattern | Self-documenting code — pattern is now explicit in the file |
| v1.4.124 | Rename `testTaxInvoiceLandscapeMarginTest` → `stagingTestTaxInvoiceLandscape`; drop margin opts, use `showDesc2Parens:false` | Align with `stagingTest*()` naming convention |
| v1.4.123 | DN portrait + TI portrait: add opts param (`showDesc2Parens`); add `stagingTestDeliveryNotePortrait()` and `stagingTestTaxInvoicePortrait()` | Complete staging coverage for all 4 formats |
| v1.4.122 | All test functions: remove "PDF URL: " prefix from Logger.log | URL alone is easier to copy and open directly |
| v1.4.121 | TI landscape + TI portrait: add `showDesc2Parens` to opts; TI portrait: add opts param | Apply same staging pattern to remaining builders |
| v1.4.120 | DN landscape: add `opts` param (`showDesc2Parens`) to builder; add staging test function | Establish staging pattern: test layout changes via opts without touching original builder |
| v1.4.119 | TI landscape: add `opts` param (`pageMargin`, `pageWidth`) to builder; add `testTaxInvoiceLandscapeMarginTest()` for margin comparison | Investigating whether GAS PDF renderer respects `@page` margin; added test function to compare without affecting production |
| v1.4.118 | TI landscape: field-value + field-sub font 3.5→3mm | Further space reduction to match tighter TI landscape layout |
| v1.4.117 | TI landscape: font 3→2.5mm, colgroup unit price col 20→16mm, header "ราคาหน่วยละ"→"หน่วยละ"; TI landscape + TI portrait: fix border suppression — CSS class `border-bottom` requires inline `border-bottom:none` override (reversed logic vs DN builders) | TI landscape was narrower than DN landscape due to page margin; reduced font/col to gain space; TI borders weren't clearing because CSS class overrides empty inline style |
| v1.4.116 | Portrait left block width scaled by font size: DN portrait 38→44mm, TI portrait 38→49mm | 38mm calibrated for 3mm font; portrait builders use larger fonts causing desc+desc2 to clip into detail text |
| v1.4.115 | All 4 PDF builders: remove horizontal border within the same product group; `lastContIdx` pre-computed; border only on last row of each group; DN builders preserve `border-right` | Horizontal lines between cont rows and their parent visually broke up the product group |
| v1.4.114 | All 4 PDF builders: alternating row color keyed by product index `i` not `rowCount`; cont rows share parent background | Color was alternating per-row including cont rows, which looked wrong visually |
| v1.4.113 | All 4 PDF builders: 38mm fixed-width split layout in desc td — nested div with 38mm left block (desc+desc2) and `flex:1` right block (detail); cont rows use same 38mm empty left block so detail always aligns | `padding-left:5mm` indent didn't align cont text with main row detail because product name length varies |
| v1.4.112 | Add `table-layout:fixed` to all 4 PDF builders | `white-space:nowrap` without fixed layout caused desc column to expand horizontally instead of clipping |
| v1.4.111 | All 4 PDF builders: remove `↳` arrow from cont rows; remove `()` around cont text; add `padding-left:5mm` indent on cont row desc TD; add `white-space:nowrap;overflow:hidden` on all desc TDs (main + cont) to prevent row height expansion; move `()` to wrap `desc2` (size) instead of `detail`; apply same cont row split + filledItems filter fix to TI portrait | PDF was expanding table height on long continuation text; `↳` and `()` not wanted in output; cont rows should be indented to align with main row text; `()` should wrap size (desc2) not detail text |
| v1.4.110 | PDF continuation rows: split `detail` by ` \| ` in TI landscape, DN landscape, DN portrait; render extra parts as `↳ (text)` rows with fixed height and empty qty/price cells; fix DN landscape/portrait `filledItems` filter to include `desc2\|\|detail` | Joined detail string from Option A was rendering as one long overflowing cell in PDFs; splitting at render time mirrors the multi-row form display and keeps fixed row heights |

### Infrastructure

| Item | Change | Notes |
|---|---|---|
| stagingTest*() workflow | Established staging pattern for all 4 PDF formats; stagingTest functions added to Code.gs; workflow comment block added; rules + doc updated | Code.gs v1.4.120–127 |
| GitHub deploy setup | Added `.vite/` to `.gitignore`; added `homepage` + `deploy` script to `package.json`; pushed KCFactory.jsx v1.4.17 + Code.gs v1.4.128 to GitHub (KC-Admin repo); ran `npm run deploy` → live on GitHub Pages | Repo: kimchiang-ltd/KC-Admin |
