<template>
  <div class="cart-page">
    <div class="head">
      <h1 class="page-title">购物车</h1>
      <span class="clear" v-if="items.length" @click="clear">清空</span>
    </div>

    <div v-if="items.length" class="cart-list">
      <div v-for="it in items" :key="keyOf(it)" class="row">
        <van-checkbox :model-value="checked.has(keyOf(it))" @update:model-value="(v) => toggle(it, v)" shape="round" />
        <div class="thumb">
          <img v-if="it.image" :src="it.image" @error="(e) => (e.target.style.display = 'none')" />
          <span v-else>{{ (it.name || '?').slice(0, 1) }}</span>
        </div>
        <div class="info">
          <div class="name">{{ it.name }}</div>
          <div class="flavor" v-if="it.dishFlavor">{{ it.dishFlavor }}</div>
          <div class="line">
            <span class="amount"><span class="yuan">¥</span>{{ Number(it.amount || 0).toFixed(2) }}</span>
            <div class="stepper">
              <van-icon name="minus" class="step" @click="minus(it)" />
              <span class="num">{{ it.number }}</span>
              <van-icon name="plus" class="step plus" @click="plus(it)" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <van-empty v-else description="购物车还是空的">
      <van-button round type="primary" color="#ff6b35" @click="$router.replace('/menu')">去点餐</van-button>
    </van-empty>

    <div class="bar" v-if="items.length">
      <div class="sum">
        <div class="sum-label">合计</div>
        <div class="sum-value">¥{{ total.toFixed(2) }}</div>
      </div>
      <button class="go" :disabled="!checked.size" @click="checkout">去结算（{{ checkedCount }}）</button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showConfirmDialog, showToast } from 'vant'
import http, { refreshCartCount } from '../api/http'

const router = useRouter()
const items = ref([])
const checked = ref(new Set())

const keyOf = (it) => (it.setmealId ? 's' + it.setmealId + '-' + (it.dishFlavor || '') : 'd' + it.dishId + '-' + (it.dishFlavor || ''))

const checkedCount = computed(() => items.value.filter((i) => checked.value.has(keyOf(i))).reduce((s, i) => s + i.number, 0))
const total = computed(() =>
  items.value.filter((i) => checked.value.has(keyOf(i))).reduce((s, i) => s + Number(i.amount || 0) * Number(i.number || 0), 0)
)

async function load() {
  items.value = (await http.get('/user/shoppingCart/list')) || []
  checked.value = new Set(items.value.map(keyOf))
  await refreshCartCount()
}

function toggle(it, v) {
  const s = new Set(checked.value)
  v ? s.add(keyOf(it)) : s.delete(keyOf(it))
  checked.value = s
}

async function plus(it) {
  const body = it.setmealId ? { setmealId: it.setmealId } : { dishId: it.dishId, dishFlavor: it.dishFlavor }
  await http.post('/user/shoppingCart/add', body)
  await load()
}

async function minus(it) {
  const now = items.value.find((x) => keyOf(x) === keyOf(it))
  if (now && now.number <= 1) {
    await http.post('/user/shoppingCart/sub', { dishId: it.dishId, setmealId: it.setmealId })
  } else {
    await http.post('/user/shoppingCart/sub', { dishId: it.dishId, setmealId: it.setmealId })
  }
  await load()
}

async function clear() {
  await showConfirmDialog({ title: '清空购物车', message: '确定要清空所有商品吗？' })
  await http.delete('/user/shoppingCart/clean')
  await load()
}

function checkout() {
  if (!checked.size) return showToast('请先选择商品')
  const ids = [...checked.value].filter((k) => k.startsWith('d')).map((k) => Number(k.slice(1).split('-')[0]))
  sessionStorage.setItem('checkout_dish_ids', JSON.stringify(ids))
  sessionStorage.setItem('checkout_total', total.value.toFixed(2))
  router.push('/checkout')
}

onMounted(load)
</script>

<style scoped>
.cart-page { padding: 18px 16px 110px; }
.head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.clear { font-size: 13px; color: var(--muted); }

.cart-list { display: grid; gap: 10px; }
.row { display: flex; gap: 10px; background: #fff; border: 1px solid var(--line); border-radius: 14px; padding: 12px; align-items: center; }
.thumb { width: 62px; height: 62px; border-radius: 12px; background: #fff2ec; color: #e25420; display: grid; place-items: center; font-weight: 800; overflow: hidden; flex: none; }
.thumb img { width: 100%; height: 100%; object-fit: cover; }
.info { flex: 1; min-width: 0; }
.name { font-size: 14px; font-weight: 700; }
.flavor { font-size: 11px; color: var(--muted); margin-top: 2px; }
.line { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; }
.amount { font-size: 15px; color: var(--brand); font-weight: 700; }
.yuan { font-size: 10px; }
.stepper { display: flex; align-items: center; gap: 9px; }
.step { font-size: 18px; color: var(--brand); }
.step.plus { color: #fff; background: var(--brand); border-radius: 50%; padding: 2px; }
.num { font-size: 13px; font-weight: 700; }

.bar { position: fixed; bottom: 60px; left: 50%; transform: translateX(-50%); width: min(520px, 100%); display: flex; align-items: center; gap: 14px; padding: 12px 16px; background: #fff; border-top: 1px solid var(--line); }
.sum { flex: 1; }
.sum-label { font-size: 11px; color: var(--muted); }
.sum-value { font-size: 22px; font-weight: 800; }
.go { border: 0; background: var(--brand); color: #fff; padding: 13px 22px; border-radius: 999px; font-size: 15px; font-weight: 700; }
.go:disabled { background: #cfd3d8; }
</style>
