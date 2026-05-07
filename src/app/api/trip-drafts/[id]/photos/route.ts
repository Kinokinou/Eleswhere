import {
  draftPhotoMetaSchema,
  type DraftPhotoMetaInput,
} from "@/server/trip-drafts/draft.schema";
import { uploadDraftPhotos } from "@/server/trip-drafts/draft.service";

type Context = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: Context) {
  const { id } = await context.params;

  try {
    const formData = await request.formData();
    const files = formData.getAll("files").filter((item): item is File => item instanceof File);
    const clientIds = formData.getAll("clientIds").map(String);
    const metadata = parseMetadata(formData.getAll("metadata").map(String));

    if (files.length === 0) {
      return Response.json({ message: "请选择要上传的草稿照片" }, { status: 400 });
    }

    const draft = await uploadDraftPhotos({
      draftId: id,
      files,
      clientIds,
      metadata,
    });
    return Response.json({ draft });
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "上传草稿照片失败" },
      { status: 400 },
    );
  }
}

function parseMetadata(values: string[]): DraftPhotoMetaInput[] {
  return values.map((value) => {
    const parsed = draftPhotoMetaSchema.safeParse(JSON.parse(value));
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message ?? "照片元数据错误");
    }
    return parsed.data;
  });
}
