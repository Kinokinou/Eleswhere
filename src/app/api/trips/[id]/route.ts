import { z } from "zod";
import {
  editTrip,
  getTripDetail,
  removeTrip,
} from "@/server/trips/trip.service";
import { updateTripSchema } from "@/server/trips/trip.schema";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const tripIdSchema = z.string().uuid("旅行 ID 格式错误");

export async function GET(_request: Request, context: RouteContext) {
  const id = await parseTripId(context);
  if (!id.success) {
    return id.response;
  }

  const trip = await getTripDetail(id.value);
  if (!trip) {
    return Response.json({ message: "旅行不存在" }, { status: 404 });
  }

  return Response.json({ trip });
}

export async function PUT(request: Request, context: RouteContext) {
  const id = await parseTripId(context);
  if (!id.success) {
    return id.response;
  }

  const body = await request.json().catch(() => undefined);
  const parsed = updateTripSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { message: parsed.error.issues[0]?.message ?? "旅行更新参数错误" },
      { status: 400 },
    );
  }

  const trip = await editTrip(id.value, parsed.data);
  if (!trip) {
    return Response.json({ message: "旅行不存在" }, { status: 404 });
  }

  return Response.json({ trip });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const id = await parseTripId(context);
  if (!id.success) {
    return id.response;
  }

  try {
    return Response.json(await removeTrip(id.value));
  } catch {
    return Response.json({ message: "旅行不存在" }, { status: 404 });
  }
}

async function parseTripId(context: RouteContext) {
  const { id } = await context.params;
  const parsed = tripIdSchema.safeParse(id);

  if (!parsed.success) {
    return {
      success: false as const,
      response: Response.json({ message: "旅行 ID 格式错误" }, { status: 400 }),
    };
  }

  return {
    success: true as const,
    value: parsed.data,
  };
}
