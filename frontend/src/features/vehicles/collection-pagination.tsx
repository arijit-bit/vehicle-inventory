import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '../../components/ui/pagination';

interface CollectionPaginationProps {
  ariaLabel?: string;
  currentPage: number;
  disabled?: boolean;
  onPageChange(page: number): void;
  totalPages: number;
}

type PageItem = number | 'ellipsis';

const pageItems = (currentPage: number, totalPages: number): PageItem[] => {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  const visiblePages = [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((left, right) => left - right);

  return visiblePages.flatMap<PageItem>((page, index) => {
    const previous = visiblePages[index - 1];
    return previous && page - previous > 1 ? ['ellipsis', page] : [page];
  });
};

export const CollectionPagination = ({
  ariaLabel = 'Collection pagination',
  currentPage,
  disabled = false,
  onPageChange,
  totalPages,
}: CollectionPaginationProps) => {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <Pagination aria-label={ariaLabel} className="mt-10">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            disabled={disabled || currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
          />
        </PaginationItem>
        {pageItems(currentPage, totalPages).map((item, index) =>
          item === 'ellipsis' ? (
            <PaginationItem key={`ellipsis-${index}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={item}>
              <PaginationLink
                aria-label={`Go to page ${item}`}
                disabled={disabled}
                isActive={item === currentPage}
                onClick={() => onPageChange(item)}
              >
                {item}
              </PaginationLink>
            </PaginationItem>
          ),
        )}
        <PaginationItem>
          <PaginationNext
            disabled={disabled || currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};
