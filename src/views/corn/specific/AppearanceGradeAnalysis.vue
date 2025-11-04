<template>
  <div class="corn-trait-container">
    <div class="page-header">
      <h1 class="page-title">玉米外观等级分析</h1>
      <p class="page-description">上传玉米图片，获取外观等级分析结果</p>
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
        <span>{{ isLoading ? '识别中...' : '开始识别' }}</span>
      </el-button>
    </div>

    <!-- 数据统计和图表区域 -->
    <div v-if="analysisResult" class="data-analysis-section">
      <div class="section-header">
        <h2>分析结果</h2>
      </div>

      <!-- 分级结果展示 -->
      <div class="data-section">
        <div class="section-title-wrapper">
          <div class="section-icon">
            <el-icon><DataAnalysis /></el-icon>
          </div>
          <h3 class="section-title">外观等级</h3>
          <div class="section-description">玉米外观等级分析结果</div>
        </div>
        
        <div class="section-content">
          <div class="grade-result">
            <div class="grade-display">
              <span class="grade-label">等级:</span>
              <span class="grade-value">{{ analysisResult.grade || '未分级' }}</span>
            </div>
            <div class="message-display" v-if="analysisResult.message">
              <span class="message-label">信息:</span>
              <span class="message-value">{{ analysisResult.message }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <el-button 
          type="primary" 
          @click="copyGradeResult"
          :icon="CopyDocument"
          size="large"
        >
          复制结果
        </el-button>
        <el-button 
          type="success" 
          @click="resetAnalysis"
          :icon="RefreshRight"
          size="large"
        >
          重新分析
        </el-button>
      </div>
    </div>

    <!-- 错误信息展示 -->
    <div v-if="errorMessage" class="error-section">
      <div class="section-header">
        <h2>分析失败</h2>
      </div>
      
      <div class="data-section">
        <div class="section-title-wrapper">
          <div class="section-icon">
            <el-icon><Warning /></el-icon>
          </div>
          <h3 class="section-title">错误信息</h3>
        </div>
        
        <div class="section-content">
          <div class="error-message">
            {{ errorMessage }}
          </div>
        </div>
      </div>
      
      <div class="action-buttons">
        <el-button 
          type="success" 
          @click="resetAnalysis"
          :icon="RefreshRight"
          size="large"
        >
          重新分析
        </el-button>
      </div>
    </div>

    <!-- 已移除预览功能 -->
  </div>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue'
import { ElMessage, ElLoading } from 'element-plus'
import { Upload, Delete, DataAnalysis, Search, CopyDocument, RefreshRight, Warning } from '@element-plus/icons-vue'
import {cornGrade} from '@/api/corn'

const fileInput = ref(null)
const uploadedImage = ref(null)
const uploadedFile = ref(null)
const analysisResult = ref(null)
const errorMessage = ref(null)
const isDragging = ref(false)
const isLoading = ref(false)

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
  uploadedFile.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
  // 重置识别结果
  resetResults()
}

const resetResults = () => {
  analysisResult.value = null
  errorMessage.value = null
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
    text: '正在分析中...',
    background: 'rgba(0, 0, 0, 0.7)'
  })

  try {
    const response = await cornGrade(uploadedFile.value)

    // 处理返回结构：{ code, data: { angles, level }, message }
    if (response && (response.code === 200 || response.code === '200')) {
      analysisResult.value = {
        grade: response.data?.level || '未分级',
        message: response.message || '分析成功'
      }
      errorMessage.value = null
      ElMessage.success(response.message || '分析完成')
    } else {
      const msg = response?.message || '分析失败'
      errorMessage.value = msg
      analysisResult.value = null
      ElMessage.error(msg)
    }
  } catch (error) {
    console.error('分析失败:', error)
    errorMessage.value = '分析失败，请重试'
    analysisResult.value = null
    ElMessage.error('分析失败，请重试')
  } finally {
    loading.close()
    isLoading.value = false
  }
}

// 复制分级结果
const copyGradeResult = () => {
  if (!analysisResult.value) return
  
  const dataText = `玉米外观等级分析结果

等级: ${analysisResult.value.grade || '未分级'}
信息: ${analysisResult.value.message || '无'}

分析时间: ${new Date().toLocaleString('zh-CN')}`
  
  copyToClipboard(dataText, '结果复制成功')
}

