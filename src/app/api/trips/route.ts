import { createTrip, getTripList } from "@/server/trips/trip.service";
import { createTripSchema } from "@/server/trips/trip.schema";

export async function GET() {
  try {
    const trips = await getTripList();
    return Response.json({ trips });
  } catch {
    return Response.json({ message: "获取旅行列表失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => undefined);
  const parsed = createTripSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { message: parsed.error.issues[0]?.message ?? "旅行创建参数错误" },
      { status: 400 },
    );
  }

  try {
    const trip = await createTrip(parsed.data);
    return Response.json({ trip }, { status: 201 });
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "创建旅行失败" },
      { status: 500 },
    );
  }
}
