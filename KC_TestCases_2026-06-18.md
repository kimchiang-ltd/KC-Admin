# KC Factory — Test Cases 2026-06-18
**Covers:** KCFactory.jsx v1.4.42–v1.4.45 · Code.gs v1.4.166–v1.4.167

---

## TC-01 · Settings — Lock / Unlock (#75)

**Precondition:** Navigate to ระบบ → ตั้งค่า

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open Settings page | All inputs greyed out (opacity 0.65). Save button NOT visible. Lock button shows 🔒 ล็อค |
| 2 | Click 🔒 ล็อค | Button changes to 🔓 กำลังแก้ไข. All inputs become active. Save button appears |
| 3 | Click 🔓 กำลังแก้ไข again | Returns to locked state. Save button disappears |
| 4 | While locked, try clicking any input field | Input not editable (disabled) |

---

## TC-02 · Settings — Folder URL display (v1.4.44)

**Precondition:** Config sheet has folder IDs saved as bare IDs (e.g. `1pctvxL0mpmvpI7DjLUCl4fsXW6iUaAvz`)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open Settings page | DN / TI / BN fields show full URL: `https://drive.google.com/drive/folders/1pctvxL0mpmvpI7DjLUCl4fsXW6iUaAvz` |
| 2 | Fields are empty (no folder IDs saved) | Placeholder shows `https://drive.google.com/drive/folders/...` |
| 3 | Hint text visible | Shows "วาง URL จาก Google Drive ได้เลย — ระบบจะดึง Folder ID ให้อัตโนมัติ" |

---

## TC-03 · Settings — Per-field onBlur save (#76 / v1.4.43)

**Precondition:** Settings unlocked (🔓 กำลังแก้ไข)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Click DN Folder URL field, change nothing, click away | No popup appears |
| 2 | Paste a new full Drive URL into DN field, click away (onBlur) | Confirm popup: "บันทึก Folder URL สำหรับ DN ใหม่?" |
| 3 | Click Cancel on popup | Value reverts visually? No — value stays but nothing saved. Reload page to verify not saved |
| 4 | Paste new URL, click away, click OK on popup | Popup closes, save succeeds. Reload page → field shows new URL |
| 5 | Paste a bare folder ID (no "https://") into TI field, click away, confirm | Saved. Reload → field shows full URL (bare ID reconstructed to URL on load) |
| 6 | Paste full URL into BN field, confirm save, reload | BN field shows same URL after reload |

---

## TC-04 · Settings — Save All still works

**Precondition:** Settings unlocked

| Step | Action | Expected |
|------|--------|----------|
| 1 | Edit company name and address | Fields updated |
| 2 | Click บันทึกทั้งหมด | Saving spinner → success. Page auto-locks (🔒 ล็อค). Save button disappears |
| 3 | Reload page | Company name and address reflect saved values |

---

## TC-05 · Customer soft-delete (#60)

**Precondition:** At least one customer exists in Customers sheet

| Step | Action | Expected |
|------|--------|----------|
| 1 | Go to ลูกค้า page, find a test customer | Customer appears in list |
| 2 | Click ลบ → confirm delete | Customer disappears from list |
| 3 | Open Google Sheets → Customers sheet → find the deleted row | Row still exists. Col E (หมายเหตุ) shows "ลบแล้ว" |
| 4 | Reload customer page | Deleted customer does not reappear |
| 5 | Try adding a new customer with the same name as the deleted one | Succeeds — no "ชื่อมีอยู่แล้ว" error |
| 6 | Add another customer with same name as the new one (not deleted) | Fails with duplicate error |

---

## TC-06 · Product CRUD page — สินค้า tab (#72)

**Precondition:** Navigate to คลังสินค้า → สินค้า

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open page | Shows 📦 จัดการสินค้า header. Two tabs: สินค้า (active) / ขนาด. Existing products listed |
| 2 | Click + เพิ่มสินค้าใหม่ | Inline form appears with "เพิ่มสินค้าใหม่" label and input auto-focused |
| 3 | Leave name empty, click บันทึก | Alert "กรุณากรอกชื่อ" |
| 4 | Type "สินค้าทดสอบ", press Enter | Saves. Form closes. New item appears at bottom of list |
| 5 | Click แก้ไข on the new item | Form shows "แก้ไขสินค้า" with current name pre-filled |
| 6 | Change name, click บันทึก | List updates with new name |
| 7 | Click ลบ on the edited item | Confirm modal appears |
| 8 | Press Enter to confirm | Item deleted. Removed from list |
| 9 | Open Google Sheets → Config_Products | Changes reflected (add/edit/delete all persisted) |

---

## TC-07 · Product CRUD page — ขนาด tab (#72)

**Precondition:** On สินค้า page

| Step | Action | Expected |
|------|--------|----------|
| 1 | Click ขนาด tab | Tab highlights. List shows existing sizes only (no products) |
| 2 | Click + เพิ่มขนาดใหม่ | Form shows "เพิ่มขนาดใหม่" |
| 3 | Type "XL ทดสอบ", บันทึก | Saves. Appears in ขนาด list |
| 4 | Switch back to สินค้า tab | New size NOT visible (tab filters correctly) |
| 5 | Open Google Sheets → Config_Products | New row has type="size", value="XL ทดสอบ" |
| 6 | Delete test size | Removed from list and sheet |

---

## TC-08 · Product autocomplete still works after CRUD changes

**Precondition:** DN or TI form open

| Step | Action | Expected |
|------|--------|----------|
| 1 | Type in description field | Autocomplete dropdown shows existing products |
| 2 | Add a new product via สินค้า page (TC-06 step 4) | Refresh DN/TI form page → new product appears in autocomplete |
| 3 | Delete a product via สินค้า page | Refresh → deleted product no longer in autocomplete |

---

## TC-09 · Regression — existing invoice save unaffected

| Step | Action | Expected |
|------|--------|----------|
| 1 | Create a new DN with at least one line item | Saves successfully, appears in DN list |
| 2 | Create a new TI | Saves successfully |
| 3 | Generate PDF for both | PDF generates and Drive link returned |

---

*End of test cases*
