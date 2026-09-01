<template>
	<view class="gender-page">
		<!-- 背景图片 -->
		<image class="page-bg" src="/static/ui/login/gender/login-gender-bg.png" mode="aspectFill" />

		<!-- 顶部标题图片 -->
		<image
			class="title-img"
			src="/static/ui/login/gender/login-gender-title.png"
			mode="widthFix"
			@tap="handleTitleTap"
		/>

		<!-- 性别卡片区域 -->
		<view class="card-row">
			<image
				class="gender-card"
				:class="{ selected: selectedGender === 'boy' }"
				:src="selectedGender === 'boy' ? '/static/ui/login/gender/gender-boy-active.png' : '/static/ui/login/gender/gender-boy-normal.png'"
				mode="widthFix"
				@tap="selectGender('boy')"
			/>
			<image
				class="gender-card"
				:class="{ selected: selectedGender === 'girl' }"
				:src="selectedGender === 'girl' ? '/static/ui/login/gender/gender-girl-active.png' : '/static/ui/login/gender/gender-girl-normal.png'"
				mode="widthFix"
				@tap="selectGender('girl')"
			/>
		</view>

		<!-- 底部下一步按钮 -->
		<image
			class="next-btn"
			src="/static/ui/login/gender/btn-next.png"
			mode="widthFix"
			@tap="goNext"
		/>
	</view>
</template>

<script>
import { ref } from 'vue'

export default {
	setup() {
		const selectedGender = ref('')

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
			speak('小画家魔法屋，告诉我你的性别吧')
		}

		/** 选择性别 */
		function selectGender(gender) {
			selectedGender.value = gender
			if (gender === 'boy') {
				speak('我是男孩子')
			} else if (gender === 'girl') {
				speak('我是女孩子')
			}
		}

		/** 点击下一步 */
		function goNext() {
			if (!selectedGender.value) {
				uni.showToast({
					title: '先选一个性别吧～',
					icon: 'none'
				})
				return
			}

			// 保存性别选择到本地
			uni.setStorageSync('huaban_user_gender', selectedGender.value)

			// 合并到 userProfile，不覆盖已有字段
			const oldProfile = uni.getStorageSync('userProfile') || {}
			uni.setStorageSync('userProfile', {
				...oldProfile,
				gender: selectedGender.value
			})

			// 跳转到登录页3
			uni.navigateTo({ url: '/pages/login/profile/profile' })
		}

		return {
			selectedGender,
			handleTitleTap,
			selectGender,
			goNext
		}
	}
}
</script>

<style scoped>
.gender-page {
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

.gender-card {
	width: 700rpx;
	transition: transform 0.2s ease;
}

.gender-card.selected {
	transform: scale(1.08);
}

.gender-card:active {
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
