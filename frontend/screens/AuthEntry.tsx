"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { createClient } from "@/src/infrastructure/db/client/supabase";

type AuthHashState =
  | { type: "idle" }
  | { type: "success"; message: string }
  | { type: "error"; code: string; description: string };

function decodeHashValue(value: string | null) {
  return value ? value.replace(/\+/g, " ") : "";
}

function cleanHash() {
  if (typeof window === "undefined") return;
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
}

export function AuthEntry({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthHashState>({ type: "idle" });

  useEffect(() => {
    const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
    if (!hash) return;

    const params = new URLSearchParams(hash);
    const errorCode = decodeHashValue(params.get("error_code") ?? params.get("error"));
    const errorDescription = decodeHashValue(params.get("error_description"));

    if (errorCode || errorDescription) {
      setAuthState({
        type: "error",
        code: errorCode || "auth_error",
        description: errorDescription || "The email sign-in link could not be used."
      });
      cleanHash();
      return;
    }

    if (params.has("access_token") || params.has("refresh_token")) {
      const supabase = createClient();
      void supabase.auth.getSession().then(({ data, error }) => {
        if (error || !data.session) {
          setAuthState({
            type: "error",
            code: "session_not_created",
            description: error?.message || "The sign-in link opened, but the browser session was not created."
          });
          return;
        }
        setAuthState({ type: "success", message: "Private session is ready. Continue the smoke test." });
      });
      cleanHash();
    }
  }, []);

  if (authState.type === "error") {
    const expired = authState.code === "otp_expired" || /expired/i.test(authState.description);
    return (
      <main className="auth-entry-shell">
        <section className="auth-entry-card" aria-labelledby="auth-entry-title">
          <div className="auth-entry-icon error">
            <AlertTriangle aria-hidden="true" />
          </div>
          <p className="auth-entry-kicker">Private FYF access</p>
          <h1 id="auth-entry-title">{expired ? "Invite link expired" : "Sign-in link failed"}</h1>
          <p>{authState.description}</p>
          <div className="auth-entry-actions">
            <button type="button" onClick={() => window.location.reload()}>
              <RefreshCw aria-hidden="true" />
              Check again
            </button>
          </div>
          <small>
            Ask Codex to resend a fresh Supabase invite, then open the newest email link in this same browser.
          </small>
        </section>
      </main>
    );
  }

  return (
    <>
      {authState.type === "success" && (
        <div className="auth-entry-banner" role="status">
          <CheckCircle2 aria-hidden="true" />
          {authState.message}
        </div>
      )}
      {children}
    </>
  );
}
