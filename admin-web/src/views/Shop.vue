<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h2 class="page-title">店铺设置</h2>
        <p class="page-sub">营业状态写入 Redis，用户端会即时看到“已打烊”，无法下单。</p>
      </div>
    </div>

    <div class="card shop-card">
      <div class="shop-left">
        <div class="badge" :class="open ? 'on' : 'off'">{{ open ? '营业中' : '已打烊' }}</div>
        <h3>{{ open ? '店铺正在接待顾客' : '店铺已停止接单' }}</h3>
        <p>
          {{ open
            ? '小程序与 H5 可以正常浏览菜单、加入购物车并提交订单。'
            : '用户端仍可浏览菜单，但提交订单会被后端拦截。' }}
        </p>
      </div>
      <div class="shop-right">
        <el-switch
          v-model="open"
          size="large"
          :loading="saving"
          active-text="营业"
          inactive-text="打烊"
          @change="change"
        />
      </div>
    </div>

    <div class="card tips">
      <h4>上线检查</h4>
      <ul>
        <li>MySQL 3307 实例与 Redis 6379 必须在运行，否则接单和下单会失败。</li>
        <li>支付为模拟支付：提交订单后调用支付接口即视为已付款，不接微信商户号。</li>
        <li>小程序端需在微信开发者工具中勾选“不校验合法域名”，才能访问本机 8080。</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import http from '../api/http'

const open = ref(true)
const saving = ref(false)

async function load() {
  const status = await http.get('/admin/shop/status')
  open.value = status === 1
}

async function change(val) {
  saving.value = true
  try {
    await http.put(`/admin/shop/${val ? 1 : 0}`)
    ElMessage.success(val ? '已开始营业' : '已打烊')
  } catch (e) {
    open.value = !val
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.shop-card { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 26px 28px; }
.badge { display: inline-block; padding: 5px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; }
.badge.on { background: #ecfdf3; color: #16a34a; }
.badge.off { background: #f3f4f6; color: #6b7280; }
.shop-left h3 { margin: 12px 0 6px; font-size: 19px; }
.shop-left p { margin: 0; color: var(--muted); max-width: 560px; line-height: 1.7; }
.tips h4 { margin: 0 0 8px; font-size: 15px; }
.tips ul { margin: 0; padding-left: 18px; color: var(--muted); line-height: 1.9; }
</style>
