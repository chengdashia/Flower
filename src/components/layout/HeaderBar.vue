<template>
  <div class="header-container">
    <div class="spacer"></div>
    
    <h1 class="title">{{ title }}</h1>
    
    <div class="toolbar">
      <el-dropdown class="dropdown" @command="handleCommand">
        <span class="user-info">
          <el-icon class="icon-large">
            <User />
          </el-icon>
          <span class="username">{{ username }}</span>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="myProfile">我的</el-dropdown-item>
            <el-dropdown-item command="logout">退出账号</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { User } from '@element-plus/icons-vue';

defineProps({
  title: {
    type: String,
    default: '花卉识别系统'
  },
  username: {
    type: String,
    default: 'User'
  }
});

const emit = defineEmits(['command']);

function handleCommand(command: string) {
  emit('command', command);
}
</script>

<style scoped>
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
  font-size: 24px;
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