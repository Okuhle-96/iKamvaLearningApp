export const STREAMS = [
  "AI Engineering",
  "Machine Learning",
  "Cyber Security",
  "Cloud Computing / Data Science",
  "Software Engineering",
] as const;

export type Stream = (typeof STREAMS)[number];
export type UserRole = "student" | "moderator";
export type ChallengeKind = "Practice" | "Assignment" | "Test";
export type Difficulty = "Beginner" | "Intermediate" | "Advanced";

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  track: Stream;
  role: UserRole;
  created_at: string;
};

export type Challenge = {
  id: string;
  created_by: string;
  published: boolean;
  title: string;
  track: Stream;
  kind: ChallengeKind;
  difficulty: Difficulty;
  instructions: string;
  starter_code: string;
  created_at: string;
};

export type StudentWork = {
  id: string;
  user_id: string;
  challenge_id: string;
  source_code: string;
  updated_at: string;
};

export type SubmissionSummary = {
  id: string;
  user_id: string;
  challenge_id: string;
  status: "submitted" | "reviewed";
  feedback: string | null;
  submitted_at: string;
};

export type Submission = SubmissionSummary & {
  source_code: string;
};

export type StudentActivity = {
  id: string;
  user_id: string;
  challenge_id: string | null;
  event_type: string;
  details: Record<string, unknown>;
  occurred_at: string;
};
