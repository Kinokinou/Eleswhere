-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('BUILDING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "TripDraftStatus" AS ENUM ('DRAFT', 'BUILDING', 'BUILT');

-- CreateEnum
CREATE TYPE "TripBuildTaskStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "TripBuildBatchStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED');

-- CreateTable
CREATE TABLE "trip_drafts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "cover_client_photo_id" TEXT,
    "notes" TEXT,
    "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "mood_tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "status" "TripDraftStatus" NOT NULL DEFAULT 'DRAFT',
    "failure_message" TEXT,
    "days_json" JSONB NOT NULL,
    "route_points_json" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "trip_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_draft_photos" (
    "id" UUID NOT NULL,
    "draft_id" UUID NOT NULL,
    "client_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "storage_path" TEXT NOT NULL,
    "public_url" TEXT NOT NULL,
    "taken_at" TIMESTAMPTZ(6) NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "country" TEXT,
    "province" TEXT,
    "city" TEXT,
    "district" TEXT,
    "township" TEXT,
    "adcode" TEXT,
    "poi_name" TEXT,
    "aoi_name" TEXT,
    "place_name" TEXT,
    "formatted_address" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_draft_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_build_tasks" (
    "id" UUID NOT NULL,
    "draft_id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "status" "TripBuildTaskStatus" NOT NULL DEFAULT 'QUEUED',
    "total_photos" INTEGER NOT NULL DEFAULT 0,
    "processed_photos" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "started_at" TIMESTAMPTZ(6),
    "finished_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "trip_build_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_build_batches" (
    "id" UUID NOT NULL,
    "task_id" UUID NOT NULL,
    "batch_index" INTEGER NOT NULL,
    "status" "TripBuildBatchStatus" NOT NULL DEFAULT 'PENDING',
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "photo_ids" TEXT[],
    "error_message" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "trip_build_batches_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "trips" ADD COLUMN "draft_id" UUID,
ADD COLUMN "status" "TripStatus" NOT NULL DEFAULT 'READY';

-- AlterTable
ALTER TABLE "photos" ADD COLUMN "source_draft_photo_id" UUID;

-- CreateIndex
CREATE INDEX "trip_drafts_user_id_idx" ON "trip_drafts"("user_id");
CREATE INDEX "trip_drafts_status_idx" ON "trip_drafts"("status");
CREATE UNIQUE INDEX "trip_draft_photos_draft_id_client_id_key" ON "trip_draft_photos"("draft_id", "client_id");
CREATE INDEX "trip_draft_photos_draft_id_idx" ON "trip_draft_photos"("draft_id");
CREATE UNIQUE INDEX "trip_build_tasks_trip_id_key" ON "trip_build_tasks"("trip_id");
CREATE INDEX "trip_build_tasks_draft_id_idx" ON "trip_build_tasks"("draft_id");
CREATE INDEX "trip_build_tasks_status_idx" ON "trip_build_tasks"("status");
CREATE UNIQUE INDEX "trip_build_batches_task_id_batch_index_key" ON "trip_build_batches"("task_id", "batch_index");
CREATE INDEX "trip_build_batches_task_id_idx" ON "trip_build_batches"("task_id");
CREATE INDEX "trip_build_batches_status_idx" ON "trip_build_batches"("status");
CREATE INDEX "trips_status_idx" ON "trips"("status");
CREATE INDEX "trips_draft_id_idx" ON "trips"("draft_id");
CREATE UNIQUE INDEX "photos_source_draft_photo_id_key" ON "photos"("source_draft_photo_id");

-- AddForeignKey
ALTER TABLE "trip_drafts" ADD CONSTRAINT "trip_drafts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "trip_draft_photos" ADD CONSTRAINT "trip_draft_photos_draft_id_fkey" FOREIGN KEY ("draft_id") REFERENCES "trip_drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "trips" ADD CONSTRAINT "trips_draft_id_fkey" FOREIGN KEY ("draft_id") REFERENCES "trip_drafts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "photos" ADD CONSTRAINT "photos_source_draft_photo_id_fkey" FOREIGN KEY ("source_draft_photo_id") REFERENCES "trip_draft_photos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "trip_build_tasks" ADD CONSTRAINT "trip_build_tasks_draft_id_fkey" FOREIGN KEY ("draft_id") REFERENCES "trip_drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "trip_build_tasks" ADD CONSTRAINT "trip_build_tasks_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "trip_build_batches" ADD CONSTRAINT "trip_build_batches_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "trip_build_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
