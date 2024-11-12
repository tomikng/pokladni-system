"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Typography,
  Skeleton,
  Button,
  Space,
  Badge,
  Select,
} from "antd";
import { DeleteOutlined, EyeOutlined } from "@ant-design/icons";
import { fetchStockEntries } from "@/app/api/warehouse/fetchStockEntries";
import { ApiTypes, CustomSession } from "@/app/types/api";
import { useSession } from "next-auth/react";
import moment from "moment";

const { Title } = Typography;

const StockEntryHistory = () => {
  const [stockEntries, setStockEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [movementTypeFilter, setMovementTypeFilter] = useState<string | null>(
    null,
  );
  const { data: session }: { data: CustomSession } = useSession();

  useEffect(() => {
    if (session?.access) {
      setLoading(true);
      fetchStockEntries(
        session?.access,
        currentPage,
        pageSize,
        movementTypeFilter,
      )
        .then((data) => {
          setStockEntries(data.results);
          setTotalCount(data.count);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [session?.access, currentPage, pageSize, movementTypeFilter]);

  const handleDelete = (id: string) => {
    // Logic to delete the stock entry with the given ID
    console.log(`Deleting stock entry with ID: ${id}`);
  };

  const handleDetails = (id: string) => {
    // Logic to show the details of the stock entry with the given ID
    console.log(`Showing details for stock entry with ID: ${id}`);
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Produkt",
      dataIndex: "product",
      key: "product",
      render: (product: any) => product.name,
    },
    {
      title: "Množství",
      dataIndex: "quantity",
      key: "quantity",
    },
    {
      title: "Typ pohybu",
      dataIndex: "movement_type",
      key: "movement_type",
      render: (movementType: string) =>
        movementType === "IN" ? (
          <Badge status="success" text="Příjem" />
        ) : (
          <Badge status="error" text="Výdej" />
        ),
      filters: [
        { text: "Příjem", value: "IN" },
        { text: "Výdej", value: "OUT" },
      ],
      onFilter: (value: string | number | boolean, record: any) =>
        record.movement_type === value,
    },
    {
      title: "Dodavatel",
      dataIndex: "supplier",
      key: "supplier",
      render: (supplier: ApiTypes.Supplier | null | undefined) =>
        supplier?.name || "-",
    },
    {
      title: "Datum vytvoření",
      dataIndex: "date_created",
      key: "date_created",
      render: (date: string) => moment(date).format("DD.MM.YYYY HH:mm"),
    },
    {
      title: "Akce",
      key: "actions",
      render: (text: string, record: any) => (
        <Space>
          <Button
            icon={<DeleteOutlined />}
            danger={true}
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

  const handlePageChange = (page: number, pageSize: number | undefined) => {
    setCurrentPage(page);
    if (pageSize) {
      setPageSize(pageSize);
    }
  };

  return (
    <Card>
      <Title level={1}>Pohyby na skladě</Title>
      {loading ? (
        <Skeleton active />
      ) : (
        <Table
          columns={columns as any}
          dataSource={stockEntries}
          locale={{ emptyText: "Žádné pohyby zásob" }}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalCount,
            onChange: handlePageChange,
          }}
        />
      )}
    </Card>
  );
};

export default StockEntryHistory;
