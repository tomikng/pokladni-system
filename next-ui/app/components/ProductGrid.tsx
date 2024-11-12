"use client";
import React from "react";
import { Row, Col, Card, Pagination } from "antd";
import { ApiTypes } from "@/app/types/api";
import ProductCard from "./cards/ProductCard";

interface ProductGridProps {
  products: ApiTypes.Product[];
  onProductSelect: (product: ApiTypes.Product) => void;
  currentPage: number;
  pageSize: number;
  totalProducts: number;
  onPageChange: (page: number, pageSize: number) => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  onProductSelect,
  currentPage,
  pageSize,
  totalProducts,
  onPageChange,
}) => {
  return (
    <>
      <Row gutter={[0, 12]}>
        {products.map((product) => (
          <Col key={product.id} xs={24} sm={12} md={8} lg={6}>
            <ProductCard
              product={product}
              onProductSelect={onProductSelect}
              onProductDetail={false}
            />
          </Col>
        ))}
      </Row>
      <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={totalProducts}
          onChange={onPageChange}
          showSizeChanger
          showQuickJumper
          showTotal={(total) => `Total ${total} products`}
        />
      </div>
    </>
  );
};

export default ProductGrid;
