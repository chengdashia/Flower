<template>
  <el-container class="layout-container-demo" style="height: 100vh">
    <!-- 侧边栏 -->
    <el-aside width="200px">
      <slot name="sidebar"></slot>
    </el-aside>
    
    <el-container>
      <!-- 头部 -->
      <el-header>
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
import { Menu as IconMenu, Aim, User } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { ref } from 'vue'

const router = useRouter()
const username = ref('Tom') // 这里可以从store或其他地方获取用户名

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
}
.layout-container-demo .el-aside {
  color: var(--el-text-color-primary);
  background: #F5F7FA;
  height: 100vh;
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
</style>