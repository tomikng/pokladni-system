import api from "@/api";
import { ApiTypes } from "@/app/types/api";
import CreateDailySummary = ApiTypes.CreateDailySummary;

export const calculateDailySummary = async (
  access: string,
  data: CreateDailySummary,
): Promise<void> => {
  await api.post("/api/daily_closure/calculate/", data, {
    headers: {
      Authorization: `Bearer ${access}`,
    },
  });
};
