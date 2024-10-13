import { fetchTransfers } from '@/api/transfers';
import { useAuth } from "@/components/AuthProvider";
import { TransferForm } from '@/components/transfers/TransferForm';
import { TransferPagination } from '@/components/transfers/TransferPagination';
import { TransferTable } from '@/components/transfers/TransferTable';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { Transfer } from '@/types/transfer';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';

export default function TransfersPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { user } = useAuth();

  const { data: transfers, isLoading: transfersLoading } = useQuery<Transfer[], Error>({
    queryKey: ['transfers', user?.id],
    queryFn: () => user ? fetchTransfers(user.id) : Promise.reject("User ID is undefined"),
    enabled: !!user,
  });

  const paginatedTransfers = useMemo(
    () => transfers?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) || [],
    [transfers, currentPage]
  );

  const totalPages = useMemo(
    () => Math.ceil((transfers?.length || 0) / itemsPerPage),
    [transfers]
  );

  if (transfersLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Transfers</h1>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Transfer History</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Transfer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Transfer</DialogTitle>
            </DialogHeader>
            <TransferForm onClose={() => setIsAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
      <TransferTable transfers={paginatedTransfers} />
      <TransferPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}