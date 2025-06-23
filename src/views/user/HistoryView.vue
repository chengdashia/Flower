<template>
  <div class="history-container">
    <h2 class="section-title">识别历史记录</h2>
    
    <!-- 筛选和搜索区域 -->
    <div class="filter-container">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-select v-model="filterType" placeholder="识别类型" clearable>
            <el-option label="菊花识别" value="chr" />
            <el-option label="玉米花丝识别" value="filament" />
            <el-option label="玉米籽粒识别" value="corn" />
            <el-option label="玉米叶鞘识别" value="leaf_sheath" />
            <el-option label="玉米识别" value="ym" />
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
                {{ record.typeLabel }}
              </div>
            </div>
            
            <div class="card-content">
              <div class="record-time">
                <el-icon><calendar /></el-icon>
                <span>{{ record.time }}</span>
              </div>
              
              <h3 class="record-title">识别结果</h3>
              <!-- 菊花类型 -->
              <div v-if="record.type === 'chr'" class="result-items">
                <div v-for="(item, idx) in record.results" :key="idx" class="result-item">
                  <span class="trait-name">{{ item.trait }}:</span>
                  <span class="trait-value">{{ item.value }}</span>
                  <span class="trait-probability">{{ item.probability }}%</span>
                </div>
              </div>
              <!-- 花丝/叶鞘类型 -->
              <div v-else-if="record.type === 'filament' || record.type === 'leaf_sheath'" class="result-items result-items-group">
                <div class="result-lab-row">
                  <span class="trait-badge">原始LAB</span>
                  <span class="trait-lab">L: <b>{{ record.rawData.original_lab.L }}</b></span>
                  <span class="trait-lab">A: <b>{{ record.rawData.original_lab.A }}</b></span>
                  <span class="trait-lab">B: <b>{{ record.rawData.original_lab.B }}</b></span>
                </div>
                <div class="result-lab-row">
                  <span class="trait-badge trait-badge-red">红色区域LAB</span>
                  <span class="trait-lab">L: <b>{{ record.rawData.red_region_lab.L }}</b></span>
                  <span class="trait-lab">A: <b>{{ record.rawData.red_region_lab.A }}</b></span>
                  <span class="trait-lab">B: <b>{{ record.rawData.red_region_lab.B }}</b></span>
                </div>
              </div>
              <!-- 玉米籽粒类型 -->
              <div v-else-if="record.type === 'corn'" class="result-items result-items-group">
                <div class="result-lab-row">
                  <span class="trait-badge">平均LAB</span>
                  <span class="trait-lab">L: <b>{{ record.rawData.mean_lab.L }}</b></span>
                  <span class="trait-lab">A: <b>{{ record.rawData.mean_lab.A }}</b></span>
                  <span class="trait-lab">B: <b>{{ record.rawData.mean_lab.B }}</b></span>
                </div>
                <div class="result-lab-row">
                  <span class="trait-badge trait-badge-maxa">最大A值LAB</span>
                  <span class="trait-lab">L: <b>{{ record.rawData.max_a_lab.L }}</b></span>
                  <span class="trait-lab">A: <b>{{ record.rawData.max_a_lab.A }}</b></span>
                  <span class="trait-lab">B: <b>{{ record.rawData.max_a_lab.B }}</b></span>
                </div>
              </div>
              <!-- 玉米整体类型 -->
              <div v-else-if="record.type === 'ym'" class="result-items result-items-group">
                <div class="result-shape-row">
                  <span class="trait-badge trait-badge-shape">形状类型</span>
                  <span class="trait-shape">{{ record.rawData.shape_type }}</span>
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
              <img :src="selectedRecord.imageUrl" class="detail-image" style="cursor:pointer;" @click="openPreview(selectedRecord.imageUrl)" />
            </div>
            
            <!-- Additional images for specific types -->
            <div v-if="['filament', 'leaf_sheath'].includes(selectedRecord.type)" class="additional-images">
              <h4>处理过程图片</h4>
              <el-row :gutter="10">
                <el-col :span="8">
                  <img :src="imageBaseUrl + selectedRecord.rawData.red_region_path" class="additional-image" style="cursor:pointer;" @click="openPreview(imageBaseUrl + selectedRecord.rawData.red_region_path)" />
                  <div class="image-caption">红色区域</div>
                </el-col>
                <el-col :span="8">
                  <img :src="imageBaseUrl + selectedRecord.rawData.white_background_path" class="additional-image" style="cursor:pointer;" @click="openPreview(imageBaseUrl + selectedRecord.rawData.white_background_path)" />
                  <div class="image-caption">白底图</div>
                </el-col>
                <el-col :span="8">
                  <img :src="imageBaseUrl + selectedRecord.rawData.comparison_path" class="additional-image" style="cursor:pointer;" @click="openPreview(imageBaseUrl + selectedRecord.rawData.comparison_path)" />
                  <div class="image-caption">对比图</div>
                </el-col>
              </el-row>
            </div>
            <div v-if="selectedRecord.type === 'corn'" class="additional-images">
              <h4>处理后图片</h4>
              <img :src="imageBaseUrl + selectedRecord.rawData.processed_image_path" class="additional-image" style="cursor:pointer;" @click="openPreview(imageBaseUrl + selectedRecord.rawData.processed_image_path)" />
            </div>
            <div v-if="selectedRecord.type === 'ym'" class="additional-images">
              <h4>分析图片</h4>
              <el-row :gutter="10">
                <el-col :span="8">
                  <img :src="imageBaseUrl + selectedRecord.rawData.overlay_path" class="additional-image" style="cursor:pointer;" @click="openPreview(imageBaseUrl + selectedRecord.rawData.overlay_path)" />
                  <div class="image-caption">覆盖图</div>
                </el-col>
                <el-col :span="8">
                  <img :src="imageBaseUrl + selectedRecord.rawData.mask_path" class="additional-image" style="cursor:pointer;" @click="openPreview(imageBaseUrl + selectedRecord.rawData.mask_path)" />
                  <div class="image-caption">掩码图</div>
                </el-col>
                <el-col :span="8">
                  <img :src="imageBaseUrl + selectedRecord.rawData.analysis_path" class="additional-image" style="cursor:pointer;" @click="openPreview(imageBaseUrl + selectedRecord.rawData.analysis_path)" />
                  <div class="image-caption">分析图</div>
                </el-col>
              </el-row>
            </div>
          </el-col>
          
          <el-col :span="12">
            <div class="detail-info">
              <h3>识别信息</h3>
              <div class="info-item">
                <span class="label">识别类型:</span>
                <span class="value">{{ selectedRecord.typeLabel }}</span>
              </div>
              <div class="info-item">
                <span class="label">识别时间:</span>
                <span class="value">{{ selectedRecord.time }}</span>
              </div>
              
              <div class="copy-btn-row" v-if="selectedRecord.type !== 'chr'">
                <el-button type="primary" size="small" :icon="CopyDocument" @click="copyDetailData">一键复制数据</el-button>
              </div>
              <h3>识别结果</h3>
              <!-- CHR details -->
              <div v-if="selectedRecord.type === 'chr'" class="detail-results card-group">
                <el-row :gutter="20">
                  <el-col :span="12" v-for="(item, idx) in selectedRecord.results" :key="idx">
                    <el-card class="result-card" :body-style="{padding: '18px 20px 12px 20px'}">
                      <div class="result-title">
                        <span class="trait-badge">{{ item.trait }}</span>
                        <span class="trait-probability">{{ item.probability }}%</span>
                      </div>
                      <div class="result-value">{{ item.value }}</div>
                      <el-progress :percentage="item.probability" :color="'#409EFF'" :show-text="false" style="margin-top:10px;"/>
                    </el-card>
                  </el-col>
                </el-row>
              </div>

              <!-- Filament/Leaf Sheath details -->
              <div v-if="['filament', 'leaf_sheath'].includes(selectedRecord.type)" class="detail-results card-group">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-card class="result-card" :body-style="{padding: '18px 20px 12px 20px'}">
                      <div class="result-title">
                        <span class="trait-badge">原始 LAB</span>
                      </div>
                      <div v-for="(value, key) in selectedRecord.rawData.original_lab" :key="'original-'+key" class="lab-bar-row">
                        <span class="lab-label">{{ key }}:</span>
                        <span class="lab-number">{{ value.toFixed(2) }}</span>
                        <el-progress :percentage="getLabBarPercent(key, value)" :color="getLabBarColor(key)" :show-text="false" style="width:60%;margin-left:10px;"/>
                        <span class="lab-desc">{{ getLabChannelDesc(key) }}</span>
                      </div>
                    </el-card>
                  </el-col>
                  <el-col :span="12">
                    <el-card class="result-card" :body-style="{padding: '18px 20px 12px 20px'}">
                      <div class="result-title">
                        <span class="trait-badge">红色区域 LAB</span>
                      </div>
                      <div v-for="(value, key) in selectedRecord.rawData.red_region_lab" :key="'red-'+key" class="lab-bar-row">
                        <span class="lab-label">{{ key }}:</span>
                        <span class="lab-number">{{ value.toFixed(2) }}</span>
                        <el-progress :percentage="getLabBarPercent(key, value)" :color="getLabBarColor(key)" :show-text="false" style="width:60%;margin-left:10px;"/>
                        <span class="lab-desc">{{ getLabChannelDesc(key) }}</span>
                      </div>
                    </el-card>
                  </el-col>
                </el-row>
              </div>

              <!-- Corn details -->
              <div v-if="selectedRecord.type === 'corn'" class="detail-results card-group vertical-group">
                <el-card class="result-card" :body-style="{padding: '18px 20px 12px 20px'}">
                  <div class="result-title">
                    <span class="trait-badge">平均 LAB</span>
                  </div>
                  <div v-for="(value, key) in selectedRecord.rawData.mean_lab" :key="'mean-'+key" class="lab-bar-row">
                    <span class="lab-label">{{ key }}:</span>
                    <span class="lab-number">{{ value.toFixed(2) }}</span>
                    <el-progress :percentage="getLabBarPercent(key, value)" :color="getLabBarColor(key)" :show-text="false" style="width:60%;margin-left:10px;"/>
                    <span class="lab-desc">{{ getLabChannelDesc(key) }}</span>
                  </div>
                </el-card>
                <el-card class="result-card" :body-style="{padding: '18px 20px 12px 20px'}">
                  <div class="result-title">
                    <span class="trait-badge trait-badge-maxa">最大A值 LAB</span>
                  </div>
                  <div v-for="(value, key) in selectedRecord.rawData.max_a_lab" :key="'maxa-'+key" class="lab-bar-row">
                    <span class="lab-label">{{ key }}:</span>
                    <span class="lab-number">{{ value.toFixed(2) }}</span>
                    <el-progress :percentage="getLabBarPercent(key, value)" :color="getLabBarColor(key)" :show-text="false" style="width:60%;margin-left:10px;"/>
                    <span class="lab-desc">{{ getLabChannelDesc(key) }}</span>
                  </div>
                </el-card>
              </div>

              <!-- YM details -->
              <div v-if="selectedRecord.type === 'ym'" class="detail-results card-group vertical-group">
                <el-card class="result-card" :body-style="{padding: '18px 20px 12px 20px'}">
                  <div class="result-title">
                    <span class="trait-badge">形状类型</span>
                  </div>
                  <div class="shape-type-label">{{ selectedRecord.rawData.shape_type }}</div>
                </el-card>
                <el-card class="result-card" :body-style="{padding: '18px 20px 12px 20px'}">
                  <div class="result-title">
                    <span class="trait-badge">比例</span>
                  </div>
                  <div class="ratio-bar-row">
                    <span class="ratio-label">1:3 比例</span>
                    <el-progress :percentage="getRatioPercent(selectedRecord.rawData.ratios.ratio_1_3)" :color="'#e6a23c'" :show-text="false" style="width:60%;margin-left:10px;"/>
                    <span class="ratio-value">{{ selectedRecord.rawData.ratios.ratio_1_3.toFixed(4) }}</span>
                  </div>
                  <div class="ratio-bar-row">
                    <span class="ratio-label">1:5 比例</span>
                    <el-progress :percentage="getRatioPercent(selectedRecord.rawData.ratios.ratio_1_5)" :color="'#f56c6c'" :show-text="false" style="width:60%;margin-left:10px;"/>
                    <span class="ratio-value">{{ selectedRecord.rawData.ratios.ratio_1_5.toFixed(4) }}</span>
                  </div>
                  <div class="ratio-bar-row">
                    <span class="ratio-label">3:5 比例</span>
                    <el-progress :percentage="getRatioPercent(selectedRecord.rawData.ratios.ratio_3_5)" :color="'#67c23a'" :show-text="false" style="width:60%;margin-left:10px;"/>
                    <span class="ratio-value">{{ selectedRecord.rawData.ratios.ratio_3_5.toFixed(4) }}</span>
                  </div>
                </el-card>
                <el-card class="result-card" :body-style="{padding: '18px 20px 12px 20px'}">
                  <div class="result-title">
                    <span class="trait-badge">中线宽度</span>
                  </div>
                  <div class="width-bar-row" v-for="(width, idx) in selectedRecord.rawData.midline_widths" :key="'width-'+idx">
                    <span class="width-label">位置{{ idx+1 }}</span>
                    <el-progress :percentage="getWidthPercent(width, selectedRecord.rawData.midline_widths)" :color="'#409EFF'" :show-text="false" style="width:60%;margin-left:10px;"/>
                    <span class="width-value">{{ width }}</span>
                  </div>
                </el-card>
              </div>
              
              <!-- 饼图展示概率分布 (仅CHR) -->
              <div class="chart-container" v-if="selectedRecord.type === 'chr' && pieChartOptions.length > 0">
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
    
    <ImagePreviewDialog :visible="previewDialogVisible" :imageUrl="previewImageUrl" @update:visible="val => previewDialogVisible = val" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { Search, Calendar, View, Delete, CopyDocument } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { getIdentifyHistory, getHistoryDetail, deleteHistory } from '@/api/history'
