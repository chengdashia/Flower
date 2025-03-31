<template>
  <div class="history-container">
    <h2 class="section-title">识别历史记录</h2>
    
    <!-- 筛选和搜索区域 -->
    <div class="filter-container">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-select v-model="filterType" placeholder="识别类型" clearable>
            <el-option label="菊花识别" value="juhua" />
            <el-option label="玉米识别" value="corn" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-col>
        <el-col :span="6">
          <el-input v-model="searchKeyword" placeholder="搜索关键词" clearable>
            <template #prefix>
              <el-icon><search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="6" class="filter-buttons">
          <el-button type="primary" @click="searchRecords">搜索</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-col>
      </el-row>
    </div>
    
    <!-- 历史记录列表 -->
    <div class="history-list">
      <el-empty v-if="historyRecords.length === 0" description="暂无识别记录" />
      
      <el-row :gutter="20" v-else>
        <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="(record, index) in historyRecords" :key="index">
          <el-card class="history-card" :body-style="{ padding: '0px' }">
            <div class="image-container">
              <img :src="record.imageUrl" class="history-image" />
              <div class="image-type-tag" :class="record.type">
                {{ record.type === 'juhua' ? '菊花' : '玉米' }}
              </div>
            </div>
            
            <div class="card-content">
              <div class="record-time">
                <el-icon><calendar /></el-icon>
                <span>{{ record.time }}</span>
              </div>
              
              <h3 class="record-title">识别结果</h3>
              
              <div class="result-items">
                <div v-for="(item, idx) in record.results" :key="idx" class="result-item">
                  <span class="trait-name">{{ item.trait }}:</span>
                  <span class="trait-value">{{ item.value }}</span>
                  <span class="trait-probability">{{ item.probability }}%</span>
                </div>
              </div>
              
              <div class="card-actions">
                <el-button type="primary" size="small" @click="viewDetail(record)">
                  <el-icon><view /></el-icon> 查看详情
                </el-button>
                <el-button type="danger" size="small" @click="confirmDelete(record.id)">
                  <el-icon><delete /></el-icon> 删除
                </el-button>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[12, 24, 36, 48]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalRecords"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
    
    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="识别详情"
      width="70%"
      :before-close="handleDialogClose"
    >
      <div class="detail-container" v-if="selectedRecord">
        <el-row :gutter="30">
          <el-col :span="12">
            <div class="detail-image-container">
              <img :src="selectedRecord.imageUrl" class="detail-image" />
            </div>
          </el-col>
          
          <el-col :span="12">
            <div class="detail-info">
              <h3>识别信息</h3>
              <div class="info-item">
                <span class="label">识别类型:</span>
                <span class="value">{{ selectedRecord.type === 'juhua' ? '菊花识别' : '玉米识别' }}</span>
              </div>
              <div class="info-item">
                <span class="label">识别时间:</span>
                <span class="value">{{ selectedRecord.time }}</span>
              </div>
              
              <h3>识别结果</h3>
              <div class="detail-results">
                <div v-for="(item, idx) in selectedRecord.results" :key="idx" class="detail-result-item">
                  <div class="trait-header">
                    <span class="trait-name">{{ item.trait }}</span>
                    <span class="trait-probability">可能性: {{ item.probability }}%</span>
                  </div>
                  <div class="trait-value">{{ item.value }}</div>
                </div>
              </div>
              
              <!-- 饼图展示概率分布 -->
              <div class="chart-container" v-if="pieChartOptions.length > 0">
                <h3>概率分布</h3>
                <v-chart 
                  v-for="(option, idx) in pieChartOptions" 
                  :key="idx" 
                  :option="option" 
                  :autoresize="true"
                  style="width: 100%; height: 300px; margin-bottom: 20px;"
                />
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-dialog>
    
    <!-- 删除确认对话框 -->
    <el-dialog
      v-model="deleteDialogVisible"
      title="确认删除"
      width="30%"
    >
      <span>确定要删除这条识别记录吗？此操作不可恢复。</span>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deleteDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="deleteRecord">确认删除</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { Search, Calendar, View, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import VChart from 'vue-echarts'

// 注册必要的组件
use([CanvasRenderer, PieChart, TitleComponent, TooltipComponent, LegendComponent])

// 筛选条件
const filterType = ref('')
const dateRange = ref('')
const searchKeyword = ref('')

// 分页
const currentPage = ref(1)
const pageSize = ref(12)
const totalRecords = ref(0)

// 对话框控制
const detailDialogVisible = ref(false)
const deleteDialogVisible = ref(false)
const selectedRecord = ref(null)
const recordToDeleteId = ref(null)

// 饼图配置
const pieChartOptions = ref([])

// 模拟历史记录数据
const allHistoryRecords = reactive([
  {
    id: 1,
    type: 'juhua',
    imageUrl: 'https://img.zcool.cn/community/01a0b45af3f64ca801216045469c7f.jpg@1280w_1l_2o_100sh.jpg',
    time: '2023-05-15 14:30:25',
    results: [
      { trait: '性状1', value: '类型A', probability: 95.8 },
      { trait: '性状2', value: '类型B', probability: 87.3 }
    ],
    probabilities: {
      '性状1': {
        trait: {
          '类型A': 0.958,
          '类型C': 0.032,
          '类型D': 0.01
        }
      },
      '性状2': {
        trait: {
          '类型B': 0.873,
          '类型E': 0.127
        }
      }
    }
  },
  {
    id: 2,
    type: 'corn',
    imageUrl: 'https://img.zcool.cn/community/01f1c65c2a3a1da801203d22704a44.jpg@1280w_1l_2o_100sh.jpg',
    time: '2023-05-10 09:45:12',
    results: [
      { trait: '颜色', value: '黄色', probability: 92.1 },
      { trait: '形状', value: '椭圆形', probability: 88.5 }
    ],
    probabilities: {
      '颜色': {
        trait: {
          '黄色': 0.921,
          '白色': 0.079
        }
      },
      '形状': {
        trait: {
          '椭圆形': 0.885,
          '圆形': 0.115
        }
      }
    }
  },
  {
    id: 3,
    type: 'juhua',
    imageUrl: 'https://img.zcool.cn/community/01f9c05c2a3a1da801203d2272a3f9.jpg@1280w_1l_2o_100sh.jpg',
    time: '2023-05-05 16:20:38',
    results: [
      { trait: '性状1', value: '类型B', probability: 89.2 },
      { trait: '性状2', value: '类型C', probability: 76.5 }
    ],
    probabilities: {
      '性状1': {
        trait: {
          '类型B': 0.892,
          '类型A': 0.108
        }
      },
      '性状2': {
        trait: {
          '类型C': 0.765,
          '类型D': 0.235
        }
      }
    }
  }
])

// 过滤后的历史记录
const historyRecords = computed(() => {
  // 在实际应用中，这里应该是从API获取数据
  // 这里仅做模拟展示
  return allHistoryRecords
})

// 获取历史记录
const fetchHistoryRecords = async () => {
  try {
    // 这里应该调用API获取历史记录
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 更新总记录数
    totalRecords.value = allHistoryRecords.length
    
    ElMessage.success('历史记录获取成功')
  } catch (error) {
    console.error('获取历史记录失败:', error)
    ElMessage.error('获取历史记录失败')
  }
}

// 搜索记录
const searchRecords = () => {
  // 重置页码
  currentPage.value = 1
  
  // 调用获取记录的方法，传入筛选条件
  fetchHistoryRecords()
}

// 重置筛选条件
const resetFilters = () => {
  filterType.value = ''
  dateRange.value = ''
  searchKeyword.value = ''
  
  // 重新获取记录
  searchRecords()
}

// 查看详情
const viewDetail = (record) => {
  selectedRecord.value = record
  detailDialogVisible.value = true
  
  // 生成饼图配置
  generatePieChartOptions(record.probabilities)
}

// 生成饼图配置
const generatePieChartOptions = (probabilities) => {
  if (!probabilities) {
    pieChartOptions.value = []
    return
  }
  
  const options = []
  
  // 遍历每个性状
  Object.entries(probabilities).forEach(([traitKey, traitData]) => {
    // 获取trait对象中的数据
    const traitProbs = traitData.trait
    
    // 将概率数据转换为饼图数据点
    const dataPoints = Object.entries(traitProbs).map(([className, probability]) => {
      return {
        name: className,
        value: parseFloat((probability * 100).toFixed(2))
      }
    })
    
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
    })
  })
  
  pieChartOptions.value = options
}

