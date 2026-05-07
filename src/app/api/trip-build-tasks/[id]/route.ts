import { getTripBuildTask } from "@/server/trip-build/trip-build.service";

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: Context) {
  const { id } = await context.params;
  const task = await getTripBuildTask(id);

  if (!task) {
    return Response.json({ message: "构建任务不存在" }, { status: 404 });
  }

  return Response.json({ task });
}
