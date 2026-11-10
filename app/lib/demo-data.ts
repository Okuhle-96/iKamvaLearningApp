import type {
  Challenge,
  Profile,
  Submission,
  StudentActivity,
  StudentWork,
  SubmissionSummary,
} from "./types";

const demoStudentId = "demo-student";
const demoChallengeId = "demo-challenge-python-basics";
const demoSubmissionChallengeId = "demo-challenge-data-cleaning";
const demoSoftwareChallengeId = "demo-challenge-software-api";
const demoMachineLearningChallengeId = "demo-challenge-ml-features";
const demoCyberSecurityChallengeId = "demo-challenge-security-audit";

export const demoProfile: Profile = {
  id: demoStudentId,
  full_name: "Amara Ndlovu",
  email: "amara@example.test",
  track: "AI Engineering",
  role: "student",
  created_at: "2026-10-15T08:00:00.000Z",
};

export const demoModeratorProfile: Profile = {
  id: "demo-moderator",
  full_name: "Lerato Mokoena",
  email: "lerato@example.test",
  track: "AI Engineering",
  role: "moderator",
  created_at: "2026-08-01T08:00:00.000Z",
};

export const demoStudents: Profile[] = [
  demoProfile,
  {
    id: "demo-student-thabo",
    full_name: "Thabo Khumalo",
    email: "thabo@example.test",
    track: "Software Engineering",
    role: "student",
    created_at: "2026-09-10T08:00:00.000Z",
  },
  {
    id: "demo-student-zanele",
    full_name: "Zanele Dlamini",
    email: "zanele@example.test",
    track: "Machine Learning",
    role: "student",
    created_at: "2026-09-22T08:00:00.000Z",
  },
  {
    id: "demo-student-sipho",
    full_name: "Sipho Nkosi",
    email: "sipho@example.test",
    track: "Cyber Security",
    role: "student",
    created_at: "2026-10-02T08:00:00.000Z",
  },
];

export const demoChallenges: Challenge[] = [
  {
    id: demoChallengeId,
    created_by: "demo-moderator",
    published: true,
    title: "Build a Python study planner",
    track: "AI Engineering",
    kind: "Practice",
    difficulty: "Beginner",
    instructions:
      "Create a small program that organises study tasks by subject and estimates the time needed to complete each one.",
    starter_code: 'study_tasks = []\n\n# Add your study planner here\n',
    created_at: "2026-11-08T09:00:00.000Z",
  },
  {
    id: demoSubmissionChallengeId,
    created_by: "demo-moderator",
    published: true,
    title: "Explore a learner progress dataset",
    track: "AI Engineering",
    kind: "Assignment",
    difficulty: "Intermediate",
    instructions:
      "Inspect a small learner-progress dataset, identify useful patterns, and explain one way the findings could improve a learning experience.",
    starter_code: "import pandas as pd\n\n# Load and explore the dataset\n",
    created_at: "2026-11-06T09:00:00.000Z",
  },
  {
    id: "demo-challenge-prompt-design",
    created_by: "demo-moderator",
    published: true,
    title: "Compare prompt instructions",
    track: "AI Engineering",
    kind: "Test",
    difficulty: "Intermediate",
    instructions:
      "Compare two prompt styles and describe how clearer constraints change the usefulness of an AI-generated response.",
    starter_code: "",
    created_at: "2026-11-03T09:00:00.000Z",
  },
  {
    id: demoSoftwareChallengeId,
    created_by: "demo-moderator",
    published: true,
    title: "Design a student progress API",
    track: "Software Engineering",
    kind: "Assignment",
    difficulty: "Intermediate",
    instructions:
      "Sketch a small REST API for tracking assignment progress. Define an endpoint, its input, and the response a student should receive.",
    starter_code: "GET /api/students/:id/progress\n",
    created_at: "2026-11-07T09:00:00.000Z",
  },
  {
    id: demoMachineLearningChallengeId,
    created_by: "demo-moderator",
    published: true,
    title: "Choose useful model features",
    track: "Machine Learning",
    kind: "Practice",
    difficulty: "Beginner",
    instructions:
      "Choose useful features for a simple learner-progress model and explain how you would avoid including personal or irrelevant data.",
    starter_code: "features = []\n",
    created_at: "2026-11-05T09:00:00.000Z",
  },
  {
    id: demoCyberSecurityChallengeId,
    created_by: "demo-moderator",
    published: true,
    title: "Review a sign-in flow",
    track: "Cyber Security",
    kind: "Practice",
    difficulty: "Intermediate",
    instructions:
      "Review a fictional sign-in flow and list practical checks that help protect accounts and sessions.",
    starter_code: "# Add your review checklist\n",
    created_at: "2026-11-04T09:00:00.000Z",
  },
];

