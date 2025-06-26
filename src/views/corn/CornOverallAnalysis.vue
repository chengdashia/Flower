<template>
  <div class="corn-trait-container">
    <div class="page-header">
      <h1 class="page-title">玉米整体分析</h1>
      <p class="page-description">上传玉米图片，获取形态分析和测量数据</p>
    </div>

    <div class="content-wrapper">
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

      <div class="result-section">
        <div class="section-title">
          <el-icon><DataAnalysis /></el-icon>
          <span>图片分析展示</span>
        </div>
        <div class="result-area">
          <div v-if="!analysisResult" class="result-placeholder">
            <el-icon class="info-icon"><InfoFilled /></el-icon>
            <div>请上传图片进行识别</div>
          </div>
          <div v-else class="result-content">
            <div class="result-images" v-if="analysisResult.results && analysisResult.results.length > 0">
              <div class="image-grid">
                <div class="image-item" v-if="analysisResult.results[0].image.analysis">
                  <h4>分析图片</h4>
                  <img :src="getImageUrl(analysisResult.results[0].image.analysis)" alt="分析图片" @click="openPreview(getImageUrl(analysisResult.results[0].image.analysis))" style="cursor:pointer;" />
                </div>
                <div class="image-item" v-if="analysisResult.results[0].image.mask">
                  <h4>掩码图片</h4>
                  <img :src="getImageUrl(analysisResult.results[0].image.mask)" alt="掩码图片" @click="openPreview(getImageUrl(analysisResult.results[0].image.mask))" style="cursor:pointer;" />
                </div>
                <div class="image-item" v-if="analysisResult.results[0].image.overlay">
                  <h4>叠加图片</h4>
                  <img :src="getImageUrl(analysisResult.results[0].image.overlay)" alt="叠加图片" @click="openPreview(getImageUrl(analysisResult.results[0].image.overlay))" style="cursor:pointer;" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 数据统计和图表区域 -->
    <div v-if="analysisResult" class="data-analysis-section">
      <div class="section-header">
        <h2>数据分析</h2>
        <el-button 
          type="primary" 
          @click="copyAllData"
          :icon="CopyDocument"
          size="large"
        >
          一键复制数据
        </el-button>
      </div>

      <div class="charts-container">
        <!-- 识别统计图表 -->
        <div class="chart-card">
          <div class="chart-title">
            <el-icon><DataAnalysis /></el-icon>
            <span>识别统计</span>
          </div>
          <div class="chart-content">
            <div class="analysis-summary" v-if="analysisResult.results && analysisResult.results.length > 0">
              <div class="summary-header">
                <div class="shape-type-badge">
                  <el-icon><Histogram /></el-icon>
                  <span>{{ analysisResult.results[0].shape_type }}</span>
                </div>
                <div class="analysis-status">
                  <el-icon><DataAnalysis /></el-icon>
                  <span>分析完成</span>
                </div>
              </div>
              <div class="summary-details">
                <div class="detail-item">
                  <div class="detail-label">中线宽度测量点</div>
                  <div class="detail-value">{{ analysisResult.results[0].midline_widths.length }} 个</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">最大宽度</div>
                  <div class="detail-value">{{ Math.max(...analysisResult.results[0].midline_widths) }} px</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">平均宽度</div>
                  <div class="detail-value">{{ Math.round(analysisResult.results[0].midline_widths.reduce((a, b) => a + b, 0) / analysisResult.results[0].midline_widths.length) }} px</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 中线宽度图表 -->
        <div class="chart-card" v-if="analysisResult.results && analysisResult.results.length > 0">
          <div class="chart-title">
            <el-icon><TrendCharts /></el-icon>
            <span>中线宽度分布</span>
          </div>
          <div class="chart-content">
            <div class="width-chart">
              <div 
                v-for="(width, index) in analysisResult.results[0].midline_widths" 
                :key="index"
                class="width-bar"
              >
                <div class="bar-label">位置{{ index + 1 }}</div>
                <div class="bar-container">
                  <div 
                    class="bar-fill" 
                    :style="{ width: getWidthPercentage(width) + '%' }"
                  ></div>
                </div>
                <span class="bar-value">{{ width }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 比例数据图表 -->
        <div class="chart-card" v-if="analysisResult.results && analysisResult.results.length > 0">
          <div class="chart-title">
            <el-icon><PieChart /></el-icon>
            <span>比例数据</span>
          </div>
          <div class="chart-content">
            <div class="ratio-chart">
              <div class="ratio-item">
                <div class="ratio-label">1:3 比例</div>
                <div class="ratio-progress">
                  <div class="progress-bar">
                    <div 
                      class="progress-fill" 
                      :style="{ width: getRatioPercentage(analysisResult.results[0].ratios.ratio_1_3) + '%' }"
                    ></div>
                  </div>
                  <span class="ratio-value">{{ analysisResult.results[0].ratios.ratio_1_3.toFixed(4) }}</span>
                </div>
              </div>
              <div class="ratio-item">
                <div class="ratio-label">1:5 比例</div>
                <div class="ratio-progress">
                  <div class="progress-bar">
                    <div 
                      class="progress-fill" 
                      :style="{ width: getRatioPercentage(analysisResult.results[0].ratios.ratio_1_5) + '%' }"
                    ></div>
                  </div>
                  <span class="ratio-value">{{ analysisResult.results[0].ratios.ratio_1_5.toFixed(4) }}</span>
                </div>
              </div>
              <div class="ratio-item">
                <div class="ratio-label">3:5 比例</div>
                <div class="ratio-progress">
                  <div class="progress-bar">
                    <div 
                      class="progress-fill" 
                      :style="{ width: getRatioPercentage(analysisResult.results[0].ratios.ratio_3_5) + '%' }"
                    ></div>
                  </div>
                  <span class="ratio-value">{{ analysisResult.results[0].ratios.ratio_3_5.toFixed(4) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="action-buttons">
      <el-button
          type="success"
          class="identify-button"
          @click="submitImage"
          :disabled="!uploadedFile"
          :loading="isLoading"
      >
        <el-icon class="button-icon"><Search /></el-icon>
        <span>{{ isLoading ? '识别中...' : '开始识别' }}</span>
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
import {ymOverallAnalyzer} from '@/api/flower'

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
    text: '正在识别中...',
    background: 'rgba(0, 0, 0, 0.7)'
  })

  try {
    const response = await ymOverallAnalyzer(uploadedFile.value)

    if (response.code === 200) {
      analysisResult.value = response.data
      ElMessage.success('识别完成')
    } else {
      ElMessage.error(response.message || '识别失败')
    }
  } catch (error) {
    console.error('识别失败:', error)
    ElMessage.error('识别失败，请重试')
  } finally {
    loading.close()
    isLoading.value = false
  }
}

