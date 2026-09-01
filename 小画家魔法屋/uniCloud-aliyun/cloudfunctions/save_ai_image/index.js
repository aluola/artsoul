'use strict';

exports.main = async (event, context) => {
  const { imageUrl } = event;

  if (!imageUrl) {
    return { code: -1, message: '缺少 imageUrl 参数' };
  }

  try {
    // 服务端下载图片为 buffer，绕过浏览器 CORS 限制
    const res = await uniCloud.httpclient.request(imageUrl, {
      method: 'GET',
      dataType: 'buffer',
      timeout: 60000
    });

    if (res.status !== 200) {
      return { code: -1, message: '下载图片失败，状态码: ' + res.status };
    }

    const cloudPath = 'avatar_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8) + '.png';

    const uploadRes = await uniCloud.uploadFile({
      cloudPath: cloudPath,
      fileContent: res.data
    });

    return { code: 0, fileID: uploadRes.fileID };
  } catch (err) {
    console.error('save_ai_image 错误:', err);
    return { code: -1, message: err.message || '云端保存失败' };
  }
};
