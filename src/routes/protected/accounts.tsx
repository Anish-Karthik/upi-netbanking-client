import { useAuth } from "@/components/AuthProvider";
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
import { AccountType, type BankAccount, type Bank } from "@/types/account";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, X } from "lucide-react";
import { useState } from "react";
import * as z from "zod";


// Form schema
const formSchema = z.object({
  accountType: z.nativeEnum(AccountType),
  bankId: z.number(),
});

type FormValues = z.infer<typeof formSchema>;

// API functions
const fetchAccounts = async (userId: number): Promise<BankAccount[]> => {
  const response = await api.get(`/user/${userId}/accounts`);
  return response.data.data;
};

const fetchBanks = async (): Promise<Bank[]> => {
  const response = await api.get("/banks");
  return response.data.data;
};

const createAccount = async (
  userId: number,
  data: FormValues
): Promise<BankAccount> => {
  const response = await api.post(`/user/${userId}/accounts`, data);
  return response.data.data;
};

const updateAccount = async (
  userId: number,
  accNo: string,
  data: EditBankAccountFormValues
): Promise<BankAccount> => {
  const response = await api.put(`/user/${userId}/accounts/${accNo}`, data);
  return response.data.data;
};

const closeAccount = async (userId: number, accNo: string): Promise<void> => {
  await api.delete(`/user/${userId}/accounts/${accNo}`);
};

// Enums and interfaces (as before)
// ...

// API functions (as before)
// ...

export default function AccountsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(
    null
  );
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
    onError: (error) => {
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
    onError: (error) => {
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
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to close account. Please try again.",
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

  const handleClose = (accNo: string) => {
    closeAccountMutation.mutate(accNo);
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
                    onClick={() => handleClose(account.accNo)}
                    disabled={closeAccountMutation.isPending}
                  >
                    <X className="h-4 w-4" />
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
    </div>
  );
}
