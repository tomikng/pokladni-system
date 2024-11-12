import React from "react";
import { Card, Typography, Row, Col } from "antd";
import { ApiTypes } from "@/app/types/api";
import Image from "next/image";
import { useRouter } from "next/navigation";

const { Meta } = Card;
const { Text } = Typography;

interface ProductCardProps {
  product: ApiTypes.Product;
  onProductSelect?: (product: ApiTypes.Product) => void;
  onProductDetail?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onProductSelect,
  onProductDetail = false,
}) => {
  const router = useRouter();

  const handleClick = () => {
    if (onProductSelect) {
      onProductSelect(product);
    } else if (onProductDetail) {
      router.push(`/catalog/products/${product.id}`);
    }
  };

  return (
    <Card
      hoverable
      style={{ height: "100%", width: 160, padding: "8px" }}
      onClick={handleClick}
      cover={
        product.image ? (
          <Image
            alt={product.name}
            src={product.image}
            height={100}
            width={160}
            style={{ objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: 100,
              background: product.color || "#f0f0f0",
            }}
          />
        )
      }
    >
      <Meta
        title={<Text style={{ fontSize: "14px" }}>{product.name}</Text>}
        description={
          <Text style={{ fontSize: "12px" }}>{product.ean_code}</Text>
        }
      />
      <Row style={{ marginTop: "8px", alignItems: "center" }}>
        <Col>
          <Text strong style={{ fontSize: "14px", color: "blue" }}>
            {product.price_with_vat} Kč
          </Text>
        </Col>
        <Col style={{ marginLeft: "8px" }}>
          <Text style={{ fontSize: "12px" }}>
            {Math.floor(product.measurement_of_quantity)} {product.unit}
          </Text>
        </Col>
      </Row>
    </Card>
  );
};

export default ProductCard;
