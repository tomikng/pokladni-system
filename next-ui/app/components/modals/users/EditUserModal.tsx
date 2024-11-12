import React, { useRef } from "react";
import { Button, Modal } from "antd";
import EditUserForm from "../../forms/users/EditUserForm";
import { CustomUser } from "@/app/types/api";
import { MessageInstance } from "antd/es/message/interface";
import { on } from "events";

export type EditUserModalProps = {
  visible: boolean;
  editedUser: CustomUser | undefined;
  setIsModalVisible: (value: boolean) => void;
  messageApi: MessageInstance;
  onUserUpdate: () => void;
};

export const EditUserModal: React.FC<EditUserModalProps> = ({
  visible,
  editedUser,
  setIsModalVisible,
  messageApi,
  onUserUpdate,
}) => {
  const formRef = useRef<HTMLFormElement | null>(null);

  const handleOk = () => {
    if (formRef.current) {
      formRef.current.submit();
    }
  };

  return (
    <Modal
      title="Upravit uživatele"
      open={visible}
      onOk={handleOk}
      onCancel={() => setIsModalVisible(false)}
      footer={[
        <Button key="back" onClick={() => setIsModalVisible(false)}>
          Zrušit
        </Button>,
        <Button key="submit" type="primary" onClick={handleOk}>
          Uložit
        </Button>,
      ]}
    >
      {editedUser && (
        <EditUserForm
          editedUser={editedUser}
          setIsModalVisible={setIsModalVisible}
          ref={formRef}
          messageApi={messageApi}
          onUserUpdate={onUserUpdate}
        />
      )}
    </Modal>
  );
};
