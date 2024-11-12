import api from "@/api";
import { ApiTypes } from "@/app/types/api";

export const fetchQuickSales = async (access: string) => {
  try {
    const response = await api.get<ApiTypes.QuickSale[]>("/api/quick-sale/", {
      headers: {
        Authorization: `Bearer ${access}`,
      },
    });
    return response.data;
  } catch (e) {
    console.log(e);
    throw e;
  }
};
