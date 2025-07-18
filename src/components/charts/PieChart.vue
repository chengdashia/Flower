<template>
  <div>
    <div ref="chart" :style="{ width: '100%', height: '500px' }"></div>
    <div ref="subChart" :style="{ width: '100%', height: '500px', marginTop: '20px', display: hasSubData ? 'block' : 'none' }"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import * as echarts from 'echarts';

interface ChartData {
  name: string;
  value: number;
  sideData?: ChartData[];
}

const props = defineProps<{
  data: ChartData[];
  option?: any;
}>();

const chart = ref<HTMLDivElement | null>(null);
const subChart = ref<HTMLDivElement | null>(null);
const hasSubData = ref(false);
const subData = ref<ChartData[]>([]);

// 深度合并工具
function deepMerge(target: any, source: any) {
  for (const key in source) {
    if (
      Object.prototype.hasOwnProperty.call(source, key)
      && typeof source[key] === 'object'
      && source[key] !== null
      && !Array.isArray(source[key])
    ) {
      if (!target[key]) target[key] = {};
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

const getMergedOption = () => {
  // 默认配置
  const defaultOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}次'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '性状权重',
        type: 'pie',
        radius: ['30%', '60%'],
        roseType: 'radius',
        data: props.data,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: '{b}\n{c}次'
        },
        labelLine: {
          show: true
        }
      }
    ]
  };
  // 合并外部option
  let merged = deepMerge(JSON.parse(JSON.stringify(defaultOption)), props.option || {});
  // series.data始终用props.data
  if (merged.series && merged.series[0]) {
    merged.series[0].data = props.data;
  }
  return merged;
};

const initChart = () => {
  if (chart.value) {
    const myChart = echarts.init(chart.value);
    myChart.setOption(getMergedOption());
    myChart.on('click', (params: any) => {
      if (params.data.sideData) {
        subData.value = params.data.sideData;
        hasSubData.value = true;
        updateSubChart();
      }
    });
    window.addEventListener('resize', () => {
      myChart.resize();
    });
  }
};

const initSubChart = () => {
  if (subChart.value) {
    const mySubChart = echarts.init(subChart.value);
    window.addEventListener('resize', () => {
      mySubChart.resize();
    });
  }
};

const updateSubChart = () => {
  if (subChart.value) {
    const mySubChart = echarts.init(subChart.value);
    mySubChart.setOption({
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}次'
      },
      legend: {
        orient: 'vertical',
        left: 'left'
      },
      series: [
        {
          name: '细分性状权重',
          type: 'pie',
          radius: ['30%', '60%'],
          roseType: 'radius',
          data: subData.value,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: true,
            formatter: '{b}\n{c}次'
          },
          labelLine: {
            show: true
          }
        }
      ]
    });
  }
};

onMounted(() => {
  initChart();
  initSubChart();
});

watch(() => props.data, () => {
  initChart();
  hasSubData.value = false;
});
watch(() => props.option, () => {
  initChart();
});
</script>