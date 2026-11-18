import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/auth-shell";
import { ForgotForm } from "@/components/auth-forms";
import { Link } from "@/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("forgotTitle") };
}

export default async function ForgotPage() {
  const t = await getTranslations("auth");
  return (
    <AuthShell
      path="/forgot-password"
      title={t("forgotTitle")}
      lead={t("forgotLead")}
      footer={
        <Link href="/login" className="font-semibold text-navy hover:underline">
          {t("backToLogin")}
        </Link>
      }
    >
      <ForgotForm />
    </AuthShell>
  );
}
