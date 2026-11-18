import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-panel border border-dashed border-line px-6 py-12 text-center">
      <Icon size={28} strokeWidth={1.5} className="text-ink-soft" aria-hidden />
      <p className="max-w-sm font-semibold">{title}</p>
      {children}
    </div>
  );
}
