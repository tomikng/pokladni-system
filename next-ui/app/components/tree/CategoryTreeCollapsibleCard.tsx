import React from "react";
import { Row, Col, Breadcrumb, Button, Collapse } from "antd";
import { HomeOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { ApiTypes } from "@/app/types/api";
import { CategoryCard } from "@/app/components/cards/CategoryCard";

const { Panel } = Collapse;

interface CategoryTreeProps {
  categories: ApiTypes.Category[];
  selectedCategory: number | undefined;
  onCategorySelect: (categoryId: number) => void;
  onGoBack: () => void;
}

const CategoryTreeCards: React.FC<CategoryTreeProps> = ({
  categories,
  selectedCategory,
  onCategorySelect,
  onGoBack,
}) => {
  const getParentCategories = (categoryId: number): ApiTypes.Category[] => {
    const category = categories.find((cat) => cat.id === categoryId);
    if (category && category.parent) {
      return [...getParentCategories(category.parent as number), category];
    }
    return [category!];
  };

  const renderCategories = (
    categories: ApiTypes.Category[],
    isChild = false,
  ) => {
    return (
      <Row
        gutter={[16, 16]}
        style={{ maxHeight: isChild ? "auto" : "100px", overflowY: "auto" }}
      >
        {categories.map((cat) => (
          <Col key={cat.id} xs={24} sm={12} md={8} lg={6}>
            <CategoryCard category={cat} onCategorySelect={onCategorySelect} />
          </Col>
        ))}
      </Row>
    );
  };

  const collapseItems = [
    {
      key: "1",
      label: "Kategorie",
      children: selectedCategory ? (
        <>
          <Breadcrumb style={{ marginBottom: "16px" }}>
            <Breadcrumb.Item href="#" onClick={() => onCategorySelect(0)}>
              <HomeOutlined />
            </Breadcrumb.Item>
            {getParentCategories(selectedCategory).map((cat) => (
              <Breadcrumb.Item
                key={cat.id}
                href="#"
                onClick={() => onCategorySelect(cat.id)}
              >
                {cat.name}
              </Breadcrumb.Item>
            ))}
          </Breadcrumb>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={onGoBack}
            style={{ marginBottom: "16px" }}
          >
            Zpět
          </Button>
          {renderCategories(
            categories.find((cat) => cat.id === selectedCategory)?.children ||
              [],
            true,
          )}
        </>
      ) : (
        renderCategories(categories.filter((cat) => !cat.parent))
      ),
    },
  ];

  return (
    <Collapse defaultActiveKey={["0"]} bordered={true} items={collapseItems} />
  );
};

export default CategoryTreeCards;
