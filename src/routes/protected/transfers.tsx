import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { ArrowRightIcon, Plus } from 'lucide-react'
import { api } from '@/lib/axios'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/AuthProvider"
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious,
} from "@/components/ui/pagination"
import { cn } from "@/lib/utils"
import { fetchAccounts } from '@/api/accounts/query'

// Enums
enum TransferStatus {
  PROCESSING = "PROCESSING",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
}

enum TransferType {
  ACCOUNT = "ACCOUNT",
  UPI = "UPI",
  CARD = "CARD",
}

// Interfaces
interface Transfer {
  referenceId: string
  payerTransactionId: number
  payeeTransactionId: number
  transferType: TransferType
  startedAt: number
  endedAt: number | null
  transferStatus: TransferStatus
  amount: number
  description: string
  payerTransaction: Transaction
  payeeTransaction: Transaction
}

interface Transaction {
  transactionId: number
  accNo: string
  userId: number
  amount: number
  transactionType: "WITHDRAWAL" | "DEPOSIT"
  transactionStatus: "SUCCESS" | "PENDING" | "FAILED"
  byCardNo: string | null
  upiId: string | null
  startedAt: number | null
  endedAt: number | null
  referenceId: string | null
  paymentMethod: "ACCOUNT" | "UPI" | "CARD"
}

interface Beneficiary {
  id: number
  name: string
  accNo: string
  upiId: string | null
}

interface Upi {
  upiId: string
}

interface Card {
  cardNo: string
}

// Schemas
const transferSchema = z.object({
  payerTransaction: z.object({
    accNo: z.string().optional(),
    upiId: z.string().optional(),
    cardNo: z.string().optional(),
  }),
  payeeTransaction: z.object({
    accNo: z.string().optional(),
    upiId: z.string().optional(),
    cardNo: z.string().optional(),
  }),
  amount: z.number().positive("Amount must be positive"),
  description: z.string().optional(),
  beneficiaryId: z.coerce.number().optional(),
})

// API functions
const fetchTransfers = async (userId: number): Promise<Transfer[]> => {
  const response = await api.get("/transfers")
  return response.data.data
}

const createTransfer = async (data: z.infer<typeof transferSchema>): Promise<Transfer> => {
  const { beneficiaryId, ...rest } = data
  const response = await api.post('/transfers', rest)
  return response.data.data
}

const fetchUPIs = async (accNo: string): Promise<Upi[]> => {
  const response = await api.get(`/accounts/${accNo}/upi`)
  return response.data.data
}

const fetchCards = async (accNo: string): Promise<Card[]> => {
  const response = await api.get(`/accounts/${accNo}/card`)
  return response.data.data
}

const fetchBeneficiaries = async (userId: number) => {
  const response = await api.get(`/users/${userId}/beneficiaries`)
  return response.data.data
}

