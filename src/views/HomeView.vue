<template>
  <MainLayout>
    <template #sidebar>
      <SideMenu :menuItems="menuItems" />
    </template>
    
    <template #header>
      <HeaderBar title="花卉识别系统" :username="username" @command="handleHeaderCommand" />
    </template>
    
    <template #main>
      <el-divider>
          <el-icon><star-filled /></el-icon>
        </el-divider>
      <!-- 动态组件区域，根据当前选择的功能模块显示不同内容 -->
       <RouterView />
      <!-- <component 
        v-if="currentComponent && currentComponent !== 'home'" 
        :is="currentComponent"
      />
      <div v-else>
        <JuhuaTrait />
      </div> -->
    </template>
  </MainLayout>
</template>

<script setup>
import { ref, reactive, markRaw, defineAsyncComponent } from 'vue'
import { StarFilled } from '@element-plus/icons-vue'
import { useRouter, useRoute } from 'vue-router'
import MainLayout from '@/components/layout/MainLayout.vue'
import HeaderBar from '@/components/layout/HeaderBar.vue'
import SideMenu from '@/components/layout/SideMenu.vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, GridComponent, LegendComponent } from 'echarts/components'

// 注册必要的组件
use([CanvasRenderer, PieChart, TitleComponent, TooltipComponent, GridComponent, LegendComponent])

const router = useRouter()
const route = useRoute()

// 当前显示的组件
// const currentComponent = ref(null)

// 用户信息
const username = ref('用户')


// 处理头部命令
const handleHeaderCommand = (command) => {
  if (command === 'logout') {
    // 处理登出逻辑
    window.sessionStorage.removeItem('token')
    router.push('/login')
  } else if (command === 'myProfile') {
    // 导航到个人中心页面
    router.push('/user-center')
  }
}

</script>

<style scoped>
#app {
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  padding: 20px;
  height: 600px;
  text-align: center;
  background-color: #dbf2f6;
  margin-left: 10px;
}

#app2 {
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  padding: 20px;
  text-align: center;
  background-color: #fff2e7;
  margin-right: 10px;
  height: 600px;
}

#app3 {
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  padding: 20px;
  text-align: center;
  background-color: #f9fafb;
  margin-right: 10px;
  height: 400px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}

button {
  background-color: #28a745;
  border: none;
  color: white;
  padding: 10px 20px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  margin-top: 10px;
  border-radius: 4px;
  cursor: pointer;
  gap: 20px;
}

button:disabled {
  background-color: #6c757d;
}

#result {
  margin-top: 20px;
  font-size: 18px;
}
</style>