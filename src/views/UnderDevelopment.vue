<template>
  <div class="under-development-container">
    <el-result
      icon="warning"
      title="功能正在开发中"
      sub-title="该功能目前正在开发中，敬请期待..."
    >
      <template #extra>
        <el-button type="primary" @click="goBack">返回</el-button>
      </template>
    </el-result>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  router.go(-1)
}
</script>

<style scoped>
.under-development-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 20px;
}
</style>