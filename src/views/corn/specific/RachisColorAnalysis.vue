<template>
  <div class="corn-trait-container">
    <div class="page-header">
      <h1 class="page-title">玉米穗轴颜色分析</h1>
      <p class="page-description">上传玉米穗轴图片，获取 LAB 均值与掩码结果</p>
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

    <div class="action-buttons" v-if="uploadedFile">
      <el-button
        type="success"
        class="identify-button"
        @click="submitImage"
        :loading="isLoading"
      >
        <el-icon class="button-icon"><Search /></el-icon>
        <span>{{ isLoading ? '分析中...' : '开始分析' }}</span>
      </el-button>
    </div>

    <div v-if="resultData" class="data-analysis-section">
      <div class="section-header">
        <h2>分析结果</h2>
        <el-button type="primary" @click="copyAllData" :icon="CopyDocument" size="large">一键复制</el-button>
      </div>

      <div class="data-section">
        <div class="section-title-wrapper">
          <div class="section-icon">
            <el-icon><Histogram /></el-icon>
          </div>
          <h3 class="section-title">LAB 均值</h3>
          <div class="section-description">穗轴颜色在 LAB 空间下的均值</div>
        </div>
        <div class="section-content">
          <el-row :gutter="20">
            <el-col :xs="24" :sm="8">
              <div class="info-card">
                <div class="card-header">
                  <el-icon><DataAnalysis /></el-icon>
                  <span>L_mean</span>
                </div>
                <div class="card-content">
                  <div class="info-item">
                    <div class="info-label">亮度 L</div>
                    <div class="info-value">{{ formatNumber(resultData.L_mean) }}</div>
                  </div>
                </div>
              </div>
            </el-col>
            <el-col :xs="24" :sm="8">
              <div class="info-card">
                <div class="card-header">
                  <el-icon><DataAnalysis /></el-icon>
                  <span>A_mean</span>
                </div>
                <div class="card-content">
                  <div class="info-item">
                    <div class="info-label">红绿轴 A</div>
                    <div class="info-value">{{ formatNumber(resultData.A_mean) }}</div>
                  </div>
                </div>
              </div>
            </el-col>
            <el-col :xs="24" :sm="8">
              <div class="info-card">
                <div class="card-header">
                  <el-icon><DataAnalysis /></el-icon>
                  <span>B_mean</span>
                </div>
                <div class="card-content">
                  <div class="info-item">
                    <div class="info-label">蓝黄轴 B</div>
                    <div class="info-value">{{ formatNumber(resultData.B_mean) }}</div>
                  </div>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>

      <div class="data-section" v-if="resultData.mask_image">
        <div class="section-title-wrapper">
          <div class="section-icon">
            <el-icon><Histogram /></el-icon>
          </div>
          <h3 class="section-title">掩码结果</h3>
          <div class="section-description">模型提取的穗轴掩码图</div>
        </div>
        <div class="section-content">
          <el-row :gutter="18" class="image-row">
            <el-col :xs="24" :sm="12">
              <el-card class="image-card">
                <div class="image-title">掩码图片</div>
                <img :src="getImageUrl(resultData.mask_image)" alt="掩码图片" class="result-img" />
              </el-card>
            </el-col>
          </el-row>
        </div>
      </div>
    </div>
  </div>
  
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue'
import { ElMessage, ElLoading } from 'element-plus'
import { Upload, Delete, DataAnalysis, Search, CopyDocument, Histogram } from '@element-plus/icons-vue'
import { cornRachisColor } from '@/api/corn'

const fileInput = ref(null)
const uploadedImage = ref(null)
const uploadedFile = ref(null)
const resultData = ref(null)
const isDragging = ref(false)
const isLoading = ref(false)

const triggerFileInput = () => {
  fileInput.value && fileInput.value.click()
}

const handleFileChange = (event) => {
  const file = event.target.files && event.target.files[0]
  if (file) processFile(file)
}

const handleDrop = (event) => {
  isDragging.value = false
  const file = event.dataTransfer.files && event.dataTransfer.files[0]
  if (file) processFile(file)
}

const handleDragEnter = () => { isDragging.value = true }
const handleDragLeave = () => { isDragging.value = false }

