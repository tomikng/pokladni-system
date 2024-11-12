import React, { useEffect, forwardRef, RefObject } from "react";
import { Form, Input, Select, Button, FormInstance } from "antd";
import { CustomSession, CustomUser } from "@/app/types/api";
import { showMessage } from "@/app/lib/showMessage";
import { updateUser } from "@/app/api/users/updateUser";
import { useSession } from "next-auth/react";
import { MessageInstance } from "antd/es/message/interface";

interface EditUserFormProps {
  editedUser: CustomUser;
  setIsModalVisible: (value: boolean) => void;
  messageApi: MessageInstance;
  onUserUpdate: () => void;
}

const EditUserForm = forwardRef(function EditUserForm(
  {
    editedUser,
    setIsModalVisible,
    messageApi,
    onUserUpdate,
  }: EditUserFormProps,
  ref
) {
  const [form] = Form.useForm();
  const { data: session }: { data: CustomSession } = useSession();

  useEffect(() => {
    form.setFieldsValue(editedUser);
  }, [editedUser, form]);

  const handleFinish = async () => {
    try {
      const values = await form.validateFields();
      if (!session?.access) {
        showMessage(
          "error",
          "Něco se pokazilo, zkuste prosím znova",
          messageApi
        );
        return;
      }
      await updateUser(session?.access, editedUser.id, values);
      setIsModalVisible(false);
      showMessage("success", "Uživatel byl úspěšně upraven", messageApi);
      onUserUpdate();
    } catch (error) {
      showMessage("error", "Nepodařilo se upravit uživatele", messageApi);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      ref={ref as RefObject<FormInstance<any>>}
    >
      <Form.Item
        name="first_name"
        label="Křestní jméno"
        rules={[{ required: true, message: "Prosím vyplňte křestní jméno!" }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="last_name"
        label="Příjmení"
        rules={[{ required: true, message: "Prosím vyplňte příjmení!" }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="username"
        label="Uživatelské jméno"
        rules={[
          { required: true, message: "Prosím vyplňte uživatelské jméno!" },
        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="role"
        label="Role"
        rules={[{ required: true, message: "Prosím vyberte roli!" }]}
      >
        <Select>
          <Select.Option value="CA">Pokladní</Select.Option>
          <Select.Option value="MA">Manažer</Select.Option>
          <Select.Option value="AD">Admin</Select.Option>
        </Select>
      </Form.Item>
      <Form.Item
        name="is_active"
        label="Aktivní"
        rules={[
          {
            required: true,
            message: "Prosím vyberte jestli je uživatel aktivní",
          },
        ]}
      >
        <Select>
          <Select.Option value={true}>Ano</Select.Option>
          <Select.Option value={false}>Ne</Select.Option>
        </Select>
      </Form.Item>
    </Form>
  );
});

export default EditUserForm;
