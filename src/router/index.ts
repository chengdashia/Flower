import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(process.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login',
    },
    {
      path: '/home',
      name: 'home',
      // 确保这个路径指向您项目中实际存在的文件
      component: () => import('../views/HomeView.vue')
    },
    {
      path: '/juhua-stats',
      name: 'juhuaStats',
      component: () => import('../views/JuhuaStats.vue')
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue')
    },
    // 如果您已经创建了这些组件，可以取消注释
    // {
    //   path: '/flower/statistics',
    //   name: 'flowerStatistics',
    //   component: () => import('../views/flower/statistics/FlowerStatistics.vue')
    // },
    // {
    //   path: '/user/history',
    //   name: 'userHistory',
    //   component: () => import('../views/user/History.vue')
    // },
    // {
    //   path: '/user/profile',
    //   name: 'userProfile',
    //   component: () => import('../views/user/Profile.vue')
    // }
  ]
})

export default router
