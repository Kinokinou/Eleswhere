import { startTripBuild } from "@/server/trip-build/trip-build.service";

type Context = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: Context) {
  const { id } = await context.params;

  try {
    const task = await startTripBuild(id);
    return Response.json({ task }, { status: 202 });
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "启动构建任务失败" },
      { status: 400 },
    );
  }
}
