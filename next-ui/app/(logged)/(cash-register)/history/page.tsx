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
  Row,
  Col,
} from "antd";
import {
  DeleteOutlined,
  EyeOutlined,
  FilterOutlined,
  ClearOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
} from "@ant-design/icons";
import { ApiTypes, CustomSession } from "@/app/types/api";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import "dayjs/locale/cs";
import locale from "antd/es/date-picker/locale/cs_CZ";
import type { Dayjs } from "dayjs";
import type {
  TablePaginationConfig,
  SorterResult,
} from "antd/lib/table/interface";
import { fetchSales } from "@/app/api/sales/fetchSales";
import { deleteSale } from "@/app/api/sales/deleteSale";

const { Title } = Typography;
const { RangePicker } = DatePicker;

const SalesHistory: React.FC = () => {
  const [salesData, setSalesData] = useState<ApiTypes.Sale[]>([]);
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
      const data = await fetchSales(
        session?.access!,
        paginationConfig,
        sorterConfig,
        filter,
        dateRange,
      );
      setSalesData(data.results);
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
    try {
      await deleteSale(session?.access!, id);
      message.success("Prodej úspěšně smazán");
      fetchData(pagination, sorter);
    } catch (error) {
      message.error("Smazání prodeje se nezdařilo");
    }
  };

  const handleDetails = (id: string) => {
    router.push(`/history/${id}`);
  };

  const handleTableChange = (
    newPagination: TablePaginationConfig,
    sorter: SorterResult<ApiTypes.Sale> | SorterResult<ApiTypes.Sale>[],
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
      title: "Pokladník",
      dataIndex: "cashier",
      key: "cashier",
    },
    {
      title: "Celková částka",
      dataIndex: "total_amount",
      key: "total_amount",
      render: (amount: number) => `${amount} Kč`,
    },
    {
      title: "Datum vytvoření",
      dataIndex: "date_created",
      key: "date_created",
      render: (date: string) =>
        dayjs(date).locale("cs").format("DD.MM.YYYY HH:mm"),
    },
    {
      title: "Akce",
      key: "actions",
      render: (text: string, record: ApiTypes.Sale) => (
        <Space>
          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={() => handleDelete(record.id)}
          />
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleDetails(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <Title level={1}>Historie prodeje</Title>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={24} md={12} lg={8} xl={6}>
          <RangePicker
            onChange={handleDateRangeChange}
            style={{ width: "100%" }}
            locale={locale}
          />
        </Col>
        <Col xs={12} sm={12} md={6} lg={4} xl={3}>
          <Button
            type="primary"
            icon={<FilterOutlined />}
            onClick={applyFilters}
            style={{ width: "100%" }}
          >
            Použít filtry
          </Button>
        </Col>
        <Col xs={12} sm={12} md={6} lg={4} xl={3}>
          <Button
            icon={<ClearOutlined />}
            onClick={clearFilters}
            style={{ width: "100%" }}
          >
            Vymazat filtry
          </Button>
        </Col>
        <Col xs={12} sm={12} md={6} lg={4} xl={3}>
          <Button
            icon={<SortAscendingOutlined />}
            onClick={() => setSorterField("total_amount", "ascend")}
            style={{ width: "100%" }}
          >
            Částka ↑
          </Button>
        </Col>
        <Col xs={12} sm={12} md={6} lg={4} xl={3}>
          <Button
            icon={<SortDescendingOutlined />}
            onClick={() => setSorterField("total_amount", "descend")}
            style={{ width: "100%" }}
          >
            Částka ↓
          </Button>
        </Col>
        <Col xs={12} sm={12} md={6} lg={4} xl={3}>
          <Button
            icon={<SortAscendingOutlined />}
            onClick={() => setSorterField("date_created", "ascend")}
            style={{ width: "100%" }}
          >
            Datum ↑
          </Button>
        </Col>
        <Col xs={12} sm={12} md={6} lg={4} xl={3}>
          <Button
            icon={<SortDescendingOutlined />}
            onClick={() => setSorterField("date_created", "descend")}
            style={{ width: "100%" }}
          >
            Datum ↓
          </Button>
        </Col>
      </Row>
      {loading ? (
        <Skeleton active />
      ) : (
        <Table
          columns={columns}
          dataSource={salesData}
          pagination={pagination}
          onChange={handleTableChange}
          locale={{ emptyText: "Žádné transakce" }}
          rowKey="id"
        />
      )}
    </Card>
  );
};

export default SalesHistory;
