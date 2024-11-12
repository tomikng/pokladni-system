import api from "@/api";

export const fetchLatestProducts = async (access: string) => {
  try {
    const response = await api.get("/api/product/latest/", {
      headers: {
        Authorization: `Bearer ${access}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching latest products:", error);
    return [];
  }
};
