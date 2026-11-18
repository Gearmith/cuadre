import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/auth-forms";
import { Link } from "@/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("loginTitle") };
}

export default async function LoginPage({ searchParams }: PageProps<"/[locale]/login">) {
  const [{ error }, t] = await Promise.all([searchParams, getTranslations("auth")]);
  return (
    <AuthShell
      path="/login"
      title={t("loginTitle")}
      lead={t("loginLead")}
      footer={
        <>
          {t("noAccount")}{" "}
          <Link href="/signup" className="font-semibold text-gold hover:underline">
            {t("createAccount")}
          </Link>
        </>
      }
    >
      <LoginForm linkError={error === "link"} />
    </AuthShell>
  );
}
