"use client";
import React, { useEffect, useState } from "react";
import {
  Button,
  Checkbox,
  Col,
  Divider,
  Dropdown,
  Flex,
  InputNumber,
  MenuProps,
  Modal,
  Row,
  Space,
  Typography,
} from "antd";
import { ApiTypes, CustomSession } from "@/app/types/api";
import Image from "next/image";
import { DownOutlined } from "@ant-design/icons";
import { fetchTaxRates } from "@/app/api/products/fetchTaxRates";
import { useSession } from "next-auth/react";

const { Title, Text } = Typography;

interface EditProductModalProps {
  selectedProduct: {
    product: ApiTypes.Product;
    quantity: number;
  } | null;
  onCancel: () => void;
  onOk: (updatedProduct: {
    product: ApiTypes.Product;
    quantity: number;
  }) => void;
  setSelectedProduct: (
    selectedProduct: { product: ApiTypes.Product; quantity: number } | null,
  ) => void;
}

const EditProductModal: React.FC<EditProductModalProps> = ({
  selectedProduct,
  onCancel,
  onOk,
  setSelectedProduct,
}) => {
  const [taxRates, setTaxRates] = useState<ApiTypes.TaxRate[]>();
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [discountPercentage, setDiscountPercentage] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(false);
  const [discountValue, setDiscountValue] = useState(0);

  const { data: session }: { data: CustomSession } = useSession();

  useEffect(() => {
    if (!session?.access) {
      return;
    }
    fetchTaxRates(session?.access).then((response) => {
      setTaxRates(response);
    });
  }, [session]);

  useEffect(() => {
    if (selectedProduct) {
      setQuantity(selectedProduct.quantity);
      setPrice(
        selectedProduct.product.price_with_vat || selectedProduct.product.price,
      );
      setTaxRate(selectedProduct.product.tax_rate);

      if (selectedProduct.product.discount) {
        if (typeof selectedProduct.product.discount === "number") {
          setDiscountAmount(true);
          setDiscountPercentage(false);
          setDiscountValue(selectedProduct.product.discount);
        } else {
          {
            setDiscountPercentage(true);
            {
              setDiscountAmount(false);
              setDiscountValue(parseFloat(selectedProduct.product.discount));
            }
          }
        }
      } else {
        setDiscountPercentage(false);
        setDiscountAmount(false);
        setDiscountValue(0);
      }
    }
  }, [selectedProduct]);

  const handleMenuClick: MenuProps["onClick"] = (e) => {
    setTaxRate(parseFloat(e.key));
  };

  const menuProps = {
    items:
      taxRates?.map((taxRate) => ({
        key: taxRate.value.toString(),
        label: taxRate.label,
      })) || [],
    onClick: handleMenuClick,
  };

  const handleOk = () => {
    if (selectedProduct) {
      const updatedProduct = {
        ...selectedProduct,
        quantity,
        product: {
          ...selectedProduct.product,
          price_with_vat: price,
          tax_rate: taxRate,
          discount: discountPercentage
            ? `${discountValue}%`
            : discountAmount
              ? discountValue
              : 0,
        },
      };
      onOk(updatedProduct);
      setSelectedProduct(null);
    }
  };

  return (
    <Modal
      title="Úprava produktu"
      open={selectedProduct !== null}
      onCancel={onCancel}
      onOk={handleOk}
    >
      {selectedProduct?.product.id !== null && (
        <>
          <Divider />
          <div>
            <Row gutter={16}>
              <Col span={12} style={{ display: "flex", alignItems: "center" }}>
                {selectedProduct?.product.image ? (
                  <Image
                    alt={selectedProduct.product.name}
                    src={selectedProduct.product.image}
                    height={200}
                    objectFit="cover"
                    width={200}
                  />
                ) : (
                  <div
                    style={{
                      width: 200,
                      height: 200,
                      background: selectedProduct?.product.color || "#f0f0f0",
                    }}
                  />
                )}
              </Col>
              <Col span={12}>
                <Flex vertical gap={"middle"}>
                  <Title level={1}>{selectedProduct?.product.name}</Title>
                  <Text type="secondary" style={{ marginTop: "-30px" }}>
                    {selectedProduct?.product.ean_code}
                  </Text>
                  <Flex vertical gap="small">
                    <Text type="secondary">Počet</Text>
                    <InputNumber
                      style={{ width: "100%" }}
                      value={quantity}
                      onChange={(value) => setQuantity(value || 1)}
                    />
                  </Flex>
                  <Flex vertical gap="small">
                    <Row>
                      <Col span={12}>
                        <Text type="secondary">Cena</Text>
                        <InputNumber
                          value={price}
                          onChange={(value) => setPrice(value || 0)}
                        />
                      </Col>
                      <Col span={12}>
                        <Text type="secondary">DPH</Text>
                        <Dropdown menu={menuProps}>
                          <Button>
                            <Space>
                              {taxRate * 100}% <DownOutlined />
                            </Space>
                          </Button>
                        </Dropdown>
                      </Col>
                    </Row>
                  </Flex>
                  <Flex vertical gap="small">
                    <Text type="secondary">Sleva</Text>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Row align="middle">
                          <Col>
                            <Checkbox
                              checked={discountPercentage}
                              onChange={(e) => {
                                setDiscountPercentage(e.target.checked);
                                if (e.target.checked) {
                                  setDiscountAmount(false);
                                }
                              }}
                            />
                          </Col>
                          <Col>
                            <Text type="secondary">Procenta</Text>
                          </Col>
                        </Row>
                        <Row align="middle">
                          <Col>
                            <Checkbox
                              checked={discountAmount}
                              onChange={(e) => {
                                setDiscountAmount(e.target.checked);
                                if (e.target.checked) {
                                  setDiscountPercentage(false);
                                }
                              }}
                            />
                          </Col>
                          <Col>
                            <Text type="secondary">Částka</Text>
                          </Col>
                        </Row>
                      </Col>
                      <Col span={12}>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <InputNumber
                            value={discountValue}
                            onChange={(value) => setDiscountValue(value || 0)}
                          />
                        </div>
                      </Col>
                    </Row>
                  </Flex>
                </Flex>
              </Col>
            </Row>
          </div>
        </>
      )}
    </Modal>
  );
};

export default EditProductModal;
