export interface Vehicle {
  id: string;
  make: string;
  model: string;
  category: string;
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
}

export interface CreateVehicleInput {
  make: string;
  model: string;
  category: string;
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

export const createVehicleApi = (baseUrl: string, fetcher: typeof fetch = fetch) => {
  const request = async <T>(path: string, token: string, init: RequestInit): Promise<T> => {
    const response = await fetcher(`${baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
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
    list: (token: string) =>
      request<{ vehicles: Vehicle[] }>('/vehicles', token, {
        method: 'GET',
      }),
    search: (token: string, filters: VehicleSearchFilters) => {
      const query = new URLSearchParams(compactFilters(filters));

      return request<{ vehicles: Vehicle[] }>(`/vehicles/search?${query}`, token, {
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
      jsonRequest<{ vehicle: Vehicle }>(`/vehicles/${id}/purchase`, token, 'POST', {
        quantity,
      }),
    restock: (token: string, id: string, quantity: number) =>
      jsonRequest<{ vehicle: Vehicle }>(`/vehicles/${id}/restock`, token, 'POST', {
        quantity,
      }),
  };
};

export const vehicleApi = createVehicleApi(
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3000/api',
);
