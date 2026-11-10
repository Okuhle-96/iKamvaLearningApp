import { requireRole } from "../../../lib/server/auth";
import { getPool } from "../../../lib/server/db";
import { jsonError } from "../../../lib/server/http";

export async function GET() {
  const { profile, response } = await requireRole("student");
  if (response || !profile) return response;

  try {
    const pool = getPool();
    const [challenges, work, submissions, activities] = await Promise.all([
      pool.query(
        `select id, created_by, published, title, track, kind, difficulty,
                instructions, starter_code, created_at
         from challenges
         where published = true and track = $1
         order by created_at desc, id desc`,
        [profile.track]
      ),
      pool.query(
        `select id, user_id, challenge_id, source_code, updated_at
         from student_work where user_id = $1`,
        [profile.id]
      ),
      pool.query(
        `select id, user_id, challenge_id, status, feedback, submitted_at
         from submissions where user_id = $1
         order by submitted_at desc, id desc`,
        [profile.id]
      ),
      pool.query(
        `select id, user_id, challenge_id, event_type, details, occurred_at
         from activities where user_id = $1
         order by occurred_at desc, id desc
         limit 10`,
        [profile.id]
      ),
    ]);
    return Response.json({
      challenges: challenges.rows,
      work: work.rows,
      submissions: submissions.rows,
      activities: activities.rows,
    });
  } catch (error) {
    console.error("Could not load student dashboard", error);
    return jsonError(error, "Could not load your learning dashboard.");
  }
}
