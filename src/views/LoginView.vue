<template>
  <!-- 最外层的大盒子 -->
  <div class="bigBox">
    <div class="box" ref="box">
      <!-- 滑动盒子 -->
      <div class="pre-box">
        <h1>WELCOME</h1>
        <p>JOIN US!</p>
        <div class="img-box">
          <img src="../assets/img/flower.png" alt="" id="avatar" />
        </div>
      </div>
      <!-- 注册盒子 -->
      <div class="register-form">
        <!-- 标题盒子 -->
        <div class="title-box">
          <h1>注册</h1>
        </div>
        <!-- 输入框盒子 -->
        <el-form
          ref="registerFormRef"
          :model="registerForm"
          :rules="rules"
          label-width="0"
          @keyup.enter="register"
        >
          <el-form-item prop="username" label=" ">
            <el-input
              type="text"
              placeholder="用户名"
              v-model="registerForm.username"
              prefix-icon="User"
            />
          </el-form-item>
          <el-form-item prop="password" label=" ">
            <el-input
              :type="registerPasswordVisible ? 'text' : 'password'"
              placeholder="密码"
              v-model="registerForm.password"
              prefix-icon="Lock"
            >
              <template #suffix>
                <el-icon 
                  class="password-icon" 
                  @click="registerPasswordVisible = !registerPasswordVisible"
                >
                  <View v-if="registerPasswordVisible" />
                  <Hide v-else />
                </el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item prop="confirmPassword" label=" ">
            <el-input
              :type="confirmPasswordVisible ? 'text' : 'password'"
              placeholder="确认密码"
              v-model="registerForm.confirmPassword"
              prefix-icon="Lock"
            >
              <template #suffix>
                <el-icon 
                  class="password-icon" 
                  @click="confirmPasswordVisible = !confirmPasswordVisible"
                >
                  <View v-if="confirmPasswordVisible" />
                  <Hide v-else />
                </el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="register" class="submit-btn">注册</el-button>
          </el-form-item>
        </el-form>
        <!-- 按钮盒子 -->
        <div class="switch-box">
          <p @click="mySwitch">已有账号? <span class="highlight">去登录</span></p>
        </div>
      </div>
      <!-- 登录盒子 -->
      <div class="login-form">
        <!-- 标题盒子 -->
        <div class="title-box">
          <h1>登录</h1>
        </div>
        <!-- 输入框盒子 -->
        <el-form
          ref="loginFormRef"
          :model="loginForm"
          :rules="rules"
          label-width="0"
          @keyup.enter="login"
        >
          <el-form-item prop="username" label=" ">
            <el-input
              type="text"
              placeholder="用户名"
              v-model="loginForm.username"
              prefix-icon="User"
            />
          </el-form-item>
          <el-form-item prop="password" label=" ">
            <el-input
              :type="passwordVisible ? 'text' : 'password'"
              placeholder="密码"
              v-model="loginForm.password"
              prefix-icon="Lock"
            >
              <template #suffix>
                <el-icon 
                  class="password-icon" 
                  @click="passwordVisible = !passwordVisible"
                >
                  <View v-if="passwordVisible" />
                  <Hide v-else />
                </el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="login" class="submit-btn">登录</el-button>
          </el-form-item>
        </el-form>
        <!-- 按钮盒子 -->
        <div class="switch-box">
          <p @click="mySwitch">没有账号? <span class="highlight">去注册</span></p>
        </div>
      </div>
    </div>
  </div>
</template>
  
<script setup>
import { Lock, User, View, Hide } from '@element-plus/icons-vue'
import mySwitch from '@/utils/mySwitch'
import { reactive, ref } from 'vue'
import api from '@/api/login.js'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

// 添加密码可见性状态
const passwordVisible = ref(false)
const registerPasswordVisible = ref(false)
const confirmPasswordVisible = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})
const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: ''
})
  
const loginFormRef = ref('')
const registerFormRef = ref('')
const rules = reactive({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 5, message: '长度应该在3~5个字符之间', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '长度应该大于6', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请输入确认密码', trigger: 'blur' },
    { min: 6, message: '长度应该大于6', trigger: 'blur' },
  ],
})
  
const router = useRouter()
  
