// ============================================================
// KC Factory System — Web App
// ============================================================
// Version History — full detail in docs/daily-progress/KC_Daily_Progress_YYYY-MM-DD.md
// v1.4.399 (2026-07-24) — #434: Rename system tagline ระบบจัดการเอกสาร (login) + ระบบจัดการโรงงาน (sidebar) → ระบบบริหารจัดการโรงงาน.
// v1.4.398 (2026-07-15) — #396: Supplier List remove sortOrder field from form + table, sort alphabetically (Thai locale). #320: Fix README §H Invoice History column table (doc correction).
// v1.4.397 (2026-07-15) — #277: Remove dead BNPreviewModal component (archived to docs/reference/KC_Archived_Components.md).
// v1.4.396 (2026-07-15) — #402: TI branch field — dropdown (สำนักงานใหญ่/สาขา) with free-text input. Auto-fills from customer master on select, editable override. Shows in list, detail view. Saved to backend col U(21).
// v1.4.395 (2026-07-15) — #399: SalesByCustomerReport adds TI data — fetches TI in parallel, TI customers shown as "name (VAT)" separate rows. Detail page adapts labels (DN/TI).
// v1.4.394 (2026-07-14) — #400: customer address textarea (max 3 lines) — TIPage, BNTIPage (edit+create), TISettingsPage. Replaces single-line input so users can control line breaks in PDF.
// v1.4.393 (2026-07-14) — #401: multi-txn per supplier/day — form shows list when >1 txn, preview has "+ เพิ่มรายการใหม่" button, grid shows stacked amounts, entryLookup→array.
// v1.4.392 (2026-07-14) — #398 cont: fix month picker alignment with icon (marginLeft 30→34 to match back btn 24px + gap 10px).
// v1.4.391 (2026-07-14) — #398 cont: month picker dropdown (calendar icon + popup grid 4×3 with year nav) + print button outlined blue style matching DN detail page.
// v1.4.390 (2026-07-14) — #398 cont: month nav arrows + print button styled blue (accent) instead of grey to match other pages.
// v1.4.389 (2026-07-14) — #398: move month navigator to left under title, swap stats badges to right in ExpenseLogPage header.
// v1.4.388 (2026-07-14) — #397 cont: fix Thai word-breaking on Settings hub cards — wrap ใบกำกับภาษี in nowrap span instead of CSS keep-all.
// v1.4.387 (2026-07-14) — #397 cont: BNTIPage page title ใบวางบิลสำหรับใบกำกับภาษี→ใบวางบิล (VAT) to match sidebar.
// v1.4.386 (2026-07-14) — #397 cont: HubCard labels add wordBreak:"keep-all" to prevent Thai word splitting (ใบกำกับภาษี stays together). All 3 HubCard definitions (OtherPage, SettingsPage, ReportsPage).
// v1.4.385 (2026-07-14) — #397 cont: sidebar label ใบวางบิลสำหรับใบกำกับภาษี→ใบวางบิล (VAT) for brevity.
// v1.4.384 (2026-07-14) — #397 cont: ลูกค้าสูงสุด→ยอดขายสูงสุด (SalesByCustomerReport KPI card).
// v1.4.383 (2026-07-14) — #397 cont: sidebar nav ใบวางบิล TI→ใบวางบิลสำหรับใบกำกับภาษี, table headers เลขที่ BN→เลขที่ใบวางบิล, เดือน DN→เดือนที่เปิดใบส่งของ, เดือน TI→เดือนที่เปิดใบกำกับภาษี (InvoicePage+BNTIPage+KCFactory+SettingsPage).
// v1.4.382 (2026-07-14) — #397 Replace abbreviations with full Thai: DN→ใบส่งของ, TI→ใบกำกับภาษี, BN→ใบวางบิล in all user-facing labels (Settings hub cards, folder URLs, Reports hub). Remove emoji from Supplier List title. Also QT→ใบเสนอราคา in folder label.
// v1.4.381 (2026-07-14) — #394 Rename: รายการซื้อ→รายการซื้อวัตถุดิบ, ผู้ขายค่าใช้จ่าย→Supplier List, desc→บันทึกการซื้อวัตถุดิบ.
// v1.4.380 (2026-07-14) — #338 Phase 6: migrate all alert() → inline error banner + all window.confirm → ConfirmModal across entire frontend (10 files, ~60 alerts, ~4 confirms).
// v1.4.379 (2026-07-14) — #338 Phase 4–6: fmtAmt extracted to shared/utils.jsx (removed 5 local copies + replaced ~96 raw .toLocaleString() calls across 11 files), TIPage/UnbilledDNReport table header zIndex:2+boxShadow, ExpenseLogPage 3 buttons→Btn.
// v1.4.378 (2026-07-14) — #392 InvoicePage.jsx: update BN date parsers from dd/MM/yyyy to yyyy-MM-dd — toInputDate, dnPeriodLabel, BN date filter, parseDate sort helper, dnMonthKey. Matches Code.gs yyyy-MM-dd standardization.
// v1.4.377 (2026-07-14) — #338 Phase 3: ui.jsx function style — convert all const arrow components (Badge, Btn, SectionTitle, Spinner, ErrorBox, Paginator, renderPhoneScreen) to function declarations for consistency with all other modules.
// v1.4.376 (2026-07-14) — #312 Remove hardcoded ALLOWED_EMAILS from App.jsx — backend Allowlist sheet is now sole authority. Adding/removing users requires only editing the sheet, no frontend redeploy.
// v1.4.375 (2026-07-14) — #382 Expense Log: last-saved day highlight (dashed blue border + light blue bg) on calendar after save. Cleared on new day select. lastDay state.
// v1.4.374 (2026-07-14) — #382 Expense Log: read-only preview for existing entries — clicking day/entry with data shows amount greyed out + แก้ไข button to unlock editing. Placeholder changed to "กรุณาเลือกวันที่". previewId state separates viewing from editing.
// v1.4.373 (2026-07-14) — #381 Expense Log: disable amount until day selected (greyed out + "เลือกวันที่ก่อน" placeholder), calendar blue pulse after save, preserve typed amount on day switch, remove auto-focus to amount after save.
// v1.4.372 (2026-07-14) — #380 Expense Log: grid cell optimistic save — value shows immediately with corner status dot (amber spinner/red X), no more full-cell spinner blocking. Delete also optimistic. Retry on click for failed cells.
// v1.4.371 (2026-07-14) — #380 Expense Log: optimistic non-blocking save — entry appears immediately with amber spinner, green check on success, red X on failure (click to retry). No UI blocking between entries.
// v1.4.370 (2026-07-14) — #379 Expense Log: per-period entries cache (_entriesCache[period]) — month navigation instant from cache, invalidated on save/delete/grid edit.
// v1.4.369 (2026-07-14) — #378 BN-TI distinction: add "เดือน TI" column (tiPeriodLabel from invoice dates), default sort by tiMonth, colSpan fix.
// v1.4.368 (2026-07-14) — #378 partial: BN-TI distinction — page title "ใบวางบิล TI", sidebar icon Receipt (color deferred).
// v1.4.367 (2026-07-14) — #308 + #376b(6,9,10) Inline TI editor in BN-TI: สินค้า column with item count, click-to-expand detail, parallel TI prefetch, TIInlineEditor (editable items + VAT footer, save via tiApi.updateTaxInvoice), onTiEdited live total update.
// v1.4.366 (2026-07-14) — #376b BN-TI parity UX (5,7,8): create-dropdown batch option, address/phone enrichment from TI customer master, edit-mode gated checkboxes in BNCustomerPanel.
// v1.4.365 (2026-07-14) — #376a BN-TI parity quick fixes: (1) PDF button FileText icon, (2) badge only when cancelled, (3) list th zIndex:2 + boxShadow (also BN list in InvoicePage), (4) customer panel sticky-footer flex layout.
// v1.4.364 (2026-07-13) — #377 อื่นๆ hub: reorder sections → บัญชี / ภาษี / เอกสาร (accounting first, quotation last).
// v1.4.363 (2026-07-13) — #377 อื่นๆ hub: group cards by section (เอกสาร / ภาษี / บัญชี) with grey labels, matching Settings page pattern.
// v1.4.362 (2026-07-13) — #367e Empty state: icon + guide text. Error handling: replace all alert() with inline error banner (auto-dismiss 4s).
// v1.4.361 (2026-07-13) — #367e Keyboard flow: after-save focus amount field. Print: window.print button + @media print CSS (grid=landscape, entries=portrait).
// v1.4.360 (2026-07-13) — #375 Header → card format (B2: icon box + pill tags). Rename บันทึกซื้อสินค้า → รายการซื้อ throughout.
// v1.4.359 (2026-07-13) — #374 Pill toggle → medium size. Supplier chip: selected scales up (D1) + green checkmark badge (B). Replace supplier input with search bar / status bar split.
// v1.4.358 (2026-07-13) — #373 Revert tab bar → floating pill toggle (top-right, same position both states). Remove grid "+ เพิ่มผู้ขาย" (redundant). Rename สมุดรายวันจ่าย → บันทึกซื้อสินค้า throughout.
// v1.4.357 (2026-07-13) — #372b Tab bar UX: replace collapsed vertical tab with proper tab bar ("รายการที่บันทึก" / "ตารางสรุป") inside right panel card. Better discoverability.
// v1.4.356 (2026-07-13) — #372 Layout redesign: entry list as separate column (50:50 with form), grid as collapsible panel (25:75). Toggle tab switches between entry list and grid in right panel.
// v1.4.355 (2026-07-13) — #371 Month card redesign: square aspect-ratio, left accent border stripe, month name as hero (22px bold), amount muted below, year label larger (16px)
// v1.4.354 (2026-07-13) — #369 fix: month list shows only months with data (no empty placeholders), empty state guidance
// v1.4.353 (2026-07-13) — #370 Grid cell saving spinner (Loader icon instead of dim opacity) + fmtAmt always 2 decimal places
// v1.4.352 (2026-07-13) — #369 Expense Log month list page: year sections (พ.ศ.) + 6-col card grid (month name, entry count, total ฿) + cache + back button. Click card → entry/grid view. getExpenseLogPeriods endpoint.
// v1.4.348–351 (2026-07-13) — #367 Expense Log (สมุดรายวันจ่าย): #367b settings expense supplier CRUD, #367c entry panel (supplier chips, day picker, amount/note, batch save), #367d grid view (day×supplier, inline edit, sticky cols, auto-sum), #367e grid columns derived from entries only (each month starts blank)
// v1.4.347 (2026-07-13) — #366 Settings hub: group cards into ทั่วไป (company/drive/products/customers) and ภาษี (TI products/TI customers/suppliers) sections with grey labels, matching homepage layout
// v1.4.346 (2026-07-13) — #365 Move delete from list to form view: ConfirmModal confirm → loading overlay "กำลังลบ..." → onBack to list. Delete button in action bar (only existing forms). Remove Trash2 column from list tables. Fix ConfirmModal props (confirmLabel not confirmText). Both Sales + Purchase.
// v1.4.345 (2026-07-13) — #364b Remove checkNew from taxId onBlur — prompt now only fires on branch blur or branchHq change (both Sales + Purchase)
// v1.4.344 (2026-07-13) — #364 Fix branch not saved: handleContactConfirm re-reads rowsRef at confirm time so branch/branchHq entered after prompt appeared are captured (both Sales + Purchase)
// v1.4.343 (2026-07-13) — #363 Fix auto-save contact prompt: styled ConfirmModal replaces browser confirm, rowsRef+setTimeout fixes stale closure + branch not saved, prevents double popup (both Sales + Purchase)
// v1.4.342 (2026-07-13) — #362 docNo sequence: VP-6907-1, VP-6907-2 instead of duplicate VP-6907. Backend makeDocNo_ counts existing same-base docs. Frontend fallback passes preceding docNos.
// v1.4.341 (2026-07-13) — #361 Fix auto-save contacts: move prompt from name blur → taxId/branch blur so all details (name+taxId+branch) are captured. Track prompted rows to avoid re-prompting.
// v1.4.340 (2026-07-13) — #346 Delete saved VAT form: trash icon on list rows, confirm dialog, api.deleteOtherDoc → backend deleteOtherDoc (both Sales + Purchase)
// v1.4.339 (2026-07-13) — #357 Auto-save new contacts on blur: VAT Purchase prompts to add new supplier, VAT Sales prompts to add new customer (TI). Refreshes list after add.
// v1.4.338 (2026-07-13) — #358b VAT period month change updates default row dates (1st of old month → 1st of new month); user-edited dates untouched
// v1.4.337 (2026-07-13) — #360 VAT manual VAT confirm on blur: prompt when VAT differs from auto-calc, revert if declined (both Sales + Purchase)
// v1.4.336 (2026-07-13) — #359 VAT form stay on page after save (remove onBack redirect) + saving overlay blocks interaction + "บันทึกแล้ว" green indicator
// v1.4.335 (2026-07-13) — #358 VAT date picker opens to selected period month: pre-fill new rows with 1st of period month (both Sales + Purchase)
// v1.4.334 (2026-07-13) — #356 Supplier list: separate contact list for VAT Purchase; SupplierPage in Settings; VatPurchaseBlankForm uses supplier autocomplete
// v1.4.333 (2026-07-13) — #355 VAT list page header style: match DN pattern (FileText icon + fontSize 16 + full-text create button)
// v1.4.331–332 (2026-07-13) — #354 VAT list docNo: เลขที่ column (VS-6907/VP-6907) in sales+purchase lists; #354b read from DB with frontend fallback
// v1.4.329–330 (2026-07-13) — #352–353 VAT print tables: table-layout:fixed + 100% widths + word-break:break-word; add ลำดับที่ row number column (all 3 files)
// v1.4.327–328 (2026-07-13) — #350–351 อื่นๆ navigation fix (single breadcrumb, onViewChange, goListRequest reset, QT fix); web table headers match print
// v1.4.323–326 (2026-07-13) — #347–349 VAT purchase form (VatPurchaseBlankForm.jsx), list cache, config prefetch, input font fix
// v1.4.322 (2026-07-11) — #345 VAT form list-first pattern: VatSalesListPage (history list + create/edit), save/load to Other Docs sheet (type=VAT), api endpoints (listOtherDocs/loadOtherDoc/saveOtherDoc). Hub card routes to list, form has save button
// v1.4.321 (2026-07-11) — #343 remove duplicate เพิ่มแถว button (keep bottom only) + #344 replace inline CustomerInput with shared CustomerAutocomplete (tiApi customers, fixes dropdown clipping)
// v1.4.320 (2026-07-11) — #342b-fix blank form starts with 1 row instead of 20 (user adds rows as needed)
// v1.4.319 (2026-07-11) — #342b blank ภ.พ.30 form under อื่นๆ: new VatSalesBlankForm.jsx — editable table (date picker, customer autocomplete with auto-fill taxId/branch, manual subtotal, auto-calc VAT from config vatRate, add/delete rows, auto-sum footer). OtherPage hub card + routing. Print A4 portrait matching #338c template
// v1.4.318 (2026-07-11) — #341 Rename Reports hub card "ส่งออกยอดขายรายเดือน" → "รายงานยอดขายรายเดือน" (breadcrumb map + hub label + BackHeader)
// v1.4.317 (2026-07-11) — #339 Hub cards on Settings/Reports/Other pages: changed from grid repeat(3,1fr) to flex-wrap + fixed 140px width, matching Home dashboard layout
// v1.4.316 (2026-07-11) — #250 BN Sales Export print: add empty spacer column between ลูกค้า and ยอดขาย (matches original template)
// v1.4.315 (2026-07-11) — #250 BN Sales Export: append " (Vat)" to customer name for BN-TI entries to distinguish from BN(DN)
// v1.4.314 (2026-07-11) — #338c VAT Sales Report page: new Reports hub card "รายงานภาษีขาย" → VatSalesReport.jsx. Single-month picker, loads TI list (tiApi.getTaxInvoices) + customer config (tiApi.getCustomers) for taxId/branch lookup. Preview table 1 row per TI, sorted date asc. Interactive fill-in: missing taxId/branch → modal → tiApi.updateCustomer (saved once, reused every month). A4 print matches ภ.พ.30 template (company info from tiApi.getConfig). Footer sum(subtotal) + sum(vat)
// v1.4.313 (2026-07-10) — #338b-TI TISettingsPage TI customer form: mirror of #338b — adds "สาขา" field + table column to TI customer master (separate from KC Admin's Config_Customers per user flag — TI uses tiApi → Invoice Admin backend, hits Customers sheet in KC_Tax_Invoice_DB). Needs Invoice Admin backend gs v0.0.18 (#338a-TI) deployed. Enables lookup path for #338c VAT sales report
// v1.4.312 (2026-07-10) — #338b Settings customer form: add "สาขา" field (dropdown: — ไม่ระบุ — / สำนักงานใหญ่ / สาขาเลขที่...) with conditional 5-digit numeric input for branch code (auto-pad on blur). Table gains "สาขา" column showing "—" / "สำนักงานใหญ่" / "สาขา NNNNN". Wired to createCustomer/updateCustomer (backend already accepts branch via #338a gs v1.4.298). Prepares for #338c VAT sales report
// v1.4.311 (2026-07-10) — #336 BN sales export: group by Period column (col O) instead of BN creation date; backend getBillingNotes() now returns period field; createBillingNote writes period "YYYY-MM" derived from DN dates. Removed debug diagnostic card
// v1.4.310 (2026-07-10) — #250 BN sales export report: new Reports hub card "ส่งออกยอดขายรายเดือน" — merges BN (DN) + BN-TI data, multi-month selector, preview table, print A4 portrait (opens print dialog) + export Excel (.xlsx via SheetJS, one sheet per month). Customers sorted A-Z, payment columns blank for manual fill-in. Requires `npm install xlsx` in deploy repo
// v1.4.309 (2026-07-10) — #324 CustomerAutocomplete loading indicator: show spinner + "กำลังโหลดรายชื่อลูกค้า..." in the dropdown while the customer list is being fetched on mount (was: empty dropdown with no feedback). #80 closed (already implemented)
// v1.4.308 (2026-07-05) — #310c single BN create inline DN edit: expanding a not-yet-billed DN now shows "แก้ไขใบส่งของ" → reuses DNInlineEditor (#301) in place. On save updates the DN's total live in the row + footer + header + #310a left metric cards (via onDnEdited), clears the DN pdfUrl so re-print regenerates (#309), drops _dnStore (#282). Customer locked, date preserved; billed DNs stay read-only (#296). Threads products/sizes BillingNotePage→BNCreateView→BNCustomerPanel. Completes the #310 group
// v1.4.307 (2026-07-05) — #326 BN create split-button dropdown now lists BOTH modes (สร้างแบบรวม → batch · สร้างทีละราย → single); #327 single BN create pre-fetches the selected customer's DN line items in PARALLEL on select (mirrors batch #251) so สินค้า counts appear at once + expand is instant instead of one-by-one round-trips (shows "…" while prefetching)
// v1.4.306 (2026-07-05) — #310b (pass 2 of 2) single BN create right panel: added the "แก้ไขรายการ" edit-mode toggle (mirrors batch #252d) to BNCustomerPanel — off = clean DN list (all unbilled included), on = per-DN checkboxes + select-all appear, unchecked rows grey out with line-through and drop from the total, footer shows "· ข้าม N". Exclusions persist after exiting edit mode. #310b complete
// v1.4.305 (2026-07-05) — #310b (pass 1 of 2) single BN create right panel (BNCustomerPanel): Design B refresh — header now shows DN count + customer total; DN table dropped the always-on checkbox column, added a สินค้า column (lazy getDNDetail → "สินค้า N รายการ") with click-to-expand line-item table (reuses dnCache). Scroll fix #325: removed the panel's fixed maxHeight + inner overflow so the whole panel scrolls in the right-column region (DN table no longer collapses to a sliver on fully-billed customers). Pass 2 = "แก้ไขรายการ" edit-mode toggle + exclusion checkboxes (mirror batch #252d)
// v1.4.304 (2026-07-05) — #310a single BN create left-panel: added 3 summary metric cards (ลูกค้า/ใบส่งของ/รวม) above the customer list + widened the column 220→280px (Design B). Layout only — billing logic unchanged; #310b (right-panel refresh) + #310c (inline DN edit) next
// v1.4.303 (2026-07-04) — #314 block editing a billed TI (mirror #296): TaxInvoiceDetail edit button guards on data.billed → alerts "ต้องยกเลิกใบวางบิลก่อน" instead of opening the editor, so editing a TI already on a BN-TI can't leave the parent BN-TI total/count stale
// v1.4.302 (2026-07-04) — #318 redeploy trigger only (no code change): version bump to force a fresh gh-pages commit + new "pages build and deployment" run, to supersede a wedged/Queued Pages deploy that left the live site stuck on v1.4.297. Once live shows 1.4.302, re-enable ENFORCE_AUTH on both backends (#318)
// v1.4.301 (2026-07-04) — #299e session-expiry UX: onAuthReject now shows a dedicated "เซสชันหมดอายุ / กรุณาเข้าสู่ระบบใหม่" modal with a single Google re-login button (one click satisfies the OAuth popup gesture) instead of a generic error code — a mid-session midnight-exp is benign re-auth, not a failure. Silent refresh intentionally not attempted (popup flow needs a user gesture). NOTE: only visible once #299b ENFORCE_AUTH is live
// v1.4.300 (2026-07-04) — #299c frontend auth plumbing (needs backend #299a deployed to function): apiCall + tiApiCall migrated GET→POST with text/plain body {…params, action, token} (avoids GAS CORS preflight; also resolves #288 URL-length); shared session-token store in api.jsx (setAuthToken/getAuthToken/clearAuthToken, localStorage kc_token stamped to #244 midnight); App.jsx calls api.login after Google sign-in → stores token, mounts app only on success; setOnAuthReject → drops session + re-login on backend "unauthorized" (fires once #299b live); logout clears token. tiApi shares the same token (ignored by TICode until #299d). NOTE: GAS cross-origin POST behavior to confirm on first real deploy
// v1.4.299 (2026-07-04) — #311 login error hardening: all 3 App.jsx failure paths (not-allowed / Google onError / userinfo fetch) now show ONE identical generic message "เกิดข้อผิดพลาด กรุณาลองใหม่ (รหัส NNN)" so an unauthorized user can't tell why login failed; the (รหัส NNN) is an internal-only diagnostic code (449 not-allowlisted · 491 sign-in failed · 492 userinfo error). Was: not-allowed path leaked the email + "ไม่มีสิทธิ์เข้าใช้งาน"
// v1.4.298 (2026-07-04) — audit cleanup batch: #290 delete dead EditableList component (+ its Check/Pencil imports & 🗑 emoji); #291 folder-URL save uses styled ConfirmModal instead of native window.confirm (Settings); #306 BN-TI detail VAT label drops hardcoded "7%" → "ภาษีมูลค่าเพิ่ม" (BN-TI can mix per-TI frozen rates)
// v1.4.297 (2026-07-03) — #292 single auth gate: main.jsx now renders <App/> directly (deleted the duplicate AuthWrapper + its ALLOWED_EMAILS + login screen). Fixes double-login on first sign-in (AuthWrapper stored kc_user without #244 _loginDate stamp, which App.jsx then rejected); ALLOWED_EMAILS now lives only in App.jsx
// v1.4.296 (2026-07-03) — #309 inline DN edit now mirrors the DN page: on save clears the DN's pdfUrl/portraitUrl, and the batch "เปิด PDF" button regenerates the landscape PDF (api.generateDeliveryNoteLandscapePDF) when the url was cleared → re-print after an edit gives the fresh PDF
// v1.4.295 (2026-07-03) — #301 edit DN inline from BN batch create: expand a not-yet-billed DN → "แก้ไขใบส่งของ" turns its item table into an in-place editor (reuses useInvoiceForm; customer locked; date preserved); save updates the row total + summary cards live and drops _dnStore cache. Threads products/sizes into BillingNotePage→BNBatchCreateView
// v1.4.294 (2026-07-03) — #305 TI detail VAT% label uses the TI's frozen rate (data.vatRate from backend col T) instead of the global rate — old 7% TIs no longer show an "8%" label next to a 7% amount
// v1.4.293 (2026-07-03) — #302 VAT propagation: SettingsPage keeps vatRate in settingsConfig cache (Settings no longer reverts to 7); KCFactory passes onConfigSaved→refreshVatRate so TI form/list update after a Settings save without app reload
// v1.4.292 (2026-07-03) — #295c VAT single-source: TaxInvoicePage fed vatRate from config; TI form/detail label + list total (#285) use vatRate; Settings VAT (%) field
// v1.4.289 (2026-07-03) — #296 block editing a billed DN (guard edit button like cancel); must cancel the BN first
// v1.4.288 (2026-07-03) — #284 customer field-sync failures now surface a non-blocking alert (was silent .catch) in DN/BN/TI/BN-TI forms (4 spots)
// v1.4.287 (2026-07-03) — #279 DN/TI list: stop sending search to backend (full range cached, client-side filtered) — fixes search-cache poisoning
// v1.4.286 (2026-07-03) — Tier-1 audit batch: #287 null-name guard (utils+autocomplete), #283 NaN ‖0 guard (DN+TI detail), #289 zero-amount shows 0, #281 select-all counts unbilled only (BN+BN-TI), #293 UI font Sarabun→Prompt, #280 fmtDateThai handles yyyy-MM-dd + DN popup date, #282 _dnStore invalidated on DN edit
// v1.4.283 (2026-07-03) — #276 fix hardcoded "26" BN year fallback: derive yy from current year in InvoicePage + BNTIPage (fallbacks + useState initial)
// v1.4.281 (2026-07-03) — #273 fix silent DN/TI save when customer list fails to load: guardedSave no longer blocks when allCustomers empty; CustomerAutocomplete auto-retries once + shows visible error/retry
// v1.4.280 (2026-07-03) — #184 DN list: add "สร้างเมื่อ" timestamp column (YYYY/MM/DD HH:mm:ss)
// v1.4.279 (2026-07-03) — #272 fix React.Fragment → Fragment import in BNTIPage (BN-TI batch create crash)
// v1.4.278 (2026-07-03) — #263 BN-TI create button: default to batch, dropdown for single (mirror BN #262)
// v1.4.277 (2026-07-03) — #263 BN-TI batch create: mirrors BN batch flow (summary cards, review/edit modes, confirm dialog, batch print, all-done view)
// v1.4.276 (2026-07-02) — #248 TI save button: Save icon for edit mode, Receipt for create. #232 TI list refresh button
// v1.4.275 (2026-07-02) — #271 BN create (single+batch): address/phone from Config_Customers (source of truth), user edits preserved
// v1.4.270–273 (2026-07-02) — #265–#268 list/detail polish: BN/BN-TI cache separation (#265), remove ฿ from tables (#266), 2-decimal alignment (#267), Thai date format (#268)
// v1.4.253–268 (2026-07-02) — #251–#262 BN batch create: full UX redesign (summary cards, review/edit modes, confirm dialog), cached DN details, batch print with selection, scroll fix, default batch button
// v1.4.233–252 (2026-06-30/07-01) — #226–#244 Reports redesign (SalesByCustomer filter+KPI+sparklines), BN list polish, sortable columns, BN batch create flow, TI 1/4-page dropdown, daily re-login, Drive folder settings
// v1.4.169–182 (2026-06-29) — #211–#225 Phase 7 TI/BN-TI module extraction (tiApi+TIPage+BNTIPage+TISettingsPage), customer sync-back (#214), Reports Phase A (#221), breadcrumb+hotfixes
// v1.4.160–167 (2026-06-26/27) — #190–#208 Phase 2–5 code reorganization: shared layer extraction, QT/Settings/DN+BN module split, TI removal, APP_VERSION to constants.jsx
// v1.4.130–159 (2026-06-23/25) — #155–#183 LINE QR send+phone mockup, sticky headers, BN create billed-DN guards, customer onBlur, nav restructure, pagination, DN landscape multi-page
// v1.4.69–129 (2026-06-18/23) — #93–#141 BN core (create/detail/edit/print/combined PDF), useInvoiceForm hook, QuotationPage full build, nav+UX polish
// v1.4.22–68 (2026-06-17/19) — #6–#110 DN/TI cancel/restore, ProductAutocomplete, ProductPage CRUD, BillingNote foundation
// ============================================================

