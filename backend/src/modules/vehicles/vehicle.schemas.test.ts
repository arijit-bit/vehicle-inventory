import { describe, expect, it } from 'vitest';
import {
  createVehicleSchema,
  inventoryMutationSchema,
  paginatedSearchVehiclesSchema,
  searchVehiclesSchema,
  updateVehicleSchema,
  vehiclePaginationSchema,
} from './vehicle.schemas.js';

describe('vehicle schemas', () => {
  it('normalizes a valid vehicle payload', () => {
    expect(
      createVehicleSchema.parse({
        make: '  Toyota ',
        model: ' Camry ',
        year: 2025,
        category: ' Sedan ',
        imageKey: 'WHITE_RR',
        colorName: ' Frozen Silver ',
        colorHex: '#C8C9C7',
        engine: ' 2.5L Hybrid ',
        transmission: 'AUTOMATIC',
        fuelType: 'HYBRID',
        details: ' Executive hybrid sedan. ',
        price: 32999.9,
        quantity: 4,
      }),
    ).toEqual({
      make: 'Toyota',
      model: 'Camry',
      year: 2025,
      category: 'Sedan',
      imageKey: 'WHITE_RR',
      colorName: 'Frozen Silver',
      colorHex: '#C8C9C7',
      engine: '2.5L Hybrid',
      transmission: 'AUTOMATIC',
      fuelType: 'HYBRID',
      details: 'Executive hybrid sedan.',
      price: '32999.90',
      quantity: 4,
    });
  });

  it.each([
    'ARTWORK_PENDING',
    'BLACK_BENTLEY',
    'GREEN_PORSCHE_911',
    'BROWN_MAYBACH',
    'ORANGE_AUDI_R8',
    'BLACK_RANGE_ROVER',
  ] as const)('accepts the additional catalog artwork key %s', (imageKey) => {
    expect(
      createVehicleSchema.parse({
        make: 'Catalog',
        model: imageKey,
        year: 2024,
        category: 'Collector Vehicle',
        imageKey,
        colorName: 'Black',
        colorHex: '#0B0C10',
        engine: 'Test Engine',
        transmission: 'AUTOMATIC',
        fuelType: 'GASOLINE',
        details: 'Additional catalog validation fixture.',
        price: '230400.00',
        quantity: 1,
      }),
    ).toMatchObject({ imageKey, fuelType: 'GASOLINE' });
  });

  it('defaults an omitted create artwork to the pending placeholder', () => {
    expect(
      createVehicleSchema.parse({
        make: 'Lucid',
        model: 'Air',
        year: 2026,
        category: 'Electric Sedan',
        colorName: 'Stellar White',
        colorHex: '#F2F2F0',
        engine: 'Dual electric motors',
        transmission: 'AUTOMATIC',
        fuelType: 'ELECTRIC',
        details: 'Awaiting final catalog photography.',
        price: '89900.00',
        quantity: 1,
      }),
    ).toMatchObject({ imageKey: 'ARTWORK_PENDING' });
  });

  it.each([
    { year: 1800 },
    { imageKey: 'HERO_CAR' },
    { colorHex: 'silver' },
    { transmission: 'CVT' },
    { fuelType: 'STEAM' },
  ])('rejects invalid catalog metadata %o', (override) => {
    expect(() =>
      createVehicleSchema.parse({
        make: 'Toyota',
        model: 'Camry',
        year: 2025,
        category: 'Sedan',
        imageKey: 'WHITE_RR',
        colorName: 'Frozen Silver',
        colorHex: '#C8C9C7',
        engine: '2.5L Hybrid',
        transmission: 'AUTOMATIC',
        fuelType: 'HYBRID',
        details: 'Executive hybrid sedan.',
        price: 32999.9,
        quantity: 4,
        ...override,
      }),
    ).toThrow();
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

  it('keeps stock changes out of generic vehicle updates', () => {
    expect(() => updateVehicleSchema.parse({ quantity: 3 })).toThrow();
    expect(() => updateVehicleSchema.parse({ make: 'Toyota', quantity: 3 })).toThrow();
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

  it('defaults to six vehicles on the first page and accepts the second-page offset', () => {
    expect(vehiclePaginationSchema.parse({})).toEqual({ limit: 6, skip: 0 });
    expect(vehiclePaginationSchema.parse({ limit: '6', skip: '6' })).toEqual({
      limit: 6,
      skip: 6,
    });
  });

  it.each([
    { limit: '7', skip: '0' },
    { limit: '6', skip: '-1' },
    { limit: '6', skip: '7' },
  ])('rejects an invalid collection page %o', (query) => {
    expect(() => vehiclePaginationSchema.parse(query)).toThrow();
  });

  it('combines normalized filters, ordering, and pagination', () => {
    expect(
      paginatedSearchVehiclesSchema.parse({
        make: '  Porsche ',
        availability: 'available',
        sort: 'price-desc',
        limit: '6',
        skip: '12',
      }),
    ).toEqual({
      make: 'Porsche',
      availability: 'available',
      sort: 'price-desc',
      limit: 6,
      skip: 12,
    });
  });

  it('defaults an inventory mutation to one vehicle and accepts a positive quantity', () => {
    expect(inventoryMutationSchema.parse({})).toEqual({ quantity: 1 });
    expect(inventoryMutationSchema.parse({ quantity: 3 })).toEqual({ quantity: 3 });
  });

  it.each([0, -1, 1.5, '2'])('rejects invalid inventory quantity %s', (quantity) => {
    expect(() => inventoryMutationSchema.parse({ quantity })).toThrow();
  });
});
