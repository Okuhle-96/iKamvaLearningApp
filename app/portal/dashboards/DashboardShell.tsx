"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiRequest } from "../../lib/api-client";
import type { Profile, UserRole } from "../../lib/types";
import Brand from "../../components/Brand";

type DashboardShellProps = {
  profile: Profile;
  role: UserRole;
  preview?: boolean;
  children: React.ReactNode;
};

const studentLinks = [
  { label: "Overview", section: "overview", icon: "◫" },
  { label: "My learning", section: "learning", icon: "⌘" },
  { label: "My activity", section: "activity", icon: "◷" },
];

const moderatorLinks = [
  { label: "Overview", section: "overview", icon: "◫" },
  { label: "Students", section: "students", icon: "♧" },
  { label: "Challenges", section: "challenges", icon: "⌘" },
  { label: "Reviews", section: "reviews", icon: "✓" },
  { label: "Activity feed", section: "activity", icon: "◷" },
];

export default function DashboardShell({
  profile,
  role,
  preview = false,
  children,
}: DashboardShellProps) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");
  const links = role === "moderator" ? moderatorLinks : studentLinks;
  const activeSectionLabel =
    links.find((link) => link.section === activeSection)?.label ?? "Overview";
  const initials = profile.full_name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function signOut() {
    setSigningOut(true);
    try {
      await apiRequest("/api/auth/signout", { method: "POST" });
      router.replace("/");
    } catch (error) {
      setSigningOut(false);
      window.alert(
        `Could not sign out: ${
          error instanceof Error ? error.message : "Request failed."
        }`
      );
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand className="sidebar-brand" />
        <div className="workspace-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Dashboard navigation">
          {links.map(({ label, section, icon }) => (
            <button
              key={section}
              type="button"
              className={`side-link ${activeSection === section ? "side-link-active" : ""}`}
              aria-current={activeSection === section ? "page" : undefined}
              onClick={() => setActiveSection(section)}
            >
              <span className="side-icon" aria-hidden="true">{icon}</span>
              {label}
              {section === "activity" && role === "moderator" && (
                <span className="nav-count">LIVE</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="stream-card">
            <span className="stream-card-icon" aria-hidden="true">✦</span>
            <div>
              <span className="stream-caption">YOUR STREAM</span>
              <p>{role === "moderator" ? "All streams" : profile.track}</p>
            </div>
          </div>
          <div className="sidebar-user">
            <div className="avatar">{initials || "TF"}</div>
            <div className="sidebar-user-text">
              <strong>{profile.full_name}</strong>
              <span>{role === "moderator" ? "Moderator" : "Student"}</span>
            </div>
            {preview ? (
              <a className="signout-button preview-login-link" href="/login" aria-label="Go to sign in" title="Go to sign in">
                ↗
              </a>
            ) : (
              <button
                type="button"
                className="signout-button"
                onClick={signOut}
                disabled={signingOut}
                aria-label="Sign out"
                title="Sign out"
              >
                {signingOut ? "…" : "↗"}
              </button>
            )}
          </div>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div className="breadcrumb">
            Academy <span>/</span>{" "}
            {role === "moderator" ? "Moderator" : "My workspace"}
            <span>/</span> {activeSectionLabel}
          </div>
          <div className="topbar-right">
            {preview && <span className="preview-badge">DEMO</span>}
            <span className="live-status"><span /> Workspace active</span>
            <div className="avatar avatar-small">{initials || "TF"}</div>
          </div>
        </header>
        <main className="dashboard-content" data-active-section={activeSection}>
          {children}
        </main>
      </div>
    </div>
  );
}
