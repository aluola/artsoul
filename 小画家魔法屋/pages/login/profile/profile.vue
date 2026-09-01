<template>
	<view class="profile-page">
		<!-- 背景图片 -->
		<image class="page-bg" src="/static/ui/login/profile/login-profile-bg.png" mode="aspectFill" />

		<!-- 顶部标题图片 -->
		<image
			class="title-img"
			src="/static/ui/login/profile/login-profile-title.png"
			mode="widthFix"
			@tap="handleTitleTap"
		/>

		<!-- 主面板区域 -->
		<view class="card-panel-wrap">
			<!-- 黄色卡片背景 -->
			<image class="card-panel-bg" src="/static/ui/login/profile/card-panel.png" mode="scaleToFill" />

			<!-- 面板内容 -->
			<view class="panel-content">
				<!-- 头像区域头部：标题 + 换一批 -->
				<view class="avatar-title-row">
					<image class="choose-avatar-text" src="/static/ui/login/profile/text-choose-avatar.png" mode="heightFix" />
					<view class="refresh-action" @tap="handleRefresh">
						<image
							class="refresh-icon"
							:class="{ rotating: isRotating }"
							src="/static/ui/login/profile/icon-refresh.png"
							mode="widthFix"
						/>
						<image class="refresh-text" src="/static/ui/login/profile/text-refresh.png" mode="heightFix" />
					</view>
				</view>

				<!-- 头像选择区域 -->
				<view class="avatar-row">
					<image
						v-for="avatar in avatarList"
						:key="avatar.key"
						class="avatar-item"
						:class="{ selected: selectedAvatar === avatar.key }"
						:src="selectedAvatar === avatar.key ? avatar.active : avatar.normal"
						mode="aspectFit"
						@tap="selectAvatar(avatar.key)"
					/>
				</view>

				<!-- 昵称标题 -->
				<image class="name-title" src="/static/ui/login/profile/text-ask-name.png" mode="heightFix" />

				<!-- 昵称输入框 -->
				<view class="input-wrapper">
					<input
						class="nickname-input"
						v-model="nickname"
						placeholder="输入你的昵称"
						maxlength="12"
					/>
				</view>

				<!-- 开启按钮 -->
				<image
					class="start-btn"
					src="/static/ui/login/profile/btn-start.png"
					mode="widthFix"
					@tap="goStart"
				/>
			</view>
		</view>
	</view>
</template>

<script>
import { ref } from 'vue'

export default {
	setup() {
		const selectedAvatar = ref('')
		const nickname = ref('')
		const isRotating = ref(false)

		/** 头像列表 */
		const avatarList = [
			{
				key: 'pig',
				normal: '/static/ui/login/profile/avatar-pig.png',
				active: '/static/ui/login/profile/avatar-pig-active.png'
			},
			{
				key: 'dino_green',
				normal: '/static/ui/login/profile/avatar-dino-green.png',
				active: '/static/ui/login/profile/avatar-dino-green-active.png'
			},
			{
				key: 'dino_hat',
				normal: '/static/ui/login/profile/avatar-dino-hat.png',
				active: '/static/ui/login/profile/avatar-dino-hat-active.png'
			},
			{
				key: 'lion',
				normal: '/static/ui/login/profile/avatar-lion.png',
				active: '/static/ui/login/profile/avatar-lion-active.png'
			}
		]

		/** 语音播报方法 */
		function speak(text) {
			// 检查是否在 H5 环境且支持 Web Speech API
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

			// 不支持语音时用 toast 显示文字
			uni.showToast({
				title: text,
				icon: 'none',
				duration: 2000
			})
		}

		/** 点击标题 */
		function handleTitleTap() {
			speak('小画家魔法屋，完善你的个人名片吧')
		}

		/** 选择头像 */
		function selectAvatar(key) {
			selectedAvatar.value = key
		}

		/** 点击换一批 */
		function handleRefresh() {
			isRotating.value = true
			setTimeout(() => {
				isRotating.value = false
			}, 600)
		}

		/** 点击开启小画家之旅 */
		function goStart() {
			if (!selectedAvatar.value) {
				uni.showToast({
					title: '先选一个头像吧～',
					icon: 'none'
				})
				return
			}

			if (!nickname.value.trim()) {
				uni.showToast({
					title: '先输入你的昵称吧～',
					icon: 'none'
				})
				return
			}

			// 保存头像和昵称到本地
			uni.setStorageSync('huaban_user_avatar', selectedAvatar.value)
			uni.setStorageSync('huaban_user_nickname', nickname.value.trim())

			// 合并到 userProfile，不覆盖已有字段
			const oldProfile = uni.getStorageSync('userProfile') || {}
			uni.setStorageSync('userProfile', {
				...oldProfile,
				avatar: selectedAvatar.value,
				nickname: nickname.value.trim()
			})

			// 标记 onboarding 已完成
			uni.setStorageSync('huaban_onboarding_done', true)

			// 跳转到我的小伙伴页
			uni.reLaunch({ url: '/pages/gallery/gallery' })
		}

		return {
			selectedAvatar,
			nickname,
			isRotating,
			avatarList,
			handleTitleTap,
			selectAvatar,
			handleRefresh,
			goStart
		}
	}
}
</script>

