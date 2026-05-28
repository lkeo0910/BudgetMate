'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChevronDown, Filter, Loader2, Search } from 'lucide-react';
import { formatVND } from '@/types/transaction';
import { useTransactions } from '@/context/transaction-context';

const categoryIcons: Record<string, string> = {
  Groceries: '🛒',
  Food: '☕',
  Entertainment: '🎬',
  Transportation: '⛽',
  Shopping: '🛍️',
  Utilities: '💡',
  Healthcare: '🏥',
  Income: '💰',
  Salary: '💵',
  Education: '📚',
  Housing: '🏠',
  Freelance: '💻',
};

export function TransactionTable() {
  const [filterOpen, setFilterOpen] = useState(false);
  const { 
    transactions, 
    categories, 
    isLoading, 
    refreshTransactions, 
    getCategoryName 
  } = useTransactions();
  
  const [search, setSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');

  useEffect(() => {
    const filters = {
      search: search || undefined,
      categoryId: selectedCategoryId === 'all' ? undefined : selectedCategoryId,
    };
    refreshTransactions(filters);
  }, [search, selectedCategoryId, refreshTransactions]);

  const getCategoryIcon = (id: string) => {
    const name = getCategoryName(id);
    return categoryIcons[name] || '📄';
  };

  return (
    <Card className="border-0 bg-white dark:bg-slate-800 shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Recent Transactions</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilterOpen(!filterOpen)}
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            Filter
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      {filterOpen && (
        <div className="mb-6 p-4 bg-muted/30 rounded-xl flex flex-col md:flex-row gap-4 animate-in slide-in-from-top-2 duration-200">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search vendor or notes..." 
              className="pl-9 h-10 bg-background" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select 
            className="px-3 py-2 border border-input rounded-lg bg-background text-sm h-10 min-w-[160px] focus:outline-none focus:ring-2 focus:ring-primary"
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.category_name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading transactions...</p>
          </div>
        ) : transactions.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground font-medium">Description</TableHead>
                <TableHead className="text-muted-foreground font-medium">Category</TableHead>
                <TableHead className="text-muted-foreground font-medium">Date</TableHead>
                <TableHead className="text-right text-muted-foreground font-medium">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id} className="border-b border-border hover:bg-muted/50">
                  <TableCell className="font-medium text-foreground">
                    <div className="flex items-center gap-3">
                      <span className="text-xl w-8 h-8 flex items-center justify-center bg-muted rounded-full">
                        {getCategoryIcon(tx.category_id)}
                      </span>
                      <div className="flex flex-col">
                        <span>{tx.vendor}</span>
                        {tx.notes && <span className="text-xs text-muted-foreground font-normal line-clamp-1">{tx.notes}</span>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                      {getCategoryName(tx.category_id)}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {tx.date}
                  </TableCell>
                  <TableCell className={`text-right font-bold ${tx.type === 'INCOME' ? 'text-green-600 dark:text-green-400' : 'text-foreground'}`}>
                    {tx.type === 'EXPENSE' ? '-' : '+'}{formatVND(tx.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-20 border-2 border-dashed border-border rounded-xl">
            <p className="text-muted-foreground">No transactions found.</p>
            {(search || selectedCategoryId !== 'all') && (
              <Button 
                variant="link" 
                onClick={() => { setSearch(''); setSelectedCategoryId('all'); }}
                className="mt-2"
              >
                Clear filters
              </Button>
            )}
          </div>
        )}
      </div>

      {/* View All Button */}
      <div className="mt-6 text-center">
        <Button variant="outline" className="w-full hover:bg-muted transition-colors">
          View All Transactions
        </Button>
      </div>
    </Card>
  );
}


