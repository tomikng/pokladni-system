import React from "react";
import { Modal, Button, Space } from "antd";
import { useRouter } from "next/navigation";
import {
  WarningOutlined,
  ShoppingCartOutlined,
  PlusCircleOutlined,
} from "@ant-design/icons";

interface ProductNotFoundModalProps {
  visible: boolean;
  onCancel: () => void;
  onQuickSale: (product: any) => void;
  scannedProduct: any;
}

const ProductNotFoundModal: React.FC<ProductNotFoundModalProps> = ({
  visible,
  onCancel,
  onQuickSale,
  scannedProduct,
}) => {
  const router = useRouter();

  const handleAddToCatalog = () => {
    const queryParams = new URLSearchParams({
      quickSaleData: JSON.stringify(scannedProduct),
    }).toString();
    router.push(`/catalog/add/product?${queryParams}`);
  };

  return (
    <Modal
      title={
        <Space>
          <WarningOutlined style={{ color: "#faad14" }} />
          <span>Produkt nebyl nalezen</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
    >
      <p>
        <WarningOutlined style={{ color: "#faad14", marginRight: 8 }} />
        Produkt nebyl nalezen v katalogu.
      </p>
      <Button
        icon={<ShoppingCartOutlined />}
        onClick={() => onQuickSale(scannedProduct)}
        style={{ marginRight: 8 }}
      >
        Rychlý prodej
      </Button>
      <Button
        type="primary"
        icon={<PlusCircleOutlined />}
        onClick={handleAddToCatalog}
      >
        Přidat do katalogu
      </Button>
    </Modal>
  );
};

export default ProductNotFoundModal;
