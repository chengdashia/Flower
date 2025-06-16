<template>
  <div class="corn-trait-container">
    <div class="page-header">
      <h1 class="page-title">花丝原位识别</h1>
      <p class="page-description">上传花丝图片，获取LAB颜色空间分析结果</p>
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
          <input 
            type="file" 
            ref="fileInput" 
            style="display: none" 
            accept="image/*" 
            @change="handleFileChange"
            webkitdirectory
            directory
            multiple
          />
          <div v-if="!uploadedFiles.length" class="upload-placeholder">
            <el-icon class="upload-icon"><Upload /></el-icon>
            <div class="upload-text">拖拽文件夹到这里 或者 <span class="click-upload">点击上传</span></div>
            <div class="file-limit">支持 jpg/png 格式，单个文件大小小于 30M</div>
          </div>
          <div v-else class="file-list">
            <div class="file-list-header">
              <span>已选择 {{ uploadedFiles.length }} 个文件</span>
              <el-button type="danger" size="small" @click.stop="removeAllFiles">清空</el-button>
            </div>
            <el-scrollbar height="300px">
              <div class="file-grid">
                <div v-for="(file, index) in uploadedFiles" :key="index" class="file-item">
                  <div class="file-preview">
                    <img :src="file.preview" alt="预览图" />
                    <div class="file-actions">
                      <el-button type="danger" size="small" icon="Delete" circle @click.stop="removeFile(index)"></el-button>
                    </div>
                  </div>
                  <div class="file-info">
                    <div class="file-name" :title="file.name">{{ file.name }}</div>
                    <div class="file-size">{{ formatFileSize(file.size) }}</div>
                  </div>
                </div>
              </div>
            </el-scrollbar>
          </div>
        </div>
      </div>

      <div class="result-section">
        <div class="section-title">
          <el-icon><DataAnalysis /></el-icon>
          <span>识别结果</span>
        </div>
        <div class="result-area">
          <div v-if="!analysisResult" class="result-placeholder">
            <el-icon class="info-icon"><InfoFilled /></el-icon>
            <div>请上传图片进行识别</div>
          </div>
          <div v-else class="result-content">
            <div class="result-image" v-if="comparisonImage">
              <img :src="comparisonImage" alt="对比图片" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="analysisResult" class="lab-charts">
      <div class="chart-container">
        <h3><el-icon><Histogram /></el-icon> 原始图片 LAB 均值</h3>
        <el-row :gutter="20">
          <el-col :xs="24" :sm="24" :md="8" v-for="(value, key) in originalLab" :key="'original-'+key">
            <el-card class="lab-card" :body-style="{ padding: '15px' }">
              <div class="lab-value">
                <span class="lab-label">{{ key }}:</span>
                <span class="lab-number">{{ value.toFixed(2) }}</span>
              </div>
              <div class="progress-bar">
                <div class="progress" :style="{ width: getProgressWidth(key, value) + '%', backgroundColor: getColorForChannel(key) }"></div>
              </div>
              <div class="channel-description">{{ getChannelDescription(key) }}</div>
            </el-card>
          </el-col>
        </el-row>
      </div>
      
      <div class="chart-container">
        <h3><el-icon><TopRight /></el-icon> 提取的红色区域 LAB 均值</h3>
        <el-row :gutter="20">
          <el-col :xs="24" :sm="24" :md="8" v-for="(value, key) in redRegionLab" :key="'red-'+key">
            <el-card class="lab-card" :body-style="{ padding: '15px' }">
              <div class="lab-value">
                <span class="lab-label">{{ key }}:</span>
                <span class="lab-number">{{ value.toFixed(2) }}</span>
              </div>
              <div class="progress-bar">
                <div class="progress" :style="{ width: getProgressWidth(key, value) + '%', backgroundColor: getColorForChannel(key) }"></div>
              </div>
              <div class="channel-description">{{ getChannelDescription(key) }}</div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </div>

    <div class="action-buttons">
      <el-button 
        type="success" 
        class="identify-button" 
        @click="submitImage" 
        :disabled="!uploadedFiles.length" 
        :loading="isLoading"
      >
        <el-icon class="button-icon"><Search /></el-icon>
        <span>{{ isLoading ? '识别中...' : '开始识别' }}</span>
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElLoading } from 'element-plus'
import { Upload, InfoFilled, Delete, DataAnalysis, Histogram, TopRight, Search } from '@element-plus/icons-vue'
import { filamentIdentify } from '@/api/flower'

const router = useRouter()
const fileInput = ref(null)
const uploadedFiles = ref([])
const analysisResult = ref(null)
const comparisonImage = ref(null)
const originalLab = ref(null)
const redRegionLab = ref(null)
const isDragging = ref(false)
const isLoading = ref(false)

const triggerFileInput = () => {
  fileInput.value.click()
}

const handleFileChange = (event) => {
  const files = Array.from(event.target.files)
  processFiles(files)
}

const handleDrop = (event) => {
  isDragging.value = false
  const files = Array.from(event.dataTransfer.files)
  processFiles(files)
}

const handleDragEnter = () => {
  isDragging.value = true
}

