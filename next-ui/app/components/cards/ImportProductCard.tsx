import React, { useState, useEffect } from "react";
import { Card, Row, Col, InputNumber, Space, Typography, Spin } from "antd";
import { EditableProduct } from "@/app/types/types";
import { useSession } from "next-auth/react";
import { ApiTypes, CustomSession } from "@/app/types/api";
import { fetchLatestProductStockEntry } from "@/app/api/stock-import/fetchProductHistory";

const { Text } = Typography;

interface ImportProductCardProps {
  product: EditableProduct;
  onChange: (updatedProduct: EditableProduct) => void;
}

const ImportProductCard: React.FC<ImportProductCardProps> = ({
  product,
  onChange,
}) => {
  const [count, setCount] = useState<number | undefined>(product.count);
  const [buyPrice, setBuyPrice] = useState<number | undefined>(
    product.buy_price,
  );
  const [sellPrice, setSellPrice] = useState<number | undefined>(
    product.sell_price,
  );
  const [margin, setMargin] = useState<number | undefined>(product.margin);

  const [loading, setLoading] = useState<boolean>(true);
  const [latestEntry, setLatestEntry] = useState<ApiTypes.StockEntry | null>(
    null,
  );

  const { data: session }: { data: CustomSession } = useSession();

  useEffect(() => {
    const fetchEntryData = async () => {
      if (!session?.access) return;

      try {
        setLoading(true);
        const latestEntry = await fetchLatestProductStockEntry(
          session.access,
          product.id,
        );
        setLatestEntry(latestEntry);
      } catch (error) {
        console.error("Failed to fetch stock entry history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEntryData();
  }, [product.id, session?.access]);

  useEffect(() => {
    const calculatedMargin =
      buyPrice !== undefined && buyPrice !== 0
        ? (((sellPrice || 0) - buyPrice) / buyPrice) * 100
        : undefined;
    setMargin(
      calculatedMargin !== undefined ? Math.round(calculatedMargin) : undefined,
    );
  }, [buyPrice, sellPrice]);

  const handleInputChange = (field: string, value: number | null) => {
    let updatedCount = count;
    let updatedBuyPrice = buyPrice;
    let updatedSellPrice = sellPrice;
    let updatedMargin = margin;

    if (field === "count") {
      updatedCount = value !== null ? value : undefined;
      setCount(updatedCount);
    } else if (field === "buy_price") {
      updatedBuyPrice = value !== null ? value : undefined;
      setBuyPrice(updatedBuyPrice);
    } else if (field === "sell_price") {
      updatedSellPrice = value !== null ? value : undefined;
      setSellPrice(updatedSellPrice);
    } else if (field === "margin") {
      updatedMargin = value !== null ? value : undefined;
      setMargin(updatedMargin);
      if (updatedBuyPrice !== undefined) {
        updatedSellPrice = updatedBuyPrice * (1 + (updatedMargin || 0) / 100);
        setSellPrice(updatedSellPrice);
      }
    }

    const updatedProduct: EditableProduct = {
      ...product,
      count: updatedCount,
      buy_price: updatedBuyPrice,
      sell_price: updatedSellPrice,
      margin: updatedMargin,
      import_price: updatedBuyPrice as number, // Ensure import_price is updated along with buy_price
    };
    onChange(updatedProduct);
  };

  const getApproximatedMargin = (value: number | undefined): string => {
    if (value === undefined) return "";
    const approximatedValue =
      value >= 0
        ? value % 1 >= 0.5
          ? Math.ceil(value)
          : Math.floor(value)
        : value;
    return `~${approximatedValue}%`;
  };

  return (
    <Card key={product.key} style={{ marginBottom: 16 }} bordered hoverable>
      <Row gutter={10} align="middle">
        <Col span={9}>
          <Text strong>{product.name}</Text>
        </Col>
        <Col span={5}>
          <InputNumber
            min={0}
            value={count}
            onChange={(value) => handleInputChange("count", value)}
            style={{ width: "100%" }}
            formatter={(value) => (value !== undefined ? value.toString() : "")}
          />
          {latestEntry && (
            <Text style={{ color: "#8c8c8c", display: "block", marginTop: 4 }}>
              Počet: {latestEntry.quantity}
            </Text>
          )}
        </Col>
        <Col span={5}>
          <InputNumber
            min={0}
            value={buyPrice}
            onChange={(value) => handleInputChange("buy_price", value)}
            style={{ width: "100%" }}
            formatter={(value) => (value !== undefined ? value.toString() : "")}
          />
          {latestEntry && (
            <Text style={{ color: "#8c8c8c", display: "block", marginTop: 4 }}>
              {latestEntry.import_price} Kč
            </Text>
          )}
        </Col>
        <Col span={5}>
          <InputNumber
            min={0}
            value={sellPrice}
            onChange={(value) => handleInputChange("sell_price", value)}
            style={{ width: "100%" }}
            formatter={(value) => (value !== undefined ? value.toString() : "")}
          />
          {latestEntry && (
            <Text style={{ color: "#8c8c8c", display: "block", marginTop: 4 }}>
              {latestEntry.product.price_with_vat} Kč
            </Text>
          )}
        </Col>
      </Row>
      <Row gutter={16} style={{ marginTop: 8 }} align="middle">
        <Col span={12}>
          <Space direction="vertical" size={4}>
            <Text>Obchodní přirážka (%)</Text>
            <InputNumber
              value={margin}
              onChange={(value) => handleInputChange("margin", value)}
              formatter={(value) =>
                value !== undefined ? Math.round(value).toString() : ""
              }
            />
          </Space>
        </Col>
        {margin !== undefined && (
          <Col span={12}>
            <Text type={margin < 0 ? "danger" : "success"}>
              Obchodní přirážka: {getApproximatedMargin(margin)}
            </Text>
          </Col>
        )}
      </Row>
      {loading && (
        <Row justify="center" style={{ marginTop: 16 }}>
          <Spin />
        </Row>
      )}
    </Card>
  );
};

export default ImportProductCard;
