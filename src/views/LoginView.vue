<template>
  <!-- 最外层的大盒子 -->
  <div class="bigBox">
    <!-- 顶部系统名称 -->
    <div class="header-box">
      <h2 class="system-name">花卉识别系统</h2>
    </div>
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
import api from '@/api/user.js'
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
          window.sessionStorage.setItem('token', res.data.id)
          router.push('/')
        }
      }).catch(error => {
        if (error.response && error.response.data) {
          ElMessage.error(error.response.data.message)
        } else {
          ElMessage.error('登录失败，请稍后重试')
        }
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
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  background: linear-gradient(135deg, #f8d57e, #c4e3f3, #a8e6cf);
  background-size: 300% 300%;
  animation: gradientBG 15s ease infinite;
  position: relative;
}

/* 顶部系统名称盒子 */
.header-box {
  width: 100%;
  padding: 30px 0;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  z-index: 10;
}

@keyframes gradientBG {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
  
/* 最外层的大盒子 */
.box {
  width: 900px;
  height: 550px;
  display: flex;
  position: relative;
  z-index: 2;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  backdrop-filter: blur(10px);
  margin-top: 20px;
  transition: all 0.5s ease;
}

.box:hover {
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
  transform: translateY(-5px);
}
  
/* 滑动的盒子 */
.pre-box {
  width: 50%;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
  z-index: 99;
  border-radius: 16px 0 0 16px;
  background-color: #f9db9b;
  box-shadow: 4px 0 15px rgba(0, 0, 0, 0.15);
  transition: 0.6s cubic-bezier(0.68, -0.55, 0.27, 1.55);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
  
/* 系统名称样式 */
.system-name {
  text-align: center;
  color: #2c3e50;
  user-select: none;
  letter-spacing: 3px;
  font-size: 2.6rem;
  background: linear-gradient(120deg, #e6f7ff, #ffffff, #f0f9eb);
  padding: 15px 40px;
  border-radius: 30px;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.15), inset 0 2px 5px rgba(255, 255, 255, 0.8);
  position: relative;
  z-index: 10;
  transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border: none;
  border-left: 5px solid #67c23a;
  border-right: 5px solid #67c23a;
  font-weight: 800;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  backdrop-filter: blur(5px);
}

.system-name::before {
  content: '';
  position: absolute;
  top: -10px;
  left: -30px;
  width: 40px;
  height: 200%;
  background: linear-gradient(to right, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0));
  transform: rotate(25deg);
  filter: blur(3px);
  animation: shimmer 3s infinite ease-in-out;
}

.system-name::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transform: translateX(-100%);
  animation: shine 5s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%) rotate(25deg); }
  100% { transform: translateX(1000%) rotate(25deg); }
}

@keyframes shine {
  0% { transform: translateX(-100%); }
  20%, 100% { transform: translateX(100%); }
}

.system-name:hover {
  transform: translateY(-5px) scale(1.05);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2), inset 0 2px 8px rgba(255, 255, 255, 0.8);
  background: linear-gradient(120deg, #f0f9eb, #ffffff, #e6f7ff);
  letter-spacing: 5px;
  color: #67c23a;
  border-left: 5px solid #409EFF;
  border-right: 5px solid #409EFF;
  text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.15);
}

/* 滑动盒子的标题 */
.pre-box h1 {
  margin-top: 0;
  text-align: center;
  letter-spacing: 6px;
  color: white;
  user-select: none;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2), 0 0 15px rgba(255, 255, 255, 0.5);
  font-size: 3rem;
  margin-bottom: 10px;
  font-weight: 800;
  transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  overflow: hidden;
  padding: 10px 0;
}

.pre-box h1::before {
  content: '';
  position: absolute;
  width: 100%;
  height: 3px;
  bottom: 0;
  left: 0;
  background: linear-gradient(to right, transparent, white, transparent);
  transform: translateX(-100%);
  transition: all 0.5s ease;
}

.pre-box h1::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 3px;
  top: 0;
  right: 0;
  background: linear-gradient(to right, transparent, white, transparent);
  transform: translateX(100%);
  transition: all 0.5s ease;
}

.pre-box h1:hover {
  text-shadow: 3px 3px 8px rgba(0, 0, 0, 0.4), 0 0 30px rgba(255, 255, 255, 0.8);
  transform: scale(1.08);
  letter-spacing: 8px;
}

.pre-box h1:hover::before {
  transform: translateX(0);
}

.pre-box h1:hover::after {
  transform: translateX(0);
}
  
/* 滑动盒子的文字 */
.pre-box p {
  text-align: center;
  margin: 10px 0 30px;
  user-select: none;
  font-weight: bold;
  color: white;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
  font-size: 1.5rem;
  letter-spacing: 3px;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  padding: 8px 15px;
  display: inline-block;
  overflow: hidden;
  border-radius: 30px;
}

.pre-box p::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.1);
  transform: translateX(-100%) rotate(45deg);
  transition: all 0.6s ease;
}

.pre-box p:hover {
  transform: translateY(-5px) scale(1.05);
  text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.4), 0 0 20px rgba(255, 255, 255, 0.6);
  letter-spacing: 4px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.pre-box p:hover::before {
  transform: translateX(100%) rotate(45deg);
}
  
