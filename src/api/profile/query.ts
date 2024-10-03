import { api } from "@/lib/axios"
import { UserData } from "@/routes/protected/profile";


export const getProfile = async (userId: number): Promise<UserData> => {
  const response = await api.get(`/profile/${userId}`)
  const data: UserData = response.data.data;
  console.log(data)
  data.dob = new Date(data.dob)
  return data
}