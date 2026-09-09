import { describe, expect, it } from "vitest";

import { resolvePermission } from "./permission-logic";

describe("resolvePermission", () => {
  it("concede il permesso quando è esplicitamente presente", () => {
    expect(resolvePermission(["people.manage"], "people.manage")).toBe(true);
  });

  it("nega il permesso quando manca", () => {
    expect(resolvePermission(["people.manage"], "finance.manage")).toBe(false);
  });

  it("organization.manage implica ogni permesso", () => {
    const perms = ["organization.manage"];
    expect(resolvePermission(perms, "finance.manage")).toBe(true);
    expect(resolvePermission(perms, "documents.manage")).toBe(true);
    expect(resolvePermission(perms, "reports.read")).toBe(true);
  });

  it("accetta sia Set che array", () => {
    expect(
      resolvePermission(new Set(["groups.manage"]), "groups.manage"),
    ).toBe(true);
  });

  it("un insieme vuoto non concede nulla", () => {
    expect(resolvePermission([], "people.manage")).toBe(false);
  });
});
