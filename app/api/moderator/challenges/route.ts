import { requireRole } from "../../../lib/server/auth";
import { getPool } from "../../../lib/server/db";
import { readJson } from "../../../lib/server/http";
import { STREAMS, type ChallengeKind, type Difficulty } from "../../../lib/types";

const kinds: ChallengeKind[] = ["Practice", "Assignment", "Test"];
const difficulties: Difficulty[] = ["Beginner", "Intermediate", "Advanced"];

export async function POST(request: Request) {
  const { profile, response } = await requireRole("moderator");
  if (response || !profile) return response;
  const { data, error } = await readJson(request);
  if (error || !data) return Response.json({ error }, { status: 400 });

  const { title, track, kind, difficulty, instructions, starter_code } = data;
  if (typeof title !== "string" || !title.trim() || title.trim().length > 120) {
    return Response.json({ error: "Enter a title of 1–120 characters." }, { status: 400 });
  }
  if (typeof track !== "string" || !STREAMS.includes(track as (typeof STREAMS)[number])) {
    return Response.json({ error: "Choose a valid stream." }, { status: 400 });
  }
  if (typeof kind !== "string" || !kinds.includes(kind as ChallengeKind)) {
    return Response.json({ error: "Choose a valid challenge type." }, { status: 400 });
  }
  if (typeof difficulty !== "string" || !difficulties.includes(difficulty as Difficulty)) {
    return Response.json({ error: "Choose a valid difficulty." }, { status: 400 });
  }
  if (typeof instructions !== "string" || !instructions.trim() || instructions.length > 10_000) {
    return Response.json({ error: "Enter instructions of up to 10,000 characters." }, { status: 400 });
  }
  if (typeof starter_code !== "string" || starter_code.length > 50_000) {
    return Response.json({ error: "Starter code must be under 50 KB." }, { status: 400 });
  }

  try {
    const { rows } = await getPool().query(
      `insert into challenges (created_by, title, track, kind, difficulty, instructions, starter_code, published)
       values ($1, $2, $3, $4, $5, $6, $7, true)
       returning id`,
      [profile.id, title.trim(), track, kind, difficulty, instructions.trim(), starter_code]
    );
    return Response.json({ id: rows[0].id }, { status: 201 });
  } catch (caught) {
    console.error("Could not publish moderator challenge", caught);
    return Response.json({ error: "Could not publish the challenge." }, { status: 500 });
  }
}
