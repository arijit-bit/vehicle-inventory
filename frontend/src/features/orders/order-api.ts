import type {
  FuelType,
  Transmission,
  VehicleImageKey,
  VehiclePagination,
} from '../vehicles/vehicle-api';

export const ORDERS_PER_PAGE = 6;

export type OrderStatus = 'RESERVED' | 'CANCELLED';

export interface Order {
  id: string;
  customer: {
    id: string;
    email: string;
  };
  vehicle: {
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
  };
  quantity: number;
  status: OrderStatus;
  reservedAt: string;
  updatedAt: string;
  cancelledAt: string | null;
}

export interface OrderPage {
  orders: Order[];
  pagination: VehiclePagination & {
    total: number;
  };
}

export interface CancellationResponse {
  order: Order;
  vehicle: {
    id: string;
    quantity: number;
  };
}

interface ApiErrorBody {
  error?: {
    code?: string;
    message?: string;
  };
}

export class OrderApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'OrderApiError';
  }
}

const defaultPagination: VehiclePagination = {
  limit: ORDERS_PER_PAGE,
  skip: 0,
};

export const createOrderApi = (baseUrl: string, fetcher: typeof fetch = fetch) => {
  const request = async <T>(path: string, token: string, method: 'GET' | 'POST'): Promise<T> => {
    const response = await fetcher(`${baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const body = (await response.json().catch(() => undefined)) as (T & ApiErrorBody) | undefined;

    if (!response.ok) {
      throw new OrderApiError(
        body?.error?.message ?? 'Unable to complete the order request',
        body?.error?.code ?? 'ORDER_REQUEST_FAILED',
        response.status,
      );
    }

    return body as T;
  };

  return {
    list: (token: string, pagination: VehiclePagination = defaultPagination) => {
      const query = new URLSearchParams({
        limit: String(pagination.limit),
        skip: String(pagination.skip),
      });

      return request<OrderPage>(`/orders?${query}`, token, 'GET');
    },
    cancel: (token: string, orderId: string) =>
      request<CancellationResponse>(`/orders/${orderId}/cancel`, token, 'POST'),
  };
};

export const orderApi = createOrderApi(
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3000/api',
);
