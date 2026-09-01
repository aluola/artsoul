'use strict';

// Keep the existing cloud-function name so deployed callers do not need to change.
// The implementation now uses DeepSeek's OpenAI-compatible multimodal endpoint.
let localSecrets = {};
try {
  localSecrets = require('./secrets.local.json');
} catch (error) {
  if (!error || error.code !== 'MODULE_NOT_FOUND') throw error;
}

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || localSecrets.DEEPSEEK_API_KEY;
const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
const MODEL = 'deepseek-v4-flash';

exports.main = async (event = {}) => {
  try {
    if (!DEEPSEEK_API_KEY || isPlaceholderKey(DEEPSEEK_API_KEY)) {
      return fail('config', 'DEEPSEEK_API_KEY 未配置');
    }

    const {
      character = {},
      text = '',
      imageBase64 = '',
      mimeType = 'image/jpeg',
      images = []
    } = event;

    const imageList = Array.isArray(images) && images.length > 0
      ? images
      : imageBase64
        ? [{ base64: imageBase64, mimeType }]
        : [];

    if (imageList.length === 0) return fail('validate', '缺少图片数据');
    if (imageList.length > 10) return fail('validate', '最多只能识别10张图片');
    if (!String(text).trim()) return fail('validate', '缺少 text');

    for (let i = 0; i < imageList.length; i++) {
      if (!imageList[i] || !String(imageList[i].base64 || '').trim()) {
        return fail('validate', `第${i + 1}张图片 base64 为空`);
      }
    }

    const imageContents = imageList.map((image) => ({
      type: 'image_url',
      image_url: {
        url: toDataUrl(image.base64, image.mimeType || 'image/jpeg')
      }
    }));

    const payload = {
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: buildSystemPrompt(character, imageList.length)
        },
        {
          role: 'user',
          content: [
            ...imageContents,
            { type: 'text', text: String(text).trim() }
          ]
        }
      ],
      thinking: { type: 'enabled' },
      reasoning_effort: 'high',
      stream: false,
      max_tokens: 1024
    };

    const response = await uniCloud.httpclient.request(DEEPSEEK_URL, {
      method: 'POST',
      contentType: 'json',
      dataType: 'json',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + DEEPSEEK_API_KEY
      },
      data: payload,
      timeout: 60000
    });

    const statusCode = response.status || response.statusCode;
    const data = response.data;

    if (statusCode < 200 || statusCode >= 300) {
      console.error('[DeepSeek Vision HTTP Error]', { statusCode, data });
      return fail('http', 'DeepSeek 识图接口 HTTP 状态异常', statusCode, data);
    }

    if (data && data.error) {
      console.error('[DeepSeek Vision API Error]', data.error);
      return fail('api', data.error.message || 'DeepSeek 识图接口返回错误', statusCode, data);
    }

    const replyText = extractReplyText(data);
    if (!replyText) {
      console.error('[DeepSeek Vision Empty Reply]', data);
      return fail('parse', '未解析到识图回复内容', statusCode, data);
    }

    return {
      success: true,
      reply: replyText,
      model: MODEL
    };
  } catch (error) {
    console.error('[DeepSeek Vision Exception]', error);
    return fail('exception', error.message || String(error));
  }
};

function buildSystemPrompt(character, imageCount) {
  const name = character.name || character.character_name || '小伙伴';
  const description = character.description || character.greeting || '一个神奇的小精灵';
  const personality = character.personality || character.personality_type || '温柔、友好';
  const specialty = character.specialty || character.talent || character.skill || '陪你画画';
  const photoText = imageCount > 1 ? '一张或多张照片' : '一张照片';

  return [
    '你正在扮演一个儿童绘画陪伴小伙伴。',
    `你的名字是${name}，描述是：${description}，性格是：${personality}，特长是：${specialty}。`,
    `现在孩子给你发来${photoText}，并配了一句话。请综合理解图片内容和文字，再以这个小伙伴的身份回复孩子。`,
    '回复要求：使用温暖、童趣、鼓励的语气；适合3-8岁儿童阅读；不超过80个中文字符；可以描述你看到的内容，也可以鼓励孩子继续画画、讲故事或表达想法；不要提及自己是AI；不要输出危险、恐怖、成人化或不适合儿童的内容。'
  ].join('\n');
}

function toDataUrl(base64, mimeType) {
  const value = String(base64 || '').trim();
  if (value.startsWith('data:')) return value;

  const safeMimeType = /^image\/[a-z0-9.+-]+$/i.test(String(mimeType || ''))
    ? String(mimeType)
    : 'image/jpeg';
  return `data:${safeMimeType};base64,${value.replace(/\s/g, '')}`;
}

function extractReplyText(data) {
  const content = data && data.choices && data.choices[0] && data.choices[0].message
    ? data.choices[0].message.content
    : '';

  if (typeof content === 'string') return content.trim();
  if (Array.isArray(content)) {
    return content
      .filter((part) => part && (part.type === 'text' || typeof part.text === 'string'))
      .map((part) => part.text || '')
      .join('')
      .trim();
  }

  return '';
}

function isPlaceholderKey(value) {
  return String(value).includes('请在这里填写') || String(value).includes('YOUR_');
}

function fail(stage, message, statusCode, rawResponse) {
  return {
    success: false,
    error: 'DeepSeek 识图接口调用失败，请检查 API Key、模型名、请求地址或图片格式',
    debug: {
      stage,
      statusCode: statusCode || null,
      message,
      rawResponse: rawResponse || null
    }
  };
}
