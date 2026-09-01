<template>
	<view class="drawing-page">
		<!-- 页面背景 -->
		<image class="page-bg" src="/static/ui/drawing/drawing-bg.png" mode="aspectFill" />

		<!-- 左上角保存并退出 -->
		<image
			class="save-exit-btn"
			src="/static/ui/drawing/btn-save-exit.png"
			mode="widthFix"
			@tap="handleSaveExit"
		/>

		<!-- 右上角操作按钮 -->
		<view class="top-actions">
			<image class="magic-btn" src="/static/ui/drawing/btn-magic.png" mode="widthFix" @tap="triggerExport" />
			<image class="ai-help-btn" src="/static/ui/drawing/btn-ai-help.png" mode="widthFix" @tap="handleAiHelp" />
		</view>

		<!-- 左侧撤回回退按钮 -->
		<view class="side-actions">
			<image class="side-btn" src="/static/ui/drawing/btn-undo.png" mode="widthFix" @tap="triggerUndo" />
			<image class="side-btn" src="/static/ui/drawing/btn-redo.png" mode="widthFix" @tap="triggerRedo" />
		</view>

		<!-- 画板区域 -->
		<view class="board-area">
			<!-- 画板背景 -->
			<image class="canvas-board-bg" src="/static/ui/drawing/canvas-board.png" mode="scaleToFill" />

			<!-- Fabric.js 画布容器 -->
			<view id="canvasContainer" class="canvas-draw-layer"></view>

			<!-- renderjs 通信桥梁 -->
			<view
				class="renderjs-bridge"
				:prop="canvasState"
				:change:prop="canvasRender.onStateChange"
				@onExportComplete="onExportComplete"
				@onDrawStart="onDrawStart"
			></view>

			<!-- 画板夹 -->
			<image class="board-clip" src="/static/ui/drawing/board-clip.png" mode="widthFix" />

			<!-- 四个画板钉 -->
			<image class="board-pin pin-lt" src="/static/ui/drawing/board-pin.png" mode="widthFix" />
			<image class="board-pin pin-rt" src="/static/ui/drawing/board-pin.png" mode="widthFix" />
			<image class="board-pin pin-lb" src="/static/ui/drawing/board-pin.png" mode="widthFix" />
			<image class="board-pin pin-rb" src="/static/ui/drawing/board-pin.png" mode="widthFix" />

			<!-- 灵感提示组件（普通模式） -->
			<view class="inspiration-panel" v-show="showInspiration && !isStoryMode">
				<image class="text-today-draw" src="/static/ui/drawing/text-today-draw.png" mode="heightFix" @tap="speakTodayDraw" />

				<view class="inspiration-options">
					<image class="inspiration-item" src="/static/ui/drawing/inspiration-animal.png" mode="scaleToFill" @tap="showInspirationDialog('animal')" />
					<image class="inspiration-item" src="/static/ui/drawing/inspiration-happy.png" mode="scaleToFill" @tap="showInspirationDialog('happy')" />
					<image class="inspiration-item" src="/static/ui/drawing/inspiration-magic-person.png" mode="scaleToFill" @tap="generateMagicPerson" />
				</view>

				<image class="btn-draw-myself" src="/static/ui/drawing/btn-draw-myself.png" mode="widthFix" @tap="hideInspiration" />

				<view class="refresh-inspiration" @tap="handleRefreshInspiration">
					<image class="icon-refresh" :class="{ rotating: isRefreshing }" src="/static/ui/drawing/icon-refresh.png" mode="widthFix" />
					<image class="text-refresh" src="/static/ui/drawing/text-refresh-inspiration.png" mode="heightFix" />
				</view>
			</view>

			<!-- Story 模式：创作浮窗 -->
			<view class="story-prompt" v-if="isStoryMode && showStoryPrompt">
				<image class="text-start-create" src="/static/ui/story-create/text-start-create.png" mode="heightFix" @tap="speakStoryTask" />

				<view class="story-task-label">
					<image class="story-task-label-bg" src="/static/ui/story-create/task-label-pink.png" mode="scaleToFill" />
					<text class="story-task-text">{{ storyTask.taskText }}</text>
				</view>

				<image class="btn-start-create" src="/static/ui/story-create/btn-start-create.png" mode="widthFix" @tap="startStoryDrawing" />
			</view>

			<!-- Story 模式：绘画锁（未开始创作时阻止绘画） -->
			<view class="story-draw-lock" v-if="isStoryMode && !storyStarted" @tap="startStoryDrawing"></view>

			<!-- Story 模式：底部任务提示条 -->
			<view class="story-task-compact" v-if="isStoryMode && storyStarted">
				<image class="story-task-compact-bg" src="/static/ui/story-create/task-label-pink.png" mode="scaleToFill" />
				<text class="story-task-compact-text">{{ storyTask.taskText }}</text>
			</view>

			<!-- Story 模式：右下角云朵思考组件 -->
			<view class="story-thought" v-if="isStoryMode && showThoughtCloud">
				<image class="thought-cloud" src="/static/ui/story-create/thought-cloud.png" mode="scaleToFill" />
				<image class="thought-close" src="/static/ui/story-create/icon-cloud-close.png" mode="widthFix" @tap="showThoughtCloud = false" />
				<image v-if="storyTask.storyImage" class="thought-story-image" :src="storyTask.storyImage" mode="aspectFit" />
				<text class="thought-text">{{ storyTask.thoughtText }}</text>
				<image v-if="storyCharacter.image" class="thought-character" :src="storyCharacter.image" mode="aspectFill" />
			</view>
		</view>

		<!-- 底部工具栏 -->
		<view class="bottom-toolbar">
			<!-- 颜色标签 -->
			<view class="color-tabs">
				<view
					v-for="c in colorTabs"
					:key="c.value"
					class="color-tab"
					:class="{ active: brushColor === c.value && !eraserActive }"
					@tap="selectColor(c.value)"
				>
					<image class="color-img" :src="c.img" mode="widthFix" />
				</view>
			</view>

			<!-- 橡皮擦 -->
			<view class="tool-eraser" :class="{ active: eraserActive }" @tap="toggleEraser">
				<image class="eraser-img" src="/static/ui/drawing/tool-eraser.png" mode="widthFix" />
			</view>

			<!-- 油漆桶 -->
			<view class="tool-bucket" @tap="handleBucket">
				<image class="bucket-img" src="/static/ui/drawing/tool-bucket.png" mode="widthFix" />
			</view>

			<!-- 画笔粗细调节 -->
			<view class="brush-size-control">
				<image class="btn-minus" src="/static/ui/drawing/btn-minus.png" mode="widthFix" @tap="decreaseBrushSize" />
				<view class="brush-size-display">
					<image class="brush-size-bg" src="/static/ui/drawing/brush-size-bg.png" mode="widthFix" />
					<image class="brush-size-dot" :style="{ width: dotSize + 'rpx', height: dotSize + 'rpx' }" src="/static/ui/drawing/brush-size-dot.png" mode="widthFix" />
				</view>
				<image class="btn-plus" src="/static/ui/drawing/btn-plus.png" mode="widthFix" @tap="increaseBrushSize" />
			</view>
		</view>

		<!-- 灵感输入弹窗 -->
		<view class="inspiration-dialog-mask" v-if="showDialog" @tap="closeDialog">
			<view class="inspiration-dialog" @tap.stop>
				<text class="dialog-title">{{ dialogTitle }}</text>
				<input class="dialog-input" v-model="dialogInput" :placeholder="dialogPlaceholder" placeholder-style="color:#C0A080" maxlength="50" />
				<view class="dialog-buttons">
					<view class="dialog-btn cancel" @tap="closeDialog">
						<text class="dialog-btn-text">取消</text>
					</view>
					<view class="dialog-btn confirm" @tap="generateFromDialog">
						<text class="dialog-btn-text">生成线稿</text>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

