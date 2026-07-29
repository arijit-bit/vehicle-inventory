import { ArrowUpRight, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import blackVehicle from '../../assets/svg/Middle-black-car.svg';
import whiteVehicle from '../../assets/svg/White-RR.svg';
import blueVehicle from '../../assets/svg/blue-buggati.svg';
import heroVehicle from '../../assets/svg/Final-CarHero Page.svg';
import greenVehicle from '../../assets/svg/green-lambo.svg';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { cn } from '../../lib/utils';
import type { Vehicle } from './vehicle-api';

const presentation = [
  { color: 'Frozen Silver', dot: '#c8c9c7', image: whiteVehicle },
  { color: 'Midnight Blue', dot: '#233b72', image: blueVehicle },
  { color: 'Verde Mantis', dot: '#4d8d42', image: greenVehicle },
  { color: 'Obsidian Black', dot: '#333336', image: blackVehicle },
  { color: 'Arctic White', dot: '#ecebea', image: heroVehicle },
] as const;

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

interface VehicleCardProps {
  vehicle: Vehicle;
  index: number;
  token: string | null;
  isBuying: boolean;
  onPurchase(vehicle: Vehicle): void;
}

export const VehicleCard = ({ vehicle, index, token, isBuying, onPurchase }: VehicleCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const style = presentation[index % presentation.length]!;
  const soldOut = vehicle.quantity === 0;
  const year = new Date(vehicle.createdAt).getUTCFullYear();

  return (
    <Card
      aria-label={`${vehicle.make} ${vehicle.model}`}
      className="group overflow-hidden bg-card"
      role="article"
    >
      <div className="flex items-center justify-between px-5 pt-5 text-[10px] font-medium uppercase tracking-[0.14em] text-secondary">
        <span className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="size-2 rounded-full ring-1 ring-white/15"
            style={{ backgroundColor: style.dot }}
          />
          {style.color}
        </span>
        <span className="flex items-center gap-3">
          <span className={cn(soldOut && 'text-red-300')}>
            {soldOut ? 'Sold out' : `${vehicle.quantity} in stock`}
          </span>
          <span>Automatic</span>
        </span>
      </div>

      <div className="relative flex h-52 items-center justify-center overflow-hidden px-3 sm:h-60">
        <div
          aria-hidden="true"
          className="absolute inset-x-12 bottom-8 h-8 rounded-full bg-black/70 blur-xl"
        />
        <img
          alt={`${vehicle.make} ${vehicle.model}`}
          className="relative h-[78%] w-full object-contain drop-shadow-[0_24px_22px_rgba(0,0,0,0.75)] transition-transform duration-500 ease-out group-hover:scale-[1.035]"
          src={style.image}
        />
      </div>

      <div className="border-t border-border p-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary">
              {year} · {vehicle.make}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-primary">
              {vehicle.model}
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
          <div className="mt-5 grid grid-cols-2 border-t border-border pt-4 text-xs">
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
        )}

        <div className="mt-5">
          {!token && !soldOut ? (
            <Button asChild className="w-full" variant="outline">
              <Link aria-label={`Sign in to purchase ${vehicle.make} ${vehicle.model}`} to="/login">
                Sign in to purchase
                <ArrowUpRight aria-hidden="true" className="size-3.5" />
              </Link>
            </Button>
          ) : (
            <Button
              aria-label={
                soldOut
                  ? 'Out of stock'
                  : isBuying
                    ? `Purchasing ${vehicle.make} ${vehicle.model}`
                    : `Purchase ${vehicle.make} ${vehicle.model}`
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
