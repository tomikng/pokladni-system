import api from "@/api";
import { ApiTypes } from "@/app/types/api";
import DailySummary = ApiTypes.DailySummary;

export const fetchDailySummaries = async (
  access: string,
): Promise<DailySummary[]> => {
  const response = await api.get<DailySummary[]>(
    "/api/daily_closure/summaries/",
    {
      headers: {
        Authorization: `Bearer ${access}`,
      },
    },
  );
  return response.data;
};
