<template>
	<view class="age-page">
		<!-- 背景图片 -->
		<image class="page-bg" src="/static/ui/login/age/login-age-bg.png" mode="aspectFill" />

		<!-- 顶部标题图片 -->
		<image
			class="title-img"
			src="/static/ui/login/age/login-age-title.png"
			mode="widthFix"
			@tap="handleTitleTap"
		/>

		<!-- 年龄卡片区域 -->
		<view class="card-row">
			<image
				class="age-card"
				:class="{ selected: selectedAge === '3-5' }"
				:src="selectedAge === '3-5' ? '/static/ui/login/age/age-card-3-5-active.png' : '/static/ui/login/age/age-card-3-5-normal.png'"
				mode="widthFix"
				@tap="selectAge('3-5')"
			/>
			<image
				class="age-card"
				:class="{ selected: selectedAge === '6-8' }"
				:src="selectedAge === '6-8' ? '/static/ui/login/age/age-card-6-8-active.png' : '/static/ui/login/age/age-card-6-8-normal.png'"
				mode="widthFix"
				@tap="selectAge('6-8')"
			/>
		</view>

		<!-- 底部下一步按钮 -->
		<image
			class="next-btn"
			src="/static/ui/login/age/btn-next.png"
			mode="widthFix"
			@tap="goNext"
		/>
	</view>
</template>

<script>
import { ref } from 'vue'

export default {
	setup() {
		const selectedAge = ref('')

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
			speak('小画家魔法屋，你几岁啦，告诉我吧')
		}

		/** 选择年龄 */
		function selectAge(age) {
			selectedAge.value = age
			if (age === '3-5') {
				speak('3到5岁，我还不太会识字')
			} else if (age === '6-8') {
				speak('6到8岁，我已经上幼儿园啦')
			}
		}

		/** 点击下一步 */
		function goNext() {
			if (!selectedAge.value) {
				uni.showToast({
					title: '先选一个年龄吧～',
					icon: 'none'
				})
				return
			}

			// 保存年龄选择到本地
			uni.setStorageSync('huaban_user_age_range', selectedAge.value)

			// 合并到 userProfile，不覆盖已有字段
			const oldProfile = uni.getStorageSync('userProfile') || {}
			uni.setStorageSync('userProfile', {
				...oldProfile,
				ageRange: selectedAge.value
			})

			// 跳转到登录页2
			uni.navigateTo({ url: '/pages/login/gender/gender' })
		}

		return {
			selectedAge,
			handleTitleTap,
			selectAge,
			goNext
		}
	}
}
</script>

<style scoped>
.age-page {
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
	margin-top: 250rpx;
	z-index: 10;
	position: relative;
}

.card-row {
	display: flex;
	justify-content: center;
	gap: 60rpx;
	margin-top: 40rpx;
	z-index: 10;
	position: relative;
}

.age-card {
	width: 700rpx;
	transition: transform 0.2s ease;
}

.age-card.selected {
	transform: scale(1.08);
}

.age-card:active {
	transform: scale(0.95);
}

.next-btn {
	width: 1300rpx;
	margin-top: 60rpx;
	z-index: 10;
	position: relative;
	transition: transform 0.15s ease;
}

.next-btn:active {
	transform: scale(0.95);
}
</style>
