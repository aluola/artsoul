'use strict';

let localSecrets = {};
try {
  localSecrets = require('./secrets.local.json');
} catch (error) {
  if (!error || error.code !== 'MODULE_NOT_FOUND') throw error;
}
const DOUBAO_API_KEY = process.env.DOUBAO_API_KEY || localSecrets.DOUBAO_API_KEY;
const API_URL = 'https://ark.cn-beijing.volces.com/api/v3/images/generations';

const MERGE_IMAGE_SIZE = '1920x1920';
const MERGE_IMAGE_SIZE_RETRY = '2048x2048';
const MAX_OVERLOAD_RETRY = 3;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function shortUrl(url) {
  return typeof url === 'string' ? url.slice(0, 120) : url;
}

function parseSizePixels(size) {
  const match = String(size).match(/(\d+)x(\d+)/)
  if (!match) return 0
  return Number(match[1]) * Number(match[2])
}

function isServerOverloadedError(statusCode, data) {
  const str = typeof data === 'string' ? data : JSON.stringify(data || {})
  return statusCode === 429 ||
    str.includes('ServerOverloaded') ||
    str.includes('server overload') ||
    str.includes('unable to handle additional requests')
}

function isSizeInvalidError(data) {
  const str = typeof data === 'string' ? data : JSON.stringify(data || {})
  return str.includes('InvalidParameter') && str.includes('size') && str.includes('3686400')
}

async function requestMergeImage(basePayload, size) {
  const payload = { ...basePayload, size }

  console.log('[merge_story_image] 请求豆包融合', {
    size,
    sizePixels: parseSizePixels(size)
  })

  const res = await uniCloud.httpclient.request(API_URL, {
    method: 'POST',
    data: payload,
    dataType: 'json',
    contentType: 'json',
    headers: { 'Authorization': 'Bearer ' + DOUBAO_API_KEY },
    timeout: 120000
  })

  return res
}

async function requestWithRetry(basePayload) {
  let size = MERGE_IMAGE_SIZE
  let response = null
  let statusCode = null
  let data = null
  const tried = []

  // 处理 429 服务过载：延迟重试同一个 size
  for (let attempt = 0; attempt <= MAX_OVERLOAD_RETRY; attempt++) {
    if (attempt > 0) {
      const delay = Math.pow(2, attempt) * 1000
      console.warn('[merge_story_image] 豆包服务过载，等待后重试', {
        attempt,
        delay,
        size
      })
      await sleep(delay)
    }

    tried.push(`${size}#attempt${attempt + 1}`)
    response = await requestMergeImage(basePayload, size)
    statusCode = response.status || response.statusCode
    data = response.data

    if (!isServerOverloadedError(statusCode, data)) {
      break
    }
  }

  // 如果仍然是 429，返回服务繁忙
  if (isServerOverloadedError(statusCode, data)) {
    return {
      ok: false,
      statusCode,
      data,
      errorType: 'server_overloaded',
      tried
    }
  }

  // 如果是 size 参数错误，改用 2048x2048 重试一次
  if (statusCode >= 400 && isSizeInvalidError(data)) {
    console.warn('[merge_story_image] size 参数不符合要求，自动改用 2048x2048 重试', {
      firstSize: MERGE_IMAGE_SIZE,
      retrySize: MERGE_IMAGE_SIZE_RETRY,
      error: data
    })

    size = MERGE_IMAGE_SIZE_RETRY
    tried.push(size)
    response = await requestMergeImage(basePayload, size)
    statusCode = response.status || response.statusCode
    data = response.data

    if (isServerOverloadedError(statusCode, data)) {
      return {
        ok: false,
        statusCode,
        data,
        errorType: 'server_overloaded',
        tried
      }
    }
  }

  // 其他 HTTP 错误
  if (statusCode < 200 || statusCode >= 300) {
    return {
      ok: false,
      statusCode,
      data,
      errorType: 'http_error',
      tried
    }
  }

  return {
    ok: true,
    statusCode,
    data,
    tried
  }
}

