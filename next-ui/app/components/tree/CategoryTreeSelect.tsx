import React, { useState, useEffect, useCallback } from "react";
import { TreeSelect } from "antd";
import { useSession } from "next-auth/react";
import { ApiTypes, CustomSession } from "@/app/types/api";
import { fetchAllCategories } from "@/app/api/categories/fetchCategories";

interface TreeData {
  value: string;
  title: string;
  id: number;
  children?: TreeData[];
}

interface CategoryTreeSelectProps {
  selectedCategory?: number; // Added to handle external changes
  onSelect?: (value: string, id: number) => void;
}

const convertToTreeData = (
  categories: ApiTypes.Category[],
  parentId: number | null = null
): TreeData[] => {
  return categories
    .filter((c) => c.parent === parentId)
    .map((category) => ({
      value: category.name,
      title: category.name,
      id: category.id,
      children: convertToTreeData(categories, category.id),
    }));
};

const CategoryTreeSelect: React.FC<CategoryTreeSelectProps> = ({
  selectedCategory,
  onSelect,
}) => {
  const [categories, setCategories] = useState<TreeData[]>([]);
  const { data: session }: { data: CustomSession } = useSession();
  const [value, setValue] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    if (session?.access) {
      try {
        const allCategories = await fetchAllCategories(session.access);
        const formattedTreeData = convertToTreeData(allCategories);
        setCategories(formattedTreeData);
      } catch (error) {
        console.error("Failed to load categories:", error);
      }
    }
    setLoading(false);
  }, [session?.access]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    const selected = categories.find((cat) => cat.id === selectedCategory);
    setValue(selected ? selected.title : undefined);
  }, [selectedCategory, categories]);

  const onSelectHandler = (selectedValue: string, selectedNode: any) => {
    if (onSelect && selectedNode) {
      onSelect(selectedValue, selectedNode.id);
    }
  };

  return (
    <TreeSelect
      showSearch
      style={{ width: "100%" }}
      value={value}
      dropdownStyle={{ maxHeight: 400, overflow: "auto" }}
      placeholder="Prosím vyberte kategorii"
      allowClear
      onSelect={onSelectHandler}
      treeData={categories}
      loading={loading}
      disabled={loading}
    />
  );
};

export default CategoryTreeSelect;
