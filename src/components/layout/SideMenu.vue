<template>
  <el-scrollbar>
    <el-menu router :default-openeds="['1', '2']" :default-active="activeMenu">
      <el-sub-menu v-for="(item, index) in menuItems" :key="index" :index="(index + 1).toString()">
        <template #title>
          <el-icon>
            <component :is="getIconComponent(item.icon)" />
          </el-icon>
          {{ item.title }}
        </template>
        <el-menu-item-group>
          <el-menu-item 
            v-for="(child, childIndex) in item.children" 
            :key="childIndex" 
            :index="child.index"
          >
            {{ child.title }}
          </el-menu-item>
        </el-menu-item-group>
      </el-sub-menu>
    </el-menu>
  </el-scrollbar>
</template>

<script setup lang="ts">
import { Menu as IconMenu, Aim } from '@element-plus/icons-vue';
import { useRoute } from 'vue-router';
import { ref, watchEffect } from 'vue';

interface MenuItem {
  title: string;
  icon: string;
  children: {
    index: string;
    title: string;
    action: (() => void) | null;
  }[];
}

const props = defineProps({
  menuItems: {
    type: Array as () => MenuItem[],
    required: true
  }
});

const route = useRoute();
const activeMenu = ref(route.path);

watchEffect(() => {
  activeMenu.value = route.path;
});

// 自定义菜单配置，点击菜单项时切换组件而不是跳转路由
const menuItems = [
  {
    title: '识别功能',
    icon: 'Aim',
    children: [
      { index: '/juhua-trait', title: '菊花形状识别' },
      { index: '/juhua-stats', title: '菊花形状统计' },
      { index: '/corn-trait', title: '玉米形状识别' },
    ]
  },
  {
    title: '统计中心',
    icon: 'Menu',
    children: [
      { index: '/history', title: '识别历史' },
      { index: '/user-center', title: '个人中心' },
    ]
  }
  // {
  //   title: '识别功能',
  //   icon: 'Aim',
  //   children: [
  //     { index: '1-1', title: '菊花形状识别', action: () => currentComponent.value = null },
  //     { index: '1-2', title: '菊花形状统计', action: () => currentComponent.value = markRaw(JuhuaStats) },
  //     { index: '1-3', title: '玉米形状识别', action: () => currentComponent.value = markRaw(CornTrait) },
  //   ]
  // },
  // {
  //   title: '统计中心',
  //   icon: 'Menu',
  //   children: [
  //     { index: '2-1', title: '识别历史', action: () => currentComponent.value = markRaw(HistoryView) },
  //     { index: '2-2', title: '个人中心', action: () => currentComponent.value = markRaw(UserCenter) },
  //   ]
  // }
];

function getIconComponent(iconName: string) {
  const iconMap: Record<string, any> = {
    'Menu': IconMenu,
    'Aim': Aim
  };
  
  return iconMap[iconName] || IconMenu;
}
</script>

<style scoped>
.el-menu {
  border-right: none;
}
</style>