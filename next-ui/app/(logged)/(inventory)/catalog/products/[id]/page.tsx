"use client";
import React, { useEffect, useState, useRef } from "react";
import {
  Card,
  Skeleton,
  Button,
  Form,
  Space,
  Typography,
  message,
  Popconfirm,
} from "antd";
import { ApiTypes } from "@/app/types/api";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { fetchProductById } from "@/app/api/products/fetchProductById";
import ProductForm from "@/app/components/forms/catalog/ProductForm";
import {
  DeleteOutlined,
  ExclamationCircleOutlined,
  ArrowLeftOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import { deleteProduct } from "@/app/api/products/deleteProduct";
import PrintableProductDetail from "@/app/components/printing/ProductDetail";

const { Title, Text } = Typography;

export default function ProductDetails({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<ApiTypes.Product | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: session }: { data: any } = useSession();
  const router = useRouter();
  const [form] = Form.useForm();
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const fetchedProduct = await fetchProductById(
          params.id,
          session?.access,
        );
        setProduct(fetchedProduct);
        form.setFieldsValue(fetchedProduct);
      } catch (error) {
        console.error("Error fetching product:", error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProduct();
    }
  }, [params.id, session, form]);

  const handleBack = () => {
    router.back();
  };

  const handleDelete = async () => {
    try {
      await deleteProduct(params.id, session?.access);
      message.success("Produkt byl úspěšně smazán");
      router.push("/catalog/list/");
    } catch (error) {
      console.error("Error deleting product:", error);
      message.error("Nepodařilo se smazat produkt");
    }
  };

  const handlePrint = () => {
    if (printRef.current) {
      const printWindow = window.open("", "_blank");
      printWindow?.document.write(printRef.current.innerHTML);
      printWindow?.document.close();
      printWindow?.focus();
      printWindow?.print();
      printWindow?.close();
    }
  };

  if (loading) {
    return (
      <Card style={{ margin: "24px" }}>
        <Skeleton active />
      </Card>
    );
  }

  if (!product) {
    return (
      <Card style={{ margin: "24px", textAlign: "center" }}>
        <ExclamationCircleOutlined style={{ fontSize: 48, color: "#faad14" }} />
        <Title level={3}>Produkt nenalezen</Title>
        <Text>Požadovaný produkt bohužel neexistuje nebo byl odstraněn.</Text>
        <br />
        <Button
          onClick={handleBack}
          icon={<ArrowLeftOutlined />}
          style={{ marginTop: 16 }}
        >
          Zpět na seznam produktů
        </Button>
      </Card>
    );
  }

  return (
    <Card style={{ margin: "24px" }}>
      <ProductForm product={product} />
      <Space style={{ marginTop: "16px" }}>
        <Button onClick={handleBack} icon={<ArrowLeftOutlined />}>
          Zpátky
        </Button>
        <Popconfirm
          title="Opravdu chcete smazat tento produkt?"
          onConfirm={handleDelete}
          okText="Ano"
          cancelText="Ne"
        >
          <Button danger icon={<DeleteOutlined />}>
            Smazat produkt
          </Button>
        </Popconfirm>
        <Button icon={<PrinterOutlined />} onClick={handlePrint}>
          Tisk
        </Button>
      </Space>
      <div style={{ display: "none" }}>
        <PrintableProductDetail ref={printRef} product={product} />
      </div>
    </Card>
  );
}
