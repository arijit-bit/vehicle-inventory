export type VehicleImageKey =
  | 'WHITE_RR'
  | 'BLUE_BUGATTI'
  | 'GREEN_LAMBO'
  | 'BLACK_CAR'
  | 'BLACK_BENTLEY'
  | 'GREEN_PORSCHE_911'
  | 'BROWN_MAYBACH'
  | 'ORANGE_AUDI_R8'
  | 'BLACK_RANGE_ROVER';
export type Transmission = 'MANUAL' | 'AUTOMATIC';
export type FuelType = 'PETROL' | 'GASOLINE' | 'DIESEL' | 'HYBRID' | 'ELECTRIC';
export type AvailabilityFilter = 'all' | 'available' | 'sold-out';
export type PriceSort = 'featured' | 'price-asc' | 'price-desc';

export const VEHICLES_PER_PAGE = 6;

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  category: string;
  imageKey: VehicleImageKey;
  colorName: string;
  colorHex: string;
  engine: string;
  transmission: Transmission;
  fuelType: FuelType;
  details: string;
  price: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleSearchFilters {
  make?: string;
  model?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  availability?: Exclude<AvailabilityFilter, 'all'>;
  sort?: Exclude<PriceSort, 'featured'>;
}

export interface VehiclePagination {
  limit: number;
  skip: number;
}

export interface VehiclePage {
  vehicles: Vehicle[];
  pagination: VehiclePagination & {
    total: number;
  };
  brands: string[];
}

export interface ReservationOrder {
  id: string;
  status: 'RESERVED';
}

export interface CreateVehicleInput {
  make: string;
  model: string;
  year: number;
  category: string;
  imageKey: VehicleImageKey;
  colorName: string;
  colorHex: string;
  engine: string;
  transmission: Transmission;
  fuelType: FuelType;
  details: string;
  price: number;
  quantity: number;
}

export type UpdateVehicleInput = Partial<Omit<CreateVehicleInput, 'quantity'>>;

interface ApiErrorBody {
  error?: {
    code?: string;
    message?: string;
  };
}

export class VehicleApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'VehicleApiError';
  }
}

const compactFilters = (filters: VehicleSearchFilters) =>
  Object.entries(filters).reduce<Record<string, string>>((result, [key, value]) => {
    const normalized = value?.trim();

    if (normalized) {
      result[key] = normalized;
    }

    return result;
  }, {});

const defaultPagination: VehiclePagination = {
  limit: VEHICLES_PER_PAGE,
  skip: 0,
};

const paginatedQuery = (pagination: VehiclePagination) =>
  new URLSearchParams({
    limit: String(pagination.limit),
    skip: String(pagination.skip),
  });

export const createVehicleApi = (baseUrl: string, fetcher: typeof fetch = fetch) => {
  const request = async <T>(
    path: string,
    token: string | null | undefined,
    init: RequestInit,
  ): Promise<T> => {
    const response = await fetcher(`${baseUrl}${path}`, {
      ...init,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
    const body =
      response.status === 204
        ? undefined
        : ((await response.json().catch(() => undefined)) as (T & ApiErrorBody) | undefined);

    if (!response.ok) {
      throw new VehicleApiError(
        body?.error?.message ?? 'Unable to complete the inventory request',
        body?.error?.code ?? 'REQUEST_FAILED',
        response.status,
      );
    }

    return body as T;
  };

  const jsonRequest = <T>(path: string, token: string, method: 'POST' | 'PUT', body: unknown) =>
    request<T>(path, token, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

  return {
    list: (token?: string | null, pagination: VehiclePagination = defaultPagination) =>
      request<VehiclePage>(`/vehicles?${paginatedQuery(pagination)}`, token, {
        method: 'GET',
      }),
    search: (
      token: string | null | undefined,
      filters: VehicleSearchFilters,
      pagination: VehiclePagination = defaultPagination,
    ) => {
      const query = new URLSearchParams(compactFilters(filters));
      query.set('limit', String(pagination.limit));
      query.set('skip', String(pagination.skip));

      return request<VehiclePage>(`/vehicles/search?${query}`, token, {
        method: 'GET',
      });
    },
    create: (token: string, input: CreateVehicleInput) =>
      jsonRequest<{ vehicle: Vehicle }>('/vehicles', token, 'POST', input),
    update: (token: string, id: string, input: UpdateVehicleInput) =>
      jsonRequest<{ vehicle: Vehicle }>(`/vehicles/${id}`, token, 'PUT', input),
    delete: (token: string, id: string) =>
      request<void>(`/vehicles/${id}`, token, {
        method: 'DELETE',
      }),
    purchase: (token: string, id: string, quantity: number) =>
      jsonRequest<{ vehicle: Vehicle; order: ReservationOrder }>(
        `/vehicles/${id}/purchase`,
        token,
        'POST',
        {
          quantity,
        },
      ),
    restock: (token: string, id: string, quantity: number) =>
      jsonRequest<{ vehicle: Vehicle }>(`/vehicles/${id}/restock`, token, 'POST', {
        quantity,
      }),
  };
};

export const vehicleApi = createVehicleApi(
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3000/api',
);
