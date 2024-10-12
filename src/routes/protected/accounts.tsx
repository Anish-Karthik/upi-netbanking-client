import { closeAccount, createAccount, reopenAccount, updateAccount } from "@/api/accounts/mutation";
import { fetchAccounts, fetchBanks } from "@/api/accounts/query";
import { useAuth } from "@/components/AuthProvider";
import { ConfirmActionDialog } from "@/components/accounts/ConfirmDialog";
import {
  CreateBankAccountForm,
  type CreateBankAccountFormValues,
} from "@/components/accounts/CreateBankAccountForm";
import {
  EditBankAccountForm,
  type EditBankAccountFormValues,
} from "@/components/accounts/EditBankAccountForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/axios";
import { AccountType, type Bank, type BankAccount } from "@/types/account";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, RefreshCw, X } from "lucide-react";
import React, { useState } from "react";
import { Link } from "react-router-dom";


export default function AccountsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(
    null
  );
  const [confirmingAction, setConfirmingAction] = useState<{
    account: BankAccount;
    action: "close" | "reopen";
  } | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: accounts,
    isLoading,
    isError,
  } = useQuery<BankAccount[], Error>({
    queryKey: ["accounts", user?.id],
    queryFn: () =>
      user ? fetchAccounts(user.id) : Promise.reject("User ID is undefined"),
    enabled: !!user,
  });

  const { data: banks } = useQuery<Bank[], Error>({
    queryKey: ["banks"],
    queryFn: fetchBanks,
  });

  const createAccountMutation = useMutation({
    mutationFn: (data: CreateBankAccountFormValues) =>
      createAccount(user!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts", user?.id] });
      toast({
        title: "Account created",
        description: "Your new account has been successfully created.",
      });
      setIsCreateDialogOpen(false);
    },
    onError: (_error) => {
      toast({
        title: "Error",
        description: "Failed to create account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateAccountMutation = useMutation({
    mutationFn: ({
      accNo,
      data,
    }: {
      accNo: string;
      data: EditBankAccountFormValues;
    }) => updateAccount(user!.id, accNo, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts", user?.id] });
      toast({
        title: "Account updated",
        description: "Your account has been successfully updated.",
      });
      setIsEditDialogOpen(false);
      setEditingAccount(null);
    },
    onError: (_error) => {
      toast({
        title: "Error",
        description: "Failed to update account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const closeAccountMutation = useMutation({
    mutationFn: (accNo: string) => closeAccount(user!.id, accNo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts", user?.id] });
      toast({
        title: "Account closed",
        description: "The account has been successfully closed.",
      });
      setIsConfirmDialogOpen(false);
      setConfirmingAction(null);
    },
    onError: (_error) => {
      toast({
        title: "Error",
        description: "Failed to close account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const reopenAccountMutation = useMutation({
    mutationFn: (accNo: string) => reopenAccount(user!.id, accNo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts", user?.id] });
      toast({
        title: "Account reopened",
        description: "The account has been successfully reopened.",
      });
      setIsConfirmDialogOpen(false);
      setConfirmingAction(null);
    },
    onError: (_error) => {
      toast({
        title: "Error",
        description: "Failed to reopen account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateSubmit = (data: CreateBankAccountFormValues) => {
    createAccountMutation.mutate(data);
  };

  const handleEditSubmit = (data: EditBankAccountFormValues) => {
    if (editingAccount) {
      updateAccountMutation.mutate({ accNo: editingAccount.accNo, data });
    }
  };

  const handleEdit = (account: BankAccount) => {
    setEditingAccount(account);
    setIsEditDialogOpen(true);
  };

  const handleToggleAccountStatus = (account: BankAccount) => {
    setConfirmingAction({
      account,
      action: account.status === "ACTIVE" ? "close" : "reopen",
    });
    setIsConfirmDialogOpen(true);
  };

  const confirmToggleAccountStatus = () => {
    if (confirmingAction) {
      if (confirmingAction.action === "close") {
        closeAccountMutation.mutate(confirmingAction.account.accNo);
      } else {
        reopenAccountMutation.mutate(confirmingAction.account.accNo);
      }
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error loading accounts. Please try again later.</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Bank Accounts</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>Open New Account</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Open New Bank Account</DialogTitle>
            </DialogHeader>
            <CreateBankAccountForm
              onSubmit={handleCreateSubmit}
              banks={banks || []}
              isSubmitting={createAccountMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Account Number</TableHead>
            <TableHead>Bank</TableHead>
            <TableHead>Account Type</TableHead>
            <TableHead>Balance</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts?.map((account) => (
            <TableRow key={account.accNo}>
              <TableCell>{account.accNo}</TableCell>
              <TableCell>{account.bank.name}</TableCell>
              <TableCell>{account.accountType}</TableCell>
              <TableCell>{account.balance.toFixed(2)}</TableCell>
              <TableCell>{account.status}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleEdit(account)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleToggleAccountStatus(account)}
                    disabled={
                      closeAccountMutation.isPending ||
                      reopenAccountMutation.isPending
                    }
                  >
                    {account.status === "ACTIVE" ? (
                      <X className="h-4 w-4" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Bank Account</DialogTitle>
          </DialogHeader>
          {editingAccount && (
            <EditBankAccountForm
              onSubmit={handleEditSubmit}
              initialData={{
                accountType: editingAccount.accountType,
                status: editingAccount.status,
              }}
              isSubmitting={updateAccountMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
      <ConfirmActionDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => {
          setIsConfirmDialogOpen(false);
          setConfirmingAction(null);
        }}
        onConfirm={confirmToggleAccountStatus}
        title={
          confirmingAction?.action === "close"
            ? "Close Account"
            : "Reopen Account"
        }
        description={`Are you sure you want to ${
          confirmingAction?.action
        } this account?${
          confirmingAction?.action === "close"
            ? " This action cannot be undone."
            : ""
        }`}
        confirmText={
          confirmingAction?.action === "close"
            ? "Close Account"
            : "Reopen Account"
        }
      />
    </div>
  );
}
