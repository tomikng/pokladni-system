import LayoutComponent from "../components/LayoutComponent";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LayoutComponent>{children}</LayoutComponent>;
}
