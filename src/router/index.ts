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
          component: () => import('../views/juhua/JuhuaTrait.vue')
        },
        {
          path: '/juhua-stats',
          name: 'juhuaStats',
          component: () => import('../views/juhua/JuhuaStats.vue')
        },
        {
          path: '/corn-trait',
          name: 'cornTrait',
          component: () => import('../views/corn/CornTrait.vue')
        },
        {
          path: '/filament-trait',
          name: 'filamentTrait',
          component: () => import('../views/corn/FilamentTrait.vue')
        },
        {
          path: '/leaf-sheath-trait',
          name: 'leafSheathTrait',
          component: () => import('../views/corn/LeafSheathTrait.vue')
        },
        {
          path: '/corn-analysis',
          name: 'cornAnalysis',
          component: () => import('../views/corn/CornAnalysis.vue')
        },
        {
          path: '/user-center',
          name: 'userCenter',
          component: () => import('../views/user/UserCenter.vue')
        },
        {
          path: '/history',
          name: 'history',
          component: () => import('../views/user/HistoryView.vue')
        },
      ]
    },
    {
      path: '/login',
      component: () => import('../views/LoginView.vue')
    }
  ]
})

// 全局前置守卫：在导航被确认之前，检查用户是否已登录
router.beforeEach((to, from, next) => {
  // 获取token，判断用户是否已登录
  const token = window.sessionStorage.getItem('token')
  
  // 如果访问的是登录页面，直接放行
  if (to.path === '/login') {
    next()
  } else {
    // 如果用户已登录，允许访问
    if (token) {
      next()
    } else {
      // 用户未登录，重定向到登录页面
      next('/login')
    }
  }
})

export default router
