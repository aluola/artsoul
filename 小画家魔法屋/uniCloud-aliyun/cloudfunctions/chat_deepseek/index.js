'use strict';

let localSecrets = {};
try {
  localSecrets = require('./secrets.local.json');
} catch (error) {
  if (!error || error.code !== 'MODULE_NOT_FOUND') throw error;
}
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || localSecrets.DEEPSEEK_API_KEY;

exports.main = async (event, context) => {
  const { messages } = event;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return { code: -1, msg: '缺少 messages 数组参数' };
  }

  if (!DEEPSEEK_API_KEY || isPlaceholderKey(DEEPSEEK_API_KEY)) {
    return { code: -1, msg: 'DEEPSEEK_API_KEY 未配置' };
  }

  try {
    const res = await uniCloud.httpclient.request(
      'https://api.deepseek.com/chat/completions',
      {
        method: 'POST',
        contentType: 'json',
        dataType: 'json',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + DEEPSEEK_API_KEY
        },
        data: {
          model: 'deepseek-v4-pro',
          messages: messages,
          thinking: { type: 'enabled' },
          reasoning_effort: 'high',
          stream: false
        },
        timeout: 60000
      }
    );

    const statusCode = res.status || res.statusCode;
    if (statusCode < 200 || statusCode >= 300) {
      const errDetail = typeof res.data === 'object' ? JSON.stringify(res.data) : String(res.data);
      console.error('DeepSeek API HTTP 错误:', statusCode, errDetail);
      return { code: -1, msg: 'DeepSeek API HTTP ' + statusCode, detail: errDetail };
    }

    if (res.data && res.data.choices && res.data.choices[0]) {
      return { code: 0, reply: res.data.choices[0].message.content };
    }

    console.error('DeepSeek API 返回结构异常:', JSON.stringify(res.data));
    return { code: -1, msg: 'DeepSeek API 返回结构异常', detail: JSON.stringify(res.data) };

  } catch (err) {
    console.error('chat_deepseek 捕获异常:', err);
    return { code: 500, msg: err.message || '云函数内部错误', stack: err.stack || '' };
  }
};

function isPlaceholderKey(value) {
  const key = String(value || '');
  return key.includes('请在这里填写') || key.includes('YOUR_');
}
