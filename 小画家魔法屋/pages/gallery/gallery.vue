<template>
	<view class="gallery-page">
		<!-- 背景图片 -->
		<image class="page-bg" src="/static/ui/gallery/gallery-bg.png" mode="aspectFill" />

		<!-- 顶部头部区域 -->
		<view class="top-header">
			<!-- 左侧标题 -->
			<image
				class="title-img"
				src="/static/ui/gallery/title-my-companions.png"
				mode="heightFix"
				@tap="handleTitleTap"
			/>

			<!-- 好感度入口按钮 -->
			<image
				class="bond-entry-btn"
				src="/static/ui/bond/btn-bond-entry.png"
				mode="widthFix"
				@tap="goBond"
			/>

			<!-- 右侧搜索框 -->
			<view class="search-box">
				<image class="search-icon" src="/static/ui/gallery/icon-search.png" mode="widthFix" />
				<input
					class="search-input"
					v-model="searchText"
					placeholder="搜索你的伙伴"
					@confirm="doSearch"
				/>
			</view>
		</view>

		<!-- 内容区域 -->
		<view class="content-area">
			<!-- 空状态：显示创造新伙伴卡片 -->
			<view v-if="companions.length === 0" class="empty-state">
				<image
					class="create-card"
					src="/static/ui/gallery/create-companion-card.png"
					mode="aspectFit"
					@tap="goDraw"
				/>
			</view>

			<!-- 有小伙伴时：横向滚动列表 -->
			<scroll-view
				v-else
				class="companion-scroll"
				scroll-x
				:scroll-into-view="scrollIntoView"
				scroll-with-animation
			>
				<view class="scroll-content">
					<!-- 创造新伙伴卡片 -->
					<view class="create-card-wrap">
						<image
							id="create-card"
							class="create-card-small"
							src="/static/ui/gallery/create-companion-card.png"
							mode="aspectFit"
							@tap="goDraw"
						/>
					</view>

					<!-- 小伙伴卡片 -->
					<view
						v-for="(item, index) in companions"
						:key="item.id"
						:id="'companion-card-' + index"
						class="companion-card-wrap"
					>
						<view
							class="companion-card"
							:class="{ highlight: highlightIndex === index }"
						>
							<!-- 卡片背景 -->
							<image class="card-bg" :src="getCardBg(index)" mode="scaleToFill" />

							<!-- 卡片内容 -->
							<view class="card-content">
								<!-- 小伙伴图片 -->
								<image
									class="companion-image"
									:src="getCompanionImage(item)"
									mode="aspectFit"
								/>

								<!-- 小伙伴名称 -->
								<view class="name-tag">
									<text class="companion-name">{{ getCompanionName(item) }}</text>
								</view>

								<!-- 描述区域 -->
								<view class="desc-row">
									<text class="companion-desc">{{ getCompanionDesc(item) }}</text>
									<image
										class="speaker-icon"
										src="/static/ui/gallery/icon-speaker.png"
										mode="widthFix"
										@tap="speakDesc(item)"
									/>
								</view>

								<!-- 按钮区域 -->
								<view class="btn-row">
									<image
										class="action-btn"
										:src="getChatBtn(index)"
										mode="scaleToFill"
										@tap="goChat(item.id)"
									/>
									<image
										class="action-btn"
										:src="getStoryBtn(index)"
										mode="scaleToFill"
										@tap="goStory(item.id)"
									/>
								</view>

								<!-- 发射到云空间按钮 -->
								<view class="cloud-share-btn" @tap="shareToCloud(item)">
									<text class="cloud-share-text">发射云空间</text>
								</view>
							</view>
						</view>
						<!-- 创建日期 -->
						<text class="create-date">{{ getCreateDate(item) }}</text>
					</view>
				</view>
			</scroll-view>
		</view>

		<!-- 底部导航栏 -->
		<view class="bottom-nav">
			<view class="nav-item" @tap="goSettings">
				<image class="nav-icon" src="/static/ui/gallery/tab-me-normal.png" mode="widthFix" />
			</view>
			<view class="nav-item active">
				<image class="nav-icon" src="/static/ui/gallery/tab-gallery-active.png" mode="widthFix" />
			</view>
			<view class="nav-item" @tap="goSquare">
				<image class="nav-icon" src="/static/ui/gallery/tab-square-normal.png" mode="widthFix" />
			</view>
			<view class="nav-item" @tap="goAchievement">
				<image class="nav-icon" src="/static/ui/gallery/tab-achievement-normal.png" mode="widthFix" />
			</view>
			<view class="nav-item" @tap="goTask">
				<image class="nav-icon" src="/static/ui/gallery/tab-adventure-normal.png" mode="widthFix" />
			</view>
		</view>
	</view>
