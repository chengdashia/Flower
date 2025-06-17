<template>
  <el-container class="layout-container-demo" style="height: 100vh">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? '64px' : '200px'" class="side-aside">
      <!-- 系统标题/Logo区域 -->
      <div class="logo-area">
        <span v-if="!isCollapse" class="logo-title">花卉识别系统</span>
        <el-icon v-else class="logo-icon"><Menu /></el-icon>
      </div>
      <!-- 菜单 -->
      <SideMenu :menuItems="menuItems" :collapse="isCollapse" />
    </el-aside>
    
    <el-container>
      <!-- 头部 -->
      <el-header class="header-bar-area">
        <div class="header-collapse-btn">
          <el-button @click="toggleCollapse" size="large" class="collapse-btn" :title="isCollapse ? '展开菜单' : '折叠菜单'">
            <el-icon><Expand v-if="isCollapse" /><Fold v-else /></el-icon>
          </el-button>
        </div>
        <slot name="header"></slot>
      </el-header>
      
      <!-- 主内容区 -->
      <el-main>
        <slot name="main"></slot>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ref } from 'vue'
import SideMenu from './SideMenu.vue'
import { Menu, Fold, Expand } from '@element-plus/icons-vue'

const router = useRouter()
const username = ref('Tom') // 这里可以从store或其他地方获取用户名
const isCollapse = ref(false)

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}

// 假设菜单数据由父组件传递或在此定义
const menuItems = []

const navigateTo = (routeName) => {
  router.push({ name: routeName })
}

const handleCommand = (command) => {
  if (command === 'logout') {
    // 处理登出逻辑
    window.sessionStorage.removeItem('token')
    router.push('/login')
  } else if (command === 'myProfile') {
    // 处理个人资料逻辑
  }
}
</script>

<style scoped>
.layout-container-demo .el-header {
  position: relative;
  background-color: #F5F7FA;
  color: var(--el-text-color-primary);
  display: flex;
  align-items: center;
  height: 64px;
  padding: 0 24px 0 0;
}
.header-bar-area {
  display: flex;
  align-items: center;
  height: 64px;
  background: #F5F7FA;
  border-bottom: 1px solid #ebeef5;
  position: relative;
}
.header-collapse-btn {
  display: flex;
  align-items: center;
  height: 64px;
  margin-left: 16px;
}
.collapse-btn {
  margin: 0 8px 0 0;
  font-size: 20px;
  background: transparent;
  border: none;
  box-shadow: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}
.collapse-btn:hover {
  background: #f5f7fa;
}
.layout-container-demo .el-aside.side-aside {
  color: var(--el-text-color-primary);
  background: #F5F7FA;
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 0;
  border-right: 1px solid #ebeef5;
  transition: width 0.3s cubic-bezier(.4,0,.2,1);
}
.logo-area {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 800;
  color: #409EFF;
  letter-spacing: 2px;
  border-bottom: 1px solid #ebeef5;
  background: #fff;
  padding: 0;
  margin: 0;
}
.logo-icon {
  font-size: 28px;
  color: #409EFF;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 64px;
  width: 64px;
}
.layout-container-demo .el-menu {
  border-right: none;
}
.layout-container-demo .el-main {
  padding: 20px;
}
.layout-container-demo .toolbar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  right: 20px;
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  width: 100%;
}

.spacer {
  width: 200px;
}

.title {
  flex-grow: 1;
  text-align: center;
  margin: 0;
  color: #565656;
}

.toolbar {
  width: 200px;
  display: flex;
  justify-content: flex-end;
}

.dropdown {
  display: flex;
  align-items: center;
}
.icon-large {
  font-size: 20px;
  margin-right: 5px;
}
.user-info {
  display: flex;
  align-items: center;
}
.username {
  font-size: 18px;
  margin-left: 5px;
  font-weight: bold;
}

.logo-title {
  height: 64px;
  display: flex;
  align-items: center;
  font-size: 22px;
  font-weight: 800;
  color: #409EFF;
  letter-spacing: 2px;
  padding: 0;
  margin: 0;
}
</style>