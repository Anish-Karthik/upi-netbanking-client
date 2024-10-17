import { api } from "@/lib/axios";
import type { transferSchema } from "@/schema/transfer";
import type { Transfer } from "@/types/transfer";
import type { z } from "zod";

// API functions
export const fetchTransfers = async (): Promise<Transfer[]> => {
  const response = await api.get("/transfers");
  const transfers: Transfer[] = response.data.data;
  transfers.sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  );
  return transfers;
};

export const createTransfer = async (
  data: z.infer<typeof transferSchema>
): Promise<Transfer> => {
  const { beneficiaryId, ...rest } = data;
  const response = await api.post("/transfers", rest);
  return response.data.data;
};
