import type React from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

interface TransferPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const TransferPagination: React.FC<TransferPaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  return (
    <Pagination className="mt-4">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
            className={cn(
              {
                "cursor-not-allowed opacity-60": currentPage === 1,
                "hover:cursor-pointer": currentPage > 1,
              },
              "bg-black dark:bg-slate-100 text-white dark:text-black hover:bg-black/80 dark:hover:bg-slate-100/80 hover:text-gray-100 dark:hover:text-gray-900"
            )}
          />
        </PaginationItem>
        {[...Array(totalPages)].map((_, i) => (
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => onPageChange(i + 1)}
              isActive={currentPage === i + 1}
            >
              {i + 1}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext
            onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
            className={cn(
              {
                "cursor-not-allowed opacity-60": currentPage === totalPages,
                "hover:cursor-pointer": currentPage < totalPages,
              },
              "bg-black dark:bg-slate-100 text-white dark:text-black hover:bg-black/80 dark:hover:bg-slate-100/80 hover:text-gray-100 dark:hover:text-gray-900"
            )}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};