import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { CapturePanel } from "@/components/capture-panel";
import { SessionList } from "@/components/session-list";
import { useLibrary } from "@/lib/store";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const load = useLibrary((s) => s.load);
  const ready = useLibrary((s) => s.ready);

  useEffect(() => {
    if (!ready) void load();
  }, [ready, load]);

  return (
    <AppShell>
      <CapturePanel />
      <section className="mt-8">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-display text-xl font-medium tracking-tight">Biblioteca</h2>
        </div>
        <SessionList />
      </section>
    </AppShell>
  );
}
