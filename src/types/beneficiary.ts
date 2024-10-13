
export interface Beneficiary {
  id: number
  name: string
  accNo: string
  beneficiaryOfUserId: number
  description: string
  upiId: string | null
}
