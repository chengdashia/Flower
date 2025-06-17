<template>
  <div class="corn-trait-container">
    <div class="page-header">
      <h1 class="page-title">玉米性状识别</h1>
      <p class="page-description">上传玉米图片，获取LAB颜色空间分析结果</p>
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
          <span>识别结果</span>
        </div>
        <div class="result-area">
          <div v-if="!analysisResult" class="result-placeholder">
            <el-icon class="info-icon"><InfoFilled /></el-icon>
            <div>请上传图片进行识别</div>
          </div>
          <div v-else class="result-content">
            <div class="result-image" v-if="processedImage">
              <img :src="processedImage" alt="处理后的图片" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="analysisResult" class="lab-charts">
      <div class="chart-container">
        <div class="chart-header">
          <h3><el-icon><Histogram /></el-icon> LAB 颜色均值</h3>
          <el-button 
            type="primary" 
            size="small" 
            @click="copyLabValues(meanLab, 'LAB颜色均值')"
            :icon="CopyDocument"
          >
            复制数据
          </el-button>
        </div>
        <el-row :gutter="20">
          <el-col :xs="24" :sm="24" :md="8" v-for="(value, key) in meanLab" :key="key">
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
        <div class="chart-header">
          <h3><el-icon><TopRight /></el-icon> a* 最大值对应的 LAB 值</h3>
          <el-button 
            type="primary" 
            size="small" 
            @click="copyLabValues(maxALab, 'a*最大值对应的LAB值')"
            :icon="CopyDocument"
          >
            复制数据
          </el-button>
        </div>
        <el-row :gutter="20">
          <el-col :xs="24" :sm="24" :md="8" v-for="(value, key) in maxALab" :key="key">
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
        :disabled="!uploadedImage" 
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
import { Upload, InfoFilled, Delete, DataAnalysis, Histogram, TopRight, Back, Search, CopyDocument } from '@element-plus/icons-vue'
import { cornIdentify } from '@/api/flower'

const router = useRouter()
const fileInput = ref(null)
const uploadedImage = ref(null)
const analysisResult = ref(null)
const processedImage = ref(null)
const meanLab = ref(null)
const maxALab = ref(null)
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
  uploadedImage.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
  // 重置识别结果
  resetResults()
}

const resetResults = () => {
  analysisResult.value = null
  processedImage.value = null
  meanLab.value = null
  maxALab.value = null
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

  const reader = new FileReader()
  reader.onload = (e) => {
    uploadedImage.value = e.target.result
    // 重置识别结果
    resetResults()
  }
  reader.readAsDataURL(file)
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
  if (!uploadedImage.value) {
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
    // 调用后端API，发送base64格式的图片
    const response = await cornIdentify({
      image: uploadedImage.value
    })
    
    // 处理返回的数据
    if (response.code === 200) {
      analysisResult.value = response.data
      
      // 确保processed_image是完整的base64格式
      const processedImageData = response.data.processed_image
      if (processedImageData) {
        // 检查是否已经包含data:image前缀，如果没有则添加
        if (processedImageData.startsWith('data:image')) {
          processedImage.value = processedImageData
        } else {
          // 假设返回的是纯base64字符串，添加适当的前缀
          processedImage.value = `data:image/jpeg;base64,${processedImageData}`
        }
      }
      
      meanLab.value = response.data.mean_lab
      maxALab.value = response.data.max_a_lab
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

// 复制 LAB 值到剪贴板
const copyLabValues = (labValues, title) => {
  if (!labValues) return
  
  const formatValue = (value) => value.toFixed(2)
  const text = `${title}:\nL: ${formatValue(labValues.L)}\nA: ${formatValue(labValues.A)}\nB: ${formatValue(labValues.B)}`
  
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success('复制成功')
  }).catch(() => {
    ElMessage.error('复制失败，请手动复制')
  })
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

@media (max-width: 768px) {
  .content-wrapper {
    flex-direction: column;
    gap: 20px;
  }
}

.upload-section, .result-section {
  flex: 1;
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

.chart-header {
  display: flex;
  justify-content: space-between;
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

.chart-container h3 {
  display: none; /* 隐藏原来的标题样式 */
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
</style>
