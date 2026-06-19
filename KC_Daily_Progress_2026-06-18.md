# KC Factory System — Daily Log 2026-06-18
**Code.gs:** v1.4.160 → v1.4.190 | **KCFactory.jsx:** v1.4.29 → v1.4.58

---

## ⚡ Start Here

- **Current versions:** Code.gs v1.4.190 · KCFactory.jsx v1.4.58
- **Deploy needed:** Code.gs v1.4.190 (paste into GAS editor) · KCFactory.jsx v1.4.58 (`npm run deploy`)
- **DETAIL_MAX=34 calibration test print** still outstanding — confirm real Thai detail text fits
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

*(Snapshot from KC_Backlog.md at session close — source of truth is KC_Backlog.md)*

| # | Item | Status | Description | PxC | Logged |
|---|---|---|---|---|---|
| **Refactor** | | | | | |
| 61 | Extract findSimilarCustomers() | ✅ Done (v1.4.34) | D: COMMON_PREFIXES, _norm, and filter logic duplicated 6x across DN form, TI form, CustomerPage. Extract to top-level findSimilarCustomers(nameVal, list) → string[]. | P3xS | 2026-06-18 |
| 62 | Extract collapseItems() | ✅ Done (v1.4.34) | D: Continuation row collapse loop duplicated in DN and TI handleSave. Extracted to top-level collapseItems(items). | P3xS | 2026-06-18 |
| 63 | Fix emptyItem() inconsistency in TI | ✅ Done (v1.4.34) | D: addContinuationRowTI and addRow inlined empty item object. Replaced with { ...emptyItem(), _cont: true } and emptyItem(). | P4xS | 2026-06-18 |
| 64 | VAT rate configurable via Config sheet | ✅ Done (v1.4.34 / v1.4.162) | D: VAT_RATE top-level const in Code.gs; vatRate read from Config sheet in getConfig(); PDF builders use cfg.vatRate; frontend loads via getConfig() and passes vatRate prop through TaxInvoicePage→TaxInvoiceForm/TaxInvoiceDetail. | P3xM | 2026-06-18 |
| 65 | SIMILARITY_THRESHOLD constant | ✅ Done (v1.4.34) | D: Extracted to top-level const SIMILARITY_THRESHOLD = 0.75 in KCFactory.jsx. | P4xS | 2026-06-18 |
| 66 | Company EN name fallback hardcoded in Code.gs | ✅ Done (v1.4.162) | D: Removed hardcoded fallback "KIMCHIANG LIMITED PARTNERSHIP" from 4 PDF builders → co.nameEN \|\| "". Config sheet defaults still seed it on first run. | P3xS | 2026-06-18 |
| 67 | TAX_INVOICE_SHEET + CUSTOMER_SHEET outside CONFIG | ✅ Done (v1.4.162) | D: Moved into CONFIG as tiSheet and customerSheet. All 16 references updated. | P4xS | 2026-06-18 |
| 68 | Remove dead emptyItems() function | ✅ Done (v1.4.34) | D: Removed — was never called anywhere. | P4xS | 2026-06-18 |
| 69 | Rename upd/ci in TI form to match DN naming | ✅ Done (v1.4.34) | D: upd→updateItem, ci→cellInput throughout TI form (definition + all call sites). | P4xS | 2026-06-18 |
| **Bug** | | | | | |
| 10 | DN portrait — font & sizing QA | ✅ Done | D: Font scaled in v1.4.94/97; needs visual test print to confirm sizing correct | P1xS | 2026-06-12 |
| 18 | Date picker font mismatch | ✅ Done (v1.4.32) | D: Date inputs use system/browser default font instead of Prompt | P4xS | 2026-06-12 |
| **PDF** | | | | | |
| 55 | PDF description column overflow — wide chars | ✅ Done (v1.4.161) | D: TTT/XXX-style wide ASCII chars overflow desc column despite DESC_MAX/DETAIL_MAX frontend caps. Root cause: flex:1 div has min-width:auto (default), preventing overflow:hidden from clipping. Fix: add min-width:0 to all flex:1 desc-right divs in all 4 PDF builders. | P2xS | 2026-06-18 |
| 56 | Similar name warning misses containment case | ✅ Done (v1.4.30) | D: Typing "กำธร" while "คุณ กำธร" exists gives no warning — Levenshtein score 0.57 < 0.75 threshold. Fix: add containment check — if normalized typed name appears inside existing name (or vice versa) and both ≥3 chars, treat as similar. | P2xS | 2026-06-18 |
| 57 | Similar name warning — exclude common title prefixes | ✅ Done (v1.4.31) | D: Typing "คุณ" or "บริษัท" alone would trigger containment warning against every customer with those prefixes. Fix: define COMMON_PREFIXES exclusion set; skip containment check if normTyped exactly matches a prefix word. | P2xS | 2026-06-18 |
| 58 | Similar name warning fires on save — should fire on name blur/Enter | ✅ Done (v1.4.33) | D: Warning currently triggers when user clicks บันทึก. Should fire immediately when user finishes typing the name (onBlur or Enter on the name field) — before they fill in address/phone/etc. | P2xS | 2026-06-18 |
| 60 | Customer delete hard-removes row from sheet | ✅ Done (Code.gs v1.4.166) | D: deleteCustomer() writes "ลบแล้ว" to หมายเหตุ col (col 5) instead of sheet.deleteRow(); getCustomers() filters soft-deleted rows; createCustomer() uniqueness check skips them. Row preserved for audit. | P3xS | 2026-06-18 |
| 13 | Page color label (portrait) | ⏳ Pending | D: Small colored label per page matching physical paper set (green/yellow/white/blue). Placement TBD with director. | P4xS | 2026-06-11 |
| 44 | Clean up staging test functions | ⏳ Pending | D: Review all `stagingTest*()` functions — remove one-off experiments no longer needed. Related to #22. | P4xS | 2026-06-16 |
| 45 | Trim Code.gs version log | ⏳ Pending | D: Header version log grows unboundedly. Keep last 10 entries in Code.gs; archive older entries to `CHANGELOG.md` in repo. Related to #22, #44. | P4xS | 2026-06-17 |
| **Config / Files** | | | | | |
| 16 | Organize Google Drive folders | 🔀 Merged → #70 | D: All docs save to single Drive folder; separate by type or month/year. ➜ Merged into #70 (2026-06-18) — design finalized there. | P4xM | 2026-06-12 |
| 70 | Restructure Config sheet + separate Drive folders per doc type | ✅ Done (v1.4.163) | D: Split Config into "Config" (company info + system settings) and "Config_Products" (products/sizes). Remove hardcoded folder IDs from Code.gs. PDF builders read folderDN/folderTI/folderBN from cfg. Supersedes #16. | P3xM | 2026-06-18 |
| 71 | New product prompt on invoice save | ✅ Done (v1.4.36 / v1.4.165) | D: On invoice save (DN + TI), for each item whose product name is not found in Config_Products: show modal — similar chips (click → auto-fills) or add-new button. ProductAutocomplete component replaces <select> in DN+TI desc field. Backend: addProduct(name). | P3xM | 2026-06-18 |
| 72 | Product management CRUD page | ✅ Done (KCFactory.jsx v1.4.45, Code.gs v1.4.167) | D: ProductPage with สินค้า/ขนาด tabs; add/edit/delete with ConfirmModal; wired to "stock" nav. Backend: getProducts/updateProduct/deleteProduct; addProduct extended with type param. | P4xM | 2026-06-18 |
| 73 | getConfig() not reading products from Config_Products | ✅ Done (v1.4.164) | D: Products moved to Config_Products sheet but getConfig() still reads product/size rows from Config sheet → dropdown shows old placeholder products. Fix: after reading Config sheet, call getProductConfig() and override products/sizes if non-empty. | P2xS | 2026-06-18 |
| 74 | SettingsPage cleanup | ✅ Done (KCFactory.jsx v1.4.42) | D: Remove products/sizes EditableList; replace invFolder/bnFolder with folderDN/folderTI/folderBN (matches Code.gs); remove stale props from renderPage call. | P2xS | 2026-06-18 |
| 75 | Settings page lock/unlock | ✅ Done (KCFactory.jsx v1.4.42) | D: locked state default true; 🔒/🔓 toggle button; inputs disabled when locked; save button hidden when locked; auto re-locks after save. | P3xS | 2026-06-18 |
| 76 | CustomerAutocomplete: remove 8-item cap on suggestion list | ✅ Done (v1.4.35) | D: Both branches in filtered had .slice(0,8) — removed; list now scrolls with no cap. maxHeight:220 container already handles overflow. | P2xS | 2026-06-18 |
| 77 | addProduct() mid-session: products state not updated after add | ✅ Done (v1.4.37) | D: api.addProduct() writes to Config_Products but local products state in App not updated → newly added product still triggers modal until page refresh. Fix: pass setProducts down as prop; call setProducts(prev=>[...prev,name]) on success. Also fix stray `sizes;` no-op in DN modal button. | P2xS | 2026-06-18 |
| 78 | Refactor: productWarning state + modal duplicated in DN and TI forms | ⏳ Pending | D: checkProductName, productWarning state, addingProduct state, and the modal JSX are copy-pasted between DeliveryNoteForm and TaxInvoiceForm. Extract into shared hook or component when convenient. | P4xS | 2026-06-18 |
| 79 | ConfirmModal: Enter key to confirm (delete/cancel only) | ✅ Done (v1.4.38) | D: Add enterConfirm prop (default false) + useEffect keydown — Enter → onConfirm when enterConfirm=true and not loading, Escape → onCancel always. Enabled on: row delete DN/TI, invoice cancel DN/TI, customer delete. NOT on: similar-name warnings or add-new modals. | P3xS | 2026-06-18 |
| 81 | ProductAutocomplete dropdown clipped by overflow:hidden | ✅ Done (v1.4.39) | D: Table wrapper has overflow:hidden which clips the absolute-positioned dropdown regardless of z-index. Fix: switch to position:fixed using inputRef + getBoundingClientRect() — escapes all parent overflow clips. | P2xS | 2026-06-18 |
| 82 | ProductAutocomplete dropdown position offset (position:fixed approach) | ✅ Done (v1.4.41) | D: After #81 fix, dropdown renders below the table rather than directly under the input. Root cause: Chrome 128+ body{zoom} creates fixed-positioning containing block; coords mismatch. Fix: portal to document.body + divide getBoundingClientRect() coords by computed body zoom. | P2xS | 2026-06-18 |
| **Doc** | | | | | |
| 12 | Update billing note template | ⏳ Pending | D: Align ใบวางบิล with current DN/TI format; Sheets integration pending | P4xM | 2026-06-11 |
| **Infra** | | | | | |
| 22 | Split Code.gs | ⏳ Pending | D: Move DN PDF functions to DeliveryNote.gs; move all stagingTest*() functions to StagingTests.gs; Code.gs too long to navigate. Do after system is stable. | P3xL | 2026-06-12 |

