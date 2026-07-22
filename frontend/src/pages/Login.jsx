import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import BrandPanel from "@/components/auth/BrandPanel";

const LABEL = "text-[12.5px] font-bold text-ink-2 mb-[7px]";
const FIELD =
  "w-full rounded-[12px] border-[1.5px] border-border-strong bg-white px-[14px] py-3 text-[14px] font-medium text-ink transition-shadow placeholder:text-ink-faint";
const PRIMARY =
  "w-full rounded-[12px] bg-accent-gradient py-3.5 text-[14.5px] font-extrabold text-white shadow-primary transition-all hover:-translate-y-px hover:shadow-primary-lg disabled:opacity-60";

export default function Login() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { login } = useAuth();
  const toast = useToast();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await login(identifier, password);
      toast.success("Signed in", "Welcome back to Hazel.");
      navigate("/");
    } catch (e) {
      const msg = e.message || "Could not sign in.";
      setError(msg);
      toast.error("Sign in failed", msg);
      setSubmitting(false);
    }
  }
  function onKeyDown(e) {
    if (e.key === "Enter") handleSubmit();
  }

  return (
    <div className="flex min-h-screen">
      <BrandPanel />
      <div className="flex flex-1 items-center justify-center overflow-y-auto px-8 py-10">
        <div className="w-full max-w-[400px] animate-fade-in">
          <div className="text-[26px] font-extrabold tracking-h1 text-ink">
            Welcome back
          </div>
          <div className="mt-[7px] text-[14px] font-medium text-ink-2">
            Sign in to Hazel, your hiring copilot.
          </div>

          {state?.registered && (
            <div className="mt-5 rounded-[12px] border border-[#c2ecd9] bg-green-soft px-3.5 py-2.5 text-[12.5px] font-semibold text-green-text">
              Account created — sign in to continue.
            </div>
          )}

          <div className="mt-7">
            <div className={LABEL}>Email or username</div>
            <input
              className={FIELD}
              placeholder="dana@company.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              onKeyDown={onKeyDown}
            />
          </div>
          <div className="mt-4">
            <div className="mb-[7px] flex items-center justify-between">
              <div className="text-[12.5px] font-bold text-ink-2">Password</div>
              <button
                onClick={() => navigate("/forgot-password")}
                className="text-[12.5px] font-bold text-accent"
              >
                Forgot password?
              </button>
            </div>
            <input
              type="password"
              className={FIELD}
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={onKeyDown}
            />
          </div>

          {error && (
            <div className="mt-4 rounded-[12px] border border-red-soft bg-red-soft px-3.5 py-2.5 text-[12.5px] font-medium text-red-text">
              {error}
            </div>
          )}

          <button onClick={handleSubmit} disabled={submitting} className={`mt-6 ${PRIMARY}`}>
            {submitting ? "Signing in…" : "Sign in"}
          </button>
          <div className="mt-5 text-center text-[13.5px] font-medium text-ink-2">
            New to Hazel?{" "}
            <button onClick={() => navigate("/register")} className="font-extrabold text-accent">
              Create account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
