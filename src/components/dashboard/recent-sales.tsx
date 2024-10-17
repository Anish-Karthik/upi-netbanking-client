import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { type Transaction, TransactionType } from "@/types/transaction"

interface RecentTransactionsProps {
  transactions?: Transaction[]
}

export function RecentTransactions({ transactions = [] }: RecentTransactionsProps) {
  return (
    <div className="space-y-8">
      {transactions.map((transaction) =>   (
        <div key={transaction.transactionId} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarImage src="/avatars/01.png" alt="Avatar" />
            <AvatarFallback>OM</AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">
              {transaction.transactionType === TransactionType.DEPOSIT ? 'Deposit' : 'Withdrawal'}
            </p>
            <p className="text-sm text-muted-foreground">
              {transaction.paymentMethod}: {transaction.accNo || transaction.upiId || transaction.byCardNo}
            </p>
          </div>
          <div className={`ml-auto font-medium ${transaction.transactionType === TransactionType.DEPOSIT ? 'text-green-500' : 'text-red-500'}`}>
            {transaction.transactionType === TransactionType.DEPOSIT ? '+' : '-'}${transaction.amount.toFixed(2)}
          </div>
        </div>
      ))}
    </div>
  )
}