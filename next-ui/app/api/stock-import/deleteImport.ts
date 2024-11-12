import api from "@/api";

export const deleteImport = async (
  access: string,
  id: string,
): Promise<boolean> => {
  try {
    await api.delete(`/api/stock-import/${id}/`, {
      headers: {
        Authorization: `Bearer ${access}`,
      },
    });
    return true;
  } catch (error) {
    console.error("Error deleting import:", error);
    return false;
  }
};
