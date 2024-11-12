"use client";
import React, { useState, useEffect } from "react";
import { Card, Row, Col, Typography, Skeleton, Divider, message } from "antd";
import { ApiTypes } from "@/app/types/api";
import { useSession } from "next-auth/react";
import ProductGrid from "@/app/components/ProductGrid";
import CategoryTreeCards from "@/app/components/tree/CategoryTreeCollapsibleCard";
import { fetchProducts } from "@/app/api/products/fetchProducts";
import SelectedProducts from "@/app/components/SummaryOfCart";
import { fetchAllCategories } from "@/app/api/categories/fetchCategories";
import { getVouchers } from "@/app/api/vouchers/getVouchers";

const { Title } = Typography;

interface SelectedProduct {
  product: ApiTypes.Product;
  quantity: number;
}

const CashRegister: React.FC = () => {
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>(
    [],
  );
  const [categories, setCategories] = useState<ApiTypes.Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<
    number | undefined | string
  >("");
  const [products, setProducts] = useState<ApiTypes.Product[]>([]);
  const [categoryHistory, setCategoryHistory] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const { data: session }: { data: any } = useSession();
  const [multiplier, setMultiplier] = useState<number | null>(1);
  const [voucher, setVoucher] = useState<ApiTypes.Voucher | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchProducts(
        session?.access,
        String(selectedCategory ?? ""),
        currentPage,
        pageSize,
        "",
        true,
      ),
      fetchAllCategories(session?.access),
    ]).then(([productsResponse, categoriesData]) => {
      setProducts(productsResponse.results);
      setTotalProducts(productsResponse.count);
      setCategories(categoriesData);
      setLoading(false);
    });
  }, [session, selectedCategory, currentPage, pageSize]);

  const handleProductSelect = (
    product: ApiTypes.Product,
    multiplier: number | null,
  ) => {
    const quantity = multiplier ?? 1; // Use 1 if multiplier is null
    const existingProduct = selectedProducts.find(
      (item) => item.product.id === product.id,
    );
    if (existingProduct) {
      setSelectedProducts((prevProducts) =>
        prevProducts.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        ),
      );
    } else {
      setSelectedProducts((prevProducts) => [
        ...prevProducts,
        { product, quantity },
      ]);
    }
    setMultiplier(1);
  };

  const handleQuantityChange = (productId: number, quantity: number) => {
    setSelectedProducts((prevProducts) =>
      prevProducts.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item,
      ),
    );
  };

  const calculateDiscountedPrice = (product: ApiTypes.Product) => {
    if (!product.discount) return product.price_with_vat;
    if (typeof product.discount === "number") {
      return product.price_with_vat - product.discount;
    }
    if (product.discount.endsWith("%")) {
      const percentageDiscount = parseFloat(product.discount) / 100;
      return product.price_with_vat * (1 - percentageDiscount);
    }
    return product.price_with_vat;
  };

  const handleRemoveProduct = (productId: number) => {
    setSelectedProducts((prevProducts) =>
      prevProducts.filter((item) => item.product.id !== productId),
    );
  };

  const calculateTotal = () => {
    return selectedProducts.reduce(
      (total, item) =>
        total + calculateDiscountedPrice(item.product) * item.quantity,
      0,
    );
  };

  const calculateTotalItems = () => {
    return selectedProducts.reduce((total, item) => total + item.quantity, 0);
  };

  const calculateTotalTax = () => {
    return selectedProducts.reduce(
      (total, item) =>
        total +
        calculateDiscountedPrice(item.product) *
          item.quantity *
          item.product.tax_rate,
      0,
    );
  };

  const calculateDiscountedTotal = () => {
    const total = calculateTotal();
    if (!voucher) return total;

    if (voucher.discount_type === "Percentage") {
      return total * (1 - voucher.discount_amount / 100);
    } else if (voucher.discount_type === "Fixed") {
      return total - voucher.discount_amount;
    }

    return total;
  };

  const handleVoucherApply = async (voucherCode: string) => {
    try {
      if (!session?.access) {
        return;
      }
      const response = await getVouchers(
        "ean_code",
        voucherCode,
        1,
        1,
        session?.access,
      );
      if (response.results.length > 0) {
        const voucher = response.results[0];
        setVoucher(voucher);
        message.success("Voucher applied successfully");
      } else {
        message.error("Voucher not found");
      }
    } catch (error) {
      console.error("Error applying voucher:", error);
      message.error("Error applying voucher. Please try again.");
    }
  };

  const handleCategorySelect = (categoryId: number) => {
    if (categoryId === 0) {
      setSelectedCategory("");
      setCategoryHistory([]);
      setCurrentPage(1);
      return;
    }
    setSelectedCategory(categoryId);
    setCategoryHistory((prevHistory) => [...prevHistory, categoryId]);
    setCurrentPage(1);
  };

  const handleGoBack = () => {
    if (categoryHistory.length > 1) {
      const updatedHistory = [...categoryHistory];
      updatedHistory.pop();
      setSelectedCategory(updatedHistory[updatedHistory.length - 1]);
      setCategoryHistory(updatedHistory);
    } else {
      setSelectedCategory(undefined);
      setCategoryHistory([]);
    }
    setCurrentPage(1);
  };

  const handlePageChange = (page: number, pageSize: number | undefined) => {
    setCurrentPage(page);
    if (pageSize) {
      setPageSize(pageSize);
    }
  };

  const resetState = () => {
    setSelectedProducts([]);
    setSelectedCategory("");
    setCategoryHistory([]);
    setCurrentPage(1);
    setPageSize(8);
    setVoucher(null); // Reset voucher state when reset
  };

  return (
    <Card style={{ margin: "24px" }}>
      <Title level={2}>Pokladna</Title>
      <Row gutter={16} style={{ marginBottom: "16px" }}>
        <Col span={24}>
          <CategoryTreeCards
            categories={categories}
            selectedCategory={selectedCategory as number}
            onCategorySelect={handleCategorySelect}
            onGoBack={handleGoBack}
          />
        </Col>
      </Row>
      <Divider />
      <Row gutter={16}>
        <Col span={15}>
          {loading ? (
            <Skeleton active />
          ) : (
            <ProductGrid
              products={products}
              onProductSelect={(product) =>
                handleProductSelect(product, multiplier)
              }
              currentPage={currentPage}
              pageSize={pageSize}
              totalProducts={totalProducts}
              onPageChange={handlePageChange}
            />
          )}
        </Col>
        <Col span={9}>
          <SelectedProducts
            selectedProducts={selectedProducts}
            onQuantityChange={handleQuantityChange}
            onRemoveProduct={handleRemoveProduct}
            calculateTotal={calculateTotal}
            calculateTotalItems={calculateTotalItems}
            calculateTax={calculateTotalTax}
            setSelectedProducts={setSelectedProducts}
            onPaymentSuccess={resetState}
            handleProductSelect={handleProductSelect}
            multiplier={multiplier}
            setMultiplier={setMultiplier}
            voucher={voucher}
            calculateDiscountedTotal={calculateDiscountedTotal}
            handleVoucherApply={handleVoucherApply}
          />
        </Col>
      </Row>
    </Card>
  );
};

export default CashRegister;
