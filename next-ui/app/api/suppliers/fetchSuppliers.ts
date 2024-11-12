import api from "@/api";
import { ApiTypes } from "@/app/types/api";

export const fetchSuppliers = async (
  searchField: string,
  searchText: string,
  page: number,
  pageSize: number,
  access: string,
): Promise<{
  count: number;
  next: string | null;
  previous: string | null;
  results: ApiTypes.Supplier[];
}> => {
  try {
    const params: any = {
      page,
      page_size: pageSize,
    };
    params[searchField] = searchText;

    const response = await api.get("/api/supplier", {
      params,
      headers: {
        Authorization: `Bearer ${access}`,
      },
    });
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
