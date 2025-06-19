<template>
  <el-dialog
    :model-value="visible"
    width="900px"
    top="6vh"
    :show-close="true"
    append-to-body
    :before-close="handlePreviewClose"
    class="custom-preview-dialog"
  >
    <template #title>
      <span>图片预览</span>
      <el-button @click="togglePreviewFlip" size="small" style="margin-left:16px;" :icon="RefreshRight">翻转</el-button>
      <span style="margin-left:16px;font-size:13px;color:#999;">滚轮缩放</span>
    </template>
    <div class="preview-img-wrapper">
      <div class="preview-img-scroll" ref="previewImgScrollRef">
        <img :src="imageUrl"
             @mousedown="onPreviewImgMouseDown"
             draggable="false"
             :style="{
               maxWidth: '1600px',
               maxHeight: '1200px',
               transform: `scale(${previewScale}) ${previewFlipped ? 'rotate(180deg)' : ''}`,
               transition: 'transform 0.3s',
               cursor: isDragging ? 'grabbing' : 'grab',
               background: '#f6f8fa',
               borderRadius: '12px',
               boxShadow: '0 4px 24px rgba(0,0,0,0.12)'
             }"
             @wheel="handlePreviewWheel"
        />
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { RefreshRight } from '@element-plus/icons-vue'

const props = defineProps({
  visible: Boolean,
  imageUrl: String,
  onClose: Function
})

const emit = defineEmits(['update:visible'])

const previewFlipped = ref(false)
const previewScale = ref(1)
const isDragging = ref(false)
const previewImgScrollRef = ref(null)
let dragStartX = 0
let dragStartY = 0
let scrollStartLeft = 0
let scrollStartTop = 0

const togglePreviewFlip = () => {
  previewFlipped.value = !previewFlipped.value
}
const handlePreviewWheel = (e) => {
  e.preventDefault()
  let next = previewScale.value + (e.deltaY < 0 ? 0.1 : -0.1)
  if (next < 0.2) next = 0.2
  if (next > 5) next = 5
  previewScale.value = next
}
const handlePreviewClose = (done) => {
  previewScale.value = 1
  previewFlipped.value = false
  emit('update:visible', false)
  if (props.onClose) props.onClose()
  done && done()
}

const onPreviewImgMouseDown = (e) => {
  if (e.button !== 0) return
  isDragging.value = true
  dragStartX = e.clientX
  dragStartY = e.clientY
  const el = previewImgScrollRef.value
  scrollStartLeft = el.scrollLeft
  scrollStartTop = el.scrollTop
  document.body.style.cursor = 'grabbing'
  e.preventDefault()
}
const onPreviewMouseMove = (e) => {
  if (!isDragging.value) return
  const el = previewImgScrollRef.value
  el.scrollLeft = scrollStartLeft - (e.clientX - dragStartX)
  el.scrollTop = scrollStartTop - (e.clientY - dragStartY)
}
const onPreviewMouseUp = () => {
  if (isDragging.value) {
    isDragging.value = false
    document.body.style.cursor = ''
  }
}

watch(() => props.visible, (val) => {
  if (val) {
    previewScale.value = 1
    previewFlipped.value = false
  }
})

onMounted(() => {
  window.addEventListener('mousemove', onPreviewMouseMove)
  window.addEventListener('mouseup', onPreviewMouseUp)
})
onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onPreviewMouseMove)
  window.removeEventListener('mouseup', onPreviewMouseUp)
})
</script>

<style scoped>
.custom-preview-dialog .el-dialog {
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
  background: linear-gradient(135deg, #fff 80%, #f5f7fa 100%);
}
.custom-preview-dialog .el-dialog__body {
  padding: 0 0 24px 0;
}
.preview-img-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  background: #f6f8fa;
  border-radius: 12px;
  padding: 0;
  height: 700px;
}
.preview-img-scroll {
  width: 100%;
  height: 100%;
  max-width: 850px;
  max-height: 700px;
  overflow: auto;
  background: #f6f8fa;
  border-radius: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  box-sizing: border-box;
}
.preview-img-scroll img {
  display: block;
  margin: auto;
}
</style> 