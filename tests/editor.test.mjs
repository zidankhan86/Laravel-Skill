import { test } from "node:test";
import assert from "node:assert/strict";
import { assignEditorValue } from "../server/editor.mjs";
test("visual editor addresses only existing string fields and array entries", () => {
  const value = {
    title: "Before",
    fields: { image: "/before.png", features: ["One"] },
  };
  assignEditorValue(value, "fields.features.0", "বাংলা");
  assert.equal(value.fields.features[0], "বাংলা");
  for (const path of [
    "__proto__.polluted",
    "constructor.prototype.polluted",
    "fields.__proto__",
    "fields.features.8",
    "unknown",
    "fields",
  ])
    assert.throws(() => assignEditorValue(value, path, "bad"));
  assert.throws(() => assignEditorValue(value, "title", { html: "bad" }));
  assert.equal({}.polluted, undefined);
});
