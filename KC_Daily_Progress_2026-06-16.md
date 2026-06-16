# KC Factory System — Daily Log 2026-06-16
**Code.gs:** v1.4.128 | **KCFactory.jsx:** v1.4.17

---

## ⚡ Start Here

- **Current versions:** Code.gs v1.4.128 · KCFactory.jsx v1.4.17 — no deploy since 2026-06-12
- **Before deploy: confirm #38** — TI landscape font 2.5mm (changed without signal in v1.4.117). Get explicit approval.
- **Before deploy: confirm #36** — TI landscape left margin 15mm with director.
- **Pending tests before deploy** — see Pending Testing section: #32 UX scenarios, #33 grand total, column borders all 4 formats.
- **New issue #40** — TI landscape print output too close to top edge (observed 2026-06-16 on physical printout).
- **PC setup complete** — dev environment on new PC; repo at `Documents\GitHub\KC-Admin`; npm install done; npm run dev verified.
- **Deploy workflow:** edit locally → `npm run deploy` (goes live) → GitHub Desktop commit + push (version history)
- **Cross-machine sync:** `git pull` before starting, `git push` after finishing; always on both machines
- **Terminal path:** always `cd Documents\GitHub\KC-Admin` first before running any npm command — opening a standalone terminal defaults to `C:\Users\Dell\` which has no package.json
- **File continuity:** Start a new dated file for each new day. Do not append to this one after the session ends.

---

## Rules (apply every session)

### Hard Constraints

- `buildTaxInvoicePortraitPDF` — never modify directly for experimental changes; all changes must go through `stagingTestTaxInvoicePortrait()` first and be confirmed before promoting to the live builder (CSS border lines may be adjusted directly)
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
- **Terminal must be in KC-Admin folder** — always `cd Documents\GitHub\KC-Admin` before any npm command; never run npm from `C:\Users\Dell\`

### PDF Design Pattern

- All sizes in **mm** (not px)
- Design in HTML mockup first, toggle ต้นฉบับ/สำเนา in browser before coding
- Font: Prompt base64, weights 400/500/600/700 — no external imports
- `@page{size:A4 [landscape|portrait];margin:0}` — always margin:0, control spacing in CSS
- Screen px ≠ print mm — always test actual PDF output

### TI Landscape Centering Reference (calibrated 2026-06-16)

- **A4 landscape center = 148.5mm** from left paper edge (297 ÷ 2)
- **To draw the center line on paper:** measure 148.5mm from left edge, or fold paper in half
- **GAS behavior:** `@page` margin is partially applied (~10mm effective regardless of value set); `.page` CSS `margin-left` and `padding-top` are the real controls
- **Current live values:** `pageMarginLeft: 1.2mm`, `pagePaddingTop: 10mm` → divider at paper center ✓
- **Empirical adjustment ratio:** 7mm change in `pageMarginLeft` = 3 × width-of-"0" (at 2.5mm font) of visual movement (~2:1 input:output ratio)
- **To verify center:** print staging PDF, fold paper in half — divider line should align with fold
- **To recalibrate:** find the จำนวนเงิน/สต. column separator on the left half; in v1.4.130 (pageMarginLeft 17.5mm) that separator was at paper center — use as reference anchor for future adjustments

### Center Line Test — How to Print a Vertical Line at Paper Center (GAS PDF)

**Confirmed value (2026-06-16):** `padding-left: 130.35mm` lands at paper center for current settings.

**Settings this value depends on** (if any change, recalibrate):
- `@page`: `size:A4 landscape; margin:8mm 8mm 8mm 15mm`
- `.page`: `width:262mm; margin-left:1.2mm`

**Method (copy this into `stagingTestCenterLine()`):**
```html
<style>
@page{size:A4 landscape;margin:8mm 8mm 8mm 15mm}
html,body{margin:0;padding:0;background:white}
.page{width:262mm;height:190mm;margin-left:1.2mm;padding-top:10mm;box-sizing:border-box}
p{font-family:sans-serif;font-size:8mm;margin:0;color:red;padding-left:130.35mm;}
</style>
<div class='page'>
  <p>|</p><p>|</p>... (repeat ~14 times)
  <p style='font-size:3mm;color:#888;padding-left:0'>^ 130.35mm from .page left = paper center</p>
