import {
  Boxes,
  CarFront,
  CircleDollarSign,
  LogOut,
  PackagePlus,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  ShoppingCart,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useId, useState, type FormEvent, type ReactNode } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../features/auth/auth-context-value';
import {
  VehicleApiError,
  vehicleApi,
  type CreateVehicleInput,
  type UpdateVehicleInput,
  type Vehicle,
  type VehicleSearchFilters,
} from '../features/vehicles/vehicle-api';

type DialogState =
  | { type: 'create' }
  | { type: 'edit'; vehicle: Vehicle }
  | { type: 'restock'; vehicle: Vehicle }
  | { type: 'delete'; vehicle: Vehicle };

interface Feedback {
  tone: 'error' | 'success';
  message: string;
}

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

const replaceVehicle = (vehicles: Vehicle[], updated: Vehicle) =>
  vehicles.map((vehicle) => (vehicle.id === updated.id ? updated : vehicle));

const readableInventoryError = (error: unknown) => {
  if (!(error instanceof VehicleApiError)) {
    return 'Something went wrong. Please try again.';
  }

  if (error.code === 'INSUFFICIENT_STOCK') {
    return 'That vehicle just sold out. The latest stock level has been refreshed.';
  }

  if (error.code === 'INVENTORY_BUSY') {
    return 'Inventory is processing another update. Wait a moment, then retry.';
  }

  if (error.code === 'FORBIDDEN') {
    return 'You do not have permission to manage this inventory.';
  }

  return error.message;
};

const Dialog = ({
  title,
  description,
  children,
  onDismiss,
}: {
  title: string;
  description: string;
  children: ReactNode;
  onDismiss(): void;
}) => {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm">
      <section
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl shadow-black/50 sm:p-8"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white" id={titleId}>
              {title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400" id={descriptionId}>
              {description}
            </p>
          </div>
          <Button aria-label="Close dialog" onClick={onDismiss} size="icon" variant="ghost">
            <X aria-hidden="true" className="size-5" />
          </Button>
        </div>
        <div className="mt-7">{children}</div>
      </section>
    </div>
  );
};

const FormField = ({ id, label, children }: { id: string; label: string; children: ReactNode }) => (
  <div className="space-y-2">
    <Label htmlFor={id}>{label}</Label>
    {children}
  </div>
);

