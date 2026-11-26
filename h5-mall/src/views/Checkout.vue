<template>
  <div class="checkout">
    <div class="topbar">
      <van-icon name="arrow-left" @click="$router.back()" />
      <span>确认订单</span>
      <span style="width: 16px" />
    </div>

    <div class="card addr">
      <div class="addr-head">
        <span class="label">配送地址</span>
        <span class="edit" v-if="address" @click="editMode = true">修改</span>
      </div>

      <div v-if="address && !editMode">
        <div class="addr-line">
          <b>{{ address.consignee }}</b>
          <span class="phone">{{ address.phone }}</span>
        </div>
        <div class="addr-detail">{{ address.provinceName }}{{ address.cityName }}{{ address.districtName }}{{ address.detail }}</div>
      </div>

      <div v-else class="form">
        <div class="field"><span>收货人</span><input v-model="form.consignee" placeholder="姓名" /></div>
        <div class="field"><span>手机号</span><input v-model="form.phone" placeholder="11 位手机号" maxlength="11" /></div>
        <div class="field"><span>详细地址</span><input v-model="form.detail" placeholder="学校 / 楼栋 / 门牌" /></div>
        <button class="save" :disabled="savingAddr" @click="saveAddress">保存并使用</button>
      </div>
    </div>

    <div class="card goods">
      <div class="goods-head">
        <span>商品清单</span>
        <span class="count">共 {{ totalCount }} 件</span>
      </div>
      <div v-for="it in items" :key="it.id" class="g-row">
        <div class="g-name">
          {{ it.name }}
          <span class="flavor" v-if="it.dishFlavor">{{ it.dishFlavor }}</span>
        </div>
        <div class="g-right">x{{ it.number }}<span class="g-amount">¥{{ (Number(it.amount) * Number(it.number)).toFixed(2) }}</span></div>
      </div>
      <div class="fee"><span>打包费</span><span>¥0.00</span></div>
      <div class="fee total"><span>合计</span><span class="price">¥{{ amount.toFixed(2) }}</span></div>
    </div>

    <div class="card remark">
      <div class="goods-head"><span>订单备注</span></div>
      <textarea v-model="remark" rows="2" maxlength="100" placeholder="口味、餐具等要求（选填）" />
    </div>

    <div class="pay-bar">
      <div>
        <div class="pay-label">待支付</div>
        <div class="pay-value">¥{{ amount.toFixed(2) }}</div>
      </div>
      <button class="pay" :disabled="submitting" @click="submit">
        {{ submitting ? '提交中…' : '模拟支付并下单' }}
      </button>
    </div>

    <van-popup v-model:show="doneVisible" round :style="{ padding: '28px 24px', width: '78%' }">
      <div class="done">
        <van-icon name="checked" size="44" color="#16a34a" />
        <h3>下单成功</h3>
        <p>订单号 {{ orderNo }}</p>
        <p class="done-tip">已模拟支付，可在“订单”中查看进度</p>
        <van-button type="primary" color="#ff6b35" block round @click="goOrders">查看订单</van-button>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import http, { refreshCartCount } from '../api/http'

const router = useRouter()
const items = ref([])
const address = ref(null)
const editMode = ref(false)
const remark = ref('')
const submitting = ref(false)
const savingAddr = ref(false)
const doneVisible = ref(false)
const orderNo = ref('')

const form = reactive({
  consignee: '卞同学',
  phone: '13800000000',
  detail: '徐州工程学院 敬文楼 20X'
})

const totalCount = computed(() => items.value.reduce((s, i) => s + Number(i.number || 0), 0))
const amount = computed(() => items.value.reduce((s, i) => s + Number(i.amount || 0) * Number(i.number || 0), 0))

