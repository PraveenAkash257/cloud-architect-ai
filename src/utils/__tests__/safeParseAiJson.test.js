import { describe, it, expect } from "vitest";
import { safeParseAiJson } from "../../services/aiValidator";

describe("safeParseAiJson", () => {
  it("parses clean JSON as-is", () => {
    expect(safeParseAiJson('{"a": 1}')).toEqual({ a: 1 });
  });

  it("strips a ```json ... ``` code fence some providers add anyway", () => {
    const text = '```json\n{"a": 1, "b": "x"}\n```';
    expect(safeParseAiJson(text)).toEqual({ a: 1, b: "x" });
  });

  it("isolates the JSON object from surrounding prose", () => {
    const text = 'Sure, here is the architecture:\n{"a": 1}\nLet me know if you need changes.';
    expect(safeParseAiJson(text)).toEqual({ a: 1 });
  });

  it("repairs the reported bug: an unquoted enum-like value (private_subnet)", () => {
    const text = '{"containers": [{"id": "c1", "groupType": private_subnet, "label": "Private"}]}';
    const parsed = safeParseAiJson(text);
    expect(parsed.containers[0].groupType).toBe("private_subnet");
  });

  it("drops a trailing comma before a closing brace/bracket", () => {
    const text = '{"nodes": [{"id": "n1"},], "edges": [],}';
    const parsed = safeParseAiJson(text);
    expect(parsed.nodes).toHaveLength(1);
    expect(parsed.edges).toEqual([]);
  });

  it("does not mangle true/false/null literals", () => {
    const text = '{"available": true, "empty": null, "flag": false}';
    expect(safeParseAiJson(text)).toEqual({ available: true, empty: null, flag: false });
  });

  it("throws the original error when the text is unrecoverable", () => {
    expect(() => safeParseAiJson("not json at all {{{")).toThrow();
  });

  it("throws a clear error on empty input", () => {
    expect(() => safeParseAiJson("")).toThrow("empty");
  });
});
