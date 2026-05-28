"use client"

import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { ArrowUpDown, FileText, MoreHorizontal, Pencil, Trash2 } from "lucide-react"

import { Transaction, formatVND } from "@/types/transaction"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface TransactionColumnOptions {
  onEdit: (transaction: Transaction) => void
  onDelete: (transaction: Transaction) => void
  getCategoryName?: (id: string) => string
}

export function createTransactionColumns({
  onEdit,
  onDelete,
  getCategoryName,
}: TransactionColumnOptions): ColumnDef<Transaction>[] {
  return [
    {
      accessorKey: "date",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const dateValue = row.getValue("date") as string | Date
        const date = typeof dateValue === "string" ? new Date(dateValue) : dateValue
        return <div className="min-w-30 pl-4">{format(date, "MMM d, yyyy")}</div>
      },
    },
    {
      accessorKey: "vendor",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Vendor / Source
          <ArrowUpDown className="h-4 w-4 ml-2" />
        </Button>
      ),
      cell: ({ row }) => {
        const tx = row.original

        return (
          <div className="flex min-w-44 items-center gap-2 font-medium">
            <span>{tx.vendor}</span>
            {tx.notes ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <FileText className="h-4 w-4 cursor-help text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>{tx.notes}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : null}
          </div>
        )
      },
    },
    {
      accessorKey: "category_id",
      header: "Category",
      cell: ({ row }) => {
        const tx = row.original;
        const name = getCategoryName ? getCategoryName(tx.category_id) : (tx.category_name || tx.category_id);
        return <Badge variant="outline">{name}</Badge>;
      },
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const isIncome = row.original.type.toLowerCase() === "income"

        return (
          <Badge
            className={
              isIncome
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }
            variant="outline"
          >
            {isIncome ? "Income" : "Expense"}
          </Badge>
        )
      },
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <div className="text-right">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Amount
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>
      ),
      cell: ({ row }) => {
        const amount = Number(row.getValue("amount"))
        const isIncome = row.original.type.toLowerCase() === "income"

        return (
          <div
            className={`min-w-34 pr-4 text-right font-medium ${
              isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {isIncome ? "+" : "-"}
            {formatVND(amount)}
          </div>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const tx = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open transaction actions</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onEdit(tx)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => onDelete(tx)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
