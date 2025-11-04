<template>
  <div class="corn-trait-container">
    <div class="page-header">
      <h1 class="page-title">玉米顶部颜色分析</h1>
      <p class="page-description">上传玉米图片，自动分析顶部区域的 LAB 均值并展示裁剪图与结果图</p>
    </div>

    <div class="content-wrapper">
      <div class="upload-section">
        <div class="section-title">
          <el-icon><Upload /></el-icon>
          <span>图片上传</span>
        </div>
        <div
            class="upload-area"
            @click="triggerFileInput"
            @drop.prevent="handleDrop"
            @dragover.prevent
            @dragenter.prevent="handleDragEnter"
            @dragleave.prevent="handleDragLeave"
            :class="{ 'drag-over': isDragging }"
        >
          <input type="file" ref="fileInput" style="display: none" accept="image/*" @change="handleFileChange" />
          <div v-if="!uploadedImage" class="upload-placeholder">
            <el-icon class="upload-icon"><Upload /></el-icon>
            <div class="upload-text">拖拽文件到这里 或者 <span class="click-upload">点击上传</span></div>
            <div class="file-limit">jpg/png 文件大小小于 30M</div>
          </div>
          <div v-else class="image-preview">
            <img :src="uploadedImage" alt="上传的图片" />
            <div class="image-actions">
              <el-button type="danger" size="small" icon="Delete" circle @click.stop="removeImage"></el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 识别按钮 -->
    <div class="action-buttons" v-if="uploadedFile">
      <el-button
          type="success"
          class="identify-button"
          @click="submitImage"
          :loading="isLoading"
      >
        <el-icon class="button-icon"><Search /></el-icon>
        <span>{{ isLoading ? '识别中...' : '开始识别' }}</span>
      </el-button>
    </div>

    <!-- 顶部颜色分析结果展示 -->
    <div v-if="analysisResult && (analysisResult.L_mean !== undefined || analysisResult.A_mean !== undefined || analysisResult.B_mean !== undefined)" class="data-analysis-section">
      <div class="section-header">
        <h2>顶部颜色 LAB 均值</h2>
        <el-button 
          type="primary" 
          @click="copyTopColorData"
          :icon="CopyDocument"
          size="large"
        >
          一键复制数据
        </el-button>
      </div>

      <div class="data-section">
        <div class="section-title-wrapper">
          <div class="section-icon">
            <el-icon><Histogram /></el-icon>
          </div>
          <h3 class="section-title">LAB 均值</h3>
          <div class="section-description">顶部区域的 L/A/B 三通道均值</div>
        </div>

        <div class="section-content">
          <el-row :gutter="25">
            <el-col :xs="24" :sm="8" :md="8">
              <div class="info-card">
                <div class="card-header">
                  <el-icon><Histogram /></el-icon>
                  <span>亮度 L</span>
                </div>
                <div class="card-content">
                  <div class="lab-value"><span class="lab-label">L:</span><span class="lab-number">{{ Number(analysisResult.L_mean).toFixed(2) }}</span></div>
                  <div class="progress-bar"><div class="progress" :style="{ width: getLabProgressWidth('L', analysisResult.L_mean) + '%', backgroundColor: getLabColorForChannel('L') }"></div></div>
                </div>
              </div>
            </el-col>
            <el-col :xs="24" :sm="8" :md="8">
              <div class="info-card">
                <div class="card-header">
                  <el-icon><Histogram /></el-icon>
                  <span>红绿轴 A</span>
                </div>
                <div class="card-content">
                  <div class="lab-value"><span class="lab-label">A:</span><span class="lab-number">{{ Number(analysisResult.A_mean).toFixed(2) }}</span></div>
                  <div class="progress-bar"><div class="progress" :style="{ width: getLabProgressWidth('A', analysisResult.A_mean) + '%', backgroundColor: getLabColorForChannel('A') }"></div></div>
                </div>
              </div>
            </el-col>
            <el-col :xs="24" :sm="8" :md="8">
              <div class="info-card">
                <div class="card-header">
                  <el-icon><Histogram /></el-icon>
                  <span>蓝黄轴 B</span>
                </div>
                <div class="card-content">
                  <div class="lab-value"><span class="lab-label">B:</span><span class="lab-number">{{ Number(analysisResult.B_mean).toFixed(2) }}</span></div>
                  <div class="progress-bar"><div class="progress" :style="{ width: getLabProgressWidth('B', analysisResult.B_mean) + '%', backgroundColor: getLabColorForChannel('B') }"></div></div>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>

      <div class="data-section">
        <div class="section-title-wrapper">
          <div class="section-icon">
            <el-icon><DataAnalysis /></el-icon>
          </div>
          <h3 class="section-title">分析图片</h3>
          <div class="section-description">裁剪区域与最终结果对比</div>
        </div>

        <div class="section-content">
          <el-row :gutter="18" class="image-row">
            <el-col :xs="24" :sm="12" v-if="analysisResult.crop_image">
              <el-card class="image-card">
                <div class="image-title">裁剪图片</div>
                <img :src="getImageUrl(analysisResult.crop_image)" alt="裁剪图片" class="result-img" @click="openPreview(getImageUrl(analysisResult.crop_image))" />
              </el-card>
            </el-col>
            <el-col :xs="24" :sm="12" v-if="analysisResult.result_image">
              <el-card class="image-card">
                <div class="image-title">结果图片</div>
                <img :src="getImageUrl(analysisResult.result_image)" alt="结果图片" class="result-img" @click="openPreview(getImageUrl(analysisResult.result_image))" />
              </el-card>
            </el-col>
          </el-row>
        </div>
      </div>
    </div>

    <!-- 旧的整体分析区（禁用，避免空结构报错） -->
    <div v-if="analysisResult && analysisResult.results" class="data-analysis-section">
      <div class="section-header">
        <h2>数据分析</h2>
        <el-button 
          type="primary" 
          @click="copyAllData"
          :icon="CopyDocument"
          size="large"
        >
          一键复制数据
        </el-button>
      </div>

      <!-- 第一部分：分段测量数据 -->
      <div class="data-section">
        <div class="section-title-wrapper">
          <div class="section-icon">
                  <el-icon><Histogram /></el-icon>
                </div>
          <h3 class="section-title">分段测量数据</h3>
          <div class="section-description">玉米各段落的像素尺寸和实际尺寸测量结果</div>
          <el-button 
            type="primary" 
            @click="copySegmentData"
            :icon="CopyDocument"
            size="small"
            style="margin-left: auto;"
          >
            复制数据
          </el-button>
                </div>
        
        <div class="section-content">
          <div class="table-container" v-if="analysisResult.results && analysisResult.results[0].zl_lengths && analysisResult.results[0].zl_lengths.length > 0">
            <el-table 
              :data="analysisResult.results[0].zl_lengths" 
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
                </div>
                </div>

      <!-- 第二部分：性状分析结果 -->
      <div class="data-section">
        <div class="section-title-wrapper">
          <div class="section-icon">
            <el-icon><DataAnalysis /></el-icon>
                </div>
          <h3 class="section-title">性状分析结果</h3>
          <div class="section-description">玉米形态特征和比例分析数据</div>
          <el-button 
            type="primary" 
            @click="copyTraitData"
            :icon="CopyDocument"
            size="small"
            style="margin-left: auto;"
          >
            复制数据
          </el-button>
              </div>
        
        <div class="section-content">
          <el-row :gutter="25">
            <!-- 基础信息卡片 -->
            <el-col :xs="24" :sm="12" :md="8">
              <div class="info-card">
                <div class="card-header">
                  <el-icon><Histogram /></el-icon>
                  <span>基础信息</span>
            </div>
                <div class="card-content">
                  <div class="info-item">
                    <div class="info-label">形状类型</div>
                    <div class="info-value shape-type">{{ analysisResult.results[0].shape_type }}</div>
          </div>
                  <div class="info-item">
                    <div class="info-label">测量点数量</div>
                    <div class="info-value">{{ analysisResult.results[0].midline_widths.length }} 个</div>
        </div>
                </div>
              </div>
            </el-col>

            <!-- 中线宽度分析 -->
            <el-col :xs="24" :sm="12" :md="8">
              <div class="info-card">
                <div class="card-header">
                  <el-icon><TrendCharts /></el-icon>
                  <span>中线宽度分析</span>
                  <el-button 
                    type="primary" 
                    @click="copyWidthData"
                    :icon="CopyDocument"
                    size="small"
                    style="margin-left: auto;"
                  >
                    复制
                  </el-button>
                </div>
                <div class="card-content">
                  <div class="width-summary">
                    <div class="summary-item">
                      <div class="summary-label">最大宽度</div>
                      <div class="summary-value">{{ Math.max(...analysisResult.results[0].midline_widths) }} px</div>
                    </div>
                    <div class="summary-item">
                      <div class="summary-label">平均宽度</div>
                      <div class="summary-value">{{ Math.round(analysisResult.results[0].midline_widths.reduce((a, b) => a + b, 0) / analysisResult.results[0].midline_widths.length) }} px</div>
                    </div>
                    <div class="summary-item">
                      <div class="summary-label">最小宽度</div>
                      <div class="summary-value">{{ Math.min(...analysisResult.results[0].midline_widths) }} px</div>
                    </div>
                  </div>
            <div class="width-chart">
              <div 
                      v-for="(width, index) in analysisResult.results[0].midline_widths.slice(0, 8)" 
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
          </div>
        </div>
            </el-col>

            <!-- 比例数据 -->
            <el-col :xs="24" :sm="12" :md="8">
              <div class="info-card">
                <div class="card-header">
                  <el-icon><PieChart /></el-icon>
                  <span>比例数据</span>
                  <el-button 
                    type="primary" 
                    @click="copyRatioData"
                    :icon="CopyDocument"
                    size="small"
                    style="margin-left: auto;"
                  >
                    复制
                  </el-button>
                </div>
                <div class="card-content">
            <div class="ratio-chart">
              <div class="ratio-item">
                <div class="ratio-label">1:3 比例</div>
                <div class="ratio-progress">
                  <div class="progress-bar">
                    <div 
                      class="progress-fill" 
                      :style="{ width: getRatioPercentage(analysisResult.results[0].ratios.ratio_1_3) + '%' }"
                    ></div>
                  </div>
                  <span class="ratio-value">{{ analysisResult.results[0].ratios.ratio_1_3.toFixed(4) }}</span>
                </div>
              </div>
              <div class="ratio-item">
                <div class="ratio-label">1:5 比例</div>
                <div class="ratio-progress">
                  <div class="progress-bar">
                    <div 
                      class="progress-fill" 
                      :style="{ width: getRatioPercentage(analysisResult.results[0].ratios.ratio_1_5) + '%' }"
                    ></div>
                  </div>
                  <span class="ratio-value">{{ analysisResult.results[0].ratios.ratio_1_5.toFixed(4) }}</span>
                </div>
              </div>
              <div class="ratio-item">
                <div class="ratio-label">3:5 比例</div>
                <div class="ratio-progress">
                  <div class="progress-bar">
                    <div 
                      class="progress-fill" 
                      :style="{ width: getRatioPercentage(analysisResult.results[0].ratios.ratio_3_5) + '%' }"
                    ></div>
                  </div>
                  <span class="ratio-value">{{ analysisResult.results[0].ratios.ratio_3_5.toFixed(4) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
            </el-col>
          </el-row>

          <!-- 分析图片展示（三个主要图片） -->
          <div class="analysis-images">
            <div class="images-title">
              <el-icon><DataAnalysis /></el-icon>
              <span>分析图片</span>
            </div>
            <div class="images-grid" v-if="analysisResult.results && analysisResult.results.length > 0">
              <el-row :gutter="18" class="image-row">
                <el-col :xs="24" :sm="8" v-if="analysisResult.results[0].image.analysis">
                  <el-card class="image-card">
                    <div class="image-title">分析图片</div>
                    <img :src="getImageUrl(analysisResult.results[0].image.analysis)" alt="分析图片" class="result-img" @click="openPreview(getImageUrl(analysisResult.results[0].image.analysis))" />
                  </el-card>
                </el-col>
                <el-col :xs="24" :sm="8" v-if="analysisResult.results[0].image.mask">
                  <el-card class="image-card">
                    <div class="image-title">掩码图片</div>
                    <img :src="getImageUrl(analysisResult.results[0].image.mask)" alt="掩码图片" class="result-img" @click="openPreview(getImageUrl(analysisResult.results[0].image.mask))" />
                  </el-card>
                </el-col>
                <el-col :xs="24" :sm="8" v-if="analysisResult.results[0].image.overlay">
                  <el-card class="image-card">
                    <div class="image-title">叠加图片</div>
                    <img :src="getImageUrl(analysisResult.results[0].image.overlay)" alt="叠加图片" class="result-img" @click="openPreview(getImageUrl(analysisResult.results[0].image.overlay))" />
                  </el-card>
                </el-col>
              </el-row>
            </div>
          </div>
        </div>
      </div>

      <!-- 第三部分：process_single_image数据 -->
      <div class="data-section">
        <div class="section-title-wrapper">
          <div class="section-icon">
            <el-icon><Histogram /></el-icon>
          </div>
          <h3 class="section-title">LAB色彩分析</h3>
          <div class="section-description">玉米LAB色彩空间的最大值和均值分析</div>
          <el-button 
            type="primary" 
            @click="copyLabData"
            :icon="CopyDocument"
            size="small"
            style="margin-left: auto;"
          >
            复制数据
          </el-button>
          </div>
        
        <div class="section-content">
          <el-row :gutter="25">
            <!-- 置信度信息 -->
            <el-col :xs="24" :sm="8" :md="8" v-if="analysisResult.results && analysisResult.results[0].process_single_image?.confidence">
              <div class="chart-card">
                <div class="chart-title">
                  <el-icon><DataAnalysis /></el-icon>
                  <span>识别置信度</span>
                  <el-button 
                    type="primary" 
                    @click="copyConfidenceData"
                    :icon="CopyDocument"
                    size="small"
                    style="margin-left: auto;"
                  >
                    复制
                  </el-button>
                </div>
                <div class="chart-content">
                  <div class="confidence-display">
                    <div class="confidence-value">{{ (analysisResult.results[0].process_single_image.confidence * 100).toFixed(2) }}%</div>
                    <div class="confidence-bar">
                      <div class="confidence-fill" :style="{ width: (analysisResult.results[0].process_single_image.confidence * 100) + '%' }"></div>
                    </div>
                  </div>
                </div>
              </div>
            </el-col>

            <!-- LAB最大值 -->
            <el-col :xs="24" :sm="8" :md="8" v-if="analysisResult.results && analysisResult.results[0].process_single_image?.lab_max">
              <div class="chart-card lab-charts">
                <div class="chart-header">
                  <h3><el-icon><Histogram /></el-icon> LAB 最大值</h3>
                  <el-button 
                    type="primary" 
                    @click="copyLabMaxData"
                    :icon="CopyDocument"
                    size="small"
                    style="margin-left: auto;"
                  >
                    复制
                  </el-button>
                </div>
                <el-row :gutter="20" direction="vertical">
                  <el-col :xs="24" :sm="24" :md="24" v-for="key in ['L','A','B']" :key="'labmax-'+key" style="margin-bottom: 10px;">
                    <el-card class="lab-card" :body-style="{ padding: '15px' }">
                      <div class="lab-value">
                        <span class="lab-label">{{ key }}:</span>
                        <span class="lab-number">{{ analysisResult.results[0].process_single_image.lab_max[key]?.toFixed(2) ?? '--' }}</span>
                      </div>
                      <div class="progress-bar">
                        <div class="progress" :style="{ width: getLabProgressWidth(key, analysisResult.results[0].process_single_image.lab_max[key]) + '%', backgroundColor: getLabColorForChannel(key) }"></div>
                      </div>
                      <div class="channel-description">{{ getLabChannelDescription(key) }}</div>
                    </el-card>
                  </el-col>
                </el-row>
              </div>
            </el-col>

            <!-- LAB均值 -->
            <el-col :xs="24" :sm="8" :md="8" v-if="analysisResult.results && analysisResult.results[0].process_single_image?.lab_mean">
              <div class="chart-card lab-charts">
                <div class="chart-header">
                  <h3><el-icon><Histogram /></el-icon> LAB 均值</h3>
                  <el-button 
                    type="primary" 
                    @click="copyLabMeanData"
                    :icon="CopyDocument"
                    size="small"
                    style="margin-left: auto;"
                  >
                    复制
                  </el-button>
                </div>
                <el-row :gutter="20" direction="vertical">
                  <el-col :xs="24" :sm="24" :md="24" v-for="key in ['L','A','B']" :key="'labmean-'+key" style="margin-bottom: 10px;">
                    <el-card class="lab-card" :body-style="{ padding: '15px' }">
                      <div class="lab-value">
                        <span class="lab-label">{{ key }}:</span>
                        <span class="lab-number">{{ analysisResult.results[0].process_single_image.lab_mean[key]?.toFixed(2) ?? '--' }}</span>
                      </div>
                      <div class="progress-bar">
                        <div class="progress" :style="{ width: getLabProgressWidth(key, analysisResult.results[0].process_single_image.lab_mean[key]) + '%', backgroundColor: getLabColorForChannel(key) }"></div>
                      </div>
                      <div class="channel-description">{{ getLabChannelDescription(key) }}</div>
                    </el-card>
                  </el-col>
                </el-row>
              </div>
            </el-col>
          </el-row>

          <!-- process_single_image中的四个图片 -->
          <div class="process-images">
            <div class="images-title">
              <el-icon><DataAnalysis /></el-icon>
              <span>处理图片</span>
            </div>
            <div class="images-grid" v-if="analysisResult.results && analysisResult.results.length > 0">
              <el-row :gutter="18" class="image-row">
                <el-col :xs="24" :sm="6" v-if="analysisResult.results[0].process_single_image?.center_part">
                  <el-card class="image-card">
                    <div class="image-title">中心部分</div>
                    <img :src="getImageUrl(analysisResult.results[0].process_single_image.center_part)" alt="中心部分" class="result-img" @click="openPreview(getImageUrl(analysisResult.results[0].process_single_image.center_part))" />
                  </el-card>
                </el-col>
                <el-col :xs="24" :sm="6" v-if="analysisResult.results[0].process_single_image?.gs_only_image">
                  <el-card class="image-card">
                    <div class="image-title">仅灰度图</div>
                    <img :src="getImageUrl(analysisResult.results[0].process_single_image.gs_only_image)" alt="仅灰度图" class="result-img" @click="openPreview(getImageUrl(analysisResult.results[0].process_single_image.gs_only_image))" />
                  </el-card>
                </el-col>
                <el-col :xs="24" :sm="6" v-if="analysisResult.results[0].process_single_image?.highlight">
                  <el-card class="image-card">
                    <div class="image-title">高亮图</div>
                    <img :src="getImageUrl(analysisResult.results[0].process_single_image.highlight)" alt="高亮图" class="result-img" @click="openPreview(getImageUrl(analysisResult.results[0].process_single_image.highlight))" />
                  </el-card>
                </el-col>
                <el-col :xs="24" :sm="6" v-if="analysisResult.results[0].process_single_image?.unet_result">
                  <el-card class="image-card">
                    <div class="image-title">UNet结果</div>
                    <img :src="getImageUrl(analysisResult.results[0].process_single_image.unet_result)" alt="UNet结果" class="result-img" @click="openPreview(getImageUrl(analysisResult.results[0].process_single_image.unet_result))" />
              </el-card>
            </el-col>
          </el-row>
        </div>
      </div>
    </div>
      </div>
    </div>

    <!-- 弹窗预览大图 -->
    <el-dialog v-model="previewDialogVisible" width="900px" top="6vh" :show-close="true" append-to-body :before-close="handlePreviewClose" class="custom-preview-dialog">
      <template #title>
        <span>图片预览</span>
        <el-button @click="togglePreviewFlip" size="small" style="margin-left:16px;" :icon="RefreshRight">翻转</el-button>
        <span style="margin-left:16px;font-size:13px;color:#999;">滚轮缩放</span>
      </template>
      <div class="preview-img-wrapper">
        <div class="preview-img-scroll" ref="previewImgScrollRef">
          <img :src="previewImageUrl"
               @mousedown="onPreviewImgMouseDown"
               draggable="false"
               :style="{
                 maxWidth: '1600px',
                 maxHeight: '1200px',
                 transform: `scale(${previewScale}) ${previewFlipped ? 'rotate(180deg)' : ''}`,
                 transition: 'transform 0.3s',
                 cursor: isDragging ? 'grabbing' : 'grab',
                 background: '#f6f8fa',
                 borderRadius: '12px',
                 boxShadow: '0 4px 24px rgba(0,0,0,0.12)'
               }"
               @wheel="handlePreviewWheel"
          />
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElLoading, ElDialog } from 'element-plus'
import { Upload, InfoFilled, Delete, DataAnalysis, Search, PieChart, TrendCharts, CopyDocument, Histogram, RefreshRight, ZoomIn } from '@element-plus/icons-vue'
import {cornTopColor} from '@/api/corn'

