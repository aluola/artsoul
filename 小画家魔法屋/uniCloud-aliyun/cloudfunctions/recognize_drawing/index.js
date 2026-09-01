'use strict';

let localSecrets = {};
try {
  localSecrets = require('./secrets.local.json');
} catch (error) {
  if (!error || error.code !== 'MODULE_NOT_FOUND') throw error;
}
const DOUBAO_VISION_API_KEY = process.env.DOUBAO_VISION_API_KEY || localSecrets.DOUBAO_VISION_API_KEY;
const DOUBAO_VISION_MODEL = 'ep-20260524205907-5g8qs';

exports.main = async (event, context) => {
  const { base64Image, mode } = event;

  if (!base64Image) {
    return { code: -1, msg: '缺少 base64Image 参数' };
  }

  const visionPrompt = mode === 'add_story'
    ? '这是一幅儿童画。请不要只描述物品，而是用充满童话感和想象力的口吻，描述这幅画如何变成了角色的一段神奇经历或故事。比如："小朋友为你画了一把能在雨天飞行的彩虹伞！" 仅输出描述，不要废话。'
    : '你是一个儿童心理学专家。请观察这幅儿童简笔画，识别小朋友画的是什么（如房子、星星、动物等），给它取一个可爱的叠字或拟人化名字，并写一段简短的童话角色介绍。注意：description 字段必须控制在10个中文字符以内，适合放在儿童卡片上展示，例如"可爱的小狮子"、"爱画画的小龙"、"勇敢的小伙伴"，不要生成长句。personality 字段必须简短，只能使用以下格式之一：三个两字词语（如"活泼、勇敢、热心"）；两个三字词语（如"爱冒险、很细心"）；一个两字词语加一个三字词语（如"温柔、爱分享"）；一个两字词语加一个四字词语（如"开朗、充满好奇"）。specialty 字段必须不超过10个中文字符，表示这个小伙伴最特别的能力或特长，例如"会讲笑话"、"爱画星星"、"会找宝藏"。【重要】不要所有角色都使用同一套性格和特长！必须根据孩子画作中的主体（动物/植物/人物/物体）、颜色（暖色/冷色/彩虹色）、形状（圆润/尖锐/飘逸）、表情（开心/害羞/勇敢）、想象内容（太空/海洋/森林/城堡）来生成不同的personality和specialty。禁止固定返回"活泼、友好"和"陪你画画"，每个角色必须有独特个性。必须且只能返回合法的 JSON，不要带有任何 markdown 格式，格式严格为：{"name": "名字", "description": "介绍", "personality": "性格", "specialty": "特长"}';

  try {
    const res = await uniCloud.httpclient.request(
      'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
      {
        method: 'POST',
        contentType: 'json',
        dataType: 'json',
        headers: {
          'Authorization': 'Bearer ' + DOUBAO_VISION_API_KEY
        },
        data: {
          model: DOUBAO_VISION_MODEL,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'image_url', image_url: { url: base64Image } },
                { type: 'text', text: visionPrompt }
              ]
            }
          ]
        },
        timeout: 60000
      }
    );

    if (res.status !== 200) {
      const errDetail = typeof res.data === 'object' ? JSON.stringify(res.data) : String(res.data);
      console.error('视觉 API HTTP 错误:', res.status, errDetail);
      return { code: -1, msg: '视觉 API HTTP ' + res.status, detail: errDetail };
    }

    if (res.data && res.data.choices) {
      const content = res.data.choices[0].message.content;
      return { code: 0, content: content };
    }

    console.error('视觉 API 返回结构异常:', JSON.stringify(res.data));
    return { code: -1, msg: '视觉 API 返回结构异常', detail: JSON.stringify(res.data) };

  } catch (err) {
    console.error('recognize_drawing 捕获异常:', err);
    return { code: 500, msg: err.message || '云函数内部错误', stack: err.stack || '' };
  }
};
