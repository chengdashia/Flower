<template>
  <div>
    <el-row :gutter="20">
      <el-col :span="12">
        <div id="app">
          <!-- 上传图片窗口 -->
          <ImageUploader 
            ref="uploader"
            @upload-success="handleUploadSuccess"
            @analyze="analyze"
          />
          <h3><span id="status">{{ statusMessage }}</span></h3>
          <el-button type="success" @click="goToHistory">
            查看识别历史记录
          </el-button>
        </div>
      </el-col>
      <el-col :span="12">
        <div id="app2">
          <!-- 识别显示窗口 -->
          <div id="result">
            <div v-html="resultHtml" />
          </div>
          <BarChart 
            :categories="chartCategories" 
            :data="chartData" 
            title="各种性状的可能性"
            :style="{ width: '600px', height: '350px' }"
          />
        </div>
      </el-col>
    </el-row>

    <el-divider>
      <el-icon><star-filled /></el-icon>
    </el-divider>

    <el-col>
      <div id="app3">
        <v-chart
          v-for="(option, index) in pieChartOptions"
          :key="index"
          :option="option"
          :autoresize="true"
          style="width: 400px; height: 400px; margin: 20px auto;"
        />
      </div>
    </el-col>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { StarFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
// import axios from 'axios'
import ImageUploader from '@/components/common/ImageUploader.vue'
import BarChart from '@/components/charts/BarChart.vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, GridComponent, LegendComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { flowerUpload } from '@/api/modules/flower'

// 注册必要的组件
use([CanvasRenderer, PieChart, TitleComponent, TooltipComponent, GridComponent, LegendComponent])

// 状态变量
const statusMessage = ref('')
const resultHtml = ref('')
const probabilities = ref(null)
const predictions = ref(null)
const chartCategories = ref([])
const chartData = ref([])
const pieChartOptions = ref([])

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
    const result = await flowerUpload(formData)
    
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
      ElMessage.error(`识别请求失败: ${result.msg}`)
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