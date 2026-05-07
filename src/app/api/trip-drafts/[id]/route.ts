import {
  editTripDraft,
  getTripDraftDetail,
  removeTripDraft,
} from "@/server/trip-drafts/draft.service";
import { updateTripDraftSchema } from "@/server/trip-drafts/draft.schema";

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: Context) {
  const { id } = await context.params;
  const draft = await getTripDraftDetail(id);

  if (!draft) {
    return Response.json({ message: "草稿不存在" }, { status: 404 });
  }

  return Response.json({ draft });
}

export async function PUT(request: Request, context: Context) {
  const { id } = await context.params;
  const body = await request.json().catch(() => undefined);
  const parsed = updateTripDraftSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { message: parsed.error.issues[0]?.message ?? "草稿参数错误" },
      { status: 400 },
    );
  }

  try {
    const draft = await editTripDraft(id, parsed.data);
    return Response.json({ draft });
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "更新草稿失败" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: Context) {
  const { id } = await context.params;

  try {
    return Response.json(await removeTripDraft(id));
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "删除草稿失败" },
      { status: 500 },
    );
  }
}
