"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  Button,
  Typography,
  Row,
  Col,
  Divider,
  Input,
  message,
  List,
  Switch,
  Modal,
} from "antd";
import { ApiTypes, CustomSession } from "@/app/types/api";
import { formatCurrency } from "@/app/lib/helpers/formatCurrency";
import ProductItem from "./items/ProductItem";
import EditProductModal from "./modals/cash-register/EditProductModal";
import PaymentModal from "./modals/cash-register/PaymentModal";
import QuickSaleModal from "./modals/cash-register/QuickSaleModal";
import SaveCartModal from "./modals/cash-register/SaveCartModal";
import ChangeInvoiceModal from "./modals/cash-register/ChangeInvoiceModal";
import { getInvoices } from "@/app/api/invoices/invoices";
import ProductNotFoundModal from "@/app/components/modals/cash-register/ProductNotFoundModal";
import { fetchProducts } from "@/app/api/products/fetchProducts";
import { useSession } from "next-auth/react";

const { Text } = Typography;

interface SelectedProduct {
  product: ApiTypes.Product;
  quantity: number;
}

interface SelectedProductsProps {
  selectedProducts: SelectedProduct[];
  onQuantityChange: (productId: number, quantity: number) => void;
  onRemoveProduct: (productId: number) => void;
  calculateTotal: () => number;
  calculateTotalItems: () => number;
  calculateTax: () => number;
  setSelectedProducts: React.Dispatch<React.SetStateAction<SelectedProduct[]>>;
  onPaymentSuccess: () => void;
  handleProductSelect: (product: ApiTypes.Product, multiplier: number) => void;
  multiplier: number | null;
  setMultiplier: React.Dispatch<React.SetStateAction<number | null>>;
  voucher: ApiTypes.Voucher | null;
  calculateDiscountedTotal: () => number;
  handleVoucherApply: (voucherCode: string) => void;
}

interface Invoice {
  id: number;
  selected_products: SelectedProduct[];
}

interface ScannedProduct {
  ean_code: string;
  name: string;
  price_with_vat: number;
  tax_rate: number;
  quantity: number;
}

