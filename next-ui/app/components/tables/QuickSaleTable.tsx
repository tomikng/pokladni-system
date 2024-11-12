"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Button, message, Popconfirm, Space, Table, Typography } from "antd";
import { ApiTypes, CustomSession } from "@/app/types/api";
import { deleteQuickSaleById } from "@/app/api/quick-sale/deleteQuickSaleById";
import { DeleteOutlined, PlusCircleOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import moment from "moment";
import { fetchQuickSales } from "@/app/api/quick-sale/fetchQuickSales";
import { useSession } from "next-auth/react";

const { Title } = Typography;

interface QuickSaleTableProps {
  showTitle?: boolean;
}

const QuickSaleTable: React.FC<QuickSaleTableProps> = ({ showTitle }) => {
  const [data, setData] = useState<ApiTypes.QuickSale[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { data: session }: { data: CustomSession } = useSession();

  const loadData = useCallback(() => {
    setLoading(true);
    if (!session?.access) {
      setLoading(false);
      return;
    }
    fetchQuickSales(session.access)
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((_) => {
        message.error("Failed to fetch data");
        setLoading(false);
      });
  }, [session?.access]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const columns = [
    {
      title: "Název",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "EAN Kód",
      dataIndex: "ean_code",
      key: "ean_code",
    },
    {
      title: "Cena s DPH",
      dataIndex: "price_with_vat",
      key: "price_with_vat",
    },
    {
      title: "Sazba DPH",
      dataIndex: "tax_rate",
      key: "tax_rate",
      render: (text: string) => `${(parseFloat(text) * 100).toFixed(0)}%`,
    },
    {
      title: "Počet",
      dataIndex: "quantity",
      key: "quantity",
    },
    {
      title: "Datum prodeje",
      dataIndex: "date_sold",
      key: "date_sold",
      render: (date: string) => moment(date).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: "Akce",
      key: "actions",
      render: (_: any, record: ApiTypes.QuickSale) => (
        <Space direction={"vertical"}>
          <Button
            type="link"
            onClick={() => createProduct(record)}
            icon={<PlusCircleOutlined />} // Add icon
          >
            Vytvořit produkt
          </Button>
          <Popconfirm
            title="Jste si jisti, že chcete smazat tento prodej?"
            onConfirm={() => handleDelete(record.id)}
            okText="Ano"
            cancelText="Ne"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Smazat
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleDelete = (id: number) => {
    if (!session?.access) {
      message.error("Chyba při mazání rychlého prodeje, zkuste prosím znovu.");
      return;
    }
    deleteQuickSaleById(session?.access, id)
      .then(() => {
        message.success("Úspěšně smazáno.");
        loadData();
      })
      .catch(() => {
        message.error(
          "Chyba při mazání rychlého prodeje, zkuste prosím znovu."
        );
      });
  };

  const createProduct = (record: ApiTypes.QuickSale) => {
    const quickSaleData = encodeURIComponent(JSON.stringify(record));
    router.push(`/catalog/add/product?quickSaleData=${quickSaleData}`);
  };

  return (
    <Table
      title={() =>
        showTitle ? <Title level={4}>Položky na přidání později</Title> : ""
      }
      columns={columns}
      dataSource={data}
      rowKey="id"
      locale={{ emptyText: "Žádné položky" }}
      loading={loading}
    />
  );
};

export default QuickSaleTable;
