<template>
	<view class="chat-page">
		<!-- 背景图片 -->
		<image class="page-bg" src="/static/ui/chat/chat-bg.png" mode="aspectFill" />

		<!-- 左上角保存并退出 -->
		<image
			class="save-exit-btn"
			src="/static/ui/chat/btn-save-exit.png"
			mode="widthFix"
			@tap="handleSaveExit"
		/>

		<!-- 右上角好感度入口 -->
		<image
			v-if="showBondEntry"
			class="bond-entry-btn"
			src="/static/ui/bond/btn-bond-entry.png"
			mode="widthFix"
			@tap="goBond"
		/>

		<!-- 左侧小伙伴详情面板 -->
		<view class="left-panel">
			<image
				class="detail-title"
				src="/static/ui/chat/title-companion-detail.png"
				mode="widthFix"
				@tap="speakDetailTitle"
			/>

			<view class="companion-card">
				<image class="card-bg" src="/static/ui/chat/companion-card-empty.png" mode="scaleToFill" />

				<view class="card-content">
					<!-- 小伙伴名称 -->
					<view class="card-name-tag">
						<text class="card-name">{{ getCharacterName() }}</text>
					</view>

					<!-- 小伙伴图片 -->
					<image class="card-image" :src="getCharacterImage()" mode="aspectFit" />

					<!-- 小伙伴描述 -->
					<text class="card-desc">{{ getCharacterDesc() }}</text>

					<!-- 信息行 -->
					<view class="info-lines">
						<text class="info-line">{{ getCharacterName() }}</text>
						<text class="info-line">{{ getCharacterDesc() }}</text>
						<text class="info-line">{{ getCharacterPersonality() }}</text>
						<text class="info-line">{{ getCharacterTalent() }}</text>
					</view>
				</view>
			</view>

			<!-- 创建个人故事按钮 -->
			<image
				v-if="showCreateStory"
				class="create-story-btn"
				src="/static/ui/chat/btn-create-story.png"
				mode="widthFix"
				@tap="goToDrawStory"
			/>
		</view>

		<!-- 右侧聊天消息区域 -->
		<view class="chat-panel">
			<scroll-view
				class="message-scroll"
				scroll-y
				:scroll-into-view="scrollTarget"
				scroll-with-animation
			>
				<view class="message-list">
					<template v-for="(msg, idx) in messages" :key="idx">
						<view
							v-if="!msg.isHidden"
							v-show="msg.role !== 'system'"
							:id="'msg-' + msg.id"
							class="message-row"
							:class="msg.role === 'assistant' ? 'msg-left' : 'msg-right'"
						>
							<!-- 小伙伴头像 -->
							<image
								v-if="msg.role === 'assistant' && companion"
								class="msg-avatar avatar-ai"
								:src="getCharacterImage()"
								mode="aspectFill"
							/>

							<!-- 消息内容 -->
							<view class="msg-content">
								<!-- 气泡 -->
								<view class="msg-bubble" :class="msg.role === 'assistant' ? 'bubble-ai' : 'bubble-user'">
									<view v-if="msg.images && msg.images.length" class="message-images">
										<image
											v-for="(img, imgIndex) in msg.images"
											:key="imgIndex"
											class="message-image"
											:src="img"
											mode="aspectFill"
										/>
									</view>
									<image v-else-if="msg.image" :src="msg.image" mode="aspectFill" class="message-image" />
									<image v-if="msg.imageUrl" :src="msg.imageUrl" mode="widthFix" class="gift-image" />
									<text class="msg-text">{{ msg.content }}</text>
									<view v-if="msg.role === 'assistant'" class="play-btn" @tap="playVoice(msg)">
										<text class="play-icon">{{ playingMessageId === msg.id ? '⏸️' : '🔊' }}</text>
									</view>
								</view>
								<!-- 时间 -->
								<text class="msg-time" :class="msg.role === 'assistant' ? 'time-left' : 'time-right'">
									{{ formatMessageTime(msg.created_at || msg.createdAt || msg.time || msg.timestamp) }}
								</text>
							</view>
						</view>
					</template>

					<!-- 加载中 -->
					<view v-if="isLoading" class="message-row msg-left">
						<image v-if="companion" class="msg-avatar avatar-ai" :src="getCharacterImage()" mode="aspectFill" />
						<view class="msg-content">
							<view class="msg-bubble bubble-ai">
								<text class="msg-text loading-dots">思考中...</text>
							</view>
						</view>
					</view>

					<view class="scroll-bottom-pad"></view>
				</view>
			</scroll-view>
		</view>

		<!-- 底部输入工具栏（语音模式） -->
		<view class="voice-toolbar" v-show="isVoiceMode">
			<image class="toolbar-bg" src="/static/ui/chat/input-toolbar-bg.png" mode="scaleToFill" />
			<image class="keyboard-btn" src="/static/ui/chat/icon-keyboard.png" mode="widthFix" @tap="toggleInputMode" />
			<view
				class="mic-btn"
				:class="{ recording: isRecording }"
				@touchstart.prevent="startRecord"
				@touchend="stopRecord"
				@touchcancel="stopRecord"
				@mousedown="startRecord"
				@mouseup="stopRecord"
				@mouseleave="stopRecord"
			>
				<image class="mic-img" src="/static/ui/chat/icon-mic.png" mode="widthFix" />
			</view>
			<image class="camera-btn" src="/static/ui/chat/icon-camera.png" mode="widthFix" @tap="handleCamera" />
		</view>

		<!-- 待发送附件区域 -->
		<scroll-view
			v-if="pendingImages.length"
			class="pending-attachment"
			scroll-x
			:show-scrollbar="false"
		>
			<view class="pending-image-list">
				<view
					v-for="(img, index) in pendingImages"
					:key="index"
					class="pending-image-item"
				>
					<image class="pending-image" :src="img.tempFilePath" mode="aspectFill" />
					<view class="pending-remove" @tap.stop="removePendingImage(index)">×</view>
				</view>
			</view>
		</scroll-view>

		<!-- 底部文字输入栏 -->
		<view class="text-input-area" v-show="!isVoiceMode">
			<image class="small-tool-btn small-mic-btn" src="/static/ui/chat/icon-mic.png" mode="widthFix" @tap="toggleInputMode" />
			<image class="small-tool-btn small-camera-btn" src="/static/ui/chat/icon-camera.png" mode="widthFix" @tap="handleCamera" />
			<view class="input-box">
				<input
					class="text-input"
					v-model="inputText"
					placeholder="和小伙伴说点什么..."
					:disabled="isLoading"
					@confirm="sendMessage"
					confirm-type="send"
				/>
			</view>
			<view
				class="send-btn"
				:class="{ disabled: !(inputText || '').trim() || isLoading }"
				@tap="sendMessage"
			>
				<text class="send-text">发送</text>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, nextTick, computed } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'

