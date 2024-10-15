import { fetchAccounts, fetchCards } from "@/api/cards";
import { fetchUPIs } from "@/api/upi";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/axios";
import type { Beneficiary } from "@/types/beneficiary";
import type { Transfer } from "@/types/transfer";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { fetchBeneficiaries } from "../beneficiaries";
// import { verifyPin, deactivatePaymentMethod } from '@/api/payment';

const verifyPin = async (pin: string): Promise<boolean> => {
  // Implement the actual PIN verification logic here
  return true; // Placeholder return value
};
const deactivatePaymentMethod = async (
  paymentMethod: string,
  paymentMethodValue: string
) => {};

enum PaymentMethod {
  ACCOUNT = "ACCOUNT",
  UPI = "UPI",
  CARD = "CARD"
}

const transferSchema = z.object({
  payerTransaction: z.object({
    paymentMethod: z.nativeEnum(PaymentMethod),
    accNo: z.string().optional(),
    upiId: z.string().optional(),
    cardNo: z.string().optional(),
    pin: z.string().min(4, "PIN must be atleast 4 digits"),
  }),
  payeeTransaction: z.object({
    beneficiaryId: z.coerce.number().optional(),
    accNo: z.string().optional(),
    upiId: z.string().optional(),
  }),
  transferDetails: z.object({
    amount: z.number().positive("Amount must be positive"),
    description: z.string().optional(),
  }),
});

const createTransfer = async (
  data: z.infer<typeof transferSchema>
): Promise<Transfer> => {
  const { payerTransaction, payeeTransaction, transferDetails } = data;
  const response = await api.post("/transfers", {
    payerTransaction,
    payeeTransaction,
    ...transferDetails,
  });
  return response.data.data;
};

