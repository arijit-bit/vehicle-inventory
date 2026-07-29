DO $$
BEGIN
  CREATE TYPE "VehicleImageKey" AS ENUM ('WHITE_RR', 'BLUE_BUGATTI', 'GREEN_LAMBO', 'BLACK_CAR');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE TYPE "Transmission" AS ENUM ('MANUAL', 'AUTOMATIC');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE TYPE "FuelType" AS ENUM ('PETROL', 'DIESEL', 'HYBRID', 'ELECTRIC');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

ALTER TABLE "vehicles"
  ADD COLUMN IF NOT EXISTS "year" INTEGER NOT NULL DEFAULT 2026,
  ADD COLUMN IF NOT EXISTS "image_key" "VehicleImageKey" NOT NULL DEFAULT 'BLACK_CAR',
  ADD COLUMN IF NOT EXISTS "color_name" VARCHAR(100) NOT NULL DEFAULT 'Obsidian Black',
  ADD COLUMN IF NOT EXISTS "color_hex" CHAR(7) NOT NULL DEFAULT '#333336',
  ADD COLUMN IF NOT EXISTS "engine" VARCHAR(160) NOT NULL DEFAULT 'Specification pending',
  ADD COLUMN IF NOT EXISTS "transmission" "Transmission" NOT NULL DEFAULT 'AUTOMATIC',
  ADD COLUMN IF NOT EXISTS "fuel_type" "FuelType" NOT NULL DEFAULT 'PETROL',
  ADD COLUMN IF NOT EXISTS "details" TEXT NOT NULL DEFAULT 'Curated vehicle specification.';

ALTER TABLE "vehicles"
  ALTER COLUMN "year" DROP DEFAULT,
  ALTER COLUMN "image_key" DROP DEFAULT,
  ALTER COLUMN "color_name" DROP DEFAULT,
  ALTER COLUMN "color_hex" DROP DEFAULT,
  ALTER COLUMN "engine" DROP DEFAULT,
  ALTER COLUMN "transmission" DROP DEFAULT,
  ALTER COLUMN "fuel_type" DROP DEFAULT,
  ALTER COLUMN "details" DROP DEFAULT;

CREATE UNIQUE INDEX IF NOT EXISTS "vehicles_make_model_year_key"
  ON "vehicles"("make", "model", "year");

INSERT INTO "vehicles" (
  "id",
  "make",
  "model",
  "year",
  "category",
  "image_key",
  "color_name",
  "color_hex",
  "engine",
  "transmission",
  "fuel_type",
  "details",
  "price",
  "quantity"
)
VALUES
  (
    '6f4648a9-1e9e-4e34-a875-72be9bc39a01',
    'Rolls-Royce',
    'Spectre',
    2024,
    'Luxury Coupe',
    'WHITE_RR',
    'Frozen Silver',
    '#C8C9C7',
    'Dual Electric Motor',
    'AUTOMATIC',
    'ELECTRIC',
    'A silent grand tourer pairing hand-finished luxury with instant electric performance.',
    465000.00,
    2
  ),
  (
    '6f4648a9-1e9e-4e34-a875-72be9bc39a02',
    'Bugatti',
    'Chiron Super Sport',
    2024,
    'Hypercar',
    'BLUE_BUGATTI',
    'French Racing Blue',
    '#1769AA',
    '8.0L Quad-Turbo W16',
    'AUTOMATIC',
    'PETROL',
    'A long-tail hypercar engineered for exceptional stability, speed, and effortless power.',
    3900000.00,
    1
  ),
  (
    '6f4648a9-1e9e-4e34-a875-72be9bc39a03',
    'Lamborghini',
    'Revuelto',
    2024,
    'Supercar',
    'GREEN_LAMBO',
    'Verde Mantis',
    '#4D8D42',
    '6.5L V12 Hybrid',
    'AUTOMATIC',
    'HYBRID',
    'A naturally aspirated V12 flagship enhanced by three electric motors and all-wheel drive.',
    620000.00,
    2
  ),
  (
    '6f4648a9-1e9e-4e34-a875-72be9bc39a04',
    'McLaren',
    '750S',
    2024,
    'Supercar',
    'BLACK_CAR',
    'Obsidian Black',
    '#333336',
    '4.0L Twin-Turbo V8',
    'AUTOMATIC',
    'PETROL',
    'A lightweight rear-driven supercar with active aerodynamics and focused road performance.',
    355000.00,
    2
  )
ON CONFLICT ("make", "model", "year") DO UPDATE SET
  "category" = EXCLUDED."category",
  "image_key" = EXCLUDED."image_key",
  "color_name" = EXCLUDED."color_name",
  "color_hex" = EXCLUDED."color_hex",
  "engine" = EXCLUDED."engine",
  "transmission" = EXCLUDED."transmission",
  "fuel_type" = EXCLUDED."fuel_type",
  "details" = EXCLUDED."details",
  "price" = EXCLUDED."price",
  "updated_at" = CURRENT_TIMESTAMP;
