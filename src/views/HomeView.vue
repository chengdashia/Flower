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
      <component 
        v-if="currentComponent && currentComponent !== 'home'" 
        :is="currentComponent"
      />
      
      <!-- 主页内容，当未选择其他功能模块时显示 -->
      <div v-else>

        
        <!-- 使用提取出的菊花性状识别组件 -->
        <JuhuaTrait />
      </div>
    </template>
  </MainLayout>
</template>

<script setup>
import { ref, reactive, markRaw, defineAsyncComponent } from 'vue'
import { StarFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import { useRouter, useRoute } from 'vue-router'
import MainLayout from '@/components/layout/MainLayout.vue'
import HeaderBar from '@/components/layout/HeaderBar.vue'
import SideMenu from '@/components/layout/SideMenu.vue'
import ImageUploader from '@/components/common/ImageUploader.vue'
import BarChart from '@/components/charts/BarChart.vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, GridComponent, LegendComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import JuhuaTrait from '@/views/JuhuaTrait.vue'
import CornTrait from '@/views/CornTrait.vue'
// 导入功能模块组件
const JuhuaStats = defineAsyncComponent(() => import('@/views/JuhuaStats.vue'))

// 注册必要的组件
use([CanvasRenderer, PieChart, TitleComponent, TooltipComponent, GridComponent, LegendComponent])

const router = useRouter()
const route = useRoute()

// 当前显示的组件
const currentComponent = ref(null)

// 用户信息
const username = ref('用户')

// 自定义菜单配置，点击菜单项时切换组件而不是跳转路由
const menuItems = [
  {
    title: '识别功能',
    icon: 'Aim',
    children: [
      { index: '1-1', title: '菊花形状识别', action: () => currentComponent.value = null },
      { index: '1-2', title: '菊花形状统计', action: () => currentComponent.value = markRaw(JuhuaStats) },
      { index: '1-3', title: '玉米形状识别', action: () => currentComponent.value = markRaw(CornTrait) },
    ]
  },
  {
    title: '统计中心',
    icon: 'Menu',
    children: [
      { index: '2-1', title: '识别历史', action: () => ElMessage.info('标准比对功能正在开发中') },
      { index: '2-2', title: '个人中心', action: () => ElMessage.info('个人查询功能正在开发中') },
    ]
  }
];

// 处理头部命令
const handleHeaderCommand = (command) => {
  if (command === 'logout') {
    // 处理登出逻辑
    window.sessionStorage.removeItem('token')
    router.push('/login')
  } else if (command === 'myProfile') {
    // 处理个人资料逻辑
  }
}

// 状态变量
const statusMessage = ref('')
const resultHtml = ref('')
const probabilities = ref(null)
const predictions = ref(null)
const chartCategories = ref([])
const chartData = ref([])
const pieChartOptions = ref([])
const tableData_large3_most = ref([
  {
    type: 'medium brown green',
    grade: '146C',
    frequency: '3',
  }
])

// 处理上传成功
const handleUploadSuccess = (file) => {
  // 处理上传成功的逻辑
}

// 解析概率数据
const parseProbabilities = (probabilities) => {
  console.log('原始概率数据:', probabilities);
  
  // 创建饼图选项数组
  const options = [];
  
  // 遍历每个性状
  Object.entries(probabilities).forEach(([traitKey, traitData], index) => {
    // 获取trait对象中的数据
    const traitProbs = traitData.trait;
    
    // 将概率数据转换为饼图数据点
    const dataPoints = Object.entries(traitProbs).map(([className, probability]) => {
      return {
        name: className,
        value: parseFloat((probability * 100).toFixed(2))
      };
    });
    
    console.log(`${traitKey}的数据点:`, dataPoints);
    
    // 创建饼图配置
    options.push({
      title: { 
        text: traitKey, 
        left: 'center',
        textStyle: {
          fontWeight: 'normal',
          fontSize: 16
        }
      },
      tooltip: { 
        trigger: 'item',
        formatter: '{b}: {c}%' 
      },
      legend: { 
        orient: 'vertical', 
        left: 'left',
        data: dataPoints.map(item => item.name)
      },
      series: [
        {
          name: '概率',
          type: 'pie',
          radius: '60%',
          center: ['50%', '60%'],
          data: dataPoints,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          label: {
            show: true,
            formatter: '{b}: {d}%'
          }
        }
      ]
    });
  });
  
  return options;
};

// 分析图片
const analyze = async (formData) => {
  if (!formData) {
    ElMessage.error('请先上传一张图片')
    return
  }
  
  statusMessage.value = '开始识别，请稍候...'
  
  try {
    const response = await axios.post(
      'http://134.175.18.239:5000/flower_identify/image',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    
    const result = response.data
    
    if (result.code === 200) {
      statusMessage.value = '识别完成!'
      
      // 处理识别结果
      predictions.value = result.result.predictions
      probabilities.value = result.result.probabilities
      
      if (predictions.value) {
        resultHtml.value = generateResultHtml(predictions.value, result.msg)
        
        // 更新图表数据
        const traits = Object.keys(predictions.value)
        chartCategories.value = traits.map(trait => predictions.value[trait].trait.max_class)
        chartData.value = traits.map(trait => parseFloat((predictions.value[trait].trait.max_prob * 100).toFixed(2)))
        
        // 解析并设置饼图数据
        if (probabilities.value) {
          console.log('原始概率数据结构:', probabilities.value);
          
          // 直接传递整个probabilities对象
          pieChartOptions.value = parseProbabilities(probabilities.value);
          console.log('处理后的饼图配置:', pieChartOptions.value);
        }
      } else {
        ElMessage.error('预测结果为空')
      }
    } else {
      statusMessage.value = '识别失败!'
      ElMessage.error(`识别请求失败: ${error.message}`)
    }
  } catch (error) {
    console.error('识别请求失败:', error)
    statusMessage.value = '识别失败!'
    ElMessage.error(`识别请求失败: ${error.message}`)
  }
}

// 生成结果 HTML
const generateResultHtml = (preds, msg) => {
  let html = ''
  html += `<h1>最终评级结果:</h1><p>${msg || '未知'}</p>`
  html += '<h4>预测结果：</h4>'
  
  Object.entries(preds).forEach(([traitKey, predObj]) => {
    const trait = predObj.trait
    html += `<p>${traitKey} - 类别: ${trait.max_class || '未知'}, 可能性: ${(trait.max_prob * 100).toFixed(2)}%</p>`
  })
  
  return html
}

// 跳转到历史记录
const goToHistory = () => {
  window.location.href = '/user_history'
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