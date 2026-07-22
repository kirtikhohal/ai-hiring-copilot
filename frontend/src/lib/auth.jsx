import { createContext, useContext, useEffect, useState } from "react";
import {
  apiLogin,
  apiRegister,
  apiGetMe,
  apiUpdateProfile,
  apiUploadAvatar,
  getToken,
  setToken,
} from "@/lib/api";

export const POSITIONS = [
  "HR Recruiter",
  "Hiring Manager",
  "HR Coordinator",
  "Other",
];

const AuthContext = createContext(null);

// Backend returns snake_case (UserPublic); the rest of the app uses camelCase.
function toClientUser(u) {
  return {
    id: u.id,
    fullName: u.full_name ?? "",
    username: u.username ?? "",
    email: u.email ?? "",
    position: u.position ?? "",
    org: u.org ?? "", // organization name
    orgCity: u.org_city ?? "",
    orgCountry: u.org_country ?? "",
    avatarUrl: u.avatar_url ?? null,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthed, setIsAuthed] = useState(false);
  // While true, a stored token is being validated against /me — guards wait
  // for this so a valid session isn't bounced to /register on refresh.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    apiGetMe()
      .then((u) => {
        if (cancelled) return;
        setUser(toClientUser(u));
        setIsAuthed(true);
      })
      .catch(() => {
        // token expired/invalid — clear it and fall back to signed-out
        if (!cancelled) setToken(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function login(identifier, password) {
    const { token, user: u } = await apiLogin(identifier, password);
    setToken(token);
    setUser(toClientUser(u));
    setIsAuthed(true);
  }

  // Creates the account only — no session. The caller then sends the user to
  // /login to sign in with their new credentials.
  async function register(form) {
    await apiRegister({
      full_name: form.fullName,
      username: form.username,
      email: form.email,
      position: form.position,
      org_name: form.orgName,
      org_city: form.orgCity,
      org_country: form.orgCountry,
      password: form.password,
    });
  }

  async function saveProfile(draft) {
    const updated = await apiUpdateProfile({
      full_name: draft.fullName,
      username: draft.username,
      email: draft.email,
      position: draft.position,
      org: draft.org,
      org_city: draft.orgCity,
      org_country: draft.orgCountry,
    });
    setUser(toClientUser(updated));
  }

  async function uploadAvatar(file) {
    const updated = await apiUploadAvatar(file);
    setUser(toClientUser(updated));
  }

  function logout() {
    setToken(null);
    setUser(null);
    setIsAuthed(false);
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthed,
        user,
        loading,
        login,
        register,
        saveProfile,
        uploadAvatar,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function firstNameOf(fullName) {
  return (fullName || "").trim().split(/\s+/)[0] || "there";
}
