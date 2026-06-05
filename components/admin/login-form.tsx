"use client";
/**
 * Admin giriş formu. login server action'ına POST eder.
 */
import { useActionState } from "react";
import { login } from "@/app/admin/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="space-y-5">
      {state?.error && (
        <p className="text-sm text-red-600 border border-red-300 bg-red-50 rounded-md px-3 py-2">
          {state.error}
        </p>
      )}
      <div>
        <label
          htmlFor="password"
          className="block text-xs tracking-[0.15em] uppercase text-[color:var(--color-muted)] mb-2"
        >
          Parola
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoFocus
          autoComplete="current-password"
          className="w-full border border-[color:var(--color-border)] rounded-md px-3 py-2 text-sm bg-transparent focus:outline-none focus:border-[color:var(--color-foreground)]"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        style={{ color: "var(--color-background)" }}
        className="w-full bg-[color:var(--color-foreground)] px-6 py-2.5 rounded-md text-sm font-medium disabled:opacity-50"
      >
        {pending ? "Giriş yapılıyor..." : "Giriş"}
      </button>
    </form>
  );
}
