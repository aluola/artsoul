<template>
	<view class="settings-page">
		<!-- 背景图片 -->
		<image class="page-bg" src="/static/ui/square/settings/settings-bg.png" mode="aspectFill" />

		<!-- 左上角保存退出按钮 -->
		<image
			class="save-exit-btn"
			src="/static/ui/square/settings/btn-save-exit.png"
			mode="widthFix"
			@tap="goGallery"
		/>

		<!-- 主卡片面板 -->
		<view class="main-card">
			<!-- 用户信息区 -->
			<view class="user-info-section">
				<!-- 左侧头像 -->
				<view class="avatar-wrapper">
					<image class="user-avatar" :src="avatarSrc" mode="aspectFit" />
				</view>

				<!-- 中间信息 -->
				<view class="user-details">
					<text class="user-nickname">{{ nickname }}</text>
					<text class="user-info-line">注册时间：{{ registerTime }}</text>
					<text class="user-info-line">年龄段：{{ ageRange }}</text>
					<text class="user-info-line">性别：{{ gender }}</text>
				</view>

				<!-- 右侧修改按钮 -->
				<image
					class="edit-profile-btn"
					src="/static/ui/square/settings/btn-edit-profile.png"
					mode="widthFix"
					@tap="goEditProfile"
				/>
			</view>

			<!-- 相册部分 -->
			<view class="album-section">
				<scroll-view class="album-scroll" scroll-x>
					<view class="album-content">
						<view
							v-for="(item, index) in companions"
							:key="item.id"
							class="photo-item"
						>
							<image class="photo-frame" :src="getPhotoFrame(index)" mode="scaleToFill" />
							<image class="photo-image" :src="getCompanionImage(item)" mode="aspectFill" />
						</view>
						<view v-if="companions.length === 0" class="empty-album">
							<text class="empty-text">还没有小伙伴哦～</text>
						</view>
					</view>
				</scroll-view>
			</view>

			<!-- 成就展板 -->
			<view class="achievement-section">
				<view class="badge-row">
					<view
						v-for="badge in achievements"
						:key="badge.key"
						class="badge-item"
					>
						<image class="badge-img" :src="badge.img" mode="aspectFit" />
					</view>
				</view>
			</view>
		</view>

		<!-- 底部导航栏 -->
		<view class="bottom-nav">
			<view class="nav-item active">
				<image class="nav-icon" src="/static/ui/gallery/tab-me-active.png" mode="widthFix" />
			</view>
			<view class="nav-item" @tap="goGallery">
				<image class="nav-icon" src="/static/ui/gallery/tab-gallery-normal.png" mode="widthFix" />
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
import { ref, computed } from 'vue'

export default {
	setup() {
		const nickname = ref('小画家')
		const avatarKey = ref('pig')
		const ageRange = ref('未选择')
		const gender = ref('未选择')
		const registerTime = ref('')
		const companions = ref([])

		/** 头像映射 */
		const avatarMap = {
			'pig': '/static/ui/login/profile/avatar-pig-active.png',
			'dino_green': '/static/ui/login/profile/avatar-dino-green-active.png',
			'dino_hat': '/static/ui/login/profile/avatar-dino-hat-active.png',
			'lion': '/static/ui/login/profile/avatar-lion-active.png'
		}

		/** 计算头像路径 */
		const avatarSrc = computed(() => {
			return avatarMap[avatarKey.value] || avatarMap['pig']
		})

		/** 相框数组 */
		const photoFrames = [
			'/static/ui/square/settings/photo-frame-1.png',
			'/static/ui/square/settings/photo-frame-2.png',
			'/static/ui/square/settings/photo-frame-3.png'
		]

		/** 成就数组 */
		const achievements = [
			{ key: 'first_work', img: '/static/ui/square/settings/badge-first-work.png', unlocked: true },
			{ key: 'imagination', img: '/static/ui/square/settings/badge-imagination.png', unlocked: true },
			{ key: 'story_creator', img: '/static/ui/square/settings/badge-story-creator.png', unlocked: true },
			{ key: 'inventor', img: '/static/ui/square/settings/badge-inventor.png', unlocked: true }
		]

		/** 加载用户数据 */
		function loadUserData() {
			// 读取用户资料
			const profile = uni.getStorageSync('userProfile') || {}
			nickname.value = profile.nickname || uni.getStorageSync('huaban_user_nickname') || '小画家'
			avatarKey.value = profile.avatar || uni.getStorageSync('huaban_user_avatar') || 'pig'

			// 年龄段
			const age = profile.ageRange || uni.getStorageSync('huaban_user_age_range')
			if (age === '3-5') {
				ageRange.value = '3-5岁'
			} else if (age === '6-8') {
				ageRange.value = '6-8岁'
			} else {
				ageRange.value = '未选择'
			}

			// 性别
			const g = profile.gender || uni.getStorageSync('huaban_user_gender')
			if (g === 'boy') {
				gender.value = '男孩子'
			} else if (g === 'girl') {
				gender.value = '女孩子'
			} else {
				gender.value = '未选择'
			}

			// 注册时间
			let regTime = profile.registerTime || uni.getStorageSync('huaban_register_time')
			if (!regTime) {
				// 生成当前日期作为注册时间
				const now = new Date()
				regTime = now.getFullYear() + '/' + String(now.getMonth() + 1).padStart(2, '0') + '/' + String(now.getDate()).padStart(2, '0')
				uni.setStorageSync('huaban_register_time', regTime)
				// 合并到 userProfile
				const oldProfile = uni.getStorageSync('userProfile') || {}
				oldProfile.registerTime = regTime
				uni.setStorageSync('userProfile', oldProfile)
			}
			registerTime.value = regTime

			// 加载小伙伴列表
			companions.value = uni.getStorageSync('companions') || []
		}

		/** 获取相框 */
		function getPhotoFrame(index) {
			return photoFrames[index % 3]
		}

		/** 获取小伙伴图片 */
		function getCompanionImage(item) {
			return item.imageUrl || item.drawing_url || item.image_url || item.avatar || item.image || item.drawingUrl || ''
		}

		/** 跳转到我的小伙伴页 */
		function goGallery() {
			const pages = getCurrentPages()
			if (pages && pages.length > 1) {
				uni.navigateBack({ delta: 1 })
			} else {
				uni.reLaunch({ url: '/pages/gallery/gallery' })
			}
		}

		/** 跳转到修改个人信息 */
		function goEditProfile() {
			uni.navigateTo({ url: '/pages/login/age/age?mode=edit' })
		}

		/** 跳转到广场 */
		function goSquare() {
			uni.reLaunch({ url: '/pages/square/square' })
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
			nickname,
			avatarKey,
			avatarSrc,
			ageRange,
			gender,
			registerTime,
			companions,
			achievements,
			loadUserData,
			getPhotoFrame,
			getCompanionImage,
			goGallery,
			goEditProfile,
			goSquare,
			goAchievement,
			goTask
		}
	},
	onShow() {
		this.loadUserData()
	}
}
</script>

