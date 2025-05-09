<template>
  <div class="user-center-container">
    <el-row :gutter="30">
      <el-col :span="16">
        <div class="user-profile-card">
          <div class="avatar-container">
            <el-avatar :size="120" :src="userInfo.avatar || 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'" />
            <h2 class="username">{{ userInfo.username }}</h2>
            <p class="user-role">{{ userInfo.role }}</p>
          </div>
          
          <el-divider>
            <el-icon><star-filled /></el-icon>
          </el-divider>
          
          <div class="user-stats">
            <div class="stat-item">
              <h3>{{ userInfo.identifyCount }}</h3>
              <p>识别次数</p>
            </div>
            <div class="stat-item">
              <h3>{{ userInfo.registerDays }}</h3>
              <p>注册天数</p>
            </div>
            <div class="stat-item">
              <h3>{{ userInfo.lastLoginTime }}</h3>
              <p>上次登录</p>
            </div>
          </div>
          
          <el-divider>
            <el-icon><star-filled /></el-icon>
          </el-divider>
          
          <div class="user-created-info">
            <p v-if="userInfo.created_time">创建时间: {{ userInfo.created_time }}</p>
            <p v-if="userInfo.updated_time">更新时间: {{ userInfo.updated_time }}</p>
          </div>
          
          <div class="user-actions">
            <el-button type="primary" @click="showUserInfoDialog = true" class="edit-info-btn">
              <el-icon><Edit /></el-icon> 修改个人信息
            </el-button>
            <el-button type="primary" @click="showPasswordDialog = true" class="change-password-btn">
              <el-icon><Lock /></el-icon> 修改密码
            </el-button>
          </div>
        </div>
      </el-col>
      
      <el-col :span="8">
        <div class="activity-card">
          <h2 class="section-title">最近活动</h2>
          
          <el-timeline>
            <el-timeline-item
              v-for="(activity, index) in recentActivities"
              :key="index"
              :timestamp="activity.time"
              :type="activity.type"
            >
              {{ activity.content }}
            </el-timeline-item>
          </el-timeline>
          
          <div class="view-more">
            <el-button type="text" @click="goToHistory">查看更多历史记录</el-button>
          </div>
        </div>
      </el-col>
    </el-row>
    
    <!-- 修改密码对话框 -->
    <el-dialog
      v-model="showPasswordDialog"
      title="修改密码"
      width="500px"
    >
      <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="120px">
        <el-form-item label="当前密码" prop="currentPassword">
          <el-input 
            v-model="passwordForm.currentPassword" 
            type="password" 
            show-password 
            placeholder="请输入当前密码"
          />
        </el-form-item>
        
        <el-form-item label="新密码" prop="newPassword">
          <el-input 
            v-model="passwordForm.newPassword" 
            type="password" 
            show-password 
            placeholder="请输入新密码"
          />
        </el-form-item>
        
        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input 
            v-model="passwordForm.confirmPassword" 
            type="password" 
            show-password 
            placeholder="请再次输入新密码"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showPasswordDialog = false">取消</el-button>
          <el-button type="primary" @click="changePassword">确认修改</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 修改用户信息对话框 -->
    <el-dialog
      v-model="showUserInfoDialog"
      title="修改个人信息"
      width="500px"
    >
      <el-form :model="userForm" :rules="userFormRules" ref="userFormRef" label-width="100px" class="user-form">
        <el-form-item label="头像" class="avatar-upload-item">
          <el-upload
            class="avatar-uploader"
            :action="'#'"
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleAvatarChange"
            :before-upload="beforeAvatarUpload"
          >
            <img v-if="userForm.avatarUrl" :src="userForm.avatarUrl" class="avatar-preview" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
            <div class="avatar-upload-text">点击上传头像</div>
          </el-upload>
        </el-form-item>
        
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" placeholder="请输入用户名" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showUserInfoDialog = false">取消</el-button>
          <el-button @click="resetForm">重置</el-button>
          <el-button type="primary" @click="saveUserInfo">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { StarFilled, Edit, Lock, Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { getUserInfo, updateUserInfo } from '../api/user'

const router = useRouter()

// 用户信息
const userInfo = reactive({
  username: '用户',
  role: '普通用户',
  identifyCount: 0,
  registerDays: 0,
  lastLoginTime: '未登录',
  avatar: '',
  created_time: '',
  updated_time: ''
})

// 表单数据
const userForm = reactive({
  username: '',
  avatar: '',       // 头像文件（用于上传）
  avatarUrl: ''     // 头像预览URL
})

// 用户表单验证规则
const userFormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度在2到20个字符之间', trigger: 'blur' }
  ]
}

