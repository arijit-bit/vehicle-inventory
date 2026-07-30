import { Search, X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import type { AvailabilityFilter, PriceSort } from './vehicle-api';

interface CollectionControlsProps {
  availability: AvailabilityFilter;
  brands: string[];
  brand: string;
  priceSort: PriceSort;
  searchExpanded: boolean;
  onAvailabilityChange(value: AvailabilityFilter): void;
  onBrandChange(value: string): void;
  onPriceSortChange(value: PriceSort): void;
  onToggleSearch(): void;
}

export const CollectionControls = ({
  availability,
  brands,
  brand,
  priceSort,
  searchExpanded,
  onAvailabilityChange,
  onBrandChange,
  onPriceSortChange,
  onToggleSearch,
}: CollectionControlsProps) => (
  <div className="flex w-full flex-wrap items-center gap-1.5 rounded-full border border-white/15 bg-card/70 p-1.5 lg:w-auto lg:justify-end">
    <Select onValueChange={onBrandChange} value={brand}>
      <SelectTrigger
        aria-label="Filter By Brand"
        className="flex-1 rounded-full border border-white/12 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20 transition-colors sm:flex-none"
      >
        <SelectValue placeholder="Filter By Brand" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All brands</SelectItem>
        {brands.map((item) => (
          <SelectItem key={item} value={item}>
            {item}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>

    <Select
      onValueChange={(value) => onAvailabilityChange(value as AvailabilityFilter)}
      value={availability}
    >
      <SelectTrigger
        aria-label="Filter By Availability"
        className="flex-1 rounded-full border border-white/12 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20 transition-colors sm:flex-none"
      >
        <SelectValue placeholder="Filter By Availability" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All availability</SelectItem>
        <SelectItem value="available">Available</SelectItem>
        <SelectItem value="sold-out">Sold out</SelectItem>
      </SelectContent>
    </Select>

    <Select onValueChange={(value) => onPriceSortChange(value as PriceSort)} value={priceSort}>
      <SelectTrigger
        aria-label="Sort By Price"
        className="flex-1 rounded-full border border-white/12 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20 transition-colors sm:flex-none"
      >
        <SelectValue placeholder="Sort By Price" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="featured">Featured order</SelectItem>
        <SelectItem value="price-asc">Price: low to high</SelectItem>
        <SelectItem value="price-desc">Price: high to low</SelectItem>
      </SelectContent>
    </Select>

    <Button
      aria-label={searchExpanded ? 'Close search' : 'Open search'}
      className="rounded-full"
      onClick={onToggleSearch}
      size="icon"
      variant={searchExpanded ? 'default' : 'outline'}
    >
      {searchExpanded ? (
        <X aria-hidden="true" className="size-4" />
      ) : (
        <Search aria-hidden="true" className="size-4" />
      )}
    </Button>
  </div>
);
