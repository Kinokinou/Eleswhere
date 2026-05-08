# Eleswhere

Eleswhere is a photo-driven travel memory map. It turns local photos, GPS metadata, places, routes, and trip timelines into a personal travel archive.

> Chinese documentation: [README.zh-CN.md](./README.zh-CN.md)

## Project Status

| Module | Status | Implemented | Next |
| --- | --- | --- | --- |
| Photo import | Done | Batch import, EXIF parsing | More media formats |
| Place recognition | Done | GPS reverse geocoding | Coordinate correction |
| Trip drafts | Done | Save draft, start build | Better draft editing |
| Build tasks | Done | Batch build, retry on failure | Standalone worker |
| Trips list | Done | Status cards, delete | Edit, share, export |
| Trip detail | Done | Timeline, calendar, photo wall | AI memories |
| Route map | Done | Points, lines, point photos | Route playback |
| Image storage | Done | Local file storage | Object storage |
| Database | Done | PostgreSQL, Prisma, pgvector reserved | Vector search |
| Chat | Partial | Workspace UI | AI chat |
| AI Journal | Planned | Placeholder page | Journal generation |
| Yearly Report | Planned | Placeholder page | Annual report |
| User system | Planned | Default local user | Multi-user login |
| Deployment | Partial | Local setup docs | Docker / CI |

The Gaode Map API currently used in the project unfortunately does not allow me to perform reverse geocoding for overseas latitude and longitude. It will be optimized later!

## Preview

![Eleswhere dashboard](./images/dashboard.png)

## What is Eleswhere?

Eleswhere helps turn a folder of travel photos into a structured trip record. It reads photo timestamps and GPS metadata, resolves locations through a backend reverse-geocoding API, groups photos into days and route points, then presents the result as a travel timeline, map, and photo wall.

The project is currently an MVP. It is usable locally, but some AI and deployment features are still planned.

## Features

### Photo-driven trip creation

Import photos, read EXIF time and GPS metadata, review the generated draft, then save it before starting the backend build task.

![Create a trip draft](./images/create-trip-draft.png)

### Draft-first build flow

Large photo sets are saved as drafts first. The backend builds trips in batches, which makes long imports easier to recover from.

![Trips list](./images/trips-list.png)

### Route map and point photos

Select a trip on the map, view route points and lines, then browse photos attached to the selected point.

![Map route browser](./images/map-route-browser.png)

### Trip detail timeline

Trip details combine a timeline, calendar, grouped photo wall, and reserved AI memory blocks.

![Trip detail photo wall](./images/trip-detail-photo-wall.png)

### Chat workspace

The chat workspace is reserved for AI-assisted trip organization and travel memory workflows.

![Chat workspace](./images/chat-workspace.png)

## How It Works

```txt
Import photos
↓
Read EXIF time and GPS
↓
Call backend reverse geocoding
↓
Save trip draft
↓
Start backend build task
↓
Process photos in batches
↓
Generate trip days, segments, route points, and photo walls
```

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Prisma
- PostgreSQL
- pgvector
- AMap JavaScript API
- AMap Web Service API
- Local file uploads under `.uploads/`

## Getting Started

### 1. Install dependencies

```powershell
npm install
```

### 2. Configure environment variables

Copy the example file:

```powershell
Copy-Item .env.local.example .env.local
```

Fill in the required values:

```txt
DATABASE_URL=postgresql://[user]:[password]@localhost:5432/eleswhere
UPLOAD_DIR=
NEXT_PUBLIC_UPLOAD_BASE_URL=

NEXT_PUBLIC_AMAP_JS_KEY=
AMAP_JS_SECURITY_CODE=
AMAP_WEB_SERVICE_KEY=
NEXT_PUBLIC_AMAP_SERVICE_HOST=/_AMapService
```

### 3. Run database migrations

```powershell
npx prisma migrate dev
npx prisma db seed
```

### 4. Start the development server

```powershell
npm run dev
```

Open:

```txt
http://localhost:3000
```

## Configuration Notes

- `NEXT_PUBLIC_AMAP_JS_KEY` is used by the browser to load the AMap JavaScript API.
- `AMAP_JS_SECURITY_CODE` is used only by the server-side AMap security proxy.
- `AMAP_WEB_SERVICE_KEY` is used only by the backend reverse-geocoding API.
- `DATABASE_URL` points to the PostgreSQL database.
- `UPLOAD_DIR` stores uploaded photos locally.

## Available Scripts

```powershell
npm run dev
npm test
npm run lint
npm run build
npm run db:seed
```

## Roadmap

- Improve draft editing.
- Extract the build task runner into a standalone worker.
- Add object storage support.
- Add real AI chat, AI journal generation, and yearly reports.
- Add multi-user authentication.
- Add Docker Compose and CI setup.

## License

No license has been selected yet.
