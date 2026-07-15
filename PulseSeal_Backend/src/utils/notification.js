import Notification from "../models/notification.Model.js";

export const sendNotification = async ({
  recipient,
  sender,
  type,
  message,
  meta = {},
}) => {
  try {
    const notif = await Notification.create({
      recipient,
      sender,
      type,
      message,
      meta,
    });

    return notif;
  } catch (err) {
    console.error("Notification Error:", err);
  }
};
