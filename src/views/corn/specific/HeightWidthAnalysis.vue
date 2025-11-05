<template>
  <div class="corn-trait-container">
    <div class="page-header">
      <h1 class="page-title">玉米长度/宽度测量</h1>
      <p class="page-description">上传玉米图片，获取长度和宽度测量数据</p>
    </div>

    <div class="content-wrapper">
      <!-- 图片上传区域 -->
      <div class="upload-section">
        <div class="section-title">
          <el-icon><Upload /></el-icon>
          <span>图片上传</span>
        </div>
        <div
            class="upload-area"
            @click="triggerFileInput"
            @drop.prevent="handleDrop"
            @dragover.prevent
            @dragenter.prevent="handleDragEnter"
            @dragleave.prevent="handleDragLeave"
            :class="{ 'drag-over': isDragging }"
        >
          <input type="file" ref="fileInput" style="display: none" accept="image/*" @change="handleFileChange" />
          <div v-if="!uploadedImage" class="upload-placeholder">
            <el-icon class="upload-icon"><Upload /></el-icon>
            <div class="upload-text">拖拽文件到这里 或者 <span class="click-upload">点击上传</span></div>
            <div class="file-limit">jpg/png 文件大小小于 30M</div>
          </div>
          <div v-else class="image-preview">
            <img :src="uploadedImage" alt="上传的图片" />
            <div class="image-actions">
              <el-button type="danger" size="small" icon="Delete" circle @click.stop="removeImage"></el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 分析结果区域 -->
      <div class="result-section">
        <div class="section-header">
          <h2>测量结果</h2>
          <el-button 
            type="primary" 
            @click="copyAllData"
            :icon="CopyDocument"
            size="small"
            :disabled="!analysisResult"
          >
            一键复制数据
          </el-button>
        </div>

        <!-- 测量数据显示 -->
        <div class="data-section">
          <div class="section-title-wrapper">
            <div class="section-icon">
              <el-icon><Histogram /></el-icon>
            </div>
            <h3 class="section-title">长度/宽度测量数据</h3>
            <div class="section-description">玉米长度和宽度测量结果（单位：cm）</div>
          </div>
          
          <div class="section-content">
            <div class="measurement-result">
              <el-row :gutter="15">
                <!-- 长度 -->
                <el-col :span="8">
                  <div class="info-card">
                    <div class="card-header">
                      <el-icon><TrendCharts /></el-icon>
                      <span>长度</span>
                    </div>
                    <div class="card-content">
                      <div class="measurement-display">
                        <div class="measurement-value">{{ analysisResult ? analysisResult.length?.toFixed(4) : '--' }}</div>
                        <div class="measurement-unit">cm</div>
                      </div>
                    </div>
                  </div>
                </el-col>

                <!-- 中心宽度 -->
                <el-col :span="8">
                  <div class="info-card">
                    <div class="card-header">
                      <el-icon><Histogram /></el-icon>
                      <span>中心宽度</span>
                    </div>
                    <div class="card-content">
                      <div class="measurement-display">
                        <div class="measurement-value">{{ analysisResult ? analysisResult.center_width?.toFixed(4) : '--' }}</div>
                        <div class="measurement-unit">cm</div>
                      </div>
                    </div>
                  </div>
                </el-col>

                <!-- 中间三分之一最大宽度 -->
                <el-col :span="8">
                  <div class="info-card">
                    <div class="card-header">
                      <el-icon><PieChart /></el-icon>
                      <span>中间三分之一最大宽度</span>
                    </div>
                    <div class="card-content">
                      <div class="measurement-display">
                        <div class="measurement-value">{{ analysisResult ? analysisResult.max_width_mid_third?.toFixed(4) : '--' }}</div>
                        <div class="measurement-unit">cm</div>
                      </div>
                    </div>
                  </div>
                </el-col>
              </el-row>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 识别按钮 -->
    <div class="action-buttons" v-if="uploadedFile">
      <el-button
          type="success"
          class="identify-button"
          @click="submitImage"
          :loading="isLoading"
      >
        <el-icon class="button-icon"><Search /></el-icon>
        <span>{{ isLoading ? '测量中...' : '开始测量' }}</span>
      </el-button>
    </div>

    <!-- 弹窗预览大图 -->
    <el-dialog v-model="previewDialogVisible" width="900px" top="6vh" :show-close="true" append-to-body :before-close="handlePreviewClose" class="custom-preview-dialog">
      <template #title>
        <span>图片预览</span>
        <el-button @click="togglePreviewFlip" size="small" style="margin-left:16px;" :icon="RefreshRight">翻转</el-button>
        <span style="margin-left:16px;font-size:13px;color:#999;">滚轮缩放</span>
      </template>
      <div class="preview-img-wrapper">
        <div class="preview-img-scroll" ref="previewImgScrollRef">
          <img :src="previewImageUrl"
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElLoading, ElDialog } from 'element-plus'
import { Upload, InfoFilled, Delete, DataAnalysis, Search, PieChart, TrendCharts, CopyDocument, Histogram, RefreshRight, ZoomIn } from '@element-plus/icons-vue'
import { cornLengthWidth } from '@/api/corn'

