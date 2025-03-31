<template>
  <div class="user-center-container">
    <el-row :gutter="30">
      <el-col :span="8">
        <div class="user-profile-card">
          <div class="avatar-container">
            <el-avatar :size="120" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
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
        </div>
      </el-col>
      
      <el-col :span="16">
        <div class="user-settings-card">
          <h2 class="section-title">账户设置</h2>
          
          <el-form :model="userForm" label-width="100px" class="user-form">
            <el-form-item label="用户名">
              <el-input v-model="userForm.username" disabled />
            </el-form-item>
            
            <el-form-item label="邮箱">
              <el-input v-model="userForm.email" placeholder="请输入邮箱" />
            </el-form-item>
            
            <el-form-item label="手机号码">
              <el-input v-model="userForm.phone" placeholder="请输入手机号码" />
            </el-form-item>
            
            <el-divider />
            
            <el-form-item label="修改密码">
              <el-button type="primary" @click="showPasswordDialog = true">修改密码</el-button>
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="saveUserInfo">保存设置</el-button>
              <el-button @click="resetForm">重置</el-button>
            </el-form-item>
          </el-form>
        </div>
        
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { StarFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

const router = useRouter()

// 用户信息
const userInfo = reactive({
  username: '用户',
  role: '普通用户',
  identifyCount: 0,
  registerDays: 0,
  lastLoginTime: '未登录'
})

// 表单数据
const userForm = reactive({
  username: '',
  email: '',
  phone: ''
})

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
const getUserInfo = async () => {
  try {
    // 这里应该调用API获取用户信息
    // 模拟API返回数据
    const userData = {
      username: '张三',
      role: '普通用户',
      email: 'zhangsan@example.com',
      phone: '13800138000',
      identifyCount: 28,
      registerDays: 45,
      lastLoginTime: '2023-05-15'
    }
    
    // 更新用户信息
    Object.assign(userInfo, userData)
    
    // 更新表单数据
    userForm.username = userData.username
    userForm.email = userData.email
    userForm.phone = userData.phone
    
    ElMessage.success('用户信息获取成功')
  } catch (error) {
    console.error('获取用户信息失败:', error)
    ElMessage.error('获取用户信息失败')
  }
}

// 保存用户信息
const saveUserInfo = async () => {
  try {
    // 这里应该调用API保存用户信息
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ElMessage.success('保存成功')
  } catch (error) {
    console.error('保存用户信息失败:', error)
    ElMessage.error('保存用户信息失败')
  }
}

// 重置表单
const resetForm = () => {
  userForm.email = userInfo.email
  userForm.phone = userInfo.phone
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
  getUserInfo()
})
</script>

<style scoped>
.user-center-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.section-title {
  font-size: 24px;
  color: #303133;
  margin-bottom: 25px;
  font-weight: 600;
  position: relative;
  padding-bottom: 12px;
  letter-spacing: 0.5px;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 70px;
  height: 4px;
  background: linear-gradient(90deg, #409EFF, #79bbff);
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(64, 158, 255, 0.2);
}

.user-profile-card,
.user-settings-card,
.activity-card {
  border-radius: 16px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  padding: 30px;
  background-color: #fff;
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.05);
  margin-bottom: 30px;
}

.user-profile-card:hover,
.user-settings-card:hover,
.activity-card:hover {
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.15);
  transform: translateY(-3px);
}

.user-profile-card {
  background-color: #e8f7fa;
  text-align: center;
}

.user-settings-card {
  background-color: #fff5eb;
}

.activity-card {
  background-color: #f0f7ff;
}

.avatar-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

.username {
  margin: 15px 0 5px;
  font-size: 24px;
  color: #303133;
}

.user-role {
  color: #606266;
  font-size: 16px;
  margin: 0;
}

.user-stats {
  display: flex;
  justify-content: space-around;
  margin-top: 20px;
}

.stat-item {
  text-align: center;
}

.stat-item h3 {
  font-size: 24px;
  color: #409EFF;
  margin: 0 0 5px;
}

.stat-item p {
  color: #606266;
  margin: 0;
  font-size: 14px;
}

.user-form {
  margin-top: 30px;
}

.view-more {
  text-align: center;
  margin-top: 20px;
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .user-profile-card,
  .user-settings-card,
  .activity-card {
    height: auto;
  }
}

/* 对话框样式 */
:deep(.el-dialog) {
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(64, 158, 255, 0.1);
}

:deep(.el-dialog__header) {
  background-color: #f0f7ff;
  padding: 20px 30px;
  margin: 0;
  border-bottom: 1px solid #e6effd;
  position: relative;
}

:deep(.el-dialog__title) {
  font-weight: 700;
  color: #303133;
  font-size: 22px;
  letter-spacing: 0.5px;
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
</style>