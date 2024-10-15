import { fetchAccounts, fetchCards } from "@/api/cards";
import { createTransaction, fetchTransactions } from "@/api/transactions";
import { fetchUPIs } from "@/api/upi";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { transactionSchema } from "@/schema/transaction";
import type { BankAccount } from "@/types/account";
import type { Card } from "@/types/card";
import {
  PaymentMethod,
  type Transaction,
  TransactionType,
} from "@/types/transaction";
import type { UPI } from "@/types/upi";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDownIcon, ArrowUpIcon, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "react-router-dom";
import type * as z from "zod";

export default function TransactionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedAccount = searchParams.get("accNo");
  const setSelectedAccount = (accNo: string) => {
    setSearchParams({ accNo });
  };

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: accounts, isLoading: accountsLoading } = useQuery<
    BankAccount[],
    Error
  >({
    queryKey: ["accounts", user?.id],
    queryFn: () =>
      user ? fetchAccounts(user.id) : Promise.reject("User ID is undefined"),
    enabled: !!user,
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery<
    Transaction[],
    Error
  >({
    queryKey: ["transactions", selectedAccount],
    queryFn: () =>
      selectedAccount
        ? fetchTransactions(selectedAccount)
        : Promise.reject("Account number is undefined"),
    enabled: !!selectedAccount,
  });

  const { data: upis } = useQuery<UPI[], Error>({
    queryKey: ["upis", selectedAccount],
    queryFn: () =>
      selectedAccount
        ? fetchUPIs(selectedAccount)
        : Promise.reject("Account number is undefined"),
    enabled: !!selectedAccount,
  });

  const { data: cards } = useQuery<Card[], Error>({
    queryKey: ["cards", selectedAccount],
    queryFn: () =>
      selectedAccount
        ? fetchCards(selectedAccount)
        : Promise.reject("Account number is undefined"),
    enabled: !!selectedAccount,
  });

  const createTransactionMutation = useMutation({
    mutationFn: (
      data: z.infer<typeof transactionSchema> & { userId: number }
    ) => createTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["transactions", selectedAccount],
      });
      toast({ title: "Transaction created successfully" });
      setIsAddDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to create transaction", variant: "destructive" });
    },
  });

  const transactionForm = useForm<z.infer<typeof transactionSchema>>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      accNo: selectedAccount || "",
      amount: 0,
      transactionType: TransactionType.DEPOSIT,
      paymentMethod: PaymentMethod.ACCOUNT,
    },
  });

  useEffect(() => {
    if (!selectedAccount && accounts?.length) {
      setSearchParams({ accNo: accounts[0].accNo });
    }
  }, [selectedAccount, setSearchParams, accounts]);

  const handleCreateTransaction = (data: z.infer<typeof transactionSchema>) => {
    if (user) {
      createTransactionMutation.mutate({ ...data, userId: user.id });
    }
  };

  const activeAccounts = useMemo(
    () => accounts?.filter((account) => account.status === "ACTIVE") || [],
    [accounts]
  );

  const paginatedTransactions = useMemo(
    () =>
      transactions?.sort((a, b) => Number(b.startedAt ?? 0) - Number(a.startedAt ?? 0)).slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      ) || [],
    [transactions, currentPage]
  );

  const totalPages = useMemo(
    () => Math.ceil((transactions?.length || 0) / itemsPerPage),
    [transactions]
  );

  if (accountsLoading || transactionsLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Transactions</h1>
      <div className="mb-6">
        {selectedAccount && (
          <Select value={selectedAccount} onValueChange={setSelectedAccount}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Select an account" />
            </SelectTrigger>
            <SelectContent>
              {activeAccounts.map((account) => (
                <SelectItem key={account.accNo} value={account.accNo}>
                  {account.bank.code} - {account.accNo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Transaction History</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Transaction
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Transaction</DialogTitle>
            </DialogHeader>
            <Form {...transactionForm}>
              <form
                onSubmit={transactionForm.handleSubmit(handleCreateTransaction)}
                className="space-y-4"
              >
                <FormField
                  control={transactionForm.control}
                  name="accNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Number</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an account" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {activeAccounts.map((account) => (
                            <SelectItem
                              key={account.accNo}
                              value={account.accNo}
                            >
                              {account.bank.code} - {account.accNo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={transactionForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number.parseFloat(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={transactionForm.control}
                  name="transactionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transaction Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select transaction type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(TransactionType).map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={transactionForm.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(PaymentMethod).map((method) => (
                            <SelectItem key={method} value={method}>
                              {method}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {transactionForm.watch("paymentMethod") ===
                  PaymentMethod.UPI && (
                  <FormField
                    control={transactionForm.control}
                    name="upiId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>UPI ID</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select UPI ID" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {upis?.map((upi) => (
                              <SelectItem key={upi.upiId} value={upi.upiId}>
                                {upi.upiId}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                {transactionForm.watch("paymentMethod") ===
                  PaymentMethod.CARD && (
                  <FormField
                    control={transactionForm.control}
                    name="byCardNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Card Number</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Card" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {cards?.map((card) => (
                              <SelectItem key={card.cardNo} value={card.cardNo}>
                                **** **** **** {card.cardNo.slice(-4)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <div className="flex gap-1 items-end">
                  <FormField
                    control={transactionForm.control}
                    name="pin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PIN</FormLabel>
                        <FormControl>
                          <Input type="password" minLength={4} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* <Button type="button" onClick={() => verifyPin(pin)}>
                  Verify
                </Button> */}
                </div>
                <Button
                  type="submit"
                  disabled={createTransactionMutation.isPending}
                >
                  {createTransactionMutation.isPending
                    ? "Creating..."
                    : "Create Transaction"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Transaction ID</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Payment Method</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedTransactions
            .map((transaction) => (
              <TableRow key={transaction.transactionId}>
                <TableCell>{transaction.transactionId}</TableCell>
                <TableCell>
                  {transaction.transactionType === TransactionType.DEPOSIT ? (
                    <span className="flex items-center text-green-600">
                      <ArrowDownIcon className="mr-1 h-4 w-4" />
                      Deposit
                    </span>
                  ) : (
                    <span className="flex items-center text-red-600">
                      <ArrowUpIcon className="mr-1 h-4 w-4" />
                      Withdrawal
                    </span>
                  )}
                </TableCell>
                <TableCell>{transaction.amount.toFixed(2)}</TableCell>
                <TableCell>{transaction.transactionStatus}</TableCell>
                <TableCell>{transaction.paymentMethod}</TableCell>
                <TableCell>
                  {new Date(transaction.startedAt || "").toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
      <Pagination className="mt-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
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
                onClick={() => setCurrentPage(i + 1)}
                isActive={currentPage === i + 1}
              >
                {i + 1}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
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
    </div>
  );
}
