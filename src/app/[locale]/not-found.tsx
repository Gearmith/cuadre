import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { buttonStyles } from "@/components/styles";

export default function NotFound() {
  const t = useTranslations("errors");
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="font-display text-2xl font-medium">{t("notFoundTitle")}</h1>
      <p className="text-ink-soft">{t("notFoundBody")}</p>
      <Link href="/" className={`${buttonStyles.primary} mt-2`}>
        {t("goHome")}
      </Link>
    </main>
  );
}