export const demoWork: StudentWork[] = [
  {
    id: "demo-work-python-basics",
    user_id: demoStudentId,
    challenge_id: demoChallengeId,
    source_code: 'study_tasks = []\n\n# Sort tasks by available study time\n',
    updated_at: "2026-11-09T15:40:00.000Z",
  },
];

export const demoSubmissions: SubmissionSummary[] = [
  {
    id: "demo-submission-pending",
    user_id: "demo-student-thabo",
    challenge_id: demoSoftwareChallengeId,
    status: "submitted",
    feedback: null,
    submitted_at: "2026-11-10T08:30:00.000Z",
  },
  {
    id: "demo-submission-data-cleaning",
    user_id: demoStudentId,
    challenge_id: demoSubmissionChallengeId,
    status: "reviewed",
    feedback: "Clear observations. Next, try visualising one of your findings.",
    submitted_at: "2026-11-09T13:20:00.000Z",
  },
];

export const demoActivities: StudentActivity[] = [
  {
    id: "demo-activity-thabo-submission",
    user_id: "demo-student-thabo",
    challenge_id: demoSoftwareChallengeId,
    event_type: "solution_submitted",
    details: {},
    occurred_at: "2026-11-10T08:30:00.000Z",
  },
  {
    id: "demo-activity-zanele-draft",
    user_id: "demo-student-zanele",
    challenge_id: demoMachineLearningChallengeId,
    event_type: "draft_saved",
    details: {},
    occurred_at: "2026-11-10T07:45:00.000Z",
  },
  {
    id: "demo-activity-sipho-opened",
    user_id: "demo-student-sipho",
    challenge_id: demoCyberSecurityChallengeId,
    event_type: "challenge_opened",
    details: {},
    occurred_at: "2026-11-10T07:10:00.000Z",
  },
  {
    id: "demo-activity-submission",
    user_id: demoStudentId,
    challenge_id: demoSubmissionChallengeId,
    event_type: "solution_submitted",
    details: {},
    occurred_at: "2026-11-09T13:20:00.000Z",
  },
  {
    id: "demo-activity-draft",
    user_id: demoStudentId,
    challenge_id: demoChallengeId,
    event_type: "draft_saved",
    details: {},
    occurred_at: "2026-11-09T11:40:00.000Z",
  },
  {
    id: "demo-activity-opened",
    user_id: demoStudentId,
    challenge_id: demoChallengeId,
    event_type: "challenge_opened",
    details: {},
    occurred_at: "2026-11-09T10:15:00.000Z",
  },
];

export const demoReviewSubmissions: Submission[] = [
  {
    id: "demo-submission-pending",
    user_id: "demo-student-thabo",
    challenge_id: demoSoftwareChallengeId,
    status: "submitted",
    feedback: null,
    submitted_at: "2026-11-10T08:30:00.000Z",
    source_code:
      "GET /api/students/:id/progress\n\nResponse: { studentId, completedAssignments, currentTrack }\n",
  },
  {
    id: "demo-submission-data-cleaning",
    user_id: demoStudentId,
    challenge_id: demoSubmissionChallengeId,
    status: "reviewed",
    feedback: "Clear observations. Next, try visualising one of your findings.",
    submitted_at: "2026-11-09T13:20:00.000Z",
    source_code:
      'progress = {"Python": 0.8, "Data": 0.6}\n\nfor topic, completion in progress.items():\n    print(topic, completion)\n',
  },
];
