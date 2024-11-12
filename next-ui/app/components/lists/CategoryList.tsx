import React, { useState, useEffect } from "react";
import { Modal, message } from "antd";
import { useSession } from "next-auth/react";
import { ApiTypes, CustomSession } from "@/app/types/api";
import CategoryForm from "../forms/catalog/CategoryForm";
import CategoryTree from "../tree/CategoryTree";
import { fetchAllCategories } from "@/app/api/categories/fetchCategories";

function transformToCategory(node: any): ApiTypes.Category {
  const category = new ApiTypes.Category();
  category.id = parseInt(node.key, 10);
  category.parent = node.parent;
  category.name = node.title;
  category.children = node.children?.map(transformToCategory) || [];

  return category;
}

const CategoryList: React.FC = () => {
  const [categories, setCategories] = useState<ApiTypes.Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<
    ApiTypes.Category | undefined
  >(undefined);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { data: session }: { data: CustomSession } = useSession();

  useEffect(() => {
    const loadCategories = async () => {
      if (session?.access!) {
        try {
          const fetchedCategories = await fetchAllCategories(session.access);
          setCategories(fetchedCategories);
        } catch (error) {
          console.error("Failed to load categories:", error);
          message.error("Nepodařilo se načíst kategorie");
        }
      }
    };

    loadCategories();
  }, [session]);

  const showModal = (category?: ApiTypes.Category) => {
    setSelectedCategory(category);
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedCategory(undefined);
  };

  const refreshCategories = async () => {
    const fetchedCategories = await fetchAllCategories(session?.access!);
    setCategories(fetchedCategories);
  };

  return (
    <>
      <CategoryTree
        categories={categories}
        onSelect={(_, info) => {
          showModal(transformToCategory(info.node));
        }}
      />
      <Modal
        title={`Úprava kategorie`}
        open={isModalVisible}
        onCancel={handleModalClose}
        footer={null}
      >
        <CategoryForm
          initialValues={selectedCategory}
          onFormFinish={() => {
            handleModalClose();
            refreshCategories();
          }}
        />
      </Modal>
    </>
  );
};

export default CategoryList;
