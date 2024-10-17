import { api } from "@/lib/axios";
import type { SearchUser } from "@/types/search-user";

export const fetchUsers = async ({
  search,
  page,
  size
}: {
  search: string;
  page: number;
  size: number;
}): Promise<SearchUser[]> => {
  const response = await api.get(`/users/search?search=${search}&page=${page}&size=${size}`);
  return response.data.data;
}