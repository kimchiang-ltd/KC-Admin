# KC Factory — Backlog

**Working file** — update freely during sessions. Sync to `KC_Daily_Progress_YYYY-MM-DD.md` at end of day.

Priority: P0 = critical blocker · P1–P4 = high→low · F = future only · — = done/N/A
Complexity: S = small · M = medium · L = large · XL = extra large

---

## Lessons Learned — GAS PDF Rendering

Hard-won empirical facts. Reference before any PDF layout work to avoid repeating experiments.

**GAS @page behavior**
- GAS does NOT reliably respect `@page` margin values — the effective rendered margin differs from the CSS value
- Empirical: `@page left:15mm` → effective left margin ~16.95mm from paper left
- Do NOT assume removing/changing `@page left` shifts content by the same CSS amount

**2:1 CSS-to-physical ratio**
- Changing a CSS length by X only moves the rendered output by ~X/2 physically (empirical from pageMarginLeft tests: 7mm CSS → 3.5mm physical movement)
- Always apply 2:1 ratio when calculating CSS values needed to achieve a target physical shift
- This ratio may vary by property — verify with print+fold when uncertain

**Paper center — A4 landscape**
- Physical paper center = 148.5mm from left edge (297mm / 2)
- Always verify empirically via `stagingTestCenterLine()` — never assume CSS 148.5mm = physical 148.5mm
- Calibrated formula (valid for `@page left:15mm` only): `padding-left = 131.55 − pageMarginLeft`
- If `@page` settings change, re-run `stagingTestCenterLine()` with matching settings to re-derive center

**`position:absolute` — unsupported in GAS PDF**
- GAS PDF renderer does not support `position:absolute` — elements will not render as expected
- Use flex layout with fixed widths instead

**`stagingTestCenterLine()` — calibration tool**
- Prints `|` chars at a given `padding-left`; print + fold paper → if `|` aligns with fold = paper center
- Must be run with the SAME `@page` settings as the target builder
- Re-run whenever `@page` margins or `.page` width changes

**Flex width ratio — 1:1 (NOT 2:1)**
- The 2:1 CSS-to-physical ratio applies to `pageMarginLeft` (page offset) only
- For flex child `width` (controlling divider position), ratio is 1:1 — CSS change = same physical change
- Do NOT apply 2:1 ratio to flex width calculations

