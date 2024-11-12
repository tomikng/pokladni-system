import api from "@/api";

export const deleteProduct = async (
  productId: string,
  accessToken: string,
): Promise<void> => {
  try {
    await api.delete(`api/product/${productId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    throw error;
  }
};
