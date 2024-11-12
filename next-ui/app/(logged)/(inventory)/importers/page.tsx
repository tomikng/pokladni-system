"use client";

import MenuCard, { CardItem } from "@/app/components/cards/MenuCard";
import { UnorderedListOutlined, ClockCircleOutlined } from "@ant-design/icons";

const Page = () => {
  const items: CardItem[] = [
    {
      title: "Historie příjmů",
      icon: (
        <ClockCircleOutlined style={{ fontSize: "104px", color: "#fff" }} />
      ),
      color: "#1890ff",
      path: "/importers/history/",
    },
    {
      title: "Seznam dodavatelů",
      icon: (
        <UnorderedListOutlined style={{ fontSize: "104px", color: "#fff" }} />
      ),
      color: "#52c41a",
      path: "/importers/list/",
    },
  ];

  return <MenuCard items={items} title={"Dodavatelé"} />;
};

export default Page;
