CREATE TYPE "OrderStatus" AS ENUM ('RESERVED', 'CANCELLED');

CREATE TABLE "orders" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "vehicle_id" UUID NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "unit_price" DECIMAL(12,2) NOT NULL,
  "vehicle_make" VARCHAR(100) NOT NULL,
  "vehicle_model" VARCHAR(100) NOT NULL,
  "vehicle_year" INTEGER NOT NULL,
  "vehicle_category" VARCHAR(100) NOT NULL,
  "vehicle_image_key" "VehicleImageKey" NOT NULL,
  "vehicle_color_name" VARCHAR(100) NOT NULL,
  "vehicle_color_hex" CHAR(7) NOT NULL,
  "vehicle_engine" VARCHAR(160) NOT NULL,
  "vehicle_transmission" "Transmission" NOT NULL,
  "vehicle_fuel_type" "FuelType" NOT NULL,
  "vehicle_details" TEXT NOT NULL,
  "status" "OrderStatus" NOT NULL DEFAULT 'RESERVED',
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "cancelled_at" TIMESTAMPTZ(3),
  CONSTRAINT "orders_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "orders_quantity_positive" CHECK ("quantity" > 0),
  CONSTRAINT "orders_unit_price_non_negative" CHECK ("unit_price" >= 0),
  CONSTRAINT "orders_cancellation_consistent" CHECK (
    ("status" = 'RESERVED' AND "cancelled_at" IS NULL)
    OR ("status" = 'CANCELLED' AND "cancelled_at" IS NOT NULL)
  ),
  CONSTRAINT "orders_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "orders_vehicle_id_fkey"
    FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "orders_user_id_created_at_id_idx"
  ON "orders"("user_id", "created_at" DESC, "id");
CREATE INDEX "orders_created_at_id_idx"
  ON "orders"("created_at" DESC, "id");
CREATE INDEX "orders_vehicle_id_idx"
  ON "orders"("vehicle_id");

ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE "orders" FROM anon;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE "orders" FROM authenticated;
  END IF;
END
$$;
