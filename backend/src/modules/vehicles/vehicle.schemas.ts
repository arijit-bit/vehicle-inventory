import { z } from 'zod';

const vehicleTextSchema = z.string().trim().min(1).max(100);
const vehicleDetailSchema = z.string().trim().min(1).max(2_000);
const engineSchema = z.string().trim().min(1).max(160);
const yearSchema = z.number().int().min(1886).max(2100);
const colorHexSchema = z
  .string()
  .trim()
  .regex(/^#[0-9A-F]{6}$/i, 'Color must be a six-digit hexadecimal value')
  .transform((value) => value.toUpperCase());

export const vehicleImageKeys = [
  'ARTWORK_PENDING',
  'WHITE_RR',
  'BLUE_BUGATTI',
  'GREEN_LAMBO',
  'BLACK_CAR',
  'BLACK_BENTLEY',
  'GREEN_PORSCHE_911',
  'BROWN_MAYBACH',
  'ORANGE_AUDI_R8',
  'BLACK_RANGE_ROVER',
] as const;
const vehicleImageKeySchema = z.enum(vehicleImageKeys);
export const transmissions = ['MANUAL', 'AUTOMATIC'] as const;
export const fuelTypes = ['PETROL', 'GASOLINE', 'DIESEL', 'HYBRID', 'ELECTRIC'] as const;
export const availabilityFilters = ['available', 'sold-out'] as const;
export const vehicleSorts = ['price-asc', 'price-desc'] as const;

const priceSchema = z.preprocess(
  (value) => (typeof value === 'number' && Number.isFinite(value) ? String(value) : value),
  z
    .string()
    .trim()
    .regex(
      /^\d{1,10}(?:\.\d{1,2})?$/,
      'Price must be a non-negative amount with at most 2 decimals',
    )
    .transform((value) => {
      const [whole, fraction = ''] = value.split('.');

      return `${whole}.${fraction.padEnd(2, '0')}`;
    }),
);

const quantitySchema = z.number().int().min(0).max(2_147_483_647);
const inventoryQuantitySchema = z.number().int().positive().max(2_147_483_647);

const vehicleDetailsSchema = z.strictObject({
  make: vehicleTextSchema,
  model: vehicleTextSchema,
  year: yearSchema,
  category: vehicleTextSchema,
  imageKey: vehicleImageKeySchema,
  colorName: vehicleTextSchema,
  colorHex: colorHexSchema,
  engine: engineSchema,
  transmission: z.enum(transmissions),
  fuelType: z.enum(fuelTypes),
  details: vehicleDetailSchema,
  price: priceSchema,
});

export const createVehicleSchema = vehicleDetailsSchema.extend({
  imageKey: vehicleImageKeySchema.default('ARTWORK_PENDING'),
  quantity: quantitySchema,
});

export const updateVehicleSchema = vehicleDetailsSchema
  .partial()
  .refine((input) => Object.keys(input).length > 0, {
    message: 'At least one vehicle field is required',
  });

const vehicleSearchShape = {
  make: vehicleTextSchema.optional(),
  model: vehicleTextSchema.optional(),
  category: vehicleTextSchema.optional(),
  minPrice: priceSchema.optional(),
  maxPrice: priceSchema.optional(),
  availability: z.enum(availabilityFilters).optional(),
  sort: z.enum(vehicleSorts).optional(),
};
const paginationShape = {
  limit: z.coerce.number().int().min(6).max(6).default(6),
  skip: z.coerce.number().int().min(0).max(1_000_000).default(0),
};
const hasValidPriceRange = (filters: {
  minPrice?: string | undefined;
  maxPrice?: string | undefined;
}) =>
  filters.minPrice === undefined ||
  filters.maxPrice === undefined ||
  BigInt(filters.minPrice.replace('.', '')) <= BigInt(filters.maxPrice.replace('.', ''));
const hasAlignedOffset = ({ limit, skip }: { limit: number; skip: number }) => skip % limit === 0;

export const searchVehiclesSchema = z.strictObject(vehicleSearchShape).refine(hasValidPriceRange, {
  path: ['maxPrice'],
  message: 'Maximum price must be greater than or equal to minimum price',
});

export const vehiclePaginationSchema = z.strictObject(paginationShape).refine(hasAlignedOffset, {
  path: ['skip'],
  message: 'Skip must align with the six-vehicle page size',
});

export const paginatedSearchVehiclesSchema = z
  .strictObject({
    ...vehicleSearchShape,
    ...paginationShape,
  })
  .refine(hasValidPriceRange, {
    path: ['maxPrice'],
    message: 'Maximum price must be greater than or equal to minimum price',
  })
  .refine(hasAlignedOffset, {
    path: ['skip'],
    message: 'Skip must align with the six-vehicle page size',
  });

export const vehicleIdSchema = z.uuid();

export const inventoryMutationSchema = z.strictObject({
  quantity: inventoryQuantitySchema.default(1),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
export type VehicleSearchFilters = z.infer<typeof searchVehiclesSchema>;
export type VehiclePagination = z.infer<typeof vehiclePaginationSchema>;
export type VehicleImageKey = (typeof vehicleImageKeys)[number];
export type Transmission = (typeof transmissions)[number];
export type FuelType = (typeof fuelTypes)[number];
