"use client";

import React from "react";
import { Modal } from "antd";
import Voucher = ApiTypes.Voucher;
import { ApiTypes } from "@/app/types/api";
import VoucherForm from "@/app/components/forms/voucher/VoucherForm";

interface VoucherModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (values: Voucher) => Promise<void>;
  initialValues?: Voucher;
  editingVoucherId?: number | null;
}

const VoucherModal: React.FC<VoucherModalProps> = ({
  visible,
  onCancel,
  onSubmit,
  initialValues,
  editingVoucherId,
}) => {
  return (
    <Modal
      title={editingVoucherId ? "Upravit voucher" : "Přidat nový voucher"}
      open={visible}
      onCancel={onCancel}
      footer={null}
    >
      <VoucherForm
        initialValues={initialValues}
        onSubmit={onSubmit}
        editingVoucherId={editingVoucherId}
      />
    </Modal>
  );
};

export default VoucherModal;