import ImagePreviewDialog from '@/components/common/ImagePreviewDialog.vue'

// 注册必要的组件
use([CanvasRenderer, PieChart, TitleComponent, TooltipComponent, LegendComponent])

// API服务器的图片基地址，请根据实际情况修改
const imageBaseUrl = 'http://127.0.0.1:5000'

// 筛选条件
const filterType = ref('chr')
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
const recordToDelete = ref({ id: null, type: null })

const typeLabels = {
  chr: '菊花识别',
  filament: '玉米花丝识别',
  corn: '玉米籽粒识别',
  leaf_sheath: '玉米叶鞘识别',
  ym: '玉米识别',
}

// 饼图配置
const pieChartOptions = ref([])

// 实际历史记录数据
const allHistoryRecords = reactive([])

// 过滤后的历史记录
const historyRecords = computed(() => {
  return allHistoryRecords
})

// 获取历史记录
const fetchHistoryRecords = async () => {
  try {
    // 构建查询参数
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value
    }
    
    // 添加筛选条件
    if (filterType.value) {
      params.type = filterType.value
    }
    
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    
    if (searchKeyword.value) {
      params.keyword = searchKeyword.value
    }
    
    // 调用API获取历史记录
    const response = await getIdentifyHistory(params)
    
    if (response.code === 200) {
      // 清空现有数据
      allHistoryRecords.length = 0
      
      // 处理返回的数据
      response.data.records.forEach(item => {
        // 将API返回的数据转换为组件需要的格式
        const record = {
          id: item.id,
          type: filterType.value,
          typeLabel: typeLabels[filterType.value] || '未知类型',
          time: item.created_time,
          imageUrl: '',
          results: [],
          rawData: item, // 保存原始数据
        }
        
        switch (filterType.value) {
          case 'chr':
            record.imageUrl = `${imageBaseUrl}${item.predicted_image_path}`
            record.results = [
              { trait: '花色分类', value: `类型${item.prediction1}`, probability: parseFloat((item.probability1 * 100).toFixed(1)) },
              { trait: '花型分类', value: `类型${item.prediction2}`, probability: parseFloat((item.probability2 * 100).toFixed(1)) }
            ]
            record.probabilities = {
              '花色分类': { trait: { [`类型${item.prediction1}`]: item.probability1, '其他类型': 1 - item.probability1 } },
              '花型分类': { trait: { [`类型${item.prediction2}`]: item.probability2, '其他类型': 1 - item.probability2 } }
            }
            break
          case 'filament':
          case 'leaf_sheath':
            record.imageUrl = `${imageBaseUrl}${item.upload_path}`
            record.results = [
              { trait: '原始LAB', value: `L:${item.original_lab.L}, A:${item.original_lab.A}, B:${item.original_lab.B}` },
              { trait: '红色区域LAB', value: `L:${item.red_region_lab.L}, A:${item.red_region_lab.A}, B:${item.red_region_lab.B}` }
            ]
            break
          case 'corn':
            record.imageUrl = `${imageBaseUrl}${item.upload_path}`
            record.results = [
              { trait: '平均LAB', value: `L:${item.mean_lab.L}, A:${item.mean_lab.A}, B:${item.mean_lab.B}` },
              { trait: '最大A值LAB', value: `L:${item.max_a_lab.L}, A:${item.max_a_lab.A}, B:${item.max_a_lab.B}` }
            ]
            break
          case 'ym':
            record.imageUrl = `${imageBaseUrl}${item.upload_path}`
            record.results = [
              { trait: '形状类型', value: item.shape_type }
            ]
            break
        }
        
        allHistoryRecords.push(record)
      })
      
      // 更新总记录数
      totalRecords.value = response.data.total
      
      ElMessage.success('历史记录获取成功')
    } else {
      ElMessage.error(response.message || '获取历史记录失败')
    }
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
  filterType.value = 'chr'
  dateRange.value = ''
  searchKeyword.value = ''
  
  // 重新获取记录
  searchRecords()
}

