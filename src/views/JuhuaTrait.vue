<template>
  <div class="juhua-trait-container">
    <el-row :gutter="30">
      <el-col :span="12">
        <div id="app">
          <h2 class="section-title">图片上传</h2>
          <!-- 上传图片窗口 -->
          <ImageSelector ref="uploader" @upload-success="handleUploadSuccess" @analyze="analyze" :action="action"
            @image-selected="handleImageSelected" />
          <div class="status-container">
            <h3><span id="status" :class="{'success': statusMessage.includes('完成'), 'error': statusMessage.includes('失败')}">{{ statusMessage }}</span></h3>
          </div>
          <!-- <el-button type="success" @click="goToHistory">
            查看识别历史记录
          </el-button> -->
        </div>
      </el-col>
      <el-col :span="12">
        <div id="app2">
          <h2 class="section-title">识别结果</h2>
          <!-- 识别显示窗口 -->
          <div id="result" v-if="resultHtml">
            <div v-html="resultHtml" />
          </div>
          <div class="empty-result" v-else>
            <el-icon><info-filled /></el-icon>
            <p>请上传图片进行识别</p>
          </div>
          <BarChart v-if="chartData.length > 0" :categories="chartCategories" :data="chartData" title="各种性状的可能性"
            :style="{ width: '100%', height: '350px', marginTop: '20px' }" />
        </div>
      </el-col>
    </el-row>

    <el-divider>
      <el-icon><star-filled /></el-icon>
    </el-divider>

    <div class="pie-charts-section">
      <h2 class="section-title text-center" v-if="pieChartOptions.length > 0">详细概率分布</h2>
      <el-col>
        <div id="app3">
          <v-chart v-for="(option, index) in pieChartOptions" :key="index" :option="option" :autoresize="true"
            style="width: 400px; height: 400px; margin: 20px auto;" />
        </div>
      </el-col>
    </div>
    
    <!-- 图片选择弹窗 - 移到页面中心显示 -->
    <el-dialog
      v-model="dialogVisible"
      title="请选择一张图片"
      width="80%"
      :before-close="handleDialogClose"
    >
      <div class="image-selection-container">
        <div class="image-option" :class="{ selected: selectedImage === 'front' }" @click="selectImage('front')">
          <h3>正面图片</h3>
          <img v-if="frontImage" :src="frontImage" alt="正面图片" />
          <div v-else class="no-image">无图片</div>
        </div>
        <div class="image-option" :class="{ selected: selectedImage === 'back' }" @click="selectImage('back')">
          <h3>背面图片</h3>
          <img v-if="backImage" :src="backImage" alt="背面图片" />
          <div v-else class="no-image">无图片</div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmImageSelection" :disabled="!selectedImage">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { StarFilled, InfoFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import ImageSelector from '@/components/common/ImageSelector.vue'
import BarChart from '@/components/charts/BarChart.vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, GridComponent, LegendComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { juhuaIdentify } from '@/api/modules/flower'

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

// 图片选择弹窗相关变量
const dialogVisible = ref(false)
const frontImage = ref('')
const backImage = ref('')
const selectedImage = ref('')
const uploader = ref(null)

const action = "http://127.0.0.1:5000/chr_identify/crop"

// 处理上传成功
const handleUploadSuccess = (file) => {
  // 从ImageSelector组件获取图片数据
  if (uploader.value) {
    frontImage.value = uploader.value.frontImage
    backImage.value = uploader.value.backImage
    
    // 如果有图片，显示选择弹窗
    if (frontImage.value || backImage.value) {
      dialogVisible.value = true
      // 默认选择第一个有效的图片
      selectedImage.value = frontImage.value ? 'front' : (backImage.value ? 'back' : '')
    }
    console.log('弹窗状态:', dialogVisible.value, '前景图:', frontImage.value ? '有' : '无', '背景图:', backImage.value ? '有' : '无')
  }
}

// 选择图片
const selectImage = (type) => {
  selectedImage.value = type
}

// 确认图片选择
const confirmImageSelection = () => {
  if (!selectedImage.value) {
    ElMessage.warning('请选择一张图片')
    return
  }
  
  // 获取选中的图片数据
  const selectedImageData = selectedImage.value === 'front' ? frontImage.value : backImage.value
  
  // 触发图片选择事件，传递选中的图片数据
  handleImageSelected({
    imageData: selectedImageData
  })
  
  // 关闭弹窗
  dialogVisible.value = false
}

// 处理弹窗关闭
const handleDialogClose = () => {
  dialogVisible.value = false
  selectedImage.value = ''
}

