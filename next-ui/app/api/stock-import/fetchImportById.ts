import api from "@/api";
import { ApiTypes } from "@/app/types/api";
import StockImport = ApiTypes.StockImport;

export const fetchImport = async (
  access: string,
  id: string,
): Promise<StockImport> => {
  try {
    const response = await api.get(`/api/stock-import/${id}/`, {
      headers: {
        Authorization: `Bearer ${access}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching import:", error);
    throw error;
  }
};
