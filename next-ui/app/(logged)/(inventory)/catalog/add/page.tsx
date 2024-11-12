"use client";

import MenuCard, { CardItem } from "@/app/components/cards/MenuCard";
import {
  FolderAddOutlined,
  FolderOutlined,
  PlusOutlined,
} from "@ant-design/icons";

const Page = () => {
  const items: CardItem[] = [
    {
      title: "Přidat produkt",
      icon: <PlusOutlined style={{ fontSize: "104px", color: "#fff" }} />,
      color: "#1890ff",
      path: "/catalog/add/product/",
    },
    {
      title: "Ze seznamu Přidat později",
      icon: <FolderAddOutlined style={{ fontSize: "104px", color: "#fff" }} />,
      color: "#52c41a",
      path: "/catalog/add/add-later/",
    },
    {
      title: "Přidat kategorii",
      icon: <FolderOutlined style={{ fontSize: "104px", color: "#fff" }} />,
      color: "#faad14",
      path: "/catalog/add/category/",
    },
  ];

  return <MenuCard items={items} title={"Přidat do katalogu"} />;
};

export default Page;
