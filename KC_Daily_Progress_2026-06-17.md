# KC Factory System — Daily Log 2026-06-17
**Code.gs:** v1.4.156 (no changes this session) | **KCFactory.jsx:** v1.4.18 → v1.4.19

---

## ⚡ Start Here

- **Current versions:** Code.gs v1.4.156 · KCFactory.jsx v1.4.19
- **No pending deploy blockers** — v1.4.19 ready to deploy
- **DETAIL_MAX=32 needs calibration** — value is a starting estimate; run test print to confirm real Thai detail text doesn't hit the cap. If it does, loosen to 34–36.
- **#10 still in progress** — DN portrait font QA test print outstanding
- **#46 still pending** — DN landscape layout review (not #8 — that's confirmed done)
- **Deploy workflow:** edit locally → `npm run deploy` (goes live) → GitHub Desktop commit + push
- **Cross-machine sync:** `git pull` before starting, `git push` after finishing
- **File continuity:** Start a new dated file for each new day. Do not append to this one after the session ends.

---

## Rules (apply every session)

### Hard Constraints

- `buildTaxInvoicePortraitPDF` — never modify directly for experimental changes; all changes must go through `stagingTestTaxInvoicePortrait()` first and be confirmed before promoting to the live builder (CSS border lines may be adjusted directly)
- Col O (col 15) in Tax Invoice History sheet has a year-month formula — **DO NOT TOUCH**
- **Never copy source files again mid-session** — work from uploaded copies only

### Version & Doc

- **Always bump the version number as the last step of every change, before saying done.**
  - `KCFactory.jsx`: changelog comment at top + footer `<span>` version string
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
- **Every staging opts change = its own version bump + experiment log entry** — log format inside each stagingTest function: `vX.X.XXX: tested [what] — [result/why]`; mark promoted entries with `→ live`; active test with `← testing`; idle with `[no active experiment]`
- **Staging may be identical to live when no experiment is in progress** — that is fine
- **Show mockups/previews before code** for any UI or PDF change

### Session & Work Style

- **Backlog doc workflow** — `KC_Backlog.md` is the live working file; update it freely during sessions. `KC_Daily_Progress_YYYY-MM-DD.md` is the permanent record; sync from backlog at end of day only. During a session, only touch `KC_Backlog.md` for outstanding items.
- **Session scope discipline** — agree on agenda at session start; unplanned work gets parked in `KC_Backlog.md`, not acted on mid-session; doc updates are always in scope
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

### TI Landscape Reference (calibrated 2026-06-16, center-lock live since v1.4.147)

- **leftHalfWidth: 151.5mm** → divider at paper center ✓ (do not change)
- **outerLeft: 13mm** (printer non-printable floor; cannot go lower on HP DeskJet 2800)
- **innerGapL: 5mm · innerGapR: 9mm · outerRight: 2mm** (live since v1.4.152)
- **Constraint:** outerLeft + innerGapL must = 18mm to hold divider at 151.5mm (13+5=18 ✓)
- **Recalibration:** if leftHalfWidth ever changes, re-run `stagingTestCenterLine()` with `@page left:0`

### GAS PDF Rendering — Key Constraints

- `overflow:hidden` clips horizontally but does NOT constrain row height — cells expand vertically for long text
- `white-space:nowrap` on flex children inside `<td>` is not reliably respected for row height in GAS PDF
- Only real fix for vertical expansion: frontend cap tight enough that text never reaches PDF long enough to wrap
- `position:absolute` unsupported — use flex + fixed widths
- 2:1 CSS-to-physical ratio applies to pageMarginLeft (page offset) only; flex child widths are 1:1
- Empirical @page left margin: ~16.95mm effective regardless of CSS value (on this printer, margin:8mm 8mm 8mm 15mm)

---

## Outstanding Items

*(Snapshot from KC_Backlog.md at session close — source of truth is KC_Backlog.md)*

| # | Item | PxC | Status |
|---|---|---|---|
| 10 | DN portrait — font & sizing QA | P1xS | 🔧 In progress |
| 34 | DETAIL_MAX calibration | P1xS | ✅ Done (v1.4.19) — value 32 needs test print verification |
| 46 | DN landscape — apply GAS PDF knowledge | P2xS | ⏳ Pending |
| 6 | Delete/cancel invoice | P2xM | ⏳ Pending |
| 19 | Customer name autocomplete | P2xM | ⏳ Pending |
| 20 | Prevent duplicate customer names | P2xM | ⏳ Pending |
| 31 | PDF auto-split safety net | P3xM | ⏳ Pending |
| 22 | Split Code.gs | P3xL | ⏳ Pending |
| 44 | Clean up staging test functions | P4xS | ⏳ Pending |
| 45 | Trim Code.gs version log | P4xS | ⏳ Pending |
| 18 | Date picker font mismatch | P4xS | ⏳ Pending |
| 13 | Page color label (portrait) | P4xS | ⏳ Pending |
| 37 | GAS @page margin not respected | P4xS | ⏳ Pending |
| 16 | Organize Google Drive folders | P4xM | ⏳ Pending |
| 12 | Update billing note template | P4xM | ⏳ Pending |
| 15 | Migrate to Electron | FxXL | 🔮 Future |