---

## Parked

Items deferred indefinitely — not actively being worked on. Revisit when conditions change.

| # | Item | Status | Description | PxC | Logged |
|---|---|---|---|---|---|
| 31 | PDF auto-split safety net | 🅿️ Parked | D: `splitDescText()` in Code.gs auto-breaks long desc; `white-space: nowrap; overflow: hidden` on PDF cells | P3xM | 2026-06-12 |
| 37 | GAS @page margin not respected | 🅿️ Parked | D: GAS PDF renderer likely ignores `@page{margin}` CSS; `.page{width}` is the effective control. Known constraint; investigate further or accept limitation. | P4xS | 2026-06-13 |

---

## Pipeline / TBC / Future

Features not yet scoped, TBC pending testing, or long-term goals.

| ID | Feature | Notes | Logged |
|---|---|---|---|
| P1 | Billing note (ใบวางบิล) | Full feature scope TBD — may include PDF generation, Sheets integration, link to DN | 2026-06-17 |
| P2 | Stock management (คลังสินค้า) | Full feature scope TBD — may include stock-in/out tracking, low-stock alerts, link to DN items | 2026-06-17 |
| P3 | Item list management (รายการสินค้า) | No backend sheet tab — items currently maintained only via website UI. Scope TBD: may include Items sheet tab, backend CRUD, and sync with DN/TI forms. | 2026-06-18 |
| #80 | addProduct() loading indicator | TBC pending user testing — if noticeably slow, wire addingProduct state to disable button + spinner. Check after first real use before coding. | 2026-06-18 |
| #15 | Migrate to Electron | Replace GAS/Sheets with Electron + SQLite; factory has 1 PC — fully local. Long-term goal. | 2026-06-12 |

