import { saveUploadedPhoto } from "@/server/uploads/upload.service";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files").filter((item): item is File => item instanceof File);
    const clientIds = formData.getAll("clientIds").map(String);

    if (files.length === 0) {
      return Response.json({ message: "请选择要上传的照片" }, { status: 400 });
    }

    const photos = await Promise.all(
      files.map((file, index) =>
        saveUploadedPhoto({
          clientId: clientIds[index] || crypto.randomUUID(),
          file,
        }),
      ),
    );

    return Response.json({ photos });
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "照片上传失败" },
      { status: 400 },
    );
  }
}
