import type React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from "@/components/AuthProvider";
import { fetchAccounts, fetchCards } from '@/api/cards';
import { fetchUPIs } from '@/api/upi';
import type { Beneficiary } from '@/types/beneficiary';
import type { Transfer } from '@/types/transfer';
import { fetchBeneficiaries } from '../beneficiaries';

const transferSchema = z.object({
  payerTransaction: z.object({
    accNo: z.string().optional(),
    upiId: z.string().optional(),
    cardNo: z.string().optional(),
  }),
  payeeTransaction: z.object({
    accNo: z.string().optional(),
    upiId: z.string().optional(),
    cardNo: z.string().optional(),
  }),
  amount: z.number().positive("Amount must be positive"),
  description: z.string().optional(),
  beneficiaryId: z.coerce.number().optional(),
});

const createTransfer = async (data: z.infer<typeof transferSchema>): Promise<Transfer> => {
  const { beneficiaryId, ...rest } = data;
  const response = await api.post('/transfers', rest);
  return response.data.data;
};

export const TransferForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const transferForm = useForm<z.infer<typeof transferSchema>>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      payerTransaction: {},
      payeeTransaction: {},
      amount: 0,
      description: "",
    },
  });

  const { accNo } = transferForm.watch("payerTransaction");

  const { data: accounts } = useQuery({
    queryKey: ['accounts', user?.id],
    queryFn: () => user ? fetchAccounts(user.id) : Promise.reject("User ID is undefined"),
    enabled: !!user,
  });

  const { data: upis } = useQuery({
    queryKey: ['upis', accNo],
    queryFn: () => accNo ? fetchUPIs(accNo) : Promise.reject("AccNo ID is undefined"),
    enabled: !!accNo,
  });

  const { data: cards } = useQuery({
    queryKey: ['cards', accNo],
    queryFn: () => accNo ? fetchCards(accNo) : Promise.reject("AccNo ID is undefined"),
    enabled: !!accNo,
  });

  const { data: beneficiaries } = useQuery<Beneficiary[], Error>({
    queryKey: ['beneficiaries', user?.id],
    queryFn: () => user ? fetchBeneficiaries(user.id) : Promise.reject("User ID is undefined"),
    enabled: !!user,
  });

  const createTransferMutation = useMutation({
    mutationFn: createTransfer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers', user?.id] });
      toast({ title: "Transfer created successfully" });
      onClose();
    },
    onError: () => {
      toast({ title: "Failed to create transfer", variant: "destructive" });
    },
  });

  const handleCreateTransfer = (data: z.infer<typeof transferSchema>) => {
    createTransferMutation.mutate(data);
  };

  const handleBeneficiary = (beneficiaryId: string) => {
    const beneficary = beneficiaries?.find((b) => b.id === Number(beneficiaryId));
    if (beneficary?.accNo) {
      transferForm.setValue("payeeTransaction.accNo", beneficary.accNo);
    } else if (beneficary?.upiId) {
      transferForm.setValue("payeeTransaction.upiId", beneficary.upiId);
    }
    transferForm.setValue("beneficiaryId", Number(beneficiaryId));
  };

  return (
    <Form {...transferForm}>
      <form onSubmit={transferForm.handleSubmit(handleCreateTransfer)} className="space-y-4">
        <FormField
          control={transferForm.control}
          name="payerTransaction.accNo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>From Account</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {accounts?.map((account) => (
                    <SelectItem key={account.accNo} value={account.accNo}>
                      {account.accNo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Controller
          name="payerTransaction.upiId"
          control={transferForm.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>From UPI</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
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
        <Controller
          name="payerTransaction.cardNo"
          control={transferForm.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>From Card</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
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
        <Controller
          name="beneficiaryId"
          control={transferForm.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>To Beneficiary</FormLabel>
              <Select onValueChange={handleBeneficiary} value={field.value?.toString()}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Beneficiary" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {beneficiaries?.map((beneficiary) => (
                    <SelectItem key={beneficiary.id} value={beneficiary.id.toString()}>
                      {beneficiary.name} - {beneficiary.accNo || beneficiary.upiId}
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
        <FormField
          control={transferForm.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input type="number" {...field} onChange={(e) => field.onChange(Number.parseFloat(e.target.value))} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={transferForm.control}
          name="description"
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
        <Button type="submit" disabled={createTransferMutation.isPending}>
          {createTransferMutation.isPending ? "Creating..." : "Create Transfer"}
        </Button>
      </form>
    </Form>
  );
};