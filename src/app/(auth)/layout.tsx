import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center bg-[var(--canvas)] p-4">
      <div className="w-full max-w-sm rounded-xl border border-[var(--line)] bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2 text-sm font-extrabold tracking-[0.12em]">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#4c7bff] not-italic text-white">
            A
          </span>
          ATHLETIX
        </div>
        {children}
      </div>
    </div>
  );
}
