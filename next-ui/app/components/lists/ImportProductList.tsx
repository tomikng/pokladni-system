import React from "react";
import { Row, Col, Typography } from "antd";
import ImportProductCard from "../cards/ImportProductCard";
import { EditableProduct } from "@/app/types/types";

const { Text } = Typography;

interface ImportProductListProps {
  selectedProducts: EditableProduct[];
  handleProductChange: (updatedProduct: EditableProduct) => void;
}

const ImportProductList: React.FC<ImportProductListProps> = ({
  selectedProducts,
  handleProductChange,
}) => {
  return (
    <>
      <Row gutter={16} style={{ marginBottom: 8 }}>
        <Col span={9}>
          <Text strong>Název</Text>
        </Col>
        <Col span={5}>
          <Text strong>Počet</Text>
        </Col>
        <Col span={5}>
          <Text strong>Nákupní cena</Text>
        </Col>
        <Col span={5}>
          <Text strong>Prodejní cena</Text>
        </Col>
      </Row>
      <div
        style={{
          height: "52vh",
          overflowY: "auto",
          border: "solid",
          borderWidth: "1px",
          borderColor: "#d9d9d9",
          borderRadius: "2px",
          padding: "8px",
        }}
      >
        {selectedProducts.length === 0 && (
          <Text type="secondary">Žádné vybrané produkty</Text>
        )}
        {selectedProducts.map((product) => (
          <ImportProductCard
            key={product.key}
            product={product}
            onChange={handleProductChange}
          />
        ))}
      </div>
    </>
  );
};

export default ImportProductList;
