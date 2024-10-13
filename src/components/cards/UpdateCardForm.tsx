import { useToast } from "@/hooks/use-toast";
import { updateCardSchema } from "@/schema/card";
import { type Card, CardType, CardCategory, CardStatus } from "@/types/card";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button"; // Correct import for Button
import { useForm, FormProvider } from "react-hook-form";
import type { z } from "zod";
import { DialogHeader } from "../ui/dialog";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "../ui/form";
import { updateCard } from "@/api/cards";

export const UpdateCardForm: React.FC<{
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  selectedAccount: string | null;
  editingCard: Card | null;
}> = ({ isOpen, onOpenChange, selectedAccount, editingCard }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateCardForm = useForm<z.infer<typeof updateCardSchema>>({
    resolver: zodResolver(updateCardSchema),
    defaultValues: {
      cardType: editingCard?.cardType || CardType.VISA,
      cardCategory: editingCard?.cardCategory || CardCategory.DEBIT,
      status: editingCard?.status || CardStatus.ACTIVE,
    },
  });

  const updateCardMutation = useMutation({
    mutationFn: (data: z.infer<typeof updateCardSchema>) => {
      if (!selectedAccount || !editingCard) {
        return Promise.reject("Account number and card are required");
      }
      return updateCard(selectedAccount, editingCard.cardNo, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards", selectedAccount] });
      toast({ title: "Card updated successfully" });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Failed to update card", variant: "destructive" });
    },
  });

  const handleUpdateCard = (data: z.infer<typeof updateCardSchema>) => {
    updateCardMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Card</DialogTitle>
        </DialogHeader>
        <FormProvider {...updateCardForm}>
          <form
            onSubmit={updateCardForm.handleSubmit(handleUpdateCard)}
            className="space-y-4"
          >
            <FormField
              control={updateCardForm.control}
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
              control={updateCardForm.control}
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
              control={updateCardForm.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(CardStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={updateCardMutation.isPending}>
              {updateCardMutation.isPending ? "Updating..." : "Update Card"}
            </Button>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
};