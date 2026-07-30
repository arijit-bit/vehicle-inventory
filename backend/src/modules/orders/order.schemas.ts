import { z } from 'zod';

const paginationShape = {
  limit: z.coerce.number().int().min(6).max(6).default(6),
  skip: z.coerce.number().int().min(0).max(1_000_000).default(0),
};

export const orderPaginationSchema = z
  .strictObject(paginationShape)
  .refine(({ limit, skip }) => skip % limit === 0, {
    path: ['skip'],
    message: 'Skip must align with the six-order page size',
  });

export const orderIdSchema = z.uuid();
