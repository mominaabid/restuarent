/**
 * The same dish on one row (same as restaurant-admin src/lib/orderLines.ts).
 * The backend grows a line that is still waiting to be sent, but a line that
 * is already in the kitchen keeps its quantity and the next one is its own
 * kitchen line — so "Burger x2 served" + "Burger x1 cooking" show as one
 * "Burger x3" row with how many are at each stage.
 */
const STAGES = ["pending", "fired", "preparing", "ready", "served"];

function keyOf(item) {
  return [item.name_en || item.name_ar, item.variant_name_en || item.variant_name_ar || "", item.price, (item.notes ?? "").trim()].join("|");
}

/** Voided lines are left out. Groups keep the order their first line arrived in. */
export function groupLines(items = []) {
  const groups = new Map();
  for (const item of items) {
    if (item.status === "voided") continue;
    const key = keyOf(item);
    const group = groups.get(key) ?? { key, lines: [], quantity: 0, total: 0 };
    group.lines.push(item);
    group.quantity += item.quantity;
    group.total += Number(item.price) * item.quantity;
    groups.set(key, group);
  }
  return [...groups.values()];
}

/** The group's one status when every line shares it; otherwise null. */
export function sharedStatus(group) {
  const first = group.lines[0]?.status;
  return group.lines.every((line) => line.status === first) ? first : null;
}

/** "2 served · 1 cooking" — quantity per stage, in kitchen order. */
export function statusBreakdown(group, labelOf) {
  const counts = new Map();
  for (const line of group.lines) counts.set(line.status, (counts.get(line.status) ?? 0) + line.quantity);
  return STAGES.filter((status) => counts.has(status)).map((status) => `${counts.get(status)} ${labelOf(status)}`).join(" · ");
}