const removeImage = (event) => {
  event.stopPropagation()
  if (uploadedImage.value && uploadedImage.value.startsWith('blob:')) {
    URL.revokeObjectURL(uploadedImage.value)
  }
  uploadedImage.value = null
  uploadedFile.value = null
  resultData.value = null
  if (fileInput.value) fileInput.value.value = ''
}

const processFile = (file) => {
  if (!file.type.match('image.*')) {
    ElMessage.error('请上传图片文件')
    return
  }
  if (file.size > 30 * 1024 * 1024) {
    ElMessage.error('文件大小不能超过30MB')
    return
  }
  uploadedFile.value = file
  uploadedImage.value = URL.createObjectURL(file)
  resultData.value = null
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
    const response = await cornRachisColor(uploadedFile.value)
    if (response.code === 200) {
      resultData.value = response.data
      ElMessage.success('分析成功')
    } else {
      ElMessage.error(response.message || '分析失败')
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('分析失败，请重试')
  } finally {
    loading.close()
    isLoading.value = false
  }
}

const getImageUrl = (imagePath) => {
  if (!imagePath) return ''
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath
  if (imagePath.startsWith('data:image')) return imagePath
  const baseURL = process.env.VUE_APP_API_URL || 'http://127.0.0.1:5000'
  return `${baseURL}${imagePath}`
}

const formatNumber = (n) => {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '--'
  return Number(n).toFixed(2)
}

const copyAllData = () => {
  if (!resultData.value) return
  const { L_mean, A_mean, B_mean, mask_image } = resultData.value
  const text = `玉米穗轴颜色分析\n\nL_mean: ${formatNumber(L_mean)}\nA_mean: ${formatNumber(A_mean)}\nB_mean: ${formatNumber(B_mean)}\nmask_image: ${getImageUrl(mask_image)}\n\n时间: ${new Date().toLocaleString('zh-CN')}`
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      ElMessage.success('复制成功')
    }).catch(() => {
      ElMessage.error('复制失败，请手动复制')
    })
  } else {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'absolute'
    textarea.style.left = '-9999px'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      document.execCommand('copy')
      ElMessage.success('复制成功')
    } catch (err) {
      ElMessage.error('复制失败，请手动复制')
    }
    document.body.removeChild(textarea)
  }
}

onBeforeUnmount(() => {
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
  flex: 1;
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

.info-card .card-content { display: flex; flex-direction: column; gap: 10px; }
.info-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(64, 158, 255, 0.1); }
.info-item:last-child { border-bottom: none; }
.info-label { font-size: 14px; color: #606266; font-weight: 500; }
.info-value { font-size: 18px; font-weight: 700; color: #409eff; font-family: 'Courier New', monospace; }

.image-row { margin-bottom: 0; }
.image-card { border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); margin-bottom: 0; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; }
.image-title { text-align: center; font-size: 15px; font-weight: 600; color: #303133; margin-bottom: 8px; margin-top: 4px; }
.result-img { max-height: 260px; width: auto; max-width: 100%; object-fit: contain; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.10); }

.action-buttons { display: flex; justify-content: center; margin: 30px 0; padding: 20px; }
.identify-button { padding: 14px 45px; font-size: 17px; border-radius: 30px; transition: all 0.3s; background: linear-gradient(135deg, #67C23A, #4CAF50); border: none; color: white; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 10px; box-shadow: 0 6px 16px rgba(76, 175, 80, 0.4); position: relative; overflow: hidden; }
.identify-button::before { content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent); transition: all 0.6s; }
.identify-button:hover:not(:disabled)::before { left: 100%; }
.identify-button:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(76, 175, 80, 0.5); background: linear-gradient(135deg, #85CE61, #67C23A); }
.identify-button:active:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4); }
.identify-button:disabled { background: linear-gradient(135deg, #C0C4CC, #909399); box-shadow: none; cursor: not-allowed; opacity: 0.8; }
.button-icon { font-size: 20px; }

@media (max-width: 768px) {
  .content-wrapper { flex-direction: column; gap: 20px; }
  .upload-section { flex: 1; }
  .data-analysis-section { padding: 20px; margin-top: 20px; }
  .data-section { padding: 20px; margin-bottom: 25px; }
}
</style>