const userFormRef = ref(null)

// 密码表单
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 密码表单验证规则
const passwordRules = {
  currentPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6个字符', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6个字符', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const passwordFormRef = ref(null)
const showPasswordDialog = ref(false)
const showUserInfoDialog = ref(false)

// 最近活动
const recentActivities = ref([
  {
    content: '识别了一张菊花图片',
    time: '2023-05-15 14:30',
    type: 'primary'
  },
  {
    content: '修改了账户信息',
    time: '2023-05-10 09:45',
    type: 'success'
  },
  {
    content: '识别了一张玉米图片',
    time: '2023-05-05 16:20',
    type: 'primary'
  }
])

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    // 调用API获取用户信息
    const response = await getUserInfo()
    
    if (response.code === 200) {
      const userData = response.data
      
      // 更新用户信息
      userInfo.username = userData.username
      userInfo.avatar = userData.avatar // base64格式的头像
      userInfo.created_time = userData.created_time
      userInfo.updated_time = userData.updated_time
      
      // 保留原有的其他信息处理逻辑
      userInfo.role = '普通用户' // 这里可以根据实际情况修改
      userInfo.identifyCount = 28 // 这里可以根据实际情况修改
      userInfo.registerDays = 45 // 这里可以根据实际情况修改
      userInfo.lastLoginTime = userData.updated_time // 使用创建时间作为登录时间
      
      // 更新表单数据
      userForm.username = userData.username
      
      // 设置头像预览URL
      if (userData.avatar) {
        userForm.avatarUrl = userData.avatar
      }
      
      ElMessage.success('用户信息获取成功')
    } else {
      ElMessage.error(response.message || '获取用户信息失败')
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    ElMessage.error('获取用户信息失败')
  }
}

// 保存用户信息
const saveUserInfo = async () => {
  if (!userFormRef.value) return
  
  await userFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // 准备要提交的数据 - 构建包含username和avatar的JSON数据
        const updateData = {
          username: userForm.username
        }
        
        // 如果有新上传的头像，添加到提交数据中
        // 确保avatar字段包含base64格式的图片数据
        if (userForm.avatar) {
          updateData.avatar = userForm.avatar
        }
        
        console.log('提交的用户信息数据:', updateData)
        
        // 调用user.js中的updateUserInfo接口发送JSON数据
        const response = await updateUserInfo(updateData)
        
        if (response && response.code === 200) {
          // 更新页面上显示的用户信息
          userInfo.username = userForm.username
          if (userForm.avatarUrl) {
            userInfo.avatar = userForm.avatarUrl
          }
          
          ElMessage.success('个人信息更新成功')
          showUserInfoDialog.value = false
          
          // 重新获取用户信息以确保数据同步
          fetchUserInfo()
        } else {
          ElMessage.error(response?.message || '保存用户信息失败')
        }
      } catch (error) {
        console.error('保存用户信息失败:', error)
        ElMessage.error('保存用户信息失败')
      }
    }
  })
}

// 头像上传前的验证
const beforeAvatarUpload = (file) => {
  // 验证文件类型
  const isImage = ['image/jpeg', 'image/png', 'image/gif'].includes(file.type)
  if (!isImage) {
    ElMessage.error('头像只能是JPG、PNG或GIF格式!')
    return false
  }
  
  // 验证文件大小（限制为2MB）
  const isLt2M = file.size / 1024 / 1024 < 5
  if (!isLt2M) {
    ElMessage.error('头像大小不能超过5MB!')
    return false
  }
  
  return true
}

