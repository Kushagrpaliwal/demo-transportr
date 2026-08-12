import axios from "axios";

const CLICKSEND_USERNAME = import.meta.env.VITE_CLICKSEND_USERNAME;
const CLICKSEND_API_KEY = import.meta.env.VITE_CLICKSEND_API_KEY;
const SENDER_EMAIL = import.meta.env.VITE_CLICKSEND_SENDER_EMAIL;
const SENDER_ID = import.meta.env.VITE_CLICKSEND_SENDER_ID;

const AUTH_TOKEN = btoa(`${CLICKSEND_USERNAME}:${CLICKSEND_API_KEY}`);

const clickSendAPI = axios.create({
  baseURL: "/clicksend-api",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Basic ${AUTH_TOKEN}`,
  },
});

export const sendSMS = async ({ to, body, from, source = "Transportr-Web" }) => {
  const payload = {
    messages: [
      {
        source,
        body,
        to,
        from: from || SENDER_ID,
      },
    ],
  };

  const response = await clickSendAPI.post("/sms/send", payload);
  return response.data;
};

export const sendEmail = async ({
  to,
  toName,
  subject,
  body,
  fromEmail,
  fromName,
}) => {
  const payload = {
    to: [
      {
        email: to,
        name: toName || "",
      },
    ],
    from: {
      email_address_id: fromEmail || SENDER_EMAIL,
      name: fromName || "Transportr",
    },
    subject,
    body,
  };

  const response = await clickSendAPI.post("/email/send", payload);
  return response.data;
};

export const sendNotification = async ({
  phone,
  email,
  name,
  subject,
  smsBody,
  emailBody,
}) => {
  const results = await Promise.allSettled([
    sendSMS({ to: phone, body: smsBody }),
    sendEmail({ to: email, toName: name, subject, body: emailBody }),
  ]);

  return {
    sms: results[0].status === "fulfilled" ? results[0].value : { error: results[0].reason?.message },
    email: results[1].status === "fulfilled" ? results[1].value : { error: results[1].reason?.message },
  };
};
