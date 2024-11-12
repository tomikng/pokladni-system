import api from "@/api";
import { ApiTypes } from "@/app/types/api";

export const fetchAllCategories = async (
  access: string,
  url: string = "/api/category/",
  allCategories: ApiTypes.Category[] = []
): Promise<ApiTypes.Category[]> => {
  try {
    const response = await api.get(url, {
      headers: {
        Authorization: `Bearer ${access}`,
      },
    });
    const newCategories = allCategories.concat(response.data.results);
    if (response.data.next) {
      return fetchAllCategories(access, response.data.next, newCategories);
    }
    return newCategories;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
};
