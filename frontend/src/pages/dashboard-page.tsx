import {
  AlertTriangle,
  LayoutGrid,
  PackagePlus,
  Pencil,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { AppNavigation } from '../components/app-navigation';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Dialog, DialogContent } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { useAuth } from '../features/auth/auth-context-value';
import { CollectionControls } from '../features/vehicles/collection-controls';
import { CollectionPagination } from '../features/vehicles/collection-pagination';
import {
  VEHICLES_PER_PAGE,
  VehicleApiError,
  vehicleApi,
  type AvailabilityFilter,
  type CreateVehicleInput,
  type FuelType,
  type PriceSort,
  type Transmission,
  type UpdateVehicleInput,
  type Vehicle,
  type VehicleImageKey,
  type VehicleSearchFilters,
} from '../features/vehicles/vehicle-api';
import { VehicleCard } from '../features/vehicles/vehicle-card';
import { VehiclePreviewDialog } from '../features/vehicles/vehicle-preview-dialog';
import { cn } from '../lib/utils';

type DialogState =
  | { type: 'create' }
  | { type: 'edit'; vehicle: Vehicle }
  | { type: 'restock'; vehicle: Vehicle }
  | { type: 'reserve'; vehicle: Vehicle }
  | { type: 'delete'; vehicle: Vehicle };

type WorkspaceView = 'catalog' | 'manage';

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

const FormField = ({
  id,
  label,
  labelClassName,
  children,
}: {
  id: string;
  label: string;
  labelClassName?: string;
  children: ReactNode;
}) => (
  <div className="space-y-2">
    <Label className={labelClassName} htmlFor={id}>
      {label}
    </Label>
    {children}
  </div>
);

interface VehicleFormProps {
  vehicle?: Vehicle;
  pending: boolean;
  onCancel(): void;
  onSubmit(input: CreateVehicleInput | UpdateVehicleInput): Promise<void>;
}

