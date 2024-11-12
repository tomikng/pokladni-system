import api from "@/api";
import { ApiTypes } from "@/app/types/api";

export const getQuickSaleById = async (access: string, id: number) => {
  try {
    const response = await api.get<ApiTypes.QuickSale>(
      `/api/quick-sale/${id}/`,
      {
        headers: {
          Authorization: `Bearer ${access}`,
        },
      }
    );
    return response;
  } catch (e) {
    console.log(e);
    throw e;
  }
};
