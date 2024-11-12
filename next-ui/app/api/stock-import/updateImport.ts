import api from "@/api";
import { ApiTypes } from "@/app/types/api";
import StockImport = ApiTypes.StockImport;

export const updateImport = async (
  access: string,
  id: string,
  data: Partial<StockImport>,
): Promise<void> => {
  try {
    await api.put(`/api/stock-import/${id}/`, data, {
      headers: {
        Authorization: `Bearer ${access}`,
      },
    });
  } catch (error) {
    console.error("Error updating import:", error);
    throw error;
  }
};