// 确认删除
const confirmDelete = (id) => {
  recordToDeleteId.value = id
  deleteDialogVisible.value = true
}

// 删除记录
const deleteRecord = async () => {
  try {
    // 这里应该调用API删除记录
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 从本地数组中移除记录
    const index = allHistoryRecords.findIndex(record => record.id === recordToDeleteId.value)
    if (index !== -1) {
      allHistoryRecords.splice(index, 1)
    }
    
    // 更新总记录数
    totalRecords.value = allHistoryRecords.length
    
    ElMessage.success('记录删除成功')
    deleteDialogVisible.value = false
  } catch (error) {
    console.error('删除记录失败:', error)
    ElMessage.error('删除记录失败')
  }
}

// 处理对话框关闭
const handleDialogClose = () => {
  detailDialogVisible.value = false
  selectedRecord.value = null
  pieChartOptions.value = []
}

// 处理页码变化
const handleCurrentChange = (page) => {
  currentPage.value = page
  fetchHistoryRecords()
}

// 处理每页条数变化
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  fetchHistoryRecords()
}

// 页面加载时获取历史记录
onMounted(() => {
  fetchHistoryRecords()
})
</script>

<style scoped>
.history-container {
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

.filter-container {
  background-color: #f5f7fa;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.filter-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.history-list {
  margin-top: 20px;
}

.history-card {
  margin-bottom: 20px;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.history-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.image-container {
  position: relative;
  height: 180px;
  overflow: hidden;
}

.history-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.history-card:hover .history-image {
  transform: scale(1.05);
}

.image-type-tag {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 4px 8px;
  border-radius: 4px;
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.image-type-tag.juhua {
  background-color: #409EFF;
}

.image-type-tag.corn {
  background-color: #67C23A;
}

.card-content {
  padding: 15px;
}

.record-time {
  display: flex;
  align-items: center;
  color: #909399;
  font-size: 14px;
  margin-bottom: 10px;
}

.record-time .el-icon {
  margin-right: 5px;
}

.record-title {
  font-size: 16px;
  color: #303133;
  margin: 10px 0;
  font-weight: 600;
}

.result-items {
  margin-bottom: 15px;
}

.result-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  font-size: 14px;
}

.trait-name {
  color: #606266;
  flex: 1;
}

.trait-value {
  color: #303133;
  font-weight: 500;
  flex: 1;
}

.trait-probability {
  color: #409EFF;
  font-weight: 500;
}

.card-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 15px;
}

.pagination-container {
  margin-top: 30px;
  display: flex;
  justify-content: center;
}

/* 详情对话框样式 */
.detail-container {
  padding: 20px;
}

.detail-image-container {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.detail-image {
  width: 100%;
  height: auto;
  display: block;
}

.detail-info {
  padding: 0 20px;
}

.detail-info h3 {
  font-size: 20px;
  color: #303133;
  margin: 20px 0 15px;
  font-weight: 600;
  position: relative;
  padding-bottom: 10px;
}

.detail-info h3::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 50px;
  height: 3px;
  background: linear-gradient(90deg, #409EFF, #79bbff);
  border-radius: 3px;
}

.info-item {
  display: flex;
  margin-bottom: 10px;
  font-size: 16px;
}

.info-item .label {
  color: #606266;
  width: 100px;
}

.info-item .value {
  color: #303133;
  font-weight: 500;
}

.detail-results {
  margin-bottom: 20px;
}

.detail-result-item {
  background-color: #f5f7fa;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
}

.trait-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.trait-header .trait-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.trait-header .trait-probability {
  font-size: 14px;
  color: #409EFF;
}

.detail-result-item .trait-value {
  font-size: 18px;
  color: #303133;
  font-weight: 500;
}

.chart-container {
  margin-top: 30px;
}

/* 对话框样式 */
:deep(.el-dialog) {
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(64, 158, 255, 0.1);
}

:deep(.el-dialog__header) {
  background-color: #f0f7ff;
  padding: 20px 30px;
  margin: 0;
  border-bottom: 1px solid #e6effd;
  position: relative;
}

:deep(.el-dialog__title) {
  font-weight: 700;
  color: #303133;
  font-size: 22px;
  letter-spacing: 0.5px;
}

:deep(.el-dialog__body) {
  padding: 30px;
  background-color: #fafcff;
}

:deep(.el-dialog__footer) {
  border-top: 1px solid #e6effd;
  padding: 20px 30px;
  background-color: #f9fbff;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 20px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .filter-buttons {
    margin-top: 10px;
    justify-content: flex-start;
  }
  
  .detail-info {
    padding: 0;
    margin-top: 20px;
  }
}
</style>