// ======================== 语音交互配置 ========================
const innerAudioContext = uni.createInnerAudioContext()
let recorderManager = null
// #ifndef H5
recorderManager = uni.getRecorderManager()
// #endif

const isVoiceMode = ref(true)
const isRecording = ref(false)
const playingMessageId = ref(null)

const companion = ref(null)
const messages = ref([])
const inputText = ref('')
const isLoading = ref(false)
const scrollTarget = ref('')
const companionId = ref('')
const sourceFrom = ref('')
const adventureTaskId = ref('')
const userProfile = ref({ nickname: '小朋友', avatar: '👦' })

// 图片识图相关状态
const pendingImages = ref([])
const isSendingVision = ref(false)
const hasPendingImages = computed(() => pendingImages.value.length > 0)

// ======================== 计算属性 ========================
const showCreateStory = computed(() => {
	if (sourceFrom.value === 'square') return false
	return true
})

// 好感度入口显示逻辑：从广场进入或非自己的小伙伴时隐藏
const showBondEntry = computed(() => {
	if (sourceFrom.value === 'square') return false
	// 检查是否是自己的小伙伴（存在于本地列表）
	if (companionId.value) {
		const list = uni.getStorageSync('companions') || []
		const found = list.find(item => item.id === companionId.value)
		if (!found) return false
	}
	return true
})

// ======================== 每日好习惯任务 ========================
const goodHabits = [
	'今天按时认真刷牙',
	'自己整理一次玩具',
	'吃饭时多吃两口蔬菜',
	'对爸爸妈妈大声说一句我爱你',
	'今天早早地上床睡觉',
	'自己乖乖穿好衣服和鞋子',
	'吃饭前认真洗小手',
	'玩完玩具后放回原位',
	'睡觉前把明天要穿的衣服放好',
	'喝一杯温温的白开水',
	'今天自己叠一次小被子',
	'看完绘本后把书放回书架',
	'对帮助你的人说一声谢谢',
	'出门前检查自己的小水杯',
	'今天少吃一点糖果',
	'吃饭时不边玩边吃',
	'和小朋友分享一次玩具',
	'今天主动和家人打招呼',
	'回家后把鞋子摆整齐',
	'画画后把画笔收好',
	'今天帮爸爸妈妈拿一次小东西',
	'睡觉前和玩具说晚安',
	'今天认真洗一次脸',
	'饭后记得漱漱口',
	'今天不乱扔小纸屑',
	'出门前自己戴好小帽子',
	'今天勇敢说出自己的想法',
	'遇到困难时先试一试',
	'今天安静听别人说完话',
	'排队时不推不挤',
	'今天把小椅子摆回原位',
	'吃水果前记得洗干净',
	'今天对自己说一句我真棒',
	'玩游戏到时间就休息一下',
	'看屏幕久了记得看看远处',
	'今天认真擦一次小桌子',
	'把脱下来的衣服放进篮子里',
	'今天轻轻关门不大声摔门',
	'和家人一起收拾一次餐桌',
	'今天主动说一句对不起',
	'今天学会等待一小会儿',
	'睡前把小枕头摆舒服',
	'今天给自己的画起个名字',
	'今天夸一夸身边的人',
	'用完东西记得物归原处',
	'今天认真洗一次小袜子',
	'吃饭时尝一口新的食物',
	'今天保护好自己的小眼睛',
	'今天把垃圾丢进垃圾桶',
	'睡前和爸爸妈妈说晚安'
]