const VehicleForm = ({
  vehicle,
  pending,
  onCancel,
  onSubmit,
}: {
  vehicle?: Vehicle;
  pending: boolean;
  onCancel(): void;
  onSubmit(input: CreateVehicleInput | UpdateVehicleInput): Promise<void>;
}) => {
  const prefix = useId();
  const mode = vehicle ? 'edit' : 'create';

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const details = {
      make: String(form.get('make')).trim(),
      model: String(form.get('model')).trim(),
      category: String(form.get('category')).trim(),
      price: Number(form.get('price')),
    };

    await onSubmit(
      vehicle
        ? details
        : {
            ...details,
            quantity: Number(form.get('quantity')),
          },
    );
  };

  return (
    <form className="grid gap-5" onSubmit={submit}>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id={`${prefix}-make`} label="Make">
          <Input
            defaultValue={vehicle?.make}
            id={`${prefix}-make`}
            maxLength={100}
            name="make"
            required
          />
        </FormField>
        <FormField id={`${prefix}-model`} label="Model">
          <Input
            defaultValue={vehicle?.model}
            id={`${prefix}-model`}
            maxLength={100}
            name="model"
            required
          />
        </FormField>
        <FormField id={`${prefix}-category`} label="Category">
          <Input
            defaultValue={vehicle?.category}
            id={`${prefix}-category`}
            maxLength={100}
            name="category"
            required
          />
        </FormField>
        <FormField id={`${prefix}-price`} label="Price">
          <Input
            defaultValue={vehicle?.price}
            id={`${prefix}-price`}
            min="0"
            name="price"
            required
            step="0.01"
            type="number"
          />
        </FormField>
      </div>
      {mode === 'create' && (
        <FormField id={`${prefix}-quantity`} label="Initial quantity">
          <Input
            id={`${prefix}-quantity`}
            min="0"
            name="quantity"
            required
            step="1"
            type="number"
          />
        </FormField>
      )}
      {mode === 'edit' && (
        <p className="rounded-xl border border-cyan-400/15 bg-cyan-400/5 px-4 py-3 text-sm text-cyan-100">
          Stock is changed only through Purchase or Restock to preserve atomic updates.
        </p>
      )}
      <div className="flex justify-end gap-3 pt-2">
        <Button onClick={onCancel} type="button" variant="ghost">
          Cancel
        </Button>
        <Button disabled={pending} type="submit">
          {pending ? 'Saving…' : mode === 'create' ? 'Create vehicle' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
};

export const DashboardPage = () => {
  const { user, token, logout } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [filters, setFilters] = useState<VehicleSearchFilters>({});

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    let active = true;
    setIsLoading(true);
    vehicleApi
      .list(token)
      .then(({ vehicles: inventory }) => {
        if (active) {
          setVehicles(inventory);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setFeedback({ tone: 'error', message: readableInventoryError(error) });
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [token]);

  const runAction = async (key: string, action: () => Promise<void>) => {
    setPendingAction(key);
    setFeedback(null);

    try {
      await action();
    } catch (error) {
      setFeedback({ tone: 'error', message: readableInventoryError(error) });
    } finally {
      setPendingAction(null);
    }
  };

  const purchase = (vehicle: Vehicle) => {
    if (!token || vehicle.quantity === 0) {
      return;
    }

    void runAction(`purchase-${vehicle.id}`, async () => {
      const { vehicle: updated } = await vehicleApi.purchase(token, vehicle.id, 1);
      setVehicles((current) => replaceVehicle(current, updated));
      setFeedback({
        tone: 'success',
        message: `${updated.make} ${updated.model} purchased. ${updated.quantity} remaining.`,
      });
    });
  };

  const searchInventory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      return;
    }

    const normalized = Object.entries(filters).reduce<VehicleSearchFilters>(
      (result, [key, value]) => {
        const trimmed = value?.trim();
        if (trimmed) {
          result[key as keyof VehicleSearchFilters] = trimmed;
        }
        return result;
      },
      {},
    );

    await runAction('search', async () => {
      const result =
        Object.keys(normalized).length === 0
          ? await vehicleApi.list(token)
          : await vehicleApi.search(token, normalized);
      setVehicles(result.vehicles);
    });
  };

  const clearSearch = () => {
    setFilters({});

    if (token) {
      void runAction('search', async () => {
        const result = await vehicleApi.list(token);
        setVehicles(result.vehicles);
      });
    }
  };

  const saveVehicle = async (input: CreateVehicleInput | UpdateVehicleInput) => {
    if (!token || !dialog || (dialog.type !== 'create' && dialog.type !== 'edit')) {
      return;
    }

    const currentDialog = dialog;
    await runAction('save', async () => {
      if (currentDialog.type === 'create') {
        const result = await vehicleApi.create(token, input as CreateVehicleInput);
        setVehicles((current) => [result.vehicle, ...current]);
        setFeedback({ tone: 'success', message: 'Vehicle added to inventory.' });
      } else {
        const result = await vehicleApi.update(
          token,
          currentDialog.vehicle.id,
          input as UpdateVehicleInput,
        );
        setVehicles((current) => replaceVehicle(current, result.vehicle));
        setFeedback({ tone: 'success', message: 'Vehicle details updated.' });
      }
      setDialog(null);
    });
  };

  const restock = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token || dialog?.type !== 'restock') {
      return;
    }

    const vehicle = dialog.vehicle;
    const quantity = Number(new FormData(event.currentTarget).get('quantity'));
    await runAction('restock', async () => {
      const result = await vehicleApi.restock(token, vehicle.id, quantity);
      setVehicles((current) => replaceVehicle(current, result.vehicle));
      setDialog(null);
      setFeedback({
        tone: 'success',
        message: `${vehicle.make} ${vehicle.model} restocked atomically.`,
      });
    });
  };

  const deleteVehicle = async () => {
    if (!token || dialog?.type !== 'delete') {
      return;
    }

    const vehicle = dialog.vehicle;
    await runAction('delete', async () => {
      await vehicleApi.delete(token, vehicle.id);
      setVehicles((current) => current.filter((item) => item.id !== vehicle.id));
      setDialog(null);
      setFeedback({ tone: 'success', message: 'Vehicle deleted from inventory.' });
    });
  };

  const totalUnits = vehicles.reduce((sum, vehicle) => sum + vehicle.quantity, 0);
  const availableModels = vehicles.filter((vehicle) => vehicle.quantity > 0).length;
  const isAdmin = user?.role === 'ADMIN';

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 sm:px-8">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute left-1/2 top-0 h-96 w-[50rem] -translate-x-1/2 rounded-full bg-cyan-500/8 blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20">
              <Boxes aria-hidden="true" className="size-5" />
            </span>
            <div>
              <p className="font-bold tracking-tight text-white">MotorVault</p>
              <p className="text-xs text-slate-500">Atomic vehicle inventory</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/8 px-3 py-2 text-xs font-medium text-emerald-300 sm:inline-flex">
              <ShieldCheck aria-hidden="true" className="size-4" />
              {isAdmin ? 'Administrator' : 'Verified buyer'}
            </span>
            <Button onClick={logout} variant="outline">
              <LogOut aria-hidden="true" className="size-4" />
              Sign out
            </Button>
          </div>
        </header>

        <section className="py-10">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-400">
                Live inventory
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Inventory control,
                <span className="block text-slate-400">without race conditions.</span>
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
                Purchase and restock operations are committed atomically. Every quantity shown is
                returned by the server after the update succeeds.
              </p>
            </div>
            {isAdmin && (
              <Button onClick={() => setDialog({ type: 'create' })} size="lg">
                <Plus aria-hidden="true" className="size-5" />
                Add vehicle
              </Button>
            )}
          </div>

          <div className="mt-9 grid gap-4 sm:grid-cols-3">
            {[
              { icon: CarFront, label: 'Models listed', value: vehicles.length },
              { icon: ShoppingCart, label: 'Available models', value: availableModels },
              { icon: Boxes, label: 'Total units', value: totalUnits },
            ].map(({ icon: Icon, label, value }) => (
              <Card className="rounded-2xl p-5" key={label}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">{label}</p>
                    <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
                  </div>
                  <span className="flex size-11 items-center justify-center rounded-xl bg-white/5 text-cyan-300">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {!dialog && (
          <Card className="rounded-2xl p-5 sm:p-6">
            <form
              className="grid items-end gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_0.8fr_0.8fr_auto]"
              onSubmit={searchInventory}
            >
              {[
                ['make', 'Make'],
                ['model', 'Model'],
                ['category', 'Category'],
                ['minPrice', 'Minimum price'],
                ['maxPrice', 'Maximum price'],
              ].map(([field, label]) => (
                <FormField id={`filter-${field}`} key={field} label={label!}>
                  <Input
                    id={`filter-${field}`}
                    onChange={(event) =>
                      setFilters((current) => ({ ...current, [field!]: event.target.value }))
                    }
                    placeholder={field?.includes('Price') ? '0.00' : `Any ${label?.toLowerCase()}`}
                    type={field?.includes('Price') ? 'number' : 'text'}
                    value={filters[field as keyof VehicleSearchFilters] ?? ''}
                  />
                </FormField>
              ))}
              <div className="flex gap-2">
                <Button
                  aria-label="Search inventory"
                  disabled={pendingAction === 'search'}
                  size="icon"
                  type="submit"
                >
                  <Search aria-hidden="true" className="size-5" />
                </Button>
                <Button
                  aria-label="Clear search"
                  onClick={clearSearch}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <X aria-hidden="true" className="size-5" />
                </Button>
              </div>
            </form>
          </Card>
        )}

        {feedback && (
          <div
            className={`mt-5 rounded-2xl border px-5 py-4 text-sm ${
              feedback.tone === 'error'
                ? 'border-rose-400/20 bg-rose-400/10 text-rose-200'
                : 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'
            }`}
            role={feedback.tone === 'error' ? 'alert' : 'status'}
          >
            {feedback.message}
          </div>
        )}

        <section aria-busy={isLoading} aria-label="Vehicle inventory" className="py-8">
          {isLoading ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2].map((item) => (
                <div
                  aria-hidden="true"
                  className="h-72 animate-pulse rounded-3xl border border-white/5 bg-white/[0.03]"
                  key={item}
                />
              ))}
            </div>
          ) : vehicles.length === 0 ? (
            <Card className="rounded-3xl p-12 text-center">
              <CarFront aria-hidden="true" className="mx-auto size-10 text-slate-600" />
              <h2 className="mt-4 text-lg font-semibold text-white">No vehicles found</h2>
              <p className="mt-2 text-sm text-slate-500">
                Change your filters or add the first vehicle to this inventory.
              </p>
            </Card>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {vehicles.map((vehicle) => {
                const soldOut = vehicle.quantity === 0;
                const buying = pendingAction === `purchase-${vehicle.id}`;

                return (
                  <Card
                    aria-label={`${vehicle.make} ${vehicle.model}`}
                    className="group overflow-hidden rounded-3xl"
                    key={vehicle.id}
                    role="article"
                  >
                    <div className="border-b border-white/8 bg-gradient-to-br from-slate-800 to-slate-900 p-6">
                      <div className="flex items-start justify-between gap-3">
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-wider text-slate-300">
                          {vehicle.category}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            soldOut
                              ? 'bg-rose-400/10 text-rose-300'
                              : 'bg-emerald-400/10 text-emerald-300'
                          }`}
                        >
                          {soldOut ? 'Sold out' : `${vehicle.quantity} in stock`}
                        </span>
                      </div>
                      <div className="mt-8 flex items-end justify-between">
                        <div>
                          <p className="text-sm text-slate-500">{vehicle.make}</p>
                          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white">
                            {vehicle.model}
                          </h2>
                        </div>
                        <CarFront
                          aria-hidden="true"
                          className="size-12 text-slate-700 transition group-hover:text-cyan-400/40"
                        />
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-2 text-2xl font-semibold text-white">
                        <CircleDollarSign aria-hidden="true" className="size-5 text-cyan-400" />
                        {currency.format(Number(vehicle.price))}
                      </div>
                      <div className="mt-6 flex gap-3">
                        <Button
                          aria-label={
                            soldOut
                              ? 'Out of stock'
                              : buying
                                ? `Purchasing ${vehicle.make} ${vehicle.model}`
                                : `Purchase ${vehicle.make} ${vehicle.model}`
                          }
                          className="flex-1"
                          disabled={soldOut || buying}
                          onClick={() => purchase(vehicle)}
                        >
                          <ShoppingCart aria-hidden="true" className="size-4" />
                          {soldOut ? 'Out of stock' : buying ? 'Purchasing…' : 'Purchase'}
                        </Button>
                      </div>
                      {isAdmin && (
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          <Button
                            aria-label={`Edit ${vehicle.make} ${vehicle.model}`}
                            onClick={() => setDialog({ type: 'edit', vehicle })}
                            size="icon"
                            variant="outline"
                          >
                            <Pencil aria-hidden="true" className="size-4" />
                          </Button>
                          <Button
                            aria-label={`Restock ${vehicle.make} ${vehicle.model}`}
                            onClick={() => setDialog({ type: 'restock', vehicle })}
                            size="icon"
                            variant="outline"
                          >
                            <PackagePlus aria-hidden="true" className="size-4" />
                          </Button>
                          <Button
                            aria-label={`Delete ${vehicle.make} ${vehicle.model}`}
                            className="border-rose-400/20 text-rose-300 hover:border-rose-400/40 hover:bg-rose-400/10"
                            onClick={() => setDialog({ type: 'delete', vehicle })}
                            size="icon"
                            variant="outline"
                          >
                            <Trash2 aria-hidden="true" className="size-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {dialog?.type === 'create' && (
        <Dialog
          description="Create a new inventory record with its initial stock."
          onDismiss={() => setDialog(null)}
          title="Add vehicle"
        >
          <VehicleForm
            onCancel={() => setDialog(null)}
            onSubmit={saveVehicle}
            pending={pendingAction === 'save'}
          />
        </Dialog>
      )}

      {dialog?.type === 'edit' && (
        <Dialog
          description="Update descriptive fields. Stock remains on the atomic inventory path."
          onDismiss={() => setDialog(null)}
          title={`Edit ${dialog.vehicle.make} ${dialog.vehicle.model}`}
        >
          <VehicleForm
            onCancel={() => setDialog(null)}
            onSubmit={saveVehicle}
            pending={pendingAction === 'save'}
            vehicle={dialog.vehicle}
          />
        </Dialog>
      )}

      {dialog?.type === 'restock' && (
        <Dialog
          description="The quantity is added relative to current stock in one database transaction."
          onDismiss={() => setDialog(null)}
          title={`Restock ${dialog.vehicle.make} ${dialog.vehicle.model}`}
        >
          <form className="grid gap-5" onSubmit={restock}>
            <FormField id="restock-quantity" label="Restock quantity">
              <Input
                defaultValue="1"
                id="restock-quantity"
                min="1"
                name="quantity"
                required
                step="1"
                type="number"
              />
            </FormField>
            <div className="flex justify-end gap-3">
              <Button onClick={() => setDialog(null)} type="button" variant="ghost">
                Cancel
              </Button>
              <Button disabled={pendingAction === 'restock'} type="submit">
                Confirm restock
              </Button>
            </div>
          </form>
        </Dialog>
      )}

      {dialog?.type === 'delete' && (
        <Dialog
          description="Deletion waits behind any active purchase lock and cannot be undone."
          onDismiss={() => setDialog(null)}
          title={`Delete ${dialog.vehicle.make} ${dialog.vehicle.model}?`}
        >
          <div className="flex justify-end gap-3">
            <Button onClick={() => setDialog(null)} variant="ghost">
              Cancel
            </Button>
            <Button
              className="bg-rose-400 text-slate-950 hover:bg-rose-300"
              disabled={pendingAction === 'delete'}
              onClick={() => void deleteVehicle()}
            >
              Confirm delete
            </Button>
          </div>
        </Dialog>
      )}
    </main>
  );
};
