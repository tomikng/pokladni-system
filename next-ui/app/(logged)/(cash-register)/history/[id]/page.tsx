"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button, Card, message, Skeleton, Table, Typography } from "antd";
import {
  ArrowLeftOutlined,
  DeleteOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { fetchSaleDetail } from "@/app/api/sales/fetchSaleDetail";
import { deleteSale } from "@/app/api/sales/deleteSale";
import { fetchBusinessSettings } from "@/app/api/settings/fetchBussinessSettings";
import { fetchProductById } from "@/app/api/products/fetchProductById";
import ReceiptContent from "@/app/components/printing/ReceiptContent";
import { ApiTypes, CustomSession } from "@/app/types/api";
import Product = ApiTypes.Product;

const { Title } = Typography;

interface SaleItem {
  product_id: number;
  product_name: string;
  quantity: number;
  price: string;
}

const SaleDetail: React.FC = () => {
  const [saleDetail, setSaleDetail] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [businessSettings, setBusinessSettings] = useState<any>(null);
  const [transformedItems, setTransformedItems] = useState<
    { product: Product; quantity: number }[]
  >([]);
  const { data: session }: { data: CustomSession } = useSession();
  const router = useRouter();
  const { id } = useParams();
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getSaleDetail = async () => {
      setLoading(true);
      try {
        const data = await fetchSaleDetail(session?.access!, id as string);
        setSaleDetail(data);
        const items = await transformItemsToSelectedProducts(
          data.items as any,
          session?.access!,
        );
        setTransformedItems(items);
      } catch (error) {
        message.error("Nepodařilo se načíst detaily prodeje");
      } finally {
        setLoading(false);
      }
    };

    const getBusinessSettings = async () => {
      try {
        const settings = await fetchBusinessSettings(session?.access!);
        setBusinessSettings(settings);
      } catch (error) {
        message.error("Nepodařilo se načíst obchodní nastavení");
      }
    };

    if (session?.access && id) {
      getSaleDetail();
      getBusinessSettings();
    }
  }, [session?.access, id]);

  const handleDelete = async () => {
    try {
      await deleteSale(session?.access!, id as string);
      message.success("Prodej úspěšně smazán");
      router.push("/history");
    } catch (error) {
      message.error("Smazání prodeje se nezdařilo");
    }
  };

  const handlePrint = () => {
    if (receiptRef.current) {
      const printWindow = window.open("", "_blank");
      printWindow?.document.write(receiptRef.current.innerHTML);
      printWindow?.document.close();
      printWindow?.focus();
      printWindow?.print();
      printWindow?.close();
    }
  };

  const columns = [
    {
      title: "Produkt",
      dataIndex: "product_name",
      key: "product_name",
      render: (text: string, record: { product_id: number }) => (
        <a href={`/catalog/products/${record.product_id}`}>{text}</a>
      ),
    },
    {
      title: "Počet",
      dataIndex: "quantity",
      key: "quantity",
    },
    {
      title: "Cena",
      dataIndex: "price",
      key: "price",
      render: (price: number) => `CZK ${price}`,
    },
    {
      title: "Celkem",
      key: "total",
      render: (_: any, record: { price: number; quantity: number }) =>
        `CZK ${record.price * record.quantity}`,
    },
  ];

  const transformItemsToSelectedProducts = async (
    items: SaleItem[],
    accessToken: string,
  ): Promise<{ product: Product; quantity: number }[]> => {
    return await Promise.all(
      items.map(async (item) => {
        const productDetails = await fetchProductById(
          item.product_id.toString(),
          accessToken,
        );
        return {
          product: {
            ...productDetails,
            id: item.product_id,
            name: item.product_name,
            price_with_vat: parseFloat(item.price),
            price: parseFloat(item.price),
          },
          quantity: item.quantity,
        } as any;
      }),
    );
  };

  return (
    <Card>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => router.push("/history")}
        style={{ marginBottom: 16 }}
      >
        Zpět
      </Button>
      <Title level={2}>Účtenka #{saleDetail?.id}</Title>
      {loading ? (
        <Skeleton active />
      ) : (
        <>
          <Table
            columns={columns as any}
            dataSource={saleDetail?.items}
            pagination={false}
            locale={{ emptyText: "Žádné položky" }}
            rowKey="product_id"
          />
          <div style={{ textAlign: "right", marginTop: 16 }}>
            <Title level={4}>
              Celková částka: CZK {saleDetail?.total_amount}
            </Title>
          </div>
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => router.push("/history")}
            >
              Zpět
            </Button>
            <Button
              icon={<PrinterOutlined />}
              onClick={handlePrint}
              style={{ marginLeft: 8 }}
            >
              Tisk
            </Button>
            <Button
              icon={<DeleteOutlined />}
              danger
              style={{ marginLeft: 8 }}
              onClick={handleDelete}
            >
              Smazat
            </Button>
          </div>
        </>
      )}
      <div style={{ display: "none" }}>
        {saleDetail && businessSettings && transformedItems.length > 0 && (
          <ReceiptContent
            ref={receiptRef}
            saleDetails={{
              selectedProducts: transformedItems,
              totalDue: parseFloat(saleDetail.total_amount),
            }}
            businessSettings={businessSettings}
          />
        )}
      </div>
    </Card>
  );
};

export default SaleDetail;