/** 字符串哈希函数 */
function hashString(str) {
	let hash = 0
	const text = String(str || '')
	for (let i = 0; i < text.length; i++) {
		hash = ((hash << 5) - hash) + text.charCodeAt(i)
		hash |= 0
	}
	return Math.abs(hash)
}

/** 获取今日日期字符串 */
function getTodayKey() {
	const now = new Date()
	return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
}

/** 根据小伙伴ID和日期获取每日好习惯 */
function getDailyHabit(characterId) {
	const key = `${characterId || 'default'}-${getTodayKey()}`
	const index = hashString(key) % goodHabits.length
	console.log('[每日好习惯]', { characterId, index, habit: goodHabits[index] })
	return goodHabits[index]
}

/** 兼容旧的 getTodayTask 调用 */
function getTodayTask() {
	return getDailyHabit(companionId.value)
}

// ======================== 角色字段兼容 ========================
function getCharacterName() {
	if (!companion.value) return '小伙伴'
	return companion.value.name || companion.value.character_name || '小伙伴'
}

function getCharacterImage() {
	if (!companion.value) return ''
	return companion.value.drawing_url || companion.value.image_url || companion.value.avatar || companion.value.image || companion.value.drawingUrl || companion.value.imageUrl || companion.value.imageFileID || ''
}

function getCharacterDesc() {
	if (!companion.value) return '可爱的小伙伴'
	const text = companion.value.description || companion.value.greeting || '可爱的小伙伴'
	return text.length > 10 ? text.slice(0, 10) : text
}

function getCharacterPersonality() {
	if (!companion.value) return '温柔、爱冒险、喜欢星座'
	const text = companion.value.personality || companion.value.personality_type || '温柔、爱冒险、喜欢星座'
	return text.length > 12 ? text.slice(0, 12) : text
}

function getCharacterTalent() {
	if (!companion.value) return '最喜欢听你讲故事'
	const text = companion.value.specialty || companion.value.talent || companion.value.skill || '最喜欢听你讲故事'
	return text.length > 10 ? text.slice(0, 10) : text
}

// ======================== 语音播报 ========================
function speak(text) {
	// #ifdef H5
	if (typeof window !== 'undefined' && window.speechSynthesis) {
		window.speechSynthesis.cancel()
		const utterance = new SpeechSynthesisUtterance(text)
		utterance.lang = 'zh-CN'
		utterance.rate = 0.9
		utterance.pitch = 1.1
		utterance.volume = 1
		window.speechSynthesis.speak(utterance)
		return
	}
	// #endif
	uni.showToast({ title: text, icon: 'none', duration: 2000 })
}

function speakDetailTitle() {
	speak('小伙伴详情，选择你的小伙伴，跟他们对话吧')
}

// ======================== 消息时间格式化 ========================
function formatMessageTime(time) {
	if (!time) return '刚刚'

	const now = new Date()
	const msgDate = new Date(time)
	const diffMs = now.getTime() - msgDate.getTime()
	const diffMin = Math.floor(diffMs / 60000)
	const diffHour = Math.floor(diffMs / 3600000)

	if (diffMin < 1) return '刚刚'
	if (diffMin < 60) return diffMin + '分钟前'
	if (diffHour < 24) return diffHour + '小时前'

	const year = msgDate.getFullYear()
	const month = msgDate.getMonth() + 1
	const day = msgDate.getDate()
	const hour = String(msgDate.getHours()).padStart(2, '0')
	const minute = String(msgDate.getMinutes()).padStart(2, '0')
	return year + '年' + month + '月' + day + '日 ' + hour + ':' + minute
}

// ======================== 数据加载 ========================
function loadData(id) {
	companionId.value = id

	const profile = uni.getStorageSync('userProfile')
	if (profile) {
		userProfile.value = profile
	}

	const list = uni.getStorageSync('companions') || []
	let found = list.find(item => item.id === id)

	// 如果本地列表找不到，尝试从缓存读取
	if (!found) {
		const cached = uni.getStorageSync('huaban_current_chat_character')
		if (cached && (cached.id === id || cached._id === id || cached.character_id === id)) {
			found = cached
		}
	}

	if (!found) {
		uni.showToast({ title: '找不到这个小伙伴', icon: 'none' })
		return
	}
	companion.value = found
	messages.value = found.messages || []

	// 兼容处理：如果只有一条旧的"刷牙"欢迎语，替换为新的好习惯
	if (shouldReplaceOldHabitGreeting(messages.value)) {
		const dailyHabit = getDailyHabit(id)
		messages.value[0].content = messages.value[0].content.replace('今天按时认真刷牙', dailyHabit)
		saveMessages()
	}

	if (messages.value.length === 0) {
		greet()
	}
}

/** 检查是否需要替换旧的好习惯欢迎语 */
function shouldReplaceOldHabitGreeting(msgs) {
	if (!msgs || msgs.length !== 1) return false
	const first = msgs[0]
	if (first.role !== 'assistant') return false
	return String(first.content || '').includes('今天按时认真刷牙')
}

