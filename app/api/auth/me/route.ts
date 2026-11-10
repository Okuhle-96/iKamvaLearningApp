import { connection } from "next/server";
import { getCurrentProfile } from "../../../lib/server/auth";

export async function GET() {
  await connection();
  if (!process.env.DATABASE_URL) {
    return Response.json(
      { error: "Database is not configured. Copy .env.example to .env.local and set DATABASE_URL." },
      { status: 503 }
    );
  }
  try {
    const profile = await getCurrentProfile();
    if (!profile) return Response.json({ profile: null }, { status: 401 });
    return Response.json({ profile });
  } catch (error) {
    console.error("Could not load signed-in account", error);
    return Response.json(
      { error: "Cannot connect to PostgreSQL. Start the database and check DATABASE_URL in .env.local." },
      { status: 503 }
    );
  }
}
