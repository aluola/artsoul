<template>
	<view class="loading-page" @tap="handleTap">
		<!-- 背景图片 -->
		<image class="loading-bg" src="/static/ui/loading-cover.png" mode="aspectFill"></image>

		<!-- 底部加载区域 -->
		<view class="loading-area">
			<!-- 进度条外框 -->
			<view class="progress-shell">
				<!-- 进度条填充 -->
				<view class="progress-fill" :style="{ width: progress + '%' }"></view>
				<!-- 百分比文字 -->
				<text class="progress-text" v-if="!isReady">{{ progress }}%</text>
			</view>

			<!-- 完成提示文字 -->
			<view class="continue-wrapper" v-if="isReady">
				<text class="continue-text">点击任意位置继续</text>
			</view>
		</view>
	</view>
</template>

<script>
import { ref, onMounted } from 'vue'

export default {
	setup() {
		const progress = ref(0)
		const isReady = ref(false)
		let timer = null

		/** 开始加载动画 */
		function startLoading() {
			const totalDuration = 2800 // 总时长 2.8 秒
			const interval = 30 // 每 30ms 更新一次
			const steps = totalDuration / interval
			const increment = 100 / steps

			timer = setInterval(() => {
				if (progress.value < 100) {
					progress.value = Math.min(100, Math.round(progress.value + increment))
				} else {
					clearInterval(timer)
					timer = null
					isReady.value = true
				}
			}, interval)
		}

		/** 判断用户是否已完成登录/资料设置 */
		function isUserLoggedIn() {
			// 优先检查现有用户资料 key
			const profile = uni.getStorageSync('userProfile')
			if (profile && (profile.nickname || profile.avatar)) {
				return true
			}

			// 再检查 huaban_onboarding_done
			const onboardingDone = uni.getStorageSync('huaban_onboarding_done')
			if (onboardingDone) {
				return true
			}

			// 如果都没有，则认为是首次登录
			return false
		}

		/** 处理点击事件 */
		function handleTap() {
			// 加载未完成前点击不要跳转
			if (!isReady.value) return

			// 判断跳转目标
			if (isUserLoggedIn()) {
				// 已登录用户，跳转到我的小伙伴页
				uni.reLaunch({ url: '/pages/gallery/gallery' })
			} else {
				// 首次使用用户，跳转到登录页1（年龄选择页）
				uni.reLaunch({ url: '/pages/login/age/age' })
			}
		}

		onMounted(() => {
			startLoading()
		})

		return {
			progress,
			isReady,
			handleTap
		}
	}
}
</script>

<style scoped>
.loading-page {
	display: flex;
	flex-direction: column;
	width: 100vw;
	height: 100vh;
	background-color: #FFF9EC;
	position: relative;
	overflow: hidden;
}

.loading-bg {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	z-index: 1;
}

.loading-area {
	position: absolute;
	bottom: 120rpx;
	left: 0;
	width: 100%;
	display: flex;
	flex-direction: column;
	align-items: center;
	z-index: 10;
}

.progress-shell {
	width: 600rpx;
	height: 48rpx;
	background-color: #FFFDF7;
	border-radius: 999rpx;
	border: 4rpx solid #8B4A20;
	box-shadow: 0 4rpx 12rpx rgba(139, 74, 32, 0.2);
	position: relative;
	overflow: hidden;
}

.progress-fill {
	height: 100%;
	background: linear-gradient(90deg, #FF8A5C, #FFB36B);
	border-radius: 999rpx;
	transition: width 0.03s linear;
}

.progress-text {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	font-size: 24rpx;
	font-weight: bold;
	color: #7A3E18;
	text-shadow: 0 1rpx 2rpx rgba(255, 255, 255, 0.6);
}

.continue-wrapper {
	margin-top: 32rpx;
	animation: blink 1.2s ease-in-out infinite;
}

.continue-text {
	font-size: 32rpx;
	font-weight: bold;
	color: #7A3E18;
	text-shadow: 0 2rpx 4rpx rgba(122, 62, 24, 0.15);
}

@keyframes blink {
	0%, 100% {
		opacity: 1;
	}
	50% {
		opacity: 0.4;
	}
}
</style>
