import api from "@/api";

export const createCategory = async (access: string, data: any) => {
  try {
    const response = await api.post("/api/category/", data, {
      headers: {
        Authorization: `Bearer ${access}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Chyba při vytváření kategorie:", error);
    throw error;
  }
};
