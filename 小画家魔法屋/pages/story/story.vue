<template>
	<view class="story-page">
		<!-- 背景图片 -->
		<image class="page-bg" src="/static/ui/story/story-bg.png" mode="aspectFill" />

		<!-- 左上角保存并退出 -->
		<image
			class="save-exit-btn"
			src="/static/ui/chat/btn-save-exit.png"
			mode="widthFix"
			@tap="handleSaveExit"
		/>

		<!-- 右上角操作按钮 -->
		<view class="top-actions">
			<image
				class="bond-entry-btn"
				src="/static/ui/bond/btn-bond-entry.png"
				mode="widthFix"
				@tap="goBond"
			/>
			<image
				class="chat-entry-btn"
				src="/static/ui/bond/btn-chat-entry.png"
				mode="widthFix"
				@tap="goChat"
			/>
		</view>

		<!-- 左侧面板 -->
		<view class="left-panel">
			<!-- 标题 -->
			<image
				class="story-list-title"
				src="/static/ui/story/title-story-list.png"
				mode="widthFix"
				@tap="speakLeftTitle"
			/>

			<!-- 空状态 -->
			<view v-if="companions.length === 0" class="empty-state">
				<text class="empty-text">还没有小伙伴，先去创造一个吧～</text>
			</view>

			<!-- 小伙伴列表 -->
			<scroll-view v-else class="companion-scroll" scroll-y>
				<view
					v-for="item in companions"
					:key="item.id"
					class="companion-item"
					:class="{ selected: selectedId === item.id }"
					@tap="selectCharacter(item)"
				>
					<image
						class="companion-item-bg"
						:src="selectedId === item.id ? '/static/ui/story/companion-item-active.png' : '/static/ui/story/companion-item-normal.png'"
						mode="scaleToFill"
					/>
					<image class="companion-avatar" :src="getCharacterImage(item)" mode="aspectFill" />
					<text class="companion-name">{{ getCharacterName(item) }}</text>
					<text class="companion-desc">{{ getCharacterDesc(item) }}</text>
				</view>
			</scroll-view>
		</view>

		<!-- 右侧面板 -->
		<view class="right-panel">
			<!-- 标题 -->
			<image
				class="right-title"
				src="/static/ui/story/title-create-story.png"
				mode="widthFix"
				@tap="speakRightTitle"
			/>

			<!-- 故事卡片区域 -->
			<view v-if="selectedCharacter" class="story-card-area">
				<!-- 故事1：糖果 -->
				<view class="story-card candy" @tap="speakStory('candy')">
					<image
						class="story-card-bg"
						:src="isStoryDone('candy') ? '/static/ui/story/story-card-done.png' : '/static/ui/story/story-card-normal.png'"
						mode="scaleToFill"
					/>
					<image class="story-image" src="/static/ui/story/story-candy.png" mode="aspectFit" />
					<text class="story-desc">{{ getCharacterName(selectedCharacter) }}爱吃糖果</text>
					<view class="story-action-btn" @tap.stop="goCreateStory('candy')">
						<image class="story-btn-bg" src="/static/ui/story/btn-story-green.png" mode="scaleToFill" />
						<text class="story-action-text">{{ isStoryDone('candy') ? '已完成！' : '给它送一些糖果' }}</text>
					</view>
				</view>

				<!-- 故事2：宽敞住所 -->
				<view class="story-card house" @tap="speakStory('house')">
					<image
						class="story-card-bg"
						:src="isStoryDone('house') ? '/static/ui/story/story-card-done.png' : '/static/ui/story/story-card-normal.png'"
						mode="scaleToFill"
					/>
					<image class="story-image" src="/static/ui/story/story-house.png" mode="aspectFit" />
					<text class="story-desc">{{ getCharacterName(selectedCharacter) }}想要一个宽敞的住所！</text>
					<view class="story-action-btn" @tap.stop="goCreateStory('house')">
						<image class="story-btn-bg" src="/static/ui/story/btn-story-orange.png" mode="scaleToFill" />
						<text class="story-action-text">{{ isStoryDone('house') ? '已完成！' : '给它建一个宽敞的房子' }}</text>
					</view>
				</view>

				<!-- 故事3：会飞的书包 -->
				<view class="story-card backpack" @tap="speakStory('backpack')">
					<image
						class="story-card-bg"
						:src="isStoryDone('backpack') ? '/static/ui/story/story-card-done.png' : '/static/ui/story/story-card-normal.png'"
						mode="scaleToFill"
					/>
					<image class="story-image" src="/static/ui/story/story-backpack.png" mode="aspectFit" />
					<text class="story-desc">{{ getCharacterName(selectedCharacter) }}想要一个会飞的书包</text>
					<view class="story-action-btn" @tap.stop="goCreateStory('backpack')">
						<image class="story-btn-bg" src="/static/ui/story/btn-story-blue.png" mode="scaleToFill" />
						<text class="story-action-text">{{ isStoryDone('backpack') ? '已完成！' : '送给他一个书包' }}</text>
					</view>
				</view>
			</view>
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
		const companions = ref([])
		const selectedId = ref('')

		// ======================== 计算属性 ========================
		const selectedCharacter = computed(() => {
			return companions.value.find(c => c.id === selectedId.value) || null
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

		function speakLeftTitle() {
			speak('与伙伴的故事，与小伙伴们共同创造美好的回忆')
		}

		function speakRightTitle() {
			speak('给它画一个故事吧，挑选一个故事，开始创作吧')
		}

		function speakStory(type) {
			if (!selectedCharacter.value) return
			const name = getCharacterName(selectedCharacter.value)
			if (type === 'candy') speak(name + '爱吃糖果')
			else if (type === 'house') speak(name + '想要一个宽敞的住所！')
			else if (type === 'backpack') speak(name + '想要一个会飞的书包')
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
			return text.length > 10 ? text.slice(0, 10) : text
		}

		// ======================== 故事完成状态 ========================
		function isStoryDone(storyType) {
			if (!selectedId.value) return false
			const map = uni.getStorageSync('huaban_completed_stories') || {}
			return Array.isArray(map[selectedId.value]) && map[selectedId.value].includes(storyType)
		}

		// ======================== 数据加载 ========================
		function loadData(characterId) {
			const list = uni.getStorageSync('companions') || []
			companions.value = list.map(item => ({
				...item,
				id: item.id || item._id || ''
			}))

			// 默认选中
			if (characterId && companions.value.find(c => c.id === characterId)) {
				selectedId.value = characterId
			} else if (companions.value.length > 0) {
				selectedId.value = companions.value[0].id
			}
		}

		function selectCharacter(item) {
			selectedId.value = item.id
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

		function goBond() {
			if (!selectedCharacter.value) {
				uni.showToast({ title: '先选一个小伙伴吧～', icon: 'none' })
				return
			}
			uni.navigateTo({
				url: '/pages/bond/bond?from=story&origin=gallery&characterId=' + selectedId.value
			})
		}

		function goChat() {
			if (!selectedCharacter.value) {
				uni.showToast({ title: '先选一个小伙伴吧～', icon: 'none' })
				return
			}
			// 写入缓存作为兜底
			uni.setStorageSync('huaban_current_chat_character', selectedCharacter.value)
			uni.navigateTo({
				url: '/pages/chat/chat?characterId=' + selectedId.value + '&from=story&origin=story'
			})
		}

		function goCreateStory(storyType) {
			if (!selectedCharacter.value) {
				uni.showToast({ title: '先选一个小伙伴吧～', icon: 'none' })
				return
			}

			const name = getCharacterName(selectedCharacter.value)
			const desc = getCharacterDesc(selectedCharacter.value)

			// 根据 storyType 生成任务信息
			let taskText = ''
			let taskSpeakText = ''
			let thoughtText = ''
			let storyImage = ''

			if (storyType === 'candy') {
				taskText = '任务：给' + name + '画一些糖果'
				taskSpeakText = '开始你的创作吧，任务：给' + name + '画一些糖果'
				thoughtText = '我想要吃一些糖果'
				storyImage = '/static/ui/story/story-candy.png'
			} else if (storyType === 'house') {
				taskText = '任务：给' + name + '画一个房子'
				taskSpeakText = '开始你的创作吧，任务：给' + name + '画一个房子'
				thoughtText = '我想要一个粉色的家'
				storyImage = '/static/ui/story/story-house.png'
			} else if (storyType === 'backpack') {
				taskText = '任务：给' + name + '画一个会飞的书包'
				taskSpeakText = '开始你的创作吧，任务：给' + name + '画一个会飞的书包'
				thoughtText = '我想要一个会飞的书包'
				storyImage = '/static/ui/story/story-backpack.png'
			} else {
				taskText = '任务：给' + name + '画一个故事'
				taskSpeakText = '开始你的创作吧，任务：给' + name + '画一个故事'
				thoughtText = '我想要一个新的故事'
			}

			// 保存当前故事任务信息到本地
			const storyInfo = {
				characterId: selectedId.value,
				storyType,
				characterName: name,
				description: desc,
				taskText,
				taskSpeakText,
				thoughtText,
				storyImage
			}
			uni.setStorageSync('huaban_current_story_task', storyInfo)

			uni.navigateTo({
				url: '/pages/index/index?mode=story&from=story&origin=gallery&characterId=' + selectedId.value + '&storyType=' + storyType
			})
		}

		// ======================== 生命周期 ========================
		onMounted(() => {
			const pages = getCurrentPages()
			const currentPage = pages[pages.length - 1]
			const options = currentPage.options || {}

			fromPage.value = options.from || ''
			originPage.value = options.origin || 'gallery'
			const characterId = options.characterId || ''

			loadData(characterId)
		})

		return {
			fromPage,
			originPage,
			companions,
			selectedId,
			selectedCharacter,
			speakLeftTitle,
			speakRightTitle,
			speakStory,
			getCharacterName,
			getCharacterImage,
			getCharacterDesc,
			isStoryDone,
			selectCharacter,
			handleSaveExit,
			goBond,
			goChat,
			goCreateStory
		}
	}
}
</script>

<style scoped>
.story-page {
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
	top: 80rpx;
	left: 100rpx;
	width: 500rpx;
	z-index: 20;
	cursor: pointer;
	transition: transform 0.15s ease;
}

.save-exit-btn:active {
	transform: scale(0.95);
}

/* ==================== 右上角操作按钮 ==================== */
.top-actions {
	position: absolute;
	right: 305rpx;
	top: 95rpx;
	z-index: 30;
	display: flex;
	gap: 20rpx;
}

.bond-entry-btn,
.chat-entry-btn {
	width: 162rpx;
	height: 162rpx;
	cursor: pointer;
	transition: transform 0.15s ease;
}

.bond-entry-btn:active,
.chat-entry-btn:active {
	transform: scale(0.95);
}

/* ==================== 左侧面板 ==================== */
.left-panel {
	position: absolute;
	left: 140rpx;
	top: 360rpx;
	width: 520rpx;
	height: 1260rpx;
	z-index: 10;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.story-list-title {
	left:-60rpx;
	width: 390rpx;
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

.companion-scroll {
	width: 90%;
	height: 1010rpx;
	margin-top: 85rpx;
}

.companion-item {
	position: relative;
	width: 430rpx;
	height: 108rpx;
	margin-bottom: 20rpx;
	cursor: pointer;
	transition: transform 0.15s ease;
}

.companion-item:active {
	transform: scale(0.98);
}

.companion-item-bg {
	position: absolute;
	left: 0;
	top: 0;
	width: 100%;
	height: 100%;
	z-index: 0;
}

.companion-avatar {
	position: absolute;
	left: 34rpx;
	top: 14rpx;
	width: 60rpx;
	height: 60rpx;
	border-radius: 50%;
	z-index: 1;
}

.companion-name {
	position: absolute;
	left: 120rpx;
	top: 12rpx;
	font-size: 30rpx;
	font-weight: bold;
	color: #000;
	z-index: 1;
}

.companion-desc {
	position: absolute;
	left: 120rpx;
	top: 50rpx;
	width: 250rpx;
	font-size: 20rpx;
	color: #666;
	z-index: 1;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

/* ==================== 右侧面板 ==================== */
.right-panel {
	position: absolute;
	left: 840rpx;
	top: 260rpx;
	width: 1050rpx;
	height: 850rpx;
	z-index: 10;
}

.right-title {
	position: absolute;
	left: 80rpx;
	top: 105rpx;
	width: 520rpx;
	z-index: 12;
	cursor: pointer;
}

/* ==================== 故事卡片区域 ==================== */
.story-card-area {
	position: absolute;
	left: 20rpx;
	top: 260rpx;
	width: 980rpx;
	height: 660rpx;
	z-index: 10;
}

.story-card {
	position: absolute;
	width: 640rpx;
	height: 450rpx;
	cursor: pointer;
	transition: transform 0.15s ease;
}

.story-card:active {
	transform: scale(0.98);
}

.story-card.candy {
	left: 0;
	top: 0;
}

.story-card.house {
	left: 650rpx;
	top: 0;
}

.story-card.backpack {
	left: 0;
	top: 470rpx;
}

.story-card-bg {
	position: absolute;
	left: 0;
	top: 0;
	width: 100%;
	height: 100%;
	z-index: 0;
}

.story-image {
	position: absolute;
	left: 50%;
	top: 42rpx;
	transform: translateX(-50%);
	width: 320rpx;
	height: 245rpx;
	z-index: 2;
}

.story-desc {
	position: absolute;
	left: 22rpx;
	right: 40rpx;
	top: 334rpx;
	font-size: 32rpx;
	color: #000;
	text-align: center;
	z-index: 2;
}

.story-action-btn {
	position: absolute;
	left: 50%;
	bottom: -20rpx;
	transform: translateX(-50%);
	width: 360rpx;
	height: 72rpx;
	z-index: 3;
}

.story-btn-bg {
	position: absolute;
	left: 0;
	top: 0;
	width: 100%;
	height: 100%;
	z-index: 0;
}

.story-action-text {
	position: absolute;
	left: 0;
	top: -2rpx;
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 28rpx;
	font-weight: bold;
	color: #000;
	z-index: 4;
}
</style>
