# 本地密钥配置

项目中的云函数按以下顺序读取密钥：

1. 云函数运行环境中的环境变量；
2. 云函数目录下的 `secrets.local.json`。

`secrets.local.json` 已被仓库根目录的 `.gitignore` 忽略，只保存在本机。HBuilderX
本地运行或从本机上传云函数时可继续读取这些文件；在其他部署环境中，请设置对应的环境变量。

使用到的变量如下：

- `DEEPSEEK_API_KEY`
- `DOUBAO_API_KEY`
- `DOUBAO_VISION_API_KEY`
- `VOLC_APPID`
- `VOLC_TOKEN`

`chat_deepseek_vision` 云函数负责聊天图片识别，使用 `DEEPSEEK_API_KEY` 和 `deepseek-v4-flash`。

本地文件示例：

```json
{
  "DOUBAO_API_KEY": "在这里填写本地密钥"
}
```

请勿将真实密钥写入源码、示例文件、提交信息或 Git 历史。
