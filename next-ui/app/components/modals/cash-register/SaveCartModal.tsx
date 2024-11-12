"use client";
import React, { useState } from "react";
import { Modal, Input, message } from "antd";
import { createInvoice } from "@/app/api/invoices/invoices";
import { ApiTypes, CustomSession } from "@/app/types/api";
import { useSession } from "next-auth/react";

interface SaveCartModalProps {
  visible: boolean;
  onCancel: () => void;
  selectedProducts: {
    product: ApiTypes.Product;
    quantity: number;
  }[];
}

const SaveCartModal: React.FC<SaveCartModalProps> = ({
  visible,
  onCancel,
  selectedProducts,
}) => {
  const [cartName, setCartName] = useState("");
  const { data: session }: { data: CustomSession } = useSession();

  const handleSaveCart = async () => {
    if (cartName.trim() !== "") {
      try {
        const invoiceData = {
          name: cartName,
          selected_products: selectedProducts.map((item) => ({
            product: item.product.id,
            quantity: item.quantity,
          })),
        };
        if (!session?.access) {
          return;
        }
        await createInvoice(invoiceData, session?.access);
        message.success("Účtenka uložena úspěšně");
        onCancel();
        setCartName("");
      } catch (error) {
        console.error("Error saving invoice:", error);
        message.error("Chyba při ukládání účtenky");
      }
    } else {
      message.error("Prosím zadejte název účtenky");
    }
  };

  return (
    <Modal
      title="Save Cart"
      open={visible}
      onCancel={onCancel}
      onOk={handleSaveCart}
    >
      <Input
        placeholder="Prosím zadejte název"
        value={cartName}
        onChange={(e) => setCartName(e.target.value)}
      />
    </Modal>
  );
};

export default SaveCartModal;
