"use client";

import Link from "next/link";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { apiRequest } from "../../lib/api-client";
import { STREAMS, type Challenge, type Profile, type StudentActivity, type Submission, type SubmissionSummary } from "../../lib/types";
import DashboardShell from "./DashboardShell";
import { formatDate } from "./StudentDashboard";

type ModeratorPreview = {
  students: Profile[];
  challenges: Challenge[];
  activities: StudentActivity[];
  submissions: SubmissionSummary[];
  reviewSubmissions: Submission[];
};

type NewChallenge = {
  title: string;
  track: (typeof STREAMS)[number];
  kind: "Practice" | "Assignment" | "Test";
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  instructions: string;
  starter_code: string;
};

export default function ModeratorDashboard({
  profile,
  preview,
}: {
  profile: Profile;
  preview?: ModeratorPreview;
}) {
  const [students, setStudents] = useState<Profile[]>(preview?.students ?? []);
  const [challenges, setChallenges] = useState<Challenge[]>(preview?.challenges ?? []);
  const [activities, setActivities] = useState<StudentActivity[]>(preview?.activities ?? []);
  const [submissions, setSubmissions] = useState<SubmissionSummary[]>(preview?.submissions ?? []);
  const [studentFilter, setStudentFilter] = useState("All streams");
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [loading, setLoading] = useState(!preview);
  const [saving, setSaving] = useState(false);
  const [reviewSaving, setReviewSaving] = useState(false);
  const [activeSubmission, setActiveSubmission] = useState<Submission | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [feedbackDraft, setFeedbackDraft] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<NewChallenge>({
    title: "",
    track: STREAMS[0],
    kind: "Practice",
    difficulty: "Beginner",
    instructions: "",
    starter_code: "",
  });
  const fetchDashboard = useCallback(async () => {
    if (preview) {
      return {
        students: preview.students,
        challenges: preview.challenges,
        activities: preview.activities,
        submissions: preview.submissions,
      };
    }

    return await apiRequest<{
      students: Profile[];
      challenges: Challenge[];
      activities: StudentActivity[];
      submissions: SubmissionSummary[];
    }>("/api/moderator/dashboard");
  }, [preview]);

  useEffect(() => {
    if (preview) return;

    let active = true;
    void fetchDashboard().then((result) => {
      if (!active) return;
      setStudents(result.students);
      setChallenges(result.challenges);
      setActivities(result.activities);
      setSubmissions(result.submissions);
      setLoading(false);
    }).catch((caught: unknown) => {
      if (!active) return;
      setError(caught instanceof Error ? caught.message : "Could not load institute dashboard.");
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [fetchDashboard, preview]);

  async function refreshDashboard() {
    setError("");
    try {
      const result = await fetchDashboard();
      setStudents(result.students);
      setChallenges(result.challenges);
      setActivities(result.activities);
      setSubmissions(result.submissions);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not refresh institute dashboard.");
    }
    setLoading(false);
  }

  const visibleStudents = students.filter(
    (student) => studentFilter === "All streams" || student.track === studentFilter
  );
  const nameFor = (id: string) => students.find((student) => student.id === id)?.full_name ?? "Student";
  const titleFor = (id: string) => challenges.find((challenge) => challenge.id === id)?.title ?? "Challenge";
  const pendingReviews = submissions.filter((submission) => submission.status === "submitted");

  async function publishChallenge(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (preview) {
      setNotice("This is a read-only demo. Sign in as a moderator to publish challenges.");
      return;
    }
    setSaving(true);
    setNotice("");
    setError("");
    try {
      await apiRequest("/api/moderator/challenges", {
        method: "POST",
        body: JSON.stringify(draft),
      });
    } catch (caught) {
      setSaving(false);
      setError(`Could not publish challenge: ${caught instanceof Error ? caught.message : "Request failed."}`);
      return;
    }
    setSaving(false);
    setNotice("Challenge published to its learning stream.");
    setDraft({ ...draft, title: "", instructions: "", starter_code: "" });
    await refreshDashboard();
  }

  async function markReviewed(submission: Submission) {
    if (preview) {
      setNotice("This is a read-only demo. Reviews cannot be saved.");
      return;
    }
    setReviewSaving(true);
    setError("");
    try {
      await apiRequest(`/api/moderator/submissions/${encodeURIComponent(submission.id)}`, {
        method: "PATCH",
        body: JSON.stringify({ feedback: feedbackDraft }),
      });
    } catch (caught) {
      setReviewSaving(false);
      setError(`Could not save review: ${caught instanceof Error ? caught.message : "Request failed."}`);
      return;
    }
    setReviewSaving(false);
    setNotice(`Review saved for ${nameFor(submission.user_id)}.`);
    setActiveSubmission(null);
    await refreshDashboard();
  }

  async function openReview(item: SubmissionSummary) {
    setReviewLoading(true);
    setError("");
    try {
      if (preview) {
        const reviewSubmission = preview.reviewSubmissions.find(
          (submission) => submission.id === item.id
        );
        if (!reviewSubmission) {
          throw new Error("Demo submission details are not available.");
        }
        setActiveSubmission(reviewSubmission);
        setFeedbackDraft(reviewSubmission.feedback ?? "");
        return;
      }

      const { submission: reviewSubmission } = await apiRequest<{ submission: Submission }>(
        `/api/moderator/submissions/${encodeURIComponent(item.id)}`
      );
      setActiveSubmission(reviewSubmission);
      setFeedbackDraft(reviewSubmission.feedback ?? "");
    } catch (caught) {
      setError(`Could not load the student's code: ${caught instanceof Error ? caught.message : "Request failed."}`);
    } finally {
      setReviewLoading(false);
    }
  }

  return (
    <DashboardShell profile={profile} role="moderator" preview={Boolean(preview)}>
      {preview && (
        <div className="preview-notice" role="status">
          <strong>Demo preview</strong>
          <span>Sample institute data only. Publishing and reviewing are disabled.</span>
          <Link href="/login">Go to sign in</Link>
          <Link href="/">Student preview</Link>
        </div>
      )}
      <section id="overview" className="welcome-row moderator-welcome" data-dashboard-section="overview">
        <div>
          <span className="eyebrow">MODERATOR WORKSPACE</span>
          <h1>Good morning, {profile.full_name.split(" ")[0]} <span className="wave">✦</span></h1>
          <p>Track student progress, review submitted work, and publish learning challenges.</p>
        </div>
        <div className="date-chip"><span>◉</span> {preview ? "Sample institute overview" : "Live student overview"}</div>
      </section>

      {error && <div className="notice notice-error" role="alert">{error}</div>}
      {notice && <div className="notice notice-success" role="status">{notice}</div>}

      <section className="stats-grid moderator-stats" aria-label="Institute statistics" data-dashboard-section="overview">
        <Metric label="Active students" value={loading ? "—" : String(students.length)} icon="♧" tone="violet" note="Across all streams" />
        <Metric label="Published challenges" value={loading ? "—" : String(challenges.length)} icon="⌘" tone="mint" note="Available to students" />
        <Metric label="Awaiting review" value={loading ? "—" : String(pendingReviews.length)} icon="◷" tone="amber" note="Student submissions" />
        <Metric label="Activity events" value={loading ? "—" : String(activities.length)} icon="↗" tone="blue" note="Tracked learning events" />
      </section>

      <section id="students" className="panel roster-panel" data-dashboard-section="students overview">
        <div className="panel-heading">
          <div><span className="eyebrow">YOUR LEARNING COMMUNITY</span><h2>Student progress</h2></div>
          <select className="compact-select" aria-label="Filter students by stream" value={studentFilter} onChange={(event) => setStudentFilter(event.target.value)}>
            <option>All streams</option>
            {STREAMS.map((stream) => <option key={stream}>{stream}</option>)}
          </select>
        </div>
        {loading ? <div className="empty-state">Loading student progress…</div> : visibleStudents.length === 0 ? (
          <div className="empty-state"><strong>No students in this stream yet</strong><p>New student accounts will appear here.</p></div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>STUDENT</th><th>STREAM</th><th>CHALLENGES</th><th>SUBMISSIONS</th><th>JOINED</th></tr></thead>
              <tbody>
                {visibleStudents.map((student) => {
                  const submitted = submissions.filter((item) => item.user_id === student.id);
                  const explored = new Set(activities.filter((item) => item.user_id === student.id && item.challenge_id).map((item) => item.challenge_id)).size;
                  return (
                    <tr key={student.id}>
                      <td><div className="person-cell"><div className="avatar avatar-table">{student.full_name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</div><div><strong>{student.full_name}</strong><span>{student.id.slice(0, 8)}</span></div></div></td>
                      <td><span className="stream-tag">{student.track}</span></td>
                      <td>{explored} explored</td>
                      <td><strong>{submitted.length}</strong><span className="table-muted"> · {submitted.filter((item) => item.status === "reviewed").length} reviewed</span></td>
                      <td className="table-muted">{new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(student.created_at))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="moderator-columns">
        <div id="challenges" className="panel create-panel" data-dashboard-section="challenges overview">
          <div className="panel-heading">
            <div><span className="eyebrow">CREATE LEARNING MATERIAL</span><h2>Publish a challenge</h2></div>
            <span className="create-icon">＋</span>
          </div>
          <form className="challenge-form" onSubmit={(event) => void publishChallenge(event)}>
            {preview && (
              <p className="panel-description">
                Create stream-specific practice, assignment, or test challenges.
                Published challenges become visible to students.
              </p>
            )}
            <fieldset className="challenge-fieldset" disabled={Boolean(preview)}>
            <label>Challenge title
              <input value={draft.title} maxLength={120} required onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="e.g. Build a sentiment classifier" />
            </label>
            <div className="form-grid">
              <label>Stream
                <select value={draft.track} onChange={(event) => setDraft({ ...draft, track: event.target.value as NewChallenge["track"] })}>
                  {STREAMS.map((stream) => <option key={stream}>{stream}</option>)}
                </select>
              </label>
              <label>Type
                <select value={draft.kind} onChange={(event) => setDraft({ ...draft, kind: event.target.value as NewChallenge["kind"] })}>
                  <option>Practice</option><option>Assignment</option><option>Test</option>
                </select>
              </label>
            </div>
            <label>Difficulty
              <select value={draft.difficulty} onChange={(event) => setDraft({ ...draft, difficulty: event.target.value as NewChallenge["difficulty"] })}>
                <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
              </select>
            </label>
            <label>Instructions
              <textarea rows={4} required value={draft.instructions} onChange={(event) => setDraft({ ...draft, instructions: event.target.value })} placeholder="Describe the learning objective and expected outcome." />
            </label>
            <label>Starter code <span className="field-optional">OPTIONAL</span>
              <textarea className="starter-code-input" rows={4} spellCheck={false} value={draft.starter_code} onChange={(event) => setDraft({ ...draft, starter_code: event.target.value })} placeholder="// Add code students can build on" />
            </label>
            </fieldset>
            <button className="button button-primary publish-button" disabled={saving || Boolean(preview)}>{preview ? "Preview only" : saving ? "Publishing…" : "Publish challenge"} <span aria-hidden="true">→</span></button>
          </form>
        </div>

        <div className="right-rail moderator-rail">
          <section id="reviews" className="panel review-panel" data-dashboard-section="reviews overview">
            <div className="panel-heading">
              <div><span className="eyebrow">STUDENT WORK</span><h2>Needs your review</h2></div>
              <span className="count-pill">{pendingReviews.length} pending</span>
            </div>
            {pendingReviews.length ? pendingReviews.slice(0, showAllReviews ? undefined : 5).map((submission) => (
              <article className="review-row" key={submission.id}>
                <div className="review-avatar">{nameFor(submission.user_id).split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</div>
                <div className="review-copy"><strong>{nameFor(submission.user_id)}</strong><p>{titleFor(submission.challenge_id)} · {formatDate(submission.submitted_at)}</p></div>
                <button className="text-button" disabled={reviewLoading} onClick={() => void openReview(submission)}>{reviewLoading ? "Loading…" : preview ? "View →" : "Review →"}</button>
              </article>
            )) : <div className="empty-state compact-empty">You&apos;re all caught up. New submissions will appear here.</div>}
            {pendingReviews.length > 5 && <button className="text-button list-toggle" onClick={() => setShowAllReviews(!showAllReviews)}>{showAllReviews ? "Show fewer" : `View all ${pendingReviews.length} pending reviews`}</button>}
          </section>
          <section id="activity" className="panel feed-panel" data-dashboard-section="activity overview">
            <div className="panel-heading">
              <div><span className="eyebrow">ACROSS THE INSTITUTE</span><h2>Activity feed</h2></div>
              <button className="text-button" onClick={() => setShowAllActivity(!showAllActivity)}>{showAllActivity ? "Recent" : "View all"}</button>
            </div>
            {activities.length ? activities.slice(0, showAllActivity ? undefined : 7).map((activity) => (
              <div className="feed-row" key={activity.id}>
                <span className="activity-dot" />
                <div><strong>{nameFor(activity.user_id)}</strong><p>{activityLabel(activity.event_type)}{activity.challenge_id ? ` · ${titleFor(activity.challenge_id)}` : ""}</p><time>{formatDate(activity.occurred_at)}</time></div>
              </div>
            )) : <div className="empty-state compact-empty">Student activity will appear here as learners work.</div>}
          </section>
        </div>
      </section>

      {activeSubmission && (
        <div className="review-overlay" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !reviewSaving) setActiveSubmission(null);
        }}>
          <section className="review-dialog" role="dialog" aria-modal="true" aria-labelledby="review-title">
            <div className="panel-heading">
              <div><span className="eyebrow">STUDENT SUBMISSION</span><h2 id="review-title">Review {nameFor(activeSubmission.user_id)}&apos;s work</h2></div>
              <button className="icon-button" disabled={reviewSaving} aria-label="Close review" onClick={() => setActiveSubmission(null)}>×</button>
            </div>
            <p className="review-challenge-name">{titleFor(activeSubmission.challenge_id)} · {formatDate(activeSubmission.submitted_at)}</p>
            <pre className="review-code"><code>{activeSubmission.source_code}</code></pre>
            <label className="review-feedback-label" htmlFor="review-feedback">Feedback for the student</label>
            <textarea id="review-feedback" rows={4} value={feedbackDraft} onChange={(event) => setFeedbackDraft(event.target.value)} placeholder="Share constructive feedback or next steps." disabled={Boolean(preview)} />
            <div className="review-dialog-actions">
              <button className="button button-outline" disabled={reviewSaving} onClick={() => setActiveSubmission(null)}>Cancel</button>
              <button className="button button-primary" disabled={reviewSaving || Boolean(preview)} onClick={() => void markReviewed(activeSubmission)}>{preview ? "Preview only" : reviewSaving ? "Saving review…" : "Save review"} <span aria-hidden="true">→</span></button>
            </div>
          </section>
        </div>
      )}
    </DashboardShell>
  );
}

function Metric({ label, value, icon, tone, note }: { label: string; value: string; icon: string; tone: string; note: string }) {
  return <article className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><span className="stat-label">{label}</span><strong className="stat-value">{value}</strong><span className="stat-detail">{note}</span></article>;
}

function activityLabel(type: string) {
  if (type === "challenge_opened") return "opened a challenge";
  if (type === "draft_saved") return "saved a work-in-progress";
  if (type === "solution_submitted") return "submitted a solution";
  return type.replaceAll("_", " ");
}