const router = useRouter()
const fileInput = ref(null)
const uploadedImage = ref(null)
const uploadedFile = ref(null)
const analysisResult = ref(null)
const isDragging = ref(false)
const isLoading = ref(false)

// 预览弹窗相关
const previewDialogVisible = ref(false)
const previewImageUrl = ref('')
const previewFlipped = ref(false)
const previewScale = ref(1)
const previewImgScrollRef = ref(null)
let dragStartX = 0
let dragStartY = 0
let scrollStartLeft = 0
let scrollStartTop = 0

const openPreview = (imgUrl) => {
  previewImageUrl.value = imgUrl
  previewFlipped.value = false
  previewScale.value = 1
  previewDialogVisible.value = true
}
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

const triggerFileInput = () => {
  fileInput.value.click()
}

const handleFileChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    processFile(file)
  }
}

const handleDrop = (event) => {
  isDragging.value = false
  const file = event.dataTransfer.files[0]
  if (file) {
    processFile(file)
  }
}

const handleDragEnter = () => {
  isDragging.value = true
}

const handleDragLeave = () => {
  isDragging.value = false
}

const removeImage = (event) => {
  event.stopPropagation()
  
  // 清理blob URL
  if (uploadedImage.value && uploadedImage.value.startsWith('blob:')) {
    URL.revokeObjectURL(uploadedImage.value)
  }
  
  uploadedImage.value = null
  uploadedFile.value = null  // 清理文件对象
  if (fileInput.value) {
    fileInput.value.value = ''
  }
  // 重置识别结果
  resetResults()
}

const resetResults = () => {
  analysisResult.value = null
}

const processFile = (file) => {
  // 检查文件类型
  if (!file.type.match('image.*')) {
    ElMessage.error('请上传图片文件')
    return
  }

  // 检查文件大小（30MB = 30 * 1024 * 1024 字节）
  if (file.size > 30 * 1024 * 1024) {
    ElMessage.error('文件大小不能超过30MB')
    return
  }

  uploadedFile.value = file
  uploadedImage.value = URL.createObjectURL(file)
  // 重置识别结果
  resetResults()
}

const submitImage = async () => {
  if (!uploadedFile.value) {
    ElMessage.warning('请先上传图片')
    return
  }

  isLoading.value = true
  const loading = ElLoading.service({
    lock: true,
    text: '正在测量中...',
    background: 'rgba(0, 0, 0, 0.7)'
  })

  try {
    const response = await cornLengthWidth(uploadedFile.value)

    if (response.code === 200) {
      analysisResult.value = response.data
      ElMessage.success('测量成功')
    } else {
      ElMessage.error(response.message || '测量失败')
    }
  } catch (error) {
    console.error('测量失败:', error)
    ElMessage.error('测量失败，请重试')
  } finally {
    loading.close()
    isLoading.value = false
  }
}



