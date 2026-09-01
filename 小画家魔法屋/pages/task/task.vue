<template>
	<view class="task-page">
		<!-- 背景图片 -->
		<image class="page-bg" src="/static/ui/tasks/bg-tasks-page.png" mode="aspectFill" />

		<!-- 顶部完成度 -->
		<!-- <text class="progress-text">已完成：{{ completedCount }}/{{ totalCount }}</text> -->

		<!-- 上方换一批按钮 -->
		<view class="top-batch-switch" @tap="refreshInviteBatch">
			<image class="refresh-icon" :class="{ rotating: isTopRefreshing }" src="/static/ui/tasks/icon-refresh-loop.png" mode="widthFix" />
			<image class="change-batch-text" src="/static/ui/tasks/text-change-batch.png" mode="heightFix" />
		</view>

		<!-- 上半部分：小伙伴的邀请 -->
		<view class="invite-section">
			<!-- 空状态 -->
			<view v-if="companions.length === 0" class="empty-invite">
				<text class="empty-text">快去创造小伙伴吧～</text>
			</view>

			<!-- 邀请卡片 -->
			<view v-else v-for="(invite, idx) in inviteBatch" :key="idx" class="invite-card">
				<!-- 卡片背景 -->
				<image class="invite-card-bg" src="/static/ui/tasks/invite-card-bg.png" mode="scaleToFill" />
				<!-- 左侧头像 -->
				<image class="invite-avatar" :src="invite.characterImage" mode="aspectFill" />

				<!-- 右侧内容 -->
				<view class="invite-content">
					<!-- 标题行 -->
					<view class="invite-title-row">
						<text class="invite-title">{{ invite.characterName }}今天想：</text>
						<image class="speaker-btn" src="/static/ui/tasks/icon-task-speaker.png" mode="widthFix" @tap="speakInvite(invite)" />
					</view>

					<!-- 三行任务 -->
					<view v-for="(taskId, tIdx) in invite.tasks" :key="tIdx" class="task-row" @tap="handleTaskClick(invite, taskId, tIdx)">
						<image class="task-row-bg" :src="getTaskRowBg(taskId, invite.characterId, tIdx)" mode="scaleToFill" />
						<text class="task-row-text" :class="{ done: isTaskDone(taskId, invite.characterId) }">
							{{ getTaskName(taskId) }}
						</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 下方灵感换一批按钮 -->
		<view class="bottom-batch-switch" @tap="refreshInspiration">
			<image class="refresh-icon" :class="{ rotating: isBottomRefreshing }" src="/static/ui/tasks/icon-refresh-loop.png" mode="widthFix" />
			<image class="change-batch-text" src="/static/ui/tasks/text-change-batch.png" mode="heightFix" />
		</view>

		<!-- 下半部分：灵感卡片 -->
		<view class="inspiration-section">
			<view v-for="card in inspirationCards" :key="card.id" class="inspiration-card" @tap="speakInspiration(card)">
				<image class="inspiration-card-bg" :src="getInspirationCardBg(card)" mode="scaleToFill" />
				<view class="inspiration-btn" @tap.stop="handleInspirationClick(card)">
					<image class="inspiration-btn-bg" :src="isInspirationDone(card.id) ? '/static/ui/tasks/btn-task-done.png' : '/static/ui/tasks/btn-go-draw.png'" mode="scaleToFill" />
				</view>
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
			<view class="nav-item" @tap="goAchievement">
				<image class="nav-icon" src="/static/ui/gallery/tab-achievement-normal.png" mode="widthFix" />
			</view>
			<view class="nav-item active">
				<image class="nav-icon" src="/static/ui/gallery/tab-adventure-active.png" mode="widthFix" />
			</view>
		</view>
	</view>
</template>

<script>
import { ref, computed, onMounted } from 'vue'

