'use strict';

exports.main = async (event = {}) => {
  const { action, payload = {} } = event;

  if (action === 'add') {
    try {
      const collection = getCollection();
      const { name, description, imageUrl, creatorName, creatorAvatar, personality, specialty } = payload;

      if (!imageUrl) {
        return { code: -1, error: '缺少小伙伴图片' };
      }

      // Generated drawings are already permanent cloud files. Reuse their fileID
      // instead of trying to download a cloud:// URL as ordinary HTTP.
      const imageFileID = await ensureCloudFile(imageUrl);
      const now = Date.now();
      const record = {
        name: String(name || '小伙伴').slice(0, 50),
        description: String(description || '可爱的小伙伴').slice(0, 500),
        imageUrl: imageFileID,
        imageFileID,
        creatorName: String(creatorName || '小朋友').slice(0, 50),
        creatorAvatar: String(creatorAvatar || '').slice(0, 200),
        personality: String(personality || '').slice(0, 100),
        specialty: String(specialty || '').slice(0, 100),
        createdAt: now,
        updatedAt: now
      };

      const addResult = await collection.add(record);
      return { code: 0, success: true, id: addResult.id || addResult._id || null };
    } catch (error) {
      console.error('[square_api] add failed:', error);
      return { code: -1, error: '云端发布失败: ' + (error.message || String(error)) };
    }
  }

  if (action === 'getList') {
    try {
      const result = await getCollection().orderBy('createdAt', 'desc').limit(100).get();
      return {
        code: 0,
        data: Array.isArray(result.data) ? result.data : []
      };
    } catch (error) {
      // A local UniCloud run may not have a Mongo database cell bound yet.
      // Return an empty list so the square page remains usable while the space is configured.
      console.error('[square_api] getList failed:', error);
      return {
        code: 0,
        data: [],
        degraded: true,
        message: '广场数据库暂未配置，当前显示为空列表'
      };
    }
  }

  return { code: -1, error: 'Unknown action' };
};

function getCollection() {
  return uniCloud.database().collection('companion_square');
}

async function ensureCloudFile(imageUrl) {
  const value = String(imageUrl || '').trim();

  if (isCloudFileID(value)) {
    return value;
  }

  let fileContent;
  let extension = '.png';

  if (value.startsWith('data:image/')) {
    const match = value.match(/^data:image\/([a-z0-9.+-]+);base64,(.*)$/is);
    if (!match) throw new Error('图片 Base64 格式无效');
    extension = normalizeExtension(match[1]);
    fileContent = Buffer.from(match[2].replace(/\s/g, ''), 'base64');
  } else if (/^https?:\/\//i.test(value)) {
    const response = await uniCloud.httpclient.request(value, {
      method: 'GET',
      dataType: 'buffer',
      timeout: 60000
    });

    if (response.status < 200 || response.status >= 300) {
      throw new Error('云端下载图片失败，状态码: ' + response.status);
    }

    extension = getExtensionFromUrl(value);
    fileContent = response.data;
  } else {
    throw new Error('图片必须是云文件 ID、HTTP URL 或 Base64 数据');
  }

  if (!fileContent || fileContent.length === 0) {
    throw new Error('图片内容为空');
  }

  const cloudPath = 'companion_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8) + extension;
  const uploadResult = await uniCloud.uploadFile({ cloudPath, fileContent });
  if (!uploadResult || !uploadResult.fileID) {
    throw new Error('云存储未返回 fileID');
  }
  return uploadResult.fileID;
}

function isCloudFileID(value) {
  return value.startsWith('cloud://') || value.startsWith('cloudFiles/') || value.startsWith('fileID:');
}

function normalizeExtension(value) {
  const ext = String(value || '').toLowerCase();
  return ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext) ? '.' + ext : '.png';
}

function getExtensionFromUrl(value) {
  const match = String(value || '').match(/\.(png|jpe?g|webp|gif)(?:[?#].*)?$/i);
  return match ? normalizeExtension(match[1]) : '.png';
}
