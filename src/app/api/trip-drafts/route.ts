import {
  createTripDraft,
  getTripDraftList,
} from "@/server/trip-drafts/draft.service";
import { createTripDraftSchema } from "@/server/trip-drafts/draft.schema";

export async function GET() {
  try {
    const drafts = await getTripDraftList();
    return Response.json({ drafts });
  } catch {
    return Response.json({ message: "获取草稿箱失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => undefined);
  const parsed = createTripDraftSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { message: parsed.error.issues[0]?.message ?? "草稿参数错误" },
      { status: 400 },
    );
  }

  try {
    const draft = await createTripDraft(parsed.data);
    return Response.json({ draft }, { status: 201 });
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "创建草稿失败" },
      { status: 500 },
    );
  }
}
