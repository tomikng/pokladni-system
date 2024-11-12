import React from "react";
import { Breadcrumb } from "antd";
import { HomeOutlined } from "@ant-design/icons"; // Import the Home icon
import { ApiTypes } from "@/app/types/api";

interface CategoryBreadcrumbProps {
  categories: ApiTypes.Category[];
  selectedCategory: number | undefined;
  onBreadcrumbClick: (categoryId: number) => void;
}

const CategoryBreadcrumb: React.FC<CategoryBreadcrumbProps> = ({
  categories,
  selectedCategory,
  onBreadcrumbClick,
}) => {
  const buildBreadcrumbItems = (
    currentCategory: ApiTypes.Category,
    items: ApiTypes.Category[] = []
  ) => {
    items.unshift(currentCategory); // Place the current category at the beginning of the array
    if (currentCategory.parent) {
      const parentCategory = categories.find(
        (cat) => cat.id === currentCategory.parent
      );
      if (parentCategory) {
        buildBreadcrumbItems(parentCategory, items);
      }
    }
    return items;
  };

  let breadcrumbItems: ApiTypes.Category[] = [];
  if (selectedCategory) {
    const category = categories.find((cat) => cat.id === selectedCategory);
    if (category) {
      breadcrumbItems = buildBreadcrumbItems(category);
    }
  }

  return (
    <Breadcrumb style={{ marginBottom: "16px" }}>
      <Breadcrumb.Item key="home" onClick={() => onBreadcrumbClick(0)}>
        <a style={{ cursor: "pointer" }}>
          <HomeOutlined />
        </a>
      </Breadcrumb.Item>
      {breadcrumbItems.map((item) => (
        <Breadcrumb.Item
          key={item.id}
          onClick={() => onBreadcrumbClick(item.id)}
        >
          <a style={{ cursor: "pointer" }}>{item.name}</a>
        </Breadcrumb.Item>
      ))}
    </Breadcrumb>
  );
};

export default CategoryBreadcrumb;