// 查看详情
const viewDetail = async (record) => {
  // 注意：此处的实现假设 getHistoryDetail 接口返回的数据结构
  // 与 getIdentifyHistory 列表中的条目结构一致。
  // 如果详情接口返回的数据结构不同，需要在此处进行适配。
  
  selectedRecord.value = record // 直接使用列表中的数据，包含了rawData
  detailDialogVisible.value = true
  
  // 如果是CHR类型，则生成饼图
  if (record.type === 'chr' && record.probabilities) {
    generatePieChartOptions(record.probabilities)
  } else {
    pieChartOptions.value = []
  }
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
  const rec = allHistoryRecords.find(r => r.id === id)
  if (rec) {
    recordToDelete.value = { id: rec.id, type: rec.type }
    deleteDialogVisible.value = true
  }
}

// 删除记录
const deleteRecord = async () => {
  try {
    // 调用API删除记录，传type和id
    const { id, type } = recordToDelete.value
    const response = await deleteHistory(type, id)
    if (response.code === 200) {
      // 从本地数组中移除记录
      const index = allHistoryRecords.findIndex(record => record.id === id)
      if (index !== -1) {
        allHistoryRecords.splice(index, 1)
      }
      // 更新总记录数
      totalRecords.value = allHistoryRecords.length
      ElMessage.success('记录删除成功')
      deleteDialogVisible.value = false
    } else {
      ElMessage.error(response.message || '删除记录失败')
    }
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

// LAB色条辅助方法
const getLabBarPercent = (channel, value) => {
  if (channel === 'L') return (value / 100) * 100
  // A/B通道范围-128~127，映射到0~100
  return ((value + 128) / 256) * 100
}
const getLabBarColor = (channel) => {
  if (channel === 'L') return '#333333'
  if (channel === 'A') return '#ff5252'
  if (channel === 'B') return '#2196f3'
  return '#409EFF'
}
const getLabChannelDesc = (channel) => {
  if (channel === 'L') return '亮度 (0-100)'
  if (channel === 'A') return '红绿轴 (-128~+127)'
  if (channel === 'B') return '蓝黄轴 (-128~+127)'
  return ''
}

// 比例和宽度条辅助方法
const getRatioPercent = (ratio) => {
  if (!ratio) return 0
  return Math.min(ratio * 100, 100)
}
const getWidthPercent = (width, arr) => {
  if (!arr || arr.length === 0) return 0
  const max = Math.max(...arr)
  return max > 0 ? (width / max) * 100 : 0
}

// 图片预览弹窗
const previewDialogVisible = ref(false)
const previewImageUrl = ref('')
const openPreview = (url) => {
  previewImageUrl.value = url
  previewDialogVisible.value = true
}

// 一键复制数据
const copyDetailData = () => {
  if (!selectedRecord.value) return
  let text = ''
  const rec = selectedRecord.value
  if (rec.type === 'filament' || rec.type === 'leaf_sheath') {
    text += `[${rec.typeLabel}]\n识别时间: ${rec.time}\n\n【原始LAB】\nL: ${rec.rawData.original_lab.L}\nA: ${rec.rawData.original_lab.A}\nB: ${rec.rawData.original_lab.B}\n\n【红色区域LAB】\nL: ${rec.rawData.red_region_lab.L}\nA: ${rec.rawData.red_region_lab.A}\nB: ${rec.rawData.red_region_lab.B}`
  } else if (rec.type === 'corn') {
    text += `[玉米籽粒识别]\n识别时间: ${rec.time}\n\n【平均LAB】\nL: ${rec.rawData.mean_lab.L}\nA: ${rec.rawData.mean_lab.A}\nB: ${rec.rawData.mean_lab.B}\n\n【最大A值LAB】\nL: ${rec.rawData.max_a_lab.L}\nA: ${rec.rawData.max_a_lab.A}\nB: ${rec.rawData.max_a_lab.B}`
  } else if (rec.type === 'ym') {
    text += `[玉米整体分析]\n识别时间: ${rec.time}\n\n形状类型: ${rec.rawData.shape_type}\n\n【比例】\n1/3: ${rec.rawData.ratios.ratio_1_3}\n1/5: ${rec.rawData.ratios.ratio_1_5}\n3/5: ${rec.rawData.ratios.ratio_3_5}\n\n【中线宽度】\n${rec.rawData.midline_widths.map((w,i)=>`位置${i+1}: ${w}`).join('\n')}`
  }
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success('数据复制成功')
  }).catch(() => {
    ElMessage.error('复制失败，请手动复制')
  })
}
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