// ======================== DeepSeek 聊天 ========================
async function greet() {
	if (!companion.value) return
	isLoading.value = true

	try {
		const name = getCharacterName()
		const desc = companion.value.description || '一个神奇的小精灵'
		const personality = companion.value.personality || companion.value.personality_type || '温柔、爱冒险、喜欢星座'
		const specialty = companion.value.specialty || companion.value.talent || companion.value.skill || '最喜欢听你讲故事'

		let greetPrompt = ''
		if (companion.value.creatorName) {
			greetPrompt = '你是一个神奇画板里诞生的小精灵，你叫【' + name + '】，你的设定是：【' + desc + '】，你的性格是：【' + personality + '】，你的特长是：【' + specialty + '】。你是被另一个叫【' + companion.value.creatorName + '】的小朋友画出来的！现在，正在和你聊天的是新朋友【' + userProfile.value.nickname + '】。请用符合你设定的口吻跟新朋友热情地打个招呼，并自豪地提起创造你的小朋友！（限50字以内）'
		} else {
			greetPrompt = '你是一个神奇画板里诞生的小精灵，你叫【' + name + '】，你的设定是：【' + desc + '】，你的性格是：【' + personality + '】，你的特长是：【' + specialty + '】。这是小朋友（名字叫：' + userProfile.value.nickname + '）创造了你。请完全沉浸在这个角色中，牢记你的名字和设定，用符合该性格的童趣口吻跟' + userProfile.value.nickname + '打个第一句招呼（限50字以内）。在以后的每一次对话中，都不能忘记你是谁！'
		}

		const todayTask = getTodayTask()
		greetPrompt += '【重要任务指令】：今天的专属好习惯任务是"' + todayTask + '"。请你在打招呼中，用符合你设定的可爱口吻，自然地鼓励' + userProfile.value.nickname + '去完成这个任务！如果小朋友说完成了，请狠狠地夸奖他！'

		const res = await uniCloud.callFunction({
			name: 'chat_deepseek',
			data: { messages: [{ role: 'user', content: greetPrompt }] },
			timeout: 60000
		})

		if (res.result && res.result.code === 0) {
			addMessage('user', greetPrompt, true, true)
			addMessage('assistant', res.result.reply)
		} else {
			addMessage('user', greetPrompt, true, true)
			addMessage('assistant', '你好呀！我是' + name + '，很高兴认识你～')
		}
	} catch (err) {
		console.error('打招呼失败:', err)
		const name = getCharacterName()
		addMessage('user', '你叫' + name + '，请跟' + userProfile.value.nickname + '打招呼。', true, true)
		addMessage('assistant', '你好呀！我是' + name + '，很高兴认识你～')
	} finally {
		isLoading.value = false
	}
}

async function fetchAIResponse() {
	if (isLoading.value) return
	isLoading.value = true

	try {
		const todayTask = getTodayTask()
		const name = getCharacterName()
		const desc = companion.value ? companion.value.description : ''
		const personality = companion.value ? (companion.value.personality || companion.value.personality_type || '温柔、爱冒险、喜欢星座') : '温柔、爱冒险、喜欢星座'
		const specialty = companion.value ? (companion.value.specialty || companion.value.talent || companion.value.skill || '最喜欢听你讲故事') : '最喜欢听你讲故事'

		const contextMessages = [
			{
				role: 'system',
				content: '你正在扮演一个儿童绘画陪伴小伙伴。你的名字是' + name + '，描述是' + desc + '，性格是' + personality + '，特长是' + specialty + '。你必须始终按照这个性格和特长说话，语气亲切、温暖、童趣，适合3-8岁儿童。回答要简短、鼓励孩子表达和创作，不要偏离角色设定。小朋友叫' + userProfile.value.nickname + '。每次回复控制在50字以内。【重要任务指令】：今天的专属好习惯任务是"' + todayTask + '"。请在聊天中自然地鼓励小朋友去完成这个任务！如果小朋友说完成了，请狠狠地夸奖他！'
			}
		]

		const apiMessages = messages.value.map(m => ({
			role: m.role,
			content: m.content
		}))
		for (let i = 0; i < apiMessages.length; i++) {
			contextMessages.push(apiMessages[i])
		}

		const res = await uniCloud.callFunction({
			name: 'chat_deepseek',
			data: { messages: contextMessages },
			timeout: 60000
		})

		if (res.result && res.result.code === 0) {
			addMessage('assistant', res.result.reply)
		} else {
			addMessage('assistant', '哎呀，我有点没听清，你能再说一遍吗？')
		}
	} catch (err) {
		console.error('聊天失败:', err)
		addMessage('assistant', '哎呀，我有点没听清，你能再说一遍吗？')
	} finally {
		isLoading.value = false
	}
}

// 标记是否已完成冒险对话任务
let adventureTaskCompleted = false

