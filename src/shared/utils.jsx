// ============================================================
// KC Admin — Shared Utilities
// Pure functions shared across apps (no JSX)
// ============================================================

import { DN_ZERO_WIDTH, SIMILARITY_THRESHOLD } from './constants.jsx';

// ── Description width estimators ──────────────────────────

// DN portrait: Thai chars count 1.5x (wider glyphs), others 1x
export function descWidth(text) {
  let w = 0;
  for (let j = 0; j < text.length; j++) {
    const c = text.charCodeAt(j);
    w += (c >= 0x0E00 && c <= 0x0E7F) ? 1.5 : 1;
  }
  return w;
}

// DN landscape: mirrors Code.gs descWidthV2_ exactly.
// Thai base = 1.0u, non-Thai = 1.1u, space = 4/15u, zero-width diacritics = 0u.
export function descWidthV2(text) {
  let w = 0;
  for (let j = 0; j < text.length; j++) {
    const c = text.charCodeAt(j);
    if (DN_ZERO_WIDTH.has(c)) continue;
    if (c === 0x0020) { w += 4/15; continue; }
    w += (c >= 0x0E00 && c <= 0x0E7F) ? 1.0 : 1.1;
  }
  return w;
}

// Combine desc + desc2 + detail into a single display string
export function getDescText(it) {
  return (it.desc || "") + (it.desc2 ? " " + it.desc2 : "") + (it.detail ? " (" + it.detail + ")" : "");
}

// ── Customer similarity (#20) ─────────────────────────────
// Returns 0–1: 1 = identical, 0 = nothing in common.
export function customerSimilarity(a, b) {
  const norm = s => s.toLowerCase().replace(/[\s\-_.]/g, "");
  a = norm(a); b = norm(b);
  if (!a || !b) return 0;
  if (a === b) return 1;
  const m = a.length, n = b.length;
  const dp = [];
  for (let i = 0; i <= m; i++) { dp[i] = [i]; }
  for (let j = 1; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j-1], dp[i-1][j], dp[i][j-1]);
  return 1 - dp[m][n] / Math.max(m, n, 1);
}

// ── findSimilarCustomers (#61) ────────────────────────────
// Returns names from list that are suspiciously similar to nameVal.
export const _simNorm = s => s.toLowerCase().replace(/[\s\-_.]/g, "");
export const _COMMON_PREFIXES = new Set(["คุณ","นาย","นาง","นางสาว","บริษัท","ห้างหุ้นส่วน","หจก","บจก"]);
export function findSimilarCustomers(nameVal, list) {
  const trimmed = nameVal.trim().toLowerCase();
  if (!trimmed) return [];
  const normTyped = _simNorm(nameVal.trim());
  return list.filter(c => {
    if (c.name.toLowerCase() === trimmed) return false;
    const normC = _simNorm(c.name);
    if (!_COMMON_PREFIXES.has(normTyped) && normC.length >= 3 && normTyped.length >= 3 && (normC.includes(normTyped) || normTyped.includes(normC))) return true;
    return customerSimilarity(c.name, nameVal.trim()) >= SIMILARITY_THRESHOLD;
  }).map(c => c.name);
}

// ── collapseItems (#62) ───────────────────────────────────
// Merges _cont (continuation) rows into their parent's detail field, strips internal flags.
export function collapseItems(items) {
  const collapsed = [];
  for (let i = 0; i < items.length; i++) {
    if (items[i]._cont) continue;
    const it = { ...items[i] };
    const contParts = [];
    let j = i + 1;
    while (j < items.length && items[j]._cont) {
      if (items[j].detail) contParts.push(items[j].detail);
      j++;
    }
    if (contParts.length > 0) it.detail = [it.detail || "", ...contParts].filter(Boolean).join(" | ");
    collapsed.push(it);
  }
  const filled = collapsed.filter(it => it.desc || it.desc2 || it.detail || it.qty || it.amount);
  return { filled, cleanItems: filled.map(({ _orig, _cont, ...it }) => it) };
}

// ── Drive URL helper (#177) ───────────────────────────────
export const toDownloadUrl = (driveUrl) => {
  const m = driveUrl.match(/\/file\/d\/([^/]+)/);
  return m ? `https://drive.google.com/uc?export=download&id=${m[1]}` : driveUrl;
};