---

## Pending Testing

| # | Item | What to Test | Result |
|---|---|---|---|
| 34 | DETAIL_MAX calibration | Test print TI/DN with real Thai detail text — confirm text fits; loosen to 34–36 if real data hits the cap | ⏳ Not tested |
| 10 | DN portrait font QA | Test print; compare font sizes vs DN landscape; verify ยอดรวม, baht, sig labels, footer all readable | ✅ Done |
| 55 | PDF desc overflow fix | Test print with 24–25 wide ASCII chars (e.g. TTTTT…) in detail field — confirm text clips at column boundary | ⏳ Not tested |
| 56/57 | Similar name warning | Type "กำธร" with "คุณ กำธร" in DB → warning should appear. Type "คุณ" alone → no warning. Type "บริษัท" alone → no warning. | ⏳ Not tested |

---

## Work Done This Session

### Carried from previous session (context compaction)

Items completed in the prior context window — Code.gs v1.4.159–160 / KCFactory.jsx v1.4.25–29:

| # | Item | Version | Details |
|---|---|---|---|
| #51 | Customer list management page | KCFactory v1.4.25, Code.gs v1.4.159 | CRUD page (CustomerPage): list + inline add/edit + delete confirm. Sheet "Customers" cols A–E: ชื่อลูกค้า/ที่อยู่/โทรศัพท์/เลขภาษี/หมายเหตุ. Backend: getCustomers/createCustomer/updateCustomer/deleteCustomer (name as key, auto-create sheet). |
| #53 | Edit button off-screen | KCFactory v1.4.26 | Form rendered above table; clicking แก้ไข while scrolled down showed nothing. Fix: formRef + scrollIntoView on form open. |
| #19 | Customer name autocomplete | KCFactory v1.4.27 | CustomerAutocomplete component: loads on mount, filters locally, fills address/phone/taxId on select. Wired in DN and TI forms. |
| #20 | Similar name warning on customer add | KCFactory v1.4.28 | Levenshtein similarity ≥0.75 check in CustomerPage handleSave. ConfirmModal shows similar names. Fuzzy-merge explicitly rejected (ฮังเซ้ง ≠ ฮั่วเซ้ง). |
| #52 | Auto-log customer on invoice save | Code.gs v1.4.160 | autoLogCustomer_() silently upserts into Customers sheet; called from all 4 invoice create/update functions. Never throws. |
| #54 | Similar name warning in invoice forms | KCFactory v1.4.29 | Extended #20 warning to DN and TI handleSave. onCustomersLoaded callback added to CustomerAutocomplete; allCustomers/custWarning states + ConfirmModal in both forms. |

