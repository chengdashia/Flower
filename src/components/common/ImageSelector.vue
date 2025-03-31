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
      :auto-upload="true"
    >
      <el-icon class="el-icon--upload">
        <upload-filled />
      </el-icon>
      <div class="el-upload__text">
        拖动文件到这或者 <em>点击上传</em>
      </div>
      <template #tip>
        <div class="el-upload__tip">
          jpg/png 文件大小小于 5M
        </div>
      </template>
    </el-upload>

    <!-- <el-button
      :disabled="!imageUrl"
      type="primary"
      size="large"
      round
      style="margin-bottom: 10px;"
      @click="analyze"
    >
      识别
    </el-button> -->
    
    <!-- 图片选择弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      title="请选择一张图片"
      width="80%"
      :before-close="handleDialogClose"
    >
      <div class="image-selection-container">
        <div class="image-option" :class="{ selected: selectedImage === 'front' }" @click="selectImage('front')">
          <h3>正面图片</h3>
          <img v-if="frontImage" :src="frontImage" alt="正面图片" />
          <div v-else class="no-image">无图片</div>
        </div>
        <div class="image-option" :class="{ selected: selectedImage === 'back' }" @click="selectImage('back')">
          <h3>背面图片</h3>
          <img v-if="backImage" :src="backImage" alt="背面图片" />
          <div v-else class="no-image">无图片</div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmImageSelection" :disabled="!selectedImage">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { UploadFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const emit = defineEmits(['upload-success', 'analyze', 'image-selected'])

const fileList = ref([])
const imageUrl = ref('')
const upload = ref()

// 图片选择弹窗相关变量
const dialogVisible = ref(false)
const frontImage = ref('')
const backImage = ref('')
const selectedImage = ref('')
const originalResponse = ref(null)

// 生成唯一文件ID
const genFileId = () => {
  return Date.now().toString()
}

defineProps({
  action: {
    type: String,
    default: "http://127.0.0.1:5000/flower_identify/image"
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

  // 从response中提取front_image和back_image
  if (response && response.result) {
    if (response.result.front_image) {
      frontImage.value = 'data:image/jpeg;base64,' + response.result.front_image
    }
    if (response.result.back_image) {
      backImage.value = 'data:image/jpeg;base64,' + response.result.back_image
    }

    // 如果有图片，显示选择弹窗
    if (frontImage.value || backImage.value) {
      dialogVisible.value = true
      // 默认选择第一个有效的图片
      selectedImage.value = frontImage.value ? 'front' : (backImage.value ? 'back' : '')
    } else {
      ElMessage.warning('响应中没有有效的图片数据')
    }
  } else {
    ElMessage.warning('响应格式不正确或没有result对象')
  }

  // 设置imageUrl为上传的文件URL
  if (uploadFile.raw instanceof File) {
    imageUrl.value = URL.createObjectURL(uploadFile.raw)
  } else if (typeof uploadFile.url === 'string') {
    imageUrl.value = uploadFile.url
  }

  // 更新文件列表
  fileList.value = [uploadFile]
  
  // 触发上传成功事件
  emit('upload-success', uploadFile)
}

// 选择图片
const selectImage = (type) => {
  selectedImage.value = type
}

// 确认图片选择
const confirmImageSelection = () => {
  if (!selectedImage.value) {
    ElMessage.warning('请选择一张图片')
    return
  }
  
  // 获取选中的图片数据
  const selectedImageData = selectedImage.value === 'front' ? frontImage.value : backImage.value
  const selectedImageType = selectedImage.value
  
  // 触发图片选择事件，传递选中的图片数据和类型
  console.log(selectedImageData);
  
  emit('image-selected', {
    imageData: selectedImageData,
  })
  
  // 关闭弹窗
  dialogVisible.value = false
}

// 处理弹窗关闭
const handleDialogClose = () => {
  dialogVisible.value = false
  selectedImage.value = ''
}

// 限制上传图片格式和大小
const beforeAvatarUpload = (rawFile) => {
  const isJpgOrPng = rawFile.type === 'image/jpeg' || rawFile.type === 'image/png'
  if (!isJpgOrPng) {
    ElMessage.error('上传的图片必须是 JPG 或 PNG 格式!')
    return false
  }
  const isLt5M = rawFile.size / 1024 / 1024 < 5
  if (!isLt5M) {
    ElMessage.error('上传的图片大小不能超过 5MB!')
    return false
  }
  return true
}

const handleChange = (event) => {
  imageUrl.value = event.url
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
  console.log(file);
  
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

<style scoped>
.image-selection-container {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  gap: 20px;
}

.image-option {
  width: 45%;
  min-width: 300px;
  border: 2px solid #eee;
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s;
  text-align: center;
}

.image-option:hover {
  border-color: #409EFF;
  box-shadow: 0 0 10px rgba(64, 158, 255, 0.3);
}

.image-option.selected {
  border-color: #409EFF;
  background-color: rgba(64, 158, 255, 0.1);
  box-shadow: 0 0 10px rgba(64, 158, 255, 0.5);
}

.image-option h3 {
  margin-top: 0;
  color: #333;
}

.image-option img {
  max-width: 100%;
  max-height: 300px;
  object-fit: contain;
  border-radius: 4px;
}

.no-image {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  color: #909399;
  font-size: 16px;
  border-radius: 4px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>