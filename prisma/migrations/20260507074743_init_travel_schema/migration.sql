-- Enable pgvector extension before creating vector columns.
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "avatar_url" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trips" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "cover_photo_id" UUID,
    "notes" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "mood_tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "photos" (
    "id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
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
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_days" (
    "id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "day_index" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "title" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "trip_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_segments" (
    "id" UUID NOT NULL,
    "trip_day_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "place_name" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "start_time" TIMESTAMPTZ(6) NOT NULL,
    "end_time" TIMESTAMPTZ(6) NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "trip_segments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_segment_photos" (
    "trip_segment_id" UUID NOT NULL,
    "photo_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "trip_segment_photos_pkey" PRIMARY KEY ("trip_segment_id","photo_id")
);

-- CreateTable
CREATE TABLE "route_points" (
    "id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "place_name" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "date" DATE NOT NULL,
    "start_time" TIMESTAMPTZ(6) NOT NULL,
    "representative_photo_id" UUID,
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "route_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_point_photos" (
    "route_point_id" UUID NOT NULL,
    "photo_id" UUID NOT NULL,

    CONSTRAINT "route_point_photos_pkey" PRIMARY KEY ("route_point_id","photo_id")
);

-- CreateTable
CREATE TABLE "embeddings" (
    "id" UUID NOT NULL,
    "owner_type" TEXT NOT NULL,
    "owner_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(1536),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "trips_user_id_idx" ON "trips"("user_id");

-- CreateIndex
CREATE INDEX "photos_trip_id_idx" ON "photos"("trip_id");

-- CreateIndex
CREATE INDEX "trip_days_trip_id_idx" ON "trip_days"("trip_id");

-- CreateIndex
CREATE UNIQUE INDEX "trip_days_trip_id_day_index_key" ON "trip_days"("trip_id", "day_index");

-- CreateIndex
CREATE INDEX "trip_segments_trip_day_id_idx" ON "trip_segments"("trip_day_id");

-- CreateIndex
CREATE INDEX "route_points_trip_id_idx" ON "route_points"("trip_id");

-- CreateIndex
CREATE INDEX "embeddings_owner_type_owner_id_idx" ON "embeddings"("owner_type", "owner_id");

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photos" ADD CONSTRAINT "photos_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_days" ADD CONSTRAINT "trip_days_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_segments" ADD CONSTRAINT "trip_segments_trip_day_id_fkey" FOREIGN KEY ("trip_day_id") REFERENCES "trip_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_segment_photos" ADD CONSTRAINT "trip_segment_photos_trip_segment_id_fkey" FOREIGN KEY ("trip_segment_id") REFERENCES "trip_segments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_segment_photos" ADD CONSTRAINT "trip_segment_photos_photo_id_fkey" FOREIGN KEY ("photo_id") REFERENCES "photos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_points" ADD CONSTRAINT "route_points_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_points" ADD CONSTRAINT "route_points_representative_photo_id_fkey" FOREIGN KEY ("representative_photo_id") REFERENCES "photos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_point_photos" ADD CONSTRAINT "route_point_photos_route_point_id_fkey" FOREIGN KEY ("route_point_id") REFERENCES "route_points"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_point_photos" ADD CONSTRAINT "route_point_photos_photo_id_fkey" FOREIGN KEY ("photo_id") REFERENCES "photos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