export default {
	setup() {
		// ======================== 任务池 ========================
		const TASK_POOL = [
			{ id: 'task_01', name: '画一个会飞的交通工具', type: 'draw', speakText: '画一个会飞的交通工具', missionText: '画一个会飞的交通工具' },
			{ id: 'task_02', name: '设计一个神秘宝藏', type: 'draw', speakText: '设计一个神秘宝藏', missionText: '设计一个神秘宝藏' },
			{ id: 'task_03', name: '画一个好吃的奶酪', type: 'draw', speakText: '画一个好吃的奶酪', missionText: '画一个好吃的奶酪' },
			{ id: 'task_04', name: '我想住一个大别墅！', type: 'draw', speakText: '我想住一个大别墅', missionText: '画一个大别墅' },
			{ id: 'task_05', name: '画一个糖果做的云朵', type: 'draw', speakText: '画一个糖果做的云朵', missionText: '画一个糖果做的云朵' },
			{ id: 'task_06', name: '给恐龙设计一个家', type: 'draw', speakText: '给恐龙设计一个家', missionText: '给恐龙设计一个家' },
			{ id: 'task_07', name: '发明未来的书包', type: 'draw', speakText: '发明未来的书包', missionText: '画一个未来的书包' },
			{ id: 'task_08', name: '画一艘会发光的小船', type: 'draw', speakText: '画一艘会发光的小船', missionText: '画一艘会发光的小船' },
			{ id: 'task_09', name: '设计一座树屋图书馆', type: 'draw', speakText: '设计一座树屋图书馆', missionText: '设计一座树屋图书馆' },
			{ id: 'task_10', name: '画一个彩虹游乐园', type: 'draw', speakText: '画一个彩虹游乐园', missionText: '画一个彩虹游乐园' },
			{ id: 'task_11', name: '设计一个帮忙的小机器人', type: 'draw', speakText: '设计一个帮忙的小机器人', missionText: '设计一个帮忙的小机器人' },
			{ id: 'task_12', name: '画一个秘密城堡', type: 'draw', speakText: '画一个秘密城堡', missionText: '画一个秘密城堡' },
			{ id: 'task_13', name: '设计一顶魔法帽', type: 'draw', speakText: '设计一顶魔法帽', missionText: '设计一顶魔法帽' },
			{ id: 'task_14', name: '画一个月亮卧室', type: 'draw', speakText: '画一个月亮卧室', missionText: '画一个月亮卧室' },
			{ id: 'task_15', name: '画一扇能看到海底的窗户', type: 'draw', speakText: '画一扇能看到海底的窗户', missionText: '画一扇能看到海底的窗户' },
			{ id: 'task_16', name: '给小伙伴设计一个游乐场', type: 'draw', speakText: '给小伙伴设计一个游乐场', missionText: '给小伙伴设计一个游乐场' },
			{ id: 'task_17', name: '给我讲一个睡前故事', type: 'chat', speakText: '给我讲一个睡前故事', missionText: '给我讲一个睡前故事' },
			{ id: 'task_18', name: '和我说一个秘密愿望', type: 'chat', speakText: '和我说一个秘密愿望', missionText: '和我说一个秘密愿望' },
			{ id: 'task_19', name: '分享今天最开心的事', type: 'chat', speakText: '分享今天最开心的事', missionText: '分享今天最开心的事' },
			{ id: 'task_20', name: '对我说一句勇敢的话', type: 'chat', speakText: '对我说一句勇敢的话', missionText: '对我说一句勇敢的话' }
		]

		// ======================== 灵感卡片 ========================
		const INSPIRATION_CARDS = [
			{ id: 'inspire_candy_cloud', name: '如果云朵是糖果做的', missionText: '画一个糖果做的云朵', pendingImg: '/static/ui/tasks/card-candy-cloud-pending.png', doneImg: '/static/ui/tasks/card-candy-cloud-done.png' },
			{ id: 'inspire_dino_home', name: '给恐龙设计一个家', missionText: '给恐龙设计一个家', pendingImg: '/static/ui/tasks/card-dino-home-pending.png', doneImg: '/static/ui/tasks/card-dino-home-done.png' },
			{ id: 'inspire_future_bag', name: '发明未来的书包', missionText: '画一个未来的书包', pendingImg: '/static/ui/tasks/card-future-bag-pending.png', doneImg: '/static/ui/tasks/card-future-bag-done.png' }
		]

		// ======================== 状态 ========================
		const companions = ref([])
		const adventureState = ref({
			inviteBatch: [],
			inviteCompleted: {},
			inspirationCompleted: {}
		})
		const isTopRefreshing = ref(false)
		const isBottomRefreshing = ref(false)

		// ======================== 计算属性 ========================
		const inspirationCards = computed(() => INSPIRATION_CARDS)

		const inviteBatch = computed(() => adventureState.value.inviteBatch || [])

		const completedCount = computed(() => {
			let count = 0
			// 邀请任务完成数
			const inviteComp = adventureState.value.inviteCompleted || {}
			for (const charId in inviteComp) {
				count += (inviteComp[charId] || []).length
			}
			// 灵感任务完成数
			const inspComp = adventureState.value.inspirationCompleted || {}
			for (const key in inspComp) {
				if (inspComp[key]) count++
			}
			return count
		})

		const totalCount = computed(() => {
			const inviteCount = inviteBatch.value.length * 3
			const inspCount = INSPIRATION_CARDS.length
			return inviteCount + inspCount
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

		function speakInvite(invite) {
			const tasks = invite.tasks.map((taskId, idx) => {
				const task = TASK_POOL.find(t => t.id === taskId)
				return (idx + 1) + '、' + (task ? task.name : '')
			}).join('；')
			speak(invite.characterName + '今天想：' + tasks)
		}

		function speakInspiration(card) {
			if (isInspirationDone(card.id)) {
				speak(card.name + '已完成')
			} else {
				speak(card.name)
			}
		}

		// ======================== 任务相关 ========================
		function getTaskName(taskId) {
			const task = TASK_POOL.find(t => t.id === taskId)
			return task ? task.name : ''
		}

		function isTaskDone(taskId, characterId) {
			const completed = adventureState.value.inviteCompleted || {}
			return (completed[characterId] || []).includes(taskId)
		}

		function getTaskRowBg(taskId, characterId, index) {
			const done = isTaskDone(taskId, characterId)
			if (index === 0) return done ? '/static/ui/tasks/task-row-1-done.png' : '/static/ui/tasks/task-row-1-pending.png'
			if (index === 1) return done ? '/static/ui/tasks/task-row-2-done.png' : '/static/ui/tasks/task-row-2-pending.png'
			return done ? '/static/ui/tasks/task-row-3-done.png' : '/static/ui/tasks/task-row-3-pending.png'
		}

		function isInspirationDone(cardId) {
			return !!adventureState.value.inspirationCompleted?.[cardId]
		}

		function getInspirationCardBg(card) {
			return isInspirationDone(card.id) ? card.doneImg : card.pendingImg
		}

		// ======================== 任务分配 ========================
		function generateInviteBatch() {
			const list = uni.getStorageSync('companions') || []
			companions.value = list.map(item => ({
				...item,
				id: item.id || item._id || ''
			}))

			if (companions.value.length === 0) {
				adventureState.value.inviteBatch = []
				return
			}

			// 随机选择最多2个小伙伴
			const shuffled = [...companions.value].sort(() => Math.random() - 0.5)
			const selected = shuffled.slice(0, 2)

			const batch = selected.map(char => {
				const completedTasks = adventureState.value.inviteCompleted?.[char.id] || []
				// 筛选未完成的任务
				const available = TASK_POOL.filter(t => !completedTasks.includes(t.id))
				// 优先分配2个draw + 1个chat
				const drawTasks = available.filter(t => t.type === 'draw')
				const chatTasks = available.filter(t => t.type === 'chat')

				let tasks = []
				if (drawTasks.length >= 2 && chatTasks.length >= 1) {
					tasks = [
						drawTasks[Math.floor(Math.random() * drawTasks.length)].id,
						drawTasks.filter(t => t.id !== tasks[0])[Math.floor(Math.random() * (drawTasks.length - 1))]?.id || drawTasks[0].id,
						chatTasks[Math.floor(Math.random() * chatTasks.length)].id
					]
				} else {
					// 从所有可用任务中随机选3个
					const shuffledAvailable = available.sort(() => Math.random() - 0.5)
					tasks = shuffledAvailable.slice(0, 3).map(t => t.id)
				}

				return {
					characterId: char.id,
					characterName: char.name || char.character_name || '小伙伴',
					characterDesc: char.description || char.greeting || '可爱的小伙伴',
					characterImage: char.drawing_url || char.image_url || char.avatar || char.image || char.drawingUrl || char.imageUrl || '',
					tasks: tasks
				}
			})

			adventureState.value.inviteBatch = batch
			saveState()
		}

		function refreshInviteBatch() {
			isTopRefreshing.value = true
			setTimeout(() => {
				isTopRefreshing.value = false
			}, 600)
			generateInviteBatch()
		}

		function refreshInspiration() {
			isBottomRefreshing.value = true
			setTimeout(() => {
				isBottomRefreshing.value = false
			}, 600)
		}

		// ======================== 任务点击 ========================
		function handleTaskClick(invite, taskId, index) {
			if (isTaskDone(taskId, invite.characterId)) {
				speak('这个任务已经完成啦')
				return
			}

			const task = TASK_POOL.find(t => t.id === taskId)
			if (!task) return

			if (task.type === 'draw') {
				// 绘画任务：跳转到绘画页 mission 模式
				uni.navigateTo({
					url: '/pages/index/index?mode=mission&from=adventure&taskSource=invite&taskId=' + taskId + '&characterId=' + invite.characterId + '&characterName=' + encodeURIComponent(invite.characterName) + '&missionText=' + encodeURIComponent(task.missionText)
				})
			} else if (task.type === 'chat') {
				// 对话任务：跳转到聊天页
				uni.navigateTo({
					url: '/pages/chat/chat?characterId=' + invite.characterId + '&from=adventure&taskId=' + taskId
				})
			}
		}

		function handleInspirationClick(card) {
			if (isInspirationDone(card.id)) {
				speak(card.name + '已完成')
				return
			}

			uni.navigateTo({
				url: '/pages/index/index?mode=mission&from=adventure&taskSource=inspiration&taskId=' + card.id + '&missionText=' + encodeURIComponent(card.missionText)
			})
		}

		// ======================== 状态保存 ========================
		function saveState() {
			uni.setStorageSync('huaban_adventure_state', adventureState.value)
		}

		function loadState() {
			const saved = uni.getStorageSync('huaban_adventure_state')
			if (saved && typeof saved === 'object') {
				adventureState.value = {
					inviteBatch: Array.isArray(saved.inviteBatch) ? saved.inviteBatch : [],
					inviteCompleted: saved.inviteCompleted || {},
					inspirationCompleted: saved.inspirationCompleted || {}
				}
			} else {
				adventureState.value = {
					inviteBatch: [],
					inviteCompleted: {},
					inspirationCompleted: {}
				}
			}
		}

		/** 确保邀请批次有效 */
		function ensureInviteBatchReady() {
			const list = uni.getStorageSync('companions') || []
			companions.value = list.map(item => ({
				...item,
				id: item.id || item._id || ''
			}))

			console.log('[任务页初始化] 小伙伴数量:', companions.value.length)
			console.log('[任务页初始化] 读取到的 inviteBatch:', adventureState.value.inviteBatch)

			// 没有小伙伴时清空邀请
			if (companions.value.length === 0) {
				inviteBatch.value = []
				adventureState.value.inviteBatch = []
				saveState()
				return
			}

			const batch = adventureState.value.inviteBatch || []

			// 验证 batch 中的小伙伴是否还存在
			const validBatch = batch.filter(item => {
				const id = item.characterId || item.id || item._id
				return companions.value.some(c => c.id === id)
			})

			if (validBatch.length > 0) {
				inviteBatch.value = validBatch
				adventureState.value.inviteBatch = validBatch
				saveState()
				console.log('[任务页初始化] 使用已有 inviteBatch:', validBatch)
			} else {
				console.log('[任务页初始化] inviteBatch 为空或无效，已自动生成新邀请')
				generateInviteBatch()
			}
		}

		// ======================== 导航 ========================
		function goSettings() {
			uni.reLaunch({ url: '/pages/settings/settings' })
		}

		function goGallery() {
			uni.reLaunch({ url: '/pages/gallery/gallery' })
		}

		function goSquare() {
			uni.reLaunch({ url: '/pages/square/square' })
		}

		function goAchievement() {
			uni.reLaunch({ url: '/pages/achievement/achievement' })
		}

		// ======================== 生命周期 ========================
		onMounted(() => {
			loadState()
			ensureInviteBatchReady()

			// 确保灵感完成状态存在
			if (!adventureState.value.inspirationCompleted) {
				adventureState.value.inspirationCompleted = {}
			}
		})

		return {
			companions,
			adventureState,
			inviteBatch,
			inspirationCards,
			completedCount,
			totalCount,
			isTopRefreshing,
			isBottomRefreshing,
			speakInvite,
			speakInspiration,
			getTaskName,
			isTaskDone,
			getTaskRowBg,
			isInspirationDone,
			getInspirationCardBg,
			refreshInviteBatch,
			refreshInspiration,
			handleTaskClick,
			handleInspirationClick,
			goSettings,
			goGallery,
			goSquare,
			goAchievement
		}
	}
}
</script>

<style scoped>
.task-page {
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

/* ==================== 顶部完成度 ==================== */
.progress-text {
	position: absolute;
	top: 34rpx;
	left: 50%;
	transform: translateX(-50%);
	font-size: 56rpx;
	font-weight: 700;
	color: #2F1609;
	z-index: 20;
}

/* ==================== 换一批按钮 ==================== */
.top-batch-switch {
	position: absolute;
	top: 190rpx;
	left: 430rpx;
	display: flex;
	align-items: center;
	gap: 10rpx;
	z-index: 20;
	cursor: pointer;
}

.bottom-batch-switch {
	position: absolute;
	top: 708rpx;
	left: 350rpx;
	display: flex;
	align-items: center;
	gap: 10rpx;
	z-index: 20;
	cursor: pointer;
}

.refresh-icon {
	width: 50rpx;
	height: 50rpx;
	transition: transform 0.6s ease;
}

.refresh-icon.rotating {
	animation: rotateOnce 0.6s ease;
}

@keyframes rotateOnce {
	from { transform: rotate(0deg); }
	to { transform: rotate(360deg); }
}

.change-batch-text {
	height: 36rpx;
}

/* ==================== 邀请区域 ==================== */
.invite-section {
	position: absolute;
	left: 160rpx;
	right: 60rpx;
	top: 260rpx;
	z-index: 15;
	display: flex;
	flex-direction: row;
	gap: 26rpx;
}

.empty-invite {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 200rpx;
}

.empty-text {
	font-size: 32rpx;
	color: #8B6914;
}

/* ==================== 邀请卡片 ==================== */
.invite-card {
	position: relative;
	display: flex;
	width: 990rpx;
	height: 440rpx;
	background: transparent;
	border: none;
	border-radius: 0;
	box-shadow: none;
	padding: 20rpx;
	box-sizing: border-box;
	overflow: visible;
}

.invite-card-bg {
	position: absolute;
	left: 0;
	top: 0;
	width: 100%;
	height: 100%;
	z-index: 0;
	pointer-events: none;
}

.invite-avatar,
.invite-content {
	left: 20rpx;
	top: 40rpx;
	position: relative;
	z-index: 2;
}

.invite-avatar {
	width: 180rpx;
	height: 180rpx;
	top: -5rpx;
	border-radius: 50%;
	border: 3rpx solid #8B4A20;
	margin-right: 40rpx;
	align-self: center;
}

.invite-content {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.invite-title-row {
	display: flex;
	align-items: center;
	gap: 10rpx;
}

.invite-title {
	font-size: 38rpx;
	font-weight: bold;
	color: #5A3010;
}

.speaker-btn {
	width: 56rpx;
	height: 56rpx;
	cursor: pointer;
}

.task-row {
	position: relative;
	width: 640rpx;
	height: 60rpx;
	cursor: pointer;
}

.task-row-bg {
	position: absolute;
	left: 0;
	top: 0;
	width: 100%;
	height: 100%;
}

.task-row-text {
	position: relative;
	z-index: 1;
	font-size: 36rpx;
	color: #5A3010;
	line-height: 56rpx;
	padding-left: 80rpx;
}

.task-row-text.done {
	text-decoration: line-through;
	color: #A9998A;
}

/* ==================== 灵感区域 ==================== */
.inspiration-section {
	position: absolute;
	left: 24rpx;
	right: 80rpx;
	top: 760rpx;
	z-index: 15;
	display: flex;
	justify-content: center;
	gap: 64rpx;
}

.inspiration-card {
	position: relative;
	width: 610rpx;
	height: 520rpx;
	cursor: pointer;
}

.inspiration-card-bg {
	position: absolute;
	left: 0;
	top: 0;
	width: 100%;
	height: 100%;
}

.inspiration-btn {
	position: absolute;
	left: 50%;
	bottom: 20rpx;
	transform: translateX(-50%);
	width: 240rpx;
	height: 60rpx;
	z-index: 2;
}

.inspiration-btn-bg {
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
