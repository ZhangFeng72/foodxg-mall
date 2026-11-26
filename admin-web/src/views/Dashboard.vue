<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h2 class="page-title">{{ greeting }}，{{ name }}</h2>
        <p class="page-sub">今天店铺的整体经营情况，数据实时取自 MySQL。</p>
      </div>
      <el-button :icon="Refresh" :loading="loading" @click="load">刷新</el-button>
    </div>

    <div class="kpis">
      <div class="kpi" v-for="k in kpis" :key="k.label">
        <div class="kpi-icon" :style="{ background: k.bg, color: k.color }">
          <el-icon :size="20"><component :is="k.icon" /></el-icon>
        </div>
        <div>
          <div class="kpi-label">{{ k.label }}</div>
          <div class="kpi-value">
            <span v-if="k.money" class="unit">¥</span>{{ k.value }}<span v-if="k.suffix" class="suffix">{{ k.suffix }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="grid">
      <div class="card">
        <div class="card-head">
          <h3>订单概览</h3>
          <span class="page-sub">共 {{ orders.allOrders || 0 }} 单</span>
        </div>
        <div class="bars">
          <div class="bar-row" v-for="s in statusRows" :key="s.label">
            <span class="bar-label">{{ s.label }}</span>
            <div class="bar-track"><div class="bar-fill" :style="{ width: s.pct + '%', background: s.color }" /></div>
            <span class="bar-num">{{ s.value }}</span>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-head"><h3>商品概览</h3></div>
        <div class="goods">
          <div class="goods-item">
            <div class="goods-num">{{ dishes.sold || 0 }}</div>
            <div class="goods-label">在售菜品</div>
            <div class="goods-sub">停售 {{ dishes.discontinued || 0 }}</div>
          </div>
          <div class="goods-item">
            <div class="goods-num">{{ setmeals.sold || 0 }}</div>
            <div class="goods-label">在售套餐</div>
            <div class="goods-sub">停售 {{ setmeals.discontinued || 0 }}</div>
          </div>
        </div>
        <div class="quick">
          <router-link to="/orders" class="quick-item">
            <el-icon><Tickets /></el-icon>去接单
          </router-link>
          <router-link to="/dishes" class="quick-item">
            <el-icon><Dish /></el-icon>管理菜品
          </router-link>
          <router-link to="/shop" class="quick-item">
            <el-icon><Shop /></el-icon>营业设置
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import http from '../api/http'

const name = localStorage.getItem('admin_name') || '管理员'
const loading = ref(false)

const biz = ref({})
const orders = ref({})
const dishes = ref({})
const setmeals = ref({})

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '夜深了'
  if (h < 11) return '早上好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})

const kpis = computed(() => [
  { label: '今日营业额', value: fmt(biz.value.turnover), money: true, icon: 'Money', bg: '#fff2ec', color: '#e25420' },
  { label: '有效订单', value: biz.value.validOrderCount ?? 0, suffix: ' 单', icon: 'Tickets', bg: '#eef4ff', color: '#2563eb' },
  { label: '订单完成率', value: pct(biz.value.orderCompletionRate), suffix: '%', icon: 'TrendCharts', bg: '#ecfdf3', color: '#16a34a' },
  { label: '平均客单价', value: fmt(biz.value.unitPrice), money: true, icon: 'Wallet', bg: '#f5f0ff', color: '#7c3aed' }
])

const statusRows = computed(() => {
  const all = Number(orders.value.allOrders || 0)
  const rows = [
    { label: '待接单', value: orders.value.waitingOrders || 0, color: '#f59e0b' },
    { label: '派送中', value: orders.value.deliveredOrders || 0, color: '#3b82f6' },
    { label: '已完成', value: orders.value.completedOrders || 0, color: '#16a34a' },
    { label: '已取消', value: orders.value.cancelledOrders || 0, color: '#9ca3af' }
  ]
  return rows.map((r) => ({ ...r, pct: all > 0 ? Math.round((Number(r.value) / all) * 100) : 0 }))
})

function fmt(v) {
  const n = Number(v || 0)
  return n.toFixed(2)
}
function pct(v) {
  return (Number(v || 0) * 100).toFixed(1)
}

async function load() {
  loading.value = true
  try {
    const [b, o, d, s] = await Promise.all([
      http.get('/admin/workspace/businessData'),
      http.get('/admin/workspace/overviewOrders'),
      http.get('/admin/workspace/overviewDishes'),
      http.get('/admin/workspace/overviewSetmeals')
    ])
    biz.value = b || {}
    orders.value = o || {}
    dishes.value = d || {}
    setmeals.value = s || {}
  } catch (e) {
    /* 拦截器已提示 */
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; }

.kpi {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 16px 18px;
  display: flex;
  gap: 14px;
  align-items: center;
}

.kpi-icon { width: 42px; height: 42px; border-radius: 12px; display: grid; place-items: center; flex: none; }
.kpi-label { color: var(--muted); font-size: 12px; }
.kpi-value { font-size: 26px; font-weight: 800; letter-spacing: 0.4px; margin-top: 2px; }
.unit { font-size: 15px; margin-right: 2px; }
.suffix { font-size: 13px; font-weight: 500; color: var(--muted); margin-left: 2px; }

.grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 14px; margin-top: 14px; }
.card-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 14px; }
.card-head h3 { margin: 0; font-size: 16px; }

.bars { display: grid; gap: 14px; }
.bar-row { display: grid; grid-template-columns: 56px 1fr 40px; align-items: center; gap: 10px; }
.bar-label { color: var(--muted); font-size: 13px; }
.bar-track { height: 9px; background: #f1f3f6; border-radius: 999px; overflow: hidden; }
.bar-fill { height: 100%; border-radius: 999px; transition: width 0.4s ease; }
.bar-num { text-align: right; font-weight: 600; font-size: 13px; }

.goods { display: flex; gap: 12px; }
.goods-item { flex: 1; background: #fafbfc; border-radius: 12px; padding: 14px; text-align: center; }
.goods-num { font-size: 26px; font-weight: 800; color: var(--ink); }
.goods-label { color: var(--muted); font-size: 12px; margin-top: 2px; }
.goods-sub { color: #9aa1ab; font-size: 11px; margin-top: 4px; }

.quick { display: flex; gap: 8px; margin-top: 14px; flex-wrap: wrap; }
.quick-item {
  flex: 1;
  min-width: 96px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 8px;
  border-radius: 10px;
  background: var(--brand-soft);
  color: var(--brand-dark);
  text-decoration: none;
  font-size: 13px;
  font-weight: 600;
}
.quick-item:hover { background: #ffe6db; }

@media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }
</style>
