"use client";

import React from "react";
import { Card, Divider, Typography } from "antd";
import QuickSaleTable from "@/app/components/tables/QuickSaleTable";

const { Title } = Typography;

const Page = () => {
  return (
    <Card style={{ margin: "24px" }}>
      <Title level={1}>Seznam produktů z rychlého prodeje</Title>
      <Divider />
      <QuickSaleTable />
    </Card>
  );
};

export default Page;
