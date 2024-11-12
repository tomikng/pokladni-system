import api from "@/api";
import { ApiTypes } from "@/app/types/api";

export const patchSupplierById = async (
  access: string,
  id: number,
  supplier: ApiTypes.Supplier
) => {
  try {
    const response = await api.patch(`/api/supplier/${id}/`, supplier, {
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