.image-type-tag.chr {
  background-color: #409EFF;
}

.image-type-tag.corn,
.image-type-tag.filament,
.image-type-tag.leaf_sheath,
.image-type-tag.ym {
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
  flex-shrink: 0;
  padding-left: 10px;
}

.card-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 15px;
  width: 100%;
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
  word-break: break-all;
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

.additional-images {
  margin-top: 20px;
}

.additional-images h4 {
  font-size: 16px;
  margin-bottom: 10px;
  color: #303133;
}

.additional-image {
  width: 100%;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.image-caption {
  text-align: center;
  margin-top: 5px;
  font-size: 14px;
  color: #606266;
}

.card-group {
  margin-bottom: 20px;
}

.result-card {
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(64,158,255,0.08);
  transition: box-shadow 0.3s;
}

.result-card:hover {
  box-shadow: 0 6px 18px rgba(64,158,255,0.18);
}

.result-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.trait-badge {
  background: linear-gradient(90deg, #409EFF, #67C23A);
  color: #fff;
  border-radius: 6px;
  padding: 3px 12px;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 1px;
}

.result-value {
  font-size: 18px;
  color: #303133;
  font-weight: 600;
  margin-bottom: 4px;
}

.lab-bar-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  gap: 6px;
}

.lab-label {
  font-weight: bold;
  color: #303133;
  font-size: 15px;
}

.lab-number {
  font-family: 'Courier New', monospace;
  font-size: 15px;
  color: #409eff;
  font-weight: 600;
  background-color: rgba(64, 158, 255, 0.08);
  padding: 2px 8px;
  border-radius: 4px;
}

.lab-desc {
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
  font-style: italic;
}

.shape-type-label {
  display: inline-block;
  background: linear-gradient(90deg, #409EFF, #e6a23c);
  color: #fff;
  border-radius: 8px;
  padding: 6px 18px;
  font-size: 18px;
  font-weight: 700;
  margin: 10px 0;
  letter-spacing: 1px;
}

.ratio-bar-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  gap: 6px;
}

.ratio-label {
  font-weight: bold;
  color: #e6a23c;
  font-size: 15px;
}

.ratio-value {
  font-family: 'Courier New', monospace;
  font-size: 15px;
  color: #303133;
  font-weight: 600;
  background-color: rgba(230, 162, 60, 0.08);
  padding: 2px 8px;
  border-radius: 4px;
}

.width-bar-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  gap: 6px;
}