function fmtDateTime(d) {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

async function load() {
  const [cart, addr] = await Promise.all([
    http.get('/user/shoppingCart/list'),
    http.get('/user/addressBook/default').catch(() => null)
  ])
  items.value = cart || []
  address.value = addr || null
  editMode.value = !addr
  if (!items.value.length) showToast('购物车为空')
}

async function saveAddress() {
  if (!form.consignee || !form.phone || !form.detail) return showToast('请填写完整地址')
  savingAddr.value = true
  try {
    await http.post('/user/addressBook', {
      consignee: form.consignee,
      phone: form.phone,
      sex: '1',
      provinceName: '江苏省',
      provinceCode: '320000',
      cityName: '徐州市',
      cityCode: '320300',
      districtName: '云龙区',
      districtCode: '320303',
      detail: form.detail,
      label: '学校',
      isDefault: 1
    })
    const list = await http.get('/user/addressBook/list')
    const last = (list || [])[list && list.length ? list.length - 1 : 0]
    if (last) {
      await http.put('/user/addressBook/default', { id: last.id })
    }
    address.value = await http.get('/user/addressBook/default')
    editMode.value = false
    showToast('地址已保存')
  } finally {
    savingAddr.value = false
  }
}

async function submit() {
  if (!address.value) return showToast('请先填写配送地址')
  if (!items.value.length) return showToast('购物车为空')
  submitting.value = true
  try {
    const order = await http.post('/user/order/submit', {
      addressBookId: address.value.id,
      amount: Number(amount.value.toFixed(2)),
      payMethod: 1,
      remark: remark.value,
      deliveryStatus: 1,
      tablewareNumber: 0,
      tablewareStatus: 0,
      packAmount: 0,
      estimatedDeliveryTime: fmtDateTime(new Date(Date.now() + 30 * 60 * 1000))
    })
    await http.put('/user/order/payment', { orderNumber: order.orderNumber, payMethod: 1 })
    orderNo.value = order.orderNumber
    doneVisible.value = true
    await refreshCartCount()
  } finally {
    submitting.value = false
  }
}

function goOrders() {
  doneVisible.value = false
  router.replace('/orders')
}

onMounted(load)
</script>

<style scoped>
.checkout { padding: 0 14px 110px; background: #f4f5f7; }
.topbar { display: flex; align-items: center; justify-content: space-between; padding: 14px 2px; font-size: 15px; font-weight: 700; }
.card { background: #fff; border-radius: 14px; padding: 14px; margin-bottom: 12px; border: 1px solid var(--line); }
.addr-head, .goods-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 10px; }
.label, .goods-head span:first-child { font-size: 13px; font-weight: 700; }
.edit { font-size: 12px; color: var(--brand); }
.addr-line { font-size: 15px; }
.phone { color: var(--muted); font-size: 13px; margin-left: 10px; }
.addr-detail { font-size: 12px; color: #6b7280; margin-top: 5px; line-height: 1.6; }
.form { display: grid; gap: 8px; }
.field { display: flex; align-items: center; gap: 10px; background: #fafbfc; border-radius: 10px; padding: 10px 12px; }
.field span { font-size: 12px; color: var(--muted); width: 56px; flex: none; }
.field input { border: 0; background: transparent; flex: 1; font-size: 14px; outline: none; }
.save { margin-top: 4px; border: 0; background: var(--brand); color: #fff; border-radius: 10px; padding: 11px; font-weight: 700; }
.count { font-size: 11px; color: var(--muted); }
.g-row { display: flex; justify-content: space-between; gap: 10px; padding: 8px 0; border-bottom: 1px dashed #f0edf0; font-size: 13px; }
.flavor { color: var(--muted); font-size: 11px; margin-left: 6px; }
.g-right { color: var(--muted); font-size: 12px; white-space: nowrap; }
.g-amount { color: var(--ink); margin-left: 8px; }
.fee { display: flex; justify-content: space-between; font-size: 13px; color: #6b7280; padding-top: 10px; }
.fee.total { color: var(--ink); font-weight: 700; }
.price { color: var(--brand); font-size: 18px; }
.remark textarea { width: 100%; border: 0; background: #fafbfc; border-radius: 10px; padding: 10px 12px; font-size: 13px; outline: none; resize: none; font-family: inherit; }
.pay-bar { position: fixed; bottom: 60px; left: 50%; transform: translateX(-50%); width: min(520px, 100%); background: #fff; border-top: 1px solid var(--line); display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; }
.pay-label { font-size: 11px; color: var(--muted); }
.pay-value { font-size: 22px; font-weight: 800; }
.pay { border: 0; background: var(--brand); color: #fff; padding: 13px 20px; border-radius: 999px; font-size: 15px; font-weight: 700; }
.pay:disabled { background: #cfd3d8; }
.done { text-align: center; }
.done h3 { margin: 12px 0 6px; font-size: 18px; }
.done p { margin: 4px 0; font-size: 12px; color: #6b7280; word-break: break-all; }
.done-tip { margin-bottom: 18px !important; }
</style>
