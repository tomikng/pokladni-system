import api from "@/api";

export const deleteSale = async (access: string, id: string): Promise<void> => {
  try {
    await api.delete(`/api/sales/${id}/`, {
      headers: {
        Authorization: `Bearer ${access}`,
      },
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
};
