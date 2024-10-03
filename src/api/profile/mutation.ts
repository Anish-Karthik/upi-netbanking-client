import { api } from "@/lib/axios"
import { UserData } from "@/routes/protected/profile";

type UpdateProfileDTO = {
  name: string;
  dob: Date;
  address: string;
}

export const convertToDTO = (userData: UserData): UpdateProfileDTO => {
  return {
    name: userData.name,
    dob: userData.dob,
    address: userData.address
  }
}

export const updateProfile = async (userId: number, userData: UserData): Promise<UpdateProfileDTO> => {
  const response = await api.put(`/profile/${userId}`, convertToDTO(userData))
  return response.data.data;
}