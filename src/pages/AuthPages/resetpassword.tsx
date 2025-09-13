import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import ResetPasswordForm from "../../components/auth/ResetPasswordForm";
export default function resetpassword() {
  return (
    <>
      <PageMeta
        title="Forgot Dashboard | TailAdmin - Next.js Admin Dashboard Template"
        description="This is   SignIn Tables Dashboard page for TailAdmin -   Tailwind CSS Admin Dashboard Template"
      />
      <AuthLayout>
        <ResetPasswordForm />
      </AuthLayout>
    </>
  );
}
