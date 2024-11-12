import api from "@/api";

export const deleteCategory = async (
  access: string,
  id: number
): Promise<void> => {
  try {
    const response = await api.delete(`/api/category/${id}`, {
      headers: {
        Authorization: `Bearer ${access}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting category:", error);
    throw error;
  }
};