---

## Pending Testing

| # | Item | What to Test | Result |
|---|---|---|---|
| 34 | DETAIL_MAX calibration | Test print TI/DN landscape with real Thai detail text — confirm text fits within cell; if any real data hits the 32 cap, loosen to 34–36 | ⏳ Not tested |
| 10 | DN portrait font QA | Test print; compare font sizes against DN landscape; verify ยอดรวม, baht, sig labels, footer all readable | 🔧 In progress |

---

## Work Done This Session

### Session carry-over (from 2026-06-16 session)

| Item | Details |
|---|---|
| gs version display fix | KCFactory.jsx v1.4.18: type guard `if (typeof v === "string")` on `getVersion` response — prevents React crash when old Code.gs returns `{error:...}` object instead of string |
| Code.gs v1.4.156 deploy | User deployed Code.gs; gs version now shows correctly in footer (`app v1.4.18 · gs v1.4.156`); required hard refresh (Cmd+Shift+R) to clear cached JSONP |

### Backlog audit — items confirmed done via code review

| # | Item | Evidence |
|---|---|---|
| #8 | DN landscape EN name | `co.nameEN \|\| "KIMCHIANG LIMITED PARTNERSHIP"` fallback in `half()` — Code.gs v1.4.72 |
| #17 | File naming L_/P_ prefix | All 4 builders have `KC_TaxInvoice_L_`, `KC_TaxInvoice_P_`, `KC_DeliveryNote_L_`, `KC_DeliveryNote_P_` prefix |
| Vertical column borders | `border-right: 0.1mm solid #e0e0e0` on all `<td>` — Code.gs v1.4.99 |
| #32 | Continuation rows | Tested on IV-26-000042: save/reload round-trip ✓, detail view ✓, PDF ✓ |
| #33 | Grand total | IV-26-000042: subtotal 20,000 + 7% = 21,400 ✓ |

### KCFactory.jsx (v1.4.18 → v1.4.19)

| Version | Change | Rationale |
|---|---|---|
| v1.4.19 | #34 DETAIL_MAX=32: hard cap on detail field per segment (independent of DESC_MAX) in both DN + TI `updateDetailItem` guards | GAS PDF expands row height for long text — `overflow:hidden` does not clip vertically; only fix is frontend cap |
| v1.4.19 | atLimit now fires on DETAIL_MAX too: `dw >= DESC_MAX \|\| descWidth(it.detail) >= DETAIL_MAX` — restores red border + ถึงขีดจำกัด warning | Warning was lost because detail hard-blocks before combined text ever reaches DESC_MAX |
| v1.4.19 | TI form colgroup: รายละเอียด col → auto (was 110px), รายการ col → 170px (was auto) | Detail needs more visible space; product names are short and use a select dropdown |
| v1.4.19 | DN form: same column swap — รายละเอียด → auto, รายการ → 170px (was auto) | Consistency with TI form |

### GAS PDF Rendering — New Finding

- `overflow:hidden` on `<td>` does NOT constrain row height in GAS PDF renderer — cells expand vertically for text longer than column width, even with `white-space:nowrap` on inner divs
- Seen on IV-26-000042 TI landscape PDF with long X-string test data
- Root cause: GAS PDF calculates row height from content before CSS overflow constraints apply
- Fix: DETAIL_MAX=32 frontend cap — text that physically fits in the cell cannot expand the row

### Documents

| Item | Change |
|---|---|
| KC_Backlog.md | Marked #8, #17, vertical borders, #32, #33, #34 as ✅ Done; updated #34 with GAS PDF finding and v1.4.19 note; updated #46 to remove #8 reference (already done) |
| KC_Daily_Progress_2026-06-17.md | Created (this file) |

---

---

## Work Done This Session (Continuation — context compaction resumed)

### KCFactory.jsx (v1.4.21 → v1.4.22)

