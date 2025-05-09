<template>
  <div>
    <el-upload
      ref="upload"
      v-model:file-list="fileList"
      class="upload-demo"
      drag
      :action="action"
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

    <el-button
      :disabled="!imageUrl"
      type="primary"
      size="large"
      round
      style="margin-bottom: 10px;"
      @click="analyze"
    >
      识别
    </el-button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { UploadFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getApiUrl } from '@/utils/env';
const emit = defineEmits(['upload-success', 'analyze'])
console.log(process.env);

const fileList = ref([])
const imageUrl = ref('')
const upload = ref()

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
  console.log('Upload success:', uploadFile)

  // 清除之前的 imageUrl
  imageUrl.value = ''

  // 设置新的 imageUrl
  if (uploadFile.raw instanceof File) {
    imageUrl.value = URL.createObjectURL(uploadFile.raw)
  } else if (response && response.url) {
    // 假设服务器返回的响应中包含图片 URL
    imageUrl.value = response.url
  } else if (typeof uploadFile.url === 'string') {
    imageUrl.value = uploadFile.url
  } else {
    console.warn('Unable to set image URL: Invalid upload file or response')
    imageUrl.value = ''
  }

  console.log('Image URL set to:', imageUrl.value)

  // 更新文件列表
  fileList.value = [uploadFile]
  
  // 触发上传成功事件
  emit('upload-success', uploadFile)
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
  imageUrl.value = event.url
}

// 生成唯一文件ID
const genFileId = () => {
  return Date.now().toString()
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

  // 开始上传新文件
  file.uid = genFileId()
  upload.value.handleStart(file)

  console.log('Exceed limit, new image URL set to:', imageUrl.value)
}

// 分析图片
const analyze = () => {
  if (!imageUrl.value) {
    ElMessage.error('请先上传一张图片')
    return
  }
  
  const formData = new FormData()
  if (fileList.value.length > 0 && fileList.value[0].raw instanceof File) {
    formData.append('file', fileList.value[0].raw)
    emit('analyze', formData)
  } else {
    ElMessage.error('没有有效的文件上传')
  }
}

// 暴露方法给父组件
defineExpose({
  clearFiles: () => {
    upload.value?.clearFiles()
    fileList.value = []
    imageUrl.value = ''
  }
})
</script>