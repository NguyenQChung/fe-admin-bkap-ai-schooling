import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import ForgotPasswordForm from "../../components/auth/ForgotPasswordForm";
export default function ForgotPassword() {
  return (
    <>
      <PageMeta
        title="Forgot Dashboard | TailAdmin - Next.js Admin Dashboard Template"
        description="This is   SignIn Tables Dashboard page for TailAdmin -   Tailwind CSS Admin Dashboard Template"
      />
      <AuthLayout>
        <ForgotPasswordForm />
      </AuthLayout>
    </>
  );
}
