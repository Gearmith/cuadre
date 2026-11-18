import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/auth-shell";
import { ResetForm } from "@/components/auth-forms";
import { redirect } from "@/i18n/navigation";
import { getUser } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("resetTitle") };
}

export default async function ResetPasswordPage() {
  const [user, locale, t] = await Promise.all([getUser(), getLocale(), getTranslations("auth")]);
  if (!user) redirect({ href: { pathname: "/login", query: { error: "link" } }, locale });
  return (
    <AuthShell path="/reset-password" title={t("resetTitle")} lead={t("resetLead")}>
      <ResetForm />
    </AuthShell>
  );
}
