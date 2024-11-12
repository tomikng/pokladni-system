import api from "@/api";
import dayjs from "dayjs";
import { ApiTypes } from "@/app/types/api";
import { TablePaginationConfig } from "antd";

export interface FetchImportsResponse {
  results: ApiTypes.StockImport[];
  count: number;
}

export const fetchImports = async (
  access: string,
  paginationConfig: TablePaginationConfig,
  sorterConfig: { field: string; order: string },
  filter: string,
  dateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null,
): Promise<FetchImportsResponse> => {
  try {
    const response = await api.get("/api/stock-import/", {
      params: {
        page: paginationConfig.current,
        page_size: paginationConfig.pageSize,
        ordering: sorterConfig.field
          ? `${sorterConfig.order === "descend" ? "-" : ""}${sorterConfig.field}`
          : "",
        filter,
        date_from: dateRange ? dateRange[0]?.toISOString() : "",
        date_to: dateRange ? dateRange[1]?.toISOString() : "",
      },
      headers: {
        Authorization: `Bearer ${access}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching imports:", error);
    return { results: [], count: 0 };
  }
};
