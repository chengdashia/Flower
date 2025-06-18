<template>
  <div class="juhua-trait-container">
    <el-row :gutter="30">
      <el-col :span="12">
        <div id="app">
          <h2 class="section-title">图片上传</h2>
          <!-- 上传图片窗口 -->
          <ImageFileSelector ref="uploader" @upload-success="handleUploadSuccess" :action="action"
            @image-selected="handleImageSelected" />
          <div class="status-container">
            <h3><span :class="{'success': statusMessage.includes('完成'), 'error': statusMessage.includes('失败')}">{{ statusMessage }}</span></h3>
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
        <div class="image-option-wrapper">
          <h3 class="image-title">正面图片</h3>
          <div class="image-option" :class="{ selected: selectedImage === 'front' }" @click="selectImage('front')">
            <img v-if="frontImageUrl" :src="getFullImageUrl(frontImageUrl)" alt="正面图片" />
            <div v-else class="no-image">无图片</div>
          </div>
        </div>
        <div class="image-option-wrapper">
          <h3 class="image-title">背面图片</h3>
          <div class="image-option" :class="{ selected: selectedImage === 'back' }" @click="selectImage('back')">
            <img v-if="backImageUrl" :src="getFullImageUrl(backImageUrl)" alt="背面图片" />
            <div v-else class="no-image">无图片</div>
          </div>
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
import { ElMessage, ElNotification } from 'element-plus'
import ImageFileSelector from '@/components/common/ImageFileSelector.vue'
import BarChart from '@/components/charts/BarChart.vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, GridComponent, LegendComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { getApiUrl } from '@/utils/env';
import { chrCrop, chrPredict } from '@/api/flower'

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
const frontImageUrl = ref('')
const backImageUrl = ref('')
const selectedImage = ref('')
const uploader = ref(null)

const action = '#' // 不需要直接上传到服务器，由父组件处理

// 获取完整图片URL
const getFullImageUrl = (imagePath) => {
  if (!imagePath) return ''
  if (imagePath.startsWith('http')) return imagePath
  return `${getApiUrl()}${imagePath}`
}

// 处理上传成功
const handleUploadSuccess = async (file) => {
  try {
    statusMessage.value = '正在处理图片...'
    
    // 调用chrCrop接口上传图片文件
    const result = await chrCrop(file)
    
    if (result.code === 200) {
      statusMessage.value = '图片处理完成!'
      
      // 保存返回的图片路径
      frontImageUrl.value = result.data.front_image || ''
      backImageUrl.value = result.data.back_image || ''
      
      // 如果有图片，显示选择弹窗
      if (frontImageUrl.value || backImageUrl.value) {
        dialogVisible.value = true
        // 默认选择第一个有效的图片
        selectedImage.value = frontImageUrl.value ? 'front' : (backImageUrl.value ? 'back' : '')
      }
      
      console.log('弹窗状态:', dialogVisible.value, '前景图:', frontImageUrl.value ? '有' : '无', '背景图:', backImageUrl.value ? '有' : '无')
    } else {
      statusMessage.value = '图片处理失败!'
      ElMessage.error(`图片处理失败: ${result.message || result.msg}`)
    }
  } catch (error) {
    console.error('图片处理失败:', error)
    statusMessage.value = '图片处理失败!'
    ElMessage.error(`图片处理失败: ${error.message}`)
  }
}

// 选择图片
const selectImage = (type) => {
  selectedImage.value = type
}