// 一键复制所有数据
const copyAllData = () => {
  if (!analysisResult.value) return
  
  const data = analysisResult.value
  const dataText = `玉米长度/宽度测量数据

长度: ${data.length?.toFixed(4) || '--'} cm
中心宽度: ${data.center_width?.toFixed(4) || '--'} cm
中间三分之一最大宽度: ${data.max_width_mid_third?.toFixed(4) || '--'} cm

测量时间: ${new Date().toLocaleString('zh-CN')}`

  copyToClipboard(dataText, '数据复制成功')
}



// 通用复制到剪贴板方法
const copyToClipboard = (text, successMessage) => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      ElMessage.success(successMessage)
    }).catch(() => {
      ElMessage.error('复制失败，请手动复制')
    })
  } else {
    // 兼容方案
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'absolute'
    textarea.style.left = '-9999px'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      const successful = document.execCommand('copy')
      if (successful) {
        ElMessage.success(successMessage)
      } else {
        ElMessage.error('复制失败，请手动复制')
      }
    } catch (err) {
      ElMessage.error('复制失败，请手动复制')
    }
    document.body.removeChild(textarea)
  }
}



onMounted(() => {
  window.addEventListener('mousemove', onPreviewMouseMove)
  window.addEventListener('mouseup', onPreviewMouseUp)
})
onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onPreviewMouseMove)
  window.removeEventListener('mouseup', onPreviewMouseUp)
  
  // 清理URL.createObjectURL创建的对象
  if (uploadedImage.value && uploadedImage.value.startsWith('blob:')) {
    URL.revokeObjectURL(uploadedImage.value)
  }
})
</script>

<style scoped>
.corn-trait-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px;
  background-color: #f5f7fa;
  background-image: linear-gradient(135deg, #f5f7fa 0%, #f0f4f8 100%);
}

.page-header {
  text-align: center;
  margin-bottom: 25px;
  padding-bottom: 20px;
  position: relative;
}

.page-title {
  font-size: 28px;
  color: #303133;
  margin-bottom: 8px;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.page-description {
  color: #606266;
  font-size: 15px;
  max-width: 600px;
  margin: 0 auto;
}

.content-wrapper {
  display: flex;
  gap: 25px;
  margin-bottom: 25px;
  flex: 1;
  height: 500px;
  min-height: 500px;
  align-items: stretch;
}

/* 图片上传区域样式 */
.upload-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  min-width: 300px;
  max-width: 500px;
  height: 500px;
  min-height: 500px;
}

