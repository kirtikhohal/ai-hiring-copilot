import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { ROUTES, CRUMB_LABEL } from "@/lib/routes";
import { useAuth } from "@/lib/auth";
import { assetUrl } from "@/lib/api";
import SearchModal from "@/components/shell/SearchModal";

export default function Topbar({ screen }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const finalCrumb = CRUMB_LABEL[screen] ?? "Dashboard";
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const menuRef = useRef(null);

  // Close the avatar menu on outside click / Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  // ⌘K / Ctrl+K opens search.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const initials =
    (user?.fullName || "")
      .trim()
      .split(/\s+/)
      .map((w) => w[0] || "")
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  function go(to) {
    setMenuOpen(false);
    navigate(to);
  }
  function signOut() {
    setMenuOpen(false);
    logout();
    navigate(ROUTES.login);
  }

  return (
    <header
      className="sticky top-0 z-10 flex items-center gap-4 border-b border-border px-7 py-3 backdrop-blur-[12px]"
      style={{ background: "rgba(255,255,255,.82)" }}
    >
      {/* Breadcrumb */}
      <div className="flex shrink-0 items-center gap-2 text-[13px] font-semibold tracking-tight2">
        <button
          onClick={() => navigate(ROUTES.dashboard)}
          className="cursor-pointer text-ink-muted transition-colors hover:text-accent"
        >
          {user.org || "Workspace"}
        </button>
        <span className="text-ink-faint-2">/</span>
        <span className="font-bold text-ink">{finalCrumb}</span>
      </div>

      {/* Search command bar */}
      <div className="mx-auto hidden w-full max-w-[440px] sm:block">
        <button
          onClick={() => setSearchOpen(true)}
          className="group flex w-full items-center gap-2.5 rounded-input border border-transparent bg-[#f2f3f9] px-3.5 py-2 text-left transition-colors hover:border-accent-border hover:bg-white"
        >
          <Search size={14} strokeWidth={2.4} className="shrink-0 text-ink-muted" />
          <span className="flex-1 text-[13px] font-medium text-ink-faint">
            Search candidates, job openings, clients…
          </span>
          <span className="rounded-[5px] border border-border-strong bg-white px-1.5 py-0.5 text-[10.5px] font-bold text-ink-muted">
            ⌘K
          </span>
        </button>
      </div>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Right cluster */}
      <div className="relative ml-auto flex shrink-0 items-center gap-3" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          title="Account"
          className="flex h-[34px] w-[34px] items-center justify-center overflow-hidden rounded-full bg-accent-gradient text-[12px] font-extrabold text-white shadow-[0_2px_8px_rgba(99,102,241,.3)] transition-transform hover:-translate-y-px"
        >
          {user.avatarUrl ? (
            <img
              src={assetUrl(user.avatarUrl)}
              alt=""
              className="h-full w-full object-cover"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          ) : (
            initials
          )}
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-[44px] z-30 w-[220px] animate-scale-in rounded-[14px] border border-border-strong bg-surface p-1.5 shadow-menu">
            <div className="mb-1 border-b border-hairline px-3 pb-2 pt-2">
              <div className="truncate text-[13.5px] font-extrabold tracking-tight2 text-ink">
                {user.fullName}
              </div>
              <div className="truncate text-[12px] font-medium text-ink-muted">
                {user.email}
              </div>
            </div>
            <button
              onClick={() => go(ROUTES.profile)}
              className="flex w-full items-center rounded-[9px] px-3 py-2 text-left text-[13.5px] font-semibold text-ink transition-colors hover:bg-hairline-2"
            >
              View profile
            </button>
            <button
              onClick={() => go(ROUTES.contact)}
              className="flex w-full items-center rounded-[9px] px-3 py-2 text-left text-[13.5px] font-semibold text-ink transition-colors hover:bg-hairline-2"
            >
              Contact us
            </button>
            <button
              onClick={signOut}
              className="flex w-full items-center rounded-[9px] px-3 py-2 text-left text-[13.5px] font-bold text-red-text transition-colors hover:bg-red-soft"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
