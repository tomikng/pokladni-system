"use client";

import { Suspense } from "react";
import ProductForm from "@/app/components/forms/catalog/ProductForm";
import { Card, Divider, Typography } from "antd";

const { Title } = Typography;

const Page = () => {
  return (
    <Card style={{ margin: "24px" }}>
      <Title>Přidat Produkt</Title>
      <Divider />
      <Suspense fallback={<div>Loading...</div>}>
        <ProductForm />
      </Suspense>
    </Card>
  );
};

export default Page;
