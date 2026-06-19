# KC Factory System — Daily Log 2026-06-19
**Code.gs:** v1.4.190 → v1.4.203 | **KCFactory.jsx:** v1.4.58 → v1.4.85

---

## ⚡ Start Here

- **Current versions:** Code.gs v1.4.203 · KCFactory.jsx v1.4.85
- **Deploy needed:** BOTH — Code.gs v1.4.203 (paste into GAS) + KCFactory.jsx v1.4.85 (`npm run deploy`).
- **Test after deploy:** #115 address/phone in BN Create · #123 แบบพิมพ์ btn · #124 address/phone in BN Edit · #125 PDF btn on BN Detail · detail field: yellow warn at 25 chars, red at 34, no longer fires early from product name width
- **Next up (open):** #34 DETAIL_MAX calibration (print test) · #111–#114 (JSX refactors, defer)
- **DETAIL_MAX calibration** — tested, 34–36 chars still too long; cap TBD, discuss separately
- **Deploy workflow:** edit locally → `npm run deploy` (goes live) → GitHub Desktop commit + push
- **Cross-machine sync:** `git pull` before starting, `git push` after finishing
- **File continuity:** Start a new dated file for each new day. Do not append to this one after the session ends.

---

## Rules (apply every session)

### Hard Constraints

- `buildTaxInvoicePortraitPDF` — never modify directly for experimental changes; all changes must go through `stagingTestTaxInvoicePortrait()` first and be confirmed before promoting to live builder (CSS border lines may be adjusted directly)
- Col O (col 15) in Tax Invoice History sheet has a year-month formula — **DO NOT TOUCH**
- **Never copy source files again mid-session** — work from uploaded copies only

### Version & Doc

- **Always bump the version number as the last step of every change, before saying done.**
  - `KCFactory.jsx`: TWO places — (1) changelog comment at top (newest first) + (2) footer `<span>` version string
  - `Code.gs`: TWO places — (1) header comment on line 3 (newest first) + (2) `getAppVersion()` return string. Bumping only the comment is wrong and causes footer to show stale version.
- Version log order: **newest first**
- **Never rewrite or replace sections of this doc — only ADD new entries or UPDATE existing status.** Rewrites cause content loss especially after context compaction.
- **Never change doc format** (table layouts, column names, section structure) unless explicitly told to do so.

### Coding Discipline

- **Never code without explicit user signal** — always confirm scope/direction first
  - ✅ Signal (code it): imperative sentence ("change X to Y", "fix this", "try X"), or direct confirmation ("yes", "go ahead", "ok")
  - ❌ Not a signal: questions ("can we do X?", "why is X?"), bug reports without instruction ("btw X is broken"), observations ("this seems wrong")
  - ❌ Not a signal: Claude listing an item in a response — each distinct change needs its own explicit signal
  - **Scope discipline**: only implement exactly what was signaled. No "while I'm here" additions. If a bug is found during implementation, note it — do not fix without a separate signal
- **When unclear, clarify — never guess** — if intent is ambiguous, ask before acting
- **Diagnose before fixing** — understand root cause, validate approach before implementing
- **Before coding any Apps Script method** — web_search the exact signature on developers.google.com. Never guess.

### Deploy Reminder

- After every batch of changes: call `present_files` for **only the files that changed** this session — do NOT present unchanged files
- Immediately after `present_files`: explicitly state which file(s) need deploying and how:
  - Code.gs → paste into GAS editor manually
  - KCFactory.jsx → `cd Documents\GitHub\KC-Admin` then `npm run deploy`
- Never omit the deploy instruction text even if only one file changed

### Session & Work Style

