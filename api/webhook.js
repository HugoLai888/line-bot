const line = require('@line/bot-sdk');
const axios = require('axios');

const config = {
  channelAccessToken: 'UoUhXBfCpt+TrweMb3FuwO7+YswC4bLmnsidPaiMjyg2+Sp3lB6cFlF7bwwLRpvnjmJ9CxMzzO1mIlQIi/DAooIYhGTyIo0/WK1j8cqL6g+cqMn4R0vdmrRABBwGPFYXX0sqHi7PBIYVaZzUD9ecsgdB04t89/1O/w1cDnyilFU=',
  channelSecret: '1a82f738ff9f1757684fb564171c97e4'
};

const client = new line.Client(config);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const events = req.body.events;

  if (!Array.isArray(events)) {
    return res.status(200).send('No events');
  }

  try {
    await Promise.all(events.map(async (event) => {
      if (event.type !== 'message' || event.message.type !== 'text') return;

      const msg = event.message.text;

      if (msg.includes("查庫存")) {
        const csvURL = 'https://docs.google.com/spreadsheets/d/1xBe8niUbKLGNYNXjIKNNCqRQxjAPPWLVsLmLfRKGR8I/export?format=csv';
        try {
          const response = await axios.get(csvURL);
          const lines = response.data.split("\n");
          const reply = `目前資料有 ${lines.length - 1} 筆（不含標題）`;
          await client.replyMessage(event.replyToken, { type: 'text', text: reply });
        } catch (err) {
          console.error(err);
          await client.replyMessage(event.replyToken, { type: 'text', text: '查詢時出錯！' });
        }
      } else {
        await client.replyMessage(event.replyToken, { type: 'text', text: '請輸入「查庫存」' });
      }
    }));

    res.status(200).send('OK');
  } catch (err) {
    console.error('Handle event error', err);
    res.status(500).send('Error');
  }
};
