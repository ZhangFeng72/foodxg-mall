import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/menu' },
  { path: '/menu', component: () => import('../views/Menu.vue') },
  { path: '/cart', component: () => import('../views/Cart.vue') },
  { path: '/checkout', component: () => import('../views/Checkout.vue') },
  { path: '/orders', component: () => import('../views/Orders.vue') }
]

const router = createRouter({ history: createWebHashHistory(), routes })

export default router
