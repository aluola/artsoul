'use strict';

let localSecrets = {};
try {
  localSecrets = require('./secrets.local.json');
} catch (error) {
  if (!error || error.code !== 'MODULE_NOT_FOUND') throw error;
}
const VOLC_APPID = process.env.VOLC_APPID || localSecrets.VOLC_APPID;
const VOLC_TOKEN = process.env.VOLC_TOKEN || localSecrets.VOLC_TOKEN;
const VOICE_TYPE = 'BV051_streaming';

exports.main = async (event, context) => {
  const { text } = event;

  if (!text) {
    return { code: -1, msg: '缺少 text 参数' };
  }

  try {
    const res = await uniCloud.httpclient.request(
      'https://openspeech.bytedance.com/api/v1/tts',
      {
        method: 'POST',
        contentType: 'json',
        dataType: 'json',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer;' + VOLC_TOKEN
        },
        data: {
          app: { appid: VOLC_APPID, token: VOLC_TOKEN, cluster: 'volcano_tts' },
          user: { uid: 'user_' + Date.now() },
          audio: { voice_type: VOICE_TYPE, encoding: 'mp3', speed_ratio: 1.0 },
          request: { reqid: Date.now().toString(), text: text, text_type: 'plain', operation: 'query' }
        },
        timeout: 60000
      }
    );

    if (res.status !== 200) {
      const errDetail = typeof res.data === 'object' ? JSON.stringify(res.data) : String(res.data);
      console.error('TTS API HTTP 错误:', res.status, errDetail);
      return { code: -1, msg: 'TTS API HTTP ' + res.status, detail: errDetail };
    }

    if (res.data && res.data.code === 3000 && res.data.data) {
      return { code: 0, audioBase64: res.data.data };
    }

    console.error('TTS API 返回异常:', JSON.stringify(res.data));
    return { code: -1, msg: 'TTS API 返回异常: code=' + (res.data ? res.data.code : 'unknown'), detail: JSON.stringify(res.data) };

  } catch (err) {
    console.error('generate_tts 捕获异常:', err);
    return { code: 500, msg: err.message || '云函数内部错误', stack: err.stack || '' };
  }
};