const handleDragLeave = () => {
  isDragging.value = false
}

const processFiles = (files) => {
  const imageFiles = files.filter(file => file.type.match('image.*'))
  
  if (imageFiles.length === 0) {
    ElMessage.error('请上传图片文件')
    return
  }

  // 检查文件大小
  const invalidFiles = imageFiles.filter(file => file.size > 30 * 1024 * 1024)
  if (invalidFiles.length > 0) {
    ElMessage.error(`以下文件超过30MB限制：${invalidFiles.map(f => f.name).join(', ')}`)
    return
  }

  // 处理每个文件
  imageFiles.forEach(file => {
    const reader = new FileReader()
    reader.onload = (e) => {
      uploadedFiles.value.push({
        file: file,
        name: file.name,
        size: file.size,
        preview: e.target.result
      })
    }
    reader.readAsDataURL(file)
  })
}

const removeFile = (index) => {
  uploadedFiles.value.splice(index, 1)
  if (uploadedFiles.value.length === 0) {
    resetResults()
  }
}

const removeAllFiles = () => {
  uploadedFiles.value = []
  resetResults()
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const resetResults = () => {
  analysisResult.value = null
  comparisonImage.value = null
  originalLab.value = null
  redRegionLab.value = null
}

// 获取进度条宽度
const getProgressWidth = (channel, value) => {
  // 根据不同通道设置不同的最大值
  const maxValues = {
    'L': 100, // L 通道范围通常为 0-100
    'A': 128, // a* 通道范围通常为 -128 到 +127
    'B': 128  // b* 通道范围通常为 -128 到 +127
  }
  
  // 对于 A 和 B 通道，需要将负值转换为正值的百分比
  if (channel === 'A' || channel === 'B') {
    // 将 -128 到 +127 映射到 0-100%
    return ((value + 128) / 256) * 100
  } else {
    // L 通道直接计算百分比
    return (value / maxValues[channel]) * 100
  }
}

// 获取通道对应的颜色
const getColorForChannel = (channel) => {
  const colors = {
    'L': '#333333', // 亮度通道用灰色表示
    'A': '#ff5252', // a* 通道用红绿色表示
    'B': '#2196f3'  // b* 通道用蓝黄色表示
  }
  return colors[channel] || '#409EFF'
}

// 获取通道描述
const getChannelDescription = (channel) => {
  const descriptions = {
    'L': '亮度 (0-100)',
    'A': '红绿轴 (-128 到 +127)',
    'B': '蓝黄轴 (-128 到 +127)'
  }
  return descriptions[channel] || ''
}

const submitImage = async () => {
  if (uploadedFiles.value.length === 0) {
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
    // 这里需要修改为批量处理的逻辑
    const results = []
    for (const file of uploadedFiles.value) {
      const response = await filamentIdentify({
        image: file.preview
      })
      
      if (response.code === 200) {
        results.push({
          fileName: file.name,
          result: response.data
        })
      }
    }
    
    // 处理结果
    if (results.length > 0) {
      // 这里需要根据实际需求处理多个结果
      analysisResult.value = results[0].result
      // 处理对比图片
      const comparisonImageData = results[0].result.comparison_image
      if (comparisonImageData) {
        if (comparisonImageData.startsWith('data:image')) {
          comparisonImage.value = comparisonImageData
        } else {
          comparisonImage.value = `data:image/jpeg;base64,${comparisonImageData}`
        }
      }
      
      // 处理 LAB 值
      originalLab.value = results[0].result.lab_values.original
      redRegionLab.value = results[0].result.lab_values.red_region
      
      ElMessage.success(`成功处理 ${results.length} 个文件`)
    } else {
      ElMessage.error('处理失败')
    }
  } catch (error) {
    console.error('识别失败:', error)
    ElMessage.error('识别失败，请重试')
  } finally {
    loading.close()
    isLoading.value = false
  }
}
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
  border-bottom: 1px solid #e4e7ed;
  position: relative;
}

.page-header::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 3px;
  background: linear-gradient(90deg, #67C23A, #409EFF);
  border-radius: 3px;
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

.image-preview:hover img, .result-image:hover img {
  transform: scale(1.02);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
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

.lab-charts {
  margin-bottom: 25px;
}

.chart-container {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
}

.chart-container:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.chart-container h3 {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 18px;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.chart-container h3 .el-icon {
  color: #409eff;
  font-size: 20px;
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
    flex: 1;  /* 在移动端恢复为等比例 */
  }
}

.file-list {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.file-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 10px;
}

.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
  padding: 10px;
}

.file-item {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.file-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.file-preview {
  position: relative;
  width: 100%;
  padding-top: 100%;
  background-color: #f5f7fa;
}

.file-preview img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-actions {
  position: absolute;
  top: 5px;
  right: 5px;
  opacity: 0;
  transition: opacity 0.3s;
}

.file-item:hover .file-actions {
  opacity: 1;
}

.file-info {
  padding: 8px;
}

.file-name {
  font-size: 13px;
  color: #303133;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-size {
  font-size: 12px;
  color: #909399;
}
</style>
