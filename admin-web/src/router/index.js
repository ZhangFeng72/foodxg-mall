import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/login', component: () => import('../views/Login.vue'), meta: { title: '登录' } },
  {
    path: '/',
    component: () => import('../views/Layout.vue'),
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', component: () => import('../views/Dashboard.vue'), meta: { title: '工作台' } },
      { path: 'orders', component: () => import('../views/Orders.vue'), meta: { title: '订单管理' } },
      { path: 'dishes', component: () => import('../views/Dishes.vue'), meta: { title: '菜品管理' } },
      { path: 'setmeals', component: () => import('../views/Setmeals.vue'), meta: { title: '套餐管理' } },
      { path: 'categories', component: () => import('../views/Categories.vue'), meta: { title: '分类管理' } },
      { path: 'employees', component: () => import('../views/Employees.vue'), meta: { title: '员工管理' } },
      { path: 'shop', component: () => import('../views/Shop.vue'), meta: { title: '店铺设置' } }
    ]
  }
]

const router = createRouter({ history: createWebHashHistory(), routes })

router.beforeEach((to) => {
  const token = localStorage.getItem('admin_token')
  if (to.path !== '/login' && !token) return '/login'
  if (to.path === '/login' && token) return '/dashboard'
  return true
})

export default router