const router = useRouter()
const fileInput = ref(null)
const uploadedImage = ref(null)
const uploadedFile = ref(null)
const analysisResult = ref(null)
const isDragging = ref(false)
const isLoading = ref(false)

// 预览弹窗相关
const previewDialogVisible = ref(false)
const previewImageUrl = ref('')
const previewFlipped = ref(false)
const previewScale = ref(1)
const previewImgScrollRef = ref(null)
let dragStartX = 0
let dragStartY = 0
let scrollStartLeft = 0
let scrollStartTop = 0

const openPreview = (imgUrl) => {
  previewImageUrl.value = imgUrl
  previewFlipped.value = false
  previewScale.value = 1
  previewDialogVisible.value = true
}
const togglePreviewFlip = () => {
  previewFlipped.value = !previewFlipped.value
}
const handlePreviewWheel = (e) => {
  e.preventDefault()
  let next = previewScale.value + (e.deltaY < 0 ? 0.1 : -0.1)
  if (next < 0.2) next = 0.2
  if (next > 5) next = 5
  previewScale.value = next
}
const handlePreviewClose = (done) => {
  previewScale.value = 1
  previewFlipped.value = false
  done && done()
}

const onPreviewImgMouseDown = (e) => {
  if (e.button !== 0) return
  isDragging.value = true
  dragStartX = e.clientX
  dragStartY = e.clientY
  const el = previewImgScrollRef.value
  scrollStartLeft = el.scrollLeft
  scrollStartTop = el.scrollTop
  document.body.style.cursor = 'grabbing'
  e.preventDefault()
}
const onPreviewMouseMove = (e) => {
  if (!isDragging.value) return
  const el = previewImgScrollRef.value
  el.scrollLeft = scrollStartLeft - (e.clientX - dragStartX)
  el.scrollTop = scrollStartTop - (e.clientY - dragStartY)
}
const onPreviewMouseUp = () => {
  if (isDragging.value) {
    isDragging.value = false
    document.body.style.cursor = ''
  }
}