### This session

#### Code.gs (v1.4.161 → v1.4.186)

| Version | # | Change |
|---|---|---|
| v1.4.190 | #97 | Router cases: getDNDetail, cancelBillingNote, getUnbilledDNsForCustomer, editBillingNote. |
| v1.4.189 | #97 | New functions: getDNDetail() (items from Invoice History), cancelBillingNote() (col J = "CANCELLED" + clear col Q on linked DNs), getUnbilledDNsForCustomer() (col Q empty + not cancelled), editBillingNote() (date/customer + addDnNos/removeDnNos, recalc count+total, clear pdfUrl). |
| v1.4.188 | #97 | Fix getBillingNoteDetail: Utilities.formatDate for date col, address+phone pickup from first linked Invoice History row, cancelled from col J (index 9). |
| v1.4.187 | #97 | Fix getBillingNotes: Utilities.formatDate for date col, cancelled field from BN History col J (index 9). |
| v1.4.186 | #93 | Add getBillingNoteDetail(bnNo): reads BN History for header, Invoice History col Q for DN list (no/date/total). Router case "getBillingNoteDetail". |
| v1.4.185 | #90 | Fix bnNo/customerName body references in both PDF builders (portrait × 3, landscape × 3). Root cause: #89 param rename missed 6 body references — grep used wrong ripgrep OR syntax. |
| v1.4.184 | #89 | Rename: getBNHistory→getBillingNotes, getNextBNNumber→getNextBillingNoteNumber, buildBillingNote*PDF params bnNo/customerName→invoiceNo/name; router case updated. |
| v1.4.183 | #88 | Dead code removal: onOpen(), openBillingNoteSidebar(), parseBNDate(), previewBillingNote(), _confirmBillingNote_LEGACY_DO_NOT_USE(), router case "previewBillingNote". |
| v1.4.182 | #87 | searchDeliveryNotesForBilling(): fix field name invoiceNo→no (frontend mismatch bug); read col Q (bnNo) per DN row; replace rough date-range generated check with per-invoice bnNo check. confirmBillingNote(): mark billed DNs in Invoice History col Q after BN created. |
| v1.4.181 | #85 | confirmBillingNote() accepts format param; branches to buildBillingNoteLandscapePDF (landscape) or buildBillingNotePortraitPDF (portrait); router passes params.format. |
| v1.4.180 | #12 | Landscape: promote to live — stagingTestBillingNoteLandscape experiment log updated (all → live, [no active experiment]). |
| v1.4.179 | #12 | Both: # col color match main text (remove #999). Landscape: baht text 2.7→3mm; footer gap 2→4mm. |
| v1.4.178 | #12 | Landscape: restore สต. column — same fix as portrait; 6-col table; tfoot colspan=2. |
| v1.4.176–177 | #12 | Portrait: restore สต. column (split amt→บาท+สต., 6-col table, tfoot colspan=2); fix สต. color (#888 → inherit #111). |
| v1.4.175 | #12 | buildBillingNoteLandscapePDF(): center-lock 151.5mm (borrowed from TI/DN — same printer/settings), A4 landscape, ต้นฉบับ+สำเนา, 10 rows height:6mm. Opts: centerLock/outerLeft/outerRight/innerGapL/innerGapR/pagePaddingTop/leftHalfWidth. testBillingNoteLandscape + stagingTestBillingNoteLandscape added. |
| v1.4.172–174 | #12 | Portrait: footer redesign — Option C (top border rule + acknowledgment text + ผู้รับบิล/ให้มาติดต่อรับเงินวันที่, no issuer); font sizes matched to info section (3.5mm Thai / 3mm EN). Portrait frozen at v1.4.174. |
| v1.4.171 | #12 | Portrait: all 10 item rows fixed height:7mm so empty rows don't collapse. |
| v1.4.170 | #12 | Portrait: empty item rows show no row number (blank # cell). |
| v1.4.169 | #12 | Portrait: header BN number top-aligned (align-items:flex-start, remove margin-top:auto); เลขที่บิล col explicit 74mm (~2/5 of 186mm); จำนวนเงิน col takes remainder. |
| v1.4.168 | #12 | buildBillingNotePortraitPDF(): new HTML PDF builder — KC logo black, #111 table header, 10 fixed rows, ครบกำหนด col blank for handwriting, Prompt font, 6 cols. confirmBillingNote() refactored: accepts invoices array + bnDate/address/phone; stores dnNos in BN History col I. Router updated. No BN Template sheet dependency. |
| v1.4.167 | #72 | Product CRUD backend: getProducts() returns [{type,value,row}]; updateProduct(row,value) edits col B; deleteProduct(row) hard-deletes row; addProduct(name,type) extended to accept type param. Router cases added. |
| v1.4.166 | #60 | Customer soft-delete: deleteCustomer() writes "ลบแล้ว" to หมายเหตุ col instead of sheet.deleteRow(); getCustomers() filters soft-deleted rows; createCustomer() uniqueness check skips them. |
| v1.4.165 | #71 | addProduct(name): appends ["product", name] to Config_Products; router case "addProduct" |
| v1.4.164 | #73 | getConfig() reads products/sizes exclusively from Config_Products via getProductConfig(); removed product/size rows from Config sheet seed and saveConfig() |
| v1.4.163 | #70 | Config restructure: extractFolderId_() helper; getConfig()/saveConfig() use folderDN/folderTI/folderBN; getProductConfig() reads Config_Products; all PDF builders use cfg.folders.dn/.ti/.bn; remove hardcoded invoiceFolderId/bnFolderId from CONFIG |
| v1.4.162 | #61,62,64 | Refactor batch (shared with KCFactory v1.4.34): extract findSimilarCustomers(), collapseItems(); VAT_RATE const + vatRate in getConfig() + cfg.vatRate in PDF builders |
| v1.4.162 | #66 | Remove hardcoded "KIMCHIANG LIMITED PARTNERSHIP" fallback in 4 PDF builders → co.nameEN \|\| "" |
| v1.4.162 | #67 | Move TAX_INVOICE_SHEET/CUSTOMER_SHEET → CONFIG.tiSheet/CONFIG.customerSheet |
| v1.4.161 | #55 | PDF desc column overflow: add `min-width:0` to all `flex:1` detail divs in all 4 PDF builders (8 instances). Root cause: min-width:auto prevented overflow:hidden from clipping in GAS renderer. |

