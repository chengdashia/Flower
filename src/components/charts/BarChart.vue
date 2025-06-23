<template>
  <v-chart :option="chartOption" :autoresize="true" :style="style" />
</template>

<script setup>
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { CanvasRenderer } from 'echarts/renderers'
import { TitleComponent, TooltipComponent, GridComponent, LegendComponent } from 'echarts/components'

// 注册必要的组件
use([CanvasRenderer, BarChart, TitleComponent, TooltipComponent, GridComponent, LegendComponent])

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  categories: {
    type: Array,
    default: () => []
  },
  data: {
    type: Array,
    default: () => []
  },
  style: {
    type: Object,
    default: () => ({ width: '100%', height: '400px' })
  }
})

const chartOption = computed(() => ({
  title: { 
    text: props.title, 
    left: 'center' 
  },
  tooltip: { 
    trigger: 'axis', 
    axisPointer: { 
      type: 'shadow' 
    },
    formatter: params => {
      // params 是数组
      if (Array.isArray(params) && params.length > 0) {
        return `${params[0].axisValue}<br/>次数: ${params[0].data}`
      }
      return ''
    }
  },
  grid: { 
    left: '3%', 
    right: '4%', 
    bottom: '3%', 
    containLabel: true 
  },
  xAxis: {
    type: 'category',
    data: props.categories,
    axisLabel: { rotate: 45 },
  },
  yAxis: {
    type: 'value',
    axisLabel: { formatter: '{value}' },
  },
  series: [
    {
      name: '次数',
      type: 'bar',
      data: props.data,
      emphasis: { focus: 'series' },
      itemStyle: { color: '#73C9E6' },
    },
  ],
}))
</script>