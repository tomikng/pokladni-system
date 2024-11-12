import api from "@/api";

export const fetchStockEntries = async (
  access: string,
  page: number,
  pageSize: number,
  movementTypeFilter: string | null,
) => {
  try {
    const response = await api.get("/api/stockentry/", {
      headers: {
        Authorization: `Bearer ${access}`,
      },
      params: {
        page: page,
        page_size: pageSize,
        movement_type: movementTypeFilter,
      },
    });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
