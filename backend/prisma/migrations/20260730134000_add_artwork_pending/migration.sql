ALTER TYPE "VehicleImageKey" ADD VALUE IF NOT EXISTS 'ARTWORK_PENDING';

INSERT INTO "media_assets" (
  "key",
  "bucket",
  "object_path",
  "public_url",
  "alt_text"
)
VALUES (
  'ARTWORK_PENDING',
  'Assets-SVG',
  'vehicles/default-image.svg',
  'https://lzgmwzmyfilgwawjqejm.supabase.co/storage/v1/object/public/Assets-SVG/vehicles/default-image.svg',
  'Vehicle image coming soon'
)
ON CONFLICT ("key") DO UPDATE SET
  "bucket" = EXCLUDED."bucket",
  "object_path" = EXCLUDED."object_path",
  "public_url" = EXCLUDED."public_url",
  "alt_text" = EXCLUDED."alt_text",
  "updated_at" = CURRENT_TIMESTAMP;
