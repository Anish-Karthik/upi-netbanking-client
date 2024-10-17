import React, { useState, useMemo } from "react";
import { addDays, subDays } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { CalendarDateRangePicker } from "@/components/dashboard/date-range-picker";
import { RecentTransactions } from "@/components/dashboard/recent-sales";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PaymentMethod, type Transaction } from "@/types/transaction";
import type { DateRange } from "react-day-picker";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchAccounts } from "@/api/accounts/query";
import { fetchCards } from "@/api/cards";
import { fetchUPIs } from "@/api/upi";
import { useAuth } from "@/components/AuthProvider";
import { api } from "@/lib/axios";

interface Analytics {
  depositAmount: number;
  withdrawalAmount: number;
  transactionCount: number;
  mostUsedPaymentMethod: PaymentMethod;
  moneySent: number;
  moneyReceived: number;
}

interface ChartData {
  date: string;
  deposits: number;
  withdrawals: number;
  moneySent: number;
  moneyReceived: number;
}

const fetchTransactions = async (
  paymentMethod: PaymentMethod,
  accountId: string,
  paymentMethodId: string,
  dateRange: DateRange
): Promise<Transaction[]> => {
  const response = await api.get(`/accounts/${accountId}/transactions`);
  let transactions: Transaction[] = response.data.data;
  transactions = transactions.filter((t) => {
    if (!dateRange || !dateRange.from || !dateRange.to) {
      return t.paymentMethod === paymentMethod;
    }
    return (
      t.paymentMethod === paymentMethod &&
      new Date(t.startedAt) >= dateRange?.from &&
      new Date(t.startedAt) <= dateRange?.to
    );
  });
  if (paymentMethodId) {
    transactions = transactions.filter((t) => {
      if (paymentMethod === PaymentMethod.UPI) {
        return t.upiId === paymentMethodId;
      }
      if (paymentMethod === PaymentMethod.CARD) {
        return t.byCardNo === paymentMethodId;
      }
      return false;
    });
  }
  return transactions;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    PaymentMethod.ACCOUNT
  );
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<string>("");
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: addDays(new Date(), 1),
  });

  const { data: accounts } = useQuery({
    queryKey: ["accounts", user?.id],
    queryFn: () => fetchAccounts(user!.id),
    enabled: !!user?.id,
  });

  const { data: upis } = useQuery({
    queryKey: ["upis", selectedAccount],
    queryFn: () => fetchUPIs(selectedAccount),
    enabled: !!selectedAccount,
  });

  const { data: cards } = useQuery({
    queryKey: ["cards", selectedAccount],
    queryFn: () => fetchCards(selectedAccount),
    enabled: !!selectedAccount,
  });

  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: [
      "transactions",
      paymentMethod,
      selectedAccount,
      selectedPaymentMethod,
      date,
    ],
    queryFn: () =>
      fetchTransactions(
        paymentMethod,
        selectedAccount,
        selectedPaymentMethod,
        date!
      ),
    enabled: !!selectedAccount && !!date,
  });

  const analytics: Analytics = useMemo(() => {
    if (!transactions)
      return {
        depositAmount: 0,
        withdrawalAmount: 0,
        transactionCount: 0,
        mostUsedPaymentMethod: PaymentMethod.ACCOUNT,
        moneySent: 0,
        moneyReceived: 0,
      };
    console.log(transactions.filter((t) => t.transactionType === "WITHDRAWAL"));

    const depositAmount = transactions.reduce(
      (sum, t) => (t.transactionType === "DEPOSIT" ? sum + t.amount : sum),
      0
    );
    const withdrawalAmount = transactions.reduce(
      (sum, t) => (t.transactionType === "WITHDRAWAL" ? sum + t.amount : sum),
      0
    );
    const transactionCount = transactions.length;
    const paymentMethodCounts = transactions.reduce((counts, t) => {
      counts[t.paymentMethod] = (counts[t.paymentMethod] || 0) + 1;
      return counts;
    }, {} as Record<PaymentMethod, number>);
    const mostUsedPaymentMethod = Object.entries(paymentMethodCounts).reduce(
      (a, b) => (a[1] > b[1] ? a : b)
    )[0] as PaymentMethod;
    const moneySent = transactions.reduce(
      (sum, t) =>
        t.referenceId && t.transactionType === "WITHDRAWAL"
          ? sum + t.amount
          : sum,
      0
    );
    const moneyReceived = transactions.reduce(
      (sum, t) =>
        t.referenceId && t.transactionType === "DEPOSIT" ? sum + t.amount : sum,
      0
    );

    return {
      depositAmount,
      withdrawalAmount,
      transactionCount,
      mostUsedPaymentMethod,
      moneySent,
      moneyReceived,
    };
  }, [transactions]);

  const chartData: ChartData[] = useMemo(() => {
    if (!transactions) return [];
    console.log(transactions.length);
    const dailyData: Record<
      string,
      {
        deposits: number;
        withdrawals: number;
        moneySent: number;
        moneyReceived: number;
      }
    > = {};
    // biome-ignore lint/complexity/noForEach: <explanation>
    transactions.forEach((t) => {
      const date = new Date(t.startedAt).toISOString().split("T")[0];
      if (!dailyData[date]) {
        dailyData[date] = {
          deposits: 0,
          withdrawals: 0,
          moneySent: 0,
          moneyReceived: 0,
        };
      }
      if (t.transactionType === "DEPOSIT") {
        if (t.referenceId) {
          dailyData[date].moneyReceived += t.amount;
        } else {
          dailyData[date].deposits += t.amount;
        }
      } else {
        if (t.referenceId) {
          dailyData[date].moneySent += t.amount;
        } else {
          dailyData[date].withdrawals += t.amount;
        }
      }
    });

    return Object.entries(dailyData)
      .map(([date, data]) => ({
        date,
        deposits: data.deposits,
        withdrawals: data.withdrawals,
        moneySent: data.moneySent,
        moneyReceived: data.moneyReceived,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [transactions]);

  const handlePaymentMethodChange = (value: string) => {
    setPaymentMethod(value as PaymentMethod);
    setSelectedPaymentMethod("");
  };

  const handleAccountChange = (value: string) => {
    setSelectedAccount(value);
  };

  const handlePaymentMethodIdChange = (value: string) => {
    setSelectedPaymentMethod(value);
  };

  return (
    <div className="flex-col md:flex">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <div className="flex items-center space-x-2">
            <Select
              onValueChange={handlePaymentMethodChange}
              value={paymentMethod}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(PaymentMethod).map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {!!accounts && (
              <Select
                onValueChange={handleAccountChange}
                value={selectedAccount}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={"Select Account"} />
                </SelectTrigger>
                <SelectContent>
                  {accounts?.map((account) => (
                    <SelectItem key={account.accNo} value={account.accNo}>
                      {account.accNo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {paymentMethod !== PaymentMethod.ACCOUNT && !!selectedAccount && (
              <Select
                onValueChange={handlePaymentMethodIdChange}
                value={selectedPaymentMethod}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue
                    placeholder={`Select ${paymentMethod.toLowerCase()}`}
                  />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethod === PaymentMethod.UPI &&
                    upis?.map((upi) => (
                      <SelectItem key={upi.upiId} value={upi.upiId}>
                        {upi.upiId}
                      </SelectItem>
                    ))}
                  {paymentMethod === PaymentMethod.CARD &&
                    cards?.map((card) => (
                      <SelectItem key={card.cardNo} value={card.cardNo}>
                        {card.cardNo}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
            <CalendarDateRangePicker date={date} setDate={setDate} />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Deposit</CardTitle>
              {/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${analytics.depositAmount.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                +20.1% from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Withdrawal</CardTitle>
              {/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${analytics.withdrawalAmount.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                +180.1% from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Transactions
              </CardTitle>
              {/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <rect width="20" height="14" x="2" y="5" rx="2" />
                <path d="M2 10h20" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.transactionCount}
              </div>
              <p className="text-xs text-muted-foreground">
                +19% from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Most Used Method
              </CardTitle>
              {/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.mostUsedPaymentMethod}
              </div>
              <p className="text-xs text-muted-foreground">
                Most frequent payment method
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="deposits"
                    stroke="#8884d8"
                    name="Deposits"
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="withdrawals"
                    stroke="#82ca9d"
                    name="Withdrawals"
                  />
                  <Line
                    type="monotone"
                    dataKey="moneySent"
                    stroke="#ff7300"
                    name="Money Sent"
                  />
                  <Line
                    type="monotone"
                    dataKey="moneyReceived"
                    stroke="#0088fe"
                    name="Money Received"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>
                You made {transactions?.length || 0} transactions this month.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RecentTransactions transactions={transactions?.slice(0, 5)} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
