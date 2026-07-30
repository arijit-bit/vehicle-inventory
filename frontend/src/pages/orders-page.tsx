import { CalendarDays, CircleUserRound, Gauge, PackageCheck, XCircle } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AppNavigation } from '../components/app-navigation';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { useAuth } from '../features/auth/auth-context-value';
import { useMediaAsset } from '../features/media-assets/media-asset-context-value';
import {
  ORDERS_PER_PAGE,
  OrderApiError,
  orderApi,
  type Order,
  type OrderPage,
} from '../features/orders/order-api';
import { CollectionPagination } from '../features/vehicles/collection-pagination';
import { cn } from '../lib/utils';

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const date = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const emptyPage: OrderPage = {
  orders: [],
  pagination: {
    limit: ORDERS_PER_PAGE,
    skip: 0,
    total: 0,
  },
};

interface OrderCardProps {
  canCancel: boolean;
  isPending: boolean;
  order: Order;
  showCustomer: boolean;
  onCancel(order: Order): void;
}

const OrderCard = ({ canCancel, isPending, order, showCustomer, onCancel }: OrderCardProps) => {
  const { asset, isLoading: isAssetLoading } = useMediaAsset(order.vehicle.imageKey);
  const isReserved = order.status === 'RESERVED';

  return (
    <Card
      aria-label={`${order.vehicle.make} ${order.vehicle.model} order`}
      className="overflow-hidden border-white/10 bg-white/[0.035]"
      role="article"
    >
      <div className="grid h-full md:grid-cols-[minmax(220px,0.9fr)_1.3fr]">
        <div className="relative min-h-56 overflow-hidden bg-gradient-to-br from-white/[0.08] to-transparent">
          {asset ? (
            <img
              alt={asset.altText}
              className="absolute inset-0 size-full object-contain p-8 transition-transform duration-500 hover:scale-[1.03]"
              src={asset.publicUrl}
            />
          ) : (
            <div
              aria-label={isAssetLoading ? 'Loading vehicle image' : 'Vehicle image unavailable'}
              className="absolute inset-0 animate-pulse bg-white/[0.03]"
              role="img"
            />
          )}
          <span
            className={cn(
              'absolute left-5 top-5 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]',
              isReserved
                ? 'border-emerald-300/25 bg-emerald-300/10 text-emerald-200'
                : 'border-white/15 bg-black/30 text-secondary',
            )}
          >
            {isReserved ? 'Reserved' : 'Cancelled'}
          </span>
        </div>

        <CardContent className="flex flex-col p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-secondary">
                {order.vehicle.year} · {order.vehicle.category}
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                {order.vehicle.make} {order.vehicle.model}
              </h2>
            </div>
            <p className="text-lg font-medium">
              {currency.format(Number(order.vehicle.price) * order.quantity)}
            </p>
          </div>

          <div className="mt-7 grid gap-3 text-sm text-secondary sm:grid-cols-2">
            <p className="flex items-center gap-2">
              <CalendarDays aria-hidden="true" className="size-4" />
              Reserved {date.format(new Date(order.reservedAt))}
            </p>
            <p className="flex items-center gap-2">
              <PackageCheck aria-hidden="true" className="size-4" />
              Quantity {order.quantity}
            </p>
            <p className="flex items-center gap-2">
              <Gauge aria-hidden="true" className="size-4" />
              {order.vehicle.engine}
            </p>
            {showCustomer && (
              <p className="flex items-center gap-2">
                <CircleUserRound aria-hidden="true" className="size-4" />
                <span className="truncate">{order.customer.email}</span>
              </p>
            )}
          </div>

          <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-8">
            <p className="max-w-xl text-xs leading-5 text-secondary/75">
              Order #{order.id.slice(0, 8)}
              {order.cancelledAt
                ? ` · Cancelled ${date.format(new Date(order.cancelledAt))}`
                : ` · ${order.vehicle.colorName}`}
            </p>
            {canCancel && isReserved && (
              <Button
                aria-label={`Cancel ${order.vehicle.make} ${order.vehicle.model} order`}
                disabled={isPending}
                onClick={() => onCancel(order)}
                variant="outline"
              >
                <XCircle aria-hidden="true" className="mr-2 size-4" />
                {isPending ? 'Cancelling…' : 'Cancel order'}
              </Button>
            )}
          </div>
        </CardContent>
      </div>
    </Card>
  );
};

