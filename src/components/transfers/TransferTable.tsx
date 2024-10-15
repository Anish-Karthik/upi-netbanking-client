import type React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Transfer } from '@/types/transfer';

interface TransferTableProps {
  transfers: Transfer[];
}

export const TransferTable: React.FC<TransferTableProps> = ({ transfers }) => {
  const sortedTransfers = transfers.sort((a,b) => b.startedAt-a.startedAt)
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Reference ID</TableHead>
          <TableHead>From</TableHead>
          <TableHead>To</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedTransfers.map((transfer) => (
          <TableRow key={transfer.referenceId}>
            <TableCell>{transfer.referenceId}</TableCell>
            <TableCell>{transfer.payerTransaction.accNo || transfer.payerTransaction.upiId || transfer.payerTransaction.byCardNo}</TableCell>
            <TableCell>{transfer.payeeTransaction.accNo || transfer.payeeTransaction.upiId}</TableCell>
            <TableCell>{transfer.amount.toFixed(2)}</TableCell>
            <TableCell>{transfer.transferStatus}</TableCell>
            <TableCell>{new Date(transfer.startedAt).toLocaleString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};