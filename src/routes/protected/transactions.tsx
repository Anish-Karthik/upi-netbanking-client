import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowDownIcon, ArrowUpIcon, Plus } from "lucide-react";
import { api } from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/AuthProvider";
import type { BankAccount } from "@/types/account";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

// Enums
enum TransactionType {
  DEPOSIT = "DEPOSIT",
  WITHDRAWAL = "WITHDRAWAL",
}

enum PaymentMethod {
  UPI = "UPI",
  CARD = "CARD",
  ACCOUNT = "ACCOUNT",
}

enum TransactionStatus {
  SUCCESS = "SUCCESS",
  PENDING = "PENDING",
  FAILED = "FAILED",
}

// Interfaces
interface Transaction {
  transactionId: number;
  accNo: string;
  userId: number;
  amount: number;
  transactionType: TransactionType;
  transactionStatus: TransactionStatus;
  byCardNo: string | null;
  upiId: string | null;
  startedAt: string | null;
  endedAt: string | null;
  referenceId: string | null;
  paymentMethod: PaymentMethod;
}

interface UPI {
  upiId: string;
}

interface Card {
  cardNo: string;
}

// Schemas
const transactionSchema = z.object({
  accNo: z.string().min(1, "Account number is required"),
  amount: z.number().positive("Amount must be positive"),
  transactionType: z.nativeEnum(TransactionType),
  paymentMethod: z.nativeEnum(PaymentMethod),
  upiId: z.string().optional(),
  byCardNo: z.string().optional(),
});

// API functions
const fetchTransactions = async (accNo: string): Promise<Transaction[]> => {
  const response = await api.get(`/accounts/${accNo}/transactions`);
  return response.data.data;
};

const fetchAccounts = async (userId: number): Promise<BankAccount[]> => {
  const response = await api.get(`/users/${userId}/accounts`);
  return response.data.data;
};

const createTransaction = async (
  data: z.infer<typeof transactionSchema> & { userId: number }
): Promise<Transaction> => {
  const response = await api.post(`/accounts/${data.accNo}/transactions`, data);
  return response.data.data;
};

const fetchUPIs = async (accNo: string): Promise<UPI[]> => {
  const response = await api.get(`/accounts/${accNo}/upi`);
  return response.data.data;
};

const fetchCards = async (accNo: string): Promise<Card[]> => {
  const response = await api.get(`/accounts/${accNo}/card`);
  return response.data.data;
};

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
      transactions?.slice(
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
          {paginatedTransactions.map((transaction) => (
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
