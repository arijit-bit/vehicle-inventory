import { z } from 'zod';

const vehicleTextSchema = z.string().trim().min(1).max(100);

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
  category: vehicleTextSchema,
  price: priceSchema,
});

export const createVehicleSchema = vehicleDetailsSchema.extend({
  quantity: quantitySchema,
});

export const updateVehicleSchema = vehicleDetailsSchema
  .partial()
  .refine((input) => Object.keys(input).length > 0, {
    message: 'At least one vehicle field is required',
  });

export const searchVehiclesSchema = z
  .strictObject({
    make: vehicleTextSchema.optional(),
    model: vehicleTextSchema.optional(),
    category: vehicleTextSchema.optional(),
    minPrice: priceSchema.optional(),
    maxPrice: priceSchema.optional(),
  })
  .refine(
    (filters) =>
      filters.minPrice === undefined ||
      filters.maxPrice === undefined ||
      BigInt(filters.minPrice.replace('.', '')) <= BigInt(filters.maxPrice.replace('.', '')),
    {
      path: ['maxPrice'],
      message: 'Maximum price must be greater than or equal to minimum price',
    },
  );

export const vehicleIdSchema = z.uuid();

export const inventoryMutationSchema = z.strictObject({
  quantity: inventoryQuantitySchema.default(1),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
export type VehicleSearchFilters = z.infer<typeof searchVehiclesSchema>;
