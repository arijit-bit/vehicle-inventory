import { Search, X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';

export type PriceSort = 'featured' | 'price-asc' | 'price-desc';

interface CollectionControlsProps {
  brands: string[];
  brand: string;
  priceSort: PriceSort;
  searchExpanded: boolean;
  onBrandChange(value: string): void;
  onPriceSortChange(value: PriceSort): void;
  onToggleSearch(): void;
}

export const CollectionControls = ({
  brands,
  brand,
  priceSort,
  searchExpanded,
  onBrandChange,
  onPriceSortChange,
  onToggleSearch,
}: CollectionControlsProps) => (
  <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end">
    <Select onValueChange={onBrandChange} value={brand}>
      <SelectTrigger aria-label="Filter By Brand" className="flex-1 sm:flex-none">
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

    <Select onValueChange={(value) => onPriceSortChange(value as PriceSort)} value={priceSort}>
      <SelectTrigger aria-label="Sort By Price" className="flex-1 sm:flex-none">
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
