<template>
	<view class="square-page">
		<!-- 背景图片 -->
		<image class="page-bg" src="/static/ui/square/square-bg.png" mode="aspectFill" />

		<!-- 顶部头部区域 -->
		<view class="top-header">
			<!-- 左侧标题 -->
			<image
				class="title-img"
				src="/static/ui/square/title-square.png"
				mode="heightFix"
				@tap="handleTitleTap"
			/>

			<!-- 右侧搜索框 -->
			<view class="search-box">
				<image class="search-icon" src="/static/ui/square/icon-search.png" mode="widthFix" @tap="doSearch" />
				<input
					class="search-input"
					v-model="searchText"
					placeholder="搜索你的小伙伴"
					@confirm="doSearch"
				/>
			</view>
		</view>

		<!-- 内容区域 -->
		<view class="square-content">
			<!-- 加载中 -->
			<view v-if="loading" class="empty-state">
				<text class="empty-text">正在加载广场...</text>
			</view>

			<!-- 空状态 -->
			<view v-else-if="list.length === 0" class="empty-state">
				<text class="empty-text">还没有小伙伴来广场玩～</text>
			</view>

			<!-- 小伙伴网格列表 -->
			<scroll-view
				v-else
				class="square-scroll"
				scroll-y
				:scroll-into-view="scrollIntoView"
				scroll-with-animation
			>
				<view class="square-grid">
					<view
						v-for="(item, index) in list"
						:key="item._id"
						:id="'square-card-' + index"
						class="square-card"
						:class="{ highlight: highlightIndex === index }"
						@tap="goChat(item)"
					>
						<!-- 卡片背景 -->
						<image class="card-bg" :src="getSquareCardFrame(index)" mode="scaleToFill" />

						<!-- 小伙伴名称 -->
						<text class="card-name">{{ getSquareName(item) }}</text>

						<!-- 小伙伴图片 -->
						<image class="card-image" :src="getSquareImage(item)" mode="aspectFit" />

						<!-- 来源文字 -->
						<text class="card-source">来自：{{ getCreatorName(item) }}</text>
					</view>
				</view>
			</scroll-view>
		</view>

		<!-- 底部导航栏 -->
		<view class="bottom-nav">
			<view class="nav-item" @tap="goSettings">
				<image class="nav-icon" src="/static/ui/gallery/tab-me-normal.png" mode="widthFix" />
			</view>
			<view class="nav-item" @tap="goGallery">
				<image class="nav-icon" src="/static/ui/gallery/tab-gallery-normal.png" mode="widthFix" />
			</view>
			<view class="nav-item active">
				<image class="nav-icon" src="/static/ui/gallery/tab-square-active.png" mode="widthFix" />
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
		const list = ref([])
		const loading = ref(true)
		const searchText = ref('')
		const scrollIntoView = ref('')
		const highlightIndex = ref(-1)

		/** 广场卡片框数组 */
		const squareCardFrames = [
			'/static/ui/square/square-card-1.png',
			'/static/ui/square/square-card-2.png',
			'/static/ui/square/square-card-3.png',
			'/static/ui/square/square-card-4.png',
			'/static/ui/square/square-card-5.png',
			'/static/ui/square/square-card-6.png',
			'/static/ui/square/square-card-7.png',
			'/static/ui/square/square-card-8.png'
		]

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

		/** 拉取广场数据 */
		async function loadData() {
			loading.value = true
			try {
				const res = await uniCloud.callFunction({
					name: 'square_api',
					data: { action: 'getList' }
				})
				const result = res && res.result ? res.result : {}
				const records = Array.isArray(result.data) ? result.data : []
				list.value = await resolveImageUrls(records)
				if (result.degraded) {
					console.warn('[square_api] 广场数据库未配置，已使用空列表')
				}
			} catch (e) {
				console.error('加载广场失败:', e)
				list.value = []
				uni.showToast({ title: '加载失败', icon: 'none' })
			} finally {
				loading.value = false
			}
		}

		/** 点击标题 */
		function handleTitleTap() {
			speak('小伙伴广场，发现全世界小朋友的小伙伴')
		}

		/** 搜索功能 */
		function doSearch() {
			if (!searchText.value.trim()) {
				uni.showToast({ title: '先输入小伙伴名字吧～', icon: 'none' })
				return
			}

			const keyword = searchText.value.trim()
			const index = list.value.findIndex(item => {
				const name = item.name || item.character_name || ''
				return name.includes(keyword)
			})

			if (index === -1) {
				uni.showToast({ title: '没有找到这个小伙伴～', icon: 'none' })
				return
			}

			// 滚动到对应卡片
			scrollIntoView.value = 'square-card-' + index

			// 高亮动画
			highlightIndex.value = index
			setTimeout(() => {
				highlightIndex.value = -1
			}, 1200)
		}

		/** 获取广场卡片框 */
		function getSquareCardFrame(index) {
			return squareCardFrames[index % 8]
		}

		/** 获取广场小伙伴名称 */
		function getSquareName(item) {
			const name = item.name || item.character_name || '小伙伴'
			return name.length > 6 ? name.slice(0, 6) + '...' : name
		}

		/** 获取广场小伙伴图片 */
		function getSquareImage(item) {
			return item.imageUrl || item.imageFileID || item.drawing_url || item.image_url || item.avatar || item.image || item.drawingUrl || ''
		}

		async function resolveImageUrls(records) {
			const fileIDs = records
				.map(item => item.imageFileID || item.imageUrl)
				.filter(isCloudFileID)
			if (fileIDs.length === 0) return records

			try {
				const result = await uniCloud.getTempFileURL({ fileList: [...new Set(fileIDs)] })
				const urlMap = {}
				;(result.fileList || []).forEach(file => {
					const id = file.fileID || file.fileId
					if (id && file.tempFileURL) urlMap[id] = file.tempFileURL
				})
				return records.map(item => {
					const id = item.imageFileID || item.imageUrl
					return urlMap[id] ? { ...item, imageUrl: urlMap[id] } : item
				})
			} catch (error) {
				console.error('[square] 图片临时链接获取失败:', error)
				return records
			}
		}

		function isCloudFileID(value) {
			const id = String(value || '')
			return id.startsWith('cloud://') || id.startsWith('cloudFiles/') || id.startsWith('fileID:')
		}

		/** 获取创作者名称 */
		function getCreatorName(item) {
			return item.creator_name || item.creatorNickname || item.nickname || item.user_nickname || item.creator || item.creatorName || '小朋友'
		}

		/** 点击卡片：暂存数据并跳转聊天 */
		function goChat(item) {
			uni.setStorageSync('tempSquareCompanion', {
				id: item._id,
				name: item.name,
				description: item.description,
				imageUrl: item.imageUrl || item.imageFileID || item.drawing_url || item.image_url,
				imageFileID: item.imageFileID || (isCloudFileID(item.imageUrl) ? item.imageUrl : ''),
				creatorName: item.creatorName || item.creator_name,
				creatorAvatar: item.creatorAvatar,
				personality: item.personality || '',
				specialty: item.specialty || '',
				messages: []
			})
			uni.navigateTo({ url: '/pages/chat/chat?source=square' })
		}

		/** 跳转到我的 */
		function goSettings() {
			uni.reLaunch({ url: '/pages/settings/settings' })
		}

		/** 跳转到我的伙伴 */
		function goGallery() {
			uni.reLaunch({ url: '/pages/gallery/gallery' })
		}

		/** 跳转到成就 */
		function goAchievement() {
			uni.reLaunch({ url: '/pages/achievement/achievement' })
		}

		/** 跳转到冒险 */
		function goTask() {
			uni.reLaunch({ url: '/pages/task/task' })
		}

		return {
			list,
			loading,
			searchText,
			scrollIntoView,
			highlightIndex,
			loadData,
			handleTitleTap,
			doSearch,
			getSquareCardFrame,
			getSquareName,
			getSquareImage,
			getCreatorName,
			goChat,
			goSettings,
			goGallery,
			goAchievement,
			goTask
		}
	},
	onShow() {
		this.loadData()
	}
}
</script>

