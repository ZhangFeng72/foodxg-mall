<template>
  <div class="app">
    <router-view />
    <van-tabbar route safe-area-inset-bottom active-color="#ff6b35" inactive-color="#9aa1ab" placeholder>
      <van-tabbar-item replace to="/menu" icon="shop-o">点餐</van-tabbar-item>
      <van-tabbar-item replace to="/cart" icon="shopping-cart-o" :badge="cartCount || ''">购物车</van-tabbar-item>
      <van-tabbar-item replace to="/orders" icon="orders-o">订单</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { ensureLogin, refreshCartCount, cartCount } from './api/http'

onMounted(async () => {
  await ensureLogin()
  await refreshCartCount()
})
</script>
