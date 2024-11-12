import React, { useEffect, useState } from "react";
import { Card, Form, Button, Row, Col, Typography, FormInstance } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import ImportProductList from "../../lists/ImportProductList";
import { EditableProduct } from "@/app/types/types";

const { Text, Title } = Typography;

export interface ImportSelectedProductsCard {
  form: FormInstance;
  onFinish: (values: any) => void;
  selectedProducts: EditableProduct[];
}

const ImportSelectedProductsCard: React.FC<ImportSelectedProductsCard> = ({
  form,
  onFinish,
  selectedProducts,
}) => {
  const [updatedProducts, setUpdatedProducts] = useState<EditableProduct[]>([]);

  useEffect(() => {
    setUpdatedProducts((prevProducts) => {
      const selectedProductsMap = new Map(
        selectedProducts.map((product) => [product.ean_code, product])
      );

      const filteredProducts = prevProducts.filter((product) =>
        selectedProductsMap.has(product.ean_code)
      );

      selectedProducts.forEach((product) => {
        if (!filteredProducts.find((p) => p.ean_code === product.ean_code)) {
          filteredProducts.push(product);
        }
      });

      return filteredProducts;
    });
  }, [selectedProducts]);

  const handleFinish = (values: any) => {
    onFinish({ ...values, products: updatedProducts });
  };

  const handleProductChange = (updatedProduct: EditableProduct) => {
    setUpdatedProducts((prevProducts) => {
      const updatedProductIndex = prevProducts.findIndex(
        (product) => product.ean_code === updatedProduct.ean_code
      );

      if (updatedProductIndex !== -1) {
        const newProducts = [...prevProducts];
        newProducts[updatedProductIndex] = updatedProduct;
        return newProducts;
      }

      return [...prevProducts, updatedProduct];
    });
  };

  return (
    <Form form={form} onFinish={handleFinish}>
      <Card>
        <Title level={3}>Naskladnění</Title>
        <ImportProductList
          selectedProducts={updatedProducts}
          handleProductChange={handleProductChange}
        />
        <Row justify="end" style={{ marginTop: 16 }}>
          <Col>
            <Text strong>
              CELKEM:{" "}
              {updatedProducts
                .reduce(
                  (sum, product) =>
                    sum + (product.buy_price || 0) * (product.count || 0),
                  0
                )
                .toFixed(2)}{" "}
              Kč
            </Text>
          </Col>
        </Row>
        <Form.Item>
          <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
            Naskladnit
          </Button>
        </Form.Item>
      </Card>
    </Form>
  );
};

export default ImportSelectedProductsCard;
