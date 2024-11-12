import api from "@/api";

export const updateProductFormData = async (
  productId: string,
  formData: FormData,
  accessToken: string,
): Promise<void> => {
  try {
    await api.patchForm(`/api/product/${productId}/`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
};