// 确认图片选择
const confirmImageSelection = async () => {
  if (!selectedImage.value) {
    ElMessage.warning('请选择一张图片')
    return
  }
  
  // 获取选中的图片路径
  const selectedImagePath = selectedImage.value === 'front' ? frontImageUrl.value : backImageUrl.value
  
  if (!selectedImagePath) {
    ElMessage.warning('选中的图片路径无效')
    return
  }
  
  // 调用chrPredict接口进行预测
  await handleImageSelected({
    imagePath: selectedImagePath
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
    statusMessage.value = '正在识别...'
    
    const result = await chrPredict({
      image_path: data.imagePath
    })

    if (result.code === 200) {
      statusMessage.value = '识别完成!'

      // 处理新的响应格式
      const { prediction1, prediction2, probability1, probability2 } = result.data.result
      
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
        
        // 识别完成后，重置ImageFileSelector组件状态，以便下次上传
        if (uploader.value) {
          // 清除文件列表，但保留当前识别结果
          // uploader.value.clearFiles();
          console.log('已重置上传组件状态，准备下一次上传');
        }
        ElNotification({
            title: '提示',
            message: '识别成功',
            type: 'success',
        })

      } else {
        ElNotification({
            title: '提示',
            message: '识别失败',
            type: 'error',
        })
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
  font-size: 24px;
  color: #303133;
  margin-bottom: 25px;
  font-weight: 600;
  position: relative;
  padding-bottom: 12px;
  letter-spacing: 0.5px;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 70px;
  height: 4px;
  background: linear-gradient(90deg, #409EFF, #79bbff);
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(64, 158, 255, 0.2);
}

.text-center {
  text-align: center;
}

.text-center::after {
  left: 50%;
  transform: translateX(-50%);
}

#app {
  border-radius: 16px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  padding: 30px;
  height: 600px;
  text-align: center;
  background-color: #e8f7fa;
  margin-left: 10px;
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

#app:hover {
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.15);
  transform: translateY(-3px);
}

#app2 {
  border-radius: 16px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  padding: 30px;
  text-align: center;
  background-color: #fff5eb;
  margin-right: 10px;
  height: 600px;
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

#app2:hover {
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.15);
  transform: translateY(-3px);
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
  margin-bottom: 10px;
  font-size: 20px;
  line-height: 1.4;
  padding: 10px;
  border-radius: 16px;
  background-color: rgba(255, 255, 255, 0.7);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  min-height: 110px;
  display: flex;
  flex-direction: column;
}

#result h1 {
  font-size: 22px;
  color: #303133;
  margin-bottom: 10px;
  font-weight: 600;
}

