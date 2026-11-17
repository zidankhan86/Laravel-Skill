// Retain saved positions, remove duplicates/unknown keys, append newly added sections.
export function normalizeSectionOrder(value, keys) {
  return [
    ...new Set([
      ...String(value || "")
        .split(",")
        .map((k) => k.trim()),
      ...keys,
    ]),
  ].filter((k) => keys.includes(k));
}
export function moveSection(order, key, target, after = false) {
  if (key === target || !order.includes(key) || !order.includes(target))
    return order;
  const next = order.filter((k) => k !== key);
  next.splice(next.indexOf(target) + (after ? 1 : 0), 0, key);
  return next;
}
export function enabledSectionOrder(order, enabled, fixed) {
  return [...order, ...fixed].filter((k) => enabled.includes(k)).join(",");
}
