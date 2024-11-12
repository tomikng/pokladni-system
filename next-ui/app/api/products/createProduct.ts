import api from "@/api";

export const createProduct = async (
  formData: FormData,
  accessToken: string,
): Promise<void> => {
  try {
    formData.append("is_active", true.toString());
    await api.post("/api/product/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } catch (error) {
    console.error("Error creating product:", error);
    throw error;
  }
};
