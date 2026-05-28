"use client"

import * as React from "react"
import {
  ColumnDef,
  PaginationState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  pageSize?: number
  sorting?: SortingState
  onSortingChange?: React.Dispatch<React.SetStateAction<SortingState>>
  pageCount?: number
  pageIndex?: number
  totalItems?: number
  onPaginationChange?: (pageIndex: number) => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageSize = 5,
  sorting: externalSorting,
  onSortingChange: onExternalSortingChange,
  pageCount: externalPageCount,
  pageIndex: externalPageIndex,
  totalItems,
  onPaginationChange: externalOnPaginationChange,
}: DataTableProps<TData, TValue>) {
  const [internalSorting, setInternalSorting] = React.useState<SortingState>([])
  const [internalPagination, setInternalPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  })

  const sorting = externalSorting ?? internalSorting
  const setSorting = onExternalSortingChange ?? setInternalSorting

  const pagination = externalPageIndex !== undefined 
    ? { pageIndex: externalPageIndex, pageSize } 
    : internalPagination;
    
  const handlePaginationChange = (updater: React.SetStateAction<PaginationState>) => {
    const newPagination = typeof updater === 'function' ? updater(pagination) : updater;
    
    if (externalOnPaginationChange) {
      externalOnPaginationChange(newPagination.pageIndex);
    } else {
      setInternalPagination(newPagination);
    }
  };

  const table = useReactTable({
    data,
    columns,
    pageCount: externalPageCount !== undefined ? externalPageCount : undefined,
    manualPagination: externalPageCount !== undefined,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: externalPageCount === undefined ? getPaginationRowModel() : undefined,
    onSortingChange: setSorting,
    onPaginationChange: handlePaginationChange,
    state: {
      sorting,
      pagination,
    },
  })

  const pageCount = table.getPageCount()
  const currentPage = table.getState().pagination.pageIndex + 1

  const getPaginationItems = () => {
    const items: (number | 'ellipsis')[] = [];
    const maxVisiblePages = 10;
    const currentIdx = table.getState().pagination.pageIndex;

    if (pageCount <= maxVisiblePages) {
      for (let i = 0; i < pageCount; i++) items.push(i);
    } else {
      // If current page is near the beginning
      if (currentIdx < 6) {
        for (let i = 0; i < 8; i++) items.push(i);
        items.push('ellipsis');
        items.push(pageCount - 1);
      } 
      // If current page is near the end
      else if (currentIdx > pageCount - 7) {
        items.push(0);
        items.push('ellipsis');
        for (let i = pageCount - 8; i < pageCount; i++) items.push(i);
      } 
      // If current page is in the middle
      else {
        items.push(0);
        items.push('ellipsis');
        for (let i = currentIdx - 2; i <= currentIdx + 2; i++) items.push(i);
        items.push('ellipsis');
        items.push(pageCount - 1);
      }
    }
    return items;
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-white shadow-sm dark:bg-slate-900">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="transition-colors hover:bg-muted/50">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-28 text-center text-slate-500">
                  No transactions match your current filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          Showing {table.getRowModel().rows.length} transactions on page {currentPage} {totalItems !== undefined ? `(Total: ${totalItems})` : ''}
        </p>

        {pageCount > 1 ? (
          <Pagination className="mx-0 w-auto justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(event) => {
                    event.preventDefault()
                    table.previousPage()
                  }}
                  className={!table.getCanPreviousPage() ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>

              {getPaginationItems().map((item, index) => (
                <PaginationItem key={index}>
                  {item === 'ellipsis' ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink
                      href="#"
                      isActive={item === table.getState().pagination.pageIndex}
                      onClick={(event) => {
                        event.preventDefault()
                        table.setPageIndex(item)
                      }}
                    >
                      {item + 1}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(event) => {
                    event.preventDefault()
                    table.nextPage()
                  }}
                  className={!table.getCanNextPage() ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        ) : null}
      </div>
    </div>
  )
}
