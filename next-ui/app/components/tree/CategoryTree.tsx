import React from "react";
import { Tree, Skeleton, Button } from "antd";
import { useRouter } from "next/navigation";
import { PlusOutlined } from "@ant-design/icons";

interface Category {
  id: number;
  name: string;
  children?: Category[];
}

interface CategoryTreeProps {
  categories: Category[];
  onSelect: (selectedKeys: React.Key[], info: any) => void;
  loading?: boolean;
  canAddCategory?: boolean;
  selectedCategoryId?: number;
}

const CategoryTree: React.FC<CategoryTreeProps> = ({
  categories,
  onSelect,
  loading = false,
  canAddCategory = false,
  selectedCategoryId,
}) => {
  const router = useRouter();

  const handleAddCategory = () => {
    router.push("/catalog/add/category"); // Update with the actual path if different
  };

  const addNewCategory = {
    key: "add-new-category",
    title: (
      <Button type="link" icon={<PlusOutlined />} onClick={handleAddCategory}>
        Přidat novou kategorii
      </Button>
    ),
    selectable: false,
  };

  const renderTreeData = (
    categories: Category[],
    parentId?: number,
    processedCategories: Set<number> = new Set()
  ): any[] => {
    return [
      ...(parentId === undefined && canAddCategory ? [addNewCategory] : []),
      ...categories
        .map((category) => {
          const uniqueKey = category.id;

          if (processedCategories.has(category.id)) {
            return null;
          }
          processedCategories.add(category.id);

          return {
            key: uniqueKey,
            title: category.name,
            disabled: category.id === selectedCategoryId,
            parent: parentId,
            children: category.children
              ? renderTreeData(
                  category.children,
                  category.id,
                  processedCategories
                )
              : [],
          };
        })
        .filter(Boolean),
    ];
  };

  const treeData = renderTreeData(categories);

  return (
    <Skeleton active loading={loading}>
      {!loading && (
        <Tree
          showLine
          defaultExpandAll
          treeData={treeData}
          onSelect={onSelect}
          style={{
            overflowY: "auto",
            maxHeight: "400px",
            paddingBottom: "10px",
          }}
        />
      )}
    </Skeleton>
  );
};

export default CategoryTree;
