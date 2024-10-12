import { api } from "@/lib/axios";
import type { UserData } from "@/routes/protected/profile";

export const getProfile = async (userId: number): Promise<UserData> => {
  const response = await api.get(`/users/${userId}/profile`);
  const data: UserData = response.data.data;
  data.dob = new Date(data.dob);
  return data;
};