#### KCFactory.jsx (v1.4.30 → v1.4.54)

| Version | # | Change |
|---|---|---|
| v1.4.58 | #97 fix | BNDetailView cache: bnDetailCache in BillingNotePage; first open fetches+stores; revisit instant; onSaved busts cache so edits/cancel always show fresh data. |
| v1.4.57 | #97 fix | DNDetailPopup cache: dnCache in BNDetailView; first click fetches+stores per dnNo; re-open same DN is instant. |
| v1.4.56 | #97 | BNDetailView redesign: breadcrumb+status badge+action buttons (PDF/แก้ไข/ยกเลิก); DNDetailPopup (click DN row → items popup via getDNDetail); BNEditForm (add/remove DNs, change date/customer, editBillingNote); cancelBillingNote with ConfirmModal+enterConfirm; BNListView cancelled badge (muted row + "ยกเลิก" tag); onSaved prop wired to BillingNotePage.loadBnList; 4 new api methods. |
| v1.4.55 | #93 fix | Fix customer name field mismatch throughout BN components: customer.name/cust.name → customer.customer/cust.customer in BNPreviewModal + BNCreateView. searchDeliveryNotesForBilling returns 'customer' field, not 'name'. |
| v1.4.54 | #93 fix | Add Plus + ChevronLeft to lucide-react import — missing caused "Plus is not defined" crash in BillingNotePage on BN tab open. |
| v1.4.53 | #93 | BN UX redesign: BillingNotePage view-based (list/create/detail); BNListView with clickable rows; BNCreateView with ← back button; BNDetailView (header+DN list+PDF); api.getBillingNoteDetail; dead CreateBNTab+BNHistoryTab removed. |
| v1.4.52 | #91 | BNPreviewModal: move delete button from last column (red ×) to first column (muted grey ✕); column header order updated; textAlign threshold i>=5→i>=6. |
| v1.4.51 | #89 | Rename: api.getBNHistory→getBillingNotes, apiCall "getBNHistory"→"getBillingNotes"; update both call sites (CreateBNTab handleSearch + BNHistoryTab loadHistory). |
| v1.4.50 | #87 | CreateBNTab: show green bnNo badge on DN rows already linked to a BN (from inv.bnNo). Fix inv.no field name (server returned invoiceNo, frontend expected no). |
| v1.4.49 | #86 | BNHistoryTab: add PDF column — 📄 PDF link button (opens pdfUrl in new tab); shows — if no URL. pdfUrl already in getBNHistory() col H. |
| v1.4.48 | #85 | BNPreviewModal: format state (portrait/landscape); toggle UI in info band (📄 แนวตั้ง / 🖼 แนวนอน buttons); handleConfirm passes format; api.confirmBN signature updated. |
| v1.4.47 | #12 | api.confirmBN passes invoices array + bnDate/address/phone; handleConfirm maps selectedRows → {dnNo, dnDate, amount}; drops invStartDate/invEndDate params. |
| v1.4.46 | #83 | ProductAutocomplete keyboard nav: highlightedIndex state; ArrowDown/ArrowUp move highlight; Enter selects highlighted; mouse hover sets highlight; Escape closes; resets on open. |
| v1.4.45 | #72 | ProductPage: CRUD for Config_Products — สินค้า/ขนาด tabs; add/edit/delete with ConfirmModal; wired to "stock" nav; api.getProducts/updateProduct/deleteProduct; api.addProduct accepts type param. |
| v1.4.44 | — | SettingsPage folder fields: reconstruct full URL on load — bare ID → prepend "https://drive.google.com/drive/folders/"; backend extractFolderId_ strips to ID on save. |
| v1.4.43 | #76 | SettingsPage folder fields: rename "Folder ID" → "Folder URL"; add onBlur per-field save with window.confirm popup; track origFolders ref. |
| v1.4.42 | #74+#75 | SettingsPage: remove products/sizes EditableList; replace invFolder/bnFolder with folderDN/folderTI/folderBN; add locked state (default true) with 🔒/🔓 toggle; auto re-locks after save. |
| v1.4.41 | #82 | ProductAutocomplete dropdown fix pt2: portal to document.body via createPortal; divide getBoundingClientRect() by body zoom (Chrome 128+ fix); add dropdownRef for click-outside. |
| v1.4.40 | #82 | ProductAutocomplete dropdown fix: move getBoundingClientRect() into useLayoutEffect([open]) — captures after DOM commit; add useLayoutEffect to React import. |
| v1.4.39 | #81 | ProductAutocomplete dropdown: switch to position:fixed using inputRef+getBoundingClientRect(); escapes overflow:hidden clip from parent table wrapper. |
| v1.4.38 | #79 | ConfirmModal enterConfirm prop (default false): Enter→onConfirm, Escape→onCancel. Enabled on: row delete DN/TI, invoice cancel DN/TI, customer delete. NOT on: similar-name warnings or add-new modals. |
| v1.4.37 | #77 | addProduct() state sync: setProducts prop to DN/TI forms + detail + pages; call setProducts(prev=>[...prev,name]) on success; remove stray `sizes;` no-op in DN modal. |
| v1.4.36 | #71 | ProductAutocomplete component: free-text + filtered dropdown; replaces <select> in DN+TI forms; on blur with unknown name → similarity modal with chips or add-new; cancel clears field. |
| v1.4.35 | #76 | CustomerAutocomplete: remove 8-item cap (.slice(0,8)) — list scrolls with no limit. |
| v1.4.34 | #61,62,63,64,65,68,69 | Refactor batch (shared with Code.gs v1.4.162): extract findSimilarCustomers(), collapseItems(); emptyItem() in TI; SIMILARITY_THRESHOLD const; delete dead emptyItems(); rename upd→updateItem, ci→cellInput in TI. |
| v1.4.33 | #58 | Similar name warning: move trigger from save → name field blur. CustomerAutocomplete gets onBlur; DN+TI add nameSelectedFromListRef + checkNameSimilarity; ConfirmModal no longer auto-calls save on confirm. |
| v1.4.32 | #18 | Date picker font mismatch: add `fontFamily:"inherit"` to inputStyle + all 4 inline date range inputs. |
| v1.4.31 | #57 | Similar name warning: exclude COMMON_PREFIXES from containment check — skip if normTyped exactly matches a title prefix word. |
| v1.4.30 | #56 | Similar name warning: add containment check alongside Levenshtein. Both ≥3 chars + substring match → warn. Catches "กำธร" ⊂ "คุณกำธร" (Levenshtein 0.57, below threshold). |

