<template>
	<view class="bond-page">
		<!-- 背景图片 -->
		<image class="page-bg" src="/static/ui/bond/bond-bg.png" mode="aspectFill" />

		<!-- 左上角保存并退出 -->
		<image
			class="save-exit-btn"
			src="/static/ui/chat/btn-save-exit.png"
			mode="widthFix"
			@tap="handleSaveExit"
		/>

		<!-- 右上角聊天按钮 -->
		<image
			class="chat-entry-btn"
			src="/static/ui/bond/btn-chat-entry.png"
			mode="widthFix"
			@tap="goToChat"
		/>

		<!-- 左侧面板 -->
		<view class="left-panel">
			<!-- 标题 -->
			<image
				class="title-bond"
				src="/static/ui/bond/title-bond.png"
				mode="widthFix"
				@tap="speakTitle"
			/>

			<!-- 空状态 -->
			<view v-if="rankedList.length === 0" class="empty-state">
				<text class="empty-text">还没有小伙伴，先去创造一个吧～</text>
			</view>

			<!-- 前三名区域 -->
			<view v-else class="top-rank-area">
				<!-- 第3名 -->
				<view
					v-if="rankedList.length >= 3"
					class="podium podium-rank3"
					:class="{ selected: selectedId === rankedList[2].id }"
					@tap="selectCharacter(rankedList[2])"
				>
					<text class="podium-name">{{ getCharacterName(rankedList[2]) }}</text>
					<text class="podium-desc">{{ getCharacterDesc(rankedList[2]) }}</text>
					<image class="podium-avatar" :src="getCharacterImage(rankedList[2])" mode="aspectFill" />
					<image class="podium-bg" src="/static/ui/bond/rank-pillar-3.png" mode="widthFix" />
					<text class="podium-value">{{ rankedList[2].favorability }}%</text>
				</view>

				<!-- 第1名 -->
				<view
					v-if="rankedList.length >= 1"
					class="podium podium-rank1"
					:class="{ selected: selectedId === rankedList[0].id }"
					@tap="selectCharacter(rankedList[0])"
				>
					<text class="podium-name">{{ getCharacterName(rankedList[0]) }}</text>
					<text class="podium-desc">{{ getCharacterDesc(rankedList[0]) }}</text>
					<image class="podium-avatar" :src="getCharacterImage(rankedList[0])" mode="aspectFill" />
					<image class="podium-bg" src="/static/ui/bond/rank-pillar-1.png" mode="widthFix" />
					<text class="podium-value">{{ rankedList[0].favorability }}%</text>
				</view>

				<!-- 第2名 -->
				<view
					v-if="rankedList.length >= 2"
					class="podium podium-rank2"
					:class="{ selected: selectedId === rankedList[1].id }"
					@tap="selectCharacter(rankedList[1])"
				>
					<text class="podium-name">{{ getCharacterName(rankedList[1]) }}</text>
					<text class="podium-desc">{{ getCharacterDesc(rankedList[1]) }}</text>
					<image class="podium-avatar" :src="getCharacterImage(rankedList[1])" mode="aspectFill" />
					<image class="podium-bg" src="/static/ui/bond/rank-pillar-2.png" mode="widthFix" />
					<text class="podium-value">{{ rankedList[1].favorability }}%</text>
				</view>
			</view>

			<!-- 第4名及之后列表 -->
			<scroll-view v-if="restRanks.length > 0" class="rank-list-scroll" scroll-y>
				<view
					v-for="(item, index) in restRanks"
					:key="item.id"
					class="rank-list-item"
					:class="{ selected: selectedId === item.id }"
					@tap="selectCharacter(item)"
				>
					<image class="rank-list-bg" src="/static/ui/bond/rank-list-item.png" mode="scaleToFill" />
					<text class="rank-number">{{ index + 4 }}</text>
					<image class="rank-avatar" :src="getCharacterImage(item)" mode="aspectFill" />
					<view class="rank-info">
						<text class="rank-name">{{ getCharacterName(item) }}</text>
						<text class="rank-desc">{{ getCharacterDesc(item) }}</text>
					</view>
					<view class="rank-progress-area">
						<text class="rank-favor-text">好感度：{{ item.favorability }}%</text>
						<view class="rank-progress-bar">
							<view class="rank-progress-fill" :style="{ width: item.favorability + '%' }"></view>
						</view>
					</view>
				</view>
			</scroll-view>
		</view>

		<!-- 右侧面板 -->
		<view v-if="selectedCharacter" class="right-panel">
			<!-- 小伙伴大图 -->
			<image class="detail-image" :src="getCharacterImage(selectedCharacter)" mode="aspectFill" />

			<!-- 昵称 -->
			<text class="detail-name">{{ getCharacterName(selectedCharacter) }}</text>

			<!-- 标签 -->
			<view class="detail-tags">
				<view
					v-for="(tag, idx) in characterTags"
					:key="idx"
					class="tag-item"
					:style="{ backgroundColor: tagColors[idx % tagColors.length] }"
				>
					<text class="tag-text">{{ tag }}</text>
				</view>
			</view>

			<!-- 回忆数据 -->
			<text class="memory-value first-meet-value">{{ firstMeetDate }}</text>
			<text class="memory-value first-chat-value">{{ firstChatDate }}</text>
			<text class="memory-value topic-value">{{ topTopic }}</text>
			<text class="memory-value word-value">{{ frequentWord }}</text>
		</view>
	</view>
