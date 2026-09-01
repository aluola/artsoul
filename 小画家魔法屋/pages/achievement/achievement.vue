<template>
	<view class="achievement-page">
		<!-- 背景图片 -->
		<image class="page-bg" src="/static/ui/achievement/achievement-bg.png" mode="aspectFill" />

		<!-- 个人记录卡片区域 -->
		<view class="record-section">
			<!-- 小伙伴数量 -->
			<view class="record-card" @tap="speakRecord('companion')">
				<image class="record-bg" src="/static/ui/achievement/card-companion-count.png" mode="scaleToFill" />
				<text class="record-value companion-value">{{ companionCount }}</text>
			</view>

			<!-- 使用天数 -->
			<view class="record-card" @tap="speakRecord('usage')">
				<image class="record-bg" src="/static/ui/achievement/card-usage-days.png" mode="scaleToFill" />
				<text class="record-value usage-value">{{ usageDays }}</text>
			</view>

			<!-- 故事数量 -->
			<view class="record-card" @tap="speakRecord('story')">
				<image class="record-bg" src="/static/ui/achievement/card-story-count.png" mode="scaleToFill" />
				<text class="record-value story-value">{{ storyCount }}</text>
			</view>

			<!-- 亲密关系 -->
			<view class="record-card" @tap="speakRecord('intimacy')">
				<image class="record-bg" src="/static/ui/achievement/card-intimacy.png" mode="scaleToFill" />
				<text class="record-value intimacy-value">{{ intimacyPercent }}%</text>
			</view>
		</view>

		<!-- 成就勋章区域 -->
		<view class="badge-section">
			<view
				v-for="badge in badges"
				:key="badge.key"
				class="badge-item"
			>
				<image class="badge-img" :src="badge.img" mode="aspectFit" />
			</view>
		</view>

		<!-- 底部导航栏 -->
		<view class="bottom-nav">
			<view class="nav-item" @tap="goSettings">
				<image class="nav-icon" src="/static/ui/gallery/tab-me-normal.png" mode="widthFix" />
			</view>
			<view class="nav-item" @tap="goGallery">
				<image class="nav-icon" src="/static/ui/gallery/tab-gallery-normal.png" mode="widthFix" />
			</view>
			<view class="nav-item" @tap="goSquare">
				<image class="nav-icon" src="/static/ui/gallery/tab-square-normal.png" mode="widthFix" />
			</view>
			<view class="nav-item active">
				<image class="nav-icon" src="/static/ui/gallery/tab-achievement-active.png" mode="widthFix" />
			</view>
			<view class="nav-item" @tap="goTask">
				<image class="nav-icon" src="/static/ui/gallery/tab-adventure-normal.png" mode="widthFix" />
			</view>
		</view>
	</view>
</template>

<script>
import { ref, onMounted } from 'vue'

export default {
	setup() {
		// ======================== 记录数据 ========================
		const companionCount = ref(0)
		const usageDays = ref(1)
		const storyCount = ref(0)
		const intimacyPercent = ref(0)

		// ======================== 成就勋章 ========================
		const badges = [
			{ key: 'first_work', img: '/static/ui/square/settings/badge-first-work.png', unlocked: true },
			{ key: 'imagination', img: '/static/ui/square/settings/badge-imagination.png', unlocked: true },
			{ key: 'story_creator', img: '/static/ui/square/settings/badge-story-creator.png', unlocked: true },
			{ key: 'inventor', img: '/static/ui/square/settings/badge-inventor.png', unlocked: true }
		]

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

		function speakRecord(type) {
			if (type === 'companion') {
				speak('小伙伴数量' + companionCount.value + '个')
			} else if (type === 'usage') {
				speak('使用天数' + usageDays.value + '天')
			} else if (type === 'story') {
				speak('故事数量' + storyCount.value + '个')
			} else if (type === 'intimacy') {
				speak('亲密关系百分之' + intimacyPercent.value)
			}
		}

		// ======================== 数据加载 ========================
		function loadUserProfile() {
			const profile = uni.getStorageSync('userProfile') || {}
			let regTime = profile.registerTime || uni.getStorageSync('huaban_register_time')

			if (!regTime) {
				const now = new Date()
				regTime = now.getFullYear() + '/' + String(now.getMonth() + 1).padStart(2, '0') + '/' + String(now.getDate()).padStart(2, '0')
				uni.setStorageSync('huaban_register_time', regTime)
				const oldProfile = uni.getStorageSync('userProfile') || {}
				oldProfile.registerTime = regTime
				uni.setStorageSync('userProfile', oldProfile)
			}

			// 计算使用天数
			const regDate = new Date(regTime)
			const now = new Date()
			const diffTime = now.getTime() - regDate.getTime()
			const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
			usageDays.value = diffDays + 1
		}

		function loadCompanions() {
			const companions = uni.getStorageSync('companions') || []
			companionCount.value = companions.length
		}

		function loadStoryStats() {
			storyCount.value = uni.getStorageSync('huaban_story_count') || 0

			const storyCharIds = uni.getStorageSync('huaban_story_character_ids') || []
			const k = [...new Set(storyCharIds)].length
			const x = companionCount.value

			if (x === 0) {
				intimacyPercent.value = 0
			} else {
				intimacyPercent.value = Math.round(k / x * 100)
			}
		}

		// ======================== 导航跳转 ========================
		function goSettings() {
			uni.reLaunch({ url: '/pages/settings/settings' })
		}

		function goGallery() {
			uni.reLaunch({ url: '/pages/gallery/gallery' })
		}

		function goSquare() {
			uni.reLaunch({ url: '/pages/square/square' })
		}

		function goTask() {
			uni.reLaunch({ url: '/pages/task/task' })
		}

		// ======================== 生命周期 ========================
		onMounted(() => {
			loadUserProfile()
			loadCompanions()
			loadStoryStats()
		})

		return {
			companionCount,
			usageDays,
			storyCount,
			intimacyPercent,
			badges,
			speakRecord,
			goSettings,
			goGallery,
			goSquare,
			goTask
		}
	}
}
</script>

<style scoped>
.achievement-page {
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

/* ==================== 个人记录卡片区域 ==================== */
.record-section {
	position: absolute;
	left: 200rpx;
	right: 200rpx;
	top: 230rpx;
	z-index: 10;
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 0rpx;
}

.record-card {
	position: relative;
	width: 100%;
	height: 250rpx;
	cursor: pointer;
	transition: transform 0.15s ease;
}

.record-card:active {
	transform: scale(0.98);
}

.record-bg {
	position: absolute;
	left: 0;
	top: 0;
	width: 100%;
	height: 100%;
	z-index: 0;
}

.record-value {
	position: absolute;
	color: #FF5B2E;
	font-size: 70rpx;
	font-weight: bold;
	z-index: 2;
	line-height: 1;
}

.companion-value {
	left: 730rpx;
	top: 59rpx;
}

.usage-value {
	left: 720rpx;
	top: 60rpx;
}

.story-value {
	left: 730rpx;
	top: 60rpx;
}

.intimacy-value {
	left: 700rpx;
	top: 60rpx;
	font-size: 70rpx;
}

/* ==================== 成就勋章区域 ==================== */
.badge-section {
	position: absolute;
	left: 230rpx;
	right: auto;
	top: 830rpx;
	z-index: 10;
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 30rpx;
}

.badge-item {
	width: 460rpx;
	height: 460rpx;
}

.badge-img {
	width: 100%;
	height: 100%;
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
