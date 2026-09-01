<template>
	<view class="placeholder-page">
		<text class="placeholder-text">创作故事页</text>
		<text class="placeholder-hint">此页面为占位页，后续会替换正式 UI</text>
		<text class="placeholder-info" v-if="characterId">角色ID: {{ characterId }}</text>
		<text class="placeholder-info" v-if="storyType">故事类型: {{ storyType }}</text>
	</view>
</template>

<script>
import { ref, onMounted } from 'vue'

export default {
	setup() {
		const characterId = ref('')
		const storyType = ref('')

		onMounted(() => {
			const pages = getCurrentPages()
			const currentPage = pages[pages.length - 1]
			const options = currentPage.options || {}
			characterId.value = options.characterId || ''
			storyType.value = options.storyType || ''
		})

		return {
			characterId,
			storyType
		}
	}
}
</script>

<style scoped>
.placeholder-page {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	width: 100vw;
	height: 100vh;
	background-color: #FFF9EC;
}

.placeholder-text {
	font-size: 40rpx;
	font-weight: bold;
	color: #7A3E18;
}

.placeholder-hint {
	font-size: 28rpx;
	color: #999999;
	margin-top: 20rpx;
}

.placeholder-info {
	font-size: 24rpx;
	color: #666666;
	margin-top: 16rpx;
}
</style>