async function sendMessage() {
	const text = inputText.value.trim()

	// 有图片时走识图逻辑
	if (pendingImages.value.length > 0) {
		if (!text) {
			uni.showToast({ title: '给照片加一句描述吧～', icon: 'none' })
			return
		}
		inputText.value = ''
		await sendImageMessageWithText(text)
		return
	}

	// 没有图片时走原有文本聊天逻辑
	if (!text || isLoading.value) return

	inputText.value = ''
	addMessage('user', text)

	// 记录好感度消息计数
	if (companionId.value) {
		const counts = uni.getStorageSync('huaban_bond_message_counts') || {}
		counts[companionId.value] = (counts[companionId.value] || 0) + 1
		uni.setStorageSync('huaban_bond_message_counts', counts)
	}

	// 完成冒险对话任务（只在第一次发送消息时触发）
	if (adventureTaskId.value && companionId.value && !adventureTaskCompleted) {
		adventureTaskCompleted = true
		completeAdventureChatTask(companionId.value, adventureTaskId.value)
	}

	await fetchAIResponse()
}

/** 完成冒险对话任务 */
function completeAdventureChatTask(characterId, taskId) {
	const state = uni.getStorageSync('huaban_adventure_state') || {}
	if (!state.inviteCompleted) state.inviteCompleted = {}
	if (!state.inviteCompleted[characterId]) state.inviteCompleted[characterId] = []
	if (!state.inviteCompleted[characterId].includes(taskId)) {
		state.inviteCompleted[characterId].push(taskId)
		uni.setStorageSync('huaban_adventure_state', state)

		// 增加好感度计数
		const counts = uni.getStorageSync('huaban_story_counts_by_character') || {}
		counts[characterId] = (counts[characterId] || 0) + 1
		uni.setStorageSync('huaban_story_counts_by_character', counts)
	}
}

function addMessage(role, content, silent, isHidden, image, images) {
	const msg = {
		id: Date.now().toString() + '_' + Math.random().toString(36).slice(2, 6),
		role,
		content,
		isHidden: !!isHidden,
		created_at: Date.now()
	}
	if (images && images.length > 0) {
		msg.images = images
		msg.image = images[0]
	} else if (image) {
		msg.image = image
	}
	messages.value.push(msg)
	saveMessages()
	if (!silent) {
		scrollToBottom()
	}
}

function saveMessages() {
	if (!companionId.value) return
	const list = uni.getStorageSync('companions') || []
	const idx = list.findIndex(item => item.id === companionId.value)
	if (idx !== -1) {
		list[idx].messages = messages.value
		uni.setStorageSync('companions', list)
	}
}

function scrollToBottom() {
	setTimeout(() => {
		if (messages.value.length > 0) {
			const lastMsg = messages.value[messages.value.length - 1]
			scrollTarget.value = 'msg-' + lastMsg.id
		}
	}, 100)
}

// ======================== 导航和跳转 ========================
function handleSaveExit() {
	const pages = getCurrentPages()
	if (pages && pages.length > 1) {
		uni.navigateBack({ delta: 1 })
	} else {
		// 没有上一页时，根据来源兜底
		const origin = sourceFrom.value
		if (origin === 'square') {
			uni.reLaunch({ url: '/pages/square/square' })
		} else {
			uni.reLaunch({ url: '/pages/gallery/gallery' })
		}
	}
}

function goBond() {
	if (!companion.value || !showBondEntry.value) return
	uni.navigateTo({
		url: '/pages/bond/bond?from=chat&origin=' + (sourceFrom.value || 'gallery') + '&characterId=' + companion.value.id
	})
}

function goToDrawStory() {
	if (!companion.value) return
	uni.navigateTo({
		url: '/pages/story/story?characterId=' + companion.value.id
	})
}

// ======================== 输入模式切换 ========================
function toggleInputMode() {
	isVoiceMode.value = !isVoiceMode.value
}

// ======================== 相机上传 ========================
async function handleCamera() {
	const remain = 10 - pendingImages.value.length

	if (remain <= 0) {
		uni.showToast({ title: '最多只能选择10张照片哦～', icon: 'none' })
		return
	}

	uni.chooseImage({
		count: remain,
		sizeType: ['compressed'],
		sourceType: ['album', 'camera'],
		success: async (res) => {
			const paths = res.tempFilePaths || []
			for (let i = 0; i < paths.length; i++) {
				try {
					const tempFilePath = paths[i]
					const { base64, mimeType } = await imagePathToBase64(tempFilePath)
					pendingImages.value.push({
						tempFilePath,
						base64,
						mimeType: mimeType || 'image/jpeg',
						name: `photo_${Date.now()}_${i}.jpg`
					})
				} catch (err) {
					console.error('[图片转base64失败]', paths[i], err)
				}
			}
		},
		fail: (err) => {
			console.error('[图片选择失败]', err)
			uni.showToast({ title: '没有选中图片～', icon: 'none' })
		}
	})
}

/** 图片转 base64 */
async function imagePathToBase64(tempFilePath) {
	const response = await fetch(tempFilePath)
	const blob = await response.blob()
	const mimeType = blob.type || 'image/jpeg'

	return await new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.onload = () => {
			const result = reader.result || ''
			const base64 = String(result).split(',')[1]
			resolve({ base64, mimeType })
		}
		reader.onerror = reject
		reader.readAsDataURL(blob)
	})
}

/** 移除单张待发送图片 */
function removePendingImage(index) {
	pendingImages.value.splice(index, 1)
}

/** 清空所有待发送图片 */
function clearPendingImages() {
	pendingImages.value = []
}

