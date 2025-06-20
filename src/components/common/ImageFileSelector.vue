<template>
  <div>
    <el-upload
      ref="upload"
      v-model:file-list="fileList"
      class="upload-demo"
      drag
      :action="action"
      :headers="uploadHeaders"
      :on-preview="handlePreview"
      :on-remove="handleRemove"
      list-type="picture"
      :on-success="handleAvatarSuccess"
      :before-upload="beforeAvatarUpload"
      :on-change="handleChange"
      :limit="1"
      :on-exceed="handleExceed"
      :auto-upload="false"
    >
      <el-icon class="el-icon--upload">
        <upload-filled />
      </el-icon>
      <div class="el-upload__text">
        拖动文件到这或者 <em>点击上传</em>
      </div>
      <template #tip>
        <div class="el-upload__tip">
          jpg/png 文件大小小于 30M
        </div>
      </template>
    </el-upload>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { UploadFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getApiUrl } from '@/utils/env';

const emit = defineEmits(['upload-success', 'image-selected'])

const fileList = ref([])
const imageUrl = ref('')
const upload = ref()

// 图片选择弹窗相关变量 - 暴露给父组件使用
const frontImage = ref('')
const backImage = ref('')
const originalResponse = ref(null)

// 设置上传请求头，包含token
const uploadHeaders = ref({
  'token': window.sessionStorage.getItem('token') || '',
  'Authorization': window.sessionStorage.getItem('token') || ''
})

// 生成唯一文件ID
const genFileId = () => {
  return Date.now().toString()
}

defineProps({
  action: {
    type: String,
    default: () => getApiUrl()
  }
})

// 处理图片移除
const handleRemove = (uploadFile, uploadFiles) => {
  console.log(uploadFile, uploadFiles)
  imageUrl.value = ''
}

// 处理图片预览
const handlePreview = (file) => {
  console.log('Handle preview:', file)
}

// 上传成功后处理逻辑
const handleAvatarSuccess = (response, uploadFile) => {
  console.log('Upload success:', response, uploadFile)

  // 保存原始响应数据
  originalResponse.value = response

  // 直接触发上传成功事件，传递文件对象给父组件处理
  emit('upload-success', uploadFile.raw || uploadFile)

  // 设置imageUrl为上传的文件URL
  if (uploadFile.raw instanceof File) {
    imageUrl.value = URL.createObjectURL(uploadFile.raw)
  } else if (typeof uploadFile.url === 'string') {
    imageUrl.value = uploadFile.url
  }

  // 更新文件列表
  fileList.value = [uploadFile]
}

// 限制上传图片格式和大小
const beforeAvatarUpload = (rawFile) => {
  
  const isJpgOrPng = rawFile.type === 'image/jpeg' || rawFile.type === 'image/png'
  if (!isJpgOrPng) {
    ElMessage.error('上传的图片必须是 JPG 或 PNG 格式!')
    return false
  }
  const isLt5M = rawFile.size / 1024 / 1024 < 30
  if (!isLt5M) {
    ElMessage.error('上传的图片大小不能超过 30MB!')
    return false
  }
  return true
}

const handleChange = (event) => {
  console.log('File changed:', event)
  
  // 如果有文件被选择，立即触发上传成功事件
  if (event.raw) {
    imageUrl.value = URL.createObjectURL(event.raw)
    emit('upload-success', event.raw)
  } else if (event.url) {
    imageUrl.value = event.url
  }
}

// 超过文件上传限制处理
const handleExceed = (files) => {
  // 清除现有文件
  upload.value.clearFiles()
  fileList.value = []

  // 获取新文件
  const file = files[0]

  // 更新 imageUrl
  if (file instanceof File) {
    imageUrl.value = URL.createObjectURL(file)
  } else {
    imageUrl.value = ''
  }

  // 立即触发上传成功事件
  emit('upload-success', file)

  // 开始上传新文件
  file.uid = genFileId()
  fileList.value = [file]
  
  console.log('Exceed limit, new image URL set to:', imageUrl.value)
}

// 暴露方法和数据给父组件
defineExpose({
  clearFiles: () => {
    upload.value?.clearFiles()
    fileList.value = []
    imageUrl.value = ''
  },
  frontImage,
  backImage,
  originalResponse
})
</script>

<style scoped>
/* 上传区域样式优化 */
:deep(.el-upload-dragger) {
  width: 100%;
  height: 220px;
  border: 2px dashed #d9ecff;
  border-radius: 12px;
  background-color: rgba(236, 245, 255, 0.3);
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

:deep(.el-upload-dragger:hover) {
  border-color: #409EFF;
  background-color: rgba(236, 245, 255, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.05);
}

:deep(.el-icon--upload) {
  font-size: 48px;
  color: #409EFF;
  margin-bottom: 16px;
  filter: drop-shadow(0 2px 5px rgba(0, 0, 0, 0.1));
}

:deep(.el-upload__text) {
  font-size: 16px;
  color: #606266;
}

:deep(.el-upload__text em) {
  color: #409EFF;
  font-style: normal;
  font-weight: 600;
  text-decoration: underline;
}

:deep(.el-upload__tip) {
  font-size: 14px;
  color: #909399;
  margin-top: 10px;
}
</style> 