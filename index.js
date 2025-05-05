const express = require('express');
const line = require('@line/bot-sdk');
const axios = require('axios');

const config = {
  channelAccessToken: 'UoUhXBfCpt+TrweMb3FuwO7+YswC4bLmnsidPaiMjyg2+Sp3lB6cFlF7bwwLRpvnjmJ9CxMzzO1mIlQIi/DAooIYhGTyIo0/WK1j8cqL6g+cqMn4R0vdmrRABBwGPFYXX0sqHi7PBIYVaZzUD9ecsgdB04t89/1O/w1cDnyilFU=',
  channelSecret: '1a82f738ff9f1757684fb564171c97e4'
};

const app = express();
const port = process.env.PORT || 3000;

app.post('/api/webhook', line.middleware(config), (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then(result => res.json(result))
    .catch(err => {
      console.error(err);
      res.status(500).end();
    });
});

const client = new line.Client(config);

async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') return null;

  const msg = event.message.text;
  if (msg.includes("查庫存")) {
    try {
      const csvURL = 'https://docs.google.com/spreadsheets/d/1xBe8niUbKLGNYNXjIKNNCqRQxjAPPWLVsLmLfRKGR8I/export?format=csv';
      const res = await axios.get(csvURL);
      const lines = res.data.split("\n");
      const reply = `目前資料有 ${lines.length - 1} 筆（不含標題）`;
      return client.replyMessage(event.replyToken, { type: 'text', text: reply });
    } catch (err) {
      console.error(err);
      return client.replyMessage(event.replyToken, { type: 'text', text: '查詢時出錯，請稍後再試。' });
    }
  }

  return client.replyMessage(event.replyToken, { type: 'text', text: '請輸入「查庫存」查詢' });
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