.width-label {
  font-weight: bold;
  color: #409EFF;
  font-size: 15px;
}

.width-value {
  font-family: 'Courier New', monospace;
  font-size: 15px;
  color: #409EFF;
  font-weight: 600;
  background-color: rgba(64, 158, 255, 0.08);
  padding: 2px 8px;
  border-radius: 4px;
}

.copy-btn-row {
  margin-bottom: 10px;
  text-align: right;
}

.result-items-group {
  margin-bottom: 10px;
}

.result-lab-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}

.trait-badge {
  background: linear-gradient(90deg, #409EFF, #67C23A);
  color: #fff;
  border-radius: 6px;
  padding: 2px 10px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 1px;
  margin-right: 6px;
}

.trait-badge-red {
  background: linear-gradient(90deg, #f56c6c, #e6a23c);
}

.trait-badge-maxa {
  background: linear-gradient(90deg, #e6a23c, #409EFF);
}

.trait-badge-shape {
  background: linear-gradient(90deg, #67C23A, #409EFF);
}

.trait-lab {
  color: #303133;
  font-size: 13px;
}

.result-shape-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}

.trait-shape {
  font-size: 15px;
  font-weight: 700;
  color: #409EFF;
  background: rgba(64,158,255,0.08);
  border-radius: 6px;
  padding: 2px 12px;
}

.vertical-group {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
</style>