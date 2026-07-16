import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import BrandPanel from "@/components/auth/BrandPanel";
import { inputClass, Label } from "@/components/auth/fields";
import { apiResetPassword } from "@/lib/api";

const PRIMARY =
  "w-full rounded-[12px] bg-accent-gradient py-3.5 text-[14.5px] font-extrabold text-white shadow-primary transition-all hover:-translate-y-px hover:shadow-primary-lg disabled:opacity-60";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    if (submitting) return;
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await apiResetPassword(token, password);
      setDone(true);
    } catch (e) {
      setError(e.message || "Could not reset your password.");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      <BrandPanel />
      <div className="flex flex-1 items-center justify-center overflow-y-auto px-8 py-10">
        <div className="w-full max-w-[400px] animate-fade-in">
          <div className="text-[26px] font-extrabold tracking-h1 text-ink">
            Choose a new password
          </div>
          <div className="mt-[7px] text-[14px] font-medium leading-[1.55] text-ink-2">
            {done
              ? "Your password has been reset."
              : "Enter a new password for your account."}
          </div>

          {!token && !done && (
            <div className="mt-5 rounded-[12px] border border-red-soft bg-red-soft px-3.5 py-2.5 text-[12.5px] font-medium text-red-text">
              This reset link is missing its token. Request a new link from the
              forgot-password page.
            </div>
          )}

          {done ? (
            <>
              <div className="mt-6 flex items-start gap-2.5 rounded-[14px] border border-[#c2ecd9] bg-green-soft px-4 py-4">
                <span className="text-[15px] font-extrabold text-green">✓</span>
                <div className="text-[13.5px] font-semibold leading-[1.55] text-green-text">
                  All set — sign in with your new password.
                </div>
              </div>
              <button onClick={() => navigate("/login")} className={`mt-6 ${PRIMARY}`}>
                Go to sign in
              </button>
            </>
          ) : (
            <>
              <div className="mt-7">
                <Label>New password</Label>
                <input
                  type="password"
                  className={inputClass}
                  placeholder="8+ characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="mt-4">
                <Label>Confirm password</Label>
                <input
                  type="password"
                  className={inputClass}
                  placeholder="Re-enter your password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                />
              </div>

              {error && (
                <div className="mt-4 rounded-[12px] border border-red-soft bg-red-soft px-3.5 py-2.5 text-[12.5px] font-medium text-red-text">
                  {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={submitting || !token}
                className={`mt-6 ${PRIMARY}`}
              >
                {submitting ? "Resetting…" : "Reset password"}
              </button>
            </>
          )}

          <div className="mt-5 text-center text-[13.5px] font-medium text-ink-2">
            <button onClick={() => navigate("/login")} className="font-extrabold text-accent">
              ← Back to sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
