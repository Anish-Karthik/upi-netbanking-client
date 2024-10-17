import { createBeneficiary } from "@/api/beneficiaries";
import { fetchUsers } from "@/api/users/search";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import type { SearchUser } from "@/types/search-user";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  upiIds: string[];
}

const searchSchema = z.object({
  search: z.string().min(1, "Search term is required"),
});

const beneficiarySchema = z.object({
  name: z.string().min(1, "Name is required"),
  upiId: z.string().min(1, "UPI ID is required"),
});

const ITEMS_PER_PAGE = 10;

export default function UserSearchPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const searchForm = useForm<z.infer<typeof searchSchema>>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      search: "",
    },
  });

  const beneficiaryForm = useForm<z.infer<typeof beneficiarySchema>>({
    resolver: zodResolver(beneficiarySchema),
  });

  const {
    data: searchResults,
    isLoading,
    error,
  } = useQuery<SearchUser[]>({
    queryKey: ["users", search, page],
    queryFn: async () =>
      await fetchUsers({ search, page, size: ITEMS_PER_PAGE }),
    enabled: !!search,
  });

  const addBeneficiaryMutation = useMutation({
    mutationFn: (data: z.infer<typeof beneficiarySchema>) =>
      createBeneficiary(user!.id, data),
    onSuccess: () => {
      toast({ title: "Beneficiary added successfully" });
      queryClient.invalidateQueries({ queryKey: ["beneficiaries"] });
    },
    onError: () => {
      toast({ title: "Failed to add beneficiary", variant: "destructive" });
    },
  });

  const onSearch = (data: z.infer<typeof searchSchema>) => {
    setSearch(data.search);
    setPage(1);
  };

  const onAddBeneficiary = (userId: number) => {
    const user = searchResults?.find((u) => u.id === userId);
    if (user) {
      beneficiaryForm.setValue("name", user.name);
      beneficiaryForm.setValue("upiId", user.upiIds[0] || "");
    }
  };

  const onSubmitBeneficiary = (
    data: z.infer<typeof beneficiarySchema>,
  ) => {
    addBeneficiaryMutation.mutate({ ...data });
  };

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>User Search</CardTitle>
          <CardDescription>
            Search for users and add them as beneficiaries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...searchForm}>
            <form
              onSubmit={searchForm.handleSubmit(onSearch)}
              className="space-y-8"
            >
              <FormField
                control={searchForm.control}
                name="search"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Search Users</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter name, email, or phone"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Search</Button>
            </form>
          </Form>

          {isLoading && <p>Loading...</p>}
          {error && <p>Error: {(error as Error).message}</p>}

          {searchResults && (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>UPI IDs</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searchResults.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phone}</TableCell>
                      <TableCell>{user.upiIds.join(", ")}</TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button onClick={() => onAddBeneficiary(user.id)}>
                              Add as Beneficiary
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add Beneficiary</DialogTitle>
                              <DialogDescription>
                                Add this user as a beneficiary
                              </DialogDescription>
                            </DialogHeader>
                            <Form {...beneficiaryForm}>
                              <form
                                onSubmit={beneficiaryForm.handleSubmit((data) =>
                                  onSubmitBeneficiary(data)
                                )}
                                className="space-y-8"
                              >
                                <FormField
                                  control={beneficiaryForm.control}
                                  name="name"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Name</FormLabel>
                                      <FormControl>
                                        <Input {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={beneficiaryForm.control}
                                  name="upiId"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>UPI ID</FormLabel>
                                      <FormControl>
                                        <Input {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <Button type="submit">Add Beneficiary</Button>
                              </form>
                            </Form>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink>{page}</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext onClick={() => setPage((p) => p + 1)} />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
