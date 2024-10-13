import { useToast } from "@/hooks/use-toast";
import { changePinSchema } from "@/schema/card";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm, FormProvider } from "react-hook-form";
import { changeCardPin } from "@/api/cards";
import type { z } from "zod";
import type { Card } from "@/types/card";

interface ChangePinDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  selectedAccount: string | null;
  editingCard: Card | null;
}

export const ChangePinDialog: React.FC<ChangePinDialogProps> = ({ isOpen, onOpenChange, selectedAccount, editingCard }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const changePinForm = useForm<z.infer<typeof changePinSchema>>({
    resolver: zodResolver(changePinSchema),
    defaultValues: {
      oldPin: "",
      newPin: "",
    },
  });

  const changePinMutation = useMutation({
    mutationFn: ({
      cardNo,
      data,
    }: {
      cardNo: string;
      data: z.infer<typeof changePinSchema>;
    }) => {
      if (!selectedAccount) {
        return Promise.reject("Account number is required");
      }
      return changeCardPin(selectedAccount, cardNo, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards", selectedAccount] });
      toast({ title: "Card PIN changed successfully" });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Failed to change card PIN", variant: "destructive" });
    },
  });

  const handleChangePin = (data: z.infer<typeof changePinSchema>) => {
    if (editingCard) {
      changePinMutation.mutate({ cardNo: editingCard.cardNo, data });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Card PIN</DialogTitle>
        </DialogHeader>
        <FormProvider {...changePinForm}>
          <form onSubmit={changePinForm.handleSubmit(handleChangePin)} className="space-y-4">
            <FormField
              control={changePinForm.control}
              name="oldPin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Old PIN</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={changePinForm.control}
              name="newPin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New PIN</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={changePinMutation.isPending}>
              {changePinMutation.isPending ? "Changing..." : "Change PIN"}
            </Button>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
};