<style scoped>
.square-page {
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
	z-index: 10;
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 90rpx 120rpx 1rpx;
}

.title-img {
	height: 150rpx;
	cursor: pointer;
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
	cursor: pointer;
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
.square-content {
	position: absolute;
	left: 0rpx;
	right: 0;
	top: 288rpx;
	bottom: 100rpx;
	z-index: 10;
	overflow: hidden;
}

/* 空状态 */
.empty-state {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 100%;
}

.empty-text {
	font-size: 36rpx;
	color: #C0A080;
}

/* 滚动区域 */
.square-scroll {
	width: 100%;
	height: 100%;
}

/* 网格容器 */
.square-grid {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	column-gap: 0rpx;
	row-gap: 0rpx;
	padding: 40rpx 270rpx 60rpx;
	box-sizing: border-box;
}

/* 广场卡片 */
.square-card {
	position: relative;
	width: 440rpx;
	height: 550rpx;
	transition: transform 0.2s ease;
	cursor: pointer;
}

.square-card.highlight {
	transform: scale(1.08);
}

.card-bg {
	position: absolute;
	left: 0;
	top: 0;
	width: 100%;
	height: 100%;
	z-index: 0;
}

.card-name {
	position: absolute;
	left: 47%;
	top: 25rpx;
	transform: translateX(-50%);
	width: 220rpx;
	text-align: center;
	font-size: 45rpx;
	font-weight: bold;
	color: #000000;
	z-index: 2;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.card-image {
	position: absolute;
	left: 48%;
	top: 150rpx;
	transform: translateX(-50%);
	width: 330rpx;
	height: 200rpx;
	z-index: 2;
}

.card-source {
	position: absolute;
	left: 45%;
	bottom: 68rpx;
	transform: translateX(-50%);
	width: 260rpx;
	text-align: center;
	font-size: 28rpx;
	color: #7A3E18;
	z-index: 2;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
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
</style>
