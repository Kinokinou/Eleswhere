# Eleswhere
Elsewhere 是一本关于“在别处经过”的旅行手账。

## 本地运行

```powershell
npm install
npm run dev
```

默认访问：

```txt
http://localhost:3000
```

## 高德配置

复制 `.env.local.example` 为 `.env.local`，再填入高德 Key：

```txt
NEXT_PUBLIC_AMAP_JS_KEY=
AMAP_JS_SECURITY_CODE=
AMAP_WEB_SERVICE_KEY=
NEXT_PUBLIC_AMAP_SERVICE_HOST=/_AMapService
```

说明：

- `NEXT_PUBLIC_AMAP_JS_KEY` 用于前端加载高德 JS API。
- `AMAP_JS_SECURITY_CODE` 只在后端代理里使用，不暴露给浏览器。
- `AMAP_WEB_SERVICE_KEY` 只在后端逆地理编码接口里使用。
