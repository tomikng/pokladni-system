import api from "@/api";
import { ApiTypes } from "@/app/types/api";

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const getVouchers = async (
  searchField: string = "",
  searchText: string = "",
  page: number = 1,
  pageSize: number = 10,
  access: string,
): Promise<PaginatedResponse<ApiTypes.Voucher>> => {
  try {
    const params: any = {
      page,
      page_size: pageSize,
    };

    if (searchField && searchText) {
      params[searchField] = searchText;
    }

    const response = await api.get<PaginatedResponse<ApiTypes.Voucher>>(
      "/api/vouchers/",
      {
        params,
        headers: {
          Authorization: `Bearer ${access}`,
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching vouchers:", error);
    throw error;
  }
};