// 重置分析
const resetAnalysis = () => {
  analysisResult.value = null
  errorMessage.value = null
  removeImage(new Event('reset'))
}

// 已移除不必要的函数

// 复制中线宽度数据
const copyWidthData = () => {
  if (!analysisResult.value?.results?.[0]?.midline_widths) return
  
  const midlineWidths = analysisResult.value.results[0].midline_widths
  const dataText = `中线宽度数据

${midlineWidths.map((width, index) => `- 位置${index + 1}: ${width} px`).join('\n')}

复制时间: ${new Date().toLocaleString('zh-CN')}`
  
  copyToClipboard(dataText, '中线宽度数据复制成功')
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

// 已移除不必要的函数

onBeforeUnmount(() => {
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
  flex: 1;  /* 上传区域占满宽度 */
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  width: 100%;
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
  min-height: 300px;
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
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.image-preview img {
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

.data-section {
  margin-bottom: 35px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: 1px solid #ebeef5;
}

.data-section:hover {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.section-title-wrapper {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f0f2f5;
  flex-wrap: wrap;
}

.section-icon {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #409eff, #67c23a);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.section-icon .el-icon {
  font-size: 24px;
  color: white;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.section-title {
  font-size: 22px;
  font-weight: 700;
  color: #303133;
  margin: 0;
}

.section-description {
  font-size: 14px;
  color: #909399;
  margin-left: 65px;
  margin-top: -15px;
  flex: 1;
}

.section-content {
  padding: 0;
  background-color: transparent;
  border-radius: 0;
  box-shadow: none;
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
  margin-bottom: 25px;
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

.measurement-cards {
  margin-bottom: 0;
}

.measurement-card {
  padding: 20px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  margin-bottom: 15px;
  border: 1px solid #ebeef5;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.measurement-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #409eff, #67c23a);
  border-radius: 12px 12px 0 0;
}

.measurement-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
}

.segment-number {
  font-size: 18px;
  font-weight: 700;
  color: #303133;
  background: linear-gradient(135deg, #409eff, #67c23a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.measurement-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(64, 158, 255, 0.1);
}

.measurement-item:last-child {
  border-bottom: none;
}

.measurement-label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.measurement-value {
  font-size: 16px;
  font-weight: 700;
  color: #409eff;
  font-family: 'Courier New', monospace;
  background-color: rgba(64, 158, 255, 0.1);
  padding: 4px 8px;
  border-radius: 4px;
}

.info-card {
  padding: 20px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border: 1px solid #ebeef5;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  height: 100%;
}

.info-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #409eff, #67c23a, #e6a23c);
  border-radius: 12px 12px 0 0;
}

.info-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
}

.info-card .card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.info-card .card-header .el-icon {
  font-size: 20px;
  color: #409eff;
}

.info-card .card-header span {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.info-card .card-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(64, 158, 255, 0.1);
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.info-value {
  font-size: 16px;
  font-weight: 700;
  color: #409eff;
  font-family: 'Courier New', monospace;
}

.info-value.shape-type {
  background: linear-gradient(135deg, #409eff, #67c23a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 700;
}

.info-value.confidence {
  color: #67c23a;
  background-color: rgba(103, 194, 58, 0.1);
  padding: 4px 8px;
  border-radius: 4px;
}

.measurement-card .card-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.measurement-card .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.width-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding: 12px;
  background-color: rgba(64, 158, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(64, 158, 255, 0.1);
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.summary-label {
  font-size: 12px;
  color: #606266;
  font-weight: 500;
  margin-bottom: 4px;
}

.summary-value {
  font-size: 16px;
  font-weight: 700;
  color: #409eff;
  font-family: 'Courier New', monospace;
}

.analysis-images {
  margin-top: 25px;
  padding-top: 20px;
  border-top: 2px solid #f0f2f5;
}

.images-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.images-title .el-icon {
  font-size: 20px;
  color: #409eff;
}

.images-grid {
  margin-bottom: 0;
}

.image-row {
  margin-bottom: 0;
}

.image-card {
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
}

.image-title {
  text-align: center;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
  margin-top: 4px;
}

.result-img {
  max-height: 180px;
  width: auto;
  max-width: 100%;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.10);
  cursor: pointer;
  transition: transform 0.2s;
}

.result-img:hover {
  transform: scale(1.04);
  box-shadow: 0 4px 16px rgba(64,158,255,0.18);
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
</style>
