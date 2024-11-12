import { ApiTypes } from "@/app/types/api";
import api from "@/api";

export const fetchLatestProductStockEntry = async (
  accessToken: string,
  productId: number,
): Promise<ApiTypes.StockEntry | null> => {
  const response = await api.get<ApiTypes.StockEntry>(
    `/api/product/${productId}/stock-entry-history/`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
  return response.data;
};