</div>
```

**Key constraint:** `position:absolute` is NOT supported by GAS PDF renderer — use `padding-left` on block elements instead.

**Starting estimate for a new template:** `pageMarginLeft + (pageWidth − gap − dividerWidth) / 2` = theoretical divider center. Then add ~1mm (empirical offset). Always verify with a print+fold test before locking in.

### ⚠️ Critical: Paper Center Formula (A4 Landscape — Fixed for This Printer)

**Effective @page left margin = 16.95mm** (empirically derived 2026-06-16; GAS applies ~16.95mm regardless of `@page` left margin value set, as long as settings are `margin:8mm 8mm 8mm 15mm` on this printer)

**One-shot formula for center line on any new A4 landscape template:**
> `padding-left = 131.55 − pageMarginLeft`

| pageMarginLeft | padding-left for center line |
|---|---|
| 0mm | 131.55mm |
| 1.2mm | 130.35mm ← current TI landscape |
| 3mm | 128.55mm |
| 5mm | 126.55mm |

**Condition:** only valid when ALL of these are fixed:
- Paper: A4 landscape
- Printer: same physical printer at KC factory
- `@page`: `size:A4 landscape; margin:8mm 8mm 8mm 15mm`
- Rendering: GAS `Utilities.newBlob().getAs('application/pdf')`

**If any condition changes** → run `stagingTestCenterLine()` again to re-derive the effective @page left margin, then recalculate.

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
| 38 | TI landscape font 3→2.5mm — confirm | D: Changed in v1.4.117 without explicit signal<br>Note: Confirmed to keep 2026-06-16 | — | 2026-06-13 | ✅ Done |
| 36 | TI landscape left margin decision | D: GAS ignores @page margin; controlled via pageMarginLeft on .page instead; resolved via #41/#42<br>Note: Resolved 2026-06-16 | — | 2026-06-13 | ✅ Done |
| 40 | TI landscape — content too close to top edge | D: pagePaddingTop default 3.2→10mm<br>Note: Promoted to live in v1.4.134 | — | 2026-06-16 | ✅ Done |
| 41 | TI landscape — cut line not centered | D: pageMarginLeft default 0→1.2mm centers divider at paper center (148.5mm)<br>Note: Promoted to live in v1.4.134 | — | 2026-06-16 | ✅ Done |
| 42 | TI landscape — inner edge spacing uneven | D: Same fix as #41<br>Note: Promoted to live in v1.4.134 | — | 2026-06-16 | ✅ Done |
| 8 | DN landscape — EN name in header | D: Company EN name not rendering in landscape DN header; Thai name shows fine | P2xS | 2026-06-12 | ⏳ Pending |
| 31 | PDF auto-split safety net | D: `splitDescText()` in Code.gs auto-breaks long desc; `white-space: nowrap; overflow: hidden` on PDF cells | P3xM | 2026-06-12 | ⏳ Pending |
| 17 | File naming prefix P_/L_ | D: Add prefix to saved filenames so files are identifiable without opening | P3xS | 2026-06-12 | ⏳ Pending |
| 13 | Page color label (portrait) | D: Small colored label per page matching physical paper set (green/yellow/white/blue)<br>Note: Placement TBD with director | P4xS | 2026-06-11 | ⏳ Pending |
| 37 | GAS @page margin not respected | D: GAS PDF renderer likely ignores `@page{margin}` CSS; `.page{width}` is the effective control<br>Note: Known constraint; investigate further or accept limitation | P4xS | 2026-06-13 | ⏳ Pending |
| 43 | TI landscape — too much left space | D: Current left edge (~16.95mm from paper edge) is visibly wider than v1.4.129 (8mm @page). Reducing `pageMarginLeft` shifts divider off-center; need to widen `pageWidth` simultaneously. | P3xS | 2026-06-16 | ⏳ Pending |
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
| 39 | Add progress doc to GitHub repo | D: Copy KC_Daily_Progress docs into kc-factory repo and push — so doc syncs across machines via git pull/push<br>Note: Docs visible in repo on 2026-06-16 clone — appears complete; verify | P2xS | 2026-06-16 | ✅ Done |
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

### Code.gs (v1.4.128 → v1.4.134)

| Version | Change | Rationale |
|---|---|---|
| v1.4.134 | TI landscape: promote to live — `pageMarginLeft` default 0→1.2mm, `pagePaddingTop` default 3.2→10mm; fixes #40/#41/#42 | Staging confirmed: divider at paper center (148.5mm), content no longer shifted up, inner edges balanced |
| v1.4.133 | stagingTest: `pageMarginLeft` 3.5→1.2mm (−2.33mm; 1 "0"-width shift based on 7mm=3"0"s empirical ratio) | Fine-tuning centering — 1 "0" width off at v1.4.132 |
| v1.4.132 | stagingTest: `pageMarginLeft` 10.5→3.5mm (−7mm; empirical 2:1 ratio) | Shift divider from middle of สต. toward right edge = paper center |
| v1.4.131 | stagingTest: `pageMarginLeft` 17.5→10.5mm (−7mm) | Divider too far right; shift left toward center |
| v1.4.130 | TI landscape: add `pageMarginLeft` opt (default 0mm); stagingTest uses 17.5mm + pagePaddingTop 10mm | GAS ignores @page; need explicit margin-left on .page to center 262mm content on 297mm paper |
| v1.4.129 | TI landscape: add `pagePaddingTop` opt (default 3.2mm); stagingTest uses symmetric pageMargin 8mm + pagePaddingTop 6mm | First staging attempt for #40/#41/#42 |

### Infrastructure

| Item | Change | Notes |
|---|---|---|
| PC dev environment | Installed GitHub Desktop + Node.js/npm on new PC; cloned KC-Admin repo to `Documents\GitHub\KC-Admin`; npm install + npm run dev verified | 2026-06-16 |
| New session doc | Created KC_Daily_Progress_2026-06-16.md; added #40/#41/#42; marked #38/#39 done | 2026-06-16 |
