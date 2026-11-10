/**
 * The bill a customer's device first saw for a table, "pinned" so a later
 * party at the same table is never adopted: every poll sends this id and the
 * backend answers 409 error.billSessionEnded once that bill is released or
 * replaced. sessionStorage, so it lives exactly as long as the tab.
 */
const key = (tableCode) => `table-bill:${tableCode}`;

export function getPinnedBill(tableCode) {
  try {
    return window.sessionStorage.getItem(key(tableCode)) || "";
  } catch {
    return "";
  }
}

export function pinBill(tableCode, billId) {
  if (!billId) return;
  try {
    window.sessionStorage.setItem(key(tableCode), String(billId));
  } catch {
    // Private mode / blocked storage: the page still works, it just re-pins.
  }
}

export function clearPinnedBill(tableCode) {
  try {
    window.sessionStorage.removeItem(key(tableCode));
  } catch {
    // ignore
  }
}
