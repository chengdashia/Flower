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

// 引入 defineProps
const props = defineProps<{
  data: ChartData[];
}>();

const chart = ref<HTMLDivElement | null>(null);
const subChart = ref<HTMLDivElement | null>(null);
const hasSubData = ref(false);
const subData = ref<ChartData[]>([]);

const initChart = () => {
  if (chart.value) {
    const myChart = echarts.init(chart.value);

    myChart.setOption({
      tooltip: {
        trigger: 'item'
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
            formatter: '{b}\n{d}%'
          },
          labelLine: {
            show: true
          }
        }
      ]
    });

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
        trigger: 'item'
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
            formatter: '{b}\n{d}%'
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
</script>