// 处理头像变更
const handleAvatarChange = (file) => {
  // 验证文件
  if (!beforeAvatarUpload(file.raw)) {
    return
  }
  
  // 将文件转为base64以便预览和提交
  const reader = new FileReader()
  reader.readAsDataURL(file.raw)
  reader.onload = () => {
    userForm.avatarUrl = reader.result
    userForm.avatar = reader.result // 保存base64格式的头像数据
  }
}

// 重置表单
const resetForm = () => {
  userForm.username = userInfo.username
  userForm.avatarUrl = userInfo.avatar || ''
  userForm.avatar = '' // 清空新上传的头像数据
}

// 修改密码
const changePassword = async () => {
  if (!passwordFormRef.value) return
  
  await passwordFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // 这里应该调用API修改密码
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        ElMessage.success('密码修改成功')
        showPasswordDialog.value = false
        
        // 清空表单
        passwordForm.currentPassword = ''
        passwordForm.newPassword = ''
        passwordForm.confirmPassword = ''
      } catch (error) {
        console.error('修改密码失败:', error)
        ElMessage.error('修改密码失败')
      }
    }
  })
}

// 跳转到历史记录页面
const goToHistory = () => {
  router.push('/history')
}

// 页面加载时获取用户信息
onMounted(() => {
  fetchUserInfo()
})
</script>

<style scoped>
.user-center-container {
  padding: 30px;
  max-width: 1400px;
  margin: 0 auto;
  background-color: #f9fafc;
  min-height: calc(100vh - 60px);
}

.section-title {
  font-size: 26px;
  color: #2c3e50;
  margin-bottom: 28px;
  font-weight: 700;
  position: relative;
  padding-bottom: 14px;
  letter-spacing: 0.6px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 80px;
  height: 4px;
  background: linear-gradient(90deg, #3498db, #9b59b6);
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(52, 152, 219, 0.3);
}

.user-profile-card,
.user-settings-card,
.activity-card {
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  padding: 35px;
  background-color: #fff;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border: 1px solid rgba(0, 0, 0, 0.03);
  margin-bottom: 35px;
  overflow: hidden;
  position: relative;
}

.user-profile-card::before,
.user-settings-card::before,
.activity-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 6px;
  background: linear-gradient(90deg, #3498db, #9b59b6);
}

.user-profile-card:hover,
.user-settings-card:hover,
.activity-card:hover {
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.12);
  transform: translateY(-5px);
}

