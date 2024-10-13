import { api } from "@/lib/axios"

export const fetchBeneficiaries = async (userId: number) => {
  const response = await api.get(`/users/${userId}/beneficiaries`)
  return response.data.data
}