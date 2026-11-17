import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeSectionOrder,
  moveSection,
  enabledSectionOrder,
} from "../section-order.mjs";
test("section positions survive hide/re-enable; saved order is sanitized", () => {
  const keys = ["hero", "about", "gallery", "booking", "closingCta", "footer"];
  const order = normalizeSectionOrder("gallery,hero,gallery,fake,footer", keys);
  assert.deepEqual(order, [
    "gallery",
    "hero",
    "footer",
    "about",
    "booking",
    "closingCta",
  ]);
  const moved = moveSection(order, "closingCta", "hero");
  assert.equal(moved[1], "closingCta");
  assert.equal(
    enabledSectionOrder(
      moved,
      ["hero", "footer", "navigation"],
      ["navigation", "blog"],
    ),
    "hero,footer,navigation",
  );
  assert.equal(
    enabledSectionOrder(moved, ["hero", "footer", "closingCta"], []),
    "closingCta,hero,footer",
  );
  assert.equal(enabledSectionOrder(moved, [], []), "");
  assert.deepEqual(moveSection(moved, "hero", "hero"), moved);
  assert.deepEqual(
    moveSection(["hero", "about", "gallery"], "hero", "gallery", true),
    ["about", "gallery", "hero"],
  );
});
