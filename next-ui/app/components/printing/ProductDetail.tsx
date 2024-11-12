import React, { forwardRef } from "react";
import { Typography } from "antd";

const { Title, Text } = Typography;

const PrintableProductDetail = forwardRef<HTMLDivElement, { product: any }>(
  ({ product }, ref) => {
    const unitPrice = product.price_with_vat / product.measurement_of_quantity;
    return (
      <div
        ref={ref}
        style={{ width: "80mm", padding: "10mm", fontSize: "12px" }}
      >
        <Title level={4} style={{ textAlign: "left" }}>
          {product.name}
        </Title>
        <Text style={{ fontSize: "14px" }}>{product.price_with_vat} Kč</Text>
        <br />
        <Text style={{ fontSize: "10px" }}>
          Cena (bez DPH): {product.price_without_vat} Kč
        </Text>
        <br />
        <Text style={{ fontSize: "10px" }}>
          Cena za jednotku: {unitPrice.toFixed(2)} Kč / {product.unit}
        </Text>
      </div>
    );
  },
);

PrintableProductDetail.displayName = "PrintableProductDetail";

export default PrintableProductDetail;
