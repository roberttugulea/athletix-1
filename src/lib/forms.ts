/** Stato condiviso restituito dalle Server Action usate con `useActionState`. */
export type FormState =
  | {
      ok?: boolean;
      message?: string;
      fieldErrors?: Record<string, string[] | undefined>;
    }
  | undefined;
