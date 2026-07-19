import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Home,
  MessageSquare,
  FileText,
  Files,
  Users,
  Sparkles,
  Mail,
  FileCheck,
  Briefcase,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES, getProjectNav } from "@/lib/routes";
import { getJD, assetUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth";

// lucide icon per nav key
const NAV_ICONS = {
  dashboard: Home,
  clients: Briefcase,
  internal: Building2,
  contact: MessageSquare,
  jd: FileText,
  resumes: Files,
  ranked: Users,
  prep: Sparkles,
  email: Mail,
  summary: FileCheck,
};

function GroupHeader({ children }) {
  return (
    <div className="mb-1.5 px-[10px] text-[10.5px] font-extrabold uppercase tracking-[.13em] text-ink-2">
      {children}
    </div>
  );
}

function NavItem({ to, end, iconKey, label, collapsed, forceActive }) {
  const Icon = NAV_ICONS[iconKey] ?? Home;
  return (
    <NavLink
      to={to}
      end={end}
      title={label}
      className={({ isActive }) =>
        cn(
          "group mb-0.5 flex items-center gap-[11px] rounded-[10px] px-[10px] py-[9px] transition-colors",
          collapsed && "justify-center px-0",
          isActive || forceActive
            ? "bg-[rgba(99,102,241,.16)]"
            : "hover:bg-[rgba(255,255,255,.06)]"
        )
      }
    >
      {({ isActive }) => {
        const active = isActive || forceActive;
        return (
          <>
            <Icon
              size={18}
              strokeWidth={2.1}
              className={cn(
                "shrink-0",
                active ? "text-sidebar-icon-active" : "text-sidebar-muted"
              )}
            />
            {!collapsed && (
              <span
                className={cn(
                  "whitespace-nowrap text-[13.5px] tracking-tight2",
                  active
                    ? "font-extrabold text-white"
                    : "font-semibold text-sidebar-text"
                )}
              >
                {label}
              </span>
            )}
          </>
        );
      }}
    </NavLink>
  );
}

export default function Sidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { jdId } = useParams();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("hazel_sb_collapsed") === "1"
  );
  const [roleTitle, setRoleTitle] = useState();
  // Interview-prep / Emails nav links fall back to the candidates list (no
  // top-candidate lookup here — that full ranking fetch on every project page
  // was a big latency hit).
  const topCandidateId = null;

  function toggle() {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem("hazel_sb_collapsed", next ? "1" : "0");
      return next;
    });
  }

  // Just the project title (one light GET, no LLM, no ranking).
  useEffect(() => {
    if (!jdId) {
      setRoleTitle(undefined);
      return;
    }
    let cancelled = false;
    getJD(jdId)
      .then((r) => {
        if (!cancelled) setRoleTitle(r.parsed?.role_title);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [jdId]);

  const onCandidateDetail = /^\/project\/[^/]+\/candidates\/[^/]+$/.test(pathname);
  const onPrep = /\/prep$/.test(pathname);
  const onEmail = /\/email$/.test(pathname);

  const userInitials =
    (user?.fullName || "")
      .trim()
      .split(/\s+/)
      .map((w) => w[0] || "")
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  return (
    <aside
      className={cn(
        "sticky top-0 z-20 flex h-screen shrink-0 flex-col bg-sidebar py-5 transition-[width] duration-200",
        collapsed ? "w-[72px] px-3" : "w-[242px] px-3.5"
      )}
    >
      {/* Collapse toggle */}
      <button
        onClick={toggle}
        title="Collapse / expand sidebar"
        className="absolute -right-3 top-[30px] z-[21] flex h-6 w-6 items-center justify-center rounded-full border border-border-strong bg-white text-[12px] font-extrabold leading-none text-ink-2 shadow-[0_2px_8px_rgba(20,22,31,.2)] transition-colors hover:text-accent"
      >
        {collapsed ? (
          <ChevronRight size={13} strokeWidth={2.6} />
        ) : (
          <ChevronLeft size={13} strokeWidth={2.6} />
        )}
      </button>

      {/* Brand → dashboard */}
      <button
        onClick={() => navigate(ROUTES.dashboard)}
        className={cn(
          "mb-5 flex items-center gap-[11px] px-2 pt-0.5",
          collapsed && "justify-center px-0"
        )}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-accent-gradient shadow-[0_6px_18px_rgba(99,102,241,.4)]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 4 2.5 8.3 12 12.6l7.6-3.44V15.2h1.9V8.3L12 4Z" fill="#fff" />
            <path
              d="M6.6 11.9v3.3c0 1.5 2.4 2.9 5.4 2.9s5.4-1.4 5.4-2.9v-3.3L12 14.35 6.6 11.9Z"
              fill="#fff"
              opacity=".85"
            />
          </svg>
        </div>
        {!collapsed && (
          <div className="leading-[1.15] text-left">
            <div className="text-[15px] font-extrabold tracking-tight2 text-white">
              Hazel
            </div>
            <div className="text-[11px] font-semibold text-sidebar-muted">
              Hiring Copilot
            </div>
          </div>
        )}
      </button>

      {/* Workspace */}
      {!collapsed && <GroupHeader>Workspace</GroupHeader>}
      <nav className="mb-4 flex flex-col">
        <NavItem to={ROUTES.dashboard} end iconKey="dashboard" label="Dashboard" collapsed={collapsed} />
        <NavItem to={ROUTES.clients} iconKey="clients" label="Clients" collapsed={collapsed} />
        <NavItem to={ROUTES.internal} iconKey="internal" label="Internal" collapsed={collapsed} />
        <NavItem to={ROUTES.contact} iconKey="contact" label="Contact us" collapsed={collapsed} />
      </nav>

      {/* Current project */}
      {jdId && (
        <>
          {!collapsed && <GroupHeader>Current project</GroupHeader>}
          {!collapsed && roleTitle && (
            <div className="mb-2 line-clamp-2 px-[10px] text-[12.5px] font-bold leading-[1.45] text-sidebar-text">
              {roleTitle}
            </div>
          )}
          <nav className="flex flex-col">
            {getProjectNav(jdId, topCandidateId).map((item) => (
              <NavItem
                key={item.key}
                to={item.to}
                iconKey={item.key}
                label={item.label}
                collapsed={collapsed}
                forceActive={
                  (item.key === "ranked" && onCandidateDetail) ||
                  (item.key === "prep" && onPrep) ||
                  (item.key === "email" && onEmail)
                }
              />
            ))}
          </nav>
        </>
      )}

      {/* User footer → profile */}
      <button
        onClick={() => navigate(ROUTES.profile)}
        title="Profile"
        className={cn(
          "mt-auto flex items-center gap-[11px] border-t border-[rgba(255,255,255,.08)] pt-3",
          collapsed ? "justify-center" : "px-2"
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent-gradient text-[12px] font-extrabold text-white">
          {user.avatarUrl ? (
            <img
              src={assetUrl(user.avatarUrl)}
              alt=""
              className="h-full w-full object-cover"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          ) : (
            userInitials
          )}
        </div>
        {!collapsed && (
          <div className="min-w-0 text-left leading-[1.2]">
            <div className="truncate text-[13px] font-bold tracking-tight2 text-white">
              {user.fullName}
            </div>
            <div className="truncate text-[11px] font-semibold text-sidebar-muted">
              {user.position}
            </div>
          </div>
        )}
      </button>
    </aside>
  );
}