export const OrdersPage = () => {
  const { user, token, isLoading: isAuthLoading, logout } = useAuth();
  const [page, setPage] = useState(1);
  const [data, setData] = useState<OrderPage>(emptyPage);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ tone: 'error' | 'success'; message: string } | null>(
    null,
  );

  const loadOrders = useCallback(async () => {
    if (!token) {
      return;
    }

    setIsLoading(true);
    setFeedback(null);

    try {
      const result = await orderApi.list(token, {
        limit: ORDERS_PER_PAGE,
        skip: (page - 1) * ORDERS_PER_PAGE,
      });
      setData(result);
    } catch (error) {
      if (error instanceof OrderApiError && error.status === 401) {
        logout();
        return;
      }

      setFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Unable to load orders',
      });
    } finally {
      setIsLoading(false);
    }
  }, [logout, page, token]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const customerCount = useMemo(
    () => new Set(data.orders.map((order) => order.customer.id)).size,
    [data.orders],
  );
  const totalPages = Math.max(1, Math.ceil(data.pagination.total / ORDERS_PER_PAGE));
  const isStaff = user?.role === 'EMPLOYEE' || user?.role === 'ADMIN';

  if (isAuthLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-secondary">
        Loading your account…
      </main>
    );
  }

  if (!user || !token) {
    return <Navigate replace to="/login" />;
  }

  const cancelOrder = async (order: Order) => {
    setPendingOrderId(order.id);
    setFeedback(null);

    try {
      const result = await orderApi.cancel(token, order.id);
      setData((current) => ({
        ...current,
        orders: current.orders.map((currentOrder) =>
          currentOrder.id === result.order.id ? result.order : currentOrder,
        ),
      }));
      setFeedback({
        tone: 'success',
        message: `${order.vehicle.make} ${order.vehicle.model} cancelled. Stock has been restored.`,
      });
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Unable to cancel the order',
      });
    } finally {
      setPendingOrderId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-primary">
      <AppNavigation active="orders" onLogout={logout} user={user} />
      <main className="mx-auto w-full max-w-[1440px] px-5 pb-20 pt-14 sm:px-8 lg:px-12">
        <header className="flex flex-wrap items-end justify-between gap-6 border-b border-white/10 pb-9">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-secondary">
              {isStaff ? 'Sales activity' : 'Your garage'}
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              {isStaff ? 'Customer Orders' : 'Your Orders'}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-secondary">
              {isStaff
                ? 'Review reservations from every customer and track their current status.'
                : 'Review your vehicle reservations or cancel an active order to release its stock.'}
            </p>
          </div>
          {isStaff && (
            <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-secondary">
              <span>
                {customerCount} {customerCount === 1 ? 'customer' : 'customers'}
              </span>
              <span aria-hidden="true"> · </span>
              <span>{data.pagination.total} orders</span>
            </div>
          )}
        </header>

        {feedback && (
          <p
            className={cn(
              'mt-8 rounded-xl border px-4 py-3 text-sm',
              feedback.tone === 'success'
                ? 'border-emerald-300/20 bg-emerald-300/[0.07] text-emerald-100'
                : 'border-red-300/20 bg-red-300/[0.07] text-red-100',
            )}
            role="status"
          >
            {feedback.message}
          </p>
        )}

        {isLoading ? (
          <div aria-label="Loading orders" className="mt-10 grid gap-6">
            {[0, 1].map((item) => (
              <div
                className="h-72 animate-pulse rounded-[var(--radius)] border border-white/10 bg-white/[0.025]"
                key={item}
              />
            ))}
          </div>
        ) : data.orders.length === 0 ? (
          <Card className="mt-10 border-dashed bg-transparent py-16 text-center">
            <CardContent className="p-6">
              <PackageCheck aria-hidden="true" className="mx-auto size-8 text-secondary" />
              <h2 className="mt-5 text-xl font-medium">No orders yet</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-secondary">
                {isStaff
                  ? 'Customer reservations will appear here as soon as they are placed.'
                  : 'Reserve a vehicle from the inventory and it will appear here.'}
              </p>
              {!isStaff && (
                <Button asChild className="mt-7">
                  <a href="/dashboard">Explore inventory</a>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <section aria-label="Orders" className="mt-10 grid gap-6">
              {data.orders.map((order) => (
                <OrderCard
                  canCancel={user.role === 'CUSTOMER'}
                  isPending={pendingOrderId === order.id}
                  key={order.id}
                  onCancel={(selectedOrder) => void cancelOrder(selectedOrder)}
                  order={order}
                  showCustomer={isStaff}
                />
              ))}
            </section>
            <CollectionPagination
              ariaLabel="Orders pagination"
              currentPage={page}
              disabled={isLoading}
              onPageChange={setPage}
              totalPages={totalPages}
            />
          </>
        )}
      </main>
    </div>
  );
};
