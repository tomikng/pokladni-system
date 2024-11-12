import React from "react";
import { Menu, MenuProps } from "antd";
import {
  ArrowDownOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  HomeFilled,
  LogoutOutlined,
  PieChartOutlined,
  SettingOutlined,
  ShoppingCartOutlined,
  TruckOutlined,
  UsergroupAddOutlined,
  TagOutlined,
  PlusOutlined,
  HistoryOutlined,
  FileSearchOutlined,
  BarChartOutlined,
  UserAddOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CustomSession } from "@/app/types/api";

type MenuItem = Required<MenuProps>["items"][number];

interface MenuBarProps {
  collapsed: boolean;
}

export default function MenuBar({ collapsed }: MenuBarProps) {
  const { data: session }: { data: CustomSession | any } = useSession();
  const router = useRouter();

  const onClick = (e: any) => {
    router.push(e.key);
  };

  function getItem(
    label: React.ReactNode,
    key: React.Key,
    icon?: React.ReactNode,
    children?: MenuItem[],
    type?: "group",
    style?: React.CSSProperties,
  ): MenuItem {
    return {
      key,
      icon,
      children,
      label: type === "group" && collapsed ? "" : label,
      type,
      style,
    };
  }

  const logoutItem: MenuItem = getItem(
    "Odhlásit se",
    "/api/auth/signout",
    <LogoutOutlined />,
    undefined,
    undefined,
    { color: "red" },
  );

  const isAdmin = session?.user?.role === "AD" || session?.user?.role === "MA";
  const isCashier = session?.user?.role === "CA";

  const catalogItems = [
    getItem("Seznam", "/catalog/list/", <FileTextOutlined />),
    getItem("Přidat", "/catalog/add/", <PlusOutlined />),
    getItem("Pohyby", "/catalog/history/", <HistoryOutlined />),
    ...(isAdmin
      ? [getItem("Poukazy", "/catalog/vouchers/", <TagOutlined />)]
      : []),
  ];

  const baseItems: MenuProps["items"] = [
    getItem(
      "Přehled",
      "home",
      <HomeFilled />,
      [getItem("Domů", "/", <HomeFilled />)],
      "group",
    ),
    getItem(
      "Pokladna",
      "csh_rgs",
      <ShoppingCartOutlined />,
      [
        getItem("Pokladna", "/cash-register/", <ShoppingCartOutlined />),
        getItem("Historie transakcí", "/history/", <ClockCircleOutlined />),
      ],
      "group",
    ),
    getItem(
      "Sklad",
      "inventory",
      <ArrowDownOutlined />,
      [
        getItem("Import", "/import/", <ArrowDownOutlined />),
        getItem("Katalog", "/catalog/", <FileTextOutlined />, catalogItems),
        getItem("Dodavatelé", "/importers/", <TruckOutlined />),
      ],
      "group",
    ),
  ];

  const endDayReportItem = getItem(
    "Denní uzávěrka",
    "/end-day-report/",
    <ClockCircleOutlined />,
  );

  const dividerItem: MenuItem = { type: "divider" };

  const protectedItems: MenuProps["items"] = [
    ...baseItems,
    getItem(
      "Administrace",
      "grp",
      <SettingOutlined />,
      [
        getItem("Statistika", "/statistics/", <PieChartOutlined />, [
          getItem("Prodej", "/statistics/profits/", <BarChartOutlined />),
          getItem("Sklad", "/statistics/warehouse/", <InboxOutlined />),
        ]),
        getItem(
          "Správa uživatelů",
          "user-management",
          <UsergroupAddOutlined />,
          [
            getItem("Seznam", "/user-management/list/", <FileSearchOutlined />),
            getItem("Přidat", "/user-management/add/", <UserAddOutlined />),
          ],
        ),
        getItem("Nastavení", "/settings/", <SettingOutlined />),
      ],
      "group",
    ),
    dividerItem,
    endDayReportItem,
  ];

  const notProtectedItems: MenuProps["items"] = [
    ...baseItems,
    ...(isCashier ? [dividerItem, endDayReportItem] : []),
    logoutItem,
  ];

  return (
    <Menu
      onClick={onClick}
      mode="inline"
      defaultSelectedKeys={["1"]}
      items={isAdmin ? protectedItems : notProtectedItems}
      style={{ minHeight: "100vh" }}
    />
  );
}