</template>

<script>
import { ref, computed, onMounted } from 'vue'

export default {
	setup() {
		// ======================== 页面参数 ========================
		const fromPage = ref('')
		const originPage = ref('')
		const selectedId = ref('')
		const companions = ref([])

		// ======================== 回忆数据 ========================
		const firstMeetDate = ref('……')
		const firstChatDate = ref('……')
		const topTopic = ref('……')
		const frequentWord = ref('……')

		// ======================== 标签颜色 ========================
		const tagColors = ['#74C583', '#FFADD6', '#9AC0FF', '#FFE073', '#FF9269']

		// ======================== 默认标签 ========================
		const DEFAULT_TAGS = ['温柔', '爱冒险', '喜欢星座', '最喜欢听你讲故事']

		// ======================== 计算属性 ========================
		const rankedList = computed(() => {
			return [...companions.value].sort((a, b) => {
				if (b.favorability !== a.favorability) return b.favorability - a.favorability
				return (a.createdAt || 0) - (b.createdAt || 0)
			})
		})

		const restRanks = computed(() => {
			return rankedList.value.slice(3)
		})

		const selectedCharacter = computed(() => {
			return companions.value.find(c => c.id === selectedId.value) || null
		})

		function splitTagText(text) {
			if (!text) return []
			return String(text)
				.replace(/，/g, ',')
				.replace(/、/g, ',')
				.replace(/\s+/g, ',')
				.replace(/[；;｜|/]/g, ',')
				.split(',')
				.map(t => t.trim())
				.filter(Boolean)
		}

		function isGenericTagValue(personality, specialty) {
			const p = String(personality || '').replace(/\s/g, '').replace(/，/g, ',')
			const s = String(specialty || '').replace(/\s/g, '')
			const genericPairs = [
				['活泼,友好', '陪你画画'],
				['活泼友好', '陪你画画'],
				['温柔', '爱画画']
			]
			return genericPairs.some(([gp, gs]) => p === gp && s === gs)
		}

		const characterTags = computed(() => {
			const item = selectedCharacter.value
			if (!item) return []

			const personality = item.personality || item.personality_type || item.speaking_style || ''
			const specialty = item.specialty || item.talent || item.skill || item.speciality || ''

			// 无有效标签或为模板值 → 使用默认标签
			if ((!personality && !specialty) || isGenericTagValue(personality, specialty)) {
				return DEFAULT_TAGS
			}

			const rawTags = []
			if (personality) rawTags.push(...splitTagText(personality))
			if (specialty) rawTags.push(...splitTagText(specialty))

			// visual_features 补充
			if (rawTags.length < 2 && item.visual_features) {
				rawTags.push(...splitTagText(item.visual_features).slice(0, 2))
			}

			if (rawTags.length === 0) {
				return DEFAULT_TAGS
			}

			return [...new Set(rawTags)]
				.map(tag => String(tag).trim())
				.filter(Boolean)
				.map(tag => tag.length > 10 ? tag.slice(0, 10) : tag)
				.slice(0, 5)
		})

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

		function speakTitle() {
			speak('小伙伴好感度，你最喜欢哪些小伙伴呢')
		}

		// ======================== 角色字段兼容 ========================
		function getCharacterName(item) {
			if (!item) return '小伙伴'
			return item.name || item.character_name || '小伙伴'
		}

		function getCharacterImage(item) {
			if (!item) return ''
			return item.drawing_url || item.image_url || item.avatar || item.image || item.drawingUrl || item.imageUrl || ''
		}

		function getCharacterDesc(item) {
			if (!item) return '可爱的小伙伴'
			const text = item.description || item.greeting || '可爱的小伙伴'
			return text.length > 8 ? text.slice(0, 8) : text
		}

		// ======================== 好感度计算 ========================
		function calculateFavorability(characterId) {
			// 消息好感度
			const messageCounts = uni.getStorageSync('huaban_bond_message_counts') || {}
			const userMsgCount = messageCounts[characterId] || 0
			const messageScore = Math.min(userMsgCount * 2, 60)

			// 故事好感度
			const storyCounts = uni.getStorageSync('huaban_story_counts_by_character') || {}
			const storyCount = storyCounts[characterId] || 0
			const storyScore = Math.min(storyCount * 5, 40)

			return Math.min(messageScore + storyScore, 100)
		}

		// ======================== 旧数据迁移 ========================
		function migrateCompanionTags() {
			const list = uni.getStorageSync('companions')
			if (!Array.isArray(list)) return

			let changed = false
			const nextList = list.map(item => {
				const p = item.personality || item.personality_type || item.speaking_style || ''
				const s = item.specialty || item.talent || item.skill || item.speciality || ''

				if ((!p && !s) || isGenericTagValue(p, s)) {
					changed = true
					return {
						...item,
						personality: '温柔、爱冒险、喜欢星座',
						specialty: '最喜欢听你讲故事'
					}
				}
				return item
			})

			if (changed) {
				uni.setStorageSync('companions', nextList)
				console.log('[bond] 已迁移旧小伙伴标签')
			}
		}

		// ======================== 数据加载 ========================
		function loadData() {
			migrateCompanionTags()
			const list = uni.getStorageSync('companions') || []
			companions.value = list.map(item => {
				const id = item.id || item._id || ''
				return {
					...item,
					id,
					favorability: calculateFavorability(id),
					createdAt: item.created_at || item.createdAt || item.createTime || Date.now()
				}
			})
		}

		function selectCharacter(item) {
			selectedId.value = item.id
			loadMemoryData(item)
		}

		async function loadMemoryData(character) {
			// 第一次见面
			const createdAt = character.created_at || character.createdAt || character.createTime
			if (createdAt) {
				const d = new Date(createdAt)
				firstMeetDate.value = d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate()
			} else {
				firstMeetDate.value = '刚刚'
			}

			// 第一次聊天
			const messages = character.messages || []
			const userMsg = messages.find(m => m.role === 'user' && !m.isHidden)
			if (userMsg) {
				const msgTime = userMsg.created_at || userMsg.createdAt || userMsg.time || userMsg.timestamp
				if (msgTime) {
					const d = new Date(msgTime)
					firstChatDate.value = d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate()
				} else {
					firstChatDate.value = '还没有'
				}
			} else {
				firstChatDate.value = '还没有'
			}

			// DeepSeek 总结
			topTopic.value = '……'
			frequentWord.value = '……'

			try {
				const chatHistory = messages.filter(m => !m.isHidden).map(m => m.content).join('\n')
				if (chatHistory.length > 10) {
					const res = await uniCloud.callFunction({
						name: 'summarize_bond_memory',
						data: { chatHistory },
						timeout: 30000
					})
					if (res.result && res.result.code === 0) {
						topTopic.value = res.result.topTopic || '暂无'
						frequentWord.value = res.result.frequentWord || '你好'
					}
				}
			} catch (err) {
				console.error('总结失败:', err)
			}
		}

		// ======================== 导航 ========================
		function handleSaveExit() {
			const pages = getCurrentPages()
			if (pages && pages.length > 1) {
				uni.navigateBack({ delta: 1 })
			} else {
				uni.reLaunch({ url: '/pages/gallery/gallery' })
			}
		}

		function goToChat() {
			if (!selectedCharacter.value) {
				uni.showToast({ title: '先选一个小伙伴吧～', icon: 'none' })
				return
			}
			uni.navigateTo({
				url: '/pages/chat/chat?id=' + selectedId.value + '&from=bond&origin=' + originPage.value
			})
		}

		// ======================== 生命周期 ========================
		onMounted(() => {
			const pages = getCurrentPages()
			const currentPage = pages[pages.length - 1]
			const options = currentPage.options || {}

			fromPage.value = options.from || 'gallery'
			originPage.value = options.origin || 'gallery'
			const characterId = options.characterId || ''

			loadData()

			if (characterId && companions.value.find(c => c.id === characterId)) {
				selectCharacter(companions.value.find(c => c.id === characterId))
			} else if (rankedList.value.length > 0) {
				selectCharacter(rankedList.value[0])
			}
		})

		return {
			fromPage,
			originPage,
			selectedId,
			companions,
			rankedList,
			restRanks,
			selectedCharacter,
			characterTags,
			tagColors,
			firstMeetDate,
			firstChatDate,
			topTopic,
			frequentWord,
			speakTitle,
			getCharacterName,
			getCharacterImage,
			getCharacterDesc,
			selectCharacter,
			handleSaveExit,
			goToChat
		}
	}
}
</script>

