<script setup lang="ts">
import { ref } from 'vue';
import { Menu as StarFilled } from "@element-plus/icons-vue";

import PieChart from '../../components/charts/PieChart.vue';
const chartData = ref([
  { name: '性状0', value: 20, sideData: [{ name: '细分性状0-1', value: 12 }, { name: '细分性状0-2', value: 8 }] },
  { name: '性状1', value: 15, sideData: [{ name: '细分性状1-1', value: 9 }, { name: '细分性状1-2', value: 6 }] },
  { name: '性状2', value: 30, sideData: [{ name: '细分性状2-1', value: 15 }, { name: '细分性状2-2', value: 15 }] },
  { name: '性状3', value: 25, sideData: [{ name: '细分性状3-1', value: 10 }, { name: '细分性状3-2', value: 15 }] },
  { name: '性状4', value: 10, sideData: [{ name: '细分性状4-1', value: 5 }, { name: '细分性状4-2', value: 5 }] }
]);
</script>

    
<template #main>
  <div>
    <h2>菊花性状权重分析</h2>
    <PieChart :data="chartData" />
  </div>
  <el-divider>
    <el-icon><star-filled /></el-icon>
  </el-divider>
</template>


<style scoped>
/* 保留必要的样式，其他样式移至相应组件中 */
h2 {
  margin-bottom: 20px;
  color: #565656;
}
</style>
