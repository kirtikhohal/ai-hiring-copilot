import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BrandPanel from "@/components/auth/BrandPanel";
import { inputClass, Label } from "@/components/auth/fields";
import { apiForgotPassword } from "@/lib/api";

const PRIMARY =
  "w-full rounded-[12px] bg-accent-gradient py-3.5 text-[14.5px] font-extrabold text-white shadow-primary transition-all hover:-translate-y-px hover:shadow-primary-lg disabled:opacity-60";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSend() {
    if (submitting) return;
    setSubmitting(true);
    try {
      await apiForgotPassword(email);
    } catch {
      // POC endpoint always succeeds; ignore transport errors and still
      // show the confirmation (never reveals whether the account exists).
    }
    setSent(true);
    setSubmitting(false);
  }

  return (
    <div className="flex min-h-screen">
      <BrandPanel />
      <div className="flex flex-1 items-center justify-center overflow-y-auto px-8 py-10">
        <div className="w-full max-w-[400px] animate-fade-in">
          <div className="text-[26px] font-extrabold tracking-h1 text-ink">
            Reset your password
          </div>
          <div className="mt-[7px] text-[14px] font-medium leading-[1.55] text-ink-2">
            Enter your account email and we&rsquo;ll send you a reset link.
          </div>

          {!sent ? (
            <>
              <div className="mt-7">
                <Label>Email</Label>
                <input
                  type="email"
                  className={inputClass}
                  placeholder="dana@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <button onClick={handleSend} disabled={submitting} className={`mt-6 ${PRIMARY}`}>
                {submitting ? "Sending…" : "Send reset link"}
              </button>
            </>
          ) : (
            <div className="mt-7 flex items-start gap-2.5 rounded-[14px] border border-[#c2ecd9] bg-green-soft px-4 py-4">
              <span className="text-[15px] font-extrabold text-green">✓</span>
              <div className="text-[13.5px] font-semibold leading-[1.55] text-green-text">
                Reset link sent. Check your inbox — the link expires in 30 minutes.
              </div>
            </div>
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