// 处理图片URL
const getImageUrl = (imagePath) => {
  if (!imagePath) return ''
  
  // 如果是完整的URL，直接返回
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }
  
  // 如果是base64格式，直接返回
  if (imagePath.startsWith('data:image')) {
    return imagePath
  }
  
  // 如果是相对路径，拼接baseURL
  const baseURL = process.env.VUE_APP_API_URL || 'http://127.0.0.1:5000'
  return `${baseURL}${imagePath}`
}

// 获取宽度百分比
const getWidthPercentage = (width) => {
  // 找到最大宽度值作为基准
  if (!analysisResult.value?.results?.[0]?.midline_widths) return 0
  const maxWidth = Math.max(...analysisResult.value.results[0].midline_widths)
  return maxWidth > 0 ? (width / maxWidth) * 100 : 0
}

// 获取比例百分比
const getRatioPercentage = (ratio) => {
  // 找到最大比例值作为基准
  if (!analysisResult.value?.results?.[0]?.ratios) return 0
  const ratios = analysisResult.value.results[0].ratios
  const maxRatio = Math.max(ratios.ratio_1_3, ratios.ratio_1_5, ratios.ratio_3_5)
  return maxRatio > 0 ? (ratio / maxRatio) * 100 : 0
}

// 一键复制所有数据
const copyAllData = () => {
  if (!analysisResult.value) return
  
  const result = analysisResult.value.results?.[0]
  if (!result) return
  
  const dataText = `玉米整体分析数据\n\n识别统计:\n- 形状类型: ${result.shape_type}\n\n中线宽度数据:\n${result.midline_widths.map((width, index) => `- 位置${index + 1}: ${width}`).join('\\n')}\n\n比例数据:\n- 1:3 比例: ${result.ratios.ratio_1_3.toFixed(4)}\n- 1:5 比例: ${result.ratios.ratio_1_5.toFixed(4)}\n- 3:5 比例: ${result.ratios.ratio_3_5.toFixed(4)}\n\n分析时间: ${new Date().toLocaleString('zh-CN')}`

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(dataText).then(() => {
      ElMessage.success('数据复制成功')
    }).catch(() => {
      ElMessage.error('复制失败，请手动复制')
    })
  } else {
    // 兼容方案
    const textarea = document.createElement('textarea')
    textarea.value = dataText
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'absolute'
    textarea.style.left = '-9999px'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      const successful = document.execCommand('copy')
      if (successful) {
        ElMessage.success('数据复制成功')
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
  flex: 1;
  gap: 25px;
  margin-bottom: 25px;
}

.upload-section {
  flex: 0.4;  /* 上传区域占40% */
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.result-section {
  flex: 0.6;  /* 结果区域占60% */
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.upload-section:hover, .result-section:hover {
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

.upload-area, .result-area {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  border: 2px dashed #d9ecff;
  border-radius: 10px;
  margin: 20px;
  min-height: 300px;
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;
  background-color: rgba(236, 245, 255, 0.3);
}

.result-area {
  cursor: default;  /* 结果区域不需要鼠标手型 */
}

.upload-area.drag-over {
  border-color: #409eff;
  background-color: rgba(64, 158, 255, 0.08);
  transform: scale(1.02);
  box-shadow: 0 0 15px rgba(64, 158, 255, 0.2);
}

.upload-placeholder, .result-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
  text-align: center;
  padding: 20px;
  width: 100%;
}

.upload-icon, .info-icon {
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

.image-preview, .result-image {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.image-preview img, .result-image img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s;
}

.image-preview:hover img {
  transform: scale(1.02);
}

.result-image:hover img {
  transform: scale(1.02) rotate(180deg);
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

.result-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 10px;
}

.result-images {
  margin-bottom: 20px;
}

.image-grid {
  display: flex;
  gap: 20px;
}

.image-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.image-item h4 {
  margin-bottom: 10px;
  font-size: 18px;
  color: #303133;
  font-weight: 600;
}

.image-item img {
  max-width: 100%;
  max-height: 500px;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s;
}

.data-analysis-section {
  margin-top: 30px;
  padding: 25px;
  background-color: #ffffff;
  border-radius: 16px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.data-analysis-section:hover {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f0f2f5;
}

.section-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-header h2::before {
  content: '';
  width: 4px;
  height: 24px;
  background: linear-gradient(135deg, #409eff, #67c23a);
  border-radius: 2px;
}

.charts-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 25px;
}

.chart-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border: 1px solid #ebeef5;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.chart-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #409eff, #67c23a, #e6a23c);
  border-radius: 12px 12px 0 0;
}

.chart-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.chart-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.chart-title .el-icon {
  font-size: 22px;
  color: #409eff;
  filter: drop-shadow(0 2px 4px rgba(64, 158, 255, 0.3));
}

.chart-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.analysis-summary {
  padding: 20px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 10px;
  border: 1px solid #bae6fd;
  transition: all 0.3s ease;
}

.analysis-summary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.2);
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.shape-type-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: linear-gradient(135deg, #409eff, #67c23a);
  border-radius: 4px;
}

.shape-type-badge .el-icon {
  font-size: 20px;
  color: white;
}

.shape-type-badge span {
  font-size: 16px;
  font-weight: 600;
  color: white;
}

.analysis-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: linear-gradient(135deg, #409eff, #67c23a);
  border-radius: 4px;
}

.analysis-status .el-icon {
  font-size: 20px;
  color: white;
}

.analysis-status span {
  font-size: 16px;
  font-weight: 600;
  color: white;
}

.summary-details {
  display: flex;
  justify-content: space-between;
  margin-top: 15px;
  gap: 20px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.detail-label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
  margin-bottom: 8px;
}

.detail-value {
  font-size: 18px;
  font-weight: 700;
  color: #409eff;
  font-family: 'Courier New', monospace;
}

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
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
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

.action-buttons {
  display: flex;
  justify-content: center;
  margin-top: 10px;
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

  .charts-container {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .analysis-summary {
    padding: 15px;
  }

  .summary-header {
    flex-direction: column;
    gap: 10px;
  }

  .shape-type-badge {
    flex-direction: column;
    align-items: flex-start;
  }

  .shape-type-badge .el-icon {
    font-size: 24px;
  }

  .shape-type-badge span {
    font-size: 16px;
  }

  .analysis-status {
    flex-direction: column;
    align-items: flex-start;
  }

  .analysis-status .el-icon {
    font-size: 24px;
  }

  .analysis-status span {
    font-size: 16px;
  }

  .summary-details {
    flex-direction: column;
    gap: 15px;
  }

  .detail-item {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: 8px 0;
    border-bottom: 1px solid rgba(64, 158, 255, 0.1);
  }

  .detail-item:last-child {
    border-bottom: none;
  }

  .detail-label {
    margin-bottom: 0;
    font-size: 13px;
  }

  .detail-value {
    font-size: 16px;
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
</style>