export default {
	setup() {
		// ======================== 页面状态 ========================
		const pageAction = ref('new')
		const targetCompanionId = ref('')

		// ======================== Story 模式状态 ========================
		const isStoryMode = ref(false)
		const storyStarted = ref(false)
		const showStoryPrompt = ref(true)
		const showThoughtCloud = ref(true)
		const storyTask = ref({
			characterId: '',
			storyType: '',
			taskText: '任务：给小伙伴画一个故事',
			taskSpeakText: '开始你的创作吧，任务：给小伙伴画一个故事',
			thoughtText: '我想要一个新的故事',
			storyImage: ''
		})
		const storyCharacter = ref({
			id: '',
			name: '',
			image: ''
		})
		const isMagicProcessing = ref(false)

		// ======================== 画笔状态 ========================
		const brushColor = ref('#333333')
		const brushSize = ref(4)
		const eraserActive = ref(false)
		const clearTrigger = ref(0)
		const hasDrawn = ref(false)
		const showInspiration = ref(true)

		// ======================== 模板相关 ========================
		const loadTemplateTrigger = ref(0)
		const templateSvg = ref('')
		const exportTrigger = ref(0)
		const exportPurpose = ref('magic') // 'magic' = 变身魔法, 'ai_help' = 帮我画
		const undoTrigger = ref(0)
		const redoTrigger = ref(0)
		const templateUrl = ref('')
		const loadTemplateFromUrlTrigger = ref(0)
		const setBackgroundTrigger = ref(0)
		const bgColor = ref('#FDF8F0')
		const replaceLineartUrl = ref('')
		const replaceLineartTrigger = ref(0)

		// ======================== 灵感弹窗 ========================
		const showDialog = ref(false)
		const dialogType = ref('')
		const dialogInput = ref('')
		const isRefreshing = ref(false)

		// ======================== 颜色标签 ========================
		const colorTabs = [
			{ value: '#F4606B', img: '/static/ui/drawing/color-red.png' },
			{ value: '#FF8C42', img: '/static/ui/drawing/color-orange.png' },
			{ value: '#FFD166', img: '/static/ui/drawing/color-yellow.png' },
			{ value: '#74C583', img: '/static/ui/drawing/color-green.png' },
			{ value: '#9AC0FF', img: '/static/ui/drawing/color-blue.png' },
			{ value: '#FFADD6', img: '/static/ui/drawing/color-pink.png' },
			{ value: '#A67C52', img: '/static/ui/drawing/color-brown.png' },
			{ value: '#3A3A3A', img: '/static/ui/drawing/color-black.png' }
		]

		// ======================== 计算属性 ========================
		const canvasState = computed(() => ({
			brushColor: brushColor.value,
			brushSize: brushSize.value,
			eraserActive: eraserActive.value,
			clearTrigger: clearTrigger.value,
			loadTemplateTrigger: loadTemplateTrigger.value,
			templateSvg: templateSvg.value,
			exportTrigger: exportTrigger.value,
			undoTrigger: undoTrigger.value,
			redoTrigger: redoTrigger.value,
			templateUrl: templateUrl.value,
			loadTemplateFromUrlTrigger: loadTemplateFromUrlTrigger.value,
			setBackgroundTrigger: setBackgroundTrigger.value,
			bgColor: bgColor.value,
			replaceLineartUrl: replaceLineartUrl.value,
			replaceLineartTrigger: replaceLineartTrigger.value
		}))

		const dotSize = computed(() => {
			return 12 + brushSize.value * 1.2
		})

		const dialogTitle = computed(() => {
			if (dialogType.value === 'animal') return '告诉我你想象中的小动物长什么样～'
			if (dialogType.value === 'happy') return '告诉我今天什么事情让你开心～'
			return ''
		})

		const dialogPlaceholder = computed(() => {
			return '可以写字，也可以以后接语音～'
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

		function speakTodayDraw() {
			speak('今天画什么呢')
		}

		// ======================== 画笔控制 ========================
		function selectColor(hex) {
			brushColor.value = hex
			eraserActive.value = false
		}

		function increaseBrushSize() {
			brushSize.value = Math.min(brushSize.value + 2, 40)
		}

		function decreaseBrushSize() {
			brushSize.value = Math.max(brushSize.value - 2, 2)
		}

		function toggleEraser() {
			eraserActive.value = !eraserActive.value
		}

		function clearCanvas() {
			clearTrigger.value++
			hasDrawn.value = false
			templateSvg.value = ''
		}

		// ======================== 撤回重做 ========================
		function triggerUndo() {
			undoTrigger.value++
		}

		function triggerRedo() {
			redoTrigger.value++
		}

		// ======================== 油漆桶 ========================
		function handleBucket() {
			bgColor.value = brushColor.value
			setBackgroundTrigger.value++
		}

		// ======================== 导出和变身 ========================
		function triggerExport() {
			if (isMagicProcessing.value) {
				uni.showToast({ title: '魔法正在进行中～', icon: 'none' })
				return
			}
			isMagicProcessing.value = true
			exportPurpose.value = 'magic'
			uni.showLoading({ title: '魔法施展中...', mask: true })
			exportTrigger.value++
		}

		// ======================== AI 帮我画 ========================
		function handleAiHelp() {
			exportPurpose.value = 'ai_help'
			uni.showLoading({ title: 'AI分析画布中...', mask: true })
			exportTrigger.value++
		}

		// ======================== Story 模式函数 ========================
		function speakStoryTask() {
			speak(storyTask.value.taskSpeakText)
		}

		function startStoryDrawing() {
			storyStarted.value = true
			showStoryPrompt.value = false
			missionStarted.value = true
			showMissionPrompt.value = false
		}

		/** 后续当创作故事保存成功后调用 */
		function markStoryCompleted(characterId, storyType) {
			// 更新已完成故事
			const completed = uni.getStorageSync('huaban_completed_stories') || {}
			if (!completed[characterId]) completed[characterId] = []
			if (!completed[characterId].includes(storyType)) {
				completed[characterId].push(storyType)
			}
			uni.setStorageSync('huaban_completed_stories', completed)

			// 更新故事计数
			const counts = uni.getStorageSync('huaban_story_counts_by_character') || {}
			counts[characterId] = (counts[characterId] || 0) + 1
			uni.setStorageSync('huaban_story_counts_by_character', counts)

			// 更新角色ID列表
			const ids = uni.getStorageSync('huaban_story_character_ids') || []
			if (!ids.includes(characterId)) {
				ids.push(characterId)
				uni.setStorageSync('huaban_story_character_ids', ids)
			}
		}

		// ======================== 灵感组件 ========================
		function hideInspiration() {
			showInspiration.value = false
		}

		function handleRefreshInspiration() {
			isRefreshing.value = true
			setTimeout(() => {
				isRefreshing.value = false
			}, 600)
		}

		function showInspirationDialog(type) {
			dialogType.value = type
			dialogInput.value = ''
			showDialog.value = true
		}

		function closeDialog() {
			showDialog.value = false
			dialogInput.value = ''
		}

		async function generateFromDialog() {
			if (!dialogInput.value.trim()) {
				uni.showToast({ title: '请输入描述内容～', icon: 'none' })
				return
			}

			const prompt = dialogType.value === 'animal'
				? '儿童简笔画，黑白线稿，涂色本风格，极简的黑色粗线条，纯白背景。画面内容是：' + dialogInput.value
				: '儿童简笔画，黑白线稿，涂色本风格，极简的黑色粗线条，纯白背景，开心快乐的场景。画面内容是：' + dialogInput.value

			await generateLineArt(prompt)
			closeDialog()
		}

		async function generateMagicPerson() {
			const prompt = '儿童简笔画，黑白线稿，涂色本风格，极简的黑色粗线条，纯白背景。一个可爱的会魔法的小人，想象力丰富，多种魔法可能。'
			await generateLineArt(prompt)
		}

		async function generateLineArt(prompt) {
			uni.showLoading({ title: '正在生成线稿...', mask: true })
			try {
				const res = await uniCloud.callFunction({
					name: 'generate_template',
					data: { prompt: prompt },
					timeout: 60000
				})

				if (res.result && res.result.code === 0) {
					const urlRes = await uniCloud.getTempFileURL({
						fileList: [res.result.fileID]
					})
					if (urlRes.fileList && urlRes.fileList[0] && urlRes.fileList[0].tempFileURL) {
						templateSvg.value = ''
						templateUrl.value = urlRes.fileList[0].tempFileURL
						loadTemplateFromUrlTrigger.value++
						hasDrawn.value = true
						showInspiration.value = false
					} else {
						uni.showToast({ title: '线稿加载失败', icon: 'none' })
					}
				} else {
					uni.showToast({ title: '线稿生成失败', icon: 'none' })
				}
			} catch (err) {
				console.error('❌ 生成线稿失败:', err)
				uni.showToast({ title: '网络错误', icon: 'none' })
			} finally {
				uni.hideLoading()
			}
		}

		// ======================== 保存退出 ========================
		function handleSaveExit() {
			// Mission 模式：标记任务完成并返回任务页
			if (isMissionMode.value) {
				// 检查是否有绘画内容
				if (hasDrawn.value && missionTask.value.taskId) {
					markMissionCompleted(missionTask.value.taskId, missionTask.value.taskSource, missionTask.value.characterId)
				}
				const pages = getCurrentPages()
				if (pages.length > 1) {
					uni.navigateBack()
				} else {
					uni.reLaunch({ url: '/pages/task/task' })
				}
				return
			}

			if (isStoryMode.value) {
				// Story 模式：返回画故事页
				const pages = getCurrentPages()
				if (pages.length > 1) {
					uni.navigateBack()
				} else {
					const characterId = storyCharacter.value.id || storyTask.value.characterId || ''
					uni.reLaunch({ url: '/pages/story/story?characterId=' + characterId + '&from=index&origin=gallery' })
				}
				return
			}

			// 普通模式
			const pages = getCurrentPages()
			if (pages.length > 1) {
				uni.navigateBack()
			} else {
				uni.reLaunch({ url: '/pages/gallery/gallery' })
			}
		}

		/** 标记任务完成 */
		function markMissionCompleted(taskId, taskSource, characterId) {
			if (taskSource === 'inspiration') {
				// 灵感任务完成
				const state = uni.getStorageSync('huaban_adventure_state') || {}
				if (!state.inspirationCompleted) state.inspirationCompleted = {}
				state.inspirationCompleted[taskId] = true
				uni.setStorageSync('huaban_adventure_state', state)
			} else if (taskSource === 'invite' && characterId) {
				// 邀请任务完成
				const state = uni.getStorageSync('huaban_adventure_state') || {}
				if (!state.inviteCompleted) state.inviteCompleted = {}
				if (!state.inviteCompleted[characterId]) state.inviteCompleted[characterId] = []
				if (!state.inviteCompleted[characterId].includes(taskId)) {
					state.inviteCompleted[characterId].push(taskId)
				}
				uni.setStorageSync('huaban_adventure_state', state)

				// 增加好感度计数
				const counts = uni.getStorageSync('huaban_story_counts_by_character') || {}
				counts[characterId] = (counts[characterId] || 0) + 1
				uni.setStorageSync('huaban_story_counts_by_character', counts)
			}
		}

		/** Mission 邀请任务：融合任务图到小伙伴 */
		async function handleMissionInviteMagic(base64Data) {
			const charId = missionTask.value.characterId
			const taskId = missionTask.value.taskId
			const missionText = missionTask.value.missionText || '画一个神奇的东西'

			console.log('[mission邀请任务变身]', { charId, taskId, missionText })

			try {
				// 1. 生成任务图片 a
				uni.showLoading({ title: '正在生成任务图片...', mask: true })
				const imageRes = await uniCloud.callFunction({
					name: 'generate_magic_image',
					data: { base64Image: base64Data },
					timeout: 60000
				})

				if (!imageRes.result || imageRes.result.code !== 0) {
					uni.hideLoading()
					uni.showToast({ title: '任务图片生成失败，请再试一次～', icon: 'none' })
					return
				}

				const taskImageUrl = imageRes.result.fileID
				console.log('[mission任务图生成成功]', taskImageUrl)

				// 2. 读取小伙伴原图 b
				let list = uni.getStorageSync('companions') || []
				let charIndex = list.findIndex(c => c.id === charId)
				if (charIndex === -1) {
					uni.hideLoading()
					uni.showModal({
						title: '融合失败',
						content: '没有找到小伙伴原来的照片，请检查任务入口',
						showCancel: false
					})
					return
				}

				const characterImage = list[charIndex].imageUrl || list[charIndex].drawing_url || list[charIndex].image_url || ''
				const characterName = list[charIndex].name || list[charIndex].character_name || '小伙伴'

				console.log('[mission读取小伙伴原图]', { charId, characterName, characterImage })

				if (!characterImage) {
					uni.hideLoading()
					uni.showModal({
						title: '融合失败',
						content: '小伙伴没有原图，无法融合',
						showCancel: false
					})
					return
				}

				// 3. 调用融合云函数
				uni.showLoading({ title: '正在融合任务图片...', mask: true })
				console.log('[mission开始融合]', { taskImage: taskImageUrl, characterImage, missionText })

				const mergeRes = await uniCloud.callFunction({
					name: 'merge_story_image',
					data: {
						characterImage: characterImage,
						storyItemImage: taskImageUrl,
						characterName: characterName,
						storyType: taskId,
						taskText: missionText
					},
					timeout: 120000
				})

				if (!mergeRes.result || mergeRes.result.code !== 0) {
					uni.hideLoading()
					isMagicProcessing.value = false
					console.error('[mission融合失败]', mergeRes.result)

					const debugStage = mergeRes.result?.debug?.stage || ''
					let errorTitle = '任务融合失败'
					let errorContent = mergeRes.result?.debug?.hint || mergeRes.result?.msg || '图片融合时失败，请查看控制台日志'

					if (debugStage === 'doubao_merge_server_overloaded') {
						errorTitle = '豆包融合服务繁忙'
						errorContent = '豆包现在有点忙，请等一会儿再试。你的画已经生成成功了，但还没有和小伙伴融合。'
					}

					uni.showModal({
						title: errorTitle,
						content: errorContent,
						showCancel: false
					})
					return
				}

				const fusedImageUrl = mergeRes.result.fileID
				console.log('[mission融合成功]', fusedImageUrl)

				// 4. 更新小伙伴图片
				list[charIndex].imageUrl = fusedImageUrl
				list[charIndex].drawing_url = fusedImageUrl
				uni.setStorageSync('companions', list)
				console.log('[mission小伙伴图片已更新]', { charId, fusedImageUrl })

				// 5. 标记任务完成
				markMissionCompleted(taskId, 'invite', charId)
				console.log('[mission任务已完成]', { charId, taskId })

				uni.hideLoading()
				uni.showToast({ title: '任务完成啦～', icon: 'none', duration: 1500 })
				setTimeout(() => {
					isMagicProcessing.value = false
					uni.navigateBack({ delta: 1 })
				}, 1500)

			} catch (err) {
				console.error('[mission任务融合失败]', err)
				uni.hideLoading()
				isMagicProcessing.value = false
				uni.showModal({
					title: '任务融合失败',
					content: err.message || '图片融合时发生异常',
					showCancel: false
				})
			}
		}

		/** Mission 灵感任务：只生成图片，不融合 */
		async function handleMissionInspirationMagic(base64Data) {
			const taskId = missionTask.value.taskId

			console.log('[mission灵感任务变身]', { taskId })

			try {
				uni.showLoading({ title: '魔法变身中...', mask: true })
				const imageRes = await uniCloud.callFunction({
					name: 'generate_magic_image',
					data: { base64Image: base64Data },
					timeout: 60000
				})

				if (!imageRes.result || imageRes.result.code !== 0) {
					uni.hideLoading()
					uni.showToast({ title: '图片生成失败，请再试一次～', icon: 'none' })
					return
				}

				// 标记灵感任务完成
				markMissionCompleted(taskId, 'inspiration', '')
				console.log('[mission灵感任务已完成]', { taskId })

				uni.hideLoading()
				uni.showToast({ title: '灵感任务完成啦～', icon: 'none', duration: 1500 })
				setTimeout(() => {
					isMagicProcessing.value = false
					uni.navigateBack({ delta: 1 })
				}, 1500)

			} catch (err) {
				console.error('[mission灵感任务失败]', err)
				uni.hideLoading()
				isMagicProcessing.value = false
				uni.showModal({
					title: '任务失败',
					content: err.message || '图片生成时发生异常',
					showCancel: false
				})
			}
		}

		// ======================== renderjs 回调 ========================
		function onDrawStart() {
			hasDrawn.value = true
			showInspiration.value = false
		}

		function onCanvasReady() {}

		const onExportComplete = async (base64Data) => {
			console.log('✅ 成功跨过 renderjs 通道，进入 onExportComplete！当前模式:', exportPurpose.value)

			// ====== 分支：帮我画 ======
			if (exportPurpose.value === 'ai_help') {
				try {
					uni.showLoading({ title: '正在帮你补线稿...', mask: true })

					// Story 模式下使用故事任务相关的 prompt
					let aiHelpPrompt = ''
					if (isStoryMode.value && storyTask.value.taskText) {
						aiHelpPrompt = '你正在帮助孩子完成一个故事任务。当前任务是：' + storyTask.value.taskText + '。请根据孩子已经画出的内容，在不改变、不覆盖、不移动原有笔画的前提下，补全与任务相关的儿童线稿。只生成清晰线稿，不要生成彩色成品图。线稿要适合3-8岁儿童继续描画和涂色。'
					}

					const res = await uniCloud.callFunction({
						name: 'generate_magic_image',
						data: { base64Image: base64Data, mode: 'lineart_help', prompt: aiHelpPrompt },
						timeout: 60000
					})

					if (!res.result || res.result.code !== 0) {
						uni.showToast({ title: res.result?.msg || '线稿生成失败', icon: 'none' })
						return
					}

					const fileID = res.result.fileID
					const urlRes = await uniCloud.getTempFileURL({ fileList: [fileID] })
					const tempFileURL = urlRes.fileList?.[0]?.tempFileURL

					if (!tempFileURL) {
						uni.showToast({ title: '线稿加载失败', icon: 'none' })
						return
					}

					// 使用专用触发器：清空原画布后再加载线稿
					replaceLineartUrl.value = tempFileURL
					replaceLineartTrigger.value++
					showInspiration.value = false
					hasDrawn.value = true
					uni.showToast({ title: '线稿来啦～', icon: 'none' })
				} catch (err) {
					console.error('帮我画失败:', err)
					uni.showToast({ title: '帮我画失败了～', icon: 'none' })
				} finally {
					uni.hideLoading()
					exportPurpose.value = 'magic'
				}
				return
			}

			// ====== 分支：变身魔法 ======
			try {
				uni.showLoading({ title: '魔法变身中...', mask: true })

				console.log('[变身魔法]', {
					isStoryMode: isStoryMode.value,
					isMissionMode: isMissionMode.value,
					taskSource: missionTask.value.taskSource,
					characterId: missionTask.value.characterId,
					taskId: missionTask.value.taskId,
					storyCharacterId: storyCharacter.value.id
				})

				// Mission 模式（邀请任务）：融合任务图到小伙伴
				if (isMissionMode.value && missionTask.value.taskSource === 'invite' && missionTask.value.characterId) {
					await handleMissionInviteMagic(base64Data)
					return
				}

				// Mission 模式（灵感任务）：只标记完成，不融合
				if (isMissionMode.value && missionTask.value.taskSource === 'inspiration') {
					await handleMissionInspirationMagic(base64Data)
					return
				}

				// Story 模式：融合物品图到原小伙伴
				if (isStoryMode.value && storyCharacter.value.id) {
					const imageRes = await uniCloud.callFunction({
						name: 'generate_magic_image',
						data: { base64Image: base64Data },
						timeout: 60000
					})

					if (!imageRes.result || imageRes.result.code !== 0) {
						uni.hideLoading()
						uni.showToast({ title: '故事图片生成失败，请再试一次～', icon: 'none' })
						return
					}

					const storyItemImage = imageRes.result.fileID
					uni.showLoading({ title: '正在融合故事图片...', mask: true })

					// 获取原小伙伴图片
					const charId = storyCharacter.value.id
					let list = uni.getStorageSync('companions') || []
					let charIndex = list.findIndex(c => c.id === charId)
					if (charIndex === -1) {
						uni.hideLoading()
						uni.showToast({ title: '找不到小伙伴～', icon: 'none' })
						return
					}

					const characterImage = list[charIndex].imageUrl || list[charIndex].drawing_url || list[charIndex].image_url || ''

					// 调用融合云函数
					const mergeRes = await uniCloud.callFunction({
						name: 'merge_story_image',
						data: {
							characterImage: characterImage,
							storyItemImage: storyItemImage,
							characterName: storyCharacter.value.name,
							storyType: storyTask.value.storyType || missionTask.value.taskId || '',
							taskText: storyTask.value.taskText || missionTask.value.missionText || ''
						},
						timeout: 120000
					})

					if (!mergeRes.result || mergeRes.result.code !== 0) {
						uni.hideLoading()
						isMagicProcessing.value = false
						console.error('[story融合失败]', mergeRes.result)

						const debugStage = mergeRes.result?.debug?.stage || ''
						let errorTitle = '融合失败'
						let errorContent = mergeRes.result?.debug?.hint || mergeRes.result?.msg || '图片融合失败，请查看控制台日志'

						if (debugStage === 'doubao_merge_server_overloaded') {
							errorTitle = '豆包融合服务繁忙'
							errorContent = '豆包现在有点忙，请等一会儿再试。你的画已经生成成功了，但还没有和小伙伴融合。'
						}

						uni.showModal({
							title: errorTitle,
							content: errorContent,
							showCancel: false
						})
						return
					}

					// 更新小伙伴图片
					list[charIndex].imageUrl = mergeRes.result.fileID
					list[charIndex].drawing_url = mergeRes.result.fileID
					uni.setStorageSync('companions', list)

					// 标记故事完成
					const currentStoryType = storyTask.value.storyType || missionTask.value.taskId || 'mission'
					const completed = uni.getStorageSync('huaban_completed_stories') || {}
					if (!completed[charId]) completed[charId] = []
					if (!completed[charId].includes(currentStoryType)) {
						completed[charId].push(currentStoryType)
						uni.setStorageSync('huaban_completed_stories', completed)

						// 故事数量 +1
						const storyCount = uni.getStorageSync('huaban_story_count') || 0
						uni.setStorageSync('huaban_story_count', storyCount + 1)

						// 更新故事角色ID列表
						const storyCharIds = uni.getStorageSync('huaban_story_character_ids') || []
						if (!storyCharIds.includes(charId)) {
							storyCharIds.push(charId)
							uni.setStorageSync('huaban_story_character_ids', storyCharIds)
						}

						// 好感度 +5%
						const bondCounts = uni.getStorageSync('huaban_story_counts_by_character') || {}
						bondCounts[charId] = (bondCounts[charId] || 0) + 1
						uni.setStorageSync('huaban_story_counts_by_character', bondCounts)
					}

					uni.hideLoading()
					uni.showToast({ title: '故事完成啦，小伙伴有新样子了！', icon: 'none', duration: 2000 })
					setTimeout(() => {
						isMagicProcessing.value = false
						uni.navigateBack({ delta: 1 })
					}, 2000)
					return
				}

				// 普通模式：创建新小伙伴
				const [imageRes, visionRes] = await Promise.all([
					uniCloud.callFunction({
						name: 'generate_magic_image',
						data: { base64Image: base64Data },
						timeout: 60000
					}),
					uniCloud.callFunction({
						name: 'recognize_drawing',
						data: { base64Image: base64Data, mode: pageAction.value },
						timeout: 60000
					})
				])

				if (!imageRes.result || imageRes.result.code !== 0) {
					uni.hideLoading()
					isMagicProcessing.value = false
					const errMsg = (imageRes.result?.msg || '图片生成失败') + (imageRes.result?.detail ? '\n' + imageRes.result.detail : '')
					uni.showModal({ title: '魔法失败', content: errMsg, showCancel: false })
					return
				}

				const fileID = imageRes.result.fileID
				uni.showLoading({ title: '正在赋予灵魂...', mask: true })

				const buildFallback = (name, desc) => {
					const c = { id: Date.now().toString(), imageUrl: fileID, createdAt: Date.now(), name: name, description: desc, personality: '', specialty: '', messages: [] }
					let list = uni.getStorageSync('companions') || []
					list.unshift(c)
					uni.setStorageSync('companions', list)
					uni.navigateTo({ url: '/pages/chat/chat?id=' + c.id })
				}

				if (!visionRes.result || visionRes.result.code !== 0) {
					console.error('❌ 视觉识别失败:', visionRes.result?.msg, visionRes.result?.detail)
					if (pageAction.value === 'add_story') {
						isMagicProcessing.value = false
						uni.navigateBack({ delta: 1 })
					} else {
						buildFallback('小可爱', '一个神奇的小精灵')
					}
					uni.hideLoading()
					return
				}

				let content = visionRes.result.content
				content = content.replace(/```json/g, '').replace(/```/g, '').trim()

				if (pageAction.value === 'add_story') {
					uni.showLoading({ title: '正在打包礼物...', mask: true })
					let list = uni.getStorageSync('companions') || []
					let targetIndex = list.findIndex(c => c.id === targetCompanionId.value)
					if (targetIndex > -1) {
						list[targetIndex].description += '\n【重要经历】：' + content + '。这让你非常开心，并在之后的聊天中经常提及这段回忆。';
						const userGiftMsg = {
							id: Date.now().toString() + '_1',
							role: 'user',
							content: '你看！我给你画了新故事！',
							imageUrl: fileID
						}
						const systemEventMsg = {
							id: Date.now().toString() + '_2',
							role: 'system',
							content: '【系统事件】：小朋友刚刚为你画了一幅画，触发了新剧情："' + content + '"。请你立刻以极其惊喜和感动的口吻，代入这个新剧情，跟小朋友说一说这个画里的东西带给你了什么奇妙的体验！'
						}
						list[targetIndex].messages.push(userGiftMsg, systemEventMsg)
						uni.setStorageSync('companions', list)
					}
					uni.hideLoading()
					uni.navigateBack({ delta: 1 })
					return
				}

				try {
					const parsedData = JSON.parse(content)
					uni.showLoading({ title: '正在施展定型魔法...', mask: true })
					const newCompanion = {
						id: Date.now().toString(),
						imageUrl: fileID,
						createdAt: Date.now(),
						name: parsedData.name || '小可爱',
						description: parsedData.description || '一个神奇的小精灵',
						personality: parsedData.personality || parsedData.personality_type || parsedData.speaking_style || '',
						specialty: parsedData.specialty || parsedData.talent || parsedData.skill || '',
						messages: []
					}
					let list = uni.getStorageSync('companions') || []
					list.unshift(newCompanion)
					uni.setStorageSync('companions', list)
					uni.navigateTo({ url: '/pages/chat/chat?id=' + newCompanion.id })
				} catch (e) {
					console.error('❌ JSON解析失败，使用兜底:', e, '原始内容:', content)
					buildFallback('小可爱', '一个神奇的小精灵')
				}

				uni.hideLoading()
				isMagicProcessing.value = false
			} catch (err) {
				console.error('❌ 云函数调用失败:', err)
				uni.hideLoading()
				isMagicProcessing.value = false
				uni.showModal({ title: '网络出错了', content: err.message || '请求失败', showCancel: false })
			}
		}

		// ======================== Mission 模式状态 ========================
		const isMissionMode = ref(false)
		const missionStarted = ref(false)
		const showMissionPrompt = ref(true)
		const missionTask = ref({
			taskId: '',
			taskSource: '',
			missionText: '画一个神奇的东西',
			characterId: '',
			characterName: ''
		})

		// ======================== 生命周期 ========================
		onLoad((options) => {
			if (options.action === 'add_story' && options.id) {
				pageAction.value = 'add_story'
				targetCompanionId.value = options.id
			}

			// Mission 模式识别
			if (options.mode === 'mission') {
				isMissionMode.value = true
				isStoryMode.value = true
				showInspiration.value = false
				hasDrawn.value = false

				missionTask.value = {
					taskId: options.taskId || '',
					taskSource: options.taskSource || '',
					missionText: options.missionText || '画一个神奇的东西',
					characterId: options.characterId || '',
					characterName: options.characterName || ''
				}

				storyTask.value = {
					characterId: options.characterId || '',
					storyType: 'mission',
					taskText: '任务：' + (options.missionText || '画一个神奇的东西'),
					taskSpeakText: '开始你的创作吧，任务：' + (options.missionText || '画一个神奇的东西'),
					thoughtText: '',
					storyImage: ''
				}

				// 加载角色信息
				if (options.characterId) {
					const list = uni.getStorageSync('companions') || []
					const found = list.find(item => item.id === options.characterId)
					if (found) {
						storyCharacter.value = {
							id: found.id,
							name: found.name || found.character_name || '小伙伴',
							image: found.drawing_url || found.image_url || found.avatar || found.image || found.drawingUrl || found.imageUrl || ''
						}
					}
				}

				// 灵感任务模式不显示小伙伴头像和云朵
				if (options.taskSource === 'inspiration') {
					showThoughtCloud.value = false
					storyCharacter.value = { id: '', name: '', image: '' }
				}

				return
			}

			// Story 模式识别
			if (options.mode === 'story' || options.from === 'story' || options.storyType) {
				isStoryMode.value = true
				showInspiration.value = false
				hasDrawn.value = false

				// 读取任务信息
				const cached = uni.getStorageSync('huaban_current_story_task')
				if (cached) {
					storyTask.value = {
						characterId: cached.characterId || options.characterId || '',
						storyType: cached.storyType || options.storyType || '',
						taskText: cached.taskText || '任务：给小伙伴画一个故事',
						taskSpeakText: cached.taskSpeakText || '开始你的创作吧',
						thoughtText: cached.thoughtText || '我想要一个新的故事',
						storyImage: cached.storyImage || ''
					}
				} else if (options.storyType) {
					const characterId = options.characterId || ''
					const storyType = options.storyType
					const name = '小伙伴'

					let taskText = '任务：给' + name + '画一个故事'
					let taskSpeakText = '开始你的创作吧，任务：给' + name + '画一个故事'
					let thoughtText = '我想要一个新的故事'
					let storyImage = ''

					if (storyType === 'candy') {
						taskText = '任务：给' + name + '画一些糖果'
						taskSpeakText = '开始你的创作吧，任务：给' + name + '画一些糖果'
						thoughtText = '我想要吃一些糖果'
						storyImage = '/static/ui/story/story-candy.png'
					} else if (storyType === 'house') {
						taskText = '任务：给' + name + '画一个房子'
						taskSpeakText = '开始你的创作吧，任务：给' + name + '画一个房子'
						thoughtText = '我想要一个粉色的家'
						storyImage = '/static/ui/story/story-house.png'
					} else if (storyType === 'backpack') {
						taskText = '任务：给' + name + '画一个会飞的书包'
						taskSpeakText = '开始你的创作吧，任务：给' + name + '画一个会飞的书包'
						thoughtText = '我想要一个会飞的书包'
						storyImage = '/static/ui/story/story-backpack.png'
					}

					storyTask.value = { characterId, storyType, taskText, taskSpeakText, thoughtText, storyImage }
				}

				// 加载角色信息
				const charId = storyTask.value.characterId || options.characterId
				if (charId) {
					const list = uni.getStorageSync('companions') || []
					const found = list.find(item => item.id === charId)
					if (found) {
						storyCharacter.value = {
							id: found.id,
							name: found.name || found.character_name || '小伙伴',
							image: found.drawing_url || found.image_url || found.avatar || found.image || found.drawingUrl || found.imageUrl || ''
						}
					}
				}
			}
		})

		return {
			canvasState,
			brushColor,
			brushSize,
			eraserActive,
			hasDrawn,
			showInspiration,
			showDialog,
			dialogType,
			dialogInput,
			isRefreshing,
			colorTabs,
			dotSize,
			dialogTitle,
			dialogPlaceholder,
			pageAction,
			exportPurpose,
			replaceLineartUrl,
			replaceLineartTrigger,
			// Story 模式
			isStoryMode,
			storyStarted,
			showStoryPrompt,
			showThoughtCloud,
			storyTask,
			storyCharacter,
			// Mission 模式
			isMissionMode,
			missionStarted,
			showMissionPrompt,
			missionTask,
			onDrawStart,
			onExportComplete,
			onCanvasReady,
			selectColor,
			increaseBrushSize,
			decreaseBrushSize,
			toggleEraser,
			clearCanvas,
			triggerUndo,
			triggerRedo,
			triggerExport,
			handleAiHelp,
			handleBucket,
			handleSaveExit,
			speakTodayDraw,
			speakStoryTask,
			startStoryDrawing,
			markStoryCompleted,
			hideInspiration,
			handleRefreshInspiration,
			showInspirationDialog,
			closeDialog,
			generateFromDialog,
			generateMagicPerson
		}
	}
}
</script>

<script module="canvasRender" lang="renderjs">
export default {
	data() {
		return {
			canvas: null,
			fabricLoaded: false,
			lastClearTrigger: 0,
			lastLoadTemplateTrigger: 0,
			lastExportTrigger: 0,
			lastUndoTrigger: 0,
			lastRedoTrigger: 0,
			lastLoadTemplateFromUrlTrigger: 0,
			lastSetBackgroundTrigger: 0,
			lastReplaceLineartTrigger: 0,
			undoStack: [],
			redoStack: []
		}
	},

	mounted() {
		setTimeout(() => {
			this._loadFabricAndInit()
		}, 150)
	},

	methods: {
		_loadFabricAndInit() {
			if (typeof window.fabric !== 'undefined') {
				this.fabricLoaded = true
				this._initCanvas()
				return
			}

			const script = document.createElement('script')
			script.src = 'https://cdn.jsdelivr.net/npm/fabric@5.3.0/dist/fabric.min.js'
			script.onload = () => {
				this.fabricLoaded = true
				this._initCanvas()
			}
			script.onerror = (err) => {
				console.error('[renderjs] Fabric.js CDN 加载失败:', err)
			}
			document.head.appendChild(script)
		},

		_initCanvas() {
			const container = document.getElementById('canvasContainer')
			if (!container) {
				console.error('[renderjs] 找不到容器 #canvasContainer')
				return
			}

			const containerWidth = container.clientWidth
			const containerHeight = container.clientHeight
			console.log('[renderjs] 画布容器尺寸:', containerWidth, 'x', containerHeight)

			const nativeCanvas = document.createElement('canvas')
			nativeCanvas.id = 'fabricCanvas'
			nativeCanvas.width = containerWidth
			nativeCanvas.height = containerHeight

			container.appendChild(nativeCanvas)

			this.canvas = new fabric.Canvas(nativeCanvas, {
				width: containerWidth,
				height: containerHeight,
				isDrawingMode: true,
				backgroundColor: '#FDF8F0'
			})

			const brush = this.canvas.freeDrawingBrush
			brush.color = '#333333'
			brush.width = 4
			brush.strokeLineCap = 'round'
			brush.strokeLineJoin = 'round'

			const ownerInstance = this.$ownerInstance

			ownerInstance.callMethod('onCanvasReady')

			// 监听鼠标按下：保存绘制前的画布快照
			this.canvas.on('mouse:down', () => {
				this._pendingState = this._saveState()
				ownerInstance.callMethod('onDrawStart')
			})

			// 监听路径创建：将绘制前的快照推入撤回栈
			this.canvas.on('path:created', (e) => {
				if (e.path) {
					const state = this._pendingState || this._saveState()
					this.undoStack.push(state)
					this.redoStack = []
					this._pendingState = null
				}
				ownerInstance.callMethod('onDrawStart')
			})

			console.log('[renderjs] Fabric.js 画布初始化完成')
		},

		onStateChange(newValue, oldValue) {
			if (!this.canvas || !this.fabricLoaded) return
			if (!newValue) return

			// 清空画布
			if (newValue.clearTrigger !== this.lastClearTrigger) {
				this.lastClearTrigger = newValue.clearTrigger
				this.canvas.clear()
				this.canvas.backgroundImage = null
				this.canvas.backgroundColor = '#FDF8F0'
				this.canvas.renderAll()
				this.undoStack = []
				this.redoStack = []
				return
			}

			// 加载 SVG 模板
			if (newValue.loadTemplateTrigger !== this.lastLoadTemplateTrigger) {
				this.lastLoadTemplateTrigger = newValue.loadTemplateTrigger
				if (newValue.templateSvg) {
					this._loadTemplate(newValue.templateSvg)
				}
				return
			}

			// 加载线稿图片
			if (newValue.loadTemplateFromUrlTrigger !== this.lastLoadTemplateFromUrlTrigger) {
				this.lastLoadTemplateFromUrlTrigger = newValue.loadTemplateFromUrlTrigger
				if (newValue.templateUrl) {
					this._loadTemplateFromUrl(newValue.templateUrl)
				}
				return
			}

			// 替换线稿（帮我画专用：清空原画布后加载）
			if (newValue.replaceLineartTrigger !== this.lastReplaceLineartTrigger) {
				this.lastReplaceLineartTrigger = newValue.replaceLineartTrigger
				if (newValue.replaceLineartUrl) {
					this._replaceCanvasWithLineart(newValue.replaceLineartUrl)
				}
				return
			}

			// 导出画布
			if (newValue.exportTrigger !== this.lastExportTrigger) {
				this.lastExportTrigger = newValue.exportTrigger
				this._exportCanvas()
				return
			}

			// 撤回
			if (newValue.undoTrigger !== this.lastUndoTrigger) {
				this.lastUndoTrigger = newValue.undoTrigger
				this._undo()
				return
			}

			// 重做
			if (newValue.redoTrigger !== this.lastRedoTrigger) {
				this.lastRedoTrigger = newValue.redoTrigger
				this._redo()
				return
			}

			// 设置背景色（油漆桶）：先保存旧状态，再改色
			if (newValue.setBackgroundTrigger !== this.lastSetBackgroundTrigger) {
				this.lastSetBackgroundTrigger = newValue.setBackgroundTrigger
				this.undoStack.push(this._saveState())
				this.redoStack = []
				this.canvas.backgroundColor = newValue.bgColor
				this.canvas.renderAll()
				return
			}

			// 更新画笔属性
			const brush = this.canvas.freeDrawingBrush
			if (!brush) return

			if (newValue.eraserActive) {
				brush.color = newValue.bgColor || '#FDF8F0'
				brush.width = newValue.brushSize * 3
			} else {
				brush.color = newValue.brushColor
				brush.width = newValue.brushSize
			}

			brush.strokeLineCap = 'round'
			brush.strokeLineJoin = 'round'
		},

		_loadTemplate(svgString) {
			const canvas = this.canvas
			if (!canvas) return

			fabric.loadSVGFromString(svgString, function(objects, options) {
				const group = fabric.util.groupSVGElements(objects, options)
				const canvasWidth = canvas.getWidth()
				const canvasHeight = canvas.getHeight()
				const scaleX = (canvasWidth * 0.6) / group.width
				const scaleY = (canvasHeight * 0.6) / group.height
				const scale = Math.min(scaleX, scaleY)

				group.set({
					scaleX: scale,
					scaleY: scale,
					left: canvasWidth / 2,
					top: canvasHeight / 2,
					originX: 'center',
					originY: 'center',
					selectable: false,
					evented: false,
					opacity: 0.6,
					excludeFromExport: false
				})

				canvas.add(group)
				canvas.sendToBack(group)
				canvas.renderAll()
			})
		},

		_loadTemplateFromUrl(url) {
			const canvas = this.canvas
			if (!canvas) return

			fabric.Image.fromURL(url, function(img) {
				if (!img) return

				const canvasWidth = canvas.getWidth()
				const canvasHeight = canvas.getHeight()
				const scale = Math.min(canvasWidth / img.width, canvasHeight / img.height)

				canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
					opacity: 0.25,
					scaleX: scale,
					scaleY: scale,
					originX: 'center',
					originY: 'center',
					left: canvasWidth / 2,
					top: canvasHeight / 2,
					crossOrigin: 'anonymous'
				})
			}, { crossOrigin: 'anonymous' })
		},

		_replaceCanvasWithLineart(url) {
			const canvas = this.canvas
			if (!canvas) return

			// 清空孩子原有笔画和旧背景图
			canvas.getObjects().forEach(obj => {
				canvas.remove(obj)
			})
			canvas.backgroundImage = null
			canvas.backgroundColor = '#FDF8F0'
			canvas.renderAll()

			// 清空撤回/重做栈
			this.undoStack = []
			this.redoStack = []

			fabric.Image.fromURL(url, function(img) {
				if (!img) return

				const canvasWidth = canvas.getWidth()
				const canvasHeight = canvas.getHeight()
				const scale = Math.min(canvasWidth / img.width, canvasHeight / img.height)

				canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
					opacity: 0.35,
					scaleX: scale,
					scaleY: scale,
					originX: 'center',
					originY: 'center',
					left: canvasWidth / 2,
					top: canvasHeight / 2,
					crossOrigin: 'anonymous'
				})
			}, { crossOrigin: 'anonymous' })
		},

		_exportCanvas() {
			if (!this.canvas) return

			const canvas = this.canvas
			const ownerInstance = this.$ownerInstance
			try {
				const originalBg = canvas.backgroundColor
				canvas.backgroundColor = '#FFFFFF'
				canvas.renderAll()

				const dataURL = canvas.toDataURL({
					format: 'jpeg',
					quality: 0.7,
					multiplier: 0.5
				})

				canvas.backgroundColor = originalBg
				canvas.renderAll()

				ownerInstance.callMethod('onExportComplete', dataURL)
			} catch (err) {
				console.error('[renderjs] 画布导出失败:', err)
			}
		},

		_saveState() {
			const canvas = this.canvas
			if (!canvas) return '{}'
			const json = canvas.toJSON()
			json.backgroundColor = canvas.backgroundColor || '#FDF8F0'
			if (canvas.backgroundImage) {
				json.backgroundImage = canvas.backgroundImage
			}
			return JSON.stringify(json)
		},

		_restoreState(jsonStr) {
			try {
				const canvas = this.canvas
				const json = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr
				canvas.loadFromJSON(json, () => {
					canvas.backgroundColor = json.backgroundColor || '#FDF8F0'
					canvas.renderAll()
				})
			} catch (e) {
				console.error('[renderjs] 恢复状态失败:', e)
			}
		},

		_undo() {
			if (!this.canvas || this.undoStack.length === 0) return

			const prevState = this.undoStack.pop()
			// 保存当前状态到重做栈
			this.redoStack.push(this._saveState())
			// 恢复上一个状态
			this._restoreState(prevState)
		},

		_redo() {
			if (!this.canvas || this.redoStack.length === 0) return

			const nextState = this.redoStack.pop()
			// 保存当前状态到撤回栈
			this.undoStack.push(this._saveState())
			// 恢复下一个状态
			this._restoreState(nextState)
		}
	}
}
</script>