#result h4 {
  font-size: 16px;
  color: #606266;
  margin: 10px 0 5px;
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
  height: 280px;
  background-color: rgba(236, 245, 255, 0.5);
  border-radius: 16px;
  margin-top: 25px;
  margin-bottom: 20px; /* 添加底部边距与上传区域保持一致 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  border: 2px dashed #a3cfff;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.empty-result .el-icon {
  font-size: 64px;
  color: #409EFF;
  margin-bottom: 20px;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
  transition: all 0.3s;
  animation: pulse 2s infinite ease-in-out;
}

.empty-result p {
  font-size: 18px;
  color: #606266;
  font-weight: 500;
  margin-bottom: 10px;
}

.empty-result:hover {
  border-color: #409EFF;
  background-color: rgba(236, 245, 255, 0.8);
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(64, 158, 255, 0.2);
}

.empty-result:hover .el-icon {
  transform: scale(1.1);
}

.status-container {
  margin-top: 30px;
  position: relative;
}

#status.success {
  background-color: #f0f9eb;
  color: #67c23a;
  box-shadow: 0 4px 10px rgba(103, 194, 58, 0.15);
  animation: fadeIn 0.5s ease-in-out;
}

#status.error {
  background-color: #fef0f0;
  color: #f56c6c;
  box-shadow: 0 4px 10px rgba(245, 108, 108, 0.15);
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
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
  gap: 40px;
  padding: 20px;
}

.image-option-wrapper {
  width: 45%;
  min-width: 300px;
  text-align: center;
  position: relative;
  margin-bottom: 20px;
}

.image-title {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 20px;
  font-weight: 600;
  position: relative;
  display: inline-block;
  padding: 5px 0;
}

.image-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 25%;
  width: 50%;
  height: 3px;
  background: linear-gradient(90deg, #409EFF, #79bbff);
  border-radius: 3px;
  transition: all 0.3s;
}

.image-option {
  border: 2px solid #ebeef5;
  border-radius: 20px;
  padding: 30px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  background-color: #f9fafc;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
}

.image-option:hover {
  border-color: #409EFF;
  box-shadow: 0 12px 28px rgba(64, 158, 255, 0.2);
  transform: translateY(-5px);
}

.image-option.selected {
  border-color: #409EFF;
  background-color: rgba(64, 158, 255, 0.08);
  box-shadow: 0 12px 32px rgba(64, 158, 255, 0.3);
}



.image-option img {
  max-width: 100%;
  max-height: 350px;
  object-fit: contain;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  transition: all 0.3s;
  border: 3px solid transparent;
}

.image-option.selected img {
  box-shadow: 0 12px 32px rgba(64, 158, 255, 0.25);
  border: 3px solid #409EFF;
  transform: scale(1.03);
}

.no-image {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  color: #909399;
  font-size: 18px;
  border-radius: 16px;
  border: 2px dashed #dcdfe6;
  position: relative;
  overflow: hidden;
}

.no-image::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%);
  pointer-events: none;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 30px;
  gap: 20px;
}

:deep(.dialog-footer .el-button) {
  padding: 12px 24px;
  font-size: 16px;
  border-radius: 10px;
  transition: all 0.3s ease;
  font-weight: 500;
}

:deep(.dialog-footer .el-button:hover) {
  transform: translateY(-3px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
}

:deep(.dialog-footer .el-button--default) {
  background-color: #f5f7fa;
  border-color: #dcdfe6;
  color: #606266;
}

:deep(.dialog-footer .el-button--default:hover) {
  background-color: #e6e8eb;
  border-color: #c0c4cc;
  color: #303133;
}

:deep(.dialog-footer .el-button--primary) {
  background-color: #409EFF;
  border-color: #409EFF;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

:deep(.dialog-footer .el-button--primary:hover) {
  background-color: #66b1ff;
  border-color: #66b1ff;
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.4);
}

:deep(.el-dialog) {
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(64, 158, 255, 0.1);
}

:deep(.el-dialog__close) {
  font-size: 24px !important;
  font-weight: bold;
  color: #606266;
  transition: all 0.3s;
}

:deep(.el-dialog__close:hover) {
  color: #409EFF;
  transform: rotate(90deg);
}

:deep(.el-dialog__header) {
  background-color: #f0f7ff;
  padding: 20px 30px;
  margin: 0;
  border-bottom: 1px solid #e6effd;
  position: relative;
}

:deep(.el-dialog__header)::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 3px;
  background: linear-gradient(90deg, #409EFF, transparent);
}

:deep(.el-dialog__title) {
  font-weight: 700;
  color: #303133;
  font-size: 22px;
  letter-spacing: 0.5px;
  position: relative;
  padding-left: 20px;
}

:deep(.el-dialog__title)::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 24px;
  background: #409EFF;
  border-radius: 2px;
}

:deep(.el-dialog__body) {
  padding: 40px;
  background-color: #fafcff;
}

:deep(.el-dialog__footer) {
  border-top: 1px solid #e6effd;
  padding: 20px 30px;
  background-color: #f9fbff;
}

/* 响应式调整 */
@media (max-width: 1200px) {
  #app, #app2 {
    height: auto;
    min-height: 600px;
  }
  
  .image-option {
    width: 100%;
    margin-bottom: 20px;
  }
  
  .image-selection-container {
    flex-direction: column;
  }
}

/* 添加动画效果 */
@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.05);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0.8;
  }
}

/* 增强上传区域样式 */
:deep(.el-upload-dragger) {
  width: 100%;
  height: 280px;
  border: 2px dashed #a3cfff;
  border-radius: 16px;
  background-color: rgba(236, 245, 255, 0.5);
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-top: 25px; /* 与识别结果区域保持一致的顶部边距 */
  margin-bottom: 20px;
  position: relative;
  overflow: hidden;
}

:deep(.el-upload-dragger:hover) {
  border-color: #409EFF;
  background-color: rgba(236, 245, 255, 0.8);
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(64, 158, 255, 0.2);
}

:deep(.el-upload-dragger:hover .el-icon--upload) {
  transform: scale(1.1);
}

:deep(.el-icon--upload) {
  font-size: 64px;
  color: #409EFF;
  margin-bottom: 20px;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
  transition: all 0.3s;
}

:deep(.el-upload__text) {
  font-size: 18px;
  color: #606266;
  margin-bottom: 10px;
}

:deep(.el-upload__text em) {
  color: #409EFF;
  font-style: normal;
  font-weight: 600;
  text-decoration: underline;
  padding: 0 4px;
}

:deep(.el-upload__tip) {
  font-size: 14px;
  color: #909399;
  background-color: rgba(255, 255, 255, 0.7);
  padding: 6px 12px;
  border-radius: 20px;
  display: inline-block;
  margin-top: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}
</style>@/api/flower