<style scoped>
.profile-page {
	display: flex;
	flex-direction: column;
	align-items: center;
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

.title-img {
	width: 880rpx;
	margin-top: 100rpx;
	z-index: 10;
	position: relative;
}

.card-panel-wrap {
	position: relative;
	width: 1500rpx;
	height: 1100rpx;
	margin-top: 40rpx;
	z-index: 10;
}

.card-panel-bg {
	position: absolute;
	left: 0;
	top: 0;
	width: 100%;
	height: 100%;
	z-index: 0;
}

.panel-content {
	position: absolute;
	left: 0;
	top: 0;
	width: 100%;
	height: 100%;
	z-index: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 150rpx 100rpx 50rpx;
	box-sizing: border-box;
}

.avatar-title-row {
	width: 100%;
	display: flex;
	justify-content: center;
	align-items: center;
	position: relative;
	margin-bottom: 60rpx;
}

.choose-avatar-text {
	height: 46rpx;
}

.refresh-action {
	position: absolute;
	right: 200rpx;
	top: 50%;
	transform: translateY(-50%);
	display: flex;
	align-items: center;
	gap: 8rpx;
	cursor: pointer;
}

.refresh-icon {
	width: 50rpx;
	height: 44rpx;
	transition: transform 0.6s ease;
}

.refresh-icon.rotating {
	animation: rotateOnce 0.6s ease;
}

@keyframes rotateOnce {
	from {
		transform: rotate(0deg);
	}
	to {
		transform: rotate(360deg);
	}
}

.refresh-text {
	height: 25rpx;
}

.avatar-row {
	display: flex;
	justify-content: center;
	gap: 50rpx;
	margin-bottom: 45rpx;
}

.avatar-item {
	width: 200rpx;
	height: 200rpx;
	transition: transform 0.2s ease;
	cursor: pointer;
}

.avatar-item.selected {
	transform: scale(1.1);
}

.avatar-item:active {
	transform: scale(0.95);
}

.name-title {
	height: 46rpx;
	margin-bottom: 50rpx;
}

.input-wrapper {
	width: 1000rpx;
	background-color: #FFFFFF;
	border-radius: 100rpx;
	border: 4rpx solid #8B4A20;
	padding: 0 40rpx;
	margin-bottom: 40rpx;
	box-shadow: 0 4rpx 12rpx rgba(139, 74, 32, 0.15);
}

.nickname-input {
	height: 100rpx;
	font-size: 36rpx;
	color: #5A3010;
	text-align: center;
}

.nickname-input::placeholder {
	color: #C0A080;
}

.start-btn {
	width: 1100rpx;
	transition: transform 0.15s ease;
	cursor: pointer;
}

.start-btn:active {
	transform: scale(0.95);
}
</style>