<style>
.drawing-page {
	width: 100vw;
	height: 100vh;
	position: relative;
	overflow: hidden;
	background-color: #FFF9EC;
}

.drawing-page .page-bg {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	z-index: 1;
}

/* ==================== 左上角保存退出 ==================== */
.drawing-page .save-exit-btn {
	position: absolute;
	top: 70rpx;
	left: 80rpx;
	width: 500rpx;
	z-index: 30;
	cursor: pointer;
	transition: transform 0.15s ease;
}

.drawing-page .save-exit-btn:active {
	transform: scale(0.95);
}

/* ==================== 右上角操作按钮 ==================== */
.drawing-page .top-actions {
	position: absolute;
	right: 115rpx;
	top: 60rpx;
	z-index: 30;
	display: flex;
	gap: 30rpx;
}

.drawing-page .magic-btn {
	width: 255rpx;
	cursor: pointer;
	transition: transform 0.15s ease;
}

.drawing-page .magic-btn:active {
	transform: scale(0.95);
}

.drawing-page .ai-help-btn {
	width: 225rpx;
	cursor: pointer;
	transition: transform 0.15s ease;
}

.drawing-page .ai-help-btn:active {
	transform: scale(0.95);
}

/* ==================== 左侧撤回回退 ==================== */
.drawing-page .side-actions {
	position: absolute;
	left: 100rpx;
	top: 280rpx;
	z-index: 30;
	display: flex;
	flex-direction: column;
	gap: 24rpx;
}

