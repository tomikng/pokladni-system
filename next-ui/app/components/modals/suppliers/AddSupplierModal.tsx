import { Modal, Form, Button } from "antd";
import { ApiTypes } from "@/app/types/api";
import SupplierForm from "../../forms/suppliers/SupplierForm";

interface AddSupplierModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (values: ApiTypes.Supplier) => void;
}

const AddSupplierModal: React.FC<AddSupplierModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const [form] = Form.useForm();

  const handleOk = () => {
    form.validateFields().then((values) => {
      onSubmit(values);
      form.resetFields();
    });
  };

  return (
    <Modal
      title="Add Supplier"
      open={visible}
      onOk={handleOk}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Zrušit
        </Button>,
        <Button key="submit" type="primary" onClick={handleOk}>
          Vytvořit
        </Button>,
      ]}
    >
      <SupplierForm form={form} />
    </Modal>
  );
};

export default AddSupplierModal;
