import { useAuth } from "@/components/AuthProvider";
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
import { api } from "@/lib/axios";
import type { BankAccount } from "@/types/account";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, Plus, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useParams, useSearchParams } from "react-router-dom";
import * as z from "zod";

// Enums
enum UpiStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  CLOSED = "CLOSED",
}

// Interfaces
interface UPI {
  upiId: string;
  accNo: string;
  userId: number;
  status: UpiStatus;
  isDefault: boolean;
}

// Schemas
const addUpiSchema = z.object({
  accNo: z.string().min(1, "Account number is required"),
  upiPin: z.string().min(4, "UPI PIN must be at least 4 characters"),
});

const editStatusSchema = z.object({
  status: z.nativeEnum(UpiStatus),
});

const changePinSchema = z.object({
  oldPin: z.string().min(4, "Old PIN must be at least 4 characters"),
  newPin: z.string().min(4, "New PIN must be at least 4 characters"),
});

// API functions
const fetchUPIs = async (accNo: string): Promise<UPI[]> => {
  const response = await api.get(`/accounts/${accNo}/upi`);
  return response.data.data;
};

const fetchAccounts = async (userId: number): Promise<BankAccount[]> => {
  const response = await api.get(`/users/${userId}/accounts`);
  return response.data.data;
};

const addUPI = async (
  accNo: string,
  data: z.infer<typeof addUpiSchema> & { userId: number }
): Promise<UPI> => {
  const response = await api.post(`/accounts/${accNo}/upi`, data);
  return response.data.data;
};

const updateUPIStatus = async (
  accNo: string,
  upiId: string,
  status: UpiStatus
): Promise<UPI> => {
  const response = await api.put(`/accounts/${accNo}/upi/${upiId}/status`, {
    status,
  });
  return response.data.data;
};

const changeUPIPin = async (
  accNo: string,
  upiId: string,
  data: z.infer<typeof changePinSchema>
): Promise<UPI> => {
  const response = await api.put(`/accounts/${accNo}/upi/${upiId}/pin`, data);
  return response.data.data;
};

const toggleDefaultUPI = async (accNo: string, upiId: string): Promise<UPI> => {
  const response = await api.put(`/accounts/${accNo}/upi/${upiId}/default`, {
    isDefault: true,
  });
  return response.data.data;
};

const closeUPI = async (accNo: string, upiId: string): Promise<void> => {
  await api.delete(`/accounts/${accNo}/upi/${upiId}`);
};

