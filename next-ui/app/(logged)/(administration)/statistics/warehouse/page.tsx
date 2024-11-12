"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Table,
  Input,
  Button,
  Tag,
  Typography,
  Card,
  Modal,
  Form,
  message,
  Row,
  Col,
  Tabs,
  Divider,
  Select,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { fetchProducts } from "@/app/api/products/fetchProducts";
import { updateProductFormData } from "@/app/api/products/updateProductFormData";
import { fetchSaleStatistics } from "@/app/api/stats/fetchSaleStatistics";
import { useSession } from "next-auth/react";
import { CustomSession, ApiTypes } from "@/app/types/api";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

const { Title } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

const ProductStatistics: React.FC = () => {
  const [products, setProducts] = useState<ApiTypes.Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [total, setTotal] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const { data: session }: { data: CustomSession } = useSession();
  const [eanCode, setEanCode] = useState<string>("");

  const [auditVisible, setAuditVisible] = useState<boolean>(false);
  const [auditForm] = Form.useForm();
  const [currentProduct, setCurrentProduct] = useState<ApiTypes.Product | null>(
    null,
  );

  const [statistics, setStatistics] = useState<ApiTypes.SaleStatistics | null>(
    null,
  );
  const [period, setPeriod] = useState<string>("monthly");
  const [interval, setInterval] = useState<string>("monthly");

  const fetchProductData = useCallback(
    async (page: number, pageSize: number, eanCode?: string) => {
      setLoading(true);
      const data = await fetchProducts(
        session?.access || "",
        undefined,
        page,
        pageSize,
        eanCode,
      );
      setProducts(data.results);
      setTotal(data.count);
      setLoading(false);
    },
    [session],
  );

  const getStatistics = useCallback(
    async (selectedPeriod: string, selectedInterval: string) => {
      try {
        setLoading(true);
        if (!session?.access) {
          return;
        }
        const data = await fetchSaleStatistics(
          session.access,
          selectedPeriod,
          selectedInterval,
        );
        setStatistics(data);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch statistics", error);
        setLoading(false);
      }
    },
    [session?.access],
  );

  const handlePeriodChange = (value: string) => {
    setPeriod(value);
    let selectedInterval;
    switch (value) {
      case "daily":
        selectedInterval = "hourly";
        break;
      case "weekly":
        selectedInterval = "daily";
        break;
      case "monthly":
        selectedInterval = "weekly";
        break;
      case "yearly":
        selectedInterval = "monthly";
        break;
      default:
        selectedInterval = "daily";
    }
    setInterval(selectedInterval);
    getStatistics(value, selectedInterval);
  };

  useEffect(() => {
    fetchProductData(currentPage, pageSize, eanCode);
    getStatistics(period, interval);
  }, [
    session,
    currentPage,
    pageSize,
    eanCode,
    fetchProductData,
    period,
    interval,
    getStatistics,
  ]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchProductData(1, pageSize, eanCode);
  };

  const handleReset = () => {
    setEanCode("");
    setCurrentPage(1);
    fetchProductData(1, pageSize);
  };

  const handleTableChange = (pagination: any) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
    fetchProductData(pagination.current, pagination.pageSize, eanCode);
  };

  const getColumnSearchProps = (dataIndex: keyof ApiTypes.Product) => ({
    onFilter: (value: string, record: ApiTypes.Product) =>
      record[dataIndex]?.toString().toLowerCase().includes(value.toLowerCase()),
    render: (text: string) => (text ? text.toString() : ""),
  });

  const columns = [
    {
      title: "Produkt",
      dataIndex: "name",
      key: "name",
      ...getColumnSearchProps("name"),
    },
    {
      title: "Cena s DPH",
      dataIndex: "price_with_vat",
      key: "price_with_vat",
      render: (text: number) => `${text} Kč`,
    },
    {
      title: "Cena bez DPH",
      dataIndex: "price_without_vat",
      key: "price_without_vat",
      render: (text: number) => `${text} Kč`,
    },
    {
      title: "Počet na skladu",
      dataIndex: "inventory_count",
      key: "inventory_count",
      render: (text: number, record: ApiTypes.Product) => {
        let color = "green";
        if (record.inventory_count <= 10) {
          color = "orange";
        }
        if (record.price_with_vat < record.price_without_vat) {
          color = "red";
        }
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: "Datum vytvoření",
      dataIndex: "date_created",
      key: "date_created",
      render: (text: string) => new Date(text).toLocaleDateString(),
    },
  ];

  const handleAuditSubmit = async (values: { ean: string; count: number }) => {
    try {
      const product = currentProduct;

      if (product) {
        if (product.inventory_count === values.count) {
          message.info("Počet je stejný jako v databázi.");
        } else {
          const formData = new FormData();
          formData.append("inventory_count", values.count.toString());
          await updateProductFormData(
            product.id.toString(),
            formData,
            session?.access || "",
          );
          message.success("Inventura byla úspěšně dokončena.");
          await fetchProductData(currentPage, pageSize);
        }
      } else {
        message.error("Produkt s daným EAN kódem nebyl nalezen.");
      }
    } catch (error) {
      message.error("Došlo k chybě při provádění inventury.");
    }

    setAuditVisible(false);
    auditForm.resetFields();
  };

  const handleOpenAuditModal = () => {
    const product = products.find((p) => p.ean_code === eanCode);
    if (product) {
      setCurrentProduct(product);
      setAuditVisible(true);
    } else {
      message.error("Produkt s daným EAN kódem nebyl nalezen.");
    }
  };

  const taxRateColumns = [
    {
      title: "DPH",
      dataIndex: "product__tax_rate",
      key: "product__tax_rate",
      render: (value: number) => `${(value * 100).toFixed(0)} %`,
    },
    {
      title: "Celkové tržby",
      dataIndex: "total_sales",
      key: "total_sales",
      render: (value: number) => `${value.toLocaleString()} Kč`,
    },
    {
      title: "Celkové množství",
      dataIndex: "total_quantity",
      key: "total_quantity",
    },
    {
      title: "Počet transakcí",
      dataIndex: "transaction_count",
      key: "transaction_count",
    },
  ];

  return (
    <Card>
      <Title level={3}>Seznam produktů</Title>
      <Row style={{ marginBottom: 16 }} gutter={[16, 16]}>
        <Col span={12}>
          <Input
            placeholder="Zadat EAN kód pro hledání nebo inventuru"
            value={eanCode}
            onChange={(e) => setEanCode(e.target.value)}
            style={{ width: "100%" }}
          />
        </Col>
        <Col>
          <Button
            type="primary"
            onClick={handleSearch}
            icon={<SearchOutlined />}
          >
            Hledat
          </Button>
        </Col>
        <Col>
          <Button onClick={handleReset}>Resetovat</Button>
        </Col>
        <Col>
          <Button type="primary" onClick={handleOpenAuditModal}>
            Inventura
          </Button>
        </Col>
      </Row>
      <Table
        columns={columns as any}
        dataSource={products}
        loading={loading}
        pagination={{ total, current: currentPage, pageSize }}
        onChange={handleTableChange}
        rowKey="id"
        locale={{ emptyText: "Žádné produkty" }}
      />
      <Modal
        title="Inventura"
        open={auditVisible}
        cancelText={"Zrušit"}
        onCancel={() => setAuditVisible(false)}
        onOk={auditForm.submit}
      >
        <Form form={auditForm} onFinish={handleAuditSubmit}>
          <Form.Item
            name="name"
            label="Produkt"
            initialValue={currentProduct?.name}
          >
            <Input disabled />
          </Form.Item>
          <Form.Item
            name="ean"
            label="EAN kód"
            initialValue={currentProduct?.ean_code}
            rules={[{ required: true, message: "Zadejte EAN kód" }]}
          >
            <Input disabled />
          </Form.Item>
          <Form.Item label="Aktuální počet">
            <Input value={currentProduct?.inventory_count} disabled />
          </Form.Item>
          <Form.Item
            name="count"
            label="Nový počet"
            rules={[{ required: true, message: "Zadejte počet" }]}
          >
            <Input type="number" />
          </Form.Item>
        </Form>
      </Modal>

      <Divider />

      <Row style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Select
            value={period}
            onChange={handlePeriodChange}
            style={{ width: "100%" }}
          >
            <Option value="daily">Denní</Option>
            <Option value="weekly">Týdenní</Option>
            <Option value="monthly">Měsíční</Option>
            <Option value="yearly">Roční</Option>
          </Select>
        </Col>
      </Row>

      <Tabs defaultActiveKey="1">
        <TabPane tab="Top produkty" key="1">
          <Card>
            <Title level={4}>Top produkty ({period})</Title>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={statistics?.top_selling_products}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="product__name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total_quantity" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabPane>

        <TabPane tab="Prodeje podle kategorie" key="2">
          <Card>
            <Title level={4}>Prodeje podle kategorie ({period})</Title>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={statistics?.sales_by_category}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="product__category__name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total_sales" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabPane>

        <TabPane tab="Prodeje podle DPH" key="3">
          <Card>
            <Title level={4}>Prodeje podle DPH ({period})</Title>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={statistics?.sales_by_tax_rate}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="product__tax_rate" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total_sales" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
            <Table
              columns={taxRateColumns}
              dataSource={statistics?.sales_by_tax_rate}
              pagination={false}
            />
          </Card>
        </TabPane>
      </Tabs>
    </Card>
  );
};

export default ProductStatistics;