const login = () => {
  loginFormRef.value.validate((valid) => {
    if (valid) {
      api.loginApi(loginForm).then(res => {
        console.log('login', res)
        if (res.code === 200) {
          ElMessage.success(res.message)
          window.sessionStorage.setItem('token', res.token)
          router.push('/home')
        }
      }).catch(error => {
        console.log(error);
      })
    }
  })
}
  
const register = () => {
  // 首先检查 password 和 confirmPassword 是否匹配
  if (registerForm.password !== registerForm.confirmPassword) {
    // 显示错误消息，告诉用户两次输入的密码不匹配
    ElMessage.error('两次输入的密码不匹配')
    return
  }

  // 如果密码匹配，继续验证表单的其他字段
  registerFormRef.value.validate((valid) => {
    if (valid) {
      // 仅构建包含 username 和 password 的对象
      const register_data = {
        username: registerForm.username,
        password: registerForm.password
      }

      api.registerApi(register_data).then(res => {
        if (res.code === 200) {
          ElMessage.success(res.message)
        }
      }).catch(error => {
        console.log(error);
      })
    }
  })
}
</script>
  
<style scoped>
/* 去除input的轮廓 */
input {
  outline: none;
}
  
.bigBox {
  height: 100vh;
  overflow-x: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(to right, #f8d57e, #c4e3f3);
}
  
/* 最外层的大盒子 */
.box {
  width: 900px;
  height: 550px;
  display: flex;
  position: relative;
  z-index: 2;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}
  
/* 滑动的盒子 */
.pre-box {
  width: 50%;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
  z-index: 99;
  border-radius: 12px 0 0 12px;
  background-color: #f9db9b;
  box-shadow: 4px 0 10px rgba(0, 0, 0, 0.1);
  transition: 0.5s ease-in-out;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
  
/* 滑动盒子的标题 */
.pre-box h1 {
  margin-top: 0;
  text-align: center;
  letter-spacing: 5px;
  color: white;
  user-select: none;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
  font-size: 2.5rem;
  margin-bottom: 10px;
}
  
/* 滑动盒子的文字 */
.pre-box p {
  text-align: center;
  margin: 10px 0 30px;
  user-select: none;
  font-weight: bold;
  color: white;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
  font-size: 1.2rem;
}
  
/* 图片盒子 */
.img-box {
  width: 180px;
  height: 180px;
  margin: 20px auto;
  border-radius: 50%;
  user-select: none;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  border: 4px solid rgba(255, 255, 255, 0.8);
}
  
/* 图片 */
.img-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: 0.5s;
}

.img-box img:hover {
  transform: scale(1.1);
}
  
/* 登录和注册盒子 */
.login-form,
.register-form {
  flex: 1;
  height: 100%;
  padding: 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.9);
}
  
/* 标题盒子 */
.title-box {
  margin-bottom: 30px;
  text-align: center;
}
  
/* 标题 */
.title-box h1 {
  color: #333;
  user-select: none;
  letter-spacing: 2px;
  font-size: 2rem;
  margin: 0;
}
  
/* 表单样式 */
.el-form {
  width: 100%;
  max-width: 350px;
  margin: 0 auto;
}

.el-form-item {
  margin-bottom: 20px;
}

/* 输入框样式 */
:deep(.el-input__wrapper) {
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  padding: 0 15px;
}

:deep(.el-input__inner) {
  height: 42px;
}

/* 密码图标样式 */
.password-icon {
  cursor: pointer;
  font-size: 18px;
  color: #606266;
  margin-right: 5px;
}

.password-icon:hover {
  color: #409EFF;
}

/* 按钮样式 */
.submit-btn {
  width: 100%;
  height: 42px;
  font-size: 16px;
  border-radius: 8px;
  background-color: #409EFF;
  border: none;
  transition: all 0.3s;
}

.submit-btn:hover {
  background-color: #66b1ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
}

/* 切换登录/注册链接样式 */
.switch-box {
  text-align: center;
  margin-top: 20px;
}

.switch-box p {
  color: #606266;
  font-size: 14px;
  cursor: pointer;
}

.highlight {
  color: #409EFF;
  font-weight: bold;
}

.switch-box p:hover .highlight {
  text-decoration: underline;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .box {
    width: 90%;
    height: auto;
    min-height: 500px;
  }
  
  .pre-box {
    display: none;
  }
  
  .login-form,
  .register-form {
    width: 100%;
  }
}
</style>