/* 图片盒子 */
.img-box {
  width: 200px;
  height: 200px;
  margin: 20px auto;
  border-radius: 50%;
  user-select: none;
  overflow: hidden;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  border: 5px solid rgba(255, 255, 255, 0.9);
  transition: all 0.5s ease;
}

.img-box:hover {
  transform: scale(1.05) rotate(5deg);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
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
  padding: 50px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.95);
  transition: all 0.3s ease;
}
  
/* 标题盒子 */
.title-box {
  margin-bottom: 35px;
  text-align: center;
}
  
/* 标题 */
.title-box h1 {
  color: #333;
  user-select: none;
  letter-spacing: 3px;
  font-size: 2.2rem;
  margin: 0;
  position: relative;
  display: inline-block;
  padding-bottom: 10px;
  font-weight: 700;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  background: linear-gradient(120deg, #333, #555);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.title-box h1:after {
  content: '';
  position: absolute;
  width: 50%;
  height: 3px;
  background: linear-gradient(to right, #409EFF, #a8e6cf, #f9db9b);
  bottom: 0;
  left: 25%;
  border-radius: 4px;
  transition: all 0.4s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.title-box h1:before {
  content: '';
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #409EFF;
  bottom: -3.5px;
  left: calc(25% - 5px);
  z-index: 1;
  box-shadow: 0 0 10px #409EFF;
  opacity: 0;
  transition: all 0.4s ease;
}

.title-box h1:hover:before {
  opacity: 1;
  animation: moveDot 1.5s infinite alternate ease-in-out;
}

@keyframes moveDot {
  0% { left: calc(25% - 5px); }
  100% { left: calc(75% - 5px); }
}

.title-box h1:hover {
  transform: translateY(-5px) scale(1.03);
  text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.15);
  background: linear-gradient(120deg, #409EFF, #64b5f6);
  background-clip: text;
  -webkit-background-clip: text;
}

.title-box h1:hover:after {
  width: 100%;
  left: 0;
  height: 4px;
  background: linear-gradient(to right, #409EFF, #a8e6cf, #f9db9b, #409EFF);
  background-size: 200% 100%;
  animation: gradientMove 2s infinite linear;
}

@keyframes gradientMove {
  0% { background-position: 0% 0; }
  100% { background-position: 200% 0; }
}
  
/* 表单样式 */
.el-form {
  width: 100%;
  max-width: 350px;
  margin: 0 auto;
}

.el-form-item {
  margin-bottom: 25px;
}

/* 输入框样式 */
:deep(.el-input__wrapper) {
  border-radius: 10px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
  padding: 0 15px;
  transition: all 0.3s ease;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

:deep(.el-input__inner) {
  height: 45px;
  font-size: 15px;
}

/* 密码图标样式 */
.password-icon {
  cursor: pointer;
  font-size: 18px;
  color: #606266;
  margin-right: 5px;
  transition: all 0.3s ease;
}

.password-icon:hover {
  color: #409EFF;
  transform: scale(1.1);
}

/* 按钮样式 */
.submit-btn {
  width: 100%;
  height: 45px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 1px;
  border-radius: 10px;
  background: linear-gradient(to right, #409EFF, #64b5f6);
  border: none;
  transition: all 0.4s ease;
  margin-top: 10px;
}

.submit-btn:hover {
  background: linear-gradient(to right, #64b5f6, #409EFF);
  transform: translateY(-3px);
  box-shadow: 0 7px 15px rgba(64, 158, 255, 0.4);
}

.submit-btn:active {
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(64, 158, 255, 0.4);
}

/* 切换登录/注册链接样式 */
.switch-box {
  text-align: center;
  margin-top: 25px;
}

.switch-box p {
  color: #606266;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.switch-box p:hover {
  transform: translateY(-2px);
}

.highlight {
  color: #409EFF;
  font-weight: bold;
  transition: all 0.3s ease;
}

.switch-box p:hover .highlight {
  text-decoration: underline;
  color: #64b5f6;
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
    padding: 30px;
  }
  
  .header-box {
    padding: 15px 0;
  }
  
  .system-name {
    font-size: 1.8rem;
    padding: 12px 25px;
    border-width: 3px;
  }

  .system-name::before {
    animation-duration: 3s;
  }

  .title-box h1 {
    font-size: 1.8rem;
    padding-bottom: 8px;
  }

  .title-box h1:before {
    width: 8px;
    height: 8px;
    bottom: -2.5px;
  }

  .submit-btn {
    height: 42px;
  }
}

@media (max-width: 480px) {
  .system-name {
    font-size: 1.5rem;
    padding: 10px 20px;
    border-width: 2px;
    letter-spacing: 2px;
  }

  .system-name:hover {
    transform: translateY(-3px) scale(1.01);
    letter-spacing: 2.5px;
  }

  .login-form,
  .register-form {
    padding: 20px;
  }

  .title-box h1 {
    font-size: 1.5rem;
    padding-bottom: 6px;
  }

  .title-box h1:hover {
    transform: translateY(-3px) scale(1.02);
  }

  .title-box h1:before {
    width: 6px;
    height: 6px;
    bottom: -1.5px;
  }

  :deep(.el-input__inner) {
    height: 40px;
  }

  .submit-btn {
    height: 40px;
    font-size: 15px;
  }
}
</style>