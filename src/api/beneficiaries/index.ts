import { api } from "@/lib/axios"
import type { beneficiarySchema } from "@/schema/beneficiary"
import type { Beneficiary } from "@/types/beneficiary"
import type { z } from "zod"

export const fetchBeneficiaries = async (userId: number): Promise<Beneficiary[]> => {
  const response = await api.get(`/users/${userId}/beneficiaries`)
  return response.data.data
}

export const createBeneficiary = async (userId: number, data: z.infer<typeof beneficiarySchema>): Promise<Beneficiary> => {
  const response = await api.post(`/users/${userId}/beneficiaries`, {
    ...data,
    beneficiaryOfUserId: userId,
  })
  return response.data.data
}