/** 发送图片+文字消息 */
async function sendImageMessageWithText(text) {
	const content = (text || '').trim()

	if (pendingImages.value.length === 0) return
	if (!content) {
		uni.showToast({ title: '给照片加一句描述吧～', icon: 'none' })
		return
	}
	if (isSendingVision.value) return

	isSendingVision.value = true

	// 复制待发送图片快照
	const imagesSnapshot = pendingImages.value.map(img => ({
		tempFilePath: img.tempFilePath,
		base64: img.base64,
		mimeType: img.mimeType,
		name: img.name
	}))

	// 用户消息加入列表（带图片）
	addMessage('user', content, false, false, null, imagesSnapshot.map(img => img.tempFilePath))

	// 关键：图片已经进入消息列表后，立刻清空待发送区
	pendingImages.value = []
	inputText.value = ''

	scrollToBottom()

	try {
		const characterData = {
			name: getCharacterName(),
			description: companion.value ? companion.value.description : '',
			personality: companion.value ? (companion.value.personality || companion.value.personality_type || '') : '',
			specialty: companion.value ? (companion.value.specialty || companion.value.talent || companion.value.skill || '') : ''
		}

		const res = await uniCloud.callFunction({
			name: 'chat_deepseek_vision',
			data: {
				character: characterData,
				text: content,
				images: imagesSnapshot.map(img => ({
					base64: img.base64,
					mimeType: img.mimeType,
					name: img.name
				})),
				imageBase64: imagesSnapshot[0]?.base64,
				mimeType: imagesSnapshot[0]?.mimeType || 'image/jpeg'
			},
			timeout: 60000
		})

		if (res.result && res.result.success) {
			addMessage('assistant', res.result.reply)
		} else {
			console.error('[DeepSeek识图失败]', res.result)
			uni.showModal({
				title: '识图调用失败',
				content: res.result?.debug?.message || res.result?.error || '请检查 DeepSeek API 配置',
				showCancel: false
			})
		}
	} catch (err) {
		console.error('[DeepSeek云函数异常]', err)
		uni.showModal({
			title: '识图调用失败',
			content: err.message || '云函数调用异常，请检查网络和配置',
			showCancel: false
		})
	} finally {
		isSendingVision.value = false
	}
}

// ======================== 语音播放 ========================
async function playVoice(msg) {
	if (playingMessageId.value === msg.id) {
		innerAudioContext.stop()
		playingMessageId.value = null
		return
	}
	uni.showLoading({ title: '准备发音...' })

	try {
		const res = await uniCloud.callFunction({
			name: 'generate_tts',
			data: { text: msg.content },
			timeout: 60000
		})

		if (res.result && res.result.code === 0 && res.result.audioBase64) {
			innerAudioContext.src = 'data:audio/mp3;base64,' + res.result.audioBase64
			innerAudioContext.play()
			playingMessageId.value = msg.id
			innerAudioContext.onEnded(() => { playingMessageId.value = null })
		} else {
			uni.showToast({ title: '发音失败', icon: 'none' })
		}
	} catch (err) {
		console.error('TTS 失败:', err)
		uni.showToast({ title: '发音失败', icon: 'none' })
	} finally {
		uni.hideLoading()
	}
}

// ======================== 语音识别 ========================
let recognition = null
let isRecognizing = false

if (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)) {
	const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
	recognition = new SpeechRecognition()
	recognition.continuous = false
	recognition.interimResults = false
	recognition.lang = 'zh-CN'

	recognition.onstart = () => {
		isRecognizing = true
	}

	recognition.onresult = (event) => {
		const text = event.results[0][0].transcript
		if (text) {
			// 有图片时直接发送图片+文字
			if (pendingImages.value.length > 0) {
				sendImageMessageWithText(text)
			} else {
				inputText.value = text
				isVoiceMode.value = false
				sendMessage()
			}
		}
	}

	recognition.onerror = (event) => {
		if (event.error !== 'no-speech' && event.error !== 'aborted') {
			uni.showToast({ title: '没听清，请大声再说一遍哦', icon: 'none' })
		}
		isRecognizing = false
		isRecording.value = false
	}

	recognition.onend = () => {
		isRecognizing = false
		isRecording.value = false
	}
}

function startRecord() {
	if (!recognition) {
		uni.showToast({ title: '您的浏览器不支持此功能，请使用 Chrome 或 Edge 哦', icon: 'none' })
		return
	}
	if (isRecognizing) return

	isRecording.value = true
	try {
		recognition.start()
	} catch (e) {
		isRecognizing = false
		isRecording.value = false
	}
}

function stopRecord() {
	if (isRecognizing && recognition) {
		recognition.stop()
	}
}

// ======================== 生命周期 ========================
onLoad((options) => {
	// 兼容多种参数名
	const characterId = options.characterId || options.id || options.character_id || ''

	// 读取冒险任务参数
	if (options.from === 'adventure' && options.taskId) {
		adventureTaskId.value = options.taskId
	}

	if (options.source === 'square') {
		sourceFrom.value = 'square'
		const temp = uni.getStorageSync('tempSquareCompanion')
		if (temp) {
			companionId.value = temp.id
			const profile = uni.getStorageSync('userProfile')
			if (profile) userProfile.value = profile
			companion.value = temp
			messages.value = temp.messages || []
			if (messages.value.length === 0) greet()
		}
	} else if (characterId) {
		// 优先使用 origin 参数，避免从 bond 进入后返回 bond
		sourceFrom.value = options.origin || options.from || 'gallery'
		loadData(characterId)
	}
})