.upload-section:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.section-title {
  padding: 15px 20px;
  font-size: 17px;
  font-weight: bold;
  border-bottom: 1px solid #ebeef5;
  background: linear-gradient(to right, #ecf5ff, #f0f9eb);
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-title .el-icon {
  font-size: 20px;
  color: #409eff;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
}

.upload-area {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  border: 2px dashed #d9ecff;
  border-radius: 10px;
  margin: 20px;
  height: 420px;
  min-height: 420px;
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;
  background-color: rgba(236, 245, 255, 0.3);
}

.upload-area.drag-over {
  border-color: #409eff;
  background-color: rgba(64, 158, 255, 0.08);
  transform: scale(1.02);
  box-shadow: 0 0 15px rgba(64, 158, 255, 0.2);
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
  text-align: center;
  padding: 20px;
  width: 100%;
}

.upload-icon {
  font-size: 60px;
  margin-bottom: 20px;
  color: #409eff;
  filter: drop-shadow(0 3px 5px rgba(0, 0, 0, 0.15));
  transition: all 0.3s;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
}

.upload-text {
  margin-bottom: 12px;
  font-size: 17px;
  color: #606266;
  line-height: 1.5;
}

.click-upload {
  color: #409eff;
  font-weight: bold;
  text-decoration: underline;
  cursor: pointer;
  transition: color 0.3s;
}

.click-upload:hover {
  color: #66b1ff;
}

.file-limit {
  font-size: 13px;
  color: #909399;
  margin-top: 8px;
  background-color: rgba(144, 147, 153, 0.1);
  padding: 5px 10px;
  border-radius: 4px;
}

.image-preview {
  width: 100%;
  height: 100%;
  min-height: 420px;
  max-height: 420px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.image-preview img {
  max-width: 100%;
  max-height: 380px;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s;
}

.image-preview:hover img {
  transform: scale(1.02);
}

.image-actions {
  position: absolute;
  top: 10px;
  right: 10px;
  opacity: 0;
  transition: opacity 0.3s ease, transform 0.3s ease;
  transform: translateY(-5px);
}

.image-preview:hover .image-actions {
  opacity: 1;
  transform: translateY(0);
}

/* 分析结果区域样式 */
.result-section {
  flex: 2;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  min-width: 400px;
  height: 500px;
  min-height: 500px;
}

.result-section:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.result-section .section-header {
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #ebeef5;
  background: linear-gradient(to right, #f0f9eb, #ecf5ff);
}

.result-section .section-header h2 {
  font-size: 20px;
  font-weight: 700;
  color: #303133;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.result-section .section-header h2::before {
  content: '';
  width: 3px;
  height: 20px;
  background: linear-gradient(135deg, #409eff, #67c23a);
  border-radius: 2px;
}

.result-section .data-section {
  margin: 20px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  border: 1px solid #ebeef5;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.result-section .section-title-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 15px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f2f5;
  flex-wrap: wrap;
}

.result-section .section-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #409eff, #67c23a);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 3px 10px rgba(64, 158, 255, 0.3);
}

.result-section .section-icon .el-icon {
  font-size: 20px;
  color: white;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.result-section .section-title {
  font-size: 18px;
  font-weight: 700;
  color: #303133;
  margin: 0;
}

.result-section .section-description {
  font-size: 13px;
  color: #909399;
  margin-left: 52px;
  margin-top: -15px;
  flex: 1;
}

.result-section .section-content {
  padding: 0;
  background-color: transparent;
  border-radius: 0;
  box-shadow: none;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.measurement-result {
  display: flex;
  flex-direction: column;
  height: 100%;
  flex: 1;
}

.measurement-result .el-row {
  flex: 1;
  display: flex;
  align-items: stretch;
  height: 100%;
}

.measurement-result .el-col {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* 测量数据美化样式 */
.result-section .info-card {
  padding: 25px 20px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 16px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #ebeef5;
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: relative;
  overflow: hidden;
  height: 100%;
  text-align: center;
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  flex: 1;
}

.result-section .info-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 5px;
  background: linear-gradient(90deg, #409eff, #67c23a, #e6a23c);
  border-radius: 16px 16px 0 0;
}

.result-section .info-card:hover {
  transform: translateY(-5px) scale(1.02);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
}

.result-section .info-card .card-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid rgba(64, 158, 255, 0.1);
}

.result-section .info-card .card-header .el-icon {
  font-size: 24px;
  color: #409eff;
  filter: drop-shadow(0 2px 4px rgba(64, 158, 255, 0.3));
}

.result-section .info-card .card-header span {
  font-size: 18px;
  font-weight: 700;
  color: #303133;
  background: linear-gradient(135deg, #409eff, #67c23a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.result-section .info-card .card-content { 
  display: flex; 
  flex-direction: column; 
  gap: 15px; 
  flex: 1;
  justify-content: center;
}

.result-section .measurement-display {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 8px;
  padding: 20px 0;
}

.result-section .measurement-value {
  font-size: 32px;
  font-weight: 700;
  color: #409eff;
  font-family: 'Courier New', monospace;
  background: linear-gradient(135deg, #409eff, #67c23a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.result-section .measurement-unit {
  font-size: 18px;
  color: #909399;
  font-weight: 500;
}

@media (max-width: 992px) {
  .content-wrapper {
    flex-direction: column;
  }
  
  .upload-section,
  .result-section {
    max-width: 100%;
  }
  
  .upload-section {
    margin-bottom: 20px;
  }
}

.action-buttons {
  display: flex;
  justify-content: center;
  margin: 30px 0;
  padding: 20px;
}

.identify-button {
  padding: 14px 45px;
  font-size: 17px;
  border-radius: 30px;
  transition: all 0.3s;
  background: linear-gradient(135deg, #67C23A, #4CAF50);
  border: none;
  color: white;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: 0 6px 16px rgba(76, 175, 80, 0.4);
  position: relative;
  overflow: hidden;
}

.identify-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: all 0.6s;
}

.identify-button:hover:not(:disabled)::before {
  left: 100%;
}

.identify-button:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(76, 175, 80, 0.5);
  background: linear-gradient(135deg, #85CE61, #67C23A);
}

.identify-button:active:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
}

.identify-button:disabled {
  background: linear-gradient(135deg, #C0C4CC, #909399);
  box-shadow: none;
  cursor: not-allowed;
  opacity: 0.8;
}

.button-icon {
  font-size: 20px;
}

@media (max-width: 768px) {
  .content-wrapper {
    flex-direction: column;
    gap: 20px;
  }

  .upload-section, .result-section {
    flex: 1;
  }

  .image-grid {
    flex-direction: column;
    gap: 15px;
  }

  .image-item img {
    max-height: 200px;
  }

  .data-analysis-section {
    padding: 20px;
    margin-top: 20px;
  }

  .section-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }

  .section-header h2 {
    font-size: 20px;
  }

  .data-section {
    padding: 20px;
    margin-bottom: 25px;
  }

  .section-title-wrapper {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .section-icon {
    width: 40px;
    height: 40px;
  }

  .section-icon .el-icon {
    font-size: 20px;
  }

  .section-title {
    font-size: 18px;
  }

  .section-description {
    margin-left: 0;
    margin-top: 0;
  }

  .measurement-card {
    padding: 15px;
  }

  .info-card {
    padding: 15px;
    margin-bottom: 15px;
  }

  .width-summary {
    flex-direction: column;
    gap: 10px;
  }

  .summary-item {
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
  }

  .width-chart {
    gap: 10px;
  }

  .width-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .bar-label {
    min-width: auto;
  }

  .bar-container {
    width: 100%;
  }

  .ratio-chart {
    gap: 12px;
  }

  .ratio-item {
    gap: 6px;
  }

  .ratio-progress {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .progress-bar {
    width: 100%;
  }

  .ratio-value {
    min-width: auto;
    text-align: left;
  }

  .image-row {
    flex-direction: column;
    gap: 10px;
  }

  .image-card {
    margin-bottom: 10px;
  }

  .result-img {
    max-height: 120px;
  }

  .chart-card {
    margin-bottom: 15px;
  }

  .lab-charts {
    margin-bottom: 15px;
  }

  .lab-card {
    padding: 10px;
    margin-bottom: 10px;
  }

  .lab-value {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .lab-label {
    font-size: 14px;
  }

  .lab-number {
    font-size: 14px;
  }

  .chart-title {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  /* 移动端表格样式 */
  .measurement-table {
    font-size: 12px;
  }

  .measurement-table :deep(.el-table__header th) {
    font-size: 12px;
    padding: 8px 4px;
  }

  .measurement-table :deep(.el-table__body td) {
    padding: 8px 4px;
  }

  .table-value {
    font-size: 12px;
    padding: 2px 6px;
  }

  .segment-badge {
    font-size: 11px;
    padding: 4px 8px;
  }
}

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

/* 完全复用 LeafSheathFileTraitFile.vue 的 lab-card 相关样式 */
.lab-charts {
  margin-bottom: 25px;
}
.chart-header {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}
.chart-header h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}
.lab-card {
  margin-bottom: 15px;
  border-radius: 8px;
  transition: all 0.3s;
  border: 1px solid #ebeef5;
  overflow: hidden;
}
.lab-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}
.lab-value {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  align-items: center;
}
.lab-label {
  font-weight: bold;
  color: #303133;
  font-size: 15px;
}
.lab-number {
  font-family: 'Courier New', monospace;
  font-size: 16px;
  color: #409eff;
  font-weight: 600;
  background-color: rgba(64, 158, 255, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
}
.progress-bar {
  height: 12px;
  background-color: #f0f2f5;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 8px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}
.progress {
  height: 100%;
  transition: width 0.8s ease;
  border-radius: 6px;
  background-image: linear-gradient(to right, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0));
}
.channel-description {
  font-size: 12px;
  color: #909399;
  margin-top: 6px;
  text-align: right;
  font-style: italic;
}

/* 宽度图表样式 */
.width-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.width-bar {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 12px;
  padding: 8px;
  background-color: rgba(64, 158, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(64, 158, 255, 0.1);
}

.bar-label {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
  min-width: 60px;
}

.bar-container {
  flex: 1;
  height: 24px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-right: 15px;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #409eff, #67c23a);
  border-radius: 12px;
  transition: width 1s ease;
  position: relative;
}

.bar-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.bar-value {
  font-size: 16px;
  color: #409eff;
  font-weight: 700;
  min-width: 70px;
  text-align: center;
  font-family: 'Courier New', monospace;
  background: linear-gradient(135deg, #409eff, #67c23a);
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.3);
}

/* 比例图表样式 */
.ratio-chart {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.ratio-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ratio-label {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.ratio-progress {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar {
  flex: 1;
  height: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #e6a23c, #f56c6c);
  border-radius: 10px;
  transition: width 1s ease;
  position: relative;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  animation: shimmer 2s infinite;
}

.ratio-value {
  font-size: 13px;
  color: #303133;
  font-weight: 600;
  min-width: 60px;
  text-align: right;
  font-family: 'Courier New', monospace;
}

/* 表格样式 */
.table-container {
  margin-bottom: 0;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding: 10px 15px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 8px;
  border: 1px solid #bae6fd;
}

.table-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.measurement-table {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.measurement-table :deep(.el-table__header) {
  background: linear-gradient(135deg, #409eff, #67c23a) !important;
  display: table-header-group !important;
}

.measurement-table :deep(.el-table__header th) {
  background: transparent !important;
  color: #303133 !important; /* 改为深色 */
  font-weight: 600 !important;
  border-bottom: none !important;
  text-align: center !important;
  padding: 12px 0 !important;
}

.measurement-table :deep(.el-table__body tr:hover) {
  background-color: rgba(64, 158, 255, 0.05);
}

.measurement-table :deep(.el-table__body td) {
  border-bottom: 1px solid #ebeef5;
}

.table-value {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: #409eff;
  background-color: rgba(64, 158, 255, 0.1);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
}

/* 置信度显示样式 */
.confidence-display {
  display: flex;
    flex-direction: column;
    gap: 10px;
  align-items: center;
}

.confidence-value {
  font-size: 24px;
  font-weight: 700;
  color: #67c23a;
  font-family: 'Courier New', monospace;
  background: linear-gradient(135deg, #67c23a, #85ce61);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.confidence-bar {
  width: 100%;
  height: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.confidence-fill {
  height: 100%;
  background: linear-gradient(90deg, #67c23a, #85ce61);
  border-radius: 10px;
  transition: width 1s ease;
  position: relative;
}

.confidence-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  animation: shimmer 2s infinite;
}

/* 处理图片样式 */
.process-images {
  margin-top: 25px;
  padding-top: 20px;
  border-top: 2px solid #f0f2f5;
}

/* 测量数据显示样式 */
.measurement-display {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 8px;
  padding: 20px 0;
}

.measurement-value {
  font-size: 32px;
  font-weight: 700;
  color: #409eff;
  font-family: 'Courier New', monospace;
  background: linear-gradient(135deg, #409eff, #67c23a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.measurement-unit {
  font-size: 18px;
  color: #909399;
  font-weight: 500;
}
</style>
