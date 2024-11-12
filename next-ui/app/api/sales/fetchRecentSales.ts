import api from "@/api";

export const fetchRecentSales = async (access: string) => {
  try {
    const response = await api.get("/api/sales/", {
      headers: {
        Authorization: `Bearer ${access}`,
      },
      params: {
        page: 1,
        page_size: 5,
        ordering: "-date_created",
      },
    });
    return response.data.results;
  } catch (error) {
    console.error("Error fetching recent profits:", error);
    return [];
  }
};