import React, { useState, useEffect, useRef } from "react";
import { FileText, ClipboardList, FileSearch, Package, BarChart2, Home, LayoutDashboard, LayoutGrid, ArrowLeftRight, Users, Settings, Receipt } from "lucide-react";
import { api, SCRIPT_URL } from './shared/api.jsx';
import { C, SECTION_COLORS, APP_VERSION } from './shared/constants.jsx';
import { Spinner } from './shared/ui.jsx';
import { QuotationPage } from './modules/qt/QTPage.jsx';
import { SettingsPage, OtherPage, PlaceholderPage } from './modules/settings/SettingsPage.jsx';
import { DeliveryNotePage, BillingNotePage } from './modules/invoice/InvoicePage.jsx';
import { TaxInvoicePage } from './modules/ti/TIPage.jsx';
import { BillingNoteTIPage } from './modules/ti/BNTIPage.jsx';
import { ReportsPage } from './modules/reports/ReportsPage.jsx';

// ── Constants (app-specific) ──────────────────────────────

const NAV = [
  { key: "dashboard",  label: "แดชบอร์ด",         icon: "LayoutDashboard", section: null },
  { key: "invoice",    label: "ใบส่งของ",           icon: "FileText",        section: "เอกสาร" },
  { key: "billing",    label: "ใบวางบิล",           icon: "ClipboardList",   section: "เอกสาร" },
  { key: "tax-invoice",label: "ใบกำกับภาษี",        icon: "Receipt",         section: "เอกสาร" },
  { key: "bn-ti",      label: "ใบวางบิล (VAT)",         icon: "Receipt",         section: "เอกสาร", parent: "tax-invoice" },
  { key: "other",      label: "อื่นๆ",               icon: "LayoutGrid",      section: "เอกสาร" },
  { key: "stockmove",  label: "เคลื่อนไหวสต็อก",   icon: "ArrowLeftRight",  section: "คลังสินค้า" },
  { key: "hr",         label: "เอกสาร HR",          icon: "FileSearch",      section: "HR" },
  { key: "reports",    label: "รายงาน",             icon: "BarChart2",       section: "รายงาน" },
  { key: "settings",   label: "ตั้งค่า",             icon: "Settings",        section: "ระบบ" },
];