<style scoped>
.settings-page {
	display: flex;
	flex-direction: column;
	width: 100vw;
	height: 100vh;
	position: relative;
	overflow: hidden;
	background-color: #FFE47A;
}

.page-bg {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	z-index: 1;
}

/* ==================== 左上角保存退出 ==================== */
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

/* ==================== 主卡片面板（透明定位容器） ==================== */
.main-card {
	position: absolute;
	left: 360rpx;
	top: 320rpx;
	width: 1700rpx;
	height: 1000rpx;
	z-index: 10;
	background: transparent;
	border: none;
	box-shadow: none;
	border-radius: 0;
	padding: 0;
	box-sizing: border-box;
}

/* ==================== 用户信息区 ==================== */
.user-info-section {
	position: absolute;
	left: 40rpx;
	top: 0rpx;
	width: 1500rpx;
	height: 190rpx;
	display: block;
	padding: 0;
	border-bottom: none;
}

.avatar-wrapper {
	position: absolute;
	left: 0rpx;
	top: 0rpx;
	width: 225rpx;
	height: 225rpx;
	border-radius: 50%;
	overflow: hidden;
	border: 4rpx solid #D4A574;
	background-color: #FFFFFF;
}

.user-avatar {
	width: 100%;
	height: 100%;
}

.user-details {
	position: absolute;
	left: 280rpx;
	top: 0;
	display: flex;
	flex-direction: column;
	gap: 15rpx;
}

.user-nickname {
	font-size: 56rpx;
	font-weight: bold;
	color: #5A3010;
	line-height: 1.1;
}

.user-info-line {
	font-size: 28rpx;
	color: #7A3E18;
	line-height: 1.25;
}

.edit-profile-btn {
	position: absolute;
	right: -80rpx;
	top: 150rpx;
	width: 280rpx;
	cursor: pointer;
	transition: transform 0.15s ease;
}

.edit-profile-btn:active {
	transform: scale(0.95);
}

/* ==================== 相册部分 ==================== */
.album-section {
	position: absolute;
	left: 40rpx;
	top: 280rpx;
	width: 1500rpx;
	height: 500rpx;
	overflow: visible;
}

.section-title {
	font-size: 34rpx;
	font-weight: bold;
	color: #5A3010;
	margin-bottom: 18rpx;
	display: block;
}

.album-scroll {
	width: 100%;
	height: 360rpx;
	white-space: nowrap;
}

.album-content {
	display: inline-flex;
	gap: 55rpx;
	height: 100%;
	align-items: flex-start;
	padding: 0;
}

.photo-item {
	position: relative;
	width: 360rpx;
	height: 280rpx;
	flex-shrink: 0;
}

.photo-frame {
	position: absolute;
	top: 70rpx;
	left: 0;
	width: 100%;
	height: 100%;
	z-index: 1;
}

.photo-image {
	position: absolute;
	left: 50%;
	top: 75%;
	transform: translate(-50%, -50%);
	width: 320rpx;
	height: 220rpx;
	z-index: 2;
	border-radius: 12rpx;
	object-fit: cover;
}

.empty-album {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 100%;
}

.empty-text {
	display: none;
}

/* ==================== 成就展板 ==================== */
.achievement-section {
	position: absolute;
	left: 60rpx;
	top: 740rpx;
	width: 1400rpx;
	height: 360rpx;
	overflow: visible;
}

.badge-row {
	display: flex;
	justify-content: flex-start;
	align-items: center;
	gap: 80rpx;
	overflow: visible;
}

.badge-item {
	width: 260rpx;
	height: 260rpx;
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	overflow: visible;
}

.badge-img {
	width: 260rpx !important;
	height: 260rpx !important;
	display: block;
	transform: scale(1.15);
	transform-origin: center center;
}

/* ==================== 底部导航栏（复用 gallery.vue 参数） ==================== */
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