- **Agree on session agenda first** — before any work begins, list what we're tackling and stick to it
- **One work area per session** — avoid jumping between unrelated areas; anything out of scope gets logged to KC_Backlog.md, not acted on
- **Doc updates are always in scope**
- **Backlog doc workflow** — `KC_Backlog.md` is the live working file; update freely during sessions. `KC_Daily_Progress_YYYY-MM-DD.md` is the permanent record; sync from backlog at end of day only.
- **Work surgically** — grep-first before any read or edit; use targeted reads (offset/limit); confirm exact string with grep before any Edit
- **Check the docs before asking the user** — grep progress docs first; only ask if the answer is genuinely not there

### Log Before Fix — Always

- Every bug or issue must be logged to `KC_Backlog.md` with a number **BEFORE** any fix is made
- Even if fixing immediately: assign the number first, log the description, then fix and mark Done
- Never fix silently — if it's not in the backlog it doesn't exist

### Code Change Pattern (follow every time, no exceptions)

1. Grep for the target string first — confirm exact match and location
2. Read only the relevant section (offset/limit) — not the whole file
3. Diagnose root cause
4. **Propose approach → wait for explicit approval**
5. Make targeted edits using unique surrounding context
6. Verify change applied (grep for old string — should be gone)
7. Bump version + add changelog entry (both places for each file)
8. `present_files` + deploy instructions

### Critical Mistakes to Avoid

- **Never run a broad find/replace** scoped only by keyword — always use unique surrounding context and preview before applying. Wrong target = broken code.
- **Never re-copy source files mid-session** — overwrites all accumulated fixes. Copy once at session start.
- **Never guess Apps Script / Google API signatures** — always web_search developers.google.com first.
- **Remove all references before removing a state variable** — always grep for all usages first.
- **Avoid `replace_all: true` on non-unique strings** — use specific surrounding context to target the correct instance.
- **Terminal must be in KC-Admin folder** — always `cd Documents\GitHub\KC-Admin` before any npm command.
- **Never state things as fact from visual inspection of photos** — photos may be blurry/angled; say "unclear" rather than guessing.
- **Never skip the 8-step code change pattern** — even for small/obvious changes. No exceptions.
- **Code.gs version bump = TWO places** — header comment (line 3) AND `getAppVersion()` return string.
- **KCFactory.jsx version bump = TWO places** — header changelog comment AND footer `<span>` version string.

### PDF Rules

- **Template changes go into stagingTest first** — all PDF layout/style changes must be implemented in `stagingTest[Format]()` (via opts) before touching the original builder; only apply to original after confirmed; never modify a production builder directly for experimental changes
- **Every staging opts change = its own version bump + experiment log entry** — log format: `vX.X.XXX: tested [what] — [result/why]`; mark promoted `→ live`; active test `← testing`; idle `[no active experiment]`
- **Show mockups/previews before code** for any UI or PDF change
- Design in HTML mockup first, toggle ต้นฉบับ/สำเนา in browser before coding
- All sizes in **mm** (not px)
- Font: Prompt base64, weights 400/500/600/700 — no external imports
- `@page{size:A4 [landscape|portrait];margin:0}` — always margin:0, control spacing in CSS
- Screen px ≠ print mm — always test actual PDF output

### TI Landscape Reference (calibrated 2026-06-16, center-lock live since v1.4.147)

- **leftHalfWidth: 151.5mm** → divider at paper center ✓ (do not change)
- **outerLeft: 13mm** (printer non-printable floor; cannot go lower on HP DeskJet 2800)
- **innerGapL: 5mm · innerGapR: 9mm · outerRight: 2mm** (live since v1.4.152)
- **Constraint:** outerLeft + innerGapL must = 18mm to hold divider at 151.5mm (13+5=18 ✓)
- **Recalibration:** if leftHalfWidth ever changes, re-run `stagingTestCenterLine()` with `@page left:0`

### GAS PDF Rendering — Key Constraints

