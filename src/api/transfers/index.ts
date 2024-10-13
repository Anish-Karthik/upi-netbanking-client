import { api } from "@/lib/axios"
import type { transferSchema } from "@/schema/transfer"
import type { Transfer } from "@/types/transfer"
import type { z } from "zod"

// API functions
export const fetchTransfers = async (): Promise<Transfer[]> => {
  const response = await api.get("/transfers")
  return response.data.data
}

export const createTransfer = async (data: z.infer<typeof transferSchema>): Promise<Transfer> => {
  const { beneficiaryId, ...rest } = data
  const response = await api.post('/transfers', rest)
  return response.data.data
}