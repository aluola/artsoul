'use strict';

let localSecrets = {};
try {
  localSecrets = require('./secrets.local.json');
} catch (error) {
  if (!error || error.code !== 'MODULE_NOT_FOUND') throw error;
}
const DOUBAO_API_KEY = process.env.DOUBAO_API_KEY || localSecrets.DOUBAO_API_KEY;

exports.main = async (event, context) => {
  const { base64Image, prompt, mode } = event;

  if (!base64Image) {
    return { code: -1, msg: '缺少 base64Image 参数' };
  }

  const defaultPrompt = '将这幅儿童简笔画转化为一个3D卡通风格的可爱角色，色彩明亮鲜艳，保持原画的造型特征，纯白背景，温暖、有趣、充满想象力';

  // "帮我画"模式：根据孩子当前画布内容补全线稿
  const lineartHelpPrompt = '你是一位儿童绘画线稿老师。请根据孩子当前已经画出的内容，判断孩子可能想画的对象，并在不改变、不覆盖、不移动孩子原有笔画的前提下，只用简洁、清晰、适合儿童临摹的黑白线稿补全画面。请保留孩子原有内容的位置和形状，只在缺失部分补充辅助线稿。不要生成彩色成品图，不要改成复杂写实风格，不要添加过多细节。输出应适合作为儿童继续描画的线稿。';

  // 根据 mode 选择 prompt
  let finalPrompt;
  if (mode === 'lineart_help') {
    finalPrompt = prompt || lineartHelpPrompt;
  } else {
    finalPrompt = prompt || defaultPrompt;
  }

  try {
    // 1. 调用豆包 Seedream 图生图 API
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
          prompt: finalPrompt,
          image: base64Image,
          size: '2K',
          output_format: 'png',
          watermark: false
        },
        timeout: 60000
      }
    );

    // 非 200 时返回完整错误信息
    if (apiRes.status !== 200) {
      const errDetail = typeof apiRes.data === 'object' ? JSON.stringify(apiRes.data) : String(apiRes.data);
      console.error('豆包 API HTTP 错误:', apiRes.status, errDetail);
      return { code: -1, msg: '豆包 API HTTP ' + apiRes.status, detail: errDetail };
    }

    if (!apiRes.data || !apiRes.data.data || !apiRes.data.data[0]) {
      console.error('豆包 API 返回结构异常:', JSON.stringify(apiRes.data));
      return { code: -1, msg: '豆包 API 返回结构异常', detail: JSON.stringify(apiRes.data) };
    }

    const doubaoUrl = apiRes.data.data[0].url;

    // 2. 下载生成的图片为 buffer
    const imgRes = await uniCloud.httpclient.request(doubaoUrl, {
      method: 'GET',
      dataType: 'buffer',
      timeout: 60000
    });

    if (imgRes.status !== 200) {
      return { code: -1, msg: '下载生成图片失败 HTTP ' + imgRes.status };
    }

    // 3. 上传到 uniCloud 云存储，获得永久 fileID
    const cloudPath = 'magic_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8) + '.png';
    const uploadRes = await uniCloud.uploadFile({
      cloudPath: cloudPath,
      fileContent: imgRes.data
    });

    return { code: 0, fileID: uploadRes.fileID };

  } catch (err) {
    console.error('generate_magic_image 捕获异常:', err);
    return { code: 500, msg: err.message || '云函数内部错误', stack: err.stack || '' };
  }
};