export default function TransfersPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const { toast } = useToast()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const transferForm = useForm<z.infer<typeof transferSchema>>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      payerTransaction: {},
      payeeTransaction: {},
      amount: 0,
      description: "",
    },
  })
  
  const {accNo} = transferForm.watch("payerTransaction")

  console.log(transferForm.formState.errors)

  const { data: transfers, isLoading: transfersLoading } = useQuery<Transfer[], Error>({
    queryKey: ['transfers', user?.id],
    queryFn: () => user ? fetchTransfers(user.id) : Promise.reject("User ID is undefined"),
    enabled: !!user,
  })

  const { data: accounts } = useQuery({
    queryKey: ['accounts', user?.id],
    queryFn: () => user ? fetchAccounts(user.id) : Promise.reject("User ID is undefined"),
    enabled: !!user,
  })

  const { data: upis } = useQuery({
    queryKey: ['upis', accNo],
    queryFn: () => accNo ? fetchUPIs(accNo) : Promise.reject("AccNo ID is undefined"),
    enabled: !!accNo,
  })

  const { data: cards } = useQuery({
    queryKey: ['cards', accNo],
    queryFn: () => accNo ? fetchCards(accNo) : Promise.reject("AccNo ID is undefined"),
    enabled: !!accNo,
  })

  const { data: beneficiaries } = useQuery<Beneficiary[], Error>({
    queryKey: ['beneficiaries', user?.id],
    queryFn: () => user ? fetchBeneficiaries(user.id) : Promise.reject("User ID is undefined"),
    enabled: !!user,
  })

  const createTransferMutation = useMutation({
    mutationFn: createTransfer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers', user?.id] })
      toast({ title: "Transfer created successfully" })
      setIsAddDialogOpen(false)
    },
    onError: () => {
      toast({ title: "Failed to create transfer", variant: "destructive" })
    },
  })

  const handleCreateTransfer = (data: z.infer<typeof transferSchema>) => {
    createTransferMutation.mutate(data)
  }

  const paginatedTransfers = useMemo(
    () => transfers?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) || [],
    [transfers, currentPage]
  )

  const totalPages = useMemo(
    () => Math.ceil((transfers?.length || 0) / itemsPerPage),
    [transfers]
  )

  const handleBeneficiary = (beneficiaryId: string) => {
    const beneficary = beneficiaries?.find((b) => b.id === Number(beneficiaryId))
    if (beneficary?.accNo) {
      transferForm.setValue("payeeTransaction.accNo", beneficary.accNo)
    } else if (beneficary?.upiId) {
      transferForm.setValue("payeeTransaction.upiId", beneficary.upiId)
    }
    transferForm.setValue("beneficiaryId", Number(beneficiaryId))
  }

  if (transfersLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Transfers</h1>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Transfer History</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Transfer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Transfer</DialogTitle>
            </DialogHeader>
            <Form {...transferForm}>
              <form onSubmit={transferForm.handleSubmit(handleCreateTransfer)} className="space-y-4">
                <FormField
                  control={transferForm.control}
                  name="payerTransaction.accNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Account</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select account" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {accounts?.map((account) => (
                            <SelectItem key={account.accNo} value={account.accNo}>
                              {account.accNo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Controller
                  name="payerTransaction.upiId"
                  control={transferForm.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From UPI</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select UPI" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {upis?.map((upi) => (
                            <SelectItem key={upi.upiId} value={upi.upiId}>
                              {upi.upiId}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Controller
                  name="payerTransaction.cardNo"
                  control={transferForm.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Card</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Card" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {cards?.map((card) => (
                            <SelectItem key={card.cardNo} value={card.cardNo}>
                              **** **** **** {card.cardNo.slice(-4)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Controller
                  name="beneficiaryId"
                  control={transferForm.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>To Beneficiary</FormLabel>
                      <Select onValueChange={handleBeneficiary} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Beneficiary" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {beneficiaries?.map((beneficiary) => (
                            <SelectItem key={beneficiary.id} value={beneficiary.id.toString()}>
                              {beneficiary.name} - {beneficiary.accNo || beneficiary.upiId}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={transferForm.control}
                  name="payeeTransaction.accNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>To Account (Manual)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter account number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={transferForm.control}
                  name="payeeTransaction.upiId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>To UPI (Manual)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter UPI ID" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={transferForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={(e) => field.onChange(Number.parseFloat(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={transferForm.control}
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
                <Button type="submit" disabled={createTransferMutation.isPending}>
                  {createTransferMutation.isPending ? "Creating..." : "Create Transfer"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Reference ID</TableHead>
            <TableHead>From</TableHead>
            <TableHead>To</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedTransfers.map((transfer) => (
            <TableRow key={transfer.referenceId}>
              <TableCell>{transfer.referenceId}</TableCell>
              <TableCell>{transfer.payerTransaction.accNo || transfer.payerTransaction.upiId || transfer.payerTransaction.byCardNo}</TableCell>
              <TableCell>{transfer.payeeTransaction.accNo || transfer.payeeTransaction.upiId}</TableCell>
              <TableCell>{transfer.amount.toFixed(2)}</TableCell>
              <TableCell>{transfer.transferStatus}</TableCell>
              <TableCell>{new Date(transfer.startedAt).toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Pagination className="mt-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className={cn(
                
                {
                  "cursor-not-allowed opacity-60": currentPage === 1,
                  "hover:cursor-pointer": currentPage > 1,
                },
                "bg-black dark:bg-slate-100 text-white dark:text-black hover:bg-black/80 dark:hover:bg-slate-100/80 hover:text-gray-100 dark:hover:text-gray-900"
              )}
            />
          </PaginationItem>
          {[...Array(totalPages)].map((_, i) => (
            <PaginationItem key={i}>
              <PaginationLink
                onClick={() => setCurrentPage(i + 1)}
                isActive={currentPage === i + 1}
              >
                {i + 1}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              className={cn(
                {
                  "cursor-not-allowed opacity-60": currentPage === totalPages,
                  "hover:cursor-pointer": currentPage < totalPages,
                },
                "bg-black dark:bg-slate-100 text-white dark:text-black hover:bg-black/80 dark:hover:bg-slate-100/80 hover:text-gray-100 dark:hover:text-gray-900"
              )}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}