<template>
  <div class="user-center-container">
    <!-- 数据统计图表区块 -->
    <div class="user-stats-charts-wide card-block">
      <div class="user-info-compact">
        <el-avatar :size="80" :src="userInfo.avatar || 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'" />
        <div class="user-info-main">
          <div class="username">{{ userInfo.username }}</div>
          <div class="user-role">{{ userInfo.role }}</div>
          <div class="user-stats-row">
            <div class="stat-item"><div class="stat-num">{{ userInfo.identifyCount }}</div><div class="stat-label">识别次数</div></div>
            <div class="stat-item"><div class="stat-num">{{ userInfo.registerDays }}</div><div class="stat-label">注册天数</div></div>
          </div>
          <div class="user-actions-row">
            <el-button type="primary" @click="showUserInfoDialog = true" class="edit-info-btn">
              <el-icon><Edit /></el-icon> 修改个人信息
            </el-button>
            <el-button type="primary" @click="showPasswordDialog = true" class="change-password-btn">
              <el-icon><Lock /></el-icon> 修改密码
            </el-button>
          </div>
        </div>
      </div>
      <h2 class="section-title">数据统计</h2>
      <el-row :gutter="32" class="charts-row-wide">
        <el-col :xs="24" :md="12">
          <div class="chart-block">
            <template v-if="weekTotalCounts.length">
              <BarChart
                :title="'一周每日识别总次数'"
                :categories="weekDays"
                :data="weekTotalCounts"
                style="width:100%;height:420px;"
              />
            </template>
            <el-empty v-else description="暂无识别记录" />
          </div>
        </el-col>
        <el-col :xs="24" :md="12">
          <div class="chart-block">
            <template v-if="weekTypeCountsPie.length">
              <PieChart
                :data="weekTypeCountsPie"
                :option="pieOption"
                style="width:100%;height:420px;margin-top: -100px;"
              />
            </template>
            <el-empty v-else description="暂无类别识别数据" />
          </div>
        </el-col>
      </el-row>
    </div>
    
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
import { ref, reactive, onMounted, computed } from 'vue'
import { Edit, Lock, Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { getUserInfo, updateUserInfo } from '../../api/user'
import BarChart from '@/components/charts/BarChart.vue'
import PieChart from '@/components/charts/PieChart.vue'
import { getWeekTotalCount, getWeekTypeCount } from '@/api/statistics'

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


// 图表数据模拟
const weekDays = ref([])
const weekTotalCounts = ref([])
const weekTypeCountsPie = ref([])
const loading = ref(false)

const fetchStatistics = async () => {
  loading.value = true
  try {
    const [totalRes, typeRes] = await Promise.all([
      getWeekTotalCount(),
      getWeekTypeCount(),
    ])
    // 1. 一周每日识别总次数
    if (totalRes.code === 200 && Array.isArray(totalRes.data)) {
      weekDays.value = totalRes.data.map(item => item.date.slice(5))
      weekTotalCounts.value = totalRes.data.map(item => item.count)
    }
    // 3. 各类别识别次数
    if (typeRes.code === 200 && typeRes.data) {
      weekTypeCountsPie.value = Object.entries(typeRes.data).map(([k, v]) => ({
        name: k === 'chr' ? '菊花识别' : k === 'corn_filament' ? '花丝识别' : k === 'corn_filament_nature' ? '花丝原位识别' : k === 'corn_leaf_sheath' ? '叶鞘识别' : k === 'corn_shape' ? '玉米形状' : k === 'corn_all' ? '玉米整体': k,
        value: v
      }))
    }
  } catch (e) {
    ElMessage.error('统计数据获取失败')
  } finally {
    loading.value = false
  }
}

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
  fetchStatistics()
})

// 饼图美化option
const pieOption = computed(() => ({
  legend: {
    orient: 'horizontal',
    left: 'center',
    bottom: 0,
    textStyle: { fontSize: 13 }
  },
  series: [
    {
      type: 'pie',
      radius: ['45%', '65%'], // 稍微缩小
      center: ['50%', '48%'], // 稍微上移
      avoidLabelOverlap: true, // 开启标签避让
      label: {
        show: true,
        position: 'outside',
        fontSize: 12,
        formatter: '{b} {c}次'
      },
      labelLine: {
        show: true,
        length: 24, // 加长
        length2: 16
      }
    }
  ]
}))
</script>

<style scoped>
.user-center-container {
  padding: 40px 0 40px 0;
  max-width: 1200px;
  margin: 0 auto;
  background: #fff;
  min-height: calc(100vh - 60px);
  display: flex;
  flex-direction: column;
  align-items: center;
}
.user-stats-charts-wide {
  width: 100%;
  max-width: 1100px;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 6px 24px rgba(0,0,0,0.10);
  padding: 36px 40px 32px 40px;
  margin-bottom: 36px;
}
.user-info-compact {
  display: flex;
  align-items: center;
  gap: 28px;
  margin-bottom: 18px;
}
.user-info-compact .el-avatar {
  border: 2px solid #e6effd;
}
.user-info-main {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}
.username {
  font-size: 28px;
  color: #2c3e50;
  font-weight: 700;
  margin-bottom: 2px;
}
.user-role {
  color: #5e6d82;
  font-size: 15px;
  margin: 0 0 10px 0;
  background-color: rgba(255, 255, 255, 0.6);
  padding: 2px 10px;
  border-radius: 20px;
  display: inline-block;
  font-weight: 500;
}
.user-stats-row {
  display: flex;
  gap: 40px;
  margin-top: 8px;
}
.stat-item {
  text-align: center;
}
.stat-num {
  font-size: 22px;
  color: #3498db;
  font-weight: 700;
}
.stat-label {
  color: #5e6d82;
  font-size: 13px;
}
.user-actions-row {
  display: flex;
  flex-direction: row;
  gap: 12px;
  margin-top: 8px;
}
.user-actions-row .el-button {
  min-width: 120px;
  font-weight: 500;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(64,158,255,0.06);
  text-align: center;
}
.section-title {
  font-size: 22px;
  color: #2c3e50;
  margin-bottom: 24px;
  font-weight: 700;
  position: relative;
  padding-bottom: 10px;
  letter-spacing: 0.6px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}
.section-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 60px;
  height: 3px;
  background: linear-gradient(90deg, #3498db, #9b59b6);
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(52, 152, 219, 0.3);
}
.charts-row-wide {
  margin-top: 10px;
}
.chart-block {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(64,158,255,0.06);
  padding: 18px 10px 10px 10px;
  margin-bottom: 18px;
  min-height: 500px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
@media (max-width: 900px) {
  .user-stats-charts-wide, .card-block {
    padding: 18px 6px 12px 6px;
  }
}
@media (max-width: 768px) {
  .user-info-compact {
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }
  .user-actions-row {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
    width: 100%;
  }
  .user-stats-charts-wide, .card-block {
    padding: 12px 2px 8px 2px;
  }
  .charts-row-wide {
    flex-direction: column;
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