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
      const match = msg.match(/查(.*)庫存/);
      const isGenericAsk = msg.includes("有庫存嗎");

      // 條件一：查○○庫存
      if (match && match[1]) {
        const keyword = match[1].trim();
        const csvURL = 'https://docs.google.com/spreadsheets/d/1xBe8niUbKLGNYNXjIKNNCqRQxjAPPWLVsLmLfRKGR8I/export?format=csv';

        try {
          const response = await axios.get(csvURL);
          const lines = response.data.split('\n');
          const rawKeyword = match[1].trim().replace(/\s/g, '').toLowerCase();
const keywordParts = rawKeyword.split(/(?=[A-Z\u4e00-\u9fa5])/);

let matched;

if (keyword === '名品') {
  // 特例處理「名品」完全比對
  matched = lines.filter(line => {
    const parts = line.split(',');
    const name = parts[1].replace(/\s/g, '').toLowerCase();
    return name === '名品';
  });
} else {
  // 原本模糊搜尋邏輯
  const rawKeyword = keyword.toLowerCase();
  const keywordParts = rawKeyword.split(/[^\u4e00-\u9fa5a-z0-9]/);

  matched = lines.filter(line => {
    const parts = line.split(',');
    const combined = `${parts[0]}${parts[1]}${parts[2]}`.replace(/\s/g, '').toLowerCase();
    return keywordParts.every(part => combined.includes(part));
  });
}

if (matched.length > 1) {
  const reply = matched.map(line => {
    const parts = line.split(',');
    const no = parts[0];
    const name = parts[1];
    const qty = parts[6];  // ✅ 第7欄是數量
    return `${no}：${name}（${qty}）`;
  }).join('\n');
  
  await client.replyMessage(event.replyToken, {
    type: 'text',
    text: `找到 ${matched.length - 1} 筆與「${match[1]}」相關的庫存：\n${reply}`
  });
}


        } catch (err) {
          console.error(err);
          await client.replyMessage(event.replyToken, {
            type: 'text',
            text: '查詢時發生錯誤'
          });
        }

      } else if (isGenericAsk) {
        // 條件二：有庫存嗎
        await client.replyMessage(event.replyToken, {
          type: 'text',
          text: '請問您想查哪個產品的庫存？（例如：查卡蒂雅庫存）'
        });

      } else {
        // 不符任何條件，不回應
        return;
      }
    }));

    res.status(200).send('OK');
  } catch (err) {
    console.error('Handle event error', err);
    res.status(500).send('Error');
  }
};