export default function UpiPage() {
  // get from search params
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedAccount = searchParams.get("accNo");
  console.log(selectedAccount);
  const setSelectedAccount = (accNo: string) => {
    setSearchParams({ accNo });
  };
  console.log("selected acc", selectedAccount);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditStatusDialogOpen, setIsEditStatusDialogOpen] = useState(false);
  const [isChangePinDialogOpen, setIsChangePinDialogOpen] = useState(false);
  const [editingUPI, setEditingUPI] = useState<UPI | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: upis, isLoading: upisLoading } = useQuery<UPI[], Error>({
    queryKey: ["upis", selectedAccount],
    queryFn: () =>
      selectedAccount
        ? fetchUPIs(selectedAccount)
        : Promise.reject("User ID is undefined"),
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

  const addUpiMutation = useMutation({
    mutationFn: (data: z.infer<typeof addUpiSchema> & { userId: number }) => {
      if (!selectedAccount) {
        return Promise.reject("Account number is required");
      }
      return addUPI(selectedAccount, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["upis", selectedAccount] });
      toast({ title: "UPI added successfully" });
      setIsAddDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to add UPI", variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ upiId, status }: { upiId: string; status: UpiStatus }) => {
      if (!selectedAccount) {
        return Promise.reject("Account number is required");
      }
      return updateUPIStatus(selectedAccount, upiId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["upis", selectedAccount] });
      toast({ title: "UPI status updated successfully" });
      setIsEditStatusDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to update UPI status", variant: "destructive" });
    },
  });

  const changePinMutation = useMutation({
    mutationFn: ({
      upiId,
      data,
    }: {
      upiId: string;
      data: z.infer<typeof changePinSchema>;
    }) => {
      if (!selectedAccount) {
        return Promise.reject("Account number is required");
      }
      return changeUPIPin(selectedAccount, upiId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["upis", selectedAccount] });
      toast({ title: "UPI PIN changed successfully" });
      setIsChangePinDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to change UPI PIN", variant: "destructive" });
    },
  });

  const toggleDefaultMutation = useMutation({
    mutationFn: (upiId: string) => {
      if (!selectedAccount) {
        return Promise.reject("Account number is required");
      }
      return toggleDefaultUPI(selectedAccount, upiId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["upis", selectedAccount] });
      toast({ title: "Default UPI updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update default UPI", variant: "destructive" });
    },
  });

  const closeUpiMutation = useMutation({
    mutationFn: (upiId: string) => {
      if (!selectedAccount) {
        return Promise.reject("Account number is required");
      }
      return closeUPI(selectedAccount, upiId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["upis", selectedAccount] });
      toast({ title: "UPI closed successfully" });
    },
    onError: () => {
      toast({ title: "Failed to close UPI", variant: "destructive" });
    },
  });

  const addUpiForm = useForm<z.infer<typeof addUpiSchema>>({
    resolver: zodResolver(addUpiSchema),
    defaultValues: {
      accNo: selectedAccount || "",
      upiPin: "",
    },
  });

  const editStatusForm = useForm<z.infer<typeof editStatusSchema>>({
    resolver: zodResolver(editStatusSchema),
    defaultValues: {
      status: UpiStatus.ACTIVE,
    },
  });

  const changePinForm = useForm<z.infer<typeof changePinSchema>>({
    resolver: zodResolver(changePinSchema),
    defaultValues: {
      oldPin: "",
      newPin: "",
    },
  });

  const handleAddUpi = (data: z.infer<typeof addUpiSchema>) => {
    if (user) {
      addUpiMutation.mutate({ ...data, userId: user.id });
    }
  };

  const handleEditStatus = (data: z.infer<typeof editStatusSchema>) => {
    if (editingUPI) {
      updateStatusMutation.mutate({
        upiId: editingUPI.upiId,
        status: data.status,
      });
    }
  };

  const handleChangePin = (data: z.infer<typeof changePinSchema>) => {
    if (editingUPI) {
      changePinMutation.mutate({ upiId: editingUPI.upiId, data });
    }
  };

  const handleToggleDefault = (upi: UPI) => {
    toggleDefaultMutation.mutate(upi.upiId);
  };

  const handleCloseUpi = (upi: UPI) => {
    closeUpiMutation.mutate(upi.upiId);
  };

  const handleReOpenUpi = (upi: UPI) => {
    updateStatusMutation.mutate({
      upiId: upi.upiId,
      status: UpiStatus.ACTIVE,
    });
  }

  if (upisLoading || accountsLoading) {
    return <div>Loading...</div>;
  }

  const filteredUPIs =
    upis?.filter((upi) => upi.accNo === selectedAccount) || [];
  const activeAccounts =
    accounts?.filter((account) => account.status === "ACTIVE") || [];

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">UPI Management</h1>
      <div className="mb-6">
        {selectedAccount && (
          <Select
            value={selectedAccount || ""}
            defaultValue={selectedAccount || ""}
            onValueChange={setSelectedAccount}
          >
            <SelectTrigger
              className="w-[300px]"
              defaultValue={selectedAccount || ""}
            >
              <SelectValue
                placeholder="Select an account"
                defaultValue={selectedAccount}
              />
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
        <h2 className="text-xl font-semibold">UPI List</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add UPI
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New UPI</DialogTitle>
            </DialogHeader>
            <Form {...addUpiForm}>
              <form
                onSubmit={addUpiForm.handleSubmit(handleAddUpi)}
                className="space-y-4"
              >
                <FormField
                  control={addUpiForm.control}
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
                  control={addUpiForm.control}
                  name="upiPin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>UPI PIN</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={addUpiMutation.isPending}>
                  {addUpiMutation.isPending ? "Adding..." : "Add UPI"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>UPI ID</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Default</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredUPIs.map((upi) => (
            <TableRow key={upi.upiId}>
              <TableCell>{upi.upiId}</TableCell>
              <TableCell>{upi.status}</TableCell>
              <TableCell>{upi.isDefault ? "Yes" : "No"}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingUPI(upi);
                      setIsEditStatusDialogOpen(true);
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" /> Status
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingUPI(upi);
                      setIsChangePinDialogOpen(true);
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" /> PIN
                  </Button>
                  <Button
                    variant={upi.isDefault ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleToggleDefault(upi)}
                  >
                    {upi.isDefault ? "Default" : "Set Default"}
                  </Button>
                  {upi.status !== UpiStatus.CLOSED ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCloseUpi(upi)}
                    >
                      <X className="mr-2 h-4 w-4" /> Close
                    </Button>
                  ): (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReOpenUpi(upi)}
                    >
                      <Plus className="mr-2 h-4 w-4" /> Reopen
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog
        open={isEditStatusDialogOpen}
        onOpenChange={setIsEditStatusDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit UPI Status</DialogTitle>
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
                        {Object.values(UpiStatus).map((status) => (
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
            <DialogTitle>Change UPI PIN</DialogTitle>
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