### Documents

| Item | Change |
|---|---|
| KC_Backlog.md | Added #55–#57; marked ✅ Done |
| KC_Backlog.md | Added #58–#69; #18, #58–#69 marked ✅ Done |
| KC_Backlog.md | #70 marked ✅ Done (Code.gs v1.4.163) |
| KC_Backlog.md | #71–#75 added; #73 marked ✅ Done; #74, #75 marked ✅ Done |
| KC_Backlog.md | #76–#83 added; #76, #77, #79, #81, #82, #83 marked ✅ Done; #78, #80 pending/TBC |
| KC_Backlog.md | #60, #72 marked ✅ Done |
| KC_Backlog.md | #12 updated: portrait ✅ + landscape ✅, frontend selector ⏳ |
| KC_Backlog.md | #84, #85 added ⏳ Pending |
| KC_Backlog.md | P1 updated — PDF builders complete; frontend + Sheets integration pending |
| KC_TestCases_2026-06-18.md | Created — TC-01 to TC-09 (Settings lock/unlock, folder URL, soft-delete, product CRUD, autocomplete, invoice regression) |
| KC_Daily_Progress_2026-06-18.md | Created (this file); version header updated to Code.gs v1.4.180 / KCFactory.jsx v1.4.47 |
| KC_Daily_Progress_2026-06-18.md | Version header updated → Code.gs v1.4.181 / KCFactory.jsx v1.4.48; #85 rows added to both tables |
| KC_Backlog.md | #85 marked ✅ Done (Code.gs v1.4.181, KCFactory.jsx v1.4.48) |
| KC_Backlog.md | #86 added + marked ✅ Done (KCFactory.jsx v1.4.49) |
| KC_Daily_Progress_2026-06-18.md | Version header → KCFactory.jsx v1.4.49; #86 row added to KCFactory table |
| KC_Backlog.md | #87, #88, #89 added + marked ✅ Done; #90, #91 added + marked ✅ Done; #92, #93 added ⏳ Pending |
| KC_Daily_Progress_2026-06-18.md | Version header → Code.gs v1.4.185 / KCFactory.jsx v1.4.52; v1.4.185 + v1.4.52 rows added to both tables |
| KC_Backlog.md | #93 marked ✅ Done; #92 updated (tab state resolved by redesign — no tabs anymore) |
| KC_Daily_Progress_2026-06-18.md | Version header → Code.gs v1.4.186 / KCFactory.jsx v1.4.53; v1.4.186 + v1.4.53 rows added |
| KC_Daily_Progress_2026-06-18.md | Version header → KCFactory.jsx v1.4.55; v1.4.55 row added to KCFactory table |
| KC_Daily_Progress_2026-06-18.md | Version header → Code.gs v1.4.190 / KCFactory.jsx v1.4.56; #97 rows added to both tables |
| KC_Daily_Progress_2026-06-18.md | Version header → KCFactory.jsx v1.4.58; v1.4.57–58 rows added |
| KC_Backlog.md | #97 marked ✅ Done (Code.gs v1.4.187–190, KCFactory.jsx v1.4.56–58) |

---
