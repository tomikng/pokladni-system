import api from "@/api";
import { ApiTypes } from "@/app/types/api";
import SaleStatistics = ApiTypes.SaleStatistics;

export const fetchSaleStatistics = async (
  accessToken: string,
  period: string,
  startDate?: string,
  endDate?: string,
): Promise<SaleStatistics> => {
  try {
    if (startDate && endDate) {
      const response = await api.get(
        `/stats/sales/?start_date=${startDate}&end_date=${endDate}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      return response.data;
    }

    const response = await api.get(`/stats/sales/${period}/`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching sale statistics:", error);
    throw error;
  }
};

export default api;