- `overflow:hidden` clips horizontally but does NOT constrain row height — cells expand vertically for long text
- `white-space:nowrap` on flex children inside `<td>` is not reliably respected for row height in GAS PDF
- `flex:1` children need `min-width:0` or `overflow:hidden` won't clip — `min-width:auto` (default) prevents shrinking below content size (fixed v1.4.161)
- Only real fix for vertical expansion: frontend cap tight enough that text never reaches PDF long enough to wrap
- `position:absolute` unsupported — use flex + fixed widths
- 2:1 CSS-to-physical ratio applies to pageMarginLeft (page offset) only; flex child widths are 1:1
- Full lessons learned in `KC_Backlog.md` → Lessons Learned section

---

## Outstanding Items

*(Snapshot from KC_Backlog.md at session start — source of truth is KC_Backlog.md)*

| # | Item | Status | Notes |
|---|---|---|---|
| 96 | BN Create — monthly batch flow redesign | ✅ Done + tested | Split-pane tested OK; follow-ups split into #99–#110 |
| 104 | Created BN not persisted on revisit | ✅ Done + tested | KCFactory v1.4.62 |
| 106 | Print queue: show all created BNs + printed flag | ✅ Done | Code.gs v1.4.191, KCFactory v1.4.63 |
| 107 | พิมพ์เลย → one combined PDF (format picker) | ✅ Done + print-tested | Code.gs v1.4.192, KCFactory v1.4.64 |
| 108 | Combined PDF date "NaN undefined NaN" | ✅ Done | Code.gs v1.4.194 (thaiMonth dd/MM/yyyy) |
| 109 | Combined PDF → subfolder + auto-cleanup | ✅ Done | Code.gs v1.4.195 |
| 110 | Combined folder configurable in Settings | ✅ Done | Code.gs v1.4.196, KCFactory v1.4.65 |
| 44 | Clean up / relocate staging test functions | ✅ Done | Moved to Staging.gs (Code.gs v1.4.193) |
| 45 | Trim Code.gs version log | ✅ Done | → CHANGELOG.md (Code.gs v1.4.193) |
| 105 | BN History — no cache + slow detail load | ✅ Done | Code.gs v1.4.197, KCFactory v1.4.66 |
| 99 | BN Create — auto-load on month nav | ✅ Done | KCFactory v1.4.69 |
| 100 | BN Create — date row still shifts | ✅ Done | KCFactory v1.4.67 (scrollbar-gutter) |
| 101 | BN Create — DN list gone + not clickable after create | ✅ Done | KCFactory v1.4.67 |
| 103 | BN Create — print queue position shifts | ✅ Done | KCFactory v1.4.67/68 |
| 116 | DN detail popup — slow first load | ✅ Done | Code.gs v1.4.198/199 + KCFactory v1.4.70/72 |
| 118 | BN Create — month nav refetch (no cache) | ✅ Done | KCFactory v1.4.71 |
| 117 | Perf — getLastNonEmptyRow whole-column (systemic) | ✅ Done | Code.gs v1.4.200 |
| 119 | BN nav click → return to list | ✅ Done | KCFactory v1.4.73 |
| 120 | BN breadcrumb doc suffix | ✅ Done | KCFactory v1.4.74 |
| 121 | DN list default range + Load-all | ✅ Done | KCFactory v1.4.75 |
| 122 | Shared DateRangePicker (DN/TI/BN) | ✅ Done | KCFactory v1.4.76 |
| 102 | BN Create — PDF format toggle wording | ✅ Done | KCFactory v1.4.77 |
| 115 | BN Create — edit customer info at creation | ✅ Done | KCFactory v1.4.78 |
| 123 | BN Detail — แบบพิมพ์ (landscape) button | ✅ Done | Code.gs v1.4.201, KCFactory v1.4.79 |
| 124 | BN Edit — editable address/phone | ✅ Done | Code.gs v1.4.202, KCFactory v1.4.80 |
| 125 | BN Detail — PDF button on-demand | ✅ Done | Code.gs v1.4.202, KCFactory v1.4.81 |
| 111 | Refactor DN/TI forms — shared editor + hook | ⏳ Pending | P3xL (absorbs #78) |
| 112 | Refactor DN/TI detail views | ⏳ Pending | P4xM |
| 113 | Refactor DN/TI list pages | ⏳ Pending | P4xM |
| 114 | JSX cleanup — shared styles + fmtBaht() | ⏳ Pending | P4xS |
| 98 | Hash routing — new-tab navigation | ⏳ Parked | Blocked until requested |
| 94 | Artifact preview broken (react-dom) | ⏳ Pending | P4 |
| 84 | Product CRUD — per-invoice-type config | ⏳ Pending | Scope TBD |
| 22 | Split Code.gs | ⏳ Pending | After system stable |
| 13 | Page color label (portrait) | ⏳ Pending | TBD with director |

---

## Work Done This Session

### KCFactory.jsx (v1.4.58 → v1.4.61)

| Version | # | Change |
|---|---|---|
| v1.4.59 | #96 | BNCreateView redesign: split-pane layout; BNCustomerPanel (right pane) with checkbox DN table, date picker (grid layout), format toggle, inline confirm; month nav ‹ › replaces dropdowns; print queue below right pane |
| v1.4.60 | #96 | UX fixes: left customer list independently scrollable (fixed-height flex, overflow-y:auto); date/format row switched to grid (no shift between customers); done state shows BN no + date + count + total + PDF link; print queue moved into right pane (always visible, no outer scroll); DN popup (click DN no → DNDetailPopup with cache) added to BNCustomerPanel |
| v1.4.61 | #95 | Dead code cleanup: removed `_REMOVED_CreateBNTab_placeholder` + `BNHistoryTab` (~251 lines); version changelog trimmed to 15 entries (full history in KC_Daily_Progress_2026-06-18.md) |

### Code.gs

No changes this session.

---

## Work Done — Session 2 (afternoon, 19 June)

*BN print-queue testing + combined-print feature + housekeeping.*

### KCFactory.jsx (v1.4.61 → v1.4.65)

| Version | # | Change |
|---|---|---|
| v1.4.62 | #104 | BN Create restores created state on revisit — reads backend `generated` flag + fills BN no/date/count/total/PDF from `getBillingNotes()` (was hardcoded `generated:false`) |
| v1.4.63 | #106 | Print queue seeds from all created BNs on search (shows even when nothing created this visit); checkbox `checked = !printed`; พิมพ์เลย marks printed in DB |
| v1.4.64 | #107 | พิมพ์เลย generates ONE combined PDF in chosen format (รูปแบบ แนวตั้ง/แนวนอน picker) via `printCombinedBillingNotes`; opens single file + marks printed |
| v1.4.65 | #110 | Settings: add BN Combined folder URL field (blank = auto subfolder); saved via `saveConfig` `folders.bnCombined` |

### Code.gs (v1.4.190 → v1.4.196)

| Version | # | Change |
|---|---|---|
| v1.4.191 | #106 | `getBillingNotes` returns `printed` flag (col K); add `markBillingNotesPrinted(bnNos)` + router case |
| v1.4.192 | #107 | Extract `bnPortrait/LandscapePageHTML` + `bnPortrait/LandscapeCSS` from builders (output identical); add `printCombinedBillingNotes(bnNos, format)` → one PDF w/ page-breaks + router case |
| v1.4.193 | #44/#45 | Cleanup: trim version log to 15 (full history → CHANGELOG.md); move all `test*/stagingTest*` to new **Staging.gs** (Code.gs 3020 → 2404 lines) |
| v1.4.194 | #108 | Fix `thaiMonth()` to parse `dd/MM/yyyy` (combined PDF date showed "NaN undefined NaN") |
| v1.4.195 | #109 | Combined PDF saves to "Combined" subfolder (`getOrCreateChildFolder_`) + `cleanupCombinedFolder_` keeps newest 5 |
| v1.4.196 | #110 | `folderBNCombined` configurable in Config/getConfig/saveConfig; `printCombinedBillingNotes` uses it if set, else auto subfolder |

### New files
- **Staging.gs** — relocated test/staging functions (#44). Must be added to the GAS project.
- **CHANGELOG.md** — archived full Code.gs version history (#45). Repo only, no deploy.

---

## Work Done — Session 3 (evening, 19 June)

*BN-Create bug fixes + perf (caching, sheet-read optimization).*

### KCFactory.jsx (v1.4.65 → v1.4.71)

| Version | # | Change |
|---|---|---|
| v1.4.66 | #105 | BillingNotePage uses app-level cache for BN list + detail (survives navigation); detail seeded from enriched list row → first open instant |
| v1.4.67 | #100/#101/#103 | scrollbar-gutter stable (date row no shift); print queue pinned bottom; done state shows clickable DN list |
| v1.4.68 | #103 | refine: print queue sits under content (flex 0 1 auto) not pinned to viewport bottom |
| v1.4.69 | #99 | month nav ‹ › auto-loads list (no ค้นหา click) |
| v1.4.70 | #116 | session-wide `_dnStore` DN cache shared across all popups (instant repeat opens) |
| v1.4.71 | #118 | per-month search cache (instant revisit on month nav); ค้นหา forces refresh; create invalidates current month |

### Code.gs (v1.4.196 → v1.4.199)

| Version | # | Change |
|---|---|---|
| v1.4.197 | #105 | getBillingNotes (Option B): one grouped Invoice History scan → per-BN invoices[]+address/phone embedded (detail opens instant) |
| v1.4.198 | #116 | getDNDetail: createTextFinder on col A to read only the DN's rows |
| v1.4.199 | #116 | getDNDetail: drop getLastNonEmptyRow("A") — full-column getValues was the real 3–4s cost |

### Newly logged (open)
- **#117** getLastNonEmptyRow full-column read is systemic (many functions) — perf pass needed
- **#102** toggle wording · **#115** edit customer at BN create · **#111–#114** JSX refactors

---

## Work Done — Session 4 (late, 19 June)

*DN cross-reuse, BN nav/breadcrumb fixes, DN-default range, perf, and the shared date picker.*

### KCFactory.jsx (v1.4.71 → v1.4.76)

| Version | # | Change |
|---|---|---|
| v1.4.72 | #116 | DN list load seeds shared `_dnStore` (id→detail incl. items) → opening those DNs from BN is instant (no getDNDetail) |
| v1.4.73 | #119 | Clicking ใบวางบิล nav returns to BN list (goListRequest wired to BillingNotePage) |
| v1.4.74 | #120 | BN breadcrumb shows doc suffix (BN no / สร้างใบวางบิล) via onViewChange |
| v1.4.75 | #121 | DN list default = last 3 months + "ทั้งหมด" button (later superseded by #122 picker) |
| v1.4.76 | #122 | Shared DateRangePicker (เดือน/ทั้งปี + year nav + month grid + custom range, dropdown) → DN list, TI list, BN Create (monthOnly), BN History |

### Code.gs (v1.4.199 → v1.4.200)

| Version | # | Change |
|---|---|---|
| v1.4.200 | #117 | getLastNonEmptyRow bounded to getLastRow()+one column (was full-grid getRange("col:col")); fixes all 23 call sites; col-A scan preserved (col O formula can't inflate) |

### Newly logged (open)
- **#102** toggle wording · **#115** edit customer at BN create · **#111–#114** JSX refactors

---

## Lessons Learned (2026-06-19)

**GAS performance**
- **`getRange("A:A").getValues()` reads the WHOLE grid column into the script** (~3–4s), not just rows with data. This (inside `getLastNonEmptyRow`) — not the row scan — was the real cause of slow DN detail. Avoid full-column/row getValues. (→ systemic #117)
- **Use `createTextFinder` for single-record lookups:** `sheet.getRange("A:A").createTextFinder(id).matchEntireCell(true).findAll()` searches server-side without loading values — far faster than iterating `getValues()` to find one record. Needs no row count.
- **Prefer `sheet.getLastRow()`** over custom full-column reads when trailing-empty handling allows.
- **Embed detail in the list payload** (like DN/TI) so detail views open with zero extra round-trip — one grouped scan at list load (cached) beats one scan per click (#105 Option B).
- Per-call GAS round-trip is ~0.5–1.5s inherent; cache so each record is fetched once per session (`_dnStore`, monthCache, app-level cache).

**React/JS gotchas**
- **Passing a function directly to `onClick` passes the event as the first arg** → breaks default params like `(mArg = month)`. Wrap: `onClick={() => fn()}` (caught in #99).
- **A component must actually consume `cache`/`updateCache` props** — `BillingNotePage` was passed them but ignored them, silently re-fetching every visit (#105).
- `new Date("dd/MM/yyyy")` is Invalid Date in JS/GAS → "NaN undefined NaN". Parse the parts explicitly (#108).

**CSS / layout**
- **`scrollbar-gutter: stable`** prevents horizontal layout shift when an overflow scrollbar appears/disappears between states (#100).
- **`page-break-after: always` IS honored** by GAS HTML→PDF — confirmed by print test; enables multi-document combined PDFs (#107).

> Candidate for the permanent GAS lessons in KC_Backlog.md: the full-column `getValues` perf trap + TextFinder pattern.

---

## Pending Testing

| # | Item | What to Test | Result |
|---|---|---|---|
| 96 | BN Create split-pane | Search/list/scroll/confirm/popup all work | ✅ Passed — follow-ups #99–#103 logged |
| 104 | Created BN persists on revisit | Create BN → leave → return → search same month → shows สร้างแล้ว + BN no + done state | ✅ Passed |
| 107 | Combined PDF | พิมพ์เลย → one file in chosen format; each BN own page | ✅ Passed (page-break + date OK after v1.4.194) |
| 110 | Combined folder config | Settings field set → file lands there; blank → auto "Combined" subfolder | ✅ Passed |
| 34 | DETAIL_MAX calibration | Test print TI/DN with real Thai detail text — confirm text fits; loosen to 34–36 if real data hits the cap | ⏳ Tested — 34–36 chars still too long; cap value TBD, discuss later |
| 55 | PDF desc overflow fix | Test print with 24–25 wide ASCII chars in detail field — confirm text clips at column boundary | ⏳ Tested with #34 — still overflowing; discuss later |
| 115 | BN Create — address/phone editable | Verify pre-filled from customer; edit → confirm BN → check PDF shows overridden values | ✅ Passed |
| 123 | BN Detail — แบบพิมพ์ button | First click generates landscape PDF; repeat click opens cached URL; edit clears cache | ⏳ Pending deploy |
| 124 | BN Edit — address/phone editable | Verify pre-filled from BN record; edit → save → detail shows updated values; PDF regenerates | ⏳ Pending deploy |
| 125 | BN Detail — PDF button on-demand | Click PDF btn with no col H URL → generates + caches; repeat = instant; edit clears both URL caches | ⏳ Pending deploy |

---

## Work Done — Session 5 (evening, 19 June)

*BN UX polish — format toggle cleanup, per-BN address/phone override, landscape PDF on detail page.*

### KCFactory.jsx (v1.4.76 → v1.4.79)

| Version | # | Change |
|---|---|---|
| v1.4.77 | #102 | BN format toggle wording: แนวตั้ง/แนวนอน → PDF/แบบพิมพ์; label "รูปแบบ PDF" → "รูปแบบ" (3 places: BNEditForm, BNCustomerPanel, print queue) |
| v1.4.78 | #115 | BNCustomerPanel: editable ที่อยู่ + โทรศัพท์ (per-BN override); pre-filled from cust, reset on customer switch, passed to confirmBN |
| v1.4.79 | #123 | Remove format toggle from BNCustomerPanel (always portrait at creation); add แบบพิมพ์ btn to BNDetailView (generates landscape via generateBillingNoteLandscapePDF, cached in landscapeUrl, cleared on edit); api.generateBillingNoteLandscapePDF |

### Code.gs (v1.4.200 → v1.4.201)

| Version | # | Change |
|---|---|---|
| v1.4.201 | #123 | confirmBillingNote always portrait (remove format param + router); new generateBillingNoteLandscapePDF() caches landscape URL in BN History col L; editBillingNote clears col L; getBillingNotes + getBillingNoteDetail return landscapeUrl |

### Newly logged (open)
- **#123** BN landscape PDF (done this session)
- **#124** BN Edit — editable address/phone (same pattern as #115, logged, not yet implemented)

---

## Work Done — Session 6 (evening, 19 June)

*BN address/phone persistence (#124), PDF on-demand button (#125).*

### KCFactory.jsx (v1.4.79 → v1.4.81)

| Version | # | Change |
|---|---|---|
| v1.4.80 | #124 | BNEditForm: add address+phone state (pre-filled from detail.address/phone), fields UI (2-col grid below date/customer), pass to api.editBillingNote; api.generateBillingNotePortraitPDF added |
| v1.4.81 | #125 | BNDetailView: add ptLoading state + generatePortrait() handler (cache-first, on-demand generate); replace conditional `<a>` PDF link with `<Btn>` (always visible); handleSaveEdit clears both pdfUrl + landscapeUrl |

### Code.gs (v1.4.201 → v1.4.202)

| Version | # | Change |
|---|---|---|
| v1.4.202 | #124 | confirmBillingNote: persist address/phone to BN History cols M/N (if address or phone set); editBillingNote: accept + write params.address/phone to cols M/N; getBillingNoteDetail: read cols M/N as addressOverride/phoneOverride, apply after Invoice History scan (BN History takes priority) |
| v1.4.202 | #125 | New generateBillingNotePortraitPDF(bnNo): checks col H cache, generates portrait PDF if empty, stores in col H, returns URL; router case added |

### Newly logged
- **#125** BN Detail PDF button on-demand (done this session)

---

## Work Done — Session 7 (evening, 19 June)

*Architectural fix: detail field width guard. #127 new customer modal 3-way. atLimit/atWarn display fix.*

### KCFactory.jsx (v1.4.82 → v1.4.85)

| Version | # | Change |
|---|---|---|
| v1.4.83 | arch fix | `updateDetailItem` (DN) + `updateDetailTI` (TI): remove incorrect `descWidth(getDescText(testIt)) <= DESC_MAX` guard — detail is a separate right block in the PDF description column, not appended inline. Now only `descWidth(val) <= DETAIL_MAX` applies. |
| v1.4.84 | #127 | newCustWarning modal: 3-way (ใช่ เพิ่มลูกค้าใหม่ / ไม่ ไม่ต้องเพิ่ม / ยกเลิก). "ไม่" saves doc but sets `skipCustomerLogRef` → `skipAutoLog:true` in payload → Code.gs skips `autoLogCustomer_`. ConfirmModal gets `onSecondary`+`secondaryLabel` props (neutral grey middle button). |
| v1.4.85 | display fix | `dw` in row render now uses `desc+desc2` only (was `getDescText` which included detail). With long product names, combined width hit DESC_MAX at ~4th detail char, causing `atLimit=true` immediately and skipping yellow `atWarn` entirely. Now: yellow fires at detailW≥25, red at detailW≥34 or dw≥48, correctly independent. |

### Code.gs (v1.4.202 → v1.4.203)

| Version | # | Change |
|---|---|---|
| v1.4.203 | #127 | `createDeliveryNoteFromWeb` + `createTaxInvoiceFromWeb`: wrap `autoLogCustomer_` in `if (!data.skipAutoLog)` guard |

---

## Planning — Session 8 (refactor scoping, no code)

*Discussed refactor cluster. Shelved #114, re-scoped #111. No code changes this session.*

### #114 — shelved
- Decision: do NOT touch the invoice templates (DN/TI/BN have intentionally different per-template styling → not true duplication; merging would couple them).
- Scan finding: under that constraint #114 collapses to ~11 caption-label sites (all 34 toLocaleString money calls + the shared-primitive style consts live INSIDE the invoice templates). Not worth a session → shelved.

### #111 — re-scoped (logic-first)
- Full scan of DeliveryNoteForm (485–751) vs TaxInvoiceForm (2895–3199).
- Key finding: original `<InvoiceItemsEditor>` table-merge is BACKWARDS. The item tables are exactly what DIFFERS (DN: size col + single amount cell; TI: qty inline + satang col + colgroup); customer cards differ (TI taxId/invoiceRef); summaries differ (DN total row vs TI VAT block). These stay per-template.
- What IS byte-identical = the LOGIC (13 state hooks+refs, items init, checkProductName, checkNameSimilarity, updateItem, updateDetail, addRow, addContinuationRow [data-attr differs], removeRow, cellInput, handleSave cust-check preamble, 4 modals).
- New plan: P1 `useInvoiceForm(initial,isEdit,{products,keyPrefix})` (~120 lines, zero visual change) · P2 `<ProductWarningModal>` (absorbs #78) · P3 (opt) `<CustomerCheckModals>`. Net ~180 lines, no shared markup between DN/TI.
- #78 folded into #111 (P1 state + P2 modal). Backlog updated.
- Coding deferred to a later session (user: "re-scope backlog first, code later").

---

## Work Done — Session 8 (refactor #111 Phase 1)

*Extracted shared form-logic hook from DN + TI forms. Logic-only; templates untouched.*

### KCFactory.jsx (v1.4.85 → v1.4.86)

| Version | # | Change |
|---|---|---|
| v1.4.86 | #111 P1 | New `initInvoiceItems(initial,isEdit)` + `useInvoiceForm({initial,isEdit,products,detailAttr})` hook (placed after getDescText). Hook owns: items + 10 state hooks + 3 refs; handlers checkProductName, checkNameSimilarity, updateItem, updateDetail, addRow, addContinuationRow (uses detailAttr → focuses new cont row via getAttribute), removeRow, cellInput; and `guardedSave(name, doSave)` (runs new-invoice cust-similarity/unknown-customer guards, then sets saving + calls form's doSave({filled,cleanItems,skipLog})). DeliveryNoteForm + TaxInvoiceForm now call the hook and keep ONLY their own fields (DN: date/name/address/phone; TI: +taxId/invoiceRef), derived totals (DN total; TI sub/vat/gt), payload shape, api call, and all JSX (customer card, items table, summary, 4 modals). detailAttr: DN "data-detail-idx", TI "data-ti-detail-idx" (DOM namespaces kept separate). |

### Notes
- **No behavior change intended.** `updateItem` converted to functional `setItems(prev=>…)` (was `setItems(items.map…)`) — identical result, safer. Everything else byte-for-byte equivalent.
- Renamed at call sites: TI checkProductNameTI→checkProductName, updateDetailTI→updateDetail, addContinuationRowTI→addContinuationRow; DN updateDetailItem→updateDetail.
- **Verification:** esbuild bundle OK (231.9kb, was 234.0kb baseline). Stale-ref grep clean (old handler names only remain in the v1.4.83 changelog comment). Template-specific JSX confirmed intact (TI satang col + VAT block, DN size column). File 3836→3779 lines net (−57) while ADDING ~150-line hook ⇒ ~190 lines of duplication removed.
- ⚠️ **NEEDS MANUAL TEST after deploy** (core data-entry forms): create DN, create TI, edit existing DN, edit existing TI, similar-name warning, new-customer 3-way modal, product-not-found modal, add continuation row (Enter), delete row, 10-row limit. Don't start #111 P2 (ProductWarningModal) until this passes.
- #78 state portion folded into P1; modal JSX still duplicated → P2.
