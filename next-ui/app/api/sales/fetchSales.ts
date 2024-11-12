import api from "@/api";
import dayjs, { Dayjs } from "dayjs";
import type { TablePaginationConfig } from "antd/lib/table/interface";

interface Sale {
  id: string;
  cashier: string;
  total_amount: number;
  date_created: string;
}

interface FetchSalesResponse {
  results: Sale[];
  count: number;
}

export const fetchSales = async (
  access: string,
  pagination: TablePaginationConfig,
  sorter: { field: string; order: string },
  filter: string,
  dateRange: [Dayjs | null, Dayjs | null] | null,
): Promise<FetchSalesResponse> => {
  const ordering =
    sorter.order === "descend" ? `-${sorter.field}` : sorter.field;
  const params: any = {
    page: pagination.current,
    page_size: pagination.pageSize,
    ordering: ordering,
    search: filter,
  };

  if (dateRange && dateRange[0] && dateRange[1]) {
    params.date_created_after = dateRange[0]
      .startOf("day")
      .format("YYYY-MM-DD");
    params.date_created_before = dateRange[1].endOf("day").format("YYYY-MM-DD");
  }

  try {
    const response = await api.get("/api/sales/", {
      headers: {
        Authorization: `Bearer ${access}`,
      },
      params,
    });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