<style scoped>
.bond-page {
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

/* ==================== 右上角聊天按钮 ==================== */
.chat-entry-btn {
	position: absolute;
	right: 492rpx;
	top: 77rpx;
	width: 163rpx;
	z-index: 30;
	cursor: pointer;
	transition: transform 0.15s ease;
}

.chat-entry-btn:active {
	transform: scale(0.95);
}

/* ==================== 左侧面板 ==================== */
.left-panel {
	position: absolute;
	left: 40rpx;
	top: 360rpx;
	width: 1000rpx;
	height: 1200rpx;
	z-index: 10;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.title-bond {
	width: 700rpx;
	cursor: pointer;
}

.empty-state {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 400rpx;
}

.empty-text {
	font-size: 32rpx;
	color: #8B6914;
}

/* ==================== 前三名区域 ==================== */
.top-rank-area {
	position: relative;
	width: 680rpx;
	height: 600rpx;
	margin-top: 2rpx;
}

.podium {
	position: absolute;
	width: 230rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	cursor: pointer;
	transition: transform 0.2s ease;
}

.podium:active {
	transform: scale(0.98);
}

.podium-rank3 { left: 0rpx; top: 118rpx; }
.podium-rank1 { left: 245rpx; top: 26rpx; }
.podium-rank2 { left: 495rpx; top: 90rpx; }

.podium-name {
	font-size: 26rpx;
	font-weight: bold;
	color: #000;
	text-align: center;
	max-width: 220rpx;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.podium-desc {
	font-size: 24rpx;
	color: #666;
	text-align: center;
	margin-top: 6rpx;
	max-width: 220rpx;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.podium-avatar {
	width: 145rpx;
	height: 145rpx;
	border-radius: 50%;
	border: 6rpx solid #733F17;
	margin-top: 14rpx;
}

.podium-bg {
	width: 190rpx;
	margin-top: 10rpx;
	position: relative;
	z-index: 1;
}

.podium-value {
	font-size: 40rpx;
	font-weight: bold;
	color: #733F17;
	margin-top: -70rpx;
	position: relative;
	z-index: 5;
}

/* 选中状态 */
.podium.selected .podium-avatar {
	border-color: #FF9269;
	border-width: 7rpx;
}

.podium.selected .podium-name {
	color: #FF9269;
	text-decoration: underline;
	text-decoration-thickness: 6rpx;
	text-underline-offset: 8rpx;
}

.podium.selected .podium-bg {
	filter: drop-shadow(0 0 8rpx rgba(255, 146, 105, 0.9));
}

/* ==================== 第4名及之后列表 ==================== */
.rank-list-scroll {
	width: 900rpx;
	height: 400rpx;
	margin-top: 10rpx;
	margin-left: 128rpx;
	overflow: visible;
}

.rank-list-item {
	position: relative;
	width: 860rpx;
	height: 120rpx;
	display: flex;
	align-items: flex-start;
	padding: 16rpx 42rpx 0 24rpx;
	box-sizing: border-box;
	margin-bottom: 16rpx;
	cursor: pointer;
	transition: transform 0.15s ease;
	overflow: visible;
}

.rank-list-item:active {
	transform: scale(0.98);
}

.rank-list-item.selected::after {
	content: '';
	position: absolute;
	left: 0;
	top: 0;
	width: 860rpx;
	height: 120rpx;
	border: 6rpx solid #FF9269;
	border-radius: 28rpx;
	box-sizing: border-box;
	z-index: 5;
	pointer-events: none;
}

.rank-list-item.selected {
	filter: drop-shadow(0 0 8rpx rgba(255, 146, 105, 0.45));
}

.rank-list-bg {
	position: absolute;
	left: 0;
	top: 0;
	width: 860rpx;
	height: 120rpx;
	z-index: 0;
}

.rank-number {
	position: relative;
	z-index: 1;
	font-size: 36rpx;
	font-weight: bold;
	color: #733F17;
	width: 55rpx;
	text-align: center;
	margin-top: 12rpx;
	flex-shrink: 0;
}

.rank-avatar {
	position: relative;
	z-index: 1;
	width: 76rpx;
	height: 76rpx;
	border-radius: 10rpx;
	margin: 6rpx 18rpx 0 10rpx;
	flex-shrink: 0;
}

.rank-info {
	position: relative;
	z-index: 1;
	width: 250rpx;
	display: flex;
	flex-direction: column;
	gap: 2rpx;
	margin-top: 4rpx;
	flex-shrink: 0;
}

.rank-name {
	font-size: 28rpx;
	font-weight: bold;
	color: #5A3010;
	line-height: 1.2;
	max-width: 240rpx;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.rank-desc {
	font-size: 22rpx;
	color: #8B6914;
	line-height: 1.2;
	max-width: 240rpx;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.rank-progress-area {
	position: relative;
	z-index: 1;
	width: 330rpx;
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	gap: 6rpx;
	margin-top: 6rpx;
	margin-left: auto;
	flex-shrink: 0;
}

.rank-favor-text {
	font-size: 24rpx;
	font-weight: bold;
	color: #733F17;
	line-height: 1.2;
}

.rank-progress-bar {
	width: 380rpx;
	height: 25rpx;
	background-color: #F5E6D0;
	border-radius: 30rpx;
	overflow: hidden;
}

.rank-progress-fill {
	height: 100%;
	background: linear-gradient(90deg, #FF8A5C, #FFB36B);
	border-radius: 8rpx;
}

/* ==================== 右侧面板 ==================== */
.right-panel {
	position: absolute;
	right: 160rpx;
	top: 360rpx;
	width: 970rpx;
	height: 850rpx;
	z-index: 10;
}

.detail-image {
	position: absolute;
	left: 90rpx;
	top: 100rpx;
	width: 320rpx;
	height: 296rpx;
	transform: rotate(-6deg);
	z-index: 12;
	border-radius: 16rpx;
}

.detail-name {
	position: absolute;
	left: 530rpx;
	top: 100rpx;
	font-size: 54rpx;
	font-weight: bold;
	color: #000;
	z-index: 12;
}

.detail-tags {
	position: absolute;
	left: 530rpx;
	top: 210rpx;
	width: 420rpx;
	display: flex;
	flex-wrap: wrap;
	gap: 16rpx;
	z-index: 12;
}

.tag-item {
	padding: 10rpx 26rpx;
	border-radius: 34rpx;
	border: 3rpx solid #8B4A20;
	min-height: 54rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	box-sizing: border-box;
}

.tag-text {
	font-size: 30rpx;
	color: #5A3010;
	font-weight: bold;
	line-height: 1;
}

/* ==================== 回忆数据 ==================== */
.memory-value {
	position: absolute;
	right: 96rpx;
	font-size: 30rpx;
	font-weight: bold;
	color: #000;
	z-index: 12;
}

.first-meet-value { top: 650rpx; }
.first-chat-value { top: 790rpx; }
.topic-value { top: 922rpx; right: 98rpx; font-size: 36rpx;}
.word-value { top: 1058rpx; right: 100rpx; font-size: 36rpx; }
</style>
