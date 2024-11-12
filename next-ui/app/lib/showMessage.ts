import { MessageInstance, NoticeType } from "antd/es/message/interface";

export const showMessage = (
  type: NoticeType,
  message: string,
  messageApi: MessageInstance
) => {
  messageApi.open({
    type,
    content: message,
  });
};
