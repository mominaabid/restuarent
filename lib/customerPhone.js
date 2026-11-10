/**
 * The phone number this device ordered with at a table. One party (number) per
 * table until staff release it; the order and pay pages send it on every request;
 * the backend only ever returns that phone's own bill and earlier orders.
 * localStorage, so the same customer coming back sees their previous orders.
 */
const key = (tableCode) => `table-phone:${tableCode}`;

export function getTablePhone(tableCode) {
  try {
    return window.localStorage.getItem(key(tableCode)) || "";
  } catch {
    return "";
  }
}

export function setTablePhone(tableCode, phone) {
  const value = String(phone || "").trim();
  if (!value) return;
  try {
    window.localStorage.setItem(key(tableCode), value);
  } catch {
    // Blocked storage: the page asks for the phone again next time.
  }
}

/**
 * The QR token is permanent per table, so a saved number outlives its party.
 * Forget it once its bill is released, or the next guest scanning on this
 * device would get the previous customer's number filled in (and locked).
 */
export function forgetTablePhone(tableCode) {
  try {
    window.localStorage.removeItem(key(tableCode));
  } catch {
    // Nothing stored.
  }
}
