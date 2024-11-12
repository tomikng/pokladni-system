import api from "@/api";
import { ApiTypes } from "@/app/types/api";

export const createSupplier = async (
  access: string,
  supplier: ApiTypes.Supplier
) => {
  try {
    const response = await api.post("/api/supplier/", supplier, {
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
