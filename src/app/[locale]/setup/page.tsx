import { getTranslations } from "next-intl/server";
import { BrandMark } from "@/components/brand";

export default async function SetupPage() {
  const t = await getTranslations("setup");
  const steps = [t("step1"), t("step2"), t("step3"), t("step4")];
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-6 px-4 py-10">
      <BrandMark size={36} />
      <div>
        <h1 className="font-display text-2xl font-medium">{t("title")}</h1>
        <p className="mt-2 text-ink-soft">{t("lead")}</p>
      </div>
      <ol className="flex flex-col gap-3 rounded-panel border border-line bg-surface p-5">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-3">
            <span className="num flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-2 text-sm font-medium">{i + 1}</span>
            <span className="pt-0.5">{s}</span>
          </li>
        ))}
      </ol>
    </main>
  );
}
