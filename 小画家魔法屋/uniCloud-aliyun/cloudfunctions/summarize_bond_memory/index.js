'use strict';

let localSecrets = {};
try {
  localSecrets = require('./secrets.local.json');
} catch (error) {
  if (!error || error.code !== 'MODULE_NOT_FOUND') throw error;
}
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || localSecrets.DEEPSEEK_API_KEY;

exports.main = async (event, context) => {
  const { chatHistory } = event;

  if (!chatHistory) {
    return { code: -1, msg: '缺少 chatHistory 参数' };
  }

  const prompt = '请根据以下用户与儿童陪伴角色的聊天记录，总结：\n1. 聊到最多的话题，用不超过4个中文字符回答；\n2. 用户与角色之间出现频率最高、最能代表互动关系的词语，用不超过3个中文字符回答。\n请只返回 JSON：{"topTopic":"xxxx","frequentWord":"xxx"}\n\n如果聊天记录太少，返回：{"topTopic":"暂无","frequentWord":"你好"}\n\n聊天记录：\n' + chatHistory;

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
          messages: [
            { role: 'user', content: prompt }
          ]
        },
        timeout: 30000
      }
    );

    if (res.status !== 200) {
      const errDetail = typeof res.data === 'object' ? JSON.stringify(res.data) : String(res.data);
      console.error('DeepSeek API HTTP 错误:', res.status, errDetail);
      return { code: -1, msg: 'DeepSeek API HTTP ' + res.status, detail: errDetail };
    }

    if (res.data && res.data.choices && res.data.choices[0]) {
      const content = res.data.choices[0].message.content;
      try {
        // 尝试解析 JSON
        const jsonMatch = content.match(/\{[^}]+\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            code: 0,
            topTopic: parsed.topTopic || '暂无',
            frequentWord: parsed.frequentWord || '你好'
          };
        }
      } catch (e) {
        console.error('JSON 解析失败:', e);
      }
      return { code: 0, topTopic: '暂无', frequentWord: '你好' };
    }

    console.error('DeepSeek API 返回结构异常:', JSON.stringify(res.data));
    return { code: -1, msg: 'DeepSeek API 返回结构异常', detail: JSON.stringify(res.data) };

  } catch (err) {
    console.error('summarize_bond_memory 捕获异常:', err);
    return { code: 500, msg: err.message || '云函数内部错误', stack: err.stack || '' };
  }
};
