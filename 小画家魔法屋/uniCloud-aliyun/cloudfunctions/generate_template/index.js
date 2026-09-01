'use strict';

let localSecrets = {};
try {
  localSecrets = require('./secrets.local.json');
} catch (error) {
  if (!error || error.code !== 'MODULE_NOT_FOUND') throw error;
}
const DOUBAO_API_KEY = process.env.DOUBAO_API_KEY || localSecrets.DOUBAO_API_KEY;

exports.main = async (event, context) => {
  const { prompt } = event;

  if (!prompt) {
    return { code: -1, message: '缺少 prompt 参数' };
  }

  try {
    // 1. 调用豆包文生图 API
    const apiRes = await uniCloud.httpclient.request(
      'https://ark.cn-beijing.volces.com/api/v3/images/generations',
      {
        method: 'POST',
        contentType: 'json',
        dataType: 'json',
        headers: {
          'Authorization': 'Bearer ' + DOUBAO_API_KEY
        },
        data: {
          model: 'doubao-seedream-5-0-260128',
          prompt: prompt,
          size: '2K',
          output_format: 'png',
          watermark: false
        },
        timeout: 60000
      }
    );

    if (apiRes.status !== 200 || !apiRes.data || !apiRes.data.data || !apiRes.data.data[0]) {
      console.error('豆包 API 返回异常:', JSON.stringify(apiRes.data));
      return { code: -1, message: '线稿生成失败', detail: apiRes.data };
    }

    const doubaoUrl = apiRes.data.data[0].url;

    // 2. 下载生成的图片为 buffer
    const imgRes = await uniCloud.httpclient.request(doubaoUrl, {
      method: 'GET',
      dataType: 'buffer',
      timeout: 60000
    });

    if (imgRes.status !== 200) {
      return { code: -1, message: '下载线稿图片失败，状态码: ' + imgRes.status };
    }

    // 3. 上传到 uniCloud 云存储，获得永久 fileID
    const cloudPath = 'template_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8) + '.png';
    const uploadRes = await uniCloud.uploadFile({
      cloudPath: cloudPath,
      fileContent: imgRes.data
    });

    return { code: 0, fileID: uploadRes.fileID };

  } catch (err) {
    console.error('generate_template 错误:', err);
    return { code: -1, message: err.message || '线稿生成失败' };
  }
};
