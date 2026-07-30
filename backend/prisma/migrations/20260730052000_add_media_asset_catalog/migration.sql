CREATE TABLE "media_assets" (
  "key" VARCHAR(64) NOT NULL,
  "bucket" VARCHAR(100) NOT NULL,
  "object_path" VARCHAR(512) NOT NULL,
  "public_url" VARCHAR(1024) NOT NULL,
  "alt_text" VARCHAR(255) NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "media_assets_pkey" PRIMARY KEY ("key")
);

CREATE UNIQUE INDEX "media_assets_bucket_object_path_key"
  ON "media_assets"("bucket", "object_path");

ALTER TABLE "media_assets" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "media_assets" FROM "anon", "authenticated";

INSERT INTO "media_assets" (
  "key",
  "bucket",
  "object_path",
  "public_url",
  "alt_text"
)
VALUES
  (
    'HERO_CAR',
    'Assets-SVG',
    'site/final-car-hero.svg',
    'https://lzgmwzmyfilgwawjqejm.supabase.co/storage/v1/object/public/Assets-SVG/site/final-car-hero.svg',
    'Silver exotic performance car'
  ),
  (
    'WHITE_RR',
    'Assets-SVG',
    'vehicles/white-rr-centered.svg',
    'https://lzgmwzmyfilgwawjqejm.supabase.co/storage/v1/object/public/Assets-SVG/vehicles/white-rr-centered.svg',
    'Centered silver luxury grand tourer'
  ),
  (
    'BLUE_BUGATTI',
    'Assets-SVG',
    'vehicles/blue-bugatti-centered.svg',
    'https://lzgmwzmyfilgwawjqejm.supabase.co/storage/v1/object/public/Assets-SVG/vehicles/blue-bugatti-centered.svg',
    'Centered blue hypercar'
  ),
  (
    'GREEN_LAMBO',
    'Assets-SVG',
    'vehicles/green-lambo.svg',
    'https://lzgmwzmyfilgwawjqejm.supabase.co/storage/v1/object/public/Assets-SVG/vehicles/green-lambo.svg',
    'Green exotic supercar'
  ),
  (
    'BLACK_CAR',
    'Assets-SVG',
    'vehicles/middle-black-car-centered.svg',
    'https://lzgmwzmyfilgwawjqejm.supabase.co/storage/v1/object/public/Assets-SVG/vehicles/middle-black-car-centered.svg',
    'Centered black supercar'
  );
