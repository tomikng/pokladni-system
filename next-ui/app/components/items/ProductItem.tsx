"use client";

import React from "react";
import { Row, Col, Typography } from "antd";
import { ApiTypes } from "@/app/types/api";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { formatCurrency } from "@/app/lib/helpers/formatCurrency";

const { Text } = Typography;

interface ProductItemProps {
  product: ApiTypes.Product;
  quantity: number;
  onEditClick: (product: ApiTypes.Product, quantity: number) => void;
  onRemoveClick: (productId: number) => void;
}

const ProductItem: React.FC<ProductItemProps> = ({
  product,
  quantity,
  onEditClick,
  onRemoveClick,
}) => {
  const calculateDiscountedPrice = (
    price: number,
    discount: number | string | undefined,
  ) => {
    if (!discount) return price;
    if (typeof discount === "number") {
      return price - discount;
    }
    if (discount.endsWith("%")) {
      const percentageDiscount = parseFloat(discount) / 100;
      return price * (1 - percentageDiscount);
    }
    return price;
  };

  const discountedPrice = calculateDiscountedPrice(
    product.price_with_vat,
    product.discount,
  );
  const totalPrice = discountedPrice * quantity;
  const totalTax = totalPrice * product.tax_rate;

  return (
    <div
      style={{
        marginBottom: "16px",
        width: "100%",
        height: "90px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div>
        <Row gutter={16} align="middle" justify="space-between">
          <Col flex="1">
            <Text strong style={{ fontSize: "16px" }}>
              {product.name}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: "10px" }}>
              {product.ean_code}
            </Text>
          </Col>
          <Col>
            <EditOutlined
              onClick={() => onEditClick(product, quantity)}
              style={{ marginRight: "16px" }}
            />
            <DeleteOutlined onClick={() => onRemoveClick(product.id)} />
          </Col>
        </Row>
        <Row
          gutter={16}
          style={{ marginTop: "8px" }}
          align="middle"
          justify="space-between"
        >
          <Col>
            <Text strong style={{ color: "gray" }}>
              x {quantity}
            </Text>
          </Col>
          <Col>
            <Text style={{ color: "gray" }}>
              {(product.tax_rate * 100).toFixed(2)}%
            </Text>
          </Col>
          <Col flex="1" style={{ textAlign: "right" }}>
            <Text strong style={{ whiteSpace: "nowrap" }}>
              {formatCurrency(totalPrice)}
            </Text>
          </Col>
        </Row>
      </div>
      <div>
        {product.discount && (
          <Row justify="end">
            <Col>
              <Text type="secondary" style={{ fontSize: "12px", color: "red" }}>
                Sleva:{" "}
                {typeof product.discount === "string"
                  ? product.discount
                  : formatCurrency(product.discount)}
              </Text>
            </Col>
          </Row>
        )}
        <Row justify="end">
          <Col>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              Daň: {formatCurrency(totalTax)}
            </Text>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default ProductItem;
