import React, { useEffect, useState } from "react";
import { FormInstance, Select, Spin, message } from "antd";
import { ApiTypes, CustomSession } from "@/app/types/api";
import { fetchSuppliers } from "@/app/api/suppliers/fetchSuppliers";
import { useSession } from "next-auth/react";

interface SupplierSelectProps {
  form: FormInstance;
  setSelectedSupplier: (value: ApiTypes.Supplier | null) => void;
}

const SupplierSelect: React.FC<SupplierSelectProps> = ({
  form,
  setSelectedSupplier,
}) => {
  const [suppliers, setSuppliers] = useState<ApiTypes.Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const { data: session }: { data: CustomSession } = useSession();
  const [, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);
  const [searchText, setSearchText] = useState<string>("");

  const fetchData = async (
    searchField = "",
    searchText = "",
    page = 1,
    append = false,
  ) => {
    if (!session?.access) return;
    if (!append) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    try {
      const data = await fetchSuppliers(
        searchField,
        searchText,
        page,
        pageSize,
        session?.access,
      );
      setSuppliers((prevSuppliers) =>
        append ? [...prevSuppliers, ...data.results] : data.results,
      );
      setTotal(data.count);
    } catch (error) {
      message.error("Failed to fetch suppliers");
    }
    setLoading(false);
    setLoadingMore(false);
  };

  useEffect(() => {
    fetchData();
  }, [session?.access]);

  const handleSupplierSearch = (value: string) => {
    setSearchText(value);
    setCurrentPage(1);
    fetchData("name", value, 1);
  };

  const handleSupplierChange = (supplierId: number) => {
    const selectedSupplier = suppliers.find(
      (supplier) => supplier.id === supplierId,
    );
    if (selectedSupplier) {
      setSelectedSupplier(selectedSupplier);
    } else {
      setSelectedSupplier(null);
    }
  };

  const handlePopupScroll = (e: React.UIEvent<HTMLDivElement, UIEvent>) => {
    const target = e.target as HTMLElement;
    if (
      target.scrollTop + target.offsetHeight === target.scrollHeight &&
      suppliers.length < total
    ) {
      setCurrentPage((prevPage) => {
        const newPage = prevPage + 1;
        fetchData("name", searchText, newPage, true);
        return newPage;
      });
    }
  };

  return (
    <>
      <Select
        showSearch
        placeholder="Vyberte dodavatele"
        notFoundContent={loading ? <Spin size="small" /> : null}
        filterOption={false}
        onSearch={handleSupplierSearch}
        onChange={handleSupplierChange}
        onPopupScroll={handlePopupScroll}
        allowClear
        onClear={() => {
          form.setFieldsValue({ ico: "" });
          setSelectedSupplier(null);
        }}
        dropdownRender={(menu) => (
          <>
            {menu}
            {loadingMore && (
              <div style={{ textAlign: "center", padding: "8px 0" }}>
                <Spin size="small" />
              </div>
            )}
          </>
        )}
      >
        {suppliers.map((supplier) => (
          <Select.Option key={supplier.id} value={supplier.id}>
            {supplier.name}
          </Select.Option>
        ))}
      </Select>
    </>
  );
};

export default SupplierSelect;
