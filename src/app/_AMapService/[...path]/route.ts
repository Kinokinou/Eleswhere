import { appendJscode } from "@/lib/amap";

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const jscode = process.env.AMAP_JS_SECURITY_CODE;
  if (!jscode) {
    return Response.json(
      { message: "缺少 AMAP_JS_SECURITY_CODE，无法代理高德 JS API 请求" },
      { status: 500 },
    );
  }

  const { path } = await context.params;
  const requestUrl = new URL(request.url);
  const upstreamBase = getAmapUpstream(path);
  const upstreamUrl = new URL(`${upstreamBase}/${path.join("/")}`);

  requestUrl.searchParams.forEach((value, key) => {
    upstreamUrl.searchParams.set(key, value);
  });

  // 关键逻辑：服务端代理层追加 jscode，浏览器端只知道 serviceHost。
  const response = await fetch(appendJscode(upstreamUrl.toString(), jscode), {
    method: "GET",
    headers: {
      accept: request.headers.get("accept") ?? "*/*",
    },
  });

  return new Response(response.body, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") ?? "application/json",
    },
  });
}

function getAmapUpstream(path: string[]): string {
  const joinedPath = path.join("/");
  if (joinedPath.startsWith("v4/map/styles")) {
    return "https://webapi.amap.com";
  }

  return "https://restapi.amap.com";
}
