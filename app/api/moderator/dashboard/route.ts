import { requireRole } from "../../../lib/server/auth";
import { getPool } from "../../../lib/server/db";
import { jsonError } from "../../../lib/server/http";

export async function GET() {
  const { profile, response } = await requireRole("moderator");
  if (response || !profile) return response;

  try {
    const pool = getPool();
    const [students, challenges, activities, submissions] = await Promise.all([
      pool.query(
        `select id, full_name, email, track, role, created_at
         from users where role = 'student' order by created_at desc, id desc`
      ),
      pool.query(
        `select id, created_by, published, title, track, kind, difficulty,
                instructions, starter_code, created_at
         from challenges order by created_at desc, id desc`
      ),
      pool.query(
        `select id, user_id, challenge_id, event_type, details, occurred_at
         from activities order by occurred_at desc, id desc`
      ),
      pool.query(
        `select id, user_id, challenge_id, status, feedback, submitted_at
         from submissions order by submitted_at desc, id desc`
      ),
    ]);
    return Response.json({
      students: students.rows,
      challenges: challenges.rows,
      activities: activities.rows,
      submissions: submissions.rows,
    });
  } catch (error) {
    console.error("Could not load moderator dashboard", error);
    return jsonError(error, "Could not load the institute dashboard.");
  }
}
