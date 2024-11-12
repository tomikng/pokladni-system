"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Row, Col, Form, message } from "antd";
import ProductSelectionCard from "@/app/components/cards/imports/ProductSelectionCard";
import ImportSelectedProductsCard from "@/app/components/cards/imports/ImportSelectedProductsCard";
import { ApiTypes, CustomSession } from "@/app/types/api";
import { fetchProducts } from "@/app/api/products/fetchProducts";
import { fetchAllCategories } from "@/app/api/categories/fetchCategories";
import { useSession } from "next-auth/react";
import InvoiceFormCard from "@/app/components/cards/imports/InvoiceFormCard";
import { createStockImport } from "@/app/api/stock-import/createStockImport";
import { EditableProduct, ImportValues } from "@/app/types/types";

const Page = () => {
  const [form] = Form.useForm();
  const [data, setData] = useState<ApiTypes.Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<ApiTypes.Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(
    undefined,
  );
  const [searchEan, setSearchEan] = useState<string>("");
  const [selectedProducts, setSelectedProducts] = useState<ApiTypes.Product[]>(
    [],
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [total, setTotal] = useState(0);

  const { data: session }: { data: CustomSession } = useSession();

  const fetchInitialProducts = useCallback(async () => {
    setLoading(true);
    if (!session?.access) return;
    const products = await fetchProducts(
      session?.access,
      selectedCategory?.toString() ?? "",
      currentPage,
      pageSize,
      searchEan,
      true,
    );
    setData(products.results);
    setTotal(products.count);
    setLoading(false);
  }, [currentPage, pageSize, searchEan, selectedCategory, session?.access]);

  useEffect(() => {
    const loadCategories = async () => {
      if (!session?.access) {
        return;
      }
      const allCategories = await fetchAllCategories(session?.access);
      setCategories(allCategories);
    };

    loadCategories();
    fetchInitialProducts();
  }, [fetchInitialProducts, session?.access]);

  useEffect(() => {
    fetchInitialProducts(); // Refetch products when category changes or search is performed
  }, [selectedCategory, searchEan, fetchInitialProducts]);

  const handleCategoryChange = (categoryId: number) => {
    if (categoryId === 0) setSelectedCategory(undefined);
    else setSelectedCategory(categoryId);
  };

  const handleSearch = (value: string) => {
    setSearchEan(value);
  };

  const handleSelect = (record: ApiTypes.Product) => {
    const isSelected = selectedProducts.some(
      (product) => product.id === record.id,
    );

    if (isSelected) {
      setSelectedProducts(
        selectedProducts.filter((product) => product.id !== record.id),
      );
    } else {
      setSelectedProducts([...selectedProducts, record]);
    }
  };

  const handleFinish = async (values: ImportValues) => {
    try {
      const products: ApiTypes.ProductImport[] = values.products.map(
        (product) =>
          ({
            product_id: product.id,
            quantity: product.count,
            price_with_vat: product.sell_price,
            import_price: product.import_price,
          }) as ApiTypes.ProductImport,
      );

      const stockImportData: ApiTypes.CreateStockImport = {
        supplier: values.supplier,
        ico: values.ico,
        invoice_number: values.invoice_number,
        note: values.note,
        products: products,
        invoice_pdf: values.pdf ? values.pdf[0]?.originFileObj : undefined,
      };
      if (!session?.access) {
        return;
      }
      await createStockImport(session?.access, stockImportData);
      fetchInitialProducts();
      form.resetFields();
      setSelectedProducts([]);
      message.success("Naskladnění bylo úspěšně vytvořeno.");
    } catch (error) {
      message.error("Naskladnění se nepodařilo vytvořit.");
      console.error("Error creating stock import:", error);
    }
  };

  const handlePageChange = (page: number, pageSize: number) => {
    setCurrentPage(page);
    setPageSize(pageSize);
  };

  return (
    <>
      <Row style={{ width: "100%" }}>
        <Col span={24}>
          <InvoiceFormCard form={form} onFinish={handleFinish} />
        </Col>
      </Row>
      <Row style={{ marginTop: "16px", alignItems: "stretch" }}>
        <Col xs={24} sm={24} md={12} lg={12} xl={12} style={{ height: "100%" }}>
          <ProductSelectionCard
            loading={loading}
            data={data}
            onSelect={handleSelect}
            onCategoryChange={handleCategoryChange}
            onSearch={handleSearch}
            categories={categories}
            selectedCategory={selectedCategory}
            searchEan={searchEan}
            selectedProducts={selectedProducts}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: total,
            }}
            onPageChange={handlePageChange}
          />
        </Col>
        <Col xs={24} sm={24} md={12} lg={12} xl={12} style={{ height: "100%" }}>
          <ImportSelectedProductsCard
            form={form}
            onFinish={handleFinish}
            selectedProducts={selectedProducts as EditableProduct[]}
          />
        </Col>
      </Row>
    </>
  );
};

export default Page;