.drawing-page .side-btn {
	width: 124rpx;
	height: 124rpx;
	cursor: pointer;
	transition: transform 0.15s ease;
}

.drawing-page .side-btn:active {
	transform: scale(0.95);
}

/* ==================== 画板区域 ==================== */
.drawing-page .board-area {
	position: absolute;
	left: 300rpx;
	top: 250rpx;
	width: 1750rpx;
	height: 1100rpx;
	z-index: 10;
}

.drawing-page .canvas-board-bg {
	position: absolute;
	left: 0;
	top: 0;
	width: 100%;
	height: 100%;
	z-index: 1;
}

.drawing-page .canvas-draw-layer {
	position: absolute;
	left: 70rpx;
	top: 75rpx;
	width: 1600rpx;
	height: 950rpx;
	z-index: 3;
	overflow: hidden;
}

.drawing-page .renderjs-bridge {
	position: absolute;
	width: 0;
	height: 0;
	overflow: hidden;
	opacity: 0;
	pointer-events: none;
}

.drawing-page .board-clip {
	position: absolute;
	left: 50%;
	top: -48rpx;
	transform: translateX(-50%);
	width: 250rpx;
	z-index: 8;
}

.drawing-page .board-pin {
	position: absolute;
	width: 56rpx;
	height: 56rpx;
	z-index: 9;
}

