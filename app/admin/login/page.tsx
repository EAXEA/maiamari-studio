/**
 * Admin giriş sayfası. Zaten yetkiliyse panele yönlendirir.
 */
import { redirect } from "next/navigation";
import {
  isAuthed,
  isAdminConfigured,
  getAdminConfigWarning,
} from "@/lib/admin/auth";
import { LoginForm } from "@/components/admin/login-form";

export default async function AdminLoginPage() {
  if (await isAuthed()) redirect("/admin");

  const configured = isAdminConfigured();
  const warning = configured ? getAdminConfigWarning() : null;

  return (
    <div className="max-w-sm mx-auto pt-8">
      <h1 className="font-display text-2xl mb-1">Yönetim Girişi</h1>
      <p className="text-sm text-[color:var(--color-muted)] mb-8">
        Mağaza yönetim paneline erişmek için parolanızı girin.
      </p>
      {warning && (
        <p className="text-sm text-amber-700 border border-amber-300 bg-amber-50 rounded-md px-3 py-2 mb-5">
          {warning}
        </p>
      )}
      {configured ? (
        <LoginForm />
      ) : (
        <p className="text-sm text-red-600 border border-red-300 bg-red-50 rounded-md px-3 py-2">
          Panel yapılandırılmamış: <code>ADMIN_PASSWORD_HASH</code> ve{" "}
          <code>ADMIN_SESSION_SECRET</code> değerlerini <code>.env.local</code>{" "}
          dosyasına ekleyin.
        </p>
      )}
    </div>
  );
}
