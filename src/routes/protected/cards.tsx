import {
  blockCard,
  fetchAccounts,
  fetchCards,
  updateCardStatus
} from "@/api/cards";
import { useAuth } from "@/components/AuthProvider";
import { AddCardDialog } from "@/components/cards/AddCardDialog";
import { CardTable } from "@/components/cards/CardTable";
import { ChangePinDialog } from "@/components/cards/ChangePinDialog";
import { EditStatusDialog } from "@/components/cards/EditStatusDialog";
import { UpdateCardForm } from "@/components/cards/UpdateCardForm";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { BankAccount } from "@/types/account";
import { type Card, CardStatus } from "@/types/card";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

export default function CardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedAccount = searchParams.get("accNo");
  const setSelectedAccount = (accNo: string) => {
    setSearchParams({ accNo });
  };

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditStatusDialogOpen, setIsEditStatusDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isChangePinDialogOpen, setIsChangePinDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: cards, isLoading: cardsLoading } = useQuery<Card[], Error>({
    queryKey: ["cards", selectedAccount],
    queryFn: () =>
      selectedAccount
        ? fetchCards(selectedAccount)
        : Promise.reject("Account number is undefined"),
    enabled: !!selectedAccount,
  });

  const { data: accounts, isLoading: accountsLoading } = useQuery<
    BankAccount[],
    Error
  >({
    queryKey: ["accounts", user?.id],
    queryFn: () =>
      user ? fetchAccounts(user.id) : Promise.reject("User ID is undefined"),
    enabled: !!user,
  });

  useEffect(() => {
    if (!selectedAccount && accounts?.length) {
      setSearchParams({ accNo: accounts[0].accNo });
    }
  }, [selectedAccount, setSearchParams, accounts]);

  const updateStatusMutation = useMutation({
    mutationFn: ({
      cardNo,
      status,
    }: {
      cardNo: string;
      status: CardStatus;
    }) => {
      if (!selectedAccount) {
        return Promise.reject("Account number is required");
      }
      return updateCardStatus(selectedAccount, cardNo, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards", selectedAccount] });
      toast({ title: "Card status updated successfully" });
      setIsEditStatusDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to update card status", variant: "destructive" });
    },
  });

  const blockCardMutation = useMutation({
    mutationFn: (cardNo: string) => {
      if (!selectedAccount) {
        return Promise.reject("Account number is required");
      }
      return blockCard(selectedAccount, cardNo);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards", selectedAccount] });
      toast({ title: "Card blocked successfully" });
    },
    onError: () => {
      toast({ title: "Failed to block card", variant: "destructive" });
    },
  });

  const handleBlockCard = (card: Card) => {
    blockCardMutation.mutate(card.cardNo);
  };

  const unBlockCard = (card: Card) => {
    updateStatusMutation.mutate({
      cardNo: card.cardNo,
      status: CardStatus.ACTIVE,
    });
  };

  if (cardsLoading || accountsLoading) {
    return <div>Loading...</div>;
  }

  const filteredCards =
    cards?.filter((card) => card.accNo === selectedAccount) || [];
  const activeAccounts =
    accounts?.filter((account) => account.status === "ACTIVE") || [];

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Card Management</h1>
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
        <h2 className="text-xl font-semibold">Card List</h2>
        <AddCardDialog
          isOpen={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          selectedAccount={selectedAccount}
          activeAccounts={activeAccounts}
        />
      </div>
      <CardTable
        cards={filteredCards}
        handleBlockCard={handleBlockCard}
        setEditingCard={setEditingCard}
        setIsEditDialogOpen={setIsEditDialogOpen}
        setIsEditStatusDialogOpen={setIsEditStatusDialogOpen}
        setIsChangePinDialogOpen={setIsChangePinDialogOpen}
        unBlockCard={unBlockCard}
      />
      <UpdateCardForm
        editingCard={editingCard}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        selectedAccount={selectedAccount}
      />
      <EditStatusDialog
        editingCard={editingCard}
        isOpen={isEditStatusDialogOpen}
        onOpenChange={setIsEditStatusDialogOpen}
        selectedAccount={selectedAccount}
      />
      <ChangePinDialog
        editingCard={editingCard}
        isOpen={isChangePinDialogOpen}
        onOpenChange={setIsChangePinDialogOpen}
        selectedAccount={selectedAccount}
      />
    </div>
  );
}
