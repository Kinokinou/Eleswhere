import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const databaseUrl = "postgresql://root:lch20201710.@localhost:5432/eleswhere";
const uploadDir = path.join(process.cwd(), ".test-uploads");

describe("旅行后端完整链路", () => {
  beforeAll(async () => {
    vi.stubEnv("DATABASE_URL", databaseUrl);
    vi.stubEnv("UPLOAD_DIR", uploadDir);
    vi.stubEnv("NEXT_PUBLIC_UPLOAD_BASE_URL", "/uploads");
    await mkdir(uploadDir, { recursive: true });
  });

  beforeEach(async () => {
    const { prisma } = await import("@/server/db/prisma");
    await prisma.trip.deleteMany();
    await prisma.user.upsert({
      where: { email: "local@eleswhere.dev" },
      update: { name: "本地用户" },
      create: { name: "本地用户", email: "local@eleswhere.dev" },
    });
  });

  afterAll(async () => {
    const { prisma } = await import("@/server/db/prisma");
    await prisma.trip.deleteMany();
    await prisma.$disconnect();
    vi.unstubAllEnvs();
    await rm(uploadDir, { recursive: true, force: true });
  });

  it("上传照片、创建旅行、读取详情、删除旅行", async () => {
    const { POST: uploadPost } = await import("@/app/api/uploads/photos/route");
    const { POST: tripsPost, GET: tripsGet } = await import("@/app/api/trips/route");
    const detailRoute = await import("@/app/api/trips/[id]/route");

    const uploadForm = new FormData();
    uploadForm.append("clientIds", "photo-client");
    uploadForm.append(
      "files",
      new File([new Uint8Array([1, 2, 3])], "IMG_001.jpg", {
        type: "image/jpeg",
      }),
    );

    const uploadResponse = await uploadPost(
      new Request("http://localhost/api/uploads/photos", {
        method: "POST",
        body: uploadForm,
      }),
    );
    const uploadBody = await uploadResponse.json();
    expect(uploadResponse.status).toBe(200);
    expect(uploadBody.photos[0]).toMatchObject({
      clientId: "photo-client",
      mimeType: "image/jpeg",
    });

    const createResponse = await tripsPost(
      new Request("http://localhost/api/trips", {
        method: "POST",
        body: JSON.stringify({
          title: "测试旅行",
          startDate: "2026-05-03",
          endDate: "2026-05-03",
          coverClientPhotoId: "photo-client",
          tags: [],
          moodTags: [],
          photos: [
            {
              ...uploadBody.photos[0],
              takenAt: "2026-05-03T10:00:00.000Z",
              placeName: "珠海长隆",
            },
          ],
          days: [
            {
              clientId: "day-client",
              dayIndex: 1,
              date: "2026-05-03",
              title: "第 1 天",
              photoIds: ["photo-client"],
              segments: [
                {
                  clientId: "segment-client",
                  title: "珠海长隆",
                  placeName: "珠海长隆",
                  startTime: "2026-05-03T10:00:00.000Z",
                  endTime: "2026-05-03T11:00:00.000Z",
                  photoIds: ["photo-client"],
                },
              ],
            },
          ],
          routePoints: [
            {
              clientId: "route-client",
              placeName: "珠海长隆",
              date: "2026-05-03",
              startTime: "2026-05-03T10:00:00.000Z",
              representativePhotoId: "photo-client",
              photoIds: ["photo-client"],
              order: 1,
            },
          ],
        }),
      }),
    );
    const createBody = await createResponse.json();
    expect(createResponse.status).toBe(201);
    expect(createBody.trip.days[0].segments[0].placeName).toBe("珠海长隆");

    const listResponse = await tripsGet();
    const listBody = await listResponse.json();
    expect(listBody.trips).toHaveLength(1);

    const tripId = createBody.trip.id;
    const detailResponse = await detailRoute.GET(
      new Request(`http://localhost/api/trips/${tripId}`),
      { params: Promise.resolve({ id: tripId }) },
    );
    const detailBody = await detailResponse.json();
    expect(detailResponse.status).toBe(200);
    expect(detailBody.trip.routePoints[0].placeName).toBe("珠海长隆");

    const deleteResponse = await detailRoute.DELETE(
      new Request(`http://localhost/api/trips/${tripId}`),
      { params: Promise.resolve({ id: tripId }) },
    );
    expect(deleteResponse.status).toBe(200);

    const emptyListResponse = await tripsGet();
    const emptyListBody = await emptyListResponse.json();
    expect(emptyListBody.trips).toHaveLength(0);
  });
});
