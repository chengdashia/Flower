import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';

// 创建菜单配置函数，接收router作为参数
export const createMenuItems = (router) => [
  {
    title: '识别功能',
    icon: 'Aim',
    children: [
      { index: '1-1', title: '菊花形状识别', action: () => router.push({ name: 'home' }) },
      { index: '1-2', title: '菊花性状统计', action: () => router.push({ name: 'juhuaStats' }) },
      { index: '1-3', title: '玉米性状统计', action: () => router.push({ name: 'juhuaStats' }) },
    ]
  },
  {
    title: '用户中心',
    icon: 'Menu',
    children: [
      { index: '2-1', title: '历史记录', action: () => router.push({ name: 'home' }) },
      { index: '2-2', title: '个人信息', action: () => ElMessage.info('查看个人资料') },
    ]
  }
];