const triggerFileInput = () => {
  fileInput.value.click()
}

const handleFileChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    processFile(file)
  }
}

const handleDrop = (event) => {
  isDragging.value = false
  const file = event.dataTransfer.files[0]
  if (file) {
    processFile(file)
  }
}

const handleDragEnter = () => {
  isDragging.value = true
}

const handleDragLeave = () => {
  isDragging.value = false
}

const removeImage = (event) => {
  event.stopPropagation()
  
  // 清理blob URL
  if (uploadedImage.value && uploadedImage.value.startsWith('blob:')) {
    URL.revokeObjectURL(uploadedImage.value)
  }
  
  uploadedImage.value = null
  uploadedFile.value = null  // 清理文件对象
  if (fileInput.value) {
    fileInput.value.value = ''
  }
  // 重置识别结果
  resetResults()
}

const resetResults = () => {
  analysisResult.value = null
}

const processFile = (file) => {
  // 检查文件类型
  if (!file.type.match('image.*')) {
    ElMessage.error('请上传图片文件')
    return
  }

  // 检查文件大小（30MB = 30 * 1024 * 1024 字节）
  if (file.size > 30 * 1024 * 1024) {
    ElMessage.error('文件大小不能超过30MB')
    return
  }

  uploadedFile.value = file
  uploadedImage.value = URL.createObjectURL(file)
  // 重置识别结果
  resetResults()
}

