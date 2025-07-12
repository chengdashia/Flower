<template>
  <div class="history-container">
    <h2 class="section-title">识别历史记录</h2>
    
    <!-- 筛选和搜索区域 -->
    <div class="filter-container">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-select v-model="filterType" placeholder="识别类型" clearable>
            <el-option label="菊花" value="chr" />
            <el-option label="玉米花丝" value="corn_filament_nature" />
            <el-option label="玉米花丝原位" value="corn_filament" />
            <el-option label="玉米叶鞘" value="corn_leaf_sheath" />
            <el-option label="玉米形状" value="corn_shape" />
            <el-option label="玉米整体" value="corn_all" />
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
              <div v-else-if="['corn_filament_nature', 'corn_filament', 'corn_leaf_sheath'].includes(record.type)" class="result-items result-items-group">
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
              <!-- 玉米形状类型 -->
              <div v-else-if="record.type === 'corn_shape'" class="result-items result-items-group">
                <div class="result-shape-row">
                  <span class="trait-badge trait-badge-shape">形状类型</span>
                  <span class="trait-shape">{{ record.rawData.shape_type }}</span>
                </div>
              </div>
              <!-- 玉米整体类型 -->
              <div v-else-if="record.type === 'corn_all'" class="result-items result-items-group">
                <div class="result-shape-row">
                  <span class="trait-badge trait-badge-shape">形状类型</span>
                  <span class="trait-shape">{{ record.rawData.shape_type }}</span>
                </div>
                <div class="result-shape-row">
                  <span class="trait-badge trait-badge-confidence">置信度</span>
                  <span class="trait-confidence">{{ ((record.rawData.process_single_image?.confidence || 0) * 100).toFixed(2) }}%</span>
                </div>
                <div class="result-shape-row">
                  <span class="trait-badge trait-badge-width">测量点</span>
                  <span class="trait-width">{{ record.rawData.midline_widths?.length || 0 }} 个</span>
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
            <div v-if="['corn_filament_nature', 'corn_filament', 'corn_leaf_sheath'].includes(selectedRecord.type)" class="additional-images">
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
            <div v-if="['corn_shape', 'corn_all'].includes(selectedRecord.type)" class="additional-images">
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
              <div v-if="['corn_filament_nature', 'corn_filament', 'corn_leaf_sheath'].includes(selectedRecord.type)" class="detail-results card-group">
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

              <!-- Corn Shape details -->
              <div v-if="selectedRecord.type === 'corn_shape'" class="detail-results card-group vertical-group">
                <el-card class="result-card" :body-style="{padding: '18px 20px 12px 20px'}">
                  <div class="result-title">
                    <span class="trait-badge">形状类型</span>
                  </div>
                  <div class="shape-type-label">{{ selectedRecord.rawData.shape_type }}</div>
                </el-card>
              </div>

              <!-- Corn All details -->
              <div v-if="selectedRecord.type === 'corn_all'" class="detail-results card-group vertical-group">
                <!-- 基础信息 -->
                <el-card class="result-card" :body-style="{padding: '18px 20px 12px 20px'}">
                  <div class="result-title">
                    <span class="trait-badge">基础信息</span>
                  </div>
                  <div class="info-grid">
                    <div class="info-item">
                      <span class="info-label">形状类型:</span>
                      <span class="info-value shape-type">{{ selectedRecord.rawData.shape_type }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">测量点数量:</span>
                      <span class="info-value">{{ selectedRecord.rawData.midline_widths?.length || 0 }} 个</span>
                    </div>
                    <div class="info-item" v-if="selectedRecord.rawData.process_single_image?.confidence">
                      <span class="info-label">识别置信度:</span>
                      <span class="info-value confidence">{{ (selectedRecord.rawData.process_single_image.confidence * 100).toFixed(2) }}%</span>
                    </div>
                  </div>
                </el-card>

                <!-- 中线宽度分析 -->
                <el-card class="result-card" :body-style="{padding: '18px 20px 12px 20px'}">
                  <div class="result-title">
                    <span class="trait-badge">中线宽度分析</span>
                  </div>
                  <div class="width-summary">
                    <div class="summary-item">
                      <div class="summary-label">最大宽度</div>
                      <div class="summary-value">{{ Math.max(...selectedRecord.rawData.midline_widths) }} px</div>
                    </div>
                    <div class="summary-item">
                      <div class="summary-label">平均宽度</div>
                      <div class="summary-value">{{ Math.round(selectedRecord.rawData.midline_widths.reduce((a, b) => a + b, 0) / selectedRecord.rawData.midline_widths.length) }} px</div>
                    </div>
                    <div class="summary-item">
                      <div class="summary-label">最小宽度</div>
                      <div class="summary-value">{{ Math.min(...selectedRecord.rawData.midline_widths) }} px</div>
                    </div>
                  </div>
                  <div class="width-chart">
                    <div 
                      v-for="(width, index) in selectedRecord.rawData.midline_widths.slice(0, 8)" 
                      :key="index"
                      class="width-bar"
                    >
                      <div class="bar-label">P{{ index + 1 }}</div>
                      <div class="bar-container">
                        <div 
                          class="bar-fill" 
                          :style="{ width: getWidthPercentage(width) + '%' }"
                        ></div>
                      </div>
                      <span class="bar-value">{{ width }}</span>
                    </div>
                  </div>
                </el-card>

                <!-- 比例数据 -->
                <el-card class="result-card" :body-style="{padding: '18px 20px 12px 20px'}">
                  <div class="result-title">
                    <span class="trait-badge">比例数据</span>
                  </div>
                  <div class="ratio-chart">
                    <div class="ratio-item">
                      <div class="ratio-label">1:3 比例</div>
                      <div class="ratio-progress">
                        <div class="progress-bar">
                          <div 
                            class="progress-fill" 
                            :style="{ width: getRatioPercentage(selectedRecord.rawData.ratios.ratio_1_3) + '%' }"
                          ></div>
                        </div>
                        <span class="ratio-value">{{ selectedRecord.rawData.ratios.ratio_1_3.toFixed(4) }}</span>
                      </div>
                    </div>
                    <div class="ratio-item">
                      <div class="ratio-label">1:5 比例</div>
                      <div class="ratio-progress">
                        <div class="progress-bar">
                          <div 
                            class="progress-fill" 
                            :style="{ width: getRatioPercentage(selectedRecord.rawData.ratios.ratio_1_5) + '%' }"
                          ></div>
                        </div>
                        <span class="ratio-value">{{ selectedRecord.rawData.ratios.ratio_1_5.toFixed(4) }}</span>
                      </div>
                    </div>
                    <div class="ratio-item">
                      <div class="ratio-label">3:5 比例</div>
                      <div class="ratio-progress">
                        <div class="progress-bar">
                          <div 
                            class="progress-fill" 
                            :style="{ width: getRatioPercentage(selectedRecord.rawData.ratios.ratio_3_5) + '%' }"
                          ></div>
                        </div>
                        <span class="ratio-value">{{ selectedRecord.rawData.ratios.ratio_3_5.toFixed(4) }}</span>
                      </div>
                    </div>
                  </div>
                </el-card>

                <!-- LAB色彩分析 -->
                <el-card class="result-card" :body-style="{padding: '18px 20px 12px 20px'}" v-if="selectedRecord.rawData.lab_max || selectedRecord.rawData.lab_mean">
                  <div class="result-title">
                    <span class="trait-badge">LAB色彩分析</span>
                  </div>
                  <el-row :gutter="20">
                    <!-- LAB最大值 -->
                    <el-col :span="12" v-if="selectedRecord.rawData.lab_max">
                      <div class="lab-section">
                        <h4>LAB 最大值</h4>
                        <div v-for="key in ['L','A','B']" :key="'labmax-'+key" class="lab-bar-row">
                          <span class="lab-label">{{ key }}:</span>
                          <span class="lab-number">{{ selectedRecord.rawData.lab_max[key]?.toFixed(2) ?? '--' }}</span>
                          <el-progress :percentage="getLabBarPercent(key, selectedRecord.rawData.lab_max[key])" :color="getLabBarColor(key)" :show-text="false" style="width:60%;margin-left:10px;"/>
                          <span class="lab-desc">{{ getLabChannelDesc(key) }}</span>
                        </div>
                      </div>
                    </el-col>
                    <!-- LAB均值 -->
                    <el-col :span="12" v-if="selectedRecord.rawData.lab_mean">
                      <div class="lab-section">
                        <h4>LAB 均值</h4>
                        <div v-for="key in ['L','A','B']" :key="'labmean-'+key" class="lab-bar-row">
                          <span class="lab-label">{{ key }}:</span>
                          <span class="lab-number">{{ selectedRecord.rawData.lab_mean[key]?.toFixed(2) ?? '--' }}</span>
                          <el-progress :percentage="getLabBarPercent(key, selectedRecord.rawData.lab_mean[key])" :color="getLabBarColor(key)" :show-text="false" style="width:60%;margin-left:10px;"/>
                          <span class="lab-desc">{{ getLabChannelDesc(key) }}</span>
                        </div>
                      </div>
                    </el-col>
                  </el-row>
                </el-card>

                <!-- 分段测量数据 -->
                <el-card class="result-card" :body-style="{padding: '18px 20px 12px 20px'}" v-if="selectedRecord.rawData.zl_lengths && selectedRecord.rawData.zl_lengths.length > 0">
                  <div class="result-title">
                    <span class="trait-badge">分段测量数据</span>
                  </div>
                  <div class="table-container">
                    <el-table 
                      :data="selectedRecord.rawData.zl_lengths" 
                      border 
                      style="width: 100%;" 
                      class="measurement-table"
                      :show-header="true"
                      header-align="center"
                    >
                      <el-table-column prop="pixel_height" label="像素高度" width="120" align="center" header-align="center">
                        <template #default="scope">
                          <span class="table-value">{{ scope.row.pixel_height }} px</span>
                        </template>
                      </el-table-column>
                      <el-table-column prop="pixel_width" label="像素宽度" width="120" align="center" header-align="center">
                        <template #default="scope">
                          <span class="table-value">{{ scope.row.pixel_width }} px</span>
                        </template>
                      </el-table-column>
                      <el-table-column prop="real_height_cm" label="实际高度(cm)" width="140" align="center" header-align="center">
                        <template #default="scope">
                          <span class="table-value">{{ scope.row.real_height_cm }} cm</span>
                        </template>
                      </el-table-column>
                      <el-table-column prop="real_width_cm" label="实际宽度(cm)" width="140" align="center" header-align="center">
                        <template #default="scope">
                          <span class="table-value">{{ scope.row.real_width_cm }} cm</span>
                        </template>
                      </el-table-column>
                    </el-table>
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
const imageBaseUrl = process.env.VUE_APP_API_URL || 'http://127.0.0.1:5000'

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
  chr: '菊花',
  corn_filament_nature: '玉米花丝',
  corn_filament: '玉米花丝原位',
  corn_leaf_sheath: '玉米叶鞘',
  corn_shape: '玉米形状',
  corn_all: '玉米整体',
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
          case 'corn_filament_nature':
          case 'corn_filament':
          case 'corn_leaf_sheath':
            record.imageUrl = `${imageBaseUrl}${item.upload_path}`
            record.results = [
              { trait: '原始LAB', value: `L:${item.original_lab.L}, A:${item.original_lab.A}, B:${item.original_lab.B}` },
              { trait: '红色区域LAB', value: `L:${item.red_region_lab.L}, A:${item.red_region_lab.A}, B:${item.red_region_lab.B}` }
            ]
            break
          case 'corn_shape':
            record.imageUrl = `${imageBaseUrl}${item.upload_path}`
            record.results = [
              { trait: '形状类型', value: item.shape_type }
            ]
            break
          case 'corn_all':
            record.imageUrl = `${imageBaseUrl}${item.upload_path}`
            record.results = [
              { trait: '形状类型', value: item.shape_type },
              { trait: '测量点数量', value: `${item.midline_widths?.length || 0} 个` },
              { trait: '置信度', value: `${((item.process_single_image?.confidence || 0) * 100).toFixed(2)}%` }
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

// 获取宽度百分比 (用于corn_all)
const getWidthPercentage = (width) => {
  if (!selectedRecord.value?.rawData?.midline_widths) return 0
  const maxWidth = Math.max(...selectedRecord.value.rawData.midline_widths)
  return maxWidth > 0 ? (width / maxWidth) * 100 : 0
}

// 获取比例百分比 (用于corn_all)
const getRatioPercentage = (ratio) => {
  if (!selectedRecord.value?.rawData?.ratios) return 0
  const ratios = selectedRecord.value.rawData.ratios
  const maxRatio = Math.max(ratios.ratio_1_3, ratios.ratio_1_5, ratios.ratio_3_5)
  return maxRatio > 0 ? (ratio / maxRatio) * 100 : 0
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
  if (['corn_filament_nature', 'corn_filament', 'corn_leaf_sheath'].includes(rec.type)) {
    text += `[${rec.typeLabel}]\n识别时间: ${rec.time}\n\n【原始LAB】\nL: ${rec.rawData.original_lab.L}\nA: ${rec.rawData.original_lab.A}\nB: ${rec.rawData.original_lab.B}\n\n【红色区域LAB】\nL: ${rec.rawData.red_region_lab.L}\nA: ${rec.rawData.red_region_lab.A}\nB: ${rec.rawData.red_region_lab.B}`
  } else if (rec.type === 'corn_shape') {
    text += `[玉米形状分析]\n识别时间: ${rec.time}\n\n形状类型: ${rec.rawData.shape_type}`
  } else if (rec.type === 'corn_all') {
    text += `[玉米整体分析]\n识别时间: ${rec.time}\n\n形状类型: ${rec.rawData.shape_type}\n测量点数量: ${rec.rawData.midline_widths?.length || 0} 个\n`
    
    if (rec.rawData.process_single_image?.confidence) {
      text += `识别置信度: ${(rec.rawData.process_single_image.confidence * 100).toFixed(2)}%\n`
    }
    
    text += `\n【比例】\n1/3: ${rec.rawData.ratios.ratio_1_3.toFixed(4)}\n1/5: ${rec.rawData.ratios.ratio_1_5.toFixed(4)}\n3/5: ${rec.rawData.ratios.ratio_3_5.toFixed(4)}\n\n【中线宽度】\n${rec.rawData.midline_widths.map((w,i)=>`位置${i+1}: ${w}`).join('\n')}`
    
    if (rec.rawData.lab_max) {
      text += `\n\n【LAB最大值】\nL: ${rec.rawData.lab_max.L?.toFixed(2) ?? '--'}\nA: ${rec.rawData.lab_max.A?.toFixed(2) ?? '--'}\nB: ${rec.rawData.lab_max.B?.toFixed(2) ?? '--'}`
    }
    
    if (rec.rawData.lab_mean) {
      text += `\n\n【LAB均值】\nL: ${rec.rawData.lab_mean.L?.toFixed(2) ?? '--'}\nA: ${rec.rawData.lab_mean.A?.toFixed(2) ?? '--'}\nB: ${rec.rawData.lab_mean.B?.toFixed(2) ?? '--'}`
    }
    
    if (rec.rawData.zl_lengths && rec.rawData.zl_lengths.length > 0) {
      text += `\n\n【分段测量数据】\n${rec.rawData.zl_lengths.map((item, idx) => `段落${idx+1}: 像素高${item.pixel_height}, 像素宽${item.pixel_width}, 实际高${item.real_height_cm}cm, 实际宽${item.real_width_cm}cm`).join('\n')}`
    }
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

.image-type-tag.corn_filament_nature,
.image-type-tag.corn_filament,
.image-type-tag.corn_leaf_sheath,
.image-type-tag.corn_shape,
.image-type-tag.corn_all {
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

.trait-badge-confidence {
  background: linear-gradient(90deg, #67C23A, #85CE61);
}

.trait-badge-width {
  background: linear-gradient(90deg, #409EFF, #67C23A);
}

.trait-lab {
  color: #303133;
  font-size: 13px;
}

.trait-confidence {
  font-size: 15px;
  font-weight: 700;
  color: #67C23A;
  background: rgba(103, 194, 58, 0.08);
  border-radius: 6px;
  padding: 2px 12px;
}

.trait-width {
  font-size: 15px;
  font-weight: 700;
  color: #409EFF;
  background: rgba(64, 158, 255, 0.08);
  border-radius: 6px;
  padding: 2px 12px;
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

/* 新增样式 */
.info-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-grid .info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(64, 158, 255, 0.1);
}

.info-grid .info-item:last-child {
  border-bottom: none;
}

.info-grid .info-label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.info-grid .info-value {
  font-size: 16px;
  font-weight: 700;
  color: #409eff;
  font-family: 'Courier New', monospace;
}

.info-grid .info-value.shape-type {
  background: linear-gradient(135deg, #409EFF, #67C23A);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 700;
}

.info-grid .info-value.confidence {
  color: #67c23a;
  background-color: rgba(103, 194, 58, 0.1);
  padding: 4px 8px;
  border-radius: 4px;
}

.width-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding: 12px;
  background-color: rgba(64, 158, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(64, 158, 255, 0.1);
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.summary-label {
  font-size: 12px;
  color: #606266;
  font-weight: 500;
  margin-bottom: 4px;
}

.summary-value {
  font-size: 16px;
  font-weight: 700;
  color: #409eff;
  font-family: 'Courier New', monospace;
}

.width-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.width-bar {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 12px;
  padding: 8px;
  background-color: rgba(64, 158, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(64, 158, 255, 0.1);
}

.bar-label {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
  min-width: 60px;
}

.bar-container {
  flex: 1;
  height: 24px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-right: 15px;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #409eff, #67c23a);
  border-radius: 12px;
  transition: width 1s ease;
  position: relative;
}

.bar-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.bar-value {
  font-size: 16px;
  color: #409eff;
  font-weight: 700;
  min-width: 70px;
  text-align: center;
  font-family: 'Courier New', monospace;
  background: linear-gradient(135deg, #409eff, #67c23a);
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.ratio-chart {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.ratio-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ratio-label {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.ratio-progress {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar {
  flex: 1;
  height: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #e6a23c, #f56c6c);
  border-radius: 10px;
  transition: width 1s ease;
  position: relative;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  animation: shimmer 2s infinite;
}

.ratio-value {
  font-size: 13px;
  color: #303133;
  font-weight: 600;
  min-width: 60px;
  text-align: right;
  font-family: 'Courier New', monospace;
}

.lab-section {
  margin-bottom: 15px;
}

.lab-section h4 {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: #303133;
  font-weight: 600;
}

.table-container {
  margin-bottom: 0;
}

.measurement-table {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.measurement-table :deep(.el-table__header) {
  background: linear-gradient(135deg, #409eff, #67c23a) !important;
  display: table-header-group !important;
}

.measurement-table :deep(.el-table__header th) {
  background: transparent !important;
  color: #303133 !important;
  font-weight: 600 !important;
  border-bottom: none !important;
  text-align: center !important;
  padding: 12px 0 !important;
}

.measurement-table :deep(.el-table__body tr:hover) {
  background-color: rgba(64, 158, 255, 0.05);
}

.measurement-table :deep(.el-table__body td) {
  border-bottom: 1px solid #ebeef5;
}

.table-value {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: #409eff;
  background-color: rgba(64, 158, 255, 0.1);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
}
</style>