const SelectedProducts: React.FC<SelectedProductsProps> = ({
  selectedProducts,
  calculateTotalItems,
  calculateTax,
  setSelectedProducts,
  onPaymentSuccess,
  handleProductSelect,
  multiplier,
  setMultiplier,
  voucher,
  calculateDiscountedTotal,
  handleVoucherApply,
}) => {
  const [selectedProduct, setSelectedProduct] =
    useState<SelectedProduct | null>(null);
  const [eanCode, setEanCode] = useState("");
  const [multiplierInput, setMultiplierInput] = useState<string>("1");
  const [quickSaleModalVisible, setQuickSaleModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [saveCartModalVisible, setSaveCartModalVisible] = useState(false);
  const [changeInvoiceModalVisible, setChangeInvoiceModalVisible] =
    useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const { data: session }: { data: CustomSession | null } = useSession();
  const eanInputRef = useRef<any>(null);
  const [productNotFoundModalVisible, setProductNotFoundModalVisible] =
    useState(false);
  const [scannedProduct, setScannedProduct] = useState<
    ScannedProduct | undefined
  >();
  const [voucherSwitch, setVoucherSwitch] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");

  useEffect(() => {
    eanInputRef.current?.focus();
  }, [eanCode, multiplier]);

  useEffect(() => {
    setMultiplierInput(multiplier === null ? "1" : multiplier.toString());
  }, [multiplier]);

  const handleEditClick = (selectedProduct: SelectedProduct) => {
    setSelectedProduct(selectedProduct);
  };

  const handleRemoveClick = (productId: number) => {
    setSelectedProducts((prevProducts) =>
      prevProducts.filter((item) => item.product.id !== productId),
    );
    message.success("Produkt byl úspěšně odstraněn");
  };

  const handleModalCancel = () => {
    setSelectedProduct(null);
  };

  const handleModalOk = (updatedProduct: SelectedProduct) => {
    setSelectedProducts((prevProducts) =>
      prevProducts.map((item) =>
        item.product.id === updatedProduct.product.id ? updatedProduct : item,
      ),
    );
    setSelectedProduct(null);
  };

  const handleSaveCartClick = () => {
    setSaveCartModalVisible(true);
  };

  const handleQuickSale = () => {
    setQuickSaleModalVisible(true);
  };

  const handlePayment = () => {
    setPaymentModalVisible(true);
  };

  const handleDeleteInvoice = () => {
    setSelectedProducts([]);
    message.success("Účtenka smazána úspěšně");
  };

  const handleEanCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEanCode(e.target.value);
  };

  const handleMultiplierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setMultiplierInput(inputValue);

    if (inputValue === "") {
      setMultiplier(null);
    } else {
      const value = parseInt(inputValue, 10);
      if (!isNaN(value)) {
        setMultiplier(value);
      }
    }
  };

  const handleEanCodeSearch = async (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Enter") {
      if (eanCode.startsWith("+") && !isNaN(Number(eanCode.substring(1)))) {
        const newMultiplier = Number(eanCode.substring(1));
        setMultiplier(newMultiplier);
        setMultiplierInput(newMultiplier.toString());
        setEanCode("");
        return;
      }

      try {
        if (!session?.access) {
          return;
        }
        const response = await fetchProducts(
          session?.access,
          "",
          1,
          1,
          eanCode,
        );
        if (response.results.length > 0) {
          const product = response.results[0];
          handleProductSelect(product, multiplier || 1);
          setEanCode("");
        } else {
          setScannedProduct({
            ean_code: eanCode,
            name: "",
            price_with_vat: 0,
            tax_rate: 0,
            quantity: multiplier || 1,
          });
          setProductNotFoundModalVisible(true);
        }
      } catch (error) {
        console.error("Error fetching product by EAN code:", error);
        Modal.error({
          title: "Chyba",
          content:
            "Chyba při hledání produktu podle EAN kódu. Zkuste to znovu.",
        });
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "F6") {
      message.info("Cash register opened");
    } else if (e.key === "F8") {
      handlePayment();
    } else if (e.ctrlKey && e.shiftKey && e.key === "s") {
      e.preventDefault();
      handleSaveCartClick();
    } else if (e.ctrlKey && e.shiftKey && e.key === "c") {
      e.preventDefault();
      handleChangeInvoice();
    } else if (e.ctrlKey && e.shiftKey && e.key === "q") {
      e.preventDefault();
      handleQuickSale();
    } else if (e.ctrlKey && e.shiftKey && e.key === "d") {
      e.preventDefault();
      handleDeleteInvoice();
    }
  };

  const handleChangeInvoice = async () => {
    try {
      if (!session?.access) {
        return;
      }
      const data = await getInvoices(session?.access);
      setInvoices(data);
      setChangeInvoiceModalVisible(true);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      message.error("Chyba při načítání účtenek. Zkuste to znovu.");
    }
  };

  const handleInvoiceSelect = (invoice: Invoice) => {
    setSelectedProducts(invoice.selected_products);
    setChangeInvoiceModalVisible(false);
  };

  const handleQuickSaleModalOk = (
    product: ApiTypes.Product & { quantity: number },
  ) => {
    setSelectedProducts((prevProducts) => [
      ...prevProducts,
      { product, quantity: product.quantity },
    ]);
    setQuickSaleModalVisible(false);
  };

  const handleQuickSaleFromModal = () => {
    setProductNotFoundModalVisible(false);
    setQuickSaleModalVisible(true);
  };

  const applyVoucher = () => {
    handleVoucherApply(voucherCode);
  };

  return (
    <Card
      style={{ height: "100%", display: "flex", flexDirection: "column" }}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      bordered={false}
    >
      <Row gutter={16} style={{ marginBottom: "10px" }}>
        <Col span={12}>
          <Button
            style={{ width: "100%", fontSize: "12px" }}
            onClick={handleSaveCartClick}
          >
            Uložit účtenku
          </Button>
        </Col>
        <Col span={12}>
          <Button
            style={{ width: "100%", fontSize: "12px" }}
            onClick={handleChangeInvoice}
          >
            Změnit účtenku
          </Button>
        </Col>
      </Row>
      <Row gutter={16} style={{ marginBottom: "10px" }}>
        <Col span={16}>
          <Input
            ref={eanInputRef}
            style={{ width: "100%" }}
            value={eanCode}
            onChange={handleEanCodeChange}
            onKeyDown={handleEanCodeSearch}
            placeholder="Skenovat EAN kód"
          />
        </Col>
        <Col span={8}>
          <Input
            style={{ width: "100%" }}
            value={multiplierInput}
            onChange={handleMultiplierChange}
            placeholder="Násobitel"
          />
        </Col>
      </Row>
      <Row gutter={16} style={{ marginBottom: "10px" }}>
        <Col span={12}>
          <Button
            style={{
              width: "100%",
              fontSize: "12px",
              background: "orange",
              color: "white",
            }}
            onClick={handleQuickSale}
          >
            Rychlý prodej
          </Button>
        </Col>
        <Col span={12}>
          <Switch
            checked={voucherSwitch}
            onChange={setVoucherSwitch}
            checkedChildren="Poukaz"
            unCheckedChildren="Poukaz"
            style={{ width: "100%" }}
          />
        </Col>
      </Row>
      {voucherSwitch && (
        <Row gutter={16} style={{ marginBottom: "10px" }}>
          <Col span={16}>
            <Input
              style={{ width: "100%" }}
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value)}
              placeholder="Zadejte kód voucheru"
            />
          </Col>
          <Col span={8}>
            <Button
              style={{ width: "100%", background: "blue", color: "white" }}
              onClick={applyVoucher}
            >
              Použít Voucher
            </Button>
          </Col>
        </Row>
      )}
      <Divider />
      <Row gutter={16}>
        <Col span={8}>
          <Text>Daň:</Text>
        </Col>
        <Col span={8}>
          <Text>Počet položek:</Text>
        </Col>
        <Col span={8}>
          <Text>Celkem:</Text>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}>
          <Text strong style={{ fontSize: "18px" }}>
            {formatCurrency(calculateTax())}
          </Text>
        </Col>
        <Col span={8}>
          <Text strong style={{ fontSize: "18px" }}>
            {calculateTotalItems()}
          </Text>
        </Col>
        <Col span={8}>
          <Text strong style={{ fontSize: "18px" }}>
            {formatCurrency(calculateDiscountedTotal())}
          </Text>
        </Col>
      </Row>
      {voucher && (
        <Row gutter={16} style={{ marginTop: "10px" }}>
          <Col span={24}>
            <Text strong style={{ fontSize: "16px", color: "green" }}>
              Sleva z voucheru:{" "}
              {voucher.discount_type === "Percentage"
                ? `${voucher.discount_amount}%`
                : formatCurrency(voucher.discount_amount)}
            </Text>
          </Col>
        </Row>
      )}
      <Row gutter={16} style={{ marginTop: "24px" }}>
        <Col span={24}>
          <Button
            style={{ width: "100%", background: "green", color: "white" }}
            onClick={handlePayment}
          >
            Platba
          </Button>
        </Col>
      </Row>
      <Row gutter={16} style={{ marginTop: "10px" }}>
        <Col span={24}>
          <Button
            style={{ width: "100%", background: "red", color: "white" }}
            onClick={handleDeleteInvoice}
          >
            Smazat účtenku
          </Button>
        </Col>
      </Row>
      <Divider />
      <Row gutter={16}>
        <Text
          strong
          style={{ color: "gray", fontSize: "20px", marginBottom: "16px" }}
        >
          Shrnutí nákupu
        </Text>
      </Row>
      <List
        dataSource={selectedProducts}
        locale={{ emptyText: "Žádné položky" }}
        size="small"
        bordered
        renderItem={(item) => (
          <List.Item>
            <ProductItem
              key={item.product.id}
              product={item.product}
              quantity={item.quantity}
              onEditClick={() => handleEditClick(item)}
              onRemoveClick={handleRemoveClick}
            />
          </List.Item>
        )}
      />
      <div></div>
      <EditProductModal
        selectedProduct={selectedProduct}
        onCancel={handleModalCancel}
        onOk={handleModalOk}
        setSelectedProduct={setSelectedProduct}
      />
      <QuickSaleModal
        visible={quickSaleModalVisible}
        onCancel={() => setQuickSaleModalVisible(false)}
        onOk={handleQuickSaleModalOk}
      />
      <PaymentModal
        visible={paymentModalVisible}
        onCancel={() => setPaymentModalVisible(false)}
        onOk={() => {
          setPaymentModalVisible(false);
          onPaymentSuccess();
        }}
        totalDue={calculateDiscountedTotal()}
        selectedProducts={selectedProducts}
      />
      <SaveCartModal
        visible={saveCartModalVisible}
        onCancel={() => setSaveCartModalVisible(false)}
        selectedProducts={selectedProducts}
      />
      <ChangeInvoiceModal
        visible={changeInvoiceModalVisible}
        onCancel={() => setChangeInvoiceModalVisible(false)}
        onSelect={handleInvoiceSelect}
        invoices={invoices}
        setInvoices={setInvoices}
      />
      <ProductNotFoundModal
        visible={productNotFoundModalVisible}
        onCancel={() => setProductNotFoundModalVisible(false)}
        onQuickSale={handleQuickSaleFromModal}
        scannedProduct={scannedProduct}
      />
    </Card>
  );
};

export default SelectedProducts;