exports.main = async (event, context) => {
  const { characterImage, storyItemImage, characterName, storyType, taskText } = event;

  if (!characterImage || !storyItemImage) {
    return { code: -1, msg: '缺少 characterImage 或 storyItemImage 参数' };
  }

  console.log('[merge_story_image] 融合请求开始', {
    characterName,
    storyType,
    taskText,
    size: MERGE_IMAGE_SIZE,
    hasCharacterImage: !!characterImage,
    hasStoryItemImage: !!storyItemImage,
    characterImage: shortUrl(characterImage),
    storyItemImage: shortUrl(storyItemImage)
  })

  const prompt = '你是一位儿童绘画角色融合设计师。现在有两张图：第一张是孩子创作的小伙伴角色，第二张是孩子为这个小伙伴画的故事物品或场景。请把第二张图中的故事物品自然融合到第一张角色身上或身边，生成一张新的小伙伴角色图。必须保持原小伙伴的主体身份、颜色特征、可爱风格和儿童手工黏土质感，不要把故事物品单独变成一个新角色。融合要符合任务：' + (taskText || '画一个故事') + '。例如任务是会飞的书包，就生成背着会飞书包的小伙伴；任务是糖果，就生成拥有糖果或吃糖果的小伙伴；任务是房子，就生成站在自己新房子旁边的小伙伴。输出单张完整图片，适合儿童 App 头像展示，背景简洁干净。';

  try {
    // 将两张图片转换为 base64
    const [charBuffer, storyBuffer] = await Promise.all([
      downloadImage(characterImage),
      downloadImage(storyItemImage)
    ]);

    const charBase64 = 'data:image/png;base64,' + charBuffer.toString('base64');
    const storyBase64 = 'data:image/png;base64,' + storyBuffer.toString('base64');

    const basePayload = {
      model: 'doubao-seedream-5-0-260128',
      prompt: prompt,
      image: charBase64,
      ref_image: storyBase64,
      output_format: 'png',
      watermark: false
    };

    // 带重试的请求
    const result = await requestWithRetry(basePayload)

    // 服务过载
    if (!result.ok && result.errorType === 'server_overloaded') {
      console.error('[merge_story_image] 融合最终失败：服务过载', {
        statusCode: result.statusCode,
        tried: result.tried,
        data: result.data
      })
      return {
        code: -1,
        msg: '豆包融合服务繁忙，请稍后再试',
        detail: JSON.stringify(result.data),
        debug: {
          stage: 'doubao_merge_server_overloaded',
          statusCode: result.statusCode,
          tried: result.tried,
          hint: '豆包融合接口当前过载，不是图片参数错误。请稍后重试，或减少连续融合请求。'
        }
      }
    }

    // size 参数错误
    if (!result.ok && result.errorType === 'http_error' && isSizeInvalidError(result.data)) {
      console.error('[merge_story_image] 融合最终失败：size 参数错误', {
        statusCode: result.statusCode,
        tried: result.tried,
        data: result.data
      })
      return {
        code: -1,
        msg: '融合参数错误',
        detail: JSON.stringify(result.data),
        debug: {
          stage: 'doubao_merge_size_error',
          statusCode: result.statusCode,
          tried: result.tried,
          hint: '豆包融合接口要求 size 至少 3686400 像素，请检查 size 是否为 1920x1920 或更大'
        }
      }
    }

    // 其他 HTTP 错误
    if (!result.ok) {
      const errDetail = typeof result.data === 'object' ? JSON.stringify(result.data) : String(result.data);
      console.error('[merge_story_image] 融合最终失败：HTTP 错误', {
        statusCode: result.statusCode,
        tried: result.tried,
        data: result.data
      })
      return {
        code: -1,
        msg: '融合 API HTTP ' + result.statusCode,
        detail: errDetail,
        debug: {
          stage: 'doubao_merge_http_error',
          statusCode: result.statusCode,
          tried: result.tried,
          hint: '豆包融合接口请求失败，请检查 API Key、请求体、图片 URL 或模型参数'
        }
      };
    }

    // API 返回错误
    const data = result.data
    if (data && data.error) {
      console.error('[merge_story_image] 豆包 API 错误:', data.error);
      return {
        code: -1,
        msg: data.error.message || '融合接口返回错误',
        detail: JSON.stringify(data.error),
        debug: {
          stage: 'doubao_api_error',
          statusCode: result.statusCode,
          tried: result.tried
        }
      };
    }

    // 返回结构异常
    if (!data || !data.data || !data.data[0]) {
      console.error('[merge_story_image] 豆包 API 返回结构异常:', JSON.stringify(data));
      return { code: -1, msg: '融合 API 返回结构异常' };
    }

    // 成功
    const fusedImageUrl = data.data[0].url;
    console.log('[merge_story_image] 豆包融合成功', { fusedImageUrl: shortUrl(fusedImageUrl) })

    // 下载融合后的图片并上传到云存储
    const fusedBuffer = await downloadImage(fusedImageUrl);
    const cloudPath = 'story_fused_' + Date.now() + '.png';

    const uploadResult = await uniCloud.uploadFile({
      cloudPath: cloudPath,
      fileContent: fusedBuffer
    });

    console.log('[merge_story_image] 融合完成', { fileID: uploadResult.fileID })

    return {
      code: 0,
      fileID: uploadResult.fileID,
      imageUrl: fusedImageUrl
    };

  } catch (err) {
    console.error('[merge_story_image] 捕获异常:', err);
    return {
      code: -1,
      msg: err.message || '融合云函数内部错误',
      debug: {
        stage: 'exception',
        error: err.message
      }
    };
  }
};

/** 下载图片为 Buffer */
async function downloadImage(url) {
  const res = await uniCloud.httpclient.request(url, {
    method: 'GET',
    dataType: 'buffer',
    timeout: 60000
  });

  if (res.status !== 200) {
    throw new Error('下载图片失败，状态码: ' + res.status);
  }

  return res.data;
}
