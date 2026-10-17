import { describe, expect, test } from "bun:test";
import { THEMES, nextTheme, normalizeTheme } from "./theme";

describe("appearance modes", () => {
  test("only light and dark are available", () => {
    expect([...THEMES]).toEqual(["light", "dark"]);
    expect(nextTheme("light")).toBe("dark");
    expect(nextTheme("dark")).toBe("light");
  });
  test("saved glass modes migrate to the corresponding solid theme", () => {
    expect(normalizeTheme("glass-light")).toBe("light");
    expect(normalizeTheme("glass-dark")).toBe("dark");
    expect(normalizeTheme(null)).toBe("light");
  });
});