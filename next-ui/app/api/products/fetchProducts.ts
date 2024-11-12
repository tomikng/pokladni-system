import api from "@/api";

export const fetchProducts = async (
  access: string,
  category: string | undefined,
  page: number,
  pageSize: number,
  eancode?: string,
  showActive?: null | boolean,
) => {
  try {
    const response = await api.get("/api/product/", {
      params: {
        category: category ?? "",
        page: page,
        page_size: pageSize,
        ean_code: eancode ?? "",
        show_active: showActive ? "True" : "False", // New query parameter
      },
      headers: {
        Authorization: `Bearer ${access}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Chyba při načítání produktů:", error);
    return { results: [], count: 0 };
  }
};