const handleImageSelected = async (data) => {
  try {
    const result = await juhuaIdentify({
      image: data.imageData
    })
    console.log(result)
    if (result.code === 200) {
      statusMessage.value = '识别完成!'

      // 处理新的响应格式
      const { prediction1, prediction2, probability1, probability2 } = result.result
      
      // 创建结构化数据以兼容现有代码
      const formattedPredictions = {
        '性状1': {
          trait: {
            max_class: prediction1,
            max_prob: probability1
          }
        },
        '性状2': {
          trait: {
            max_class: prediction2,
            max_prob: probability2
          }
        }
      }
      
      // 创建概率数据结构
      const formattedProbabilities = {
        '性状1': {
          trait: {
            [prediction1]: probability1
          }
        },
        '性状2': {
          trait: {
            [prediction2]: probability2
          }
        }
      }
      
      predictions.value = formattedPredictions
      probabilities.value = formattedProbabilities

      if (predictions.value) {
        resultHtml.value = generateResultHtml(predictions.value, result.message || '识别成功')

        // 更新图表数据
        chartCategories.value = ['性状1', '性状2']
        chartData.value = [
          parseFloat((probability1 * 100).toFixed(2)),
          parseFloat((probability2 * 100).toFixed(2))
        ]

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
      ElMessage.error(`识别请求失败: ${result.message || result.msg}`)
    }
  } catch (error) {
    console.error('识别请求失败:', error)
    statusMessage.value = '识别失败!'
    ElMessage.error(`识别请求失败: ${error.message}`)
  }
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
    let dataPoints = Object.entries(traitProbs).map(([className, probability]) => {
      return {
        name: className,
        value: parseFloat((probability * 100).toFixed(2))
      };
    });
    
    // 添加"其他可能性"数据点，使饼图显示更有意义
    const mainProbability = dataPoints[0].value;
    dataPoints.push({
      name: '其他可能性',
      value: parseFloat((100 - mainProbability).toFixed(2))
    });

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
.juhua-trait-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.section-title {
  font-size: 22px;
  color: #303133;
  margin-bottom: 20px;
  font-weight: 600;
  position: relative;
  padding-bottom: 10px;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 60px;
  height: 3px;
  background: linear-gradient(90deg, #409EFF, #79bbff);
  border-radius: 3px;
}

.text-center {
  text-align: center;
}

.text-center::after {
  left: 50%;
  transform: translateX(-50%);
}

#app {
  border-radius: 12px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  padding: 25px;
  height: 600px;
  text-align: center;
  background-color: #e8f7fa;
  margin-left: 10px;
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
}

#app:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

#app2 {
  border-radius: 12px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  padding: 25px;
  text-align: center;
  background-color: #fff5eb;
  margin-right: 10px;
  height: 600px;
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
}

#app2:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

#app3 {
  border-radius: 12px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  padding: 30px;
  text-align: center;
  background-color: #fafbfd;
  margin: 20px 10px;
  min-height: 400px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 20px;
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

#app3:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

button {
  background-color: #2ea44f;
  border: none;
  color: white;
  padding: 12px 24px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  margin-top: 15px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

button:hover {
  background-color: #2c974b;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
  box-shadow: none;
}

#result {
  margin-top: 25px;
  font-size: 18px;
  line-height: 1.6;
  padding: 20px;
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.7);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

#result h1 {
  font-size: 24px;
  color: #303133;
  margin-bottom: 15px;
  font-weight: 600;
}

#result h4 {
  font-size: 18px;
  color: #606266;
  margin: 15px 0 10px;
  font-weight: 500;
}

#result p {
  margin: 10px 0;
  color: #606266;
}

.empty-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  margin-top: 25px;
}

.empty-result .el-icon {
  font-size: 48px;
  color: #909399;
  margin-bottom: 15px;
}

.empty-result p {
  font-size: 16px;
  color: #909399;
}

.status-container {
  margin-top: 20px;
}

#status {
  display: inline-block;
  padding: 8px 16px;
  border-radius: 20px;
  background-color: #f5f7fa;
  color: #606266;
  font-weight: 500;
  transition: all 0.3s;
}

#status.success {
  background-color: #f0f9eb;
  color: #67c23a;
}

#status.error {
  background-color: #fef0f0;
  color: #f56c6c;
}

.pie-charts-section {
  margin-top: 20px;
}

.el-divider {
  margin: 40px 0;
}

.el-divider .el-icon {
  background-color: #f0f2f5;
  border-radius: 50%;
  padding: 8px;
  color: #409EFF;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

/* 图片选择弹窗样式 */
.image-selection-container {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  gap: 30px;
  padding: 10px;
}

.image-option {
  width: 45%;
  min-width: 300px;
  border: 2px solid #ebeef5;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s;
  text-align: center;
  background-color: #f9fafc;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.image-option:hover {
  border-color: #409EFF;
  box-shadow: 0 8px 16px rgba(64, 158, 255, 0.2);
  transform: translateY(-3px);
}

.image-option.selected {
  border-color: #409EFF;
  background-color: rgba(64, 158, 255, 0.08);
  box-shadow: 0 8px 20px rgba(64, 158, 255, 0.3);
}

.image-option h3 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
  position: relative;
  display: inline-block;
}

.image-option h3::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 25%;
  width: 50%;
  height: 2px;
  background-color: #dcdfe6;
  transition: all 0.3s;
}

.image-option.selected h3::after {
  background-color: #409EFF;
  width: 70%;
  left: 15%;
}

.image-option img {
  max-width: 100%;
  max-height: 300px;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.image-option.selected img {
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.2);
}

.no-image {
  height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  color: #909399;
  font-size: 16px;
  border-radius: 8px;
  border: 1px dashed #dcdfe6;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  gap: 12px;
}

:deep(.el-dialog) {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
}

:deep(.el-dialog__header) {
  background-color: #f5f7fa;
  padding: 15px 20px;
  margin: 0;
  border-bottom: 1px solid #ebeef5;
}

:deep(.el-dialog__title) {
  font-weight: 600;
  color: #303133;
  font-size: 18px;
}

:deep(.el-dialog__body) {
  padding: 30px;
}

:deep(.el-dialog__footer) {
  border-top: 1px solid #ebeef5;
  padding: 15px 20px;
}

/* 响应式调整 */
@media (max-width: 1200px) {
  #app, #app2 {
    height: auto;
    min-height: 600px;
  }
}
</style>