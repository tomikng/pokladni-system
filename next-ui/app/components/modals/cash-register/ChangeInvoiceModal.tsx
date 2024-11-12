import React, { useState } from "react";
import { Modal, Input, List, Button, message } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { deleteInvoice } from "@/app/api/invoices/invoices";
import { useSession } from "next-auth/react";
import { CustomSession } from "@/app/types/api";

interface ChangeInvoiceModalProps {
  visible: boolean;
  onCancel: () => void;
  onSelect: (invoice: any) => void;
  invoices: any[];
  setInvoices: React.Dispatch<React.SetStateAction<any[]>>;
}

const ChangeInvoiceModal: React.FC<ChangeInvoiceModalProps> = ({
  visible,
  onCancel,
  onSelect,
  invoices,
  setInvoices,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: session }: { data: CustomSession } = useSession();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredInvoices = invoices.filter((invoice) =>
    invoice.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  async function handleDelete(id: any): Promise<void> {
    try {
      if (!session?.access) {
        return;
      }
      await deleteInvoice(id, session?.access);
      setInvoices(invoices.filter((invoice) => invoice.id !== id));
      message.success("Účtenka byla úspěšně smazána");
    } catch (error) {
      console.error("Chyba při mazání účtenky:", error);
      message.error("Chyba při mazání účtenky");
    }
  }

  return (
    <Modal
      title="Změnit účtenku"
      open={visible}
      onCancel={onCancel}
      footer={null}
    >
      <Input
        placeholder="Vyhledat účtenky"
        value={searchTerm}
        onChange={handleSearch}
        style={{ marginBottom: "16px" }}
      />
      <List
        dataSource={filteredInvoices}
        renderItem={(invoice) => (
          <List.Item
            key={invoice.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              onClick={() => onSelect(invoice)}
              style={{ cursor: "pointer" }}
            >
              {invoice.name}
            </div>
            <Button
              type="text"
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(invoice.id)}
              style={{ color: "red" }}
            />
          </List.Item>
        )}
        style={{ maxHeight: "300px", overflowY: "auto" }}
      />
    </Modal>
  );
};

export default ChangeInvoiceModal;
