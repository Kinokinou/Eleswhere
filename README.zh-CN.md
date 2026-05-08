# Eleswhere

Eleswhere 是一个照片驱动的旅行记忆地图。它会把本地照片、GPS 元数据、地点、路线和旅行时间线整理成个人旅行档案。

英文文档：[README.md](./README.md)

## 项目进度

| 模块 | 状态 | 当前已实现 | 后续计划 |
| --- | --- | --- | --- |
| 照片导入 | 已完成 | 批量导入、EXIF 解析 | 支持更多媒体格式 |
| 地点识别 | 已完成 | GPS 逆地理编码 | 坐标与路线纠偏 |
| 旅行草稿箱 | 已完成 | 保存草稿、启动构建 | 草稿编辑增强 |
| 后台构建任务 | 已完成 | 分批构建、失败重试 | 独立 Worker |
| 旅行列表 | 已完成 | 状态卡片、删除 | 编辑、分享、导出 |
| 旅行详情 | 已完成 | 时间线、日历、照片墙 | AI 回忆生成 |
| 地图路线 | 已完成 | 路线点、连线、点位照片 | 路线播放 |
| 图片存储 | 已完成 | 本地文件存储 | 对象存储 |
| 数据库 | 已完成 | PostgreSQL、Prisma、pgvector 预留 | 向量检索 |
| Chat | 部分完成 | 工作台页面 | AI 对话 |
| AI Journal | 未开始 | 占位页面 | 游记生成 |
| Yearly Report | 未开始 | 占位页面 | 年度报告 |
| 用户系统 | 未开始 | 默认本地用户 | 多用户登录 |
| 部署 | 部分完成 | 本地运行文档 | Docker / CI |

当前项目使用的高德地图API，令人遗憾的是高德不让我执行境外经纬度的逆地理编码，后续会优化的！

## 界面预览

![Eleswhere dashboard](./images/dashboard.png)

## 项目介绍

Eleswhere 用来把一组旅行照片整理成结构化旅行记录。系统会读取照片拍摄时间和 GPS 信息，通过后端逆地理编码识别地点，再把照片组织成旅行天数、地点段落、路线点、地图路线和照片墙。

当前项目处于 MVP 阶段。本地可运行，核心旅行整理流程已经实现，AI 和部署相关能力仍在规划中。

## 功能展示

### 照片驱动的旅行创建

导入照片后，系统会读取 EXIF 时间和 GPS，生成旅行草稿。用户先保存草稿，再启动后端构建任务。

![Create a trip draft](./images/create-trip-draft.png)

### 草稿优先的构建流程

大批量照片会先保存为草稿，后端再分批构建正式旅行，降低长任务失败后丢失数据的风险。

![Trips list](./images/trips-list.png)

### 地图路线与点位照片

在地图页选择旅行后，可以查看路线点、路线连线，并浏览当前点位关联的照片。

![Map route browser](./images/map-route-browser.png)

### 旅行详情时间线

旅行详情页展示基础信息、时间线、日历、按段落组织的照片墙，以及 AI 回忆占位区域。

![Trip detail photo wall](./images/trip-detail-photo-wall.png)

### Chat 工作台

Chat 页面预留给后续 AI 辅助旅行整理和旅行记忆生成流程。

![Chat workspace](./images/chat-workspace.png)

## 工作流程

```txt
导入照片
↓
读取 EXIF 时间和 GPS
↓
调用后端逆地理编码
↓
保存旅行草稿
↓
启动后端构建任务
↓
分批处理照片
↓
生成旅行天数、地点段落、路线点和照片墙
```

## 技术栈

- Next.js App Router
- React
- TypeScript
- Prisma
- PostgreSQL
- pgvector
- 高德 JavaScript API
- 高德 Web 服务 API
- 本地 `.uploads/` 图片存储

## 本地运行

### 1. 安装依赖

```powershell
npm install
```

### 2. 配置环境变量

复制环境变量示例：

```powershell
Copy-Item .env.local.example .env.local
```

填写必要配置：

```txt
DATABASE_URL=postgresql://[user]:[password]@localhost:5432/eleswhere
UPLOAD_DIR=
NEXT_PUBLIC_UPLOAD_BASE_URL=

NEXT_PUBLIC_AMAP_JS_KEY=
AMAP_JS_SECURITY_CODE=
AMAP_WEB_SERVICE_KEY=
NEXT_PUBLIC_AMAP_SERVICE_HOST=/_AMapService
```

### 3. 执行数据库迁移

```powershell
npx prisma migrate dev
npx prisma db seed
```

### 4. 启动开发服务

```powershell
npm run dev
```

访问：

```txt
http://localhost:3000
```

## 配置说明

- `NEXT_PUBLIC_AMAP_JS_KEY`：浏览器加载高德 JavaScript API 使用。
- `AMAP_JS_SECURITY_CODE`：仅服务端高德安全代理使用。
- `AMAP_WEB_SERVICE_KEY`：仅后端逆地理编码接口使用。
- `DATABASE_URL`：PostgreSQL 数据库连接。
- `UPLOAD_DIR`：本地上传图片目录。

## 常用命令

```powershell
npm run dev
npm test
npm run lint
npm run build
npm run db:seed
```

## Roadmap

- 增强草稿编辑能力。
- 将构建任务拆成独立 Worker。
- 支持对象存储。
- 接入真实 AI Chat、AI Journal 和 Yearly Report。
- 增加多用户登录。
- 增加 Docker Compose 和 CI 配置。

## License

当前暂未选择开源协议。
