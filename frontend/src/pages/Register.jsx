import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, POSITIONS } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import BrandPanel from "@/components/auth/BrandPanel";
import { inputClass, Label } from "@/components/auth/fields";
import { COUNTRIES, citiesOf } from "@/data/locations";

const PRIMARY =
  "w-full rounded-[12px] bg-accent-gradient py-3.5 text-[14.5px] font-extrabold text-white shadow-primary transition-all hover:-translate-y-px hover:shadow-primary-lg disabled:opacity-60";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    position: "HR Recruiter",
    orgName: "",
    orgCity: "",
    orgCountry: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  // Changing country resets the dependent city selection.
  const onCountry = (e) =>
    setForm((f) => ({ ...f, orgCountry: e.target.value, orgCity: "" }));

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await register(form); // creates the account only (no session)
      toast.success("Account created", "Sign in with your new credentials.");
      navigate("/login", { state: { registered: true } });
    } catch (e) {
      const msg = e.message || "Could not create your account.";
      setError(msg);
      toast.error("Registration failed", msg);
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      <BrandPanel />
      <div className="flex flex-1 items-center justify-center overflow-y-auto px-8 py-10">
        <div className="w-full max-w-[460px] animate-fade-in">
          <div className="text-[26px] font-extrabold tracking-h1 text-ink">
            Create your account
          </div>
          <div className="mt-[7px] text-[14px] font-medium text-ink-2">
            For HR recruiters and hiring managers.
          </div>

          <div className="mt-7">
            <Label>Full name</Label>
            <input
              className={inputClass}
              placeholder="Dana Whitfield"
              value={form.fullName}
              onChange={set("fullName")}
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3.5 max-[520px]:grid-cols-1">
            <div>
              <Label>Username</Label>
              <input
                className={inputClass}
                placeholder="dana.w"
                value={form.username}
                onChange={set("username")}
              />
            </div>
            <div>
              <Label>Work email</Label>
              <input
                type="email"
                className={inputClass}
                placeholder="dana@company.com"
                value={form.email}
                onChange={set("email")}
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3.5 max-[520px]:grid-cols-1">
            <div>
              <Label>Position</Label>
              <select className={inputClass} value={form.position} onChange={set("position")}>
                {POSITIONS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Password</Label>
              <input
                type="password"
                className={inputClass}
                placeholder="8+ characters"
                value={form.password}
                onChange={set("password")}
              />
            </div>
          </div>

          <div className="mt-4">
            <Label>Organization name</Label>
            <input
              className={inputClass}
              placeholder="Northwind"
              value={form.orgName}
              onChange={set("orgName")}
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3.5 max-[520px]:grid-cols-1">
            <div>
              <Label>Organization country</Label>
              <select className={inputClass} value={form.orgCountry} onChange={onCountry}>
                <option value="">Select country</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Organization city</Label>
              <select
                className={`${inputClass} disabled:cursor-not-allowed disabled:text-ink-faint`}
                value={form.orgCity}
                onChange={set("orgCity")}
                disabled={!form.orgCountry}
              >
                <option value="">
                  {form.orgCountry ? "Select city" : "Select country first"}
                </option>
                {citiesOf(form.orgCountry).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-[12px] border border-red-soft bg-red-soft px-3.5 py-2.5 text-[12.5px] font-medium text-red-text">
              {error}
            </div>
          )}

          <button onClick={handleSubmit} disabled={submitting} className={`mt-6 ${PRIMARY}`}>
            {submitting ? "Creating account…" : "Create account"}
          </button>
          <div className="mt-5 text-center text-[13.5px] font-medium text-ink-2">
            Already have an account?{" "}
            <button onClick={() => navigate("/login")} className="font-extrabold text-accent">
              Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
