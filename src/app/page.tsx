import { redirect } from "next/navigation";

// Il proxy (`src/proxy.ts`) intercetta "/" e instrada verso /dashboard o /login.
// Questo redirect è solo una rete di sicurezza.
export default function RootPage() {
  redirect("/dashboard");
}
