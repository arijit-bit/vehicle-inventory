import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ArrowRight, ChevronLeft, ChevronRight, Gauge, ShoppingBag, X } from 'lucide-react';
import { useEffect, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { cn } from '../../lib/utils';
import { useMediaAsset } from '../media-assets/media-asset-context-value';
import type { Vehicle } from './vehicle-api';

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const titleCaseSpecification = (value: string) =>
  value
    .toLowerCase()
    .split('_')
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ');

interface VehiclePreviewDialogProps {
  canPurchase: boolean;
  isBuying: boolean;
  onClose(): void;
  onNext(): void;
  onPrevious(): void;
  onReserve(vehicle: Vehicle): void;
  position: number;
  token: string | null;
  total: number;
  vehicle: Vehicle;
}

const PreviewAction = ({
  canPurchase,
  isBuying,
  onReserve,
  token,
  vehicle,
}: Pick<
  VehiclePreviewDialogProps,
  'canPurchase' | 'isBuying' | 'onReserve' | 'token' | 'vehicle'
>) => {
  const soldOut = vehicle.quantity === 0;

  if (!token && !soldOut) {
    return (
      <Button asChild className="h-14 w-full rounded-full text-sm" size="lg">
        <Link to="/login">
          Sign in to reserve
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </Button>
    );
  }

  if (token && !canPurchase) {
    return (
      <div className="rounded-full border border-white/15 bg-white/[0.04] px-5 py-4 text-center text-xs text-white/60">
        Customer reservations only
      </div>
    );
  }

  return (
    <Button
      className="h-14 w-full rounded-full text-sm"
      disabled={soldOut || isBuying}
      onClick={() => onReserve(vehicle)}
      size="lg"
      type="button"
    >
      <ShoppingBag aria-hidden="true" className="size-4" />
      {soldOut ? 'Currently unavailable' : isBuying ? 'Processing...' : 'Reserve this vehicle'}
    </Button>
  );
};

export const VehiclePreviewDialog = ({
  canPurchase,
  isBuying,
  onClose,
  onNext,
  onPrevious,
  onReserve,
  position,
  token,
  total,
  vehicle,
}: VehiclePreviewDialogProps) => {
  const { asset: vehicleArtwork } = useMediaAsset(vehicle.imageKey);
  const hasMultipleVehicles = total > 1;
  const soldOut = vehicle.quantity === 0;
  const previewStyle = {
    '--vehicle-accent': vehicle.colorHex,
  } as CSSProperties;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!hasMultipleVehicles) return;

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        onPrevious();
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        onNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasMultipleVehicles, onNext, onPrevious]);

  return (
    <DialogPrimitive.Root onOpenChange={(open) => !open && onClose()} open>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl" />
        <DialogPrimitive.Content
          className="vehicle-preview fixed inset-0 z-50 overflow-y-auto bg-[#070708] text-white outline-none"
          style={previewStyle}
        >
          <DialogPrimitive.Title className="sr-only">
            {vehicle.make} {vehicle.model} preview
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Full-screen vehicle preview with specifications, pricing, reservation, and collection
            navigation.
          </DialogPrimitive.Description>

          <div aria-hidden="true" className="vehicle-preview__atmosphere absolute inset-0" />
          <div aria-hidden="true" className="luxury-grid absolute inset-0 opacity-35" />
          <div
            aria-hidden="true"
            className="absolute left-1/2 top-[44%] h-[38vw] max-h-[580px] min-h-72 w-[70vw] max-w-[1060px] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-white/[0.06]"
          />
          <div
            aria-hidden="true"
            className="absolute left-1/2 top-[44%] h-[27vw] max-h-[410px] min-h-52 w-[54vw] max-w-[820px] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-white/[0.045]"
          />

          <header className="relative z-20 flex items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
            <div className="flex items-center gap-3">
              <span className="size-1.5 rounded-full bg-white shadow-[0_0_16px_white]" />
              <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-white/55 sm:text-[10px]">
                MotoVault / Private viewing
              </p>
            </div>

            <div className="flex items-center gap-3 sm:gap-5">
              <p className="hidden text-[10px] uppercase tracking-[0.22em] text-white/45 sm:block">
                {String(position).padStart(2, '0')} / {String(total).padStart(2, '0')}
              </p>
              <DialogPrimitive.Close
                aria-label="Close vehicle preview"
                className="flex size-11 items-center justify-center rounded-full border border-white/15 bg-black/20 text-white/75 transition duration-300 hover:rotate-90 hover:border-white/35 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              >
                <X aria-hidden="true" className="size-4" />
              </DialogPrimitive.Close>
            </div>
          </header>

          <main className="relative z-10 mx-auto grid min-h-[calc(100dvh-86px)] max-w-[1680px] grid-cols-1 gap-6 px-5 pb-48 sm:px-8 lg:grid-cols-[minmax(230px,0.8fr)_minmax(430px,1.75fr)_minmax(250px,0.85fr)] lg:items-end lg:gap-8 lg:px-12 lg:pb-12">
            <section className="order-2 self-end pb-2 lg:order-1 lg:pb-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-white/45">
                {vehicle.make} / {vehicle.year}
              </p>
              <h2 className="mt-4 max-w-sm text-4xl font-semibold leading-[0.95] tracking-[-0.06em] sm:text-5xl lg:text-[clamp(3rem,4vw,5.5rem)]">
                {vehicle.model}
              </h2>
              <p className="mt-6 max-w-sm text-sm leading-7 text-white/55">{vehicle.details}</p>

              <dl className="mt-8 grid max-w-sm grid-cols-2 gap-x-5 gap-y-5 border-t border-white/10 pt-6">
                {[
                  ['Engine', vehicle.engine],
                  ['Transmission', titleCaseSpecification(vehicle.transmission)],
                  ['Powertrain', titleCaseSpecification(vehicle.fuelType)],
                  ['Body', vehicle.category],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-[9px] uppercase tracking-[0.2em] text-white/35">{label}</dt>
                    <dd className="mt-1.5 text-xs font-medium leading-5 text-white/85">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="relative order-1 flex min-h-[43vh] items-center justify-center lg:order-2 lg:min-h-[calc(100dvh-150px)] lg:self-stretch">
              <p
                aria-hidden="true"
                className="vehicle-preview__ghost absolute left-1/2 top-[20%] w-[130%] -translate-x-1/2 text-center text-[clamp(4.5rem,11vw,12rem)] font-black uppercase leading-none tracking-[-0.08em]"
              >
                {vehicle.make}
              </p>

              <div aria-hidden="true" className="vehicle-preview__floor absolute bottom-[18%]" />

              {vehicleArtwork ? (
                <img
                  alt={`${vehicle.make} ${vehicle.model}`}
                  className="vehicle-preview__car relative z-10 max-h-[48vh] w-full max-w-[960px] object-contain lg:max-h-[64vh]"
                  decoding="async"
                  src={vehicleArtwork.publicUrl}
                />
              ) : (
                <div className="relative z-10 flex aspect-[16/8] w-full max-w-3xl items-center justify-center rounded-[50%] border border-white/10 bg-white/[0.02]">
                  <Gauge aria-hidden="true" className="size-10 text-white/25" />
                  <span className="sr-only">Vehicle artwork unavailable</span>
                </div>
              )}

              <div className="absolute inset-x-0 bottom-1 z-20 flex items-center justify-center gap-3 lg:bottom-8 lg:justify-between">
                <button
                  aria-label="Previous vehicle"
                  className="group flex size-12 items-center justify-center rounded-full border border-white/15 bg-black/35 text-white transition hover:border-white/40 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:opacity-30 lg:size-14"
                  disabled={!hasMultipleVehicles}
                  onClick={onPrevious}
                  type="button"
                >
                  <ChevronLeft
                    aria-hidden="true"
                    className="size-5 transition-transform group-hover:-translate-x-0.5"
                  />
                </button>
                <p className="px-3 text-[9px] uppercase tracking-[0.2em] text-white/35 lg:hidden">
                  {String(position).padStart(2, '0')} / {String(total).padStart(2, '0')}
                </p>
                <button
                  aria-label="Next vehicle"
                  className="group flex size-12 items-center justify-center rounded-full border border-white/15 bg-black/35 text-white transition hover:border-white/40 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:opacity-30 lg:size-14"
                  disabled={!hasMultipleVehicles}
                  onClick={onNext}
                  type="button"
                >
                  <ChevronRight
                    aria-hidden="true"
                    className="size-5 transition-transform group-hover:translate-x-0.5"
                  />
                </button>
              </div>
            </section>

            <aside className="fixed inset-x-3 bottom-3 z-30 rounded-[24px] border border-white/10 bg-black/80 p-4 shadow-2xl backdrop-blur-xl lg:static lg:order-3 lg:mb-8 lg:self-end lg:rounded-[28px] lg:bg-black/25 lg:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-white/40">
                    Private acquisition
                  </p>
                  <p className="mt-2 text-2xl font-semibold tracking-[-0.055em] lg:mt-3 lg:text-4xl">
                    {currency.format(Number(vehicle.price))}
                  </p>
                </div>
                <span
                  className="mt-1 size-3 rounded-full border border-white/25 shadow-[0_0_20px_var(--vehicle-accent)]"
                  style={{ backgroundColor: vehicle.colorHex }}
                  title={vehicle.colorName}
                />
              </div>

              <div className="my-6 hidden items-center justify-between border-y border-white/10 py-4 text-xs lg:flex">
                <span className="text-white/45">Availability</span>
                <span className={cn('font-medium', soldOut ? 'text-red-300' : 'text-white/85')}>
                  {soldOut ? 'Sold out' : `${vehicle.quantity} available`}
                </span>
              </div>

              <PreviewAction
                canPurchase={canPurchase}
                isBuying={isBuying}
                onReserve={onReserve}
                token={token}
                vehicle={vehicle}
              />
              <p className="mt-4 text-center text-[9px] uppercase tracking-[0.16em] text-white/30">
                Secure reservation / verified inventory
              </p>
            </aside>
          </main>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