export default function TransferForm({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [pinAttempts, setPinAttempts] = useState(0);

  const transferForm = useForm<z.infer<typeof transferSchema>>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      payerTransaction: { paymentMethod: PaymentMethod.ACCOUNT },
      payeeTransaction: {},
      transferDetails: { amount: 0 },
    },
  });

  const { paymentMethod, accNo, pin } = transferForm.watch("payerTransaction");

  const { data: accounts } = useQuery({
    queryKey: ["accounts", user?.id],
    queryFn: () =>
      user ? fetchAccounts(user.id) : Promise.reject("User ID is undefined"),
    enabled: !!user,
  });

  const { data: upis } = useQuery({
    queryKey: ["upis", accNo],
    queryFn: () =>
      accNo ? fetchUPIs(accNo) : Promise.reject("AccNo is undefined"),
    enabled: !!accNo && paymentMethod === PaymentMethod.UPI
  });

  const { data: cards } = useQuery({
    queryKey: ["cards", accNo],
    queryFn: () =>
      accNo ? fetchCards(accNo) : Promise.reject("AccNo is undefined"),
    enabled: !!accNo && paymentMethod === PaymentMethod.CARD
  });

  const { data: beneficiaries } = useQuery<Beneficiary[], Error>({
    queryKey: ["beneficiaries", user?.id],
    queryFn: () =>
      user
        ? fetchBeneficiaries(user.id)
        : Promise.reject("User ID is undefined"),
    enabled: !!user,
  });

  const createTransferMutation = useMutation({
    mutationFn: createTransfer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transfers", user?.id] });
      toast({ title: "Transfer created successfully" });
      onClose();
    },
    onError: () => {
      toast({ title: "Failed to create transfer", variant: "destructive" });
    },
  });

  const handleCreateTransfer2 = async (data: z.infer<typeof transferSchema>) => {
    try {
      const isPinValid = await verifyPin(data.payerTransaction.pin);
      if (isPinValid) {
        createTransferMutation.mutate(data);
      } else {
        setPinAttempts((prev) => prev + 1);
        if (pinAttempts >= 2) {
          const paymentMethod = data.payerTransaction.paymentMethod;
          let paymentMethodValue: string | undefined;
          if (paymentMethod === PaymentMethod.ACCOUNT) {
            paymentMethodValue = data.payerTransaction.accNo;
          } else if (paymentMethod === PaymentMethod.UPI) {
            paymentMethodValue = data.payerTransaction.upiId;
          } else if (paymentMethod === PaymentMethod.CARD) {
            paymentMethodValue = data.payerTransaction.cardNo;
          }
          if (paymentMethodValue) {
            await deactivatePaymentMethod(paymentMethod, paymentMethodValue);
          }
          toast({
            title: `${data.payerTransaction.paymentMethod.toUpperCase()} has been deactivated due to multiple failed attempts`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Invalid PIN. Please try again.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({ title: "Error verifying PIN", variant: "destructive" });
    }
  };

  const handleCreateTransfer = async (data: z.infer<typeof transferSchema>) => {
    try {
      await createTransferMutation.mutateAsync(data);
    } catch (error: any) {
      const msg: string = error.response.data.message?.split(":").at(-1).trim();
      toast({ title: msg, variant: "destructive" });
      if (msg.toLowerCase().includes("invalid pin")) {
        transferForm.setError("payerTransaction.pin", {
          message: "Invalid pin",
        })
      }
    }
  }

  const handleBeneficiary = (beneficiaryId: string) => {
    const beneficiary = beneficiaries?.find(
      (b) => b.id === Number(beneficiaryId)
    );
    if (beneficiary?.accNo) {
      transferForm.setValue("payeeTransaction.accNo", beneficiary.accNo);
    } else if (beneficiary?.upiId) {
      transferForm.setValue("payeeTransaction.upiId", beneficiary.upiId);
    }
    transferForm.setValue("payeeTransaction.beneficiaryId", Number(beneficiaryId));
  };

  return (
    <Form {...transferForm}>
      <form
        onSubmit={transferForm.handleSubmit(handleCreateTransfer)}
        className="space-y-6"
      >
        <div className="flex gap-1">
          <Card>
            <CardHeader>
              <CardTitle>Payer Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={transferForm.control}
                name="payerTransaction.paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Mode</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment mode" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(PaymentMethod).map((type) => (
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
              {paymentMethod === PaymentMethod.ACCOUNT && (
                <FormField
                  control={transferForm.control}
                  name="payerTransaction.accNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Account</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select account" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {accounts?.map((account) => (
                            <SelectItem
                              key={account.accNo}
                              value={account.accNo}
                            >
                              {account.accNo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {paymentMethod === PaymentMethod.UPI && (
                <FormField
                  control={transferForm.control}
                  name="payerTransaction.upiId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From UPI</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select UPI" />
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
              {paymentMethod === PaymentMethod.CARD && (
                <FormField
                  control={transferForm.control}
                  name="payerTransaction.cardNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Card</FormLabel>
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
                  control={transferForm.control}
                  name="payerTransaction.pin"
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payee Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={transferForm.control}
                name="payeeTransaction.beneficiaryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To Beneficiary</FormLabel>
                    <Select
                      onValueChange={handleBeneficiary}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Beneficiary" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {beneficiaries?.map((beneficiary) => (
                          <SelectItem
                            key={beneficiary.id}
                            value={beneficiary.id.toString()}
                          >
                            {beneficiary.name} -{" "}
                            {beneficiary.accNo || beneficiary.upiId}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={transferForm.control}
                name="payeeTransaction.accNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To Account (Manual)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter account number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={transferForm.control}
                name="payeeTransaction.upiId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To UPI (Manual)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter UPI ID" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Transfer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={transferForm.control}
              name="transferDetails.amount"
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
              control={transferForm.control}
              name="transferDetails.description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Button type="submit" disabled={createTransferMutation.isPending}>
          {createTransferMutation.isPending ? "Creating..." : "Create Transfer"}
        </Button>
      </form>
    </Form>
  );
}
