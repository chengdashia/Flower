<template>
  <el-scrollbar>
    <el-menu 
      router 
      :unique-opened="true"
      :default-active="activeMenu"
      :collapse="collapse"
    >
      <template v-for="(item, index) in menuItems" :key="index">
        <template v-if="(item as MenuItem).children && (item as MenuItem).children.length > 0">
          <el-sub-menu :index="(index + 1).toString()">
            <template #title>
              <el-icon v-if="(item as MenuItem).icon">
                <component :is="getIconComponent((item as MenuItem).icon!)" />
              </el-icon>
              <span>{{ (item as MenuItem).title }}</span>
            </template>
            <template v-for="(child, childIndex) in (item as MenuItem).children" :key="childIndex">
              <template v-if="child.children && child.children.length > 0">
                <el-sub-menu :index="`${index + 1}-${childIndex + 1}`">
                  <template #title>
                    <el-icon v-if="child.icon">
                      <component :is="getIconComponent(child.icon)" />
                    </el-icon>
                    <span>{{ child.title }}</span>
                  </template>
                  <el-menu-item 
                    v-for="(grandChild, grandChildIndex) in child.children" 
                    :key="grandChildIndex"
                    :index="grandChild.index"
                  >
                    <el-icon v-if="grandChild.icon">
                      <component :is="getIconComponent(grandChild.icon)" />
                    </el-icon>
                    <span>{{ grandChild.title }}</span>
                  </el-menu-item>
                </el-sub-menu>
              </template>
              <el-menu-item 
                v-else 
                :index="child.index"
              >
                <el-icon v-if="child.icon">
                  <component :is="getIconComponent(child.icon)" />
                </el-icon>
                <span>{{ child.title }}</span>
              </el-menu-item>
            </template>
          </el-sub-menu>
        </template>
        <el-menu-item 
          v-else 
          :index="(item as MenuItem).index"
        >
          <el-icon v-if="(item as MenuItem).icon">
            <component :is="getIconComponent((item as MenuItem).icon!)" />
          </el-icon>
          <span>{{ (item as MenuItem).title }}</span>
        </el-menu-item>
      </template>
    </el-menu>
  </el-scrollbar>
</template>

<script setup lang="ts">
import { Menu as IconMenu, Aim, DataLine, DataAnalysis } from '@element-plus/icons-vue';
import { useRoute } from 'vue-router';
import { ref, watchEffect } from 'vue';

// 定义菜单项接口
interface MenuItem {
  title: string;
  icon?: string;
  index?: string;
  children?: MenuItem[];
  action?: (() => void) | null;
}

const props = defineProps({
  menuItems: {
    type: Array as () => MenuItem[],
    required: true
  },
  collapse: {
    type: Boolean,
    default: false
  }
});

const route = useRoute();
const activeMenu = ref(route.path);

watchEffect(() => {
  activeMenu.value = route.path;
});

// 示例菜单配置
const menuItems = [
  {
    title: '识别功能',
    icon: 'Aim',
    children: [
      { 
        title: '菊花识别',
        icon: 'Aim',
        children: [
          { index: '/juhua-trait', title: '形状识别' },
          { index: '/juhua-stats', title: '形状统计' }
        ]
      },
      { 
        title: '玉米识别',
        icon: 'Aim',
        children: [
          { index: '/corn-filament', title: '花丝识别' },
          { index: '/corn-filament-nature', title: '花丝原位识别' },
          { index: '/leaf-sheath-trait', title: '叶鞘识别' },
        ]
      },

    ]
  },
  {
    title: '分析功能',
    icon: 'DataAnalysis',
    children: [
      {
        title: '菊花分析',
        icon: 'DataLine',
        children: [

        ]
      },
      {
        title: '玉米分析',
        icon: 'DataLine',
        children: [
          { index: '/corn-shape-analysis', title: '形状分析' },
          { index: '/corn-overall-analysis', title: '整体分析' },
          { index: '/suihang-analysis', title: '穗行检测' },
          { index: '/top-color-analysis', title: '顶部颜色分析' },
          { index: '/rachis-color-analysis', title: '穗轴颜色分析' },
          { index: '/appearance-grade-analysis', title: '外形分级检测' },
          { index: '/height-width-analysis', title: '长度/宽度测量' },
        ]
      },

    ]
  },
  {
    title: '用户中心',
    icon: 'Menu',
    children: [
      { index: '/history', title: '识别历史' },
      { index: '/user-center', title: '个人中心' }
    ]
  }
];

function getIconComponent(iconName: string) {
  const iconMap: Record<string, any> = {
    'Menu': IconMenu,
    'Aim': Aim,
    'DataLine': DataLine,
    'DataAnalysis': DataAnalysis

  };
  
  return iconMap[iconName] || IconMenu;
}
</script>

<style scoped>
.el-menu {
  border-right: none;
}

/* 一级菜单样式 */
:deep(.el-sub-menu .el-sub-menu__title) {
  padding-left: 20px !important;
  font-weight: 500;
  font-size: 1.1em;
}

/* 二级菜单样式 */
:deep(.el-sub-menu .el-sub-menu .el-sub-menu__title) {
  padding-left: 40px !important;
  font-size: 1em;
}

/* 三级菜单样式 */
:deep(.el-sub-menu .el-sub-menu .el-menu-item) {
  padding-left: 60px !important;
  font-size: 0.95em;
}

/* 二级菜单项样式 */
:deep(.el-sub-menu .el-menu-item) {
  padding-left: 40px !important;
  font-size: 1em;
}

:deep(.el-sub-menu .el-menu-item) {
  min-width: 200px;
}

:deep(.el-menu--collapse) {
  width: 64px;
}

/* 激活状态样式 */
:deep(.el-menu-item.is-active) {
  background-color: var(--el-menu-hover-bg-color);
  font-weight: 500;
}

:deep(.el-sub-menu.is-active > .el-sub-menu__title) {
  color: var(--el-menu-active-color);
  font-weight: 500;
}

/* 悬停效果 */
:deep(.el-menu-item:hover),
:deep(.el-sub-menu__title:hover) {
  background-color: var(--el-menu-hover-bg-color);
}

/* 图标样式 */
:deep(.el-icon) {
  margin-right: 12px;
  width: 20px;
  height: 20px;
  vertical-align: middle;
}

/* 菜单组标题 */
:deep(.el-menu-item-group__title) {
  padding: 0;
}

/* 子菜单背景色区分 */
:deep(.el-sub-menu .el-menu) {
  background-color: var(--el-menu-bg-color);
}

/* 菜单项文字样式 */
:deep(.el-menu-item span),
:deep(.el-sub-menu__title span) {
  vertical-align: middle;
}
</style>