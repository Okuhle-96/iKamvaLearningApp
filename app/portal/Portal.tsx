"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { apiRequest } from "../lib/api-client";
import { STREAMS, type Profile, type UserRole } from "../lib/types";
import Brand, { BrandMark } from "../components/Brand";
import ModeratorDashboard from "./dashboards/ModeratorDashboard";
import StudentDashboard from "./dashboards/StudentDashboard";

type PortalProps = {
  dashboard: UserRole;
};

export default function Portal({ dashboard }: PortalProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    let active = true;
    void apiRequest<{ profile: Profile }>("/api/auth/me")
      .then(({ profile: currentProfile }) => {
        if (!active) return;
        setProfile(currentProfile);
        if (currentProfile.role !== dashboard) {
          router.replace(currentProfile.role === "moderator" ? "/moderator" : "/");
        }
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof Error && !error.message.includes("Sign in required")) {
          setProfileError(error.message);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [dashboard, router]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (
    profileError.includes("DATABASE_URL") ||
    profileError.includes("Cannot connect to PostgreSQL")
  ) {
    return <SetupRequired />;
  }

  if (!profile) {
    return <AuthScreen accountError={profileError} onAuthenticated={setProfile} />;
  }

  if (profile.role !== dashboard) {
    return <LoadingScreen label="Opening your workspace…" />;
  }

  return dashboard === "moderator" ? (
    <ModeratorDashboard profile={profile} />
  ) : (
    <StudentDashboard profile={profile} />
  );
}

function AuthScreen({
  accountError,
  onAuthenticated,
}: {
  accountError: string;
  onAuthenticated: (profile: Profile) => void;
}) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [track, setTrack] = useState<(typeof STREAMS)[number]>(STREAMS[0]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);

    try {
      await apiRequest(mode === "signup" ? "/api/auth/signup" : "/api/auth/signin", {
        method: "POST",
        body: JSON.stringify(
          mode === "signup"
            ? { full_name: name, email, password, track }
            : { email, password }
        ),
      });
      const { profile } = await apiRequest<{ profile: Profile }>("/api/auth/me");
      onAuthenticated(profile);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "We couldn't complete sign in. Please try again."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-aside">
        <Brand className="brand-light" />
        <div className="auth-hero">
          <span className="eyebrow eyebrow-light">BUILD YOUR NEXT CHAPTER</span>
          <Image
            src="/ikamva-logo.png"
            alt="iKamva Coding Institute emblem"
            width={768}
            height={768}
            className="auth-logo"
            sizes="(max-width: 850px) 200px, 280px"
          />
          <h1>Turn curiosity into code.</h1>
          <p>
            iKamva Coding Institute is a hands-on place to learn, practice, and
            grow into the engineer you want to be.
          </p>
          <div className="track-pills" aria-label="Available streams">
            {STREAMS.map((stream) => (
              <span key={stream}>{stream}</span>
            ))}
          </div>
        </div>
        <div className="aside-note">
          <span className="online-dot" /> A learning community built around doing.
        </div>
      </section>

      <section className="auth-main">
        <div className="auth-box">
          <div className="auth-mobile-brand">
            <Brand />
          </div>
          <div className="auth-heading">
            <span className="eyebrow">YOUR WORKSPACE AWAITS</span>
            <h2>{mode === "signin" ? "Welcome back" : "Start learning"}</h2>
            <p>
              {mode === "signin"
                ? "Sign in to pick up where you left off."
                : "Create your student account and choose a stream."}
            </p>
          </div>

          <div className="auth-tabs" role="tablist" aria-label="Account options">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "signin"}
              className={mode === "signin" ? "active" : ""}
              onClick={() => {
                setMode("signin");
                setError("");
                setMessage("");
              }}
            >
              Sign in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "signup"}
              className={mode === "signup" ? "active" : ""}
              onClick={() => {
                setMode("signup");
                setError("");
                setMessage("");
              }}
            >
              Create account
            </button>
          </div>

          <form className="auth-form" onSubmit={submit}>
            {accountError && (
              <p className="form-message form-error" role="alert">
                {accountError}
              </p>
            )}
            {mode === "signup" && (
              <>
                <label>
                  Full name
                  <input
                    autoComplete="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Your name"
                    minLength={2}
                    required
                  />
                </label>
                <label>
                  Choose your stream
                  <select
                    value={track}
                    onChange={(event) =>
                      setTrack(event.target.value as (typeof STREAMS)[number])
                    }
                  >
                    {STREAMS.map((stream) => (
                      <option key={stream}>{stream}</option>
                    ))}
                  </select>
                </label>
              </>
            )}
            <label>
              Email address
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                minLength={8}
                required
              />
            </label>
            {error && <p className="form-message form-error" role="alert">{error}</p>}
            {message && <p className="form-message form-success" role="status">{message}</p>}
            <button className="button button-primary auth-submit" disabled={busy}>
              {busy
                ? "Please wait…"
                : mode === "signin"
                  ? "Sign in to your account"
                  : "Create student account"}
              {!busy && <span aria-hidden="true">→</span>}
            </button>
          </form>

          <p className="auth-security">
            Student accounts can only view their own progress. Moderator access
            is assigned separately.
          </p>
        </div>
        <footer className="auth-footer">© 2026 iKamva Coding Institute</footer>
      </section>
    </main>
  );
}

function SetupRequired() {
  return (
    <main className="portal-message">
      <div className="setup-card">
        <Brand />
        <span className="eyebrow setup-eyebrow">ONE-TIME SETUP</span>
        <h1>Connect your PostgreSQL database</h1>
        <p>
          The app cannot connect because <code>DATABASE_URL</code> is missing
          or the database setup is not complete. For Windows setup:
        </p>
        <div className="setup-code">
          <code>Copy-Item .env.example .env.local</code>
          <code>npm run dev</code>
        </div>
        <p className="setup-hint">
          In pgAdmin, create a login role and database using the local credentials
          in <code>.env.example</code>, then run <code>database/schema.sql</code>
          against that database. See <code>README.md</code> for exact steps.
        </p>
      </div>
    </main>
  );
}

function LoadingScreen({ label = "Getting your workspace ready…" }: { label?: string }) {
  return (
    <main className="portal-message">
      <div className="loading-brand">
        <BrandMark />
        <p>{label}</p>
      </div>
    </main>
  );
}
