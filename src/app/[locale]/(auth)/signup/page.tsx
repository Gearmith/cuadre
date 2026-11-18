import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/auth-shell";
import { SignupForm } from "@/components/auth-forms";
import { Link } from "@/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("signupTitle") };
}

export default async function SignupPage() {
  const t = await getTranslations("auth");
  return (
    <AuthShell
      path="/signup"
      title={t("signupTitle")}
      lead={t("signupLead")}
      footer={
        <>
          {t("haveAccount")}{" "}
          <Link href="/login" className="font-semibold text-navy hover:underline">
            {t("signIn")}
          </Link>
        </>
      }
    >
      <SignupForm />
    </AuthShell>
  );
}
