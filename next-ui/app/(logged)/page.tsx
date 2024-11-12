"use client";

import {
  Card,
  Col,
  Flex,
  Row,
  Statistic,
  Table,
  Timeline,
  Typography,
  Skeleton,
} from "antd";
import {
  ArrowUpOutlined,
  ClockCircleOutlined,
  ArrowDownOutlined,
} from "@ant-design/icons";
import * as React from "react";
import { useSession } from "next-auth/react";
import { ApiTypes, CustomSession } from "@/app/types/api";
import QuickSaleTable from "../components/tables/QuickSaleTable";
import { useEffect, useState } from "react";
import { fetchLatestProducts } from "@/app/api/products/fetchLatestProducts";
import Product = ApiTypes.Product;
import Sale = ApiTypes.Sale;
import SaleStatistics = ApiTypes.SaleStatistics;
import { fetchRecentSales } from "@/app/api/sales/fetchRecentSales";
import { fetchSaleStatistics } from "@/app/api/stats/fetchSaleStatistics";

const { Text, Title } = Typography;

const gradientStyle = {
  background: "#03396c",
  padding: "20px 0",
};

const cardStyle = {
  height: "100%",
  display: "flex",
  flexDirection: "column" as "column",
};

const scrollStyle = {
  maxHeight: "400px",
  overflowY: "auto" as "auto",
};

export default function Home() {
  const { data: session }: { data: CustomSession } = useSession();
  const [latestProducts, setLatestProducts] = useState<Product[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [salesStatistics, setSalesStatistics] = useState<SaleStatistics | null>(
    null,
  );
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingSales, setLoadingSales] = useState(false);
  const [loadingStatistics, setLoadingStatistics] = useState(false);

  useEffect(() => {
    if (session?.access) {
      setLoadingProducts(true);
      setLoadingSales(true);
      setLoadingStatistics(true);

      fetchLatestProducts(session.access)
        .then(setLatestProducts)
        .finally(() => setLoadingProducts(false));

      fetchRecentSales(session.access)
        .then(setRecentSales)
        .finally(() => setLoadingSales(false));
      if (session?.user?.role !== "CA")
        fetchSaleStatistics(session.access, "daily")
          .then(setSalesStatistics)
          .finally(() => setLoadingStatistics(false));
    }
  }, [session]);

  const formatDate = (dateString: any) => new Date(dateString).toLocaleString();

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0; // Avoid division by zero
    return ((current - previous) / previous) * 100;
  };

  const dailyChange = salesStatistics
    ? calculateChange(
        salesStatistics.transaction_count,
        salesStatistics.prev_transaction_count,
      )
    : 0;

  const changeColor = dailyChange >= 0 ? "green" : "red";
  const ChangeArrow = dailyChange >= 0 ? ArrowUpOutlined : ArrowDownOutlined;

  return (
    <div style={{ padding: "20px" }}>
      <Row gutter={[16, 16]}>
        <Col span={24} style={{ textAlign: "center" }}>
          <div style={gradientStyle}>
            <Title level={1} style={{ color: "white", margin: 0 }}>
              Vítej {session?.user?.name} 👋
            </Title>
          </div>
        </Col>
      </Row>

      {session?.user?.role !== "CA" && (
        <Row gutter={[16, 16]} style={{ marginTop: "20px" }}>
          {/* Statistic Cards */}
          {salesStatistics ? (
            <>
              <Col xs={24} sm={12} md={6}>
                <Card bordered={false} style={cardStyle}>
                  <Statistic
                    title="Celkový prodej"
                    value={salesStatistics.total_sales}
                    precision={2}
                    valueStyle={{ color: "#3f8600" }}
                    prefix={<ArrowUpOutlined />}
                    suffix="Kč"
                    loading={loadingStatistics}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card bordered={false} style={cardStyle}>
                  <Statistic
                    title="Počet transakcí"
                    value={salesStatistics.transaction_count}
                    precision={0}
                    valueStyle={{ color: "#3f8600" }}
                    prefix={<ArrowUpOutlined />}
                    loading={loadingStatistics}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card bordered={false} style={cardStyle}>
                  <Statistic
                    title="Průměrná hodnota transakce"
                    value={salesStatistics.average_transaction_value}
                    precision={2}
                    valueStyle={{ color: "#3f8600" }}
                    prefix={<ArrowUpOutlined />}
                    suffix="Kč"
                    loading={loadingStatistics}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card bordered={false} style={cardStyle}>
                  <Statistic
                    title="Prodej bez DPH"
                    value={salesStatistics.total_sales_without_vat}
                    precision={2}
                    valueStyle={{ color: "#3f8600" }}
                    prefix={<ArrowUpOutlined />}
                    suffix="Kč"
                    loading={loadingStatistics}
                  />
                </Card>
              </Col>
            </>
          ) : (
            <Skeleton active />
          )}
        </Row>
      )}

      <Row gutter={[16, 16]} style={{ marginTop: "20px" }}>
        <Col xs={24} md={6}>
          <Card bordered={false} style={cardStyle}>
            <Text strong>Poslední transakce</Text>

            {session?.user?.role !== "CA" && (
              <>
                <Flex style={{ alignItems: "center", marginBottom: "10px" }}>
                  <ChangeArrow style={{ color: changeColor }} />
                  <Text type="secondary" style={{ marginLeft: "10px" }}>
                    {dailyChange.toFixed(2)}% dnes
                  </Text>
                </Flex>
              </>
            )}

            {loadingSales ? (
              <Skeleton active />
            ) : (
              <div style={scrollStyle}>
                <Timeline
                  style={{ marginTop: "20px" }}
                  items={recentSales.map((sale, index) => ({
                    color: index === 0 ? "green" : "blue",
                    children: (
                      <>
                        <Text strong>{`Prodej #${sale.id}`}</Text>
                        <br />
                        <Text>{`Částka: ${sale.total_amount} Kč`}</Text>
                        <br />
                        <Text type="secondary">{`Datum: ${formatDate(sale.date_created)}`}</Text>
                      </>
                    ),
                    dot:
                      index === 0 ? (
                        <ClockCircleOutlined style={{ fontSize: "16px" }} />
                      ) : undefined,
                  }))}
                />
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} md={18}>
          <Card bordered={false} style={cardStyle}>
            <Text
              strong
              style={{
                fontSize: "16px",
                marginBottom: "16px",
                display: "block",
              }}
            >
              Naposledy přidané zboží
            </Text>
            <Table
              dataSource={latestProducts}
              columns={[
                {
                  title: "Název",
                  dataIndex: "name",
                  key: "name",
                },
                {
                  title: "Kategorie",
                  dataIndex: "category",
                  key: "category",
                  render: (category) => category.name,
                },
                {
                  title: "Cena s DPH",
                  dataIndex: "price_with_vat",
                  key: "price_with_vat",
                  render: (price) => `${price} Kč`,
                },
                {
                  title: "Datum přidání",
                  dataIndex: "date_created",
                  key: "date_created",
                  render: (date) => formatDate(date),
                },
              ]}
              pagination={false}
              scroll={{ y: 320 }}
              loading={loadingProducts}
              locale={{ emptyText: "Žádné produkty" }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: "20px" }}>
        <Col span={24}>
          <Card bordered={false} style={cardStyle}>
            <QuickSaleTable showTitle />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
