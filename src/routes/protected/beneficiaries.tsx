import { useAuth } from "@/components/AuthProvider"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { api } from '@/lib/axios'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Edit, Plus, Trash2 } from 'lucide-react'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

interface Beneficiary {
  id: number
  name: string
  accNo: string
  beneficiaryOfUserId: number
  description: string
  upiId: string | null
}

const beneficiarySchema = z.object({
  name: z.string().min(1, "Name is required"),
  accNo: z.string().min(1, "Account number is required"),
  description: z.string().optional(),
  upiId: z.string().optional().nullable(),
})

const fetchBeneficiaries = async (userId: number): Promise<Beneficiary[]> => {
  const response = await api.get(`/users/${userId}/beneficiaries`)
  return response.data.data
}

const createBeneficiary = async (userId: number, data: z.infer<typeof beneficiarySchema>): Promise<Beneficiary> => {
  const response = await api.post(`/users/${userId}/beneficiaries`, {
    ...data,
    beneficiaryOfUserId: userId,
  })
  return response.data.data
}

export default function BeneficiariesPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const { toast } = useToast()
  const { user, loading } = useAuth()
  const queryClient = useQueryClient()

  const { data: beneficiaries, isLoading } = useQuery<Beneficiary[], Error>({
    queryKey: ['beneficiaries', user?.id],
    queryFn: () => user ? fetchBeneficiaries(user.id) : Promise.reject("User ID is undefined"),
    enabled: !!user,
  })

  const createBeneficiaryMutation = useMutation({
    mutationFn: (data: z.infer<typeof beneficiarySchema>) => {
      if (!user) throw new Error("User is not authenticated")
      return createBeneficiary(user.id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficiaries', user?.id] })
      toast({ title: "Beneficiary added successfully" })
      setIsAddDialogOpen(false)
    },
    onError: () => {
      toast({ title: "Failed to add beneficiary", variant: "destructive" })
    },
  })

  const beneficiaryForm = useForm<z.infer<typeof beneficiarySchema>>({
    resolver: zodResolver(beneficiarySchema),
    defaultValues: {
      name: "",
      accNo: "",
      description: "",
      upiId: null,
    },
  })

  const handleCreateBeneficiary = (data: z.infer<typeof beneficiarySchema>) => {
    createBeneficiaryMutation.mutate(data)
  }

  if (isLoading || loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Beneficiaries</h1>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Beneficiary List</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Beneficiary
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Beneficiary</DialogTitle>
            </DialogHeader>
            <Form {...beneficiaryForm}>
              <form
                onSubmit={beneficiaryForm.handleSubmit(handleCreateBeneficiary)}
                className="space-y-4"
              >
                <FormField
                  control={beneficiaryForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={beneficiaryForm.control}
                  name="accNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Number</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={beneficiaryForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
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
                      <FormLabel>UPI ID (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={createBeneficiaryMutation.isPending}>
                  {createBeneficiaryMutation.isPending ? "Adding..." : "Add Beneficiary"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Account Number</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>UPI ID</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {beneficiaries?.map((beneficiary) => (
            <TableRow key={beneficiary.id}>
              <TableCell>{beneficiary.name}</TableCell>
              <TableCell>{beneficiary.accNo}</TableCell>
              <TableCell>{beneficiary.description}</TableCell>
              <TableCell>{beneficiary.upiId || 'N/A'}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Edit className="mr-2 h-4 w-4" /> Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}