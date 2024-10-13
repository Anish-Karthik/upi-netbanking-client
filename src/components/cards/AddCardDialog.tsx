import { useToast } from "@/hooks/use-toast";
import { addCardSchema } from "@/schema/card";
import { CardType, CardCategory } from "@/types/card";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useForm, FormProvider } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addCard } from "@/api/cards";
import type { z } from "zod";
import type { BankAccount } from "@/types/account";

interface AddCardDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  selectedAccount: string | null;
  activeAccounts: BankAccount[];
}

export const AddCardDialog: React.FC<AddCardDialogProps> = ({ isOpen, onOpenChange, selectedAccount, activeAccounts }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addCardForm = useForm<z.infer<typeof addCardSchema>>({
    resolver: zodResolver(addCardSchema),
    defaultValues: {
      accNo: selectedAccount || "",
      cardType: CardType.VISA,
      cardCategory: CardCategory.DEBIT,
      atmPin: "",
      expiryDate: "",
    },
  });

  const addCardMutation = useMutation({
    mutationFn: (data: z.infer<typeof addCardSchema> & { userId: number }) => {
      if (!selectedAccount) {
        return Promise.reject("Account number is required");
      }
      return addCard(selectedAccount, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards", selectedAccount] });
      toast({ title: "Card added successfully" });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Failed to add card", variant: "destructive" });
    },
  });

  const handleAddCard = (data: z.infer<typeof addCardSchema>) => {
    addCardMutation.mutate({ ...data, userId: 1 }); // Replace with actual user ID
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Card
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Card</DialogTitle>
        </DialogHeader>
        <FormProvider {...addCardForm}>
          <form onSubmit={addCardForm.handleSubmit(handleAddCard)} className="space-y-4">
            <FormField
              control={addCardForm.control}
              name="accNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Number</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activeAccounts.map((account) => (
                        <SelectItem key={account.accNo} value={account.accNo}>
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
              control={addCardForm.control}
              name="cardType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Card Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select card type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(CardType).map((type) => (
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
              control={addCardForm.control}
              name="cardCategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Card Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select card category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(CardCategory).map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={addCardForm.control}
              name="atmPin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ATM PIN</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={addCardForm.control}
              name="expiryDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expiry Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={addCardMutation.isPending}>
              {addCardMutation.isPending ? "Adding..." : "Add Card"}
            </Button>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
};