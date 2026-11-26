<template>
  <div class="orders-page">
    <div class="head">
      <h1 class="page-title">我的订单</h1>
      <span class="hint">下拉可刷新</span>
    </div>

    <van-pull-refresh v-model="refreshing" @refresh="load">
      <div v-if="rows.length" class="list">
        <div v-for="o in rows" :key="o.id" class="order" @click="openDetail(o)">
          <div class="order-head">
            <span class="time">{{ o.orderTime }}</span>
            <span class="status" :class="statusClass(o.status)">{{ statusText(o.status) }}</span>
          </div>
          <div class="order-body">
            <div class="dishes ellipsis">{{ o.orderDishes }}</div>
            <div class="amount">¥{{ Number(o.amount || 0).toFixed(2) }}</div>
          </div>
          <div class="order-foot">
            <span class="no">订单号 {{ o.number }}</span>
            <span class="more">详情 ›</span>
          </div>
        </div>
      </div>
      <van-empty v-else description="还没有订单，去点一单吧" />
    </van-pull-refresh>

    <van-popup v-model:show="detailVisible" position="bottom" round :style="{ maxHeight: '82%' }">
      <div class="detail" v-if="detail">
        <div class="detail-head">
          <h3>{{ statusText(detail.status) }}</h3>
          <span class="close" @click="detailVisible = false">关闭</span>
        </div>
        <div class="detail-meta">
          <p>{{ detail.consignee }} · {{ detail.phone }}</p>
          <p class="addr">{{ detail.address }}</p>
          <p class="muted">下单时间 {{ detail.orderTime }}</p>
        </div>
        <div class="detail-items">
          <div v-for="d in detail.orderDetailList || []" :key="d.id" class="d-row">
            <span>{{ d.name }}<i v-if="d.dishFlavor">（{{ d.dishFlavor }}）</i></span>
            <span class="muted">x{{ d.number }}</span>
            <span class="price">¥{{ (Number(d.amount) * Number(d.number)).toFixed(2) }}</span>
          </div>
        </div>
        <div class="detail-total">
          <span>实付</span>
          <span class="price big">¥{{ Number(detail.amount || 0).toFixed(2) }}</span>
        </div>
        <p class="remark" v-if="detail.remark">备注：{{ detail.remark }}</p>
        <div class="actions" v-if="[1, 2].includes(detail.status)">
          <van-button block round plain type="primary" color="#ff6b35" @click="cancelOrder(detail)">取消订单</van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { showConfirmDialog, showToast } from 'vant'
import http from '../api/http'

const rows = ref([])
const refreshing = ref(false)
const detailVisible = ref(false)
const detail = ref(null)

const statusMap = {
  1: ['待付款', 'warn'],
  2: ['待接单', 'warn'],
  3: ['已接单', 'run'],
  4: ['派送中', 'run'],
  5: ['已完成', 'ok'],
  6: ['已取消', 'gray']
}
const statusText = (s) => (statusMap[s] || ['未知'])[0]
const statusClass = (s) => (statusMap[s] || [])[1] || ''

async function load() {
  try {
    const data = await http.get('/user/order/historyOrders', { params: { page: 1, pageSize: 10 } })
    rows.value = data.records || []
  } finally {
    refreshing.value = false
  }
}

async function openDetail(o) {
  detail.value = await http.get(`/user/order/orderDetail/${o.id}`)
  detailVisible.value = true
}

async function cancelOrder(o) {
  await showConfirmDialog({ title: '取消订单', message: '确定要取消这一单吗？' })
  await http.put(`/user/order/cancel/${o.id}`, null, { params: { cancelReason: '用户主动取消' } })
  showToast('已取消')
  detailVisible.value = false
  load()
}

onMounted(load)
</script>

<style scoped>
.orders-page { padding: 18px 14px 80px; }
.head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12px; }
.hint { font-size: 11px; color: var(--muted); }
.list { display: grid; gap: 10px; }
.order { background: #fff; border: 1px solid var(--line); border-radius: 14px; padding: 13px 14px; }
.order-head { display: flex; justify-content: space-between; align-items: center; }
.time { font-size: 11px; color: var(--muted); }
.status { font-size: 12px; font-weight: 700; }
.status.warn { color: #f59e0b; }
.status.run { color: #2563eb; }
.status.ok { color: #16a34a; }
.status.gray { color: #9ca3af; }
.order-body { display: flex; justify-content: space-between; gap: 12px; margin: 9px 0 8px; align-items: center; }
.dishes { flex: 1; font-size: 13px; color: #374151; }
.amount { font-size: 17px; font-weight: 800; }
.order-foot { display: flex; justify-content: space-between; border-top: 1px dashed #f0edf0; padding-top: 8px; font-size: 11px; color: var(--muted); }
.more { color: var(--brand); }

.detail { padding: 20px 16px 24px; }
.detail-head { display: flex; justify-content: space-between; align-items: center; }
.detail-head h3 { margin: 0; font-size: 18px; }
.close { font-size: 12px; color: var(--muted); }
.detail-meta { margin: 12px 0; font-size: 12px; color: #4b5563; line-height: 1.7; }
.addr { color: #6b7280; }
.muted { color: var(--muted); }
.detail-items { border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); padding: 8px 0; }
.d-row { display: flex; justify-content: space-between; gap: 8px; padding: 7px 0; font-size: 13px; }
.d-row i { color: var(--muted); font-style: normal; font-size: 11px; }
.detail-total { display: flex; justify-content: space-between; align-items: baseline; padding: 12px 0; font-size: 13px; }
.price { color: var(--brand); }
.price.big { font-size: 20px; font-weight: 800; }
.remark { font-size: 12px; color: #6b7280; background: #fafbfc; padding: 9px 11px; border-radius: 10px; }
.actions { margin-top: 14px; }
</style>
