"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Typography,
  Skeleton,
  Button,
  Space,
  DatePicker,
  message,
} from "antd";
import {
  DeleteOutlined,
  EyeOutlined,
  FilterOutlined,
  ClearOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/cs";
import locale from "antd/es/date-picker/locale/cs_CZ";
import type {
  TablePaginationConfig,
  SorterResult,
  FilterValue,
  TableCurrentDataSource,
} from "antd/lib/table/interface";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ApiTypes, CustomSession } from "@/app/types/api";
import StockImport = ApiTypes.StockImport;
import {
  fetchImports,
  FetchImportsResponse,
} from "@/app/api/stock-import/fetchImports";
import { deleteImport } from "@/app/api/stock-import/deleteImport";

const { Title } = Typography;

const ImportHistory: React.FC = () => {
  const [importData, setImportData] = useState<StockImport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
  });
  const [sorter, setSorter] = useState<{ field: string; order: string }>({
    field: "date_created",
    order: "descend",
  });
  const [filter, setFilter] = useState<string>("");
  const [dateRange, setDateRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);
  const { data: session }: { data: CustomSession } = useSession();
  const router = useRouter();

  const fetchData = async (
    paginationConfig: TablePaginationConfig,
    sorterConfig: { field: string; order: string },
  ) => {
    setLoading(true);
    try {
      const data: FetchImportsResponse = await fetchImports(
        session?.access!,
        paginationConfig,
        sorterConfig,
        filter,
        dateRange,
      );
      setImportData(data.results);
      setPagination((prevPagination) => ({
        ...prevPagination,
        total: data.count,
      }));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.access) {
      fetchData(pagination, sorter);
    }
  }, [session?.access, sorter]);

  const handleDelete = async (id: string) => {
    const success = await deleteImport(session?.access!, id);
    if (success) {
      message.success("Import successfully deleted");
      fetchData(pagination, sorter);
    } else {
      message.error("Failed to delete import");
    }
  };

  const handleDetails = (id: string) => {
    router.push(`/importers/history/${id}`);
  };

  const handleTableChange = (
    newPagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<any> | SorterResult<any>[],
    extra: TableCurrentDataSource<any>,
  ) => {
    const sort = Array.isArray(sorter) ? sorter[0] : sorter;
    setPagination(newPagination);
    setSorter({
      field: sort.field as string,
      order: sort.order as string,
    });
  };

  const applyFilters = () => {
    fetchData(pagination, sorter);
  };

  const clearFilters = () => {
    setFilter("");
    setDateRange(null);
    setSorter({ field: "date_created", order: "descend" });
    setPagination({ current: 1, pageSize: 10 });
    fetchData(
      { current: 1, pageSize: 10 },
      { field: "date_created", order: "descend" },
    );
  };

  const handleDateRangeChange = (
    dates: [Dayjs | null, Dayjs | null] | null,
    dateStrings: [string, string],
  ) => {
    setDateRange(dates);
  };

  const setSorterField = (field: string, order: string) => {
    setSorter({ field, order });
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Dodavatel",
      dataIndex: "supplier_name",
      key: "supplier_name",
    },
    {
      title: "Datum vytvoření",
      dataIndex: "date_created",
      key: "date_created",
      render: (date: string) =>
        dayjs(date).locale("cs").format("DD.MM.YYYY HH:mm"),
    },
    {
      title: "Poznámka",
      dataIndex: "note",
      key: "note",
    },
    {
      title: "Akce",
      key: "actions",
      render: (text: string, record: StockImport) => (
        <Space>
          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={() => handleDelete(record.id.toString())}
          />
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleDetails(record.id.toString())}
          />
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <Title level={1}>Historie importů</Title>
      <Space style={{ marginBottom: 16 }}>
        <Button
          icon={<SortAscendingOutlined />}
          onClick={() => setSorterField("date_created", "ascend")}
        >
          Seřadit podle data vzestupně
        </Button>
        <Button
          icon={<SortDescendingOutlined />}
          onClick={() => setSorterField("date_created", "descend")}
        >
          Seřadit podle data sestupně
        </Button>
      </Space>
      {loading ? (
        <Skeleton active />
      ) : (
        <Table
          columns={columns}
          dataSource={importData}
          pagination={pagination}
          onChange={handleTableChange}
          locale={{ emptyText: "Žádné importy" }}
          rowKey="id"
        />
      )}
    </Card>
  );
};

export default ImportHistory;
