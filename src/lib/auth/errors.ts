/** Sessione assente dove è richiesta. */
export class AuthRequiredError extends Error {
  constructor() {
    super("Autenticazione richiesta");
    this.name = "AuthRequiredError";
  }
}

/** L'utente è autenticato ma non ha il permesso necessario. */
export class PermissionError extends Error {
  constructor(public readonly permission: string) {
    super(`Permesso mancante: ${permission}`);
    this.name = "PermissionError";
  }
}
