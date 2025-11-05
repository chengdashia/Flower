<template>
  <div class="corn-trait-container">
    <div class="page-header">
      <h1 class="page-title">玉米外观等级分析</h1>
      <p class="page-description">上传玉米图片，获取外观等级分析结果</p>
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
          <h2>分析结果</h2>
          <el-button 
            type="primary" 
            @click="copyGradeResult"
            :icon="CopyDocument"
            size="small"
            :disabled="!analysisResult"
          >
            复制结果
          </el-button>
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
              <div class="grade-display-container">
                <div class="grade-display">
                  <div class="grade-label">外观等级</div>
                  <div class="grade-value">{{ analysisResult ? (analysisResult.grade || '未分级') : '未分级' }}</div>
                </div>
                <div class="grade-visualization">
                  <div class="grade-indicator" :class="getGradeClass(analysisResult ? analysisResult.grade : null)">
                    {{ analysisResult ? (analysisResult.grade || '未分级') : '未分级' }}
                  </div>
                </div>
              </div>
              <div class="message-display" v-if="analysisResult && analysisResult.message">
                <div class="message-label">分析信息</div>
                <div class="message-value">{{ analysisResult.message }}</div>
              </div>
              <div class="message-display" v-else>
                <div class="message-label">分析信息</div>
                <div class="message-value">暂无分析信息</div>
              </div>
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

// 获取等级样式类
const getGradeClass = (grade) => {
  if (!grade || grade === '未分级') return 'grade-default'
  
  const gradeMap = {
    '一等': 'grade-one',
    '二等': 'grade-two',
    '三等': 'grade-three',
    '四等': 'grade-four',
    '五等': 'grade-five'
  }
  
  return gradeMap[grade] || 'grade-default'
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
  gap: 25px;
  margin-bottom: 25px;
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
}

.grade-result {
  padding: 20px 0;
}

.grade-display-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 25px;
  margin-bottom: 25px;
}

.grade-display {
  text-align: center;
}

.grade-label {
  font-size: 18px;
  color: #606266;
  margin-bottom: 10px;
  font-weight: 500;
}

.grade-value {
  font-size: 20px;
  color: #606266;
  font-weight: 500;
}

.grade-visualization {
  width: 100%;
  display: flex;
  justify-content: center;
}

.grade-indicator {
  font-size: 72px;
  font-weight: 800;
  text-align: center;
  min-width: 200px;
  padding: 30px 50px;
  border-radius: 16px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  border: 2px solid #ebeef5;
}

.grade-indicator::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #409eff, #67c23a);
  border-radius: 16px 16px 0 0;
}

.grade-indicator.grade-one {
  background: linear-gradient(135deg, #ecf5ff 0%, #d9ecff 100%);
  border-color: #b3d9ff;
  color: #409eff;
  text-shadow: 0 2px 4px rgba(64, 158, 255, 0.3);
}

.grade-indicator.grade-two {
  background: linear-gradient(135deg, #f0f9eb 0%, #e1f3d8 100%);
  border-color: #b3e19d;
  color: #67c23a;
  text-shadow: 0 2px 4px rgba(103, 194, 58, 0.3);
}

.grade-indicator.grade-three {
  background: linear-gradient(135deg, #fdf6ec 0%, #fcecd4 100%);
  border-color: #f3d19e;
  color: #e6a23c;
  text-shadow: 0 2px 4px rgba(230, 162, 60, 0.3);
}

.grade-indicator.grade-four {
  background: linear-gradient(135deg, #fdf2ed 0%, #f9e2d4 100%);
  border-color: #f3ba9e;
  color: #f56c6c;
  text-shadow: 0 2px 4px rgba(245, 108, 108, 0.3);
}

.grade-indicator.grade-five {
  background: linear-gradient(135deg, #f4f4f5 0%, #e9e9eb 100%);
  border-color: #c9c9cc;
  color: #909399;
  text-shadow: 0 2px 4px rgba(144, 147, 153, 0.3);
}

.grade-indicator.grade-default {
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
  border-color: #d4d7de;
  color: #a8abb2;
  text-shadow: 0 2px 4px rgba(168, 171, 178, 0.3);
}

.message-display {
  background-color: rgba(103, 194, 58, 0.1);
  border-radius: 10px;
  padding: 20px;
  border: 1px solid rgba(103, 194, 58, 0.2);
  text-align: center;
}

.message-label {
  font-size: 16px;
  color: #606266;
  font-weight: 600;
  margin-bottom: 8px;
  display: block;
}

.message-value {
  font-size: 16px;
  color: #67c23a;
  font-weight: 500;
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
</style>