const submitImage = async () => {
  if (!uploadedFile.value) {
    ElMessage.warning('请先上传图片')
    return
  }

  isLoading.value = true
  const loading = ElLoading.service({
    lock: true,
    text: '正在识别中...',
    background: 'rgba(0, 0, 0, 0.7)'
  })

  try {
    const response = await cornTopColor(uploadedFile.value)

    if (response.code === 200) {
      analysisResult.value = response.data
      ElMessage.success('识别完成')
    } else {
      ElMessage.error(response.message || '识别失败')
    }
  } catch (error) {
    console.error('识别失败:', error)
    ElMessage.error('识别失败，请重试')
  } finally {
    loading.close()
    isLoading.value = false
  }
}

// 处理图片URL
const getImageUrl = (imagePath) => {
  if (!imagePath) return ''
  
  // 如果是完整的URL，直接返回
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }
  
  // 如果是base64格式，直接返回
  if (imagePath.startsWith('data:image')) {
    return imagePath
  }
  
  // 如果是相对路径，拼接baseURL
  const baseURL = process.env.VUE_APP_API_URL || 'http://127.0.0.1:5000'
  return `${baseURL}${imagePath}`
}

// 获取宽度百分比
const getWidthPercentage = (width) => {
  // 找到最大宽度值作为基准
  if (!analysisResult.value?.results?.[0]?.midline_widths) return 0
  const maxWidth = Math.max(...analysisResult.value.results[0].midline_widths)
  return maxWidth > 0 ? (width / maxWidth) * 100 : 0
}