**Center-lock approach (TI landscape, #43) — calibrated**
- Divider position is controlled by left half CSS width (flex layout), not by `pageMarginLeft`
- Calibrated value: `leftHalfWidth:151.5mm` → divider at paper center ✓ (empirical, 2026-06-17, @page left:0, this printer)
- Calibration is printer-specific — re-verify if printer changes
- Derivation: 148.5mm → 3mm left of center; 154.5mm → 3mm right of center; midpoint 151.5mm = center

**Printer non-printable area — sets a floor on outerLeft**
- HP DeskJet 2800: minimum safe outerLeft ≈ 13mm (empirical, 2026-06-17)
- Below this, content is clipped by the printer's non-printable zone (text first, then logo at lower values)
- Progression: 9mm → KC logo clipped; 11.5mm → logo clear, address lines 2–3 clip; 12.5mm → line 1 clear, lines 2–3 still clip; 13mm → all clear ✓
- Cannot reduce outerLeft below ~13mm on this printer regardless of layout balance goals

**Gap balance — innerGapL/innerGapR split (v1.4.152)**
- Left and right inner gaps can be set independently via `innerGapL` / `innerGapR` opts
- Promoted values: `outerLeft:13mm`, `outerRight:2mm`, `innerGapL:5mm`, `innerGapR:9mm`
- Constraint: outerLeft + contentArea + innerGapL must equal leftHalfWidth (151.5mm); i.e. outerLeft + innerGapL = 18mm total; 13+5=18mm ✓
- If outerLeft changes, adjust innerGapL by the same amount in the opposite direction to hold the divider at 151.5mm

**@page right margin — appears to add physical right margin**
- Despite outerLeft:13mm CSS vs outerRight:2mm CSS, visual gap balance appears acceptable when printed
- Hypothesis: `@page` right:8mm adds ~8mm to the physical right margin, compensating for the low outerRight CSS value
- Not independently measured — verified only by cutting and overlaying the two invoice halves

---

## Lessons Learned — GAS Performance & Data

Hard-won facts for fast sheet access. Reference before adding any sheet read/lookup.

**Full-column / full-sheet reads are the #1 perf trap**
- `getRange("A:A").getValues()` reads the ENTIRE grid column (all rows the sheet has, not just data) into the script — ~3–4s. This (inside `getLastNonEmptyRow`) was the real cause of slow DN detail, not the row scan. (#116/#117)
- Avoid `getDataRange().getValues()` / full-column reads for single-record lookups.

**Use TextFinder for single-record lookups**
- `sheet.getRange("A:A").createTextFinder(id).matchEntireCell(true).findAll()` searches server-side WITHOUT loading values into the script — far faster; needs no row count. Then read only the matched rows' range. (#116)

**Prefer bounded reads**
- Use `sheet.getLastRow()` (instant) over custom full-column scans **only as an upper bound** — see caveat below.
- ⚠️ **`getLastRow()` ≠ last DATA row.** It returns the last row with content in ANY column. Tax Invoice History col O has a year-month formula filled past the real data, so `getLastRow()` overshoots into rows that are empty in col A (this is the bug that made us write `getLastNonEmptyRow`). To get the true data extent, scan a specific data column (e.g. col A) — but read only that column bounded to `getLastRow()`, not the full grid: `getRange(1, colIdx, getLastRow(), 1).getValues()`.
- Embed record detail in the list payload (one grouped scan at list load, cached) so detail views open with zero extra round-trip — beats one scan per click. (#105 Option B)

**Round-trip + caching**
- Each GAS web-app call is ~0.5–1.5s inherent (runtime + network) regardless of work done. Minimize calls; cache so each record is fetched once per session (frontend session stores / app-level cache / per-month cache).

**Date parsing**
- `new Date("dd/MM/yyyy")` → Invalid Date in JS/GAS → "NaN undefined NaN". Parse parts explicitly. (#108)

---

## Outstanding Items

| # | Item | Status | Description | PxC | Logged |
|---|---|---|---|---|---|
| **BN Create testing (2026-06-19)** | | | | | |
| 118 | BN Create — month nav refetches every time (no cache) | ✅ Done (KCFactory.jsx v1.4.71) | D: #99 auto-load refetched (searchDeliveryNotes + getBillingNotes) on every month switch, even returning to a loaded month. Fix: monthCache keyed "y-m" stores customers/printQueue/nextBnNo; goMonth uses cache (instant), ค้นหา forces refresh (handleSearch force=true), handleConfirm invalidates current month. Local to BNCreateView (resets on leaving create view). | P3xS | 2026-06-19 |
| 110 | Combined BN PDF — make folder configurable in Settings | ✅ Done (Code.gs v1.4.196, KCFactory.jsx v1.4.65) | D: folderBNCombined Config row → getConfig folders.bnCombined + saveConfig appends it; Settings page field (blank = auto). printCombinedBillingNotes uses cfg.folders.bnCombined if set, else auto "Combined" subfolder. | P3xS | 2026-06-19 |
| 109 | Combined BN PDF — save to subfolder + auto-cleanup | ✅ Done (Code.gs v1.4.195) | D: Combined print files now save to a "Combined" subfolder under the BN folder (getOrCreateChildFolder_) instead of mixing with real BN PDFs; cleanupCombinedFolder_ keeps newest 5 and trashes older (handles back-to-back portrait+landscape). | P3xS | 2026-06-19 |
| 116 | DN detail popup — slow first load | ✅ Done (Code.gs v1.4.198→199, KCFactory.jsx v1.4.70) | D: REAL cause = getDNDetail called getLastNonEmptyRow("A") which does getRange("A:A").getValues() (full-column read into script) ≈ 3–4s. v1.4.198 TextFinder didn't help b/c this ran first. v1.4.199: drop getLastNonEmptyRow — TextFinder on A:A needs no row count. Plus frontend _dnStore session cache (v1.4.70) for instant repeat opens. v1.4.72: DN list load seeds _dnStore (id→detail incl. items) so opening those DNs from BN is instant (no getDNDetail) — addresses "DN list already loaded, why refetch". First open of a never-loaded DN still = one round-trip (inherent). | P3xS | 2026-06-19 |
| 117 | Perf — getLastNonEmptyRow reads entire column (systemic) | ✅ Done (Code.gs v1.4.200) | D: getLastNonEmptyRow now reads `getRange(col+"1:"+col+getLastRow())` (one column, bounded) instead of full-grid `getRange("col:col")`. Fixes all 23 call sites at once. Col-A scan preserved → col O year-month formula (filled past data) can't inflate the result. getLastRow() used only as upper bound, never as the data extent. | P3xM | 2026-06-19 |
| 108 | Combined BN PDF — date shows "NaN undefined NaN" | ✅ Done (Code.gs v1.4.194) | D: #107 combined print feeds getBillingNoteDetail date ("dd/MM/yyyy") to thaiMonth() which did new Date(dateStr) — invalid for dd/MM/yyyy. Fix: thaiMonth() now parses dd/MM/yyyy too + returns raw string if unparseable. Page-break confirmed working. | P2xS | 2026-06-19 |
| 99 | BN Create — auto-load on month nav | ✅ Done (KCFactory.jsx v1.4.69) | D: handleSearch now takes (mArg,yArg); goMonth calls handleSearch(m,y) so ‹ › auto-loads. ค้นหา button + ErrorBox retry wrapped in arrow fns to avoid passing click event as month arg. | P3xS | 2026-06-19 |
| 100 | BN Create — date field still shifts between customers | ✅ Done (KCFactory.jsx v1.4.67) | D: Root cause = right-pane overflow scrollbar appearing/disappearing changed content width. Fix: scrollbar-gutter:stable on right scroll region (+ left list). Date/format row position now constant. | P2xS | 2026-06-19 |
| 101 | BN Create — DN list gone + not clickable after create | ✅ Done (KCFactory.jsx v1.4.67) | D: Done state now renders billed DN list (selectedCust.invoices) with clickable DN no → DNDetailPopup (dnPopup/dnCacheBN added to BNCreateView). | P2xS | 2026-06-19 |
| 102 | BN Create — PDF format toggle wording | ✅ Done (KCFactory.jsx v1.4.77) | D: แนวตั้ง/แนวนอน → PDF/แบบพิมพ์ (matches DN/TI convention); label รูปแบบ PDF → รูปแบบ. Applied to 3 places: BNEditForm, BNCustomerPanel, print queue header. | P4xS | 2026-06-19 |
| 103 | BN Create — print queue position shifts | ✅ Done (KCFactory.jsx v1.4.67, refined v1.4.68) | D: Right pane split into scroll region (panel/done/placeholder) + print queue (flexShrink:0, maxHeight 42% own scroll). v1.4.68: scroll region flex 0 1 auto so queue sits right under content (not pinned to viewport bottom — was too low/big gap); still shrinks+scrolls when content tall. | P3xS | 2026-06-19 |
| 104 | BN Create — created BN not persisted on revisit | ✅ Done (KCFactory.jsx v1.4.62) | D: Backend already returned per-customer generated flag + per-DN bnNo (col Q); frontend discarded it (line 2319 hardcoded generated:false). Fix: handleSearch builds bnByNo lookup from getBillingNotes(), maps cust.generated → createdBnNo from billed DN + date/count/total/pdfUrl from BN history. Done-state + PDF link now restore on revisit. Edge: multi-BN-same-month customer shows first BN no (noted). | P1xM | 2026-06-19 |
| 105 | BN History — no cache + slow detail load | ✅ Done (Code.gs v1.4.197, KCFactory.jsx v1.4.66) | D: Root cause: BillingNotePage ignored cache/updateCache props → list re-fetched every visit + internal bnDetailCache wiped on navigation. Fix: (frontend) BillingNotePage uses app-level cache for list ("bnList") + detail ("bnDetail_<no>"), survives navigation; onRowClick seeds detail from list row. (backend Option B) getBillingNotes does one grouped Invoice History scan → returns per-BN invoices[]+address/phone so detail opens instantly w/o per-click scan. getBillingNoteDetail kept as fallback. | P3xM | 2026-06-19 |
| 106 | BN Create — print queue: show all created BNs + persist printed flag | ✅ Done (Code.gs v1.4.191, KCFactory.jsx v1.4.63) | D: (1) handleSearch seeds printQueue from all generated customers so queue shows even when nothing created this visit; (2) BN History col K printed flag — getBillingNotes returns printed bool (row[10]); markBillingNotesPrinted(bnNos) sets col 11="PRINTED" + router case; (3) checkbox checked = !printed; printNow (now async) marks printed in DB + unchecks those rows. | P3xM | 2026-06-19 |
| 107 | BN Create — พิมพ์เลย should output ONE combined PDF | ✅ Done (Code.gs v1.4.192, KCFactory.jsx v1.4.64) | D: At พิมพ์เลย user picks รูปแบบ (แนวตั้ง/แนวนอน); all checked BNs render in that one format into a single PDF. Backend: extracted bnPortrait/LandscapePageHTML + bnPortrait/LandscapeCSS (output identical, node --check OK); printCombinedBillingNotes(bnNos, format) re-renders via getBillingNoteDetail, concatenates page HTML w/ joinBillingNotePages (page-break-after:always between) → 1 PDF; router case. Frontend: format picker in คิวพิมพ์ header; printNow async, opens single file + marks printed. ⚠️ NEEDS PRINT-TEST: confirm GAS honors page-break (each BN on own page). | P2xM | 2026-06-19 |
| 115 | BN Create — edit customer info (name/address/phone) during creation | ✅ Done (KCFactory.jsx v1.4.78) | D: Address + phone editable in BNCustomerPanel (per-BN override only — Customers sheet untouched). Pre-filled from cust, reset on customer switch, passed to confirmBN. Name excluded (changes to name → use ลูกค้า page). | P3xM | 2026-06-19 |
| 122 | DN list — richer date filter (period + year/month grid + optional range) | ✅ Done (KCFactory.jsx v1.4.76) | D: Built shared DateRangePicker (เดือน/ทั้งปี toggle + year nav + month grid w/ future disabled + optional custom range + แสดงทั้งหมด); collapsed dropdown (expanding inline, no portal). Presets = Month+Year (per decision). Applied to: DN list, TI list (replaces date inputs), BN Create (monthOnly grid replaces ‹ › stepper + refresh btn), BN History (new client-side date filter). Search stays client-side. Mockups confirmed first (dropdown layout B). | P3xM | 2026-06-19 |
| 121 | DN list default range + Load-all | ✅ Done (KCFactory.jsx v1.4.75) | D: DN list defaulted to current month only → BN DN-opens for older months not seeded in _dnStore. Changed default to last 3 months; added "ทั้งหมด" button (clears date range → getDeliveryNotes(null,null) loads all). Wider default seeds more DNs → more BN opens instant. Avoided all-by-default (would re-introduce full-sheet read perf cost as data grows). | P3xS | 2026-06-19 |
| 119 | BN nav click doesn't return to list (history) view | ✅ Done (KCFactory.jsx v1.4.73) | D: #48 goListRequest (bump on clicking active nav → page resets to list) was wired to DN/TI but not BillingNotePage (added in #93 redesign). Fix: pass goListRequest to BillingNotePage + useEffect → setView("list"). Now clicking ใบวางบิล from create/detail returns to BN list like DN/TI. | P2xS | 2026-06-19 |
| 120 | BN breadcrumb missing doc suffix | ✅ Done (KCFactory.jsx v1.4.74) | D: Top breadcrumb showed only เอกสาร › ใบวางบิล (no BN no/สร้าง) unlike DN/TI. Fix: BillingNotePage setView(v,label) calls onViewChange (setBreadcrumbSuffix); pass onViewChange prop; labels at row-click (bnNo) + create (สร้างใบวางบิล). | P3xS | 2026-06-19 |
| **JSX optimization (logged 2026-06-19)** | | | | | |
| 111 | Refactor DN/TI forms — shared LOGIC hook (useInvoiceForm) + ProductWarningModal | 🔄 P1 DONE (KCFactory.jsx v1.4.86, 2026-06-19); P2/P3 pending | D: **RE-SCOPED after full scan** — original <InvoiceItemsEditor> table-merge REJECTED. The item *tables* are the part that genuinely differs (DN: size col + single amount cell; TI: qty inline + separate satang col + colgroup), as do the customer cards (TI adds taxId/invoiceRef) and summaries (DN total row vs TI VAT block). Those stay per-template (no shared markup — avoids coupling templates). What IS byte-identical = the LOGIC: 13 state hooks+refs, items init (split " | ", _orig/_cont), checkProductName, checkNameSimilarity, updateItem, updateDetail, addRow, addContinuationRow (data-attr differs), removeRow, cellInput, handleSave customer-check preamble, + 4 modals.<br>**Phase 1:** `useInvoiceForm(initial, isEdit, {products, keyPrefix})` — extract all shared state+handlers; expose `guardedSave(doSave)` (runs cust checks then template's save). Each form keeps own JSX + payload + api call. keyPrefix preserves data-detail-idx vs data-ti-detail-idx. ~120 lines, zero visual change.<br>**Phase 2:** `<ProductWarningModal>` component (absorbs #78), ~28 lines ×2.<br>**Phase 3 (opt):** `<CustomerCheckModals>` for 3 identical ConfirmModals, ~15 lines.<br>Net ~180 lines. HIGH value, MED risk (logic only). Phase 1 needs save+edit test pass before Phase 2. | P3xL | 2026-06-19 |
| 112 | Refactor DN/TI detail views — shared layout | ⏳ Pending | D: DeliveryNoteDetail (145) + TaxInvoiceDetail (192) share header/info card/items table/cancel button. Shared <InvoiceDetailLayout>. ~80–100 lines. Med value/risk. | P4xM | 2026-06-19 |
| 113 | Refactor DN/TI list pages — useInvoiceList hook | ⏳ Pending | D: DeliveryNotePage (197) + TaxInvoicePage (218) near-identical search/list/cancelled-section/restore. Extract useInvoiceList hook or <InvoiceListPage>. ~100+ lines. Med value/risk. | P4xM | 2026-06-19 |
| 114 | JSX cleanup — shared style objects + fmtBaht() | ⏳ Pending | D: ~252 inline padding styles + 34 toLocaleString calls. Extract shared style consts (card/cell/label) + fmtBaht() helper. Low risk cosmetic. | P4xS | 2026-06-19 |
| **Refactor** | | | | | |
| 61 | Extract findSimilarCustomers() | ✅ Done (v1.4.34) | D: COMMON_PREFIXES, _norm, and filter logic duplicated 6x across DN form, TI form, CustomerPage (checkNameSimilarity x2, checkCPSimilarity, handleSave safety nets x2). Extract to top-level findSimilarCustomers(nameVal, list) → string[]. | P3xS | 2026-06-18 |
| 62 | Extract collapseItems() | ✅ Done (v1.4.34) | D: Continuation row collapse loop duplicated in DN and TI handleSave. Extracted to top-level collapseItems(items). | P3xS | 2026-06-18 |
| 64 | VAT rate configurable via Config sheet | ✅ Done (v1.4.34 / v1.4.162) | D: VAT_RATE top-level const in Code.gs; vatRate read from Config sheet in getConfig(); PDF builders use cfg.vatRate; frontend loads via getConfig() and passes vatRate prop through TaxInvoicePage→TaxInvoiceForm/TaxInvoiceDetail. | P3xM | 2026-06-18 |
| 65 | SIMILARITY_THRESHOLD constant | ✅ Done (v1.4.34) | D: Extracted to top-level const SIMILARITY_THRESHOLD = 0.75 in KCFactory.jsx. | P4xS | 2026-06-18 |
| 66 | Company EN name fallback hardcoded in Code.gs | ✅ Done (v1.4.162) | D: Removed hardcoded fallback "KIMCHIANG LIMITED PARTNERSHIP" from 4 PDF builders → co.nameEN || "". Config sheet defaults still seed it on first run. | P3xS | 2026-06-18 |
| 67 | TAX_INVOICE_SHEET + CUSTOMER_SHEET outside CONFIG | ✅ Done (v1.4.162) | D: Moved into CONFIG as tiSheet and customerSheet. All 16 references updated. | P4xS | 2026-06-18 |
| 68 | Remove dead emptyItems() function | ✅ Done (v1.4.34) | D: Removed — was never called anywhere. | P4xS | 2026-06-18 |
| 69 | Rename upd/ci in TI form to match DN naming | ✅ Done (v1.4.34) | D: upd→updateItem, ci→cellInput throughout TI form (definition + all call sites). | P4xS | 2026-06-18 |
| 63 | Fix emptyItem() inconsistency in TI | ✅ Done (v1.4.34) | D: addContinuationRowTI and addRow inlined empty item object. Replaced with { ...emptyItem(), _cont: true } and emptyItem(). | P4xS | 2026-06-18 |
| **Bug** | | | | | |
| 10 | DN portrait — font & sizing QA | ✅ Done | D: Font scaled in v1.4.94/97; needs visual test print to confirm sizing correct | P1xS | 2026-06-12 |
| 18 | Date picker font mismatch | ✅ Done (KCFactory v1.4.32) | D: Date inputs use system/browser default font instead of Prompt | P4xS | 2026-06-12 |
| 48 | Left nav click doesn't return to list view | ✅ Done (v1.4.24) | D: From DN/TI detail view, clicking the doc type in the left sidebar (e.g. "ใบส่งของ") should return to list view, but page stays on detail. Root cause: NavItem onClick called setActive() which didn't increment goListRequest. Fix v1.4.24: if item.key === active, increment goListRequest instead — already wired to setView("list") in each Page. | P2xS | 2026-06-17 |
| 49 | Cancel confirm button shows no loading state | ✅ Done (v1.4.23) | D: After clicking "ยืนยันยกเลิก" in the cancel ConfirmModal, GAS takes a few seconds but the modal shows no spinner/disabled state — user can't tell if click registered and may click again. Fix: add `loading` prop to ConfirmModal; disable confirm button + show spinner while loading. | P2xS | 2026-06-17 |
| 50 | Cancelled invoice search returns no results | ✅ Done | D: After cancelling a TI, searching "ใบที่ยกเลิก" section returns nothing. Root cause: Code.gs v1.4.156 was still serving when cancel was tested — cancelTaxInvoice router case didn't exist yet so col R was never written. Retest after Code.gs v1.4.158 deploy to confirm fixed. | P2xS | 2026-06-17 |
| 90 | BN create — "bnNo is not defined" error | ✅ Done (Code.gs v1.4.185) | D: #89 renamed PDF builder params bnNo/customerName→invoiceNo/name but body still referenced old names in 6 places (portrait × 3: HTML display, blob name, PDF name; landscape × 3 same). Root cause: grep used wrong ripgrep syntax `bnNo\|customerName` (literal string, not OR) — missed body references. Fix: replaced all 6 body references in both builders. | P1xS | 2026-06-18 |
| 91 | BN preview modal — red × delete button confusing | ✅ Done (KCFactory.jsx v1.4.52) | D: Delete button was last column (after สต.) in red — looked like สต. field was empty or in error. Fix: moved delete button to first column; changed icon ✕ color to muted grey (C.muted). Column header order updated accordingly. | P2xS | 2026-06-18 |
| 92 | BN tab state lost when switching Create↔History | ✅ Done (resolved by #93) | D: After searching month/year in CreateBNTab, switching to History tab then back resets the tab — search results gone, must re-search. Resolved by #93 redesign — no tabs anymore; Create/Detail are separate views so state is preserved per navigation. | P2xS | 2026-06-18 |
| 93 | BN UX redesign — history-first flow | ✅ Done (Code.gs v1.4.186, KCFactory.jsx v1.4.53) | D: BillingNotePage rewritten: view state (list/create/detail); list default with "สร้างใบวางบิล" button; BNListView table rows clickable → detail; BNCreateView with ← back; BNDetailView shows BN header + DN table + PDF link. Backend: getBillingNoteDetail(bnNo) cross-refs Invoice History col Q. | P3xM | 2026-06-18 |
| 98 | Hash routing — enable new-tab navigation | ⏳ Pending | D: GAS SPA has no URL routing — window.open() opens app fresh with no state. Fix: implement hash routing (window.location.hash). On app load read hash → navigate to correct view. Supported routes: #bn/BN-ID → BNDetailView, #dn/DN-ID → DeliveryNoteDetail, #ti/TI-ID → TaxInvoiceDetail. Unblocks: BN detail new tab (#97), DN popup "เปิดเต็ม" new tab, #96 print queue "รายละเอียด" button. All "open in new tab" features parked until this is done. | P2xM | 2026-06-18 |
| 97 | BN Detail Page — full layout (new tab parked → #98) | ✅ Done (Code.gs v1.4.187–190, KCFactory.jsx v1.4.56–58) | D: Layout mirrors DN detail: breadcrumb, status badge, action buttons (PDF/แก้ไข/ยกเลิกใบนี้), info card (BN no/date/customer/phone/address), DN table (clickable → DNDetailPopup). Backend: fix getBillingNotes/getBillingNoteDetail date format + cancelled field; add getDNDetail/cancelBillingNote/editBillingNote/getUnbilledDNsForCustomer. Frontend: BNEditForm (add/remove DNs + change date/customer); ConfirmModal cancel; BNListView cancelled badge; dnCache + bnDetailCache — no re-fetch on revisit. | P2xM | 2026-06-18 |
| 96 | BN Create — full monthly batch flow redesign | ✅ Done + tested (KCFactory.jsx v1.4.59–71) | D: Split-pane built + tested OK 2026-06-19. Follow-ups split into #99–#108, #116, #118 (all done). "รายละเอียด" per print queue row parked → #98. | P2xL | 2026-06-18 |
| 95 | KCFactory.jsx — remove dead code from #93 redesign | ✅ Done (KCFactory.jsx v1.4.61) | D: Removed `_REMOVED_CreateBNTab_placeholder` + `BNHistoryTab` (~251 lines) via Edit tool. Version log also trimmed to 15 entries. | P4xS | 2026-06-18 |
| 94 | KCFactory.jsx — Claude artifact preview broken (react-dom) | ⏳ Pending | D: Since v1.4.41 (#82), KCFactory.jsx imports react-dom (createPortal for ProductAutocomplete dropdown portal fix). Claude sandbox doesn't support react-dom → "Artifact failed to load". Previously rendered fine. Options: (1) replace createPortal with alternative (zoom-aware absolute positioning or CSS-only) to remove react-dom dependency; (2) accept limitation — deploy works normally. | P4xS | 2026-06-18 |
| **PDF** | | | | | |
| 8 | DN landscape — EN name in header | ✅ Done | D: Company EN name not rendering in landscape DN header; Thai name shows fine | P2xS | 2026-06-12 |
| 60 | Customer delete hard-removes row from sheet | ✅ Done (Code.gs v1.4.166) | D: deleteCustomer() currently deletes the Customers sheet row entirely. Risk: loses address/phone/taxId history. Proposed fix: soft-delete — write "ลบแล้ว" (or "deleted") to the หมายเหตุ col instead of removing the row; filter out soft-deleted rows in getCustomers() so they never appear in frontend or autocomplete. Similar pattern to cancel invoice. | P3xS | 2026-06-18 |
| 58 | Similar name warning fires on save — should fire on name blur/Enter | ✅ Done (KCFactory v1.4.33) | D: Warning currently triggers when user clicks บันทึก. Should fire immediately when user finishes typing the name (onBlur or Enter on the name field) — before they fill in address/phone/etc. Applies to DN form, TI form, CustomerPage. | P2xS | 2026-06-18 |
| 57 | Similar name warning — exclude common title prefixes from containment check | ✅ Done (KCFactory v1.4.31) | D: Typing "คุณ" or "บริษัท" alone would trigger containment warning against every customer with those prefixes. Fix: define COMMON_PREFIXES exclusion set; skip containment check if normTyped exactly matches a prefix word. List: คุณ นาย นาง นางสาว บริษัท ห้างหุ้นส่วน หจก บจก. Levenshtein check still runs normally. | P2xS | 2026-06-18 |
| 56 | Similar name warning misses containment case | ✅ Done (KCFactory v1.4.30) | D: Typing "กำธร" while "คุณ กำธร" exists gives no warning — Levenshtein score 0.57 < 0.75 threshold. Fix: add containment check — if normalized typed name appears inside existing name (or vice versa) and both ≥3 chars, treat as similar. Applied to DN form, TI form, CustomerPage. | P2xS | 2026-06-18 |
| 55 | PDF description column overflow — wide chars | ✅ Done (Code.gs v1.4.161) | D: TTT/XXX-style wide ASCII chars overflow desc column despite DESC_MAX/DETAIL_MAX frontend caps. Root cause: flex:1 div has min-width:auto (default), preventing overflow:hidden from clipping. Fix: add min-width:0 to all flex:1 desc-right divs in all 4 PDF builders. | P2xS | 2026-06-18 |
| 17 | File naming prefix P_/L_ | ✅ Done | D: Add prefix to saved filenames so files are identifiable without opening | P3xS | 2026-06-12 |
| 13 | Page color label (portrait) | ⏳ Pending | D: Small colored label per page matching physical paper set (green/yellow/white/blue)<br>Note: Placement TBD with director | P4xS | 2026-06-11 |
| 43 | TI landscape — too much left space | ✅ Done | D: Promoted center-lock to live in v1.4.147. leftHalfWidth frozen at 151.5mm. | P3xS | 2026-06-16 |
| 44 | Clean up staging test functions | ✅ Done (Code.gs v1.4.193) | D: Relocated entire TEST FUNCTIONS section (all test*()/stagingTest*(), mock-data only, no production callers) to new Staging.gs in same GAS project — globals still resolve. Code.gs −429 lines. Staging workflow preserved. | P4xS | 2026-06-19 |
| 45 | Trim Code.gs version log | ✅ Done (Code.gs v1.4.193) | D: Trimmed 82 // Version + 107-line legacy changelog (~190 lines) to newest 15 + pointer. Full history archived to CHANGELOG.md in repo. | P4xS | 2026-06-19 |
| 46 | DN landscape — apply GAS PDF knowledge | ✅ Done | D: Empirical GAS PDF rules now established and documented (essay + backlog). DN landscape is single-page (no center-lock needed) but all other rules apply (2:1 page offset ratio, staging workflow, print+fold verification). #8 confirmed fixed (v1.4.72). Review overall DN landscape layout. | P2xS | 2026-06-17 |
| **UI** | | | | | |
| 34 | DETAIL_MAX frontend cap | ⏳ Recalibrate needed | D: Hard character limit on detail field per segment (like DESC_MAX); prevent overflow in PDF right block. **Done v1.4.19**: DETAIL_MAX=32 added; applied in both DN and TI `updateDetailItem` guards. **Test 2026-06-19**: 34–36 chars still too long in real Thai text — cap value TBD, discuss later. **Arch fix v1.4.83**: removed incorrect DESC_MAX combined-width guard from `updateDetailItem`/`updateDetailTI` — detail is a separate right block, not inline with desc, so only DETAIL_MAX applies. **Display fix v1.4.85**: `dw` in row render now uses desc+desc2 only (was getDescText which included detail — caused yellow warn to be skipped entirely, red firing at 4th detail char with long product names). Now: yellow at detailW≥25, red at detailW≥34 or dw≥48, independent. Recalibration of DETAIL_MAX value still needed. | P1xS | 2026-06-13 |
| 19 | Customer name autocomplete | ✅ Done (v1.4.27) | D: Suggest matching names as user types; allow manual entry + auto-save new names. CustomerAutocomplete component loads customers on mount, filters locally, fills address/phone/taxId on select. Wired in DN and TI forms. | P2xM | 2026-06-12 |
| 53 | Customer page edit button appears off-screen | ✅ Done (v1.4.26) | D: Clicking แก้ไข sets form state but form renders above the table — user sees nothing if scrolled down. Fix: scroll form into view on open via useRef. | P2xS | 2026-06-17 |
| 52 | Auto-log customer on invoice save | ✅ Done (Code.gs v1.4.160) | D: When DN or TI is created/updated, call autoLogCustomer_() in Code.gs — silently upserts into "Customers" sheet (skip if name already exists). No frontend change needed. Covers createDeliveryNoteFromWeb, updateDeliveryNoteFromWeb, createTaxInvoiceFromWeb, updateTaxInvoiceFromWeb. | P2xS | 2026-06-17 |
| 20 | Similar name warning on customer add | ✅ Done (v1.4.28) | D: Auto-merge/fuzzy-replace rejected (ฮังเซ้ง ≠ ฮั่วเซ้ง are different customers). Instead: on createCustomer, check Levenshtein similarity ≥0.75 against existing names; if found, show ConfirmModal "พบชื่อที่คล้ายกัน: X — ดำเนินการต่อใช่ไหม?". User can confirm or cancel to fix. Frontend-only (customers list already loaded). | P2xS | 2026-06-12 |
| 54 | Similar name warning missing from invoice forms | ✅ Done (v1.4.29) | D: #20 warning only in CustomerPage. DN/TI form also needs it — user can type a similar-but-not-matching name and save without warning. Fix: add onCustomersLoaded callback to CustomerAutocomplete; check similarity in DN + TI handleSave before submitting. | P2xS | 2026-06-17 |
| 51 | Customer list management page | ✅ Done (KCFactory v1.4.25, Code.gs v1.4.159) | D: CRUD page for ลูกค้า. Sheet "Customers" cols A–E: ชื่อลูกค้า/ที่อยู่/โทรศัพท์/เลขภาษี/หมายเหตุ. Backend: getCustomers/createCustomer/updateCustomer/deleteCustomer (name as key, auto-create sheet). Frontend: CustomerPage with list + inline add/edit form + delete confirm. Prereq for #19/#20. | P2xM | 2026-06-17 |
| **Doc** | | | | | |
| 6 | Delete/cancel invoice | ✅ Done | D: Soft delete — mark cancelled in sheet; confirm dialog; keep row for audit. Backend v1.4.157 (cancelDeliveryNote/restoreDeliveryNote col P, cancelTaxInvoice/restoreTaxInvoice col R, getCancelled* functions); frontend v1.4.22 (cancel button + ConfirmModal on detail views, collapsed "ใบที่ยกเลิก" search section on list pages, กู้คืน restore). | P2xM | 2026-06-11 |
| 12 | Update billing note template | 🔄 Partial | D: Portrait PDF ✅ Done (v1.4.168–v1.4.180) — header, info band, table, footer (Option C), สต. col, fixed row heights. Landscape PDF ✅ Done (v1.4.175–v1.4.180) — center-lock 151.5mm, ต้นฉบับ+สำเนา, matching style. Frontend format selector ✅ Done → #85 (v1.4.181/v1.4.48). Sheets integration (link to DN) not yet scoped. | P4xM | 2026-06-11 |
| 89 | Function rename for consistency — BN | ✅ Done (Code.gs v1.4.184, KCFactory.jsx v1.4.51) | D: getBNHistory→getBillingNotes, getNextBNNumber→getNextBillingNoteNumber, buildBillingNote*PDF params bnNo/customerName→invoiceNo/name. 5 Code.gs sites + 3 KCFactory sites updated. Tests: ค้นหา DN → สร้าง BN → เปิด History tab. | P4xS | 2026-06-18 |
| 88 | Dead code removal — BN legacy functions | ✅ Done (Code.gs v1.4.183) | D: Remove onOpen(), openBillingNoteSidebar(), parseBNDate(), previewBillingNote(), _confirmBillingNote_LEGACY_DO_NOT_USE(), router case "previewBillingNote". All dead since web app replaced Sheets sidebar workflow. | P4xS | 2026-06-18 |
| 87 | Link DN→BN (Option A) | ✅ Done (Code.gs v1.4.182, KCFactory.jsx v1.4.50) | D: Fix searchDeliveryNotesForBilling field name bug (invoiceNo→no); read col Q per DN row for bnNo; accurate generated flag (all invoices billed); confirmBillingNote() marks billed DNs in Invoice History col Q; CreateBNTab shows green bnNo badge on billed DN rows. | P2xM | 2026-06-18 |
| 86 | BN History — PDF open link | ✅ Done (KCFactory.jsx v1.4.49) | D: BNHistoryTab table missing PDF column. pdfUrl already returned by getBNHistory() (col H). Add PDF column with 📄 PDF link button → opens in new tab; shows — if no URL. | P2xS | 2026-06-18 |
| 85 | BN confirm modal — portrait/landscape format selector | ✅ Done (Code.gs v1.4.181, KCFactory.jsx v1.4.48) | D: confirmBillingNote() hardcodes buildBillingNotePortraitPDF. Need: (1) portrait/landscape toggle in BN confirm modal (KCFactory.jsx); (2) pass format param through api.confirmBN + router to confirmBillingNote(); (3) Code.gs confirmBillingNote() branches on format param to call appropriate builder. | P3xS | 2026-06-18 |
| **Config / Files** | | | | | |
| 16 | Organize Google Drive folders | 🔀 Merged → #70 | D: All docs save to single Drive folder; separate by type or month/year. ➜ Merged into #70 (2026-06-18) — design finalized there. | P4xM | 2026-06-12 |
| 70 | Restructure Config sheet + separate Drive folders per doc type | ✅ Done (Code.gs v1.4.163) | D: (1) Split Config sheet into two sheets — "Config" (company info: name/nameEN/address/tel/taxId + system settings: vatRate/folderDN/folderTI/folderBN) and "Config_Products" (products/sizes — designed to grow into BOM/variants). (2) Remove hardcoded invoiceFolderId/bnFolderId from CONFIG object in Code.gs — folder IDs live in Config sheet only. (3) PDF builders read folderDN/folderTI/folderBN from cfg; each doc type saves to its own Drive folder. (4) Code.gs: split getConfig() into getProductConfig() + getCompanySystemConfig(); keep merged wrapper for backward compat. (5) Create 3 Drive folders (DN/TI/BN) and add IDs to Config sheet. Archiving done manually in Drive — no year subfolder logic needed. Supersedes #16. | P3xM | 2026-06-18 |
| 73 | getConfig() not reading products from Config_Products | ✅ Done (Code.gs v1.4.164) | D: Products moved to Config_Products sheet but getConfig() still reads product/size rows from Config sheet → dropdown shows old placeholder products. Fix: after reading Config sheet, call getProductConfig() and override products/sizes if non-empty. Also remove product/size rows from getConfig() seed defaults and saveConfig(). | P2xS | 2026-06-18 |
| 76 | CustomerAutocomplete: remove 8-item cap on suggestion list | ✅ Done (KCFactory v1.4.35) | D: Both branches in filtered had .slice(0,8) — removed; list now scrolls with no cap. maxHeight:220 container already handles overflow. | P2xS | 2026-06-18 |
| 77 | addProduct() mid-session: products state not updated after add | ✅ Done (v1.4.37) | D: api.addProduct() writes to Config_Products but local products state in App not updated → newly added product still triggers modal until page refresh. Fix: pass setProducts down as prop to DN+TI forms; call setProducts(prev => [...prev, name]) in addProduct success handler in both forms. Also fix stray `sizes;` no-op in DN modal button. | P2xS | 2026-06-18 |
| 78 | Refactor: productWarning state + modal duplicated in DN and TI forms | ⏳ Pending — folded into #111 | D: checkProductName, productWarning state, addingProduct state, and the modal JSX are copy-pasted between DeliveryNoteForm and TaxInvoiceForm. **Now absorbed by #111: state/checkProductName → Phase 1 useInvoiceForm; modal JSX → Phase 2 <ProductWarningModal>.** Close when #111 P1+P2 land. | P4xS | 2026-06-18 |
| 79 | ConfirmModal: Enter key to confirm (delete/cancel only) | ✅ Done (v1.4.38) | D: Add enterConfirm prop (default false) + useEffect keydown in ConfirmModal — Enter → onConfirm when enterConfirm=true and not loading, Escape → onCancel always. Pass enterConfirm={true} to: row delete DN, row delete TI, invoice cancel DN, invoice cancel TI, customer delete. Do NOT add to: similar-name warnings (DN/TI/CustomerPage) or product add-new modal — user must click to avoid accidental creates. | P3xS | 2026-06-18 |
| 81 | ProductAutocomplete dropdown clipped by overflow:hidden | ✅ Done (v1.4.39) | D: Table wrapper (line 598) has overflow:hidden which clips the absolute-positioned dropdown regardless of z-index. Fix: switch dropdown to position:fixed using inputRef + getBoundingClientRect() to anchor to screen coordinates — escapes all parent overflow clips. | P2xS | 2026-06-18 |
| 82 | ProductAutocomplete dropdown position offset (position:fixed approach) | ✅ Done (v1.4.40) | D: After #81 fix, dropdown renders below the table rather than directly under the input. getBoundingClientRect() may return stale/wrong rect at time of render — suspect rect state update + re-render timing, or page scroll offset affecting fixed positioning. Diagnose: add console.log(rect) on openDropdown to verify rect values match input position; check if page scroll (window.scrollY) needs to be added. | P2xS | 2026-06-18 |
| 74 | SettingsPage cleanup | ✅ Done (KCFactory.jsx v1.4.42) | D: (1) Remove EditableList for products/sizes — products now live in Config_Products, not Config sheet. (2) Replace invFolder/bnFolder fields with folderDN/folderTI/folderBN — labels "ใบส่งของ (DN)" / "ใบกำกับภาษี (TI)" / "ใบวางบิล (BN)"; accept full URL or bare ID (extractFolderId_ handles both). (3) Remove stale state variables invFolder/bnFolder; update loadConfig + saveConfig call to use new keys. | P2xS | 2026-06-18 |
| 75 | Settings page lock/unlock | ✅ Done (KCFactory.jsx v1.4.42) | D: Page locked by default — all inputs greyed out / pointer-events:none. Lock icon button in header; click → unlock → inputs become editable. Prevents accidental edits to company info / folder IDs. | P3xS | 2026-06-18 |
| 71 | New product prompt on invoice save | ✅ Done (KCFactory v1.4.36, Code.gs v1.4.165) | D: On invoice save (DN + TI), for each item whose product name is not found in Config_Products: (1) check similarity against product list (reuse findSimilarCustomers logic); (2) show modal — if similar found: list as clickable chips (click → auto-fills that row, modal closes, user re-saves); if no similar: plain confirm; (3) "เพิ่มสินค้าใหม่" → appends ["product", name] to Config_Products sheet + proceeds to save; "ยกเลิก" → clears field. ProductAutocomplete component replaces <select> in DN+TI desc field. Backend: addProduct(name). Trigger: blur on desc field. | P3xM | 2026-06-18 |
| 72 | Product management CRUD page | ✅ Done (KCFactory.jsx v1.4.45, Code.gs v1.4.167) | D: Dedicated page (like CustomerPage) to add, edit, delete, reorder products and sizes in Config_Products — so users don't need to go into Google Sheets directly. Separate from #71 (auto-add on invoice). | P4xM | 2026-06-18 |
| 83 | ProductAutocomplete — arrow key navigation | ✅ Done (KCFactory.jsx v1.4.46) | D: After dropdown opens, pressing ↓/↑ arrow keys does not move selection through the list. User must click with mouse. Fix: track highlightedIndex state; onKeyDown on input — ArrowDown increments, ArrowUp decrements, Enter selects highlighted item. | P3xS | 2026-06-18 |
| 123 | BN Detail — missing แบบพิมพ์ (landscape) button | ✅ Done (Code.gs v1.4.201, KCFactory.jsx v1.4.79) | D: Creation always portrait (format toggle removed from BNCustomerPanel). BNDetailView: แบบพิมพ์ btn generates landscape via generateBillingNoteLandscapePDF, caches URL in BN History col L, cleared on edit. Backend: new generateBillingNoteLandscapePDF() + router case; editBillingNote clears col L; getBillingNotes+getBillingNoteDetail return landscapeUrl. | P3xS | 2026-06-19 |
| 125 | BN Detail — PDF button greyed/conditional (should be on-demand like แบบพิมพ์) | ✅ Done (Code.gs v1.4.202, KCFactory.jsx v1.4.81) | D: PDF button was a conditional `<a>` tag hidden when detail.pdfUrl empty — old BNs without col H URL had no button. Fix: new generateBillingNotePortraitPDF() GAS function checks col H cache, generates if empty, stores, returns URL. BNDetailView: PDF `<a>` → `<Btn>` with ptLoading state (same pattern as แบบพิมพ์). edit now clears both pdfUrl + landscapeUrl. | P2xS | 2026-06-19 |
| 127 | DN/TI — prompt to add new customer on invoice save | ✅ Done (Code.gs v1.4.203, KCFactory.jsx v1.4.84) | D: When saving DN/TI with a customer name not found in allCustomers AND no similar-name match: show 3-way modal — ใช่ เพิ่มลูกค้าใหม่ (save + log) / ไม่ ไม่ต้องเพิ่ม (save, skipAutoLog=true → Code.gs skips autoLogCustomer_) / ยกเลิก (fall back to edit). ConfirmModal extended with onSecondary+secondaryLabel props. | P3xS | 2026-06-19 |
| 124 | BN Edit — editable address/phone (per-BN override) | ✅ Done (Code.gs v1.4.202, KCFactory.jsx v1.4.80) | D: BNEditForm: added address+phone state (pre-filled from detail), fields UI, passed to api.editBillingNote. Backend: editBillingNote writes params.address/phone to BN History cols M/N; confirmBillingNote persists to cols M/N; getBillingNoteDetail reads cols M/N as override (takes priority over Invoice History address/phone). | P3xS | 2026-06-19 |
| 84 | Product CRUD — per-invoice-type config | ⏳ Pending | D: TC-06/07 flagged need for different product lists per document type (DN vs TI vs BN). Currently all doc types share one Config_Products list. Redesign TBD — possible approach: type column already exists ("product"\|"size"), could extend to "product_dn"\|"product_ti" etc., or separate tabs per doc type in Config_Products. Scope + UX to be designed before coding. | P4xL | 2026-06-18 |
| **Infra** | | | | | |
| 22 | Split Code.gs | ⏳ Pending | D: Move DN PDF functions to DeliveryNote.gs; move all stagingTest*() functions to StagingTests.gs; Code.gs too long to navigate<br>Note: Do after system is stable | P3xL | 2026-06-12 |

---

| 47 | Detail warning text too small | ✅ Done | D: "ใกล้จะเต็ม" / "ถึงขีดจำกัด" warning below detail field is fontSize:9 — too small to read; increase to match table font | P3xS | 2026-06-17 |

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
| P1 | Billing note (ใบวางบิล) | PDF builders complete (portrait + landscape, v1.4.180). Frontend format selector ✅ Done (#85, v1.4.181/v1.4.48). Sheets integration (link to DN) not yet scoped. | 2026-06-17 |
| P2 | Stock management (คลังสินค้า) | Full feature scope TBD — may include stock-in/out tracking, low-stock alerts, link to DN items | 2026-06-17 |
| P3 | Item list management (รายการสินค้า) | No backend sheet tab — items currently maintained only via website UI. Scope TBD: may include a "Items" sheet tab in Google Sheets, backend CRUD (getItems/createItem/updateItem/deleteItem), and sync with existing item entry in DN/TI forms. | 2026-06-18 |
| #80 | addProduct() loading indicator | TBC pending user testing — if noticeably slow, wire addingProduct state to disable button + spinner. Check after first real use before coding. | 2026-06-18 |
| #15 | Migrate to Electron | Replace GAS/Sheets with Electron + SQLite; factory has 1 PC — fully local. Long-term goal. | 2026-06-12 |

---

## Pending Testing

| # | Item | What to Test | Result |
|---|---|---|---|
| 32 | Continuation row — save/reload (Option A) | (1) Type past DESC_MAX → Enter → ↳ row created. (2) Save → reload → ↳ row reconstructed from `detail \| cont` split. (3) Edit again → save → verify no data loss | ✅ Done |
| 32 | Continuation row — detail view | Open saved invoice in detail view → continuation text visible in detail column | ✅ Done |
| 32 | Continuation row — PDF | Generate PDF with a joined detail → verify ` \| ` text renders acceptably in PDF cell | ✅ Done |
| 33 | Grand total after #32 fix | Add 1 real item + 1–2 continuation rows → verify grand total matches subtotal × 1.07 | ✅ Done |
| — | Continuation row UX (v1.4.15) | (1) Hard block: type past DESC_MAX — no chars accepted. (2) Enter → ↳ row + detail focused. (3) At 10 rows: Enter + Add Row both blocked. (4) Save: payload has no `_cont` flag | ✅ Done |
| — | Vertical column borders (v1.4.99–1.4.109) | Test print all 4 PDF formats; verify borders on every column; no bleed at edges | ✅ Done |
| 10 | DN portrait font QA | Test print; compare font sizes against DN landscape; verify ยอดรวม, baht, sig labels, footer all readable | 🔧 In progress |