.user-profile-card {
  background: linear-gradient(135deg, #e8f7fa 0%, #f0f9ff 100%);
  text-align: center;
  height: 100%;
}

.user-settings-card {
  background: linear-gradient(135deg, #fff5eb 0%, #fff9f0 100%);
}

.activity-card {
  background: linear-gradient(135deg, #f0f7ff 0%, #f5f9ff 100%);
}

.avatar-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 25px;
  position: relative;
}

.avatar-container :deep(.el-avatar) {
  border: 4px solid white;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.avatar-container :deep(.el-avatar):hover {
  transform: scale(1.05);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.username {
  margin: 18px 0 5px;
  font-size: 28px;
  color: #2c3e50;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.user-role {
  color: #5e6d82;
  font-size: 16px;
  margin: 0;
  background-color: rgba(255, 255, 255, 0.6);
  padding: 4px 12px;
  border-radius: 20px;
  display: inline-block;
  font-weight: 500;
}

.user-stats {
  display: flex;
  justify-content: space-around;
  margin: 25px 0;
  padding: 15px 0;
  background-color: rgba(255, 255, 255, 0.5);
  border-radius: 15px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.stat-item {
  text-align: center;
  padding: 0 15px;
  position: relative;
}

.stat-item:not(:last-child)::after {
  content: '';
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 70%;
  width: 1px;
  background-color: rgba(0, 0, 0, 0.08);
}

.stat-item h3 {
  font-size: 28px;
  color: #3498db;
  margin: 0 0 8px;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.stat-item p {
  color: #5e6d82;
  margin: 0;
  font-size: 14px;
  font-weight: 500;
}

.user-form {
  margin-top: 30px;
}

.user-form :deep(.el-form-item__label) {
  font-weight: 600;
  color: #2c3e50;
}

.user-form :deep(.el-input__inner) {
  border-radius: 8px;
  padding: 12px 15px;
  height: auto;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
  transition: all 0.3s ease;
}

.user-form :deep(.el-input__inner:focus) {
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.15);
}

.user-form :deep(.el-button) {
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.user-form :deep(.el-button--primary) {
  background: linear-gradient(135deg, #3498db, #2980b9);
  border: none;
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}

.user-form :deep(.el-button--primary:hover) {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(52, 152, 219, 0.4);
}

.user-form :deep(.el-button--default) {
  border: 1px solid #dcdfe6;
  background-color: white;
  color: #606266;
}

.user-form :deep(.el-button--default:hover) {
  border-color: #c0c4cc;
  color: #409EFF;
}

.user-created-info {
  text-align: center;
  margin-top: 25px;
  font-size: 14px;
  color: #5e6d82;
  background-color: rgba(255, 255, 255, 0.5);
  padding: 10px;
  border-radius: 10px;
}

.user-actions {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 30px;
}

.edit-info-btn,
.change-password-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 10px;
  font-weight: 600;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #3498db, #2980b9);
  border: none;
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}

.edit-info-btn:hover,
.change-password-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(52, 152, 219, 0.4);
}

.view-more {
  text-align: center;
  margin-top: 25px;
}

.view-more :deep(.el-button--text) {
  color: #3498db;
  font-weight: 600;
  font-size: 16px;
  transition: all 0.3s ease;
}

.view-more :deep(.el-button--text:hover) {
  color: #2980b9;
  transform: translateX(3px);
}

:deep(.el-timeline-item__node) {
  background-color: #3498db;
  box-shadow: 0 0 0 4px rgba(52, 152, 219, 0.2);
}

:deep(.el-timeline-item__content) {
  padding: 10px 15px;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

:deep(.el-timeline-item__content:hover) {
  transform: translateX(5px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.08);
}

:deep(.el-timeline-item__timestamp) {
  color: #5e6d82;
  font-weight: 500;
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .user-profile-card,
  .user-settings-card,
  .activity-card {
    height: auto;
  }
}

@media (max-width: 768px) {
  .user-center-container {
    padding: 20px;
  }
  
  .user-profile-card,
  .user-settings-card,
  .activity-card {
    padding: 25px;
  }
}

/* 对话框样式 */
:deep(.el-dialog) {
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.18);
  border: none;
}

:deep(.el-dialog__header) {
  background: linear-gradient(135deg, #f0f7ff 0%, #e8f7fa 100%);
  padding: 25px 30px;
  margin: 0;
  border-bottom: 1px solid #e6effd;
  position: relative;
}

:deep(.el-dialog__title) {
  font-weight: 700;
  color: #2c3e50;
  font-size: 24px;
  letter-spacing: 0.6px;
}

:deep(.el-dialog__body) {
  padding: 40px;
  background-color: #fafcff;
}

:deep(.el-dialog__footer) {
  border-top: 1px solid #e6effd;
  padding: 20px 30px;
  background-color: #f9fbff;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 20px;
}

/* 头像上传样式 */
.avatar-upload-item {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.avatar-uploader {
  width: 150px;
  height: 150px;
  border: 1px dashed #d9d9d9;
  border-radius: 50%;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}

.avatar-uploader:hover {
  border-color: #409EFF;
  box-shadow: 0 0 10px rgba(64, 158, 255, 0.3);
  transform: scale(1.02);
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 40px;
  height: 40px;
  line-height: 40px;
  text-align: center;
}

.avatar-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.avatar-upload-text {
  color: #8c939d;
  font-size: 12px;
  margin-top: 8px;
  text-align: center;
}
</style>