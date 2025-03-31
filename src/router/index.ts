import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(process.env.BASE_URL),
  routes: [

    {
      path: '/',
      name: 'home',
      // 确保这个路径指向您项目中实际存在的文件
      component: () => import('../views/HomeView.vue'),
      redirect: '/juhua-trait',
      children: [
        {
          path: '/juhua-trait',
          name: 'juhuaTrait',
          component: () => import('../views/JuhuaTrait.vue')
        },
        {
          path: '/juhua-stats',
          name: 'juhuaStats',
          component: () => import('../views/JuhuaStats.vue')
        },
        {
          path: '/corn-trait',
          name: 'cornTrait',
          component: () => import('../views/CornTrait.vue')
        },
        // {
        //   path: '/login',
        //   name: 'login',
        //   component: () => import('../views/LoginView.vue')
        // },
        {
          path: '/user-center',
          name: 'userCenter',
          component: () => import('../views/UserCenter.vue')
        },
        {
          path: '/history',
          name: 'history',
          component: () => import('../views/HistoryView.vue')
        },
      ]
    },
    {
      path: '/login',
      component: () => import('../views/LoginView.vue')
    },

    // 如果您已经创建了这些组件，可以取消注释
    // {
    //   path: '/flower/statistics',
    //   name: 'flowerStatistics',
    //   component: () => import('../views/flower/statistics/FlowerStatistics.vue')
    // }
  ]
})

export default router
