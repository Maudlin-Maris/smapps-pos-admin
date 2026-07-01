import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { useState, useMemo } from "react";

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

export function usePagination<T>(items: T[], defaultPerPage = DEFAULT_PAGE_SIZE) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(defaultPerPage);

  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const safePage = Math.min(page, totalPages);

  const paginatedItems = useMemo(
    () => items.slice((safePage - 1) * perPage, safePage * perPage),
    [items, safePage, perPage]
  );

  const changePerPage = (value: number) => {
    setPerPage(value);
    setPage(1);
  };

  return {
    page: safePage,
    setPage,
    perPage,
    setPerPage: changePerPage,
    totalPages,
    paginatedItems,
    totalItems: items.length,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
  };
}
