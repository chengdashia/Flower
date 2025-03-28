<template>
  <el-scrollbar>
    <el-menu :default-openeds="['1', '2']">
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
            @click="child.action && child.action()"
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

interface MenuItem {
  title: string;
  icon: string;
  children: {
    index: string;
    title: string;
    action: (() => void) | null;
  }[];
}

defineProps({
  menuItems: {
    type: Array as () => MenuItem[],
    required: true
  }
});

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