.drawing-page .pin-lt { left: 48rpx; top: 58rpx; }
.drawing-page .pin-rt { right: 48rpx; top: 58rpx; }
.drawing-page .pin-lb { left: 48rpx; bottom: 58rpx; }
.drawing-page .pin-rb { right: 48rpx; bottom: 58rpx; }

/* ==================== 灵感提示组件 ==================== */
.drawing-page .inspiration-panel {
	position: absolute;
	left: 50%;
	top: 48%;
	transform: translate(-50%, -50%);
	z-index: 20;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 24rpx;
	pointer-events: auto;
}

.drawing-page .text-today-draw {
	height: 75rpx;
	cursor: pointer;
}

.drawing-page .inspiration-options {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 18rpx;
}

.drawing-page .inspiration-item {
	width: 460rpx;
	height: 90rpx;
	cursor: pointer;
	transition: transform 0.2s ease;
}

.drawing-page .inspiration-item:active {
	transform: scale(0.95);
}

.drawing-page .btn-draw-myself {
	width: 300rpx;
	cursor: pointer;
	transition: transform 0.15s ease;
}

.drawing-page .btn-draw-myself:active {
	transform: scale(0.95);
}

.drawing-page .refresh-inspiration {
	display: flex;
	align-items: center;
	gap: 10rpx;
	cursor: pointer;
}