// 获取比例百分比
const getRatioPercentage = (ratio) => {
  // 找到最大比例值作为基准
  if (!analysisResult.value?.results?.[0]?.ratios) return 0
  const ratios = analysisResult.value.results[0].ratios
  const maxRatio = Math.max(ratios.ratio_1_3, ratios.ratio_1_5, ratios.ratio_3_5)
  return maxRatio > 0 ? (ratio / maxRatio) * 100 : 0
}

// 一键复制所有数据
const copyAllData = () => {
  if (!analysisResult.value) return
  
  const result = analysisResult.value.results?.[0]
  if (!result) return

  // LAB最大值
  let labMax = result.process_single_image?.lab_max
  let labMaxText = labMax ? `L: ${labMax.L?.toFixed(2) ?? '--'}\nA: ${labMax.A?.toFixed(2) ?? '--'}\nB: ${labMax.B?.toFixed(2) ?? '--'}` : '--'
  // LAB均值
  let labMean = result.process_single_image?.lab_mean
  let labMeanText = labMean ? `L: ${labMean.L?.toFixed(2) ?? '--'}\nA: ${labMean.A?.toFixed(2) ?? '--'}\nB: ${labMean.B?.toFixed(2) ?? '--'}` : '--'
  // 分段测量
  let zlLengths = result.zl_lengths
  let zlLengthsText = zlLengths && zlLengths.length > 0 ? zlLengths.map((item, idx) => `段${idx+1}: 像素高${item.pixel_height}, 像素宽${item.pixel_width}, 实际高${item.real_height_cm}cm, 实际宽${item.real_width_cm}cm`).join('\\n') : '--'

  const dataText = `玉米整体分析数据\n\n识别统计:\n- 形状类型: ${result.shape_type}\n\n中线宽度数据:\n${result.midline_widths.map((width, index) => `- 位置${index + 1}: ${width}`).join('\\n')}\n\n比例数据:\n- 1:3 比例: ${result.ratios.ratio_1_3.toFixed(4)}\n- 1:5 比例: ${result.ratios.ratio_1_5.toFixed(4)}\n- 3:5 比例: ${result.ratios.ratio_3_5.toFixed(4)}\n\nLAB最大值:\n${labMaxText}\n\nLAB均值:\n${labMeanText}\n\n分段测量数据:\n${zlLengthsText}\n\n分析时间: ${new Date().toLocaleString('zh-CN')}`

  copyToClipboard(dataText, '数据复制成功')
}

// 复制分段测量数据
const copySegmentData = () => {
  if (!analysisResult.value?.results?.[0]?.zl_lengths) return
  
  const zlLengths = analysisResult.value.results[0].zl_lengths
  const dataText = `分段测量数据\n\n${zlLengths.map((item, idx) => `段落${idx+1}:\n- 像素高度: ${item.pixel_height} px\n- 像素宽度: ${item.pixel_width} px\n- 实际高度: ${item.real_height_cm} cm\n- 实际宽度: ${item.real_width_cm} cm`).join('\n\n')}\n\n复制时间: ${new Date().toLocaleString('zh-CN')}`
  
  copyToClipboard(dataText, '分段测量数据复制成功')
}

// 复制性状分析数据
const copyTraitData = () => {
  if (!analysisResult.value?.results?.[0]) return
  
  const result = analysisResult.value.results[0]
  const dataText = `性状分析结果\n\n基础信息:\n- 形状类型: ${result.shape_type}\n- 测量点数量: ${result.midline_widths.length} 个\n\n中线宽度分析:\n- 最大宽度: ${Math.max(...result.midline_widths)} px\n- 平均宽度: ${Math.round(result.midline_widths.reduce((a, b) => a + b, 0) / result.midline_widths.length)} px\n- 最小宽度: ${Math.min(...result.midline_widths)} px\n\n比例数据:\n- 1:3 比例: ${result.ratios.ratio_1_3.toFixed(4)}\n- 1:5 比例: ${result.ratios.ratio_1_5.toFixed(4)}\n- 3:5 比例: ${result.ratios.ratio_3_5.toFixed(4)}\n\n复制时间: ${new Date().toLocaleString('zh-CN')}`
  
  copyToClipboard(dataText, '性状分析数据复制成功')
}

// 复制中线宽度数据
const copyWidthData = () => {
  if (!analysisResult.value?.results?.[0]?.midline_widths) return
  
  const midlineWidths = analysisResult.value.results[0].midline_widths
  const dataText = `中线宽度数据\n\n${midlineWidths.map((width, index) => `- 位置${index + 1}: ${width} px`).join('\\n')}\n\n复制时间: ${new Date().toLocaleString('zh-CN')}`
  
  copyToClipboard(dataText, '中线宽度数据复制成功')
}

// 复制比例数据
const copyRatioData = () => {
  if (!analysisResult.value?.results?.[0]?.ratios) return
  
  const ratios = analysisResult.value.results[0].ratios
  const dataText = `比例数据\n\n1:3 比例: ${ratios.ratio_1_3.toFixed(4)}\n1:5 比例: ${ratios.ratio_1_5.toFixed(4)}\n3:5 比例: ${ratios.ratio_3_5.toFixed(4)}\n\n复制时间: ${new Date().toLocaleString('zh-CN')}`
  
  copyToClipboard(dataText, '比例数据复制成功')
}