// ── Shared UI — extracted to shared/ui.jsx ──
// ── Invoice (DN+BN) — extracted to modules/invoice/InvoicePage.jsx (Phase 5, #208) ──


// ── Home Page ─────────────────────────────────────────────
const NAV_ICONS = { FileText, ClipboardList, FileSearch, Package, BarChart2, Users, Settings, ArrowLeftRight, LayoutDashboard, LayoutGrid, Receipt };

function HomePage({ onNavigate }) {
  const sections = [...new Set(NAV.filter(n => n.key !== "dashboard" && n.section).map(n => n.section))];
  const dashboard = NAV.find(n => n.key === "dashboard");

  const IconBox = ({ item }) => {
    const col = SECTION_COLORS[item.section] || SECTION_COLORS[null];
    const Ic = NAV_ICONS[item.icon];
    return (
      <div style={{ width: 44, height: 44, borderRadius: 8, background: col.bg, color: col.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 20 }}>
        {Ic ? <Ic size={22} /> : item.icon}
      </div>
    );
  };

  const cardBase = { background: C.cardBg, border: `0.5px solid ${C.border}`, borderRadius: 10, cursor: "pointer" };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div onClick={() => onNavigate(dashboard.key)}
          style={{ ...cardBase, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}
          onMouseEnter={e => e.currentTarget.style.background = C.rowHover}
          onMouseLeave={e => e.currentTarget.style.background = C.cardBg}>
          <IconBox item={dashboard} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{dashboard.label}</div>
            <div style={{ fontSize: 12, color: C.muted }}>ภาพรวมของระบบทั้งหมด</div>
          </div>
        </div>
      </div>

      {sections.map(section => (
        <div key={section} style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>{section}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {NAV.filter(n => n.section === section && !n.parent).map(item => (
              <div key={item.key} onClick={() => onNavigate(item.key)}
                style={{ ...cardBase, width: 140, padding: "20px 12px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, textAlign: "center" }}
                onMouseEnter={e => e.currentTarget.style.background = C.rowHover}
                onMouseLeave={e => e.currentTarget.style.background = C.cardBg}>
                <IconBox item={item} />
                <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────

export default function App({ userEmail, userName, onLogout }) {
  // ── Inject Prompt font + KC favicon on mount ──
  useEffect(() => {
    // Font
    const fontLink = document.createElement("link");
    fontLink.href = "https://fonts.googleapis.com/css2?family=Prompt:wght@400;500;600;700&display=swap";
    fontLink.rel = "stylesheet";
    document.head.appendChild(fontLink);
    // Apply globally
    document.body.style.fontFamily = "'Prompt', sans-serif";
    // Favicon — KC blue square matching sidebar badge
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#032d60"/><text x="16" y="22" font-family="sans-serif" font-weight="700" font-size="14" fill="white" text-anchor="middle">KC</text></svg>`;
    const favicon = document.querySelector("link[rel*='icon']") || document.createElement("link");
    favicon.type = "image/svg+xml";
    favicon.rel = "shortcut icon";
    favicon.href = "data:image/svg+xml," + encodeURIComponent(svg);
    document.head.appendChild(favicon);
  }, []);

  const [breadcrumbSuffix, setBreadcrumbSuffix] = useState(null);
  const [goListRequest, setGoListRequest] = useState(0);
  const [active, setActive_]      = useState("home");
  const contentRef = useRef(null);
  const scrollToTop = () => { if (contentRef.current) contentRef.current.scrollTop = 0; };
  const setActive = (key) => { setActive_(key); setBreadcrumbSuffix(null); scrollToTop(); };
  // handleViewChange: used as onViewChange for page components — scrolls to top when entering detail view
  const handleViewChange = (label) => { setBreadcrumbSuffix(label ?? null); if (label) scrollToTop(); };
  const [products, setProducts]   = useState([]);
  const [sizes, setSizes]         = useState([]);
  const [vatRate, setVatRate]     = useState(0.07); // #295c — from shared Config sheet
  const [configLoaded, setConfigLoaded] = useState(false);
  const [gsVersion, setGsVersion] = useState(null);
  const [fontScale, setFontScale] = useState(() => {
    try { return parseFloat(localStorage.getItem("kc_fontScale") || "1"); } catch { return 1; }
  });
  const changeFontScale = (delta) => setFontScale(prev => {
    const next = Math.min(1.4, Math.max(0.8, parseFloat((prev + delta).toFixed(1))));
    try { localStorage.setItem("kc_fontScale", next); } catch {}
    return next;
  });

  // ── Global data cache — persists across tab switches ──
  const [cache, setCache] = useState({});
  const updateCache = (key, data) => setCache(prev => ({ ...prev, [key]: data }));

  // Load Code.gs version on startup
  useEffect(() => { api.getVersion().then(v => { if (typeof v === "string") setGsVersion(v); }).catch(() => {}); }, []);

  // Load config once on startup for products/sizes
  useEffect(() => {
    if (SCRIPT_URL === "YOUR_APPS_SCRIPT_URL_HERE") {
      // Dev mode — use defaults
      setProducts(["Product A", "Product B", "Product C", "Product D"]);
      setSizes(["S", "M", "L", "XL", "XXL", "XXXL"]);
      setConfigLoaded(true);
      return;
    }
    api.getConfig().then(cfg => {
      if (cfg.products?.length) setProducts(cfg.products);
      else setProducts(["Product A", "Product B", "Product C", "Product D"]);
      if (cfg.sizes?.length)    setSizes(cfg.sizes);
      else setSizes(["S", "M", "L", "XL", "XXL", "XXXL"]);
      if (typeof cfg.vatRate === "number" && cfg.vatRate > 0) setVatRate(cfg.vatRate); // #295c
      setConfigLoaded(true);
    }).catch(() => {
      setProducts(["Product A", "Product B", "Product C", "Product D"]);
      setSizes(["S", "M", "L", "XL", "XXL", "XXXL"]);
      setConfigLoaded(true);
    });
  }, []);

  // #302 B — re-fetch vatRate after a Settings save so TI form/list pick up the new rate without an app reload
  const refreshVatRate = () => {
    if (SCRIPT_URL === "YOUR_APPS_SCRIPT_URL_HERE") return;
    api.getConfig().then(cfg => {
      if (typeof cfg.vatRate === "number" && cfg.vatRate > 0) setVatRate(cfg.vatRate);
    }).catch(() => {});
  };

  const sections = [...new Set(NAV.filter(n => n.section).map(n => n.section))];

  const renderPage = () => {
    if (!configLoaded) return <Spinner text="กำลังเริ่มต้นระบบ..." />;
    switch (active) {
      case "home":       return <HomePage onNavigate={setActive} />;
      case "invoice":    return <DeliveryNotePage products={products} setProducts={setProducts} sizes={sizes} cache={cache} updateCache={updateCache} onViewChange={handleViewChange} goListRequest={goListRequest} />;
      case "billing":    return <BillingNotePage products={products} setProducts={setProducts} sizes={sizes} cache={cache} updateCache={updateCache} goListRequest={goListRequest} onViewChange={handleViewChange} />;
      case "tax-invoice":return <TaxInvoicePage vatRate={vatRate} cache={cache} updateCache={updateCache} onViewChange={handleViewChange} goListRequest={goListRequest} />;
      case "bn-ti":      return <BillingNoteTIPage cache={cache} updateCache={updateCache} goListRequest={goListRequest} onViewChange={handleViewChange} />;
      case "other":      return <OtherPage products={products} sizes={sizes} cache={cache} updateCache={updateCache} onViewChange={handleViewChange} goListRequest={goListRequest} />;
      case "reports":    return <ReportsPage cache={cache} updateCache={updateCache} onViewChange={handleViewChange} goListRequest={goListRequest} />;
      case "settings":   return <SettingsPage onConfigSaved={refreshVatRate} cache={cache} updateCache={updateCache} onViewChange={handleViewChange} goListRequest={goListRequest} />;
      default:           return <PlaceholderPage title={NAV.find(n => n.key === active)?.label} icon={NAV.find(n => n.key === active)?.icon} />;
    }
  };

  const NavItem = ({ item }) => (
    <div onClick={() => { if (item.key === active) setGoListRequest(n => n + 1); else setActive(item.key); }} style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: item.parent ? "7px 16px 7px 32px" : "9px 16px",
      cursor: "pointer",
      color: active === item.key ? "white" : "rgba(255,255,255,0.7)",
      background: active === item.key ? C.sidebarActive : "transparent",
      borderLeft: active === item.key ? `3px solid ${C.sidebarActiveBorder}` : "3px solid transparent",
      fontSize: item.parent ? 12 : 13, transition: "background 0.15s",
    }}>
      <span style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
        {NAV_ICONS[item.icon] ? React.createElement(NAV_ICONS[item.icon], { size: item.parent ? 14 : 16 }) : item.icon}
      </span>
      {item.label}
    </div>
  );

  const isDevMode = SCRIPT_URL === "YOUR_APPS_SCRIPT_URL_HERE";

  return (
    <div style={{ display: "flex", height: `${100/fontScale}vh`, fontFamily: "Prompt, sans-serif" }}>
      <style>{`html, body { margin: 0; padding: 0; overflow: hidden; } body { zoom: ${fontScale}; }`}</style>

      {/* Sidebar */}
      <div style={{ width: 220, background: C.sidebar, display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "14px 10px", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", gap: 10 }}>
          <div onClick={() => setActive("home")} style={{ width: 32, height: 32, background: C.accent, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: "white", flexShrink: 0, cursor: "pointer" }}>KC</div>
          <div><div style={{ color: "white", fontSize: 13, fontWeight: 500 }}>KC Factory</div><div style={{ color: "rgba(255,255,255,0.45)", fontSize: 10 }}>ระบบบริหารจัดการโรงงาน</div></div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {NAV.filter(n => !n.section).map(item => <NavItem key={item.key} item={item} />)}
          {sections.map(section => (
            <div key={section}>
              <div style={{ padding: "12px 16px 4px", fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{section}</div>
              {NAV.filter(n => n.section === section).map(item => <NavItem key={item.key} item={item} />)}
            </div>
          ))}
        </div>
        <div style={{ padding: "10px 16px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>app v{APP_VERSION}{gsVersion ? <span>  ·  gs v{gsVersion}</span> : null}</span>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: C.pageBg, minWidth: 0 }}>
        {/* Topbar */}
        <div style={{ background: "white", borderBottom: `0.5px solid ${C.border}`, padding: "0 20px", height: 48, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, zoom: 1/fontScale }}>
          <div style={{ fontSize: 13, color: C.muted, display: "flex", alignItems: "center", gap: 6 }}>
            <Home size={14}/>
            <span style={{ color: active === "home" ? C.text : C.accent, cursor: active === "home" ? "default" : "pointer" }}
              onClick={() => active !== "home" && setActive("home")}>หน้าหลัก</span>
            {(() => {
              const activeItem = NAV.find(n => n.key === active);
              const parentItem = activeItem?.parent ? NAV.find(n => n.key === activeItem.parent) : null;
              return <>
                {activeItem?.section && activeItem.section !== activeItem.label && <><span>›</span><span>{activeItem.section}</span></>}
                {parentItem && <><span>›</span>
                  <span style={{ color: C.accent, cursor: "pointer" }} onClick={() => setActive(parentItem.key)}>
                    {parentItem.label}
                  </span></>}
                {activeItem?.label && <><span>›</span>
                  <span style={{ color: breadcrumbSuffix ? C.accent : C.text, cursor: breadcrumbSuffix ? "pointer" : "default" }}
                    onClick={() => { if (breadcrumbSuffix) { setBreadcrumbSuffix(null); setGoListRequest(n => n + 1); } }}>
                    {activeItem.label}
                  </span></>}
                {breadcrumbSuffix && <><span>›</span><span style={{ color: C.text }}>{breadcrumbSuffix}</span></>}
              </>;
            })()}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <button onClick={() => changeFontScale(-0.1)} style={{ background: C.pageBg, border: `0.5px solid ${C.border}`, color: C.muted, borderRadius: 4, width: 26, height: 26, cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>A-</button>
              <button onClick={() => changeFontScale(0.1)} style={{ background: C.pageBg, border: `0.5px solid ${C.border}`, color: C.muted, borderRadius: 4, width: 26, height: 26, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>A+</button>
            </div>
            {isDevMode && (
              <div style={{ background: C.warningBg, color: C.warning, padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: 500 }}>
                ⚠️ Dev Mode — ยังไม่ได้ตั้งค่า SCRIPT_URL
              </div>
            )}
            {userName && <span style={{ fontSize: 13, color: C.muted }}>{userName}</span>}
            {onLogout && (
              <button onClick={onLogout} style={{ background: "none", border: `0.5px solid ${C.border}`, borderRadius: 4, padding: "4px 10px", fontSize: 13, cursor: "pointer", color: C.muted }}>
                ออกจากระบบ
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div ref={contentRef} style={{ flex: 1, padding: "18px 22px", overflowY: "auto" }}>
          {renderPage()}
        </div>
      </div>
    </div>
  );
}