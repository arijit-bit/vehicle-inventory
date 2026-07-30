import { ArrowUpRight, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { cn } from '../../lib/utils';
import { useMediaAsset } from '../media-assets/media-asset-context-value';
import type { Vehicle } from './vehicle-api';

const titleCaseSpecification = (value: string) =>
  value
    .toLowerCase()
    .split('_')
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ');

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

interface VehicleCardProps {
  canPurchase: boolean;
  vehicle: Vehicle;
  token: string | null;
  isBuying: boolean;
  onPurchase(vehicle: Vehicle): void;
}

export const VehicleCard = ({
  canPurchase,
  vehicle,
  token,
  isBuying,
  onPurchase,
}: VehicleCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { asset: vehicleArtwork } = useMediaAsset(vehicle.imageKey);
  const soldOut = vehicle.quantity === 0;

  return (
    <Card
      aria-label={`${vehicle.make} ${vehicle.model}`}
      className="group overflow-hidden border-white/15 bg-[linear-gradient(180deg,#090a0b_0%,#0b0b0c_58%,#151517_100%)]"
      role="article"
    >
      <div className="flex items-center justify-between gap-3 px-4 pt-4 text-[10px] font-medium text-secondary">
        <span className="flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-3 py-1.5">
          <span
            aria-hidden="true"
            className="size-2 rounded-full ring-1 ring-white/15"
            style={{ backgroundColor: vehicle.colorHex }}
          />
          {vehicle.colorName}
        </span>
        <span className="flex items-center gap-3">
          <span className={cn(soldOut && 'text-red-300')}>
            {soldOut ? 'Sold out' : `${vehicle.quantity} in stock`}
          </span>
          <span className="rounded-full border border-white/15 bg-black/20 px-3 py-1.5 text-primary">
            {titleCaseSpecification(vehicle.transmission)}
          </span>
        </span>
      </div>

      <div className="relative flex h-56 items-center justify-center overflow-hidden px-1 sm:h-64">
        <div
          aria-hidden="true"
          className="absolute inset-x-12 bottom-8 h-8 rounded-full bg-black/70 blur-xl"
        />
        {vehicleArtwork && (
          <img
            alt={`${vehicle.make} ${vehicle.model}`}
            className="relative h-[90%] w-full object-contain drop-shadow-[0_24px_22px_rgba(0,0,0,0.8)] transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            decoding="async"
            loading="lazy"
            src={vehicleArtwork.publicUrl}
          />
        )}
      </div>

      <div className="p-4 pt-1 sm:p-5 sm:pt-1">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="inline-flex rounded-full border border-white/15 bg-black/20 px-2.5 py-1 text-[9px] font-medium text-secondary">
              {vehicle.year}
            </p>
            <h2 className="mt-2 text-xl font-semibold leading-tight tracking-[-0.035em] text-primary sm:text-2xl">
              {vehicle.make} {vehicle.model}
            </h2>
            <p className="mt-2 text-sm font-medium text-secondary">
              {currency.format(Number(vehicle.price))}
            </p>
          </div>
          <button
            aria-expanded={isExpanded}
            aria-label={`View ${vehicle.make} ${vehicle.model} details`}
            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border text-primary transition-colors hover:border-secondary hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
            onClick={() => setIsExpanded((expanded) => !expanded)}
            type="button"
          >
            <ArrowUpRight
              aria-hidden="true"
              className={cn('size-4 transition-transform', isExpanded && 'rotate-90')}
            />
          </button>
        </div>

        {isExpanded && (
          <div className="mt-5 border-t border-border pt-4 text-xs">
            <p className="leading-5 text-secondary">{vehicle.details}</p>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-secondary">Engine</p>
                <p className="mt-1 font-medium text-primary">{vehicle.engine}</p>
              </div>
              <div>
                <p className="text-secondary">Fuel</p>
                <p className="mt-1 font-medium text-primary">
                  {titleCaseSpecification(vehicle.fuelType)}
                </p>
              </div>
              <div>
                <p className="text-secondary">Category</p>
                <p className="mt-1 font-medium text-primary">{vehicle.category}</p>
              </div>
              <div>
                <p className="text-secondary">Availability</p>
                <p className="mt-1 font-medium text-primary">
                  {soldOut ? 'Sold out' : `${vehicle.quantity} available`}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-5">
          {token && !canPurchase ? (
            <p className="rounded-[var(--radius)] border border-border px-4 py-3 text-center text-xs text-secondary">
              Customer reservations only
            </p>
          ) : !token && !soldOut ? (
            <Button asChild className="w-full" variant="outline">
              <Link aria-label={`Sign in to reserve ${vehicle.make} ${vehicle.model}`} to="/login">
                Sign in to reserve
                <ArrowUpRight aria-hidden="true" className="size-3.5" />
              </Link>
            </Button>
          ) : (
            <Button
              aria-label={
                soldOut
                  ? 'Out of stock'
                  : isBuying
                    ? `Reserving ${vehicle.make} ${vehicle.model}`
                    : `Reserve ${vehicle.make} ${vehicle.model}`
              }
              className="w-full"
              disabled={soldOut || isBuying}
              onClick={() => onPurchase(vehicle)}
              variant="outline"
            >
              <ShoppingBag aria-hidden="true" className="size-3.5" />
              {soldOut ? 'Out of stock' : isBuying ? 'Processing…' : 'Reserve vehicle'}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
