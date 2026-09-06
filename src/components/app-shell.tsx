import { Link } from "@tanstack/react-router";
import { Mic } from "lucide-react";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh overflow-x-hidden bg-bg">
      <header className="border-b border-border bg-surface/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5 text-fg no-underline">
            <span className="grid size-9 place-items-center rounded-md bg-accent text-accent-fg">
              <Mic className="size-4" strokeWidth={2} />
            </span>
            <span className="leading-tight">
              <span className="block font-display text-lg font-medium tracking-tight">
                AulaVoz
              </span>
              <span className="block text-xs text-muted">Clases a texto y podcast</span>
            </span>
          </Link>
          <p className="hidden max-w-xs text-right text-xs text-muted sm:block">
            Tus audios se quedan en este dispositivo.
          </p>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
    </div>
  );
}
