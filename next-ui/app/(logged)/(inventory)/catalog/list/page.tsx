"use client";

import React from "react";
import CategoryList from "@/app/components/lists/CategoryList";
import ProductList from "@/app/components/lists/ProductList";
import { Card, Tabs, Typography, Button, Upload } from "antd";
import { UploadOutlined, DownloadOutlined } from "@ant-design/icons";
import { useSession } from "next-auth/react";
import { CustomSession } from "@/app/types/api";
import { importCatalog } from "@/app/api/catalog/importCatalog";
import { exportCatalog } from "@/app/api/catalog/exportCatalog";

const { Title } = Typography;

interface TabItem {
  key: string;
  label: string;
  children: React.ReactNode;
}

const Page: React.FC = () => {
  const { data: session }: { data: CustomSession } = useSession();

  const items: TabItem[] = [
    {
      key: "products",
      label: "Položky",
      children: <ProductList />,
    },
    {
      key: "categories",
      label: "Kategorie",
      children: <CategoryList />,
    },
  ];

  const handleImport = async (file: File): Promise<void> => {
    if (session) {
      await importCatalog(file, session);
    }
  };

  const handleExport = async (): Promise<void> => {
    if (session) {
      await exportCatalog(session);
    }
  };

  const isAdminOrManager =
    session?.user?.role === "AD" || session?.user?.role === "MA";

  return (
    <Card style={{ margin: "24px" }}>
      <Title level={1}>Katalog</Title>
      {isAdminOrManager && (
        <>
          <Button onClick={handleExport} icon={<DownloadOutlined />}>
            Exportovat Katalog
          </Button>
          <Upload
            beforeUpload={(file) => {
              handleImport(file);
              return false;
            }}
            showUploadList={false}
          >
            <Button icon={<UploadOutlined />}>Importovat Katalog</Button>
          </Upload>
        </>
      )}
      <Tabs items={items} defaultActiveKey="products" />
    </Card>
  );
};

export default Page;