| Version | Change | Rationale |
|---|---|---|
| v1.4.22 | ConfirmModal: add `confirmLabel` prop (default "ลบ") | Allow cancel-confirm dialog to say "ยืนยันยกเลิก" instead of "ลบ" |
| v1.4.22 | api object: 6 new methods (cancelDeliveryNote, restoreDeliveryNote, getCancelledDeliveryNotes, cancelTaxInvoice, restoreTaxInvoice, getCancelledTaxInvoices) | Frontend hooks for #6 backend |
| v1.4.22 | DeliveryNoteDetail: isCancelled prop; showCancelConfirm state; handleCancelInvoice + handleRestoreInvoice handlers; conditional button area (normal: print/pdf/edit/ยกเลิกใบนี้; cancelled: กู้คืน only); cancelled banner; ConfirmModal | #6 cancel/restore in DN detail view |
| v1.4.22 | DeliveryNotePage: cancelled section states (cancelSectionOpen/cancelSearch/cancelLoading/cancelledList); loadCancelled callback; collapsed "ใบที่ยกเลิก" section at bottom of list; cancelledDetail view case | #6 cancelled invoice search + restore flow for DN |
| v1.4.22 | TaxInvoiceDetail: same cancel/restore changes as DeliveryNoteDetail (isCancelled prop, handlers, conditional buttons, banner, ConfirmModal) | #6 cancel/restore in TI detail view |
| v1.4.22 | TaxInvoicePage: same cancelled section + cancelledDetail view as DeliveryNotePage | #6 cancelled invoice search + restore flow for TI |

### Code.gs — no changes (v1.4.157 backend already complete from earlier in session)

### Documents

| Item | Change |
|---|---|
| KC_Backlog.md | #6 marked ✅ Done |
| KC_Daily_Progress_2026-06-17.md | Added continuation section |

---

## Work Done This Session (Continuation 2 — context ran out before doc update)

### KCFactory.jsx (v1.4.22 → v1.4.29)

| Version | # | Change |
|---|---|---|
| v1.4.23 | #49 | ConfirmModal: add `loading` prop — disables confirm button + shows spinner while GAS call in progress; prevents double-click on cancel confirm |
| v1.4.24 | #48 | Left nav click: if item.key === active → increment goListRequest (returns to list view) instead of calling setActive() which did nothing |
| v1.4.25 | #51 | CustomerPage component: list table + inline add/edit form + delete ConfirmModal + similar name warning ConfirmModal; case "customers" added to renderPage switch; 4 new api methods (getCustomers/createCustomer/updateCustomer/deleteCustomer) |
| v1.4.26 | #53 | Customer edit form off-screen fix: formRef + useEffect scrollIntoView on form open; useRef added to React import |
| v1.4.27 | #19 | CustomerAutocomplete component: loads customers on mount, filters locally, fills address/phone/taxId on select; wired in DN and TI forms |
| v1.4.28 | #20 | Similar name warning in CustomerPage: Levenshtein customerSimilarity() ≥0.75 check before save; ConfirmModal shows similar names; user can confirm or cancel |
| v1.4.29 | #54 | Similar name warning extended to DN + TI forms: onCustomersLoaded callback on CustomerAutocomplete; allCustomers/custWarning states + custConfirmedRef pattern; ConfirmModal in both forms |

### Code.gs (v1.4.157 → v1.4.160)

| Version | # | Change |
|---|---|---|
| v1.4.158 | — | Fix getAppVersion() hardcoded to 1.4.156; now returns correct version; add Logger.log |
| v1.4.159 | #51 | CUSTOMER_SHEET = "Customers"; getCustomerSheet_() auto-creates with header; getCustomers/createCustomer/updateCustomer/deleteCustomer (name as key); 4 router cases |
| v1.4.160 | #52 | autoLogCustomer_() silently upserts into Customers sheet; called from all 4 invoice create/update functions; never throws (try/catch) |

### Notes

- #50 (cancelled invoice search): root cause was Code.gs v1.4.156 in production — cancelTaxInvoice router case didn't exist yet so col R was never written. Fixed by Code.gs v1.4.157 deploy. No code change needed.
- Session hit context limit after v1.4.29 — doc update carried to 2026-06-18 session.

---

## Updated Start Here (end of day)

- **Current versions:** Code.gs v1.4.160 · KCFactory.jsx v1.4.29
- **Deploy needed:** Code.gs v1.4.160 (to GAS) + KCFactory.jsx v1.4.29 (`npm run deploy`)
- **Customer features complete** (#51 list, #52 auto-log, #53 edit fix, #19 autocomplete, #20/#54 similar name warning)
- **DETAIL_MAX=34 calibration test print** still outstanding
- **#10 DN portrait font QA** still in progress

---

*🔒 FROZEN — session ended 2026-06-17.*