// 复制置信度数据
const copyConfidenceData = () => {
  if (!analysisResult.value?.results?.[0]?.process_single_image?.confidence) return
  
  const confidence = analysisResult.value.results[0].process_single_image.confidence
  const dataText = `识别置信度\n\n置信度: ${(confidence * 100).toFixed(2)}%\n\n复制时间: ${new Date().toLocaleString('zh-CN')}`
  
  copyToClipboard(dataText, '置信度数据复制成功')
}

// 复制LAB最大值数据
const copyLabMaxData = () => {
  if (!analysisResult.value?.results?.[0]?.process_single_image?.lab_max) return
  
  const labMax = analysisResult.value.results[0].process_single_image.lab_max
  const dataText = `LAB最大值\n\nL: ${labMax.L?.toFixed(2) ?? '--'}\nA: ${labMax.A?.toFixed(2) ?? '--'}\nB: ${labMax.B?.toFixed(2) ?? '--'}\n\n复制时间: ${new Date().toLocaleString('zh-CN')}`
  
  copyToClipboard(dataText, 'LAB最大值数据复制成功')
}

// 复制LAB均值数据
const copyLabMeanData = () => {
  if (!analysisResult.value?.results?.[0]?.process_single_image?.lab_mean) return
  
  const labMean = analysisResult.value.results[0].process_single_image.lab_mean
  const dataText = `LAB均值\n\nL: ${labMean.L?.toFixed(2) ?? '--'}\nA: ${labMean.A?.toFixed(2) ?? '--'}\nB: ${labMean.B?.toFixed(2) ?? '--'}\n\n复制时间: ${new Date().toLocaleString('zh-CN')}`
  
  copyToClipboard(dataText, 'LAB均值数据复制成功')
}

// 复制LAB数据
const copyLabData = () => {
  if (!analysisResult.value?.results?.[0]?.process_single_image) return
  
  const processData = analysisResult.value.results[0].process_single_image
  let dataText = `LAB色彩分析数据\n\n`
  
  if (processData.confidence) {
    dataText += `识别置信度: ${(processData.confidence * 100).toFixed(2)}%\n\n`
  }
  
  if (processData.lab_max) {
    dataText += `LAB最大值:\n- L: ${processData.lab_max.L?.toFixed(2) ?? '--'}\n- A: ${processData.lab_max.A?.toFixed(2) ?? '--'}\n- B: ${processData.lab_max.B?.toFixed(2) ?? '--'}\n\n`
  }
  
  if (processData.lab_mean) {
    dataText += `LAB均值:\n- L: ${processData.lab_mean.L?.toFixed(2) ?? '--'}\n- A: ${processData.lab_mean.A?.toFixed(2) ?? '--'}\n- B: ${processData.lab_mean.B?.toFixed(2) ?? '--'}\n\n`
  }
  
  dataText += `复制时间: ${new Date().toLocaleString('zh-CN')}`
  
  copyToClipboard(dataText, 'LAB分析数据复制成功')
}

// 复制顶部颜色数据
const copyTopColorData = () => {
  if (!analysisResult.value) return

  const L = analysisResult.value.L_mean
  const A = analysisResult.value.A_mean
  const B = analysisResult.value.B_mean
  const crop = analysisResult.value.crop_image
  const result = analysisResult.value.result_image

  const dataText = `顶部颜色 LAB 均值\n\nL: ${Number(L).toFixed(2)}\nA: ${Number(A).toFixed(2)}\nB: ${Number(B).toFixed(2)}\n\n裁剪图片: ${crop ? getImageUrl(crop) : '--'}\n结果图片: ${result ? getImageUrl(result) : '--'}\n\n复制时间: ${new Date().toLocaleString('zh-CN')}`

  copyToClipboard(dataText, '顶部颜色数据复制成功')
}

// 通用复制到剪贴板方法
const copyToClipboard = (text, successMessage) => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      ElMessage.success(successMessage)
    }).catch(() => {
      ElMessage.error('复制失败，请手动复制')
    })
  } else {
    // 兼容方案
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'absolute'
    textarea.style.left = '-9999px'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      const successful = document.execCommand('copy')
      if (successful) {
        ElMessage.success(successMessage)
      } else {
        ElMessage.error('复制失败，请手动复制')
      }
    } catch (err) {
      ElMessage.error('复制失败，请手动复制')
    }
    document.body.removeChild(textarea)
  }
}

// LAB 卡片相关方法，参考 LeafSheathFileTraitFile.vue
const getLabProgressWidth = (channel, value) => {
  const maxValues = {
    'L': 100,
    'A': 128,
    'B': 128
  }
  if (channel === 'A' || channel === 'B') {
    return ((value + 128) / 256) * 100
  } else {
    return (value / maxValues[channel]) * 100
  }
}

const getLabColorForChannel = (channel) => {
  const colors = {
    'L': '#333333',
    'A': '#ff5252',
    'B': '#2196f3'
  }
  return colors[channel] || '#409EFF'
}

const getLabChannelDescription = (channel) => {
  const descriptions = {
    'L': '亮度 (0-100)',
    'A': '红绿轴 (-128 到 +127)',
    'B': '蓝黄轴 (-128 到 +127)'
  }
  return descriptions[channel] || ''
}

onMounted(() => {
  window.addEventListener('mousemove', onPreviewMouseMove)
  window.addEventListener('mouseup', onPreviewMouseUp)
})
onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onPreviewMouseMove)
  window.removeEventListener('mouseup', onPreviewMouseUp)
  
  // 清理URL.createObjectURL创建的对象
  if (uploadedImage.value && uploadedImage.value.startsWith('blob:')) {
    URL.revokeObjectURL(uploadedImage.value)
  }
})
</script>

<style scoped>
.corn-trait-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px;
  background-color: #f5f7fa;
  background-image: linear-gradient(135deg, #f5f7fa 0%, #f0f4f8 100%);
}

.page-header {
  text-align: center;
  margin-bottom: 25px;
  padding-bottom: 20px;
  position: relative;
}

