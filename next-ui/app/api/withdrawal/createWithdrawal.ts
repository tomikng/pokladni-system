import api from "@/api";
import { ApiTypes } from "@/app/types/api";
import CreateWithdrawal = ApiTypes.CreateWithdrawal;

export const createWithdrawal = async (
  access: string,
  data: CreateWithdrawal,
): Promise<void> => {
  await api.post("/api/withdrawals/add_withdrawal/", data, {
    headers: {
      Authorization: `Bearer ${access}`,
    },
  });
};
