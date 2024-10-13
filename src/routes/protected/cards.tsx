import { addCard, blockCard, changeCardPin, fetchAccounts, fetchCards, updateCardStatus } from "@/api/cards";
import { useAuth } from "@/components/AuthProvider";
import { UpdateCardForm } from "@/components/cards/UpdateCardForm";
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
import { addCardSchema, changePinSchema, editStatusSchema } from "@/schema/card";
import type { BankAccount } from "@/types/account";
import { type Card, CardCategory, CardStatus, CardType } from "@/types/card";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "react-router-dom";
import type * as z from "zod";


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
      setIsAddDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to add card", variant: "destructive" });
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
      setIsEditStatusDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to update card status", variant: "destructive" });
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
      setIsChangePinDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to change card PIN", variant: "destructive" });
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

  const editStatusForm = useForm<z.infer<typeof editStatusSchema>>({
    resolver: zodResolver(editStatusSchema),
    defaultValues: {
      status: CardStatus.ACTIVE,
    },
  });

  const changePinForm = useForm<z.infer<typeof changePinSchema>>({
    resolver: zodResolver(changePinSchema),
    defaultValues: {
      oldPin: "",
      newPin: "",
    },
  });

  const handleAddCard = (data: z.infer<typeof addCardSchema>) => {
    if (user) {
      addCardMutation.mutate({ ...data, userId: user.id });
    }
  };

  const handleEditStatus = (data: z.infer<typeof editStatusSchema>) => {
    if (editingCard) {
      updateStatusMutation.mutate({
        cardNo: editingCard.cardNo,
        status: data.status,
      });
    }
  };

  const handleChangePin = (data: z.infer<typeof changePinSchema>) => {
    if (editingCard) {
      changePinMutation.mutate({ cardNo: editingCard.cardNo, data });
    }
  };

  const handleBlockCard = (card: Card) => {
    blockCardMutation.mutate(card.cardNo);
  };

  const unBlockCard = (card: Card) => {
    updateStatusMutation.mutate({
      cardNo: card.cardNo,
      status: CardStatus.ACTIVE,
    });
  }

  if (cardsLoading || accountsLoading) {
    return <div>Loading...</div>;
  }

  const filteredCards = cards?.filter((card) => card.accNo === selectedAccount) || [];
  const activeAccounts = accounts?.filter((account) => account.status === "ACTIVE") || [];

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Card Management</h1>
      <div className="mb-6">
        {selectedAccount && (
          <Select
            value={selectedAccount}
            onValueChange={setSelectedAccount}
          >
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
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Card
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Card</DialogTitle>
            </DialogHeader>
            <Form {...addCardForm}>
              <form
                onSubmit={addCardForm.handleSubmit(handleAddCard)}
                className="space-y-4"
              >
                <FormField
                  control={addCardForm.control}
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
                  control={addCardForm.control}
                  name="cardType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Card Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
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
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
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
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Card Number</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Expiry Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredCards.map((card) => (
            <TableRow key={card.cardNo}>
              <TableCell>**** **** **** {card.cardNo.slice(-4)}</TableCell>
              <TableCell>{card.cardType}</TableCell>
              <TableCell>{card.cardCategory}</TableCell>
              <TableCell>{card.status}</TableCell>
              <TableCell>{card.validTill}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingCard(card);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingCard(card);
                      setIsEditStatusDialogOpen(true);
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" /> Status
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingCard(card);
                      setIsChangePinDialogOpen(true);
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" /> PIN
                  </Button>
                  {card.status !== CardStatus.BLOCKED ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBlockCard(card)}
                    >
                      <X className="mr-2 h-4 w-4" /> Block
                    </Button>
                  ):(
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => unBlockCard(card)}
                    >
                      <Plus className="mr-2 h-4 w-4" /> Unblock
                    </Button>
                  )}

                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <UpdateCardForm
        editingCard={editingCard}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        selectedAccount={selectedAccount}
      />
      <Dialog
        open={isEditStatusDialogOpen}
        onOpenChange={setIsEditStatusDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Card Status</DialogTitle>
          </DialogHeader>
          <Form {...editStatusForm}>
            <form
              onSubmit={editStatusForm.handleSubmit(handleEditStatus)}
              className="space-y-4"
            >
              <FormField
                control={editStatusForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
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
                {updateStatusMutation.isPending
                  ? "Updating..."
                  : "Update Status"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={isChangePinDialogOpen}
        onOpenChange={setIsChangePinDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Card PIN</DialogTitle>
          </DialogHeader>
          <Form {...changePinForm}>
            <form
              onSubmit={changePinForm.handleSubmit(handleChangePin)}
              className="space-y-4"
            >
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
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}