import api from "@/api";
import { ApiTypes } from "@/app/types/api";

export const fetchProductById = async (
  productId: string,
  accessToken: string
): Promise<ApiTypes.Product | null> => {
  try {
    const response = await api.get(`api/product/${productId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
};
