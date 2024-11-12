import api from "@/api";
import { ApiTypes } from "@/app/types/api";

export const putSupplierById = async (
  access: string,
  id: number,
  supplier: ApiTypes.Supplier
) => {
  try {
    const response = await api.put(`/api/supplier/${id}/`, supplier, {
      headers: {
        Authorization: `Bearer ${access}`,
      },
    });
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
