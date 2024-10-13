import { useToast } from "@/hooks/use-toast";
import { editStatusSchema } from "@/schema/card";
import { CardStatus } from "@/types/card";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, FormProvider } from "react-hook-form";
import { updateCardStatus } from "@/api/cards";
import type { z } from "zod";
import type { Card } from "@/types/card";

interface EditStatusDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  selectedAccount: string | null;
  editingCard: Card | null;
}

export const EditStatusDialog: React.FC<EditStatusDialogProps> = ({ isOpen, onOpenChange, selectedAccount, editingCard }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const editStatusForm = useForm<z.infer<typeof editStatusSchema>>({
    resolver: zodResolver(editStatusSchema),
    defaultValues: {
      status: CardStatus.ACTIVE,
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ cardNo, status }: { cardNo: string; status: CardStatus }) => {
      if (!selectedAccount) {
        return Promise.reject("Account number is required");
      }
      return updateCardStatus(selectedAccount, cardNo, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards", selectedAccount] });
      toast({ title: "Card status updated successfully" });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Failed to update card status", variant: "destructive" });
    },
  });

  const handleEditStatus = (data: z.infer<typeof editStatusSchema>) => {
    if (editingCard) {
      updateStatusMutation.mutate({
        cardNo: editingCard.cardNo,
        status: data.status,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Card Status</DialogTitle>
        </DialogHeader>
        <FormProvider {...editStatusForm}>
          <form onSubmit={editStatusForm.handleSubmit(handleEditStatus)} className="space-y-4">
            <FormField
              control={editStatusForm.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            <Button type="submit" disabled={updateStatusMutation.isPending}>
              {updateStatusMutation.isPending ? "Updating..." : "Update Status"}
            </Button>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
};