const VehicleForm = ({ vehicle, pending, onCancel, onSubmit }: VehicleFormProps) => {
  const mode = vehicle ? 'edit' : 'create';
  const [imageKey, setImageKey] = useState<VehicleImageKey>(vehicle?.imageKey ?? 'ARTWORK_PENDING');

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const details = {
      make: String(form.get('make')).trim(),
      model: String(form.get('model')).trim(),
      year: Number(form.get('year')),
      category: String(form.get('category')).trim(),
      imageKey: String(form.get('imageKey')) as VehicleImageKey,
      colorName: String(form.get('colorName')).trim(),
      colorHex: String(form.get('colorHex')).trim(),
      engine: String(form.get('engine')).trim(),
      transmission: String(form.get('transmission')) as Transmission,
      fuelType: String(form.get('fuelType')) as FuelType,
      details: String(form.get('details')).trim(),
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
        <FormField id="vehicle-make" label="Make">
          <Input
            defaultValue={vehicle?.make}
            id="vehicle-make"
            maxLength={100}
            name="make"
            required
          />
        </FormField>
        <FormField id="vehicle-model" label="Model">
          <Input
            defaultValue={vehicle?.model}
            id="vehicle-model"
            maxLength={100}
            name="model"
            required
          />
        </FormField>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="vehicle-year" label="Model year">
          <Input
            defaultValue={vehicle?.year ?? new Date().getUTCFullYear()}
            id="vehicle-year"
            max="2100"
            min="1886"
            name="year"
            required
            step="1"
            type="number"
          />
        </FormField>
        <FormField id="vehicle-category" label="Category">
          <Input
            defaultValue={vehicle?.category}
            id="vehicle-category"
            maxLength={100}
            name="category"
            required
          />
        </FormField>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="vehicle-artwork" label="Vehicle artwork">
          <Select
            name="imageKey"
            onValueChange={(value) => setImageKey(value as VehicleImageKey)}
            value={imageKey}
          >
            <SelectTrigger aria-label="Vehicle artwork" className="w-full" id="vehicle-artwork">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ARTWORK_PENDING">Coming soon / Artwork pending</SelectItem>
              <SelectItem value="WHITE_RR">Silver grand tourer</SelectItem>
              <SelectItem value="BLUE_BUGATTI">Blue hypercar</SelectItem>
              <SelectItem value="GREEN_LAMBO">Green supercar</SelectItem>
              <SelectItem value="BLACK_CAR">Black supercar</SelectItem>
              <SelectItem value="BLACK_BENTLEY">Black Bentley grand tourer</SelectItem>
              <SelectItem value="GREEN_PORSCHE_911">Bright green Porsche 911</SelectItem>
              <SelectItem value="BROWN_MAYBACH">Brown Mercedes-Maybach sedan</SelectItem>
              <SelectItem value="ORANGE_AUDI_R8">Orange Audi R8</SelectItem>
              <SelectItem value="BLACK_RANGE_ROVER">Black Range Rover SUV</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <FormField id="vehicle-color-name" label="Color name">
          <Input
            defaultValue={vehicle?.colorName ?? 'Frozen Silver'}
            id="vehicle-color-name"
            maxLength={100}
            name="colorName"
            required
          />
        </FormField>
      </div>
      {imageKey === 'ARTWORK_PENDING' && (
        <div
          className="flex items-start gap-3 rounded-[var(--radius)] border border-amber-300/20 bg-amber-300/[0.06] px-4 py-3 text-amber-100"
          role="status"
        >
          <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-amber-300" />
          <p className="text-xs leading-5">
            No specific artwork selected. The Coming Soon placeholder will be displayed.
          </p>
        </div>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="vehicle-color-hex" label="Color hex">
          <Input
            defaultValue={vehicle?.colorHex ?? '#C8C9C7'}
            id="vehicle-color-hex"
            maxLength={7}
            name="colorHex"
            pattern="^#[0-9A-Fa-f]{6}$"
            required
          />
        </FormField>
        <FormField id="vehicle-engine" label="Engine">
          <Input
            defaultValue={vehicle?.engine}
            id="vehicle-engine"
            maxLength={160}
            name="engine"
            required
          />
        </FormField>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="vehicle-transmission" label="Transmission">
          <Select defaultValue={vehicle?.transmission ?? 'AUTOMATIC'} name="transmission">
            <SelectTrigger aria-label="Transmission" className="w-full" id="vehicle-transmission">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AUTOMATIC">Automatic</SelectItem>
              <SelectItem value="MANUAL">Manual</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <FormField id="vehicle-fuel-type" label="Fuel type">
          <Select defaultValue={vehicle?.fuelType ?? 'PETROL'} name="fuelType">
            <SelectTrigger aria-label="Fuel type" className="w-full" id="vehicle-fuel-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PETROL">Petrol</SelectItem>
              <SelectItem value="GASOLINE">Gasoline</SelectItem>
              <SelectItem value="DIESEL">Diesel</SelectItem>
              <SelectItem value="HYBRID">Hybrid</SelectItem>
              <SelectItem value="ELECTRIC">Electric</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      </div>
      <FormField id="vehicle-details" label="Vehicle details">
        <textarea
          className="min-h-28 w-full resize-y rounded-[var(--radius)] border border-border bg-card px-4 py-3 text-sm text-primary outline-none transition-colors placeholder:text-secondary/70 focus:border-secondary/60 focus:ring-2 focus:ring-primary/20"
          defaultValue={vehicle?.details}
          id="vehicle-details"
          maxLength={2000}
          name="details"
          required
        />
      </FormField>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="vehicle-price" label="Price">
          <Input
            defaultValue={vehicle?.price}
            id="vehicle-price"
            min="0"
            name="price"
            required
            step="0.01"
            type="number"
          />
        </FormField>
        {mode === 'create' && (
          <FormField id="vehicle-quantity" label="Initial quantity">
            <Input
              defaultValue="0"
              id="vehicle-quantity"
              min="0"
              name="quantity"
              required
              step="1"
              type="number"
            />
          </FormField>
        )}
      </div>
      {mode === 'edit' && (
        <p className="rounded-[var(--radius)] border border-border bg-background/45 px-4 py-3 text-xs leading-5 text-secondary">
          Stock changes remain on the purchase and restock workflows to protect inventory accuracy.
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
  const [previewVehicleId, setPreviewVehicleId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [filters, setFilters] = useState<VehicleSearchFilters>({});
  const [appliedFilters, setAppliedFilters] = useState<VehicleSearchFilters>({});
  const [availability, setAvailability] = useState<AvailabilityFilter>('all');
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>('catalog');
  const [brand, setBrand] = useState('all');
  const [brands, setBrands] = useState<string[]>([]);
  const [priceSort, setPriceSort] = useState<PriceSort>('featured');
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    limit: VEHICLES_PER_PAGE,
    skip: 0,
    total: 0,
  });
  const [refreshVersion, setRefreshVersion] = useState(0);

  const handleInventoryError = useCallback(
    (error: unknown) => {
      if (
        error instanceof VehicleApiError &&
        (error.status === 401 || error.code === 'UNAUTHENTICATED')
      ) {
        logout();
        return;
      }

      setFeedback({ tone: 'error', message: readableInventoryError(error) });
    },
    [logout],
  );

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    const requestFilters: VehicleSearchFilters = {
      ...appliedFilters,
      ...(brand === 'all' ? {} : { make: brand }),
      ...(availability === 'all' ? {} : { availability }),
      ...(priceSort === 'featured' ? {} : { sort: priceSort }),
    };
    const requestedPage = {
      limit: VEHICLES_PER_PAGE,
      skip: (page - 1) * VEHICLES_PER_PAGE,
    };
    const inventoryRequest =
      Object.keys(requestFilters).length === 0
        ? vehicleApi.list(token, requestedPage)
        : vehicleApi.search(token, requestFilters, requestedPage);

    inventoryRequest
      .then((result) => {
        if (active) {
          const lastPage = Math.max(1, Math.ceil(result.pagination.total / VEHICLES_PER_PAGE));

          if (page > lastPage) {
            setPage(lastPage);
            return;
          }

          setVehicles(result.vehicles);
          setPagination(result.pagination);
          setBrands(result.brands);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          handleInventoryError(error);
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
  }, [
    appliedFilters,
    availability,
    brand,
    handleInventoryError,
    page,
    priceSort,
    refreshVersion,
    token,
  ]);

  const runAction = async (key: string, action: () => Promise<void>) => {
    setPendingAction(key);
    setFeedback(null);

    try {
      await action();
    } catch (error) {
      handleInventoryError(error);
    } finally {
      setPendingAction(null);
    }
  };

  const requestReservation = (vehicle: Vehicle) => {
    if (!token || vehicle.quantity === 0) {
      return;
    }

    setFeedback(null);
    setDialog({ type: 'reserve', vehicle });
  };

  const requestReservationFromPreview = (vehicle: Vehicle) => {
    setPreviewVehicleId(null);
    requestReservation(vehicle);
  };

  const showPreviousPreview = useCallback(() => {
    setPreviewVehicleId((currentId) => {
      if (!currentId || vehicles.length < 2) return currentId;
      const currentIndex = vehicles.findIndex((vehicle) => vehicle.id === currentId);
      const previousIndex = (currentIndex - 1 + vehicles.length) % vehicles.length;
      return vehicles[previousIndex]?.id ?? currentId;
    });
  }, [vehicles]);

  const showNextPreview = useCallback(() => {
    setPreviewVehicleId((currentId) => {
      if (!currentId || vehicles.length < 2) return currentId;
      const currentIndex = vehicles.findIndex((vehicle) => vehicle.id === currentId);
      const nextIndex = (currentIndex + 1) % vehicles.length;
      return vehicles[nextIndex]?.id ?? currentId;
    });
  }, [vehicles]);

  const confirmReservation = async () => {
    if (!token || dialog?.type !== 'reserve' || dialog.vehicle.quantity === 0) {
      return;
    }

    const vehicle = dialog.vehicle;
    await runAction(`purchase-${vehicle.id}`, async () => {
      const { vehicle: updated } = await vehicleApi.purchase(token, vehicle.id, 1);
      setVehicles((current) => replaceVehicle(current, updated));
      setFeedback({
        tone: 'success',
        message: `${updated.make} ${updated.model} reserved. ${updated.quantity} remaining. View it in Orders.`,
      });
    });
    setDialog(null);
  };

  const searchInventory = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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

    setAppliedFilters(normalized);
    setBrand('all');
    setPage(1);
    setFeedback(null);
  };

  const clearSearch = () => {
    setFilters({});
    setAppliedFilters({});
    setPage(1);
    setFeedback(null);
  };

  const saveVehicle = async (input: CreateVehicleInput | UpdateVehicleInput) => {
    if (!token || !dialog || (dialog.type !== 'create' && dialog.type !== 'edit')) {
      return;
    }

    const currentDialog = dialog;
    await runAction('save', async () => {
      if (currentDialog.type === 'create') {
        const result = await vehicleApi.create(token, input as CreateVehicleInput);
        if (
          page === 1 &&
          Object.keys(appliedFilters).length === 0 &&
          brand === 'all' &&
          availability === 'all' &&
          priceSort === 'featured'
        ) {
          setVehicles((current) => [result.vehicle, ...current].slice(0, VEHICLES_PER_PAGE));
          setPagination((current) => ({ ...current, total: current.total + 1 }));
          setBrands((current) => [...new Set([...current, result.vehicle.make])].sort());
        } else {
          setPage(1);
          setRefreshVersion((current) => current + 1);
        }
        setFeedback({ tone: 'success', message: 'Vehicle added to the collection.' });
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
      setFeedback({ tone: 'success', message: `${vehicle.make} ${vehicle.model} restocked.` });
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
      const nextTotal = Math.max(0, pagination.total - 1);
      const lastPage = Math.max(1, Math.ceil(nextTotal / VEHICLES_PER_PAGE));
      setPagination((current) => ({ ...current, total: nextTotal }));
      if (page > lastPage) {
        setPage(lastPage);
      }
      setDialog(null);
      setFeedback({ tone: 'success', message: 'Vehicle removed from the collection.' });
    });
  };

  const isAdmin = user?.role === 'ADMIN';
  const canManageInventory = user?.role === 'EMPLOYEE' || isAdmin;
  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit));
  const firstResult = pagination.total === 0 ? 0 : pagination.skip + 1;
  const lastResult = Math.min(pagination.skip + vehicles.length, pagination.total);
  const previewVehicleIndex = vehicles.findIndex((vehicle) => vehicle.id === previewVehicleId);
  const previewVehicle = previewVehicleIndex >= 0 ? vehicles[previewVehicleIndex] : undefined;
  const resultLabel =
    pagination.total === 0
      ? '0 vehicles'
      : pagination.total === 1
        ? 'Showing 1 of 1 vehicle'
        : `Showing ${firstResult}–${lastResult} of ${pagination.total} vehicles`;

  return (
    <div className="min-h-screen bg-background text-primary">
      <div
        aria-hidden="true"
        className="luxury-grid pointer-events-none fixed inset-0 opacity-45"
      />
      <AppNavigation active="inventory" onLogout={logout} user={user} />

      <main className="relative mx-auto max-w-[1440px] px-4 pb-16 pt-14 sm:px-6 lg:px-10">
        <section id="collection">
          <div className="flex flex-col gap-8 pb-10 min-[1170px]:flex-row min-[1170px]:items-center min-[1170px]:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-secondary">
                Curated inventory · {pagination.total}{' '}
                {pagination.total === 1 ? 'vehicle' : 'vehicles'}
              </p>
              <h1 className="mt-3 text-4xl font-bold tracking-[-0.055em] sm:text-5xl">
                Our Collection
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-secondary">
                Exceptional vehicles, selected for provenance, specification, and presence.
              </p>
            </div>
            <CollectionControls
              availability={availability}
              brand={brand}
              brands={brands}
              onAvailabilityChange={(value) => {
                setAvailability(value);
                setPage(1);
              }}
              onBrandChange={(value) => {
                setBrand(value);
                setPage(1);
              }}
              onPriceSortChange={(value) => {
                setPriceSort(value);
                setPage(1);
              }}
              onToggleSearch={() => setSearchExpanded((expanded) => !expanded)}
              priceSort={priceSort}
              searchExpanded={searchExpanded}
            />
          </div>

          {canManageInventory && (
            <div className="mt-6 flex justify-end">
              <div
                aria-label="Inventory workspace"
                className="inline-flex rounded-[var(--radius)] border border-border bg-card p-1"
                role="group"
              >
                {(
                  [
                    ['catalog', 'Browse collection', LayoutGrid],
                    ['manage', 'Manage inventory', Settings2],
                  ] as const
                ).map(([value, label, Icon]) => (
                  <button
                    aria-current={workspaceView === value ? 'page' : undefined}
                    className={cn(
                      'flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-medium text-secondary transition-colors hover:text-primary',
                      workspaceView === value && 'bg-primary text-background hover:text-background',
                    )}
                    key={value}
                    onClick={() => setWorkspaceView(value)}
                    type="button"
                  >
                    <Icon aria-hidden="true" className="size-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {searchExpanded && workspaceView === 'catalog' && (
            <Card className="mt-6 overflow-hidden rounded-3xl p-5">
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
                  <FormField
                    id={`filter-${field}`}
                    key={field}
                    label={label!}
                    labelClassName="block text-center"
                  >
                    <Input
                      className="rounded-full"
                      id={`filter-${field}`}
                      onChange={(event) =>
                        setFilters((current) => ({ ...current, [field!]: event.target.value }))
                      }
                      placeholder={
                        field?.includes('Price') ? '0.00' : `Any ${label?.toLowerCase()}`
                      }
                      type={field?.includes('Price') ? 'number' : 'text'}
                      value={filters[field as keyof VehicleSearchFilters] ?? ''}
                    />
                  </FormField>
                ))}
                <div className="flex gap-2">
                  <Button
                    aria-label="Search inventory"
                    className="rounded-full"
                    disabled={isLoading}
                    size="icon"
                    type="submit"
                  >
                    <Search aria-hidden="true" className="size-4" />
                  </Button>
                  <Button
                    aria-label="Clear search"
                    className="rounded-full"
                    onClick={clearSearch}
                    size="icon"
                    type="button"
                    variant="ghost"
                  >
                    <X aria-hidden="true" className="size-4" />
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {feedback && (
            <div
              className={cn(
                'mt-6 rounded-[var(--radius)] border px-5 py-4 text-sm',
                feedback.tone === 'error'
                  ? 'border-red-400/20 bg-red-400/8 text-red-200'
                  : 'border-border bg-card text-primary',
              )}
              role={feedback.tone === 'error' ? 'alert' : 'status'}
            >
              {feedback.message}
            </div>
          )}

          {workspaceView === 'manage' && canManageInventory ? (
            <section aria-label="Inventory management" className="pt-8">
              <Card className="overflow-hidden">
                <div className="flex flex-col gap-5 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-secondary">
                      {isAdmin ? 'Administrator controls' : 'Employee controls'}
                    </p>
                    <h2 className="mt-2 text-xl font-semibold">Inventory management</h2>
                    <p className="mt-1 text-xs text-secondary">
                      {pagination.total} inventory {pagination.total === 1 ? 'record' : 'records'}
                    </p>
                  </div>
                  <Button onClick={() => setDialog({ type: 'create' })}>
                    <Plus aria-hidden="true" className="size-4" />
                    Add vehicle
                  </Button>
                </div>

                {vehicles.length === 0 ? (
                  <div className="p-12 text-center text-sm text-secondary">
                    No inventory records yet.
                  </div>
                ) : (
                  <Table aria-label="Vehicle management">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-5 sm:pl-6">Vehicle</TableHead>
                        <TableHead className="hidden sm:table-cell">Category</TableHead>
                        <TableHead className="hidden md:table-cell">Price</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead className="pr-5 text-right sm:pr-6">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vehicles.map((vehicle) => (
                        <TableRow key={vehicle.id}>
                          <TableCell className="pl-5 sm:pl-6">
                            <div className="font-medium text-primary">
                              {vehicle.make} {vehicle.model}
                            </div>
                            <div className="mt-1 text-xs text-secondary sm:hidden">
                              {vehicle.category} · {currency.format(Number(vehicle.price))}
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">{vehicle.category}</TableCell>
                          <TableCell className="hidden font-medium text-primary md:table-cell">
                            {currency.format(Number(vehicle.price))}
                          </TableCell>
                          <TableCell>{vehicle.quantity}</TableCell>
                          <TableCell className="pr-5 sm:pr-6">
                            <div className="flex justify-end gap-1">
                              <Button
                                aria-label={`Edit ${vehicle.make} ${vehicle.model}`}
                                onClick={() => setDialog({ type: 'edit', vehicle })}
                                size="icon"
                                variant="ghost"
                              >
                                <Pencil aria-hidden="true" className="size-4" />
                              </Button>
                              {isAdmin && (
                                <>
                                  <Button
                                    aria-label={`Restock ${vehicle.make} ${vehicle.model}`}
                                    onClick={() => setDialog({ type: 'restock', vehicle })}
                                    size="icon"
                                    variant="ghost"
                                  >
                                    <PackagePlus aria-hidden="true" className="size-4" />
                                  </Button>
                                  <Button
                                    aria-label={`Delete ${vehicle.make} ${vehicle.model}`}
                                    onClick={() => setDialog({ type: 'delete', vehicle })}
                                    size="icon"
                                    variant="destructive"
                                  >
                                    <Trash2 aria-hidden="true" className="size-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Card>
              <CollectionPagination
                currentPage={page}
                disabled={isLoading}
                onPageChange={setPage}
                totalPages={totalPages}
              />
            </section>
          ) : (
            <section aria-busy={isLoading} aria-label="Vehicle inventory" className="pt-8">
              <p
                aria-live="polite"
                className="mb-6 text-xs uppercase tracking-[0.16em] text-secondary"
              >
                {resultLabel}
              </p>

              {isLoading ? (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {[0, 1, 2, 3, 4, 5].map((item) => (
                    <div
                      aria-hidden="true"
                      className="h-[420px] animate-pulse rounded-[var(--radius)] border border-border bg-card"
                      key={item}
                    />
                  ))}
                </div>
              ) : vehicles.length === 0 ? (
                <Card className="p-12 text-center">
                  <AlertTriangle aria-hidden="true" className="mx-auto size-6 text-secondary" />
                  <h2 className="mt-4 text-lg font-semibold">No vehicles found</h2>
                  <p className="mt-2 text-sm text-secondary">
                    Adjust your filters to continue exploring the collection.
                  </p>
                </Card>
              ) : (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {vehicles.map((vehicle) => (
                    <VehicleCard
                      canPurchase={user?.role === 'CUSTOMER'}
                      isBuying={pendingAction === `purchase-${vehicle.id}`}
                      key={vehicle.id}
                      onPurchase={requestReservation}
                      onPreview={(selectedVehicle) => setPreviewVehicleId(selectedVehicle.id)}
                      token={token}
                      vehicle={vehicle}
                    />
                  ))}
                </div>
              )}
              {!isLoading && vehicles.length > 0 && (
                <CollectionPagination
                  currentPage={page}
                  onPageChange={setPage}
                  totalPages={totalPages}
                />
              )}
            </section>
          )}
        </section>

        <section
          className="mt-20 grid gap-6 border-t border-border pt-10 md:grid-cols-3"
          id="private-sales"
        >
          {[
            [
              '01',
              'Private sourcing',
              'A discreet search for exact specifications and provenance.',
            ],
            [
              '02',
              'Verified inventory',
              'Every listing is managed through protected stock workflows.',
            ],
            ['03', 'Dedicated concierge', 'Personal support from reservation through handover.'],
          ].map(([number, title, description]) => (
            <div key={number}>
              <p className="text-[10px] font-semibold tracking-[0.18em] text-secondary">{number}</p>
              <h2 className="mt-4 text-base font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-secondary">{description}</p>
            </div>
          ))}
        </section>
      </main>

      {previewVehicle && (
        <VehiclePreviewDialog
          canPurchase={user?.role === 'CUSTOMER'}
          isBuying={pendingAction === `purchase-${previewVehicle.id}`}
          onClose={() => setPreviewVehicleId(null)}
          onNext={showNextPreview}
          onPrevious={showPreviousPreview}
          onReserve={requestReservationFromPreview}
          position={previewVehicleIndex + 1}
          token={token}
          total={vehicles.length}
          vehicle={previewVehicle}
        />
      )}

      {dialog?.type === 'create' && (
        <Dialog onOpenChange={(open) => !open && setDialog(null)} open>
          <DialogContent
            description="Create a new collection record with its initial stock."
            title="Add vehicle"
          >
            <VehicleForm
              onCancel={() => setDialog(null)}
              onSubmit={saveVehicle}
              pending={pendingAction === 'save'}
            />
          </DialogContent>
        </Dialog>
      )}

      {dialog?.type === 'edit' && (
        <Dialog onOpenChange={(open) => !open && setDialog(null)} open>
          <DialogContent
            description="Update the vehicle specification without replacing live stock."
            title={`Edit ${dialog.vehicle.make} ${dialog.vehicle.model}`}
          >
            <VehicleForm
              onCancel={() => setDialog(null)}
              onSubmit={saveVehicle}
              pending={pendingAction === 'save'}
              vehicle={dialog.vehicle}
            />
          </DialogContent>
        </Dialog>
      )}

      {dialog?.type === 'restock' && (
        <Dialog onOpenChange={(open) => !open && setDialog(null)} open>
          <DialogContent
            description={`Increase stock for ${dialog.vehicle.make} ${dialog.vehicle.model}.`}
            title="Restock vehicle"
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
          </DialogContent>
        </Dialog>
      )}

      {dialog?.type === 'reserve' && (
        <Dialog onOpenChange={(open) => !open && setDialog(null)} open>
          <DialogContent
            description="Review the vehicle and reservation impact before placing the order."
            title={`Reserve ${dialog.vehicle.make} ${dialog.vehicle.model}`}
          >
            <div className="overflow-hidden rounded-[var(--radius)] border border-white/15 bg-background/60">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-secondary">
                  Reservation summary
                </p>
                <span className="rounded-full border border-white/15 px-2.5 py-1 text-[10px] text-secondary">
                  {dialog.vehicle.year}
                </span>
              </div>
              <div className="px-5 py-5">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xl font-semibold tracking-[-0.035em]">
                      {dialog.vehicle.make} {dialog.vehicle.model}
                    </p>
                    <p className="mt-1 text-xs text-secondary">{dialog.vehicle.category}</p>
                  </div>
                  <p className="text-lg font-semibold">
                    {currency.format(Number(dialog.vehicle.price))}
                  </p>
                </div>
                <div className="mt-5 grid grid-cols-3 divide-x divide-white/10 border-t border-white/10 pt-4 text-center">
                  <div>
                    <p className="text-lg font-semibold">{dialog.vehicle.quantity}</p>
                    <p className="mt-1 text-[9px] uppercase tracking-[0.16em] text-secondary">
                      In stock
                    </p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold">1</p>
                    <p className="mt-1 text-[9px] uppercase tracking-[0.16em] text-secondary">
                      Reserving
                    </p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{dialog.vehicle.quantity - 1}</p>
                    <p className="mt-1 text-[9px] uppercase tracking-[0.16em] text-secondary">
                      Remaining
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-start gap-3 rounded-[var(--radius)] border border-white/10 bg-white/[0.03] p-4">
              <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-secondary" />
              <p className="text-xs leading-5 text-secondary">
                Confirming creates an order and immediately reduces stock by one. You can cancel
                later from Orders to restore the vehicle to inventory.
              </p>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                disabled={pendingAction === `purchase-${dialog.vehicle.id}`}
                onClick={() => setDialog(null)}
                type="button"
                variant="ghost"
              >
                Keep browsing
              </Button>
              <Button
                disabled={pendingAction === `purchase-${dialog.vehicle.id}`}
                onClick={() => void confirmReservation()}
                type="button"
              >
                <ShoppingBag aria-hidden="true" className="size-4" />
                {pendingAction === `purchase-${dialog.vehicle.id}`
                  ? 'Reserving...'
                  : 'Confirm reservation'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {dialog?.type === 'delete' && (
        <Dialog onOpenChange={(open) => !open && setDialog(null)} open>
          <DialogContent
            description={`This permanently removes ${dialog.vehicle.make} ${dialog.vehicle.model} from the catalog. This action cannot be undone.`}
            title="Delete vehicle"
          >
            <div className="rounded-[var(--radius)] border border-red-400/20 bg-red-400/8 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 text-red-300" />
                <p className="text-sm leading-6 text-red-100">
                  Current stock: {dialog.vehicle.quantity}. Confirm only after verifying that no
                  active sale depends on this record.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button onClick={() => setDialog(null)} type="button" variant="ghost">
                Cancel
              </Button>
              <Button
                disabled={pendingAction === 'delete'}
                onClick={() => void deleteVehicle()}
                variant="destructive"
              >
                {pendingAction === 'delete' ? 'Deleting…' : 'Confirm delete'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