</template>

<script>
import { ref } from 'vue'

export default {
	setup() {
		const companions = ref([])
		const searchText = ref('')
		const scrollIntoView = ref('')
		const highlightIndex = ref(-1)

		/** 卡片背景数组 */
		const cardBgs = [
			'/static/ui/gallery/card-frame-pink.png',
			'/static/ui/gallery/card-frame-blue.png',
			'/static/ui/gallery/card-frame-yellow.png'
		]

		/** 聊天按钮数组 */
		const chatBtns = [
			'/static/ui/gallery/btn-chat-yellow.png',
			'/static/ui/gallery/btn-chat-pink.png',
			'/static/ui/gallery/btn-chat-green.png'
		]

		/** 故事按钮数组 */
		const storyBtns = [
			'/static/ui/gallery/btn-story-yellow.png',
			'/static/ui/gallery/btn-story-pink.png',
			'/static/ui/gallery/btn-story-green.png'
		]

		/** 页面显示时刷新数据 */
		function loadData() {
			companions.value = uni.getStorageSync('companions') || []
		}

		/** 语音播报方法 */
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

		/** 点击标题 */
		function handleTitleTap() {
			speak('我的小伙伴，发现全世界小朋友的伙伴')
		}

		/** 搜索功能 */
		function doSearch() {
			if (!searchText.value.trim()) {
				uni.showToast({ title: '先输入小伙伴名字吧～', icon: 'none' })
				return
			}

			const keyword = searchText.value.trim()
			const index = companions.value.findIndex(item => {
				const name = item.name || item.character_name || ''
				return name.includes(keyword)
			})

			if (index === -1) {
				uni.showToast({ title: '没有找到这个小伙伴～', icon: 'none' })
				return
			}

			// 滚动到对应卡片
			scrollIntoView.value = 'companion-card-' + index

			// 高亮动画
			highlightIndex.value = index
			setTimeout(() => {
				highlightIndex.value = -1
			}, 1500)
		}

		/** 获取卡片背景 */
		function getCardBg(index) {
			return cardBgs[index % 3]
		}

		/** 获取聊天按钮 */
		function getChatBtn(index) {
			return chatBtns[index % 3]
		}

		/** 获取故事按钮 */
		function getStoryBtn(index) {
			return storyBtns[index % 3]
		}

		/** 获取小伙伴名称 */
		function getCompanionName(item) {
			const name = item.name || item.character_name || '小伙伴'
			return name.length > 6 ? name.slice(0, 6) + '...' : name
		}

		/** 获取小伙伴图片 */
		function getCompanionImage(item) {
			return item.imageUrl || item.drawing_url || item.image_url || item.avatar || ''
		}

		/** 获取小伙伴描述 */
		function getCompanionDesc(item) {
			const text = item.description || item.personality || item.greeting || '可爱的小伙伴'
			return text.length > 10 ? text.slice(0, 10) : text
		}

		/** 播放描述语音 */
		function speakDesc(item) {
			const desc = item.description || item.personality || item.greeting || '可爱的小伙伴'
			speak(desc)
		}

		/** 获取创建日期 */
		function getCreateDate(item) {
			const timestamp = item.createdAt || item.created_at || item.createTime || null
			if (!timestamp) return '刚刚'

			const now = new Date()
			const date = new Date(timestamp)
			const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))

			if (diffDays === 0) return '今天'
			if (diffDays === 1) return '昨天'
			if (diffDays <= 7) return diffDays + '天前'

			const year = date.getFullYear()
			const month = date.getMonth() + 1
			const day = date.getDate()
			return year + '年' + month + '月' + day + '日'
		}

		/** 跳转到绘画页 */
		function goDraw() {
			speak('创造新伙伴')
			uni.navigateTo({ url: '/pages/index/index' })
		}

		/** 跳转到聊天页 */
		function goChat(id) {
			uni.navigateTo({ url: '/pages/chat/chat?id=' + id })
		}

		/** 跳转到画故事页 */
		function goStory(id) {
			uni.navigateTo({ url: '/pages/story/story?characterId=' + id })
		}

		/** 跳转到设置页 */
		function goSettings() {
			uni.reLaunch({ url: '/pages/settings/settings' })
		}

		/** 跳转到好感度页 */
		function goBond() {
			uni.navigateTo({ url: '/pages/bond/bond?from=gallery&origin=gallery' })
		}

		/** 跳转到广场页 */
		function goSquare() {
			uni.reLaunch({ url: '/pages/square/square' })
		}

		/** 跳转到成就页 */
		function goAchievement() {
			uni.reLaunch({ url: '/pages/achievement/achievement' })
		}

		/** 跳转到冒险任务页 */
		function goTask() {
			uni.reLaunch({ url: '/pages/task/task' })
		}

		/** 发射到云空间 */
		async function shareToCloud(item) {
			uni.showLoading({ title: '正在发射到云空间～', mask: true })
			try {
				const userProfile = uni.getStorageSync('userProfile') || { nickname: '小朋友', avatar: '👦' }
				let imageUrl = item.imageUrl || item.drawing_url || item.image_url || ''
				if (!imageUrl) {
					throw new Error('小伙伴图片不存在，无法发射')
				}

				// App 本地绘画路径无法被云函数直接读取，先上传为永久云文件。
				if (isLocalImagePath(imageUrl)) {
					imageUrl = await uploadLocalImage(imageUrl)
				}

				const res = await uniCloud.callFunction({
					name: 'square_api',
					data: {
						action: 'add',
						payload: {
							name: item.name || '小伙伴',
							description: item.description || '可爱的小伙伴',
							imageUrl: imageUrl,
							creatorName: userProfile.nickname,
							creatorAvatar: userProfile.avatar,
							personality: item.personality || '',
							specialty: item.specialty || item.talent || ''
						}
					}
				})

				uni.hideLoading()
				if (res.result && !res.result.error) {
					uni.showToast({ title: '发射成功！小伙伴已经到云空间啦～', icon: 'none', duration: 2000 })
				} else {
					uni.showToast({ title: '发射失败，请再试一次～', icon: 'none' })
				}
			} catch (e) {
				uni.hideLoading()
				console.error('发射失败:', e)
				uni.showToast({ title: '发射失败，请再试一次～', icon: 'none' })
			}
		}

		function isLocalImagePath(value) {
			const path = String(value || '')
			return path.startsWith('_doc/') || path.startsWith('_downloads/') || path.startsWith('file://') || path.startsWith('blob:') || /^https?:\/\/(localhost|127\.0\.0\.1)(?::|\/)/i.test(path)
		}

		function getImageExtension(value) {
			const match = String(value || '').match(/\.(png|jpe?g|webp)(?:[?#].*)?$/i)
			return match ? '.' + match[1].toLowerCase() : '.png'
		}

		async function uploadLocalImage(imagePath) {
			const ext = getImageExtension(imagePath)
			try {
				const uploadResult = await uniCloud.uploadFile({
					filePath: imagePath,
					cloudPath: 'companion_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8) + ext
				})
				if (uploadResult && uploadResult.fileID) return uploadResult.fileID
				throw new Error('云存储未返回 fileID')
			} catch (uploadError) {
				// H5 的 blob/http 本地地址不一定能直接交给 uniCloud.uploadFile，
				// 转成 data URL 后交由 square_api 在服务端上传。
				if (!/^https?:\/\/|^blob:/i.test(String(imagePath || ''))) throw uploadError
				const response = await fetch(imagePath)
				if (!response.ok) throw uploadError
				const blob = await response.blob()
				const base64 = await new Promise((resolve, reject) => {
					const reader = new FileReader()
					reader.onload = () => resolve(String(reader.result || ''))
					reader.onerror = reject
					reader.readAsDataURL(blob)
				})
				return base64
			}
		}

		return {
			companions,
			searchText,
			scrollIntoView,
			highlightIndex,
			loadData,
			handleTitleTap,
			doSearch,
			getCardBg,
			getChatBtn,
			getStoryBtn,
			getCompanionName,
			getCompanionImage,
			getCompanionDesc,
			speakDesc,
			getCreateDate,
			goDraw,
			goChat,
			goStory,
			goSettings,
			goBond,
			goSquare,
			goAchievement,
			goTask,
			shareToCloud
		}
	},
	onShow() {
		this.loadData()
	}
}
</script>

<style scoped>
/* ==================== 字体声明 ==================== */
@font-face {
	font-family: 'MaokenZhuyuan';
	src: url('/static/font/maoken-zhuyuan.ttf') format('truetype');
	font-weight: normal;
	font-style: normal;
	font-display: swap;
}

@font-face {
	font-family: 'Kangkang';
	src: url('/static/font/sucaijishi-kangkang.ttf') format('truetype');
	font-weight: normal;
	font-style: normal;
	font-display: swap;
}

.gallery-page {
	display: flex;
	flex-direction: column;
	width: 100vw;
	height: 100vh;
	position: relative;
	overflow: hidden;
	background-color: #FFF9EC;
}

.page-bg {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	z-index: 1;
}

/* ==================== 顶部头部区域 ==================== */
.top-header {
	position: relative;
	z-index: 80;
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 90rpx 120rpx 1rpx;
}

.title-img {
	height: 160rpx;
	cursor: pointer;
}

.bond-entry-btn {
	width: 164rpx;
	height: 164rpx;
	margin-right: -108rpx;
	cursor: pointer;
	transition: transform 0.15s ease;
}

.bond-entry-btn:active {
	transform: scale(0.95);
}

.search-box {
	display: flex;
	align-items: center;
	background-color: #FFFFFF;
	border-radius: 100rpx;
	border: 3rpx solid #D4A574;
	padding: 0 24rpx;
	width: 720rpx;
	height: 150rpx;
	box-shadow: 0 4rpx 12rpx rgba(139, 74, 32, 0.1);
}

.search-icon {
	width: 100rpx;
	height: 100rpx;
	margin-right: 40rpx;
}

.search-input {
	flex: 1;
	height: 64rpx;
	font-size: 50rpx;
	color: #5A3010;
}

.search-input::placeholder {
	color: #C0A080;
}

/* ==================== 内容区域 ==================== */
.content-area {
	position: absolute;
	left: 0;
	right: 0;
	top: 1rpx;
	bottom: 135rpx;
	z-index: 10;
	overflow: hidden;
	padding: 0;
}

/* 空状态 */
.empty-state {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 100%;
}

.create-card {
	width: 560rpx;
	height: 620rpx;
	cursor: pointer;
	transition: transform 0.2s ease;
}

.create-card:active {
	transform: scale(0.95);
}

/* 横向滚动区域 */
.companion-scroll {
	width: 100%;
	height: 100%;
	white-space: nowrap;
	cursor: grab;
}

.companion-scroll:active {
	cursor: grabbing;
}

.scroll-content {
	display: inline-flex;
	align-items: center;
	gap: 100rpx;
	height: 100%;
	padding: 0 120rpx;
	box-sizing: border-box;
}

/* 创造新伙伴卡片外层 */
.create-card-wrap {
	width: 820rpx;
	height: 780rpx;
	flex-shrink: 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: flex-start;
}

.create-card-small {
	width: 1500rpx;
	height: 900rpx;
	flex-shrink: 0;
	cursor: pointer;
	transition: transform 0.2s ease;
}

.create-card-small:active {
	transform: scale(0.95);
}

/* ==================== 小伙伴卡片 ==================== */
.companion-card-wrap {
	width: 800rpx;
	height: 760rpx;
	flex-shrink: 0;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.companion-card {
	position: relative;
	width: 800rpx;
	height: 900rpx;
	flex-shrink: 0;
	transition: transform 0.3s ease;
}

.companion-card.highlight {
	transform: scale(1.08);
}

.card-bg {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	z-index: 0;
}

.card-content {
	position: absolute;
	left: 0;
	top: 0;
	width: 100%;
	height: 100%;
	z-index: 1;
}

.companion-image {
	position: absolute;
	left: 50%;
	top: 100rpx;
	transform: translateX(-50%);
	width: 500rpx;
	height: 360rpx;
	border-radius: 16rpx;
	background-color: transparent;
}

.name-tag {
	position: absolute;
	left: 48%;
	top: 530rpx;
	transform: translateX(-50%);
	width: 400rpx;
	height: 70rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: transparent;
	padding: 0;
	margin: 0;
}

.companion-name {
	font-family: 'Kangkang', 'MaokenZhuyuan', 'Comic Sans MS', sans-serif;
	font-size: 60rpx;
	font-weight: normal;
	color: #000000;
	text-align: center;
	width: 100%;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.desc-row {
	position: absolute;
	left: 50%;
	top: 640rpx;
	transform: translateX(-50%);
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 16rpx;
	width: 430rpx;
	margin: 0;
}

.companion-desc {
	font-family: 'MaokenZhuyuan', 'Kangkang', sans-serif;
	font-size: 40rpx;
	color: #7A3E18;
	max-width: 400rpx;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	text-align: center;
}

.speaker-icon {
	width: 70rpx;
	height: 70rpx;
	cursor: pointer;
	flex-shrink: 0;
}

.btn-row {
	position: absolute;
	left: 48%;
	top: 726rpx;
	transform: translateX(-50%);
	display: flex;
	gap: 32rpx;
	margin: 0;
}

.action-btn {
	width: 300rpx;
	height: 85rpx;
	cursor: pointer;
	transition: transform 0.15s ease;
}

.action-btn:active {
	transform: scale(0.95);
}

.create-date {
	font-family: 'MaokenZhuyuan', 'Kangkang', sans-serif;
	font-size: 36rpx;
	color: #5A3010;
	margin-top: 12rpx;
	text-align: center;
}

/* ==================== 云朵发射按钮 ==================== */
.cloud-share-btn {
	position: absolute;
	right: 35rpx;
	top: 25rpx;
	min-width: 150rpx;
	height: 56rpx;
	padding: 0 22rpx;
	border-radius: 40rpx;
	background: #EAF8FF;
	border: 4rpx solid #8B4A20;
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 8;
	box-shadow: 0 4rpx 0 rgba(139, 74, 32, 0.25);
	cursor: pointer;
	transition: transform 0.15s ease;
}

.cloud-share-btn:active {
	transform: scale(0.95);
}

.cloud-share-text {
	font-family: 'MaokenZhuyuan', 'Kangkang', sans-serif;
	font-size: 26rpx;
	font-weight: bold;
	color: #5A3010;
}

/* ==================== 底部导航栏 ==================== */
.bottom-nav {
	position: absolute;
	left: 50%;
	bottom: 24rpx;
	transform: translateX(-50%);
	z-index: 20;
	display: flex;
	justify-content: center;
	align-items: flex-end;
	gap: 72rpx;
	padding: 0;
	background: transparent;
	border-top: none;
}

.nav-item {
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	padding: 0;
	width: 200rpx;
	height: 200rpx;
}

.nav-icon {
	width: 200rpx;
	height: 200rpx;
}

.nav-text {
	display: none;
}
</style>
