import { describe, expect, it } from 'vitest';
import {
  createVehicleSchema,
  searchVehiclesSchema,
  updateVehicleSchema,
} from './vehicle.schemas.js';

describe('vehicle schemas', () => {
  it('normalizes a valid vehicle payload', () => {
    expect(
      createVehicleSchema.parse({
        make: '  Toyota ',
        model: ' Camry ',
        category: ' Sedan ',
        price: 32999.9,
        quantity: 4,
      }),
    ).toEqual({
      make: 'Toyota',
      model: 'Camry',
      category: 'Sedan',
      price: '32999.90',
      quantity: 4,
    });
  });

  it.each([
    [{ make: '', model: 'Camry', category: 'Sedan', price: 1, quantity: 1 }],
    [{ make: 'Toyota', model: '', category: 'Sedan', price: 1, quantity: 1 }],
    [{ make: 'Toyota', model: 'Camry', category: '', price: 1, quantity: 1 }],
    [{ make: 'Toyota', model: 'Camry', category: 'Sedan', price: -1, quantity: 1 }],
    [{ make: 'Toyota', model: 'Camry', category: 'Sedan', price: '1.999', quantity: 1 }],
    [{ make: 'Toyota', model: 'Camry', category: 'Sedan', price: 1, quantity: -1 }],
    [{ make: 'Toyota', model: 'Camry', category: 'Sedan', price: 1, quantity: 1.5 }],
  ])('rejects an invalid create payload', (payload) => {
    expect(() => createVehicleSchema.parse(payload)).toThrow();
  });

  it('requires an update to contain at least one supported field', () => {
    expect(() => updateVehicleSchema.parse({})).toThrow();
    expect(() => updateVehicleSchema.parse({ unsupported: true })).toThrow();
  });

  it('normalizes search filters and rejects an inverted price range', () => {
    expect(
      searchVehiclesSchema.parse({
        make: '  toy ',
        model: ' cam ',
        category: ' sedan ',
        minPrice: '10000',
        maxPrice: '40000.5',
      }),
    ).toEqual({
      make: 'toy',
      model: 'cam',
      category: 'sedan',
      minPrice: '10000.00',
      maxPrice: '40000.50',
    });

    expect(() =>
      searchVehiclesSchema.parse({
        minPrice: '40000',
        maxPrice: '10000',
      }),
    ).toThrow();
  });
});
