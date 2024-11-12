import api from "@/api";
import { ApiTypes } from "@/app/types/api";

export const updateCategory = async (
  access: string,
  id: number,
  data: ApiTypes.Category
) => {
  try {
    const response = await api.put(`/api/category/${id}/`, data, {
      headers: {
        Authorization: `Bearer ${access}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Chyba při aktualizaci kategorie:", error);
    throw error;
  }
};
