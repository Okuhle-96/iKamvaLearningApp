import "server-only";

export function jsonError(_error: unknown, fallback: string) {
  return Response.json({ error: fallback }, { status: 500 });
}

export async function readJson(request: Request) {
  try {
    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return { data: null, error: "Request body must be a JSON object." };
    }
    return { data: body as Record<string, unknown>, error: null };
  } catch {
    return { data: null, error: "Request body must be valid JSON." };
  }
}