onShow(() => {
	if (companionId.value) {
		const list = uni.getStorageSync('companions') || []
		const found = list.find(item => item.id === companionId.value)
		if (found) messages.value = found.messages || []
	}

	if (messages.value.length > 0) {
		const lastMsg = messages.value[messages.value.length - 1]
		if (lastMsg.role === 'system' && lastMsg.content && lastMsg.content.includes('【系统事件】')) {
			fetchAIResponse()
		}
	}
})
</script>

<style scoped>
.chat-page {
	width: 100vw;
	height: 100vh;
	position: relative;
	overflow: hidden;
	background-color: #FFE47A;
}

.page-bg {
	position: absolute;
	left: 0;
	top: 0;
	width: 100%;
	height: 100%;
	z-index: 1;
}

/* ==================== 保存退出按钮 ==================== */
.save-exit-btn {
	position: absolute;
	top: 100rpx;
	left: 110rpx;
	width: 580rpx;
	z-index: 30;
	cursor: pointer;
	transition: transform 0.15s ease;
}

.save-exit-btn:active {
	transform: scale(0.95);
}

/* ==================== 好感度入口按钮 ==================== */
.bond-entry-btn {
	position: absolute;
	right: 442rpx;
	top: 74rpx;
	width: 164rpx;
	height: 164rpx;
	z-index: 40;
	cursor: pointer;
	transition: transform 0.15s ease;
}

.bond-entry-btn:active {
	transform: scale(0.95);
}