.drawing-page .icon-refresh {
	width: 42rpx;
	height: 42rpx;
	transition: transform 0.6s ease;
}

.drawing-page .icon-refresh.rotating {
	animation: rotateOnce 0.6s ease;
}

@keyframes rotateOnce {
	from { transform: rotate(0deg); }
	to { transform: rotate(360deg); }
}

.drawing-page .text-refresh {
	height: 34rpx;
}

/* ==================== 底部工具栏 ==================== */
.drawing-page .bottom-toolbar {
	position: absolute;
	left: 10rpx;
	bottom: -140rpx;
	width: 2300rpx;
	z-index: 20;
	display: flex;
	align-items: flex-end;
	justify-content: center;
	gap: 30rpx;
}

/* 颜色标签 */
.drawing-page .color-tabs {
	display: flex;
	gap: 25rpx;
}

.drawing-page .color-tab {
	width: 140rpx;
	height: 280rpx;
	transform: translateY(0);
	transition: transform 0.2s ease;
	cursor: pointer;
}

.drawing-page .color-tab.active {
	transform: translateY(-68rpx);
}

.drawing-page .color-img {
	width: 100%;
	height: 100%;
}

/* 橡皮擦 */
.drawing-page .tool-eraser {
	width: 160rpx;
	height: 280rpx;
	transform: translateY(0);
	transition: transform 0.2s ease;
	cursor: pointer;
	margin-right: -30rpx;
}

