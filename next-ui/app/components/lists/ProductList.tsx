"use client";
import React, { useCallback, useEffect, useState } from "react";
import {
  Row,
  Col,
  Card,
  Input,
  Pagination,
  Drawer,
  Button,
  Skeleton,
  Switch,
  Space,
  Typography,
} from "antd";
import CategoryTree from "@/app/components/tree/CategoryTree";
import { ApiTypes, CustomSession } from "@/app/types/api";
import { FilterOutlined } from "@ant-design/icons";
import ProductCard from "@/app/components/cards/ProductCard";
import CategoryBreadcrumb from "@/app/components/breadcrumb/CategoryBreadcrumbs";
import ChildCategoriesCard from "@/app/components/cards/ChildCategoriesCards";
import { fetchProducts } from "@/app/api/products/fetchProducts";
import { useSession } from "next-auth/react";
import { fetchAllCategories } from "@/app/api/categories/fetchCategories";

const { Text } = Typography;

const ProductList = () => {
  const [products, setProducts] = useState<ApiTypes.Product[]>([]);
  const [categories, setCategories] = useState<ApiTypes.Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number>();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(18);
  const [totalProducts, setTotalProducts] = useState(0);
  const [filterVisible, setFilterVisible] = useState(false);
  const [showOnlyActive, setShowOnlyActive] = useState(true);
  const { data: session }: { data: CustomSession } = useSession();

  const fetchProductsData = useCallback(() => {
    setLoading(true);
    fetchProducts(
      session?.access!,
      selectedCategory?.toString(),
      currentPage,
      pageSize,
      searchTerm,
      showOnlyActive,
    ).then((data) => {
      setProducts(data.results);
      setTotalProducts(data.count);
      setLoading(false);
    });
  }, [
    session,
    currentPage,
    pageSize,
    searchTerm,
    selectedCategory,
    showOnlyActive,
  ]);

  useEffect(() => {
    if (session?.access) {
      fetchProductsData();
      fetchAllCategories(session.access).then((data) => setCategories(data));
    }
  }, [session, fetchProductsData]);

  const handleCategorySelect = (selectedKeys: React.Key[]) => {
    if (selectedKeys.length > 0) {
      const categoryId = parseInt(
        (selectedKeys[0] as string).toString().split("-").pop()!,
      );
      setSelectedCategory(categoryId);
      setCurrentPage(1);
    } else {
      setSelectedCategory(undefined);
      setCurrentPage(1);
    }
  };

  const handlePageChange = (page: number, pageSize: number) => {
    setCurrentPage(page);
    setPageSize(pageSize);
  };

  const toggleFilter = () => {
    setFilterVisible(!filterVisible);
  };

  const handleBreadcrumbClick = (categoryId: number) => {
    if (categoryId === 0) {
      setSelectedCategory(undefined);
    } else setSelectedCategory(categoryId);
    setCurrentPage(1);
  };

  const handleActiveToggle = (checked: boolean) => {
    setShowOnlyActive(checked);
    setCurrentPage(1);
    fetchProductsData();
  };

  return (
    <>
      <CategoryBreadcrumb
        categories={categories}
        selectedCategory={selectedCategory}
        onBreadcrumbClick={handleBreadcrumbClick}
      />
      <ChildCategoriesCard
        categories={categories}
        selectedCategory={selectedCategory}
        onCategorySelect={handleCategorySelect}
      />
      <Row
        gutter={16}
        style={{ marginBottom: 16, display: "flex", alignItems: "center" }}
      >
        <Col flex="auto">
          <Input
            placeholder="Hledat podle EAN kódu"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onPressEnter={fetchProductsData}
          />
        </Col>
        <Col>
          <Space>
            <Text>Pouze aktivní produkty:</Text>
            <Switch checked={showOnlyActive} onChange={handleActiveToggle} />
          </Space>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<FilterOutlined />}
            onClick={toggleFilter}
          >
            Filtr kategorií
          </Button>
        </Col>
      </Row>
      <Drawer
        title="Filter kategorií"
        placement="right"
        open={filterVisible}
        onClose={toggleFilter}
      >
        <CategoryTree
          categories={categories}
          onSelect={handleCategorySelect}
          loading={loading}
        />
      </Drawer>
      {loading ? (
        <Row gutter={16}>
          {[...Array(18)].map((_, index) => (
            <Col key={index} span={4} style={{ marginBottom: 16 }}>
              <Card style={{ height: 400 }}>
                <Skeleton active />
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <>
          <Row gutter={16}>
            {products.map((product) => (
              <Col key={product.id} span={4} style={{ marginBottom: 16 }}>
                <ProductCard product={product} onProductDetail={true} />
              </Col>
            ))}
          </Row>
          <div
            style={{ display: "flex", justifyContent: "center", marginTop: 16 }}
          >
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={totalProducts}
              onChange={handlePageChange}
              showSizeChanger
              showQuickJumper
              showTotal={(total) => `Celkem ${total} produktů`}
            />
          </div>
        </>
      )}
    </>
  );
};

export default ProductList;
