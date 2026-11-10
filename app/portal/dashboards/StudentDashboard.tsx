"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../../lib/api-client";
import type {
  Challenge,
  Profile,
  StudentActivity,
  StudentWork,
  SubmissionSummary,
} from "../../lib/types";
import DashboardShell from "./DashboardShell";

type StudentPreview = {
  activities: StudentActivity[];
  challenges: Challenge[];
  work: StudentWork[];
  submissions: SubmissionSummary[];
};

type StudentDashboardProps = {
  profile: Profile;
  preview?: StudentPreview;
};

export default function StudentDashboard({
  profile,
  preview,
}: StudentDashboardProps) {
  const [challenges, setChallenges] = useState<Challenge[]>(
    preview?.challenges ?? []
  );
  const [work, setWork] = useState<StudentWork[]>(preview?.work ?? []);
  const [submissions, setSubmissions] = useState<SubmissionSummary[]>(
    preview?.submissions ?? []
  );
  const [activities, setActivities] = useState<StudentActivity[]>(
    preview?.activities ?? []
  );
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [sourceCode, setSourceCode] = useState("");
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(!preview);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fetchWorkspace = useCallback(async () => {
    if (preview) {
      return {
        challenges: preview.challenges,
        work: preview.work,
        submissions: preview.submissions,
        activities: preview.activities,
      };
    }

    return await apiRequest<{
      challenges: Challenge[];
      work: StudentWork[];
      submissions: SubmissionSummary[];
      activities: StudentActivity[];
    }>("/api/student/dashboard");
  }, [preview]);

  useEffect(() => {
    if (preview) return;

    let active = true;
    void fetchWorkspace().then((result) => {
      if (!active) return;
      setChallenges(result.challenges);
      setWork(result.work);
      setSubmissions(result.submissions);
      setActivities(result.activities);
      setLoading(false);
    }).catch((caught: unknown) => {
      if (!active) return;
      setError(caught instanceof Error ? caught.message : "Could not load your workspace.");
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [fetchWorkspace, preview]);

  async function refreshWorkspace() {
    setError("");
    try {
      const result = await fetchWorkspace();
      setChallenges(result.challenges);
      setWork(result.work);
      setSubmissions(result.submissions);
      setActivities(result.activities);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not refresh your workspace.");
    }
    setLoading(false);
  }

  const filteredChallenges = challenges.filter((challenge) => {
    const matchesTrack = filter === "All" || challenge.track === filter;
    const query = search.trim().toLowerCase();
    return (
      matchesTrack &&
      (!query ||
        `${challenge.title} ${challenge.instructions}`
          .toLowerCase()
          .includes(query))
    );
  });
  const completedChallengeIds = new Set(
    submissions.map((submission) => submission.challenge_id)
  );

  async function openChallenge(challenge: Challenge) {
    setActiveChallenge(challenge);
    const savedWork = work.find((item) => item.challenge_id === challenge.id);
    setSourceCode(savedWork?.source_code ?? challenge.starter_code);
    setMessage("");
    try {
      if (preview) return;
      await apiRequest("/api/student/activity", {
        method: "POST",
        body: JSON.stringify({ challenge_id: challenge.id, event_type: "challenge_opened" }),
      });
      await refreshWorkspace();
    } catch (caught) {
      setError(
        `Challenge opened, but activity could not be tracked: ${
          caught instanceof Error ? caught.message : "Request failed."
        }`
      );
    }
  }

  async function saveDraft() {
    if (!activeChallenge) return;
    if (preview) {
      setMessage("This is a read-only preview. Sign in to save your work.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      await apiRequest("/api/student/work", {
        method: "PUT",
        body: JSON.stringify({ challenge_id: activeChallenge.id, source_code: sourceCode }),
      });
    } catch (caught) {
      setSaving(false);
      setError(`Could not save your work: ${caught instanceof Error ? caught.message : "Request failed."}`);
      return;
    }
    setSaving(false);
    setError("");
    setMessage("Draft saved to your account.");
    await refreshWorkspace();
  }

  async function submitSolution() {
    if (preview) {
      setMessage("This is a read-only preview. Sign in to submit your work.");
      return;
    }
    if (!activeChallenge || !sourceCode.trim()) {
      setError("Add your solution before submitting.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await apiRequest("/api/student/submissions", {
        method: "POST",
        body: JSON.stringify({ challenge_id: activeChallenge.id, source_code: sourceCode }),
      });
    } catch (caught) {
      setSaving(false);
      setError(`Could not submit your solution: ${caught instanceof Error ? caught.message : "Request failed."}`);
      return;
    }
    setSaving(false);
    setMessage("Solution submitted. Your moderator can now review it.");
    await refreshWorkspace();
  }

  const latestSubmission = submissions[0];

  return (
    <DashboardShell profile={profile} role="student" preview={Boolean(preview)}>
      {preview && (
        <div className="preview-notice" role="status">
          <strong>Demo preview</strong>
          <span>Sample student data only. Work cannot be saved or submitted.</span>
          <a href="/login">Go to sign in</a>
        </div>
      )}
      <section id="overview" className="welcome-row" data-dashboard-section="overview">
        <div>
          <span className="eyebrow">STUDENT WORKSPACE</span>
          <h1>Good to see you, {profile.full_name.split(" ")[0]} <span className="wave">✦</span></h1>
          <p>Every line of code is a step forward. Here&apos;s your learning journey.</p>
        </div>
        <div className="date-chip"><span>◷</span> Keep your momentum going</div>
      </section>

      {error && <div className="notice notice-error" role="alert">{error}</div>}
      {message && <div className="notice notice-success" role="status">{message}</div>}

      <section className="stats-grid" aria-label="Your learning statistics" data-dashboard-section="overview">
        <StatCard label="Available challenges" value={loading ? "—" : String(challenges.length)} icon="⌘" tone="violet" detail="In your learning stream" />
        <StatCard label="Submitted work" value={loading ? "—" : String(submissions.length)} icon="↗" tone="mint" detail="Assignments & practice" />
        <StatCard label="Challenges explored" value={loading ? "—" : String(new Set(work.map((item) => item.challenge_id)).size)} icon="◷" tone="amber" detail="Saved to your workspace" />
        <StatCard label="Latest submission" value={latestSubmission ? latestSubmission.status : "—"} icon="✓" tone="blue" detail={latestSubmission ? formatDate(latestSubmission.submitted_at) : "Your next step starts here"} />
      </section>

      <section className="learning-layout">
        <div id="learning" className="panel challenges-panel" data-dashboard-section="learning overview">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">PICK UP A CHALLENGE</span>
              <h2>My learning</h2>
              <p className="panel-description">
                Explore challenges for {profile.track}. Open one to read the
                instructions, work through it, and save a draft or submit it
                for feedback.
              </p>
            </div>
            <span className="count-pill">{challenges.length} available</span>
          </div>
          <div className="challenge-controls">
            <label className="search-field">
              <span aria-hidden="true">⌕</span>
              <input
                aria-label="Search challenges"
                placeholder="Search challenges..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <select aria-label="Filter challenges by stream" value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option>All</option>
              {[...new Set(challenges.map((challenge) => challenge.track))].map((track) => (
                <option key={track}>{track}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="empty-state">Loading your learning path…</div>
          ) : filteredChallenges.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">✦</span>
              <strong>{challenges.length ? "No matches found" : "Your first challenge is on its way"}</strong>
              <p>{challenges.length ? "Try a different search or stream." : "Published challenges for your stream will appear here."}</p>
            </div>
          ) : (
            <div className="challenge-list">
              {filteredChallenges.map((challenge) => (
                <article className="challenge-row" key={challenge.id}>
                  <div className={`challenge-type type-${challenge.kind.toLowerCase()}`}>
                    {challenge.kind === "Practice" ? "⌘" : challenge.kind === "Test" ? "◷" : "▤"}
                  </div>
                  <div className="challenge-info">
                    <div className="challenge-meta">
                      <span>{challenge.kind}</span><i>·</i><span>{challenge.track}</span>
                    </div>
                    <h3>{challenge.title}</h3>
                    <p>{challenge.instructions}</p>
                    <div className="challenge-tags">
                      <span>{challenge.difficulty}</span>
                      {completedChallengeIds.has(challenge.id) && <span className="completed-tag">Submitted ✓</span>}
                    </div>
                  </div>
                  <button className="button button-outline" onClick={() => void openChallenge(challenge)}>
                    Open <span aria-hidden="true">→</span>
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>

        <aside className="right-rail">
          <section className="panel stream-panel" data-dashboard-section="overview">
            <div className="panel-heading">
              <div><span className="eyebrow">YOUR FOCUS</span><h2>My stream</h2></div>
              <span className="stream-spark">✦</span>
            </div>
            <div className="focus-card">
              <span className="focus-label">CURRENT STREAM</span>
              <h3>{profile.track}</h3>
              <p>Build your skills with hands-on work and a clear path forward.</p>
            </div>
            <div className="focus-footer"><span className="online-dot" /> {preview ? "Sample progress for preview only" : "Progress is saved to your account"}</div>
          </section>

          <section id="activity" className="panel activity-panel" data-dashboard-section="activity overview">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">YOUR LEARNING JOURNEY</span>
                <h2>My activity</h2>
                <p className="panel-description">
                  A timeline of challenges you open, drafts you save, and
                  solutions you submit.
                </p>
              </div>
              <span className="activity-clock">◷</span>
            </div>
            {activities.length ? (
              <div className="student-activity-list">
                {activities.slice(0, 5).map((activity) => (
                  <article className="student-activity-row" key={activity.id}>
                    <span className="activity-dot" />
                    <div>
                      <strong>{activityLabel(activity.event_type)}</strong>
                      <p>
                        {activity.challenge_id
                          ? challenges.find(
                              (item) => item.id === activity.challenge_id
                            )?.title ?? "Challenge"
                          : "Learning workspace"}
                      </p>
                      <time dateTime={activity.occurred_at}>
                        {formatDate(activity.occurred_at)}
                      </time>
                    </div>
                  </article>
                ))}
                {activities.length > 5 && (
                  <p className="activity-more">
                    Showing your 5 most recent activities.
                  </p>
                )}
              </div>
            ) : loading ? (
              <div className="empty-state">Loading your activity…</div>
            ) : (
              <div className="mini-activity empty-activity">
                <span className="activity-dot" />
                <div>
                  <strong>Your journey starts here</strong>
                  <p>
                    Open a challenge to begin building your learning history.
                  </p>
                </div>
              </div>
            )}
          </section>
        </aside>
      </section>

      {activeChallenge && (
        <section className="workspace-panel" aria-labelledby="workspace-title" data-dashboard-section="learning">
          <div className="workspace-header">
            <div>
              <span className="eyebrow">{activeChallenge.kind} WORKSPACE · {activeChallenge.difficulty}</span>
              <h2 id="workspace-title">{activeChallenge.title}</h2>
              <p>{activeChallenge.instructions}</p>
            </div>
            <button className="icon-button" aria-label="Close challenge workspace" onClick={() => setActiveChallenge(null)}>×</button>
          </div>
          <label htmlFor="student-code" className="editor-label">YOUR SOLUTION <span>Saved work stays private to your account</span></label>
          <textarea
            id="student-code"
            className="code-editor"
            value={sourceCode}
            onChange={(event) => setSourceCode(event.target.value)}
            rows={14}
            spellCheck={false}
            placeholder="// Start writing your solution here..."
          />
          <div className="workspace-actions">
            <span className="editor-note">Code execution is not enabled yet. You can save drafts and submit work for review.</span>
            <div>
              <button className="button button-outline" disabled={saving || Boolean(preview)} onClick={() => void saveDraft()}>
                {preview ? "Preview only" : saving ? "Saving…" : "Save draft"}
              </button>
              <button className="button button-primary" disabled={saving || Boolean(preview)} onClick={() => void submitSolution()}>
                {preview ? "Preview only" : saving ? "Submitting…" : "Submit work"} <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </section>
      )}
    </DashboardShell>
  );
}

function StatCard({
  label,
  value,
  icon,
  tone,
  detail,
}: {
  label: string;
  value: string;
  icon: string;
  tone: string;
  detail: string;
}) {
  return (
    <article className="stat-card">
      <div className={`stat-icon ${tone}`}>{icon}</div>
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      <span className="stat-detail">{detail}</span>
    </article>
  );
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function activityLabel(type: string) {
  if (type === "challenge_opened") return "Challenge opened";
  if (type === "draft_saved") return "Draft saved";
  if (type === "solution_submitted") return "Solution submitted";
  return type.replaceAll("_", " ");
}