.page-title {
  font-size: 28px;
  color: #303133;
  margin-bottom: 8px;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.page-description {
  color: #606266;
  font-size: 15px;
  max-width: 600px;
  margin: 0 auto;
}

.content-wrapper {
  display: flex;
  flex: 1;
  gap: 25px;
  margin-bottom: 25px;
}

.upload-section {
  flex: 1;  /* 上传区域占满宽度 */
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  width: 100%;
}

.upload-section:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.section-title {
  padding: 15px 20px;
  font-size: 17px;
  font-weight: bold;
  border-bottom: 1px solid #ebeef5;
  background: linear-gradient(to right, #ecf5ff, #f0f9eb);
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-title .el-icon {
  font-size: 20px;
  color: #409eff;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
}

.upload-area {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  border: 2px dashed #d9ecff;
  border-radius: 10px;
  margin: 20px;
  min-height: 300px;
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;
  background-color: rgba(236, 245, 255, 0.3);
}

.upload-area.drag-over {
  border-color: #409eff;
  background-color: rgba(64, 158, 255, 0.08);
  transform: scale(1.02);
  box-shadow: 0 0 15px rgba(64, 158, 255, 0.2);
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
  text-align: center;
  padding: 20px;
  width: 100%;
}

.upload-icon {
  font-size: 60px;
  margin-bottom: 20px;
  color: #409eff;
  filter: drop-shadow(0 3px 5px rgba(0, 0, 0, 0.15));
  transition: all 0.3s;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
}

.upload-text {
  margin-bottom: 12px;
  font-size: 17px;
  color: #606266;
  line-height: 1.5;
}

.click-upload {
  color: #409eff;
  font-weight: bold;
  text-decoration: underline;
  cursor: pointer;
  transition: color 0.3s;
}

.click-upload:hover {
  color: #66b1ff;
}

.file-limit {
  font-size: 13px;
  color: #909399;
  margin-top: 8px;
  background-color: rgba(144, 147, 153, 0.1);
  padding: 5px 10px;
  border-radius: 4px;
}

.image-preview {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.image-preview img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s;
}

.image-preview:hover img {
  transform: scale(1.02);
}

.image-actions {
  position: absolute;
  top: 10px;
  right: 10px;
  opacity: 0;
  transition: opacity 0.3s ease, transform 0.3s ease;
  transform: translateY(-5px);
}

.image-preview:hover .image-actions {
  opacity: 1;
  transform: translateY(0);
}

.data-analysis-section {
  margin-top: 30px;
  padding: 25px;
  background-color: #ffffff;
  border-radius: 16px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.data-analysis-section:hover {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f0f2f5;
}

.section-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-header h2::before {
  content: '';
  width: 4px;
  height: 24px;
  background: linear-gradient(135deg, #409eff, #67c23a);
  border-radius: 2px;
}

.data-section {
  margin-bottom: 35px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: 1px solid #ebeef5;
}

.data-section:hover {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.section-title-wrapper {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f0f2f5;
  flex-wrap: wrap;
}

.section-icon {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #409eff, #67c23a);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.section-icon .el-icon {
  font-size: 24px;
  color: white;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.section-title {
  font-size: 22px;
  font-weight: 700;
  color: #303133;
  margin: 0;
}

.section-description {
  font-size: 14px;
  color: #909399;
  margin-left: 65px;
  margin-top: -15px;
  flex: 1;
}

.section-content {
  padding: 0;
  background-color: transparent;
  border-radius: 0;
  box-shadow: none;
}

.chart-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border: 1px solid #ebeef5;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  margin-bottom: 25px;
}

.chart-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #409eff, #67c23a, #e6a23c);
  border-radius: 12px 12px 0 0;
}

.chart-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.chart-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.chart-title .el-icon {
  font-size: 22px;
  color: #409eff;
  filter: drop-shadow(0 2px 4px rgba(64, 158, 255, 0.3));
}

.chart-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.measurement-cards {
  margin-bottom: 0;
}

.measurement-card {
  padding: 20px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  margin-bottom: 15px;
  border: 1px solid #ebeef5;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.measurement-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #409eff, #67c23a);
  border-radius: 12px 12px 0 0;
}

.measurement-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
}

.segment-number {
  font-size: 18px;
  font-weight: 700;
  color: #303133;
  background: linear-gradient(135deg, #409eff, #67c23a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.measurement-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(64, 158, 255, 0.1);
}

.measurement-item:last-child {
  border-bottom: none;
}

.measurement-label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.measurement-value {
  font-size: 16px;
  font-weight: 700;
  color: #409eff;
  font-family: 'Courier New', monospace;
  background-color: rgba(64, 158, 255, 0.1);
  padding: 4px 8px;
  border-radius: 4px;
}

.info-card {
  padding: 20px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border: 1px solid #ebeef5;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  height: 100%;
}

.info-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #409eff, #67c23a, #e6a23c);
  border-radius: 12px 12px 0 0;
}

.info-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
}

.info-card .card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.info-card .card-header .el-icon {
  font-size: 20px;
  color: #409eff;
}

.info-card .card-header span {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.info-card .card-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(64, 158, 255, 0.1);
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.info-value {
  font-size: 16px;
  font-weight: 700;
  color: #409eff;
  font-family: 'Courier New', monospace;
}

.info-value.shape-type {
  background: linear-gradient(135deg, #409eff, #67c23a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 700;
}

.info-value.confidence {
  color: #67c23a;
  background-color: rgba(103, 194, 58, 0.1);
  padding: 4px 8px;
  border-radius: 4px;
}

.measurement-card .card-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.measurement-card .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
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

.analysis-images {
  margin-top: 25px;
  padding-top: 20px;
  border-top: 2px solid #f0f2f5;
}

.images-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.images-title .el-icon {
  font-size: 20px;
  color: #409eff;
}

.images-grid {
  margin-bottom: 0;
}

.image-row {
  margin-bottom: 0;
}

.image-card {
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
}

.image-title {
  text-align: center;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
  margin-top: 4px;
}

.result-img {
  max-height: 180px;
  width: auto;
  max-width: 100%;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.10);
  cursor: pointer;
  transition: transform 0.2s;
}

.result-img:hover {
  transform: scale(1.04);
  box-shadow: 0 4px 16px rgba(64,158,255,0.18);
}

.action-buttons {
  display: flex;
  justify-content: center;
  margin: 30px 0;
  padding: 20px;
}

.identify-button {
  padding: 14px 45px;
  font-size: 17px;
  border-radius: 30px;
  transition: all 0.3s;
  background: linear-gradient(135deg, #67C23A, #4CAF50);
  border: none;
  color: white;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: 0 6px 16px rgba(76, 175, 80, 0.4);
  position: relative;
  overflow: hidden;
}

.identify-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: all 0.6s;
}

.identify-button:hover:not(:disabled)::before {
  left: 100%;
}

.identify-button:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(76, 175, 80, 0.5);
  background: linear-gradient(135deg, #85CE61, #67C23A);
}

.identify-button:active:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
}

.identify-button:disabled {
  background: linear-gradient(135deg, #C0C4CC, #909399);
  box-shadow: none;
  cursor: not-allowed;
  opacity: 0.8;
}

.button-icon {
  font-size: 20px;
}

@media (max-width: 768px) {
  .content-wrapper {
    flex-direction: column;
    gap: 20px;
  }

  .upload-section, .result-section {
    flex: 1;
  }

  .image-grid {
    flex-direction: column;
    gap: 15px;
  }

  .image-item img {
    max-height: 200px;
  }

  .data-analysis-section {
    padding: 20px;
    margin-top: 20px;
  }

  .section-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }

  .section-header h2 {
    font-size: 20px;
  }

  .data-section {
    padding: 20px;
    margin-bottom: 25px;
  }

  .section-title-wrapper {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .section-icon {
    width: 40px;
    height: 40px;
  }

  .section-icon .el-icon {
    font-size: 20px;
  }

  .section-title {
    font-size: 18px;
  }

  .section-description {
    margin-left: 0;
    margin-top: 0;
  }

  .measurement-card {
    padding: 15px;
  }

  .info-card {
    padding: 15px;
    margin-bottom: 15px;
  }

  .width-summary {
    flex-direction: column;
    gap: 10px;
  }

  .summary-item {
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
  }

  .width-chart {
    gap: 10px;
  }

  .width-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .bar-label {
    min-width: auto;
  }

  .bar-container {
    width: 100%;
  }

  .ratio-chart {
    gap: 12px;
  }

  .ratio-item {
    gap: 6px;
  }

  .ratio-progress {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .progress-bar {
    width: 100%;
  }

  .ratio-value {
    min-width: auto;
    text-align: left;
  }

  .image-row {
    flex-direction: column;
    gap: 10px;
  }

  .image-card {
    margin-bottom: 10px;
  }

  .result-img {
    max-height: 120px;
  }

  .chart-card {
    margin-bottom: 15px;
  }

  .lab-charts {
    margin-bottom: 15px;
  }

  .lab-card {
    padding: 10px;
    margin-bottom: 10px;
  }

  .lab-value {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .lab-label {
    font-size: 14px;
  }

  .lab-number {
    font-size: 14px;
  }

  .chart-title {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  /* 移动端表格样式 */
  .measurement-table {
    font-size: 12px;
  }

  .measurement-table :deep(.el-table__header th) {
    font-size: 12px;
    padding: 8px 4px;
  }

  .measurement-table :deep(.el-table__body td) {
    padding: 8px 4px;
  }

  .table-value {
    font-size: 12px;
    padding: 2px 6px;
  }

  .segment-badge {
    font-size: 11px;
    padding: 4px 8px;
  }
}

.custom-preview-dialog .el-dialog {
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
  background: linear-gradient(135deg, #fff 80%, #f5f7fa 100%);
}

.custom-preview-dialog .el-dialog__body {
  padding: 0 0 24px 0;
}

.preview-img-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  background: #f6f8fa;
  border-radius: 12px;
  padding: 0;
  height: 700px;
}

.preview-img-scroll {
  width: 100%;
  height: 100%;
  max-width: 850px;
  max-height: 700px;
  overflow: auto;
  background: #f6f8fa;
  border-radius: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  box-sizing: border-box;
}

.preview-img-scroll img {
  display: block;
  margin: auto;
}

/* 完全复用 LeafSheathFileTraitFile.vue 的 lab-card 相关样式 */
.lab-charts {
  margin-bottom: 25px;
}
.chart-header {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}
.chart-header h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}
.lab-card {
  margin-bottom: 15px;
  border-radius: 8px;
  transition: all 0.3s;
  border: 1px solid #ebeef5;
  overflow: hidden;
}
.lab-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}
.lab-value {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  align-items: center;
}
.lab-label {
  font-weight: bold;
  color: #303133;
  font-size: 15px;
}
.lab-number {
  font-family: 'Courier New', monospace;
  font-size: 16px;
  color: #409eff;
  font-weight: 600;
  background-color: rgba(64, 158, 255, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
}
.progress-bar {
  height: 12px;
  background-color: #f0f2f5;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 8px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}
.progress {
  height: 100%;
  transition: width 0.8s ease;
  border-radius: 6px;
  background-image: linear-gradient(to right, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0));
}
.channel-description {
  font-size: 12px;
  color: #909399;
  margin-top: 6px;
  text-align: right;
  font-style: italic;
}

/* 宽度图表样式 */
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

/* 比例图表样式 */
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

/* 表格样式 */
.table-container {
  margin-bottom: 0;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding: 10px 15px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 8px;
  border: 1px solid #bae6fd;
}

.table-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
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
  color: #303133 !important; /* 改为深色 */
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

/* 置信度显示样式 */
.confidence-display {
  display: flex;
    flex-direction: column;
    gap: 10px;
  align-items: center;
}

.confidence-value {
  font-size: 24px;
  font-weight: 700;
  color: #67c23a;
  font-family: 'Courier New', monospace;
  background: linear-gradient(135deg, #67c23a, #85ce61);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.confidence-bar {
  width: 100%;
  height: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.confidence-fill {
  height: 100%;
  background: linear-gradient(90deg, #67c23a, #85ce61);
  border-radius: 10px;
  transition: width 1s ease;
  position: relative;
}

.confidence-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  animation: shimmer 2s infinite;
}

/* 处理图片样式 */
.process-images {
  margin-top: 25px;
  padding-top: 20px;
  border-top: 2px solid #f0f2f5;
}
</style>
