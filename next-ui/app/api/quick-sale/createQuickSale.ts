import api from "@/api";
import { ApiTypes } from "@/app/types/api";

export const createQuickSale = async (
  access: string,
  data: ApiTypes.QuickSale
) => {
  const body = { ...data, date_sold: new Date().toISOString() };
  try {
    const response = await api.post<ApiTypes.QuickSale>(
      "/api/quick-sale/",
      body,
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