.drawing-page .tool-eraser.active {
	transform: translateY(-68rpx);
}

.drawing-page .eraser-img {
	width: 100%;
	height: 100%;
}

/* 油漆桶 */
.drawing-page .tool-bucket {
	width: 170rpx;
	height: 280rpx;
	transform: translateY(0);
	transition: transform 0.2s ease;
	cursor: pointer;
}

.drawing-page .tool-bucket:active {
	transform: translateY(-15rpx);
}

.drawing-page .bucket-img {
	width: 100%;
	height: 100%;
}

/* 画笔粗细调节 */
.drawing-page .brush-size-control {
	display: flex;
	align-items: center;
	gap: 20rpx;
	margin-left: 30rpx;
	transform: translateY(-165rpx);
}

.drawing-page .btn-minus,
.drawing-page .btn-plus {
	width: 96rpx;
	height: 96rpx;
	cursor: pointer;
	transition: transform 0.15s ease;
}

.drawing-page .btn-minus:active,
.drawing-page .btn-plus:active {
	transform: scale(0.95);
}

.drawing-page .brush-size-display {
	position: relative;
	width: 130rpx;
	height: 130rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.drawing-page .brush-size-bg {
	position: absolute;
	width: 130rpx;
	height: 130rpx;
}

.drawing-page .brush-size-dot {
	position: relative;
	z-index: 1;
}

/* ==================== 灵感输入弹窗 ==================== */
.drawing-page .inspiration-dialog-mask {
	position: fixed;
	top: 0;
	left: 0;
	width: 100vw;
	height: 100vh;
	background-color: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 100;
}

.drawing-page .inspiration-dialog {
	width: 600rpx;
	background-color: #FFFDF5;
	border-radius: 40rpx;
	border: 4rpx solid #D4A574;
	padding: 50rpx;
	display: flex;
	flex-direction: column;
	gap: 30rpx;
}

.drawing-page .dialog-title {
	font-size: 36rpx;
	font-weight: bold;
	color: #5A3010;
	text-align: center;
}

.drawing-page .dialog-input {
	height: 100rpx;
	background-color: #FFFFFF;
	border-radius: 30rpx;
	border: 3rpx solid #D4A574;
	padding: 0 30rpx;
	font-size: 30rpx;
	color: #5A3010;
}

.drawing-page .dialog-buttons {
	display: flex;
	gap: 30rpx;
	justify-content: center;
}

.drawing-page .dialog-btn {
	padding: 20rpx 60rpx;
	border-radius: 40rpx;
	transition: transform 0.15s ease;
}

.drawing-page .dialog-btn:active {
	transform: scale(0.95);
}

.drawing-page .dialog-btn.cancel {
	background-color: #F5F0E8;
	border: 3rpx solid #D4A574;
}

.drawing-page .dialog-btn.confirm {
	background-color: #FF8A5C;
}

.drawing-page .dialog-btn-text {
	font-size: 30rpx;
	font-weight: bold;
	color: #5A3010;
}

.drawing-page .dialog-btn.confirm .dialog-btn-text {
	color: #FFFFFF;
}

/* ==================== Story 模式样式 ==================== */
.drawing-page .story-prompt {
	position: absolute;
	left: 50%;
	top: 50%;
	transform: translate(-50%, -50%);
	z-index: 20;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 20rpx;
	pointer-events: auto;
}

.drawing-page .text-start-create {
	height: 80rpx;
	cursor: pointer;
}

.drawing-page .story-task-label {
	position: relative;
	width: 470rpx;
	height: 90rpx;
}

.drawing-page .story-task-label-bg {
	position: absolute;
	left: 0;
	top: 0;
	width: 100%;
	height: 100%;
}

.drawing-page .story-task-text {
	position: absolute;
	left: 0;
	top: -3rpx;
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 32rpx;
	font-weight: bold;
	color: #7A3E18;
}

.drawing-page .btn-start-create {
	width: 260rpx;
	cursor: pointer;
	transition: transform 0.15s ease;
}

.drawing-page .btn-start-create:active {
	transform: scale(0.95);
}

.drawing-page .story-draw-lock {
	position: absolute;
	left: 55rpx;
	top: 70rpx;
	width: 1390rpx;
	height: 690rpx;
	z-index: 15;
	background: transparent;
}

.drawing-page .story-task-compact {
	position: absolute;
	left: 50%;
	bottom: 45rpx;
	transform: translateX(-50%);
	width: 470rpx;
	height: 90rpx;
	z-index: 20;
}

.drawing-page .story-task-compact-bg {
	position: absolute;
	left: 0;
	top: 0;
	width: 100%;
	height: 100%;
}

.drawing-page .story-task-compact-text {
	position: absolute;
	left: 0;
	top: 0;
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 32rpx;
	font-weight: bold;
	color: #7A3E18;
}

.drawing-page .story-thought {
	position: absolute;
	right: -100rpx;
	bottom: 155rpx;
	width: 480rpx;
	height: 360rpx;
	z-index: 25;
}

.drawing-page .thought-cloud {
	position: absolute;
	right: 0rpx;
	top: 0;
	width: 420rpx;
	height: 300rpx;
	z-index: 2;
}

.drawing-page .thought-close {
	position: absolute;
	right: 70rpx;
	top: 15rpx;
	width: 62rpx;
	height: 62rpx;
	z-index: 5;
	cursor: pointer;
}

.drawing-page .thought-story-image {
	position: absolute;
	left: 140rpx;
	top: 40rpx;
	width: 280rpx;
	height: 140rpx;
	z-index: 4;
}

.drawing-page .thought-text {
	position: absolute;
	left: 165rpx;
	top: 185rpx;
	width: 220rpx;
	text-align: center;
	font-size: 20rpx;
	color: #7A3E18;
	z-index: 4;
}

.drawing-page .thought-character {
	position: absolute;
	right: -90rpx;
	bottom: -120rpx;
	width: 210rpx;
	height: 210rpx;
	border-radius: 50%;
	z-index: 3;
}
</style>