/* ==================== 左侧面板 ==================== */
.left-panel {
	position: absolute;
	left: 150rpx;
	top: 360rpx;
	width: 540rpx;
	height: 1200rpx;
	z-index: 10;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.detail-title {
	width: 640rpx;
	cursor: pointer;
}

.companion-card {
	position: relative;
	width: 470rpx;
	height: 800rpx;
	margin-top: 0rpx;
}

.card-bg {
	position: absolute;
	left: -20rpx;
	top: 50rpx;
	width: 100%;
	height: 100%;
	z-index: 0;
}

.card-content {
	position: relative;
	z-index: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 30rpx 20rpx;
	height: 100%;
	box-sizing: border-box;
}

.card-name-tag {
	border-radius: 20rpx;
	padding: 28rpx 30rpx;
	margin-bottom: 15rpx;
	transform: translateX(-20rpx);
}

.card-name {
	font-size: 45rpx;
	font-weight: bold;
	color: #5A3010;
}

.card-image {
	width: 300rpx;
	height: 300rpx;
	border-radius: 16rpx;
	background-color: #FFFFFF;
	margin-bottom: 15rpx;
}

.card-desc {
	font-size: 26rpx;
	color: #7A3E18;
	text-align: center;
	margin-top: 0rpx;
	margin-bottom: 10rpx;
	max-width: 330rpx;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.info-lines {
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: 27rpx;
	padding: 0 10rpx;
	transform: translate(100rpx, 85rpx);
}

.info-line {
	font-size: 30rpx;
	line-height: 38rpx;
	color: #5A3010;
	font-weight: 600;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.create-story-btn {
	width: 360rpx;
	margin-top: 110rpx;
	cursor: pointer;
	transition: transform 0.15s ease;
}

.create-story-btn:active {
	transform: scale(0.95);
}

/* ==================== 聊天消息区域 ==================== */
.chat-panel {
	position: absolute;
	left: 920rpx;
	top: 400rpx;
	width: 1200rpx;
	height: 990rpx;
	z-index: 10;
	overflow: hidden;
}

.message-scroll {
	width: 100%;
	height: 100%;
}

.message-list {
	display: flex;
	flex-direction: column;
	gap: 24rpx;
	padding: 20rpx;
}

.message-row {
	display: flex;
	align-items: flex-start;
	gap: 16rpx;
}

.msg-left {
	flex-direction: row;
}

.msg-right {
	flex-direction: row-reverse;
}

.msg-avatar {
	width: 100rpx;
	height: 100rpx;
	border-radius: 50%;
	flex-shrink: 0;
}

.avatar-ai {
	background-color: #F5F0E8;
	border: 2rpx solid #E0D8CC;
}

.msg-content {
	display: flex;
	flex-direction: column;
}

.msg-bubble {
	max-width: 500rpx;
	padding: 20rpx 28rpx;
	border-radius: 24rpx;
	word-wrap: break-word;
}

.bubble-ai {
	background-color: #FFFFFF;
	border: 2rpx solid #FFD166;
	border-bottom-left-radius: 8rpx;
}

.bubble-user {
	background-color: #FF8A5C;
	border-bottom-right-radius: 8rpx;
}

.gift-image {
	width: 200rpx;
	border-radius: 12rpx;
	margin-bottom: 10rpx;
}

.msg-text {
	font-size: 28rpx;
	line-height: 1.6;
}

.bubble-ai .msg-text {
	color: #333333;
}

.bubble-user .msg-text {
	color: #FFFFFF;
}

.loading-dots {
	color: #999999;
}

.msg-time {
	font-size: 20rpx;
	color: #A08060;
	margin-top: 6rpx;
}

.time-left {
	text-align: left;
}

.time-right {
	text-align: right;
}

.play-btn {
	display: inline-flex;
	align-items: center;
	margin-top: 8rpx;
	padding: 4rpx 8rpx;
}

.play-icon {
	font-size: 24rpx;
}

.scroll-bottom-pad {
	height: 20rpx;
}

/* ==================== 语音工具栏 ==================== */
.voice-toolbar {
	position: absolute;
	left: 1250rpx;
	bottom: 100rpx;
	width: 620rpx;
	height: 200rpx;
	z-index: 30;
}

.toolbar-bg {
	position: absolute;
	left: 0;
	bottom: 0;
	width: 100%;
	height: 160rpx;
	z-index: 1;
}

.keyboard-btn {
	position: absolute;
	left: 12%;
	top: 45rpx;
	width: 140rpx;
	height: 140rpx;
	z-index: 2;
	cursor: pointer;
}

.mic-btn {
	position: absolute;
	left: 48%;
	top: 10rpx;
	transform: translateX(-50%);
	width: 150rpx;
	height: 150rpx;
	z-index: 3;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
}

.mic-btn.recording {
	animation: pulse 1s infinite;
}

@keyframes pulse {
	0%, 100% { transform: translateX(-50%) scale(1); }
	50% { transform: translateX(-50%) scale(1.1); }
}

.mic-img {
	width: 250rpx;
	height: 250rpx;
}

.camera-btn {
	position: absolute;
	right: 16%;
	top: 43rpx;
	width: 140rpx;
	height: 140rpx;
	z-index: 2;
	cursor: pointer;
}

/* ==================== 文字输入栏 ==================== */
.text-input-area {
	position: absolute;
	left: 1050rpx;
	bottom: 140rpx;
	width: 1000rpx;
	height: 95rpx;
	z-index: 35;
	display: flex;
	align-items: center;
}

.small-tool-btn {
	margin-right: 8rpx;
	cursor: pointer;
	transition: transform 0.15s ease;
}

.small-mic-btn {
	width: 100rpx;
	height: 100rpx;
}

.small-camera-btn {
	width: 180rpx;
	height: 180rpx;
	margin-right: 0rpx;
}

.small-tool-btn:active {
	transform: scale(0.95);
}

.input-box {
	flex: 1;
	height: 100rpx;
	border: 3rpx solid #8B4A20;
	border-radius: 100rpx;
	background: #FFFFFF;
	display: flex;
	align-items: center;
	padding: 0 28rpx;
}

.text-input {
	flex: 1;
	height: 86rpx;
	font-size: 30rpx;
	color: #5A3010;
}

.text-input::placeholder {
	color: #C0A080;
}

.send-btn {
	width: 180rpx;
	height: 100rpx;
	border-radius: 60rpx;
	background: #FF8A5C;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-left: 16rpx;
	cursor: pointer;
	transition: transform 0.15s ease;
}

.send-btn:active {
	transform: scale(0.95);
}

.send-btn.disabled {
	opacity: 0.5;
}

.send-text {
	font-size: 35rpx;
	font-weight: bold;
	color: #FFFFFF;
}

/* ==================== 待发送附件区域 ==================== */
.pending-attachment {
	position: absolute;
	left: 1040rpx;
	bottom: 260rpx;
	z-index: 45;
	min-width: 132rpx;
	max-width: 1030rpx;
	height: 157rpx;
	background: #FFFDF8;
	border: 3rpx solid #8B4A20;
	border-radius: 28rpx;
	box-sizing: border-box;
	padding: 14rpx;
	box-shadow: 0 6rpx 0 rgba(139, 74, 32, 0.18);
	white-space: nowrap;
}

.pending-image-list {
	display: flex;
	align-items: center;
	gap: 14rpx;
	width: max-content;
	height: 100%;
}

.pending-image-item {
	position: relative;
	width: 100rpx;
	height: 100rpx;
	flex-shrink: 0;
}

.pending-image {
	width: 100rpx;
	height: 100rpx;
	border-radius: 18rpx;
	border: 2rpx solid #8B4A20;
	background: #FFFFFF;
}

.pending-remove {
	position: absolute;
	right: -12rpx;
	top: -12rpx;
	width: 38rpx;
	height: 38rpx;
	border-radius: 50%;
	background: #FF9269;
	border: 3rpx solid #8B4A20;
	color: #5A3010;
	font-size: 30rpx;
	line-height: 32rpx;
	text-align: center;
	font-weight: bold;
	z-index: 2;
	cursor: pointer;
}

/* ==================== 消息图片 ==================== */
.message-images {
	display: flex;
	flex-wrap: wrap;
	gap: 10rpx;
	max-width: 360rpx;
	margin-bottom: 10rpx;
}

.message-image {
	width: 110rpx;
	height: 110rpx;
	border-radius: 16rpx;
	border: 2rpx solid rgba(139, 74, 32, 0.35);
}
</style>
