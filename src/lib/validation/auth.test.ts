import { describe, expect, it } from "vitest";

import { newPasswordSchema, signInSchema } from "./auth";

describe("signInSchema", () => {
  it("accetta email e password valide", () => {
    const result = signInSchema.safeParse({
      email: "mario@example.it",
      password: "segreta",
    });
    expect(result.success).toBe(true);
  });

  it("rifiuta un'email non valida", () => {
    const result = signInSchema.safeParse({
      email: "non-una-email",
      password: "segreta",
    });
    expect(result.success).toBe(false);
  });

  it("rifiuta una password vuota", () => {
    const result = signInSchema.safeParse({
      email: "mario@example.it",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("newPasswordSchema", () => {
  it("richiede almeno 8 caratteri", () => {
    const result = newPasswordSchema.safeParse({
      password: "corta",
      confirm: "corta",
    });
    expect(result.success).toBe(false);
  });

  it("richiede che le due password coincidano", () => {
    const result = newPasswordSchema.safeParse({
      password: "password-lunga",
      confirm: "password-diversa",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("confirm"))).toBe(
        true,
      );
    }
  });

  it("accetta due password uguali di lunghezza sufficiente", () => {
    const result = newPasswordSchema.safeParse({
      password: "password-lunga",
      confirm: "password-lunga",
    });
    expect(result.success).toBe(true);
  });
});
