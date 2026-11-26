<template>
  <div class="menu-page">
    <div class="hero">
      <div class="hero-top">
        <div class="shop-mark">食</div>
        <div class="shop-meta">
          <div class="shop-name">食光外卖</div>
          <div class="shop-tags">
            <span class="tag">{{ open ? '营业中' : '已打烊' }}</span>
            <span class="tag light">约 30 分钟送达</span>
          </div>
        </div>
      </div>
      <div class="hero-note" v-if="!open">店铺当前已打烊，可浏览菜单，暂不能下单</div>
    </div>

    <div class="body">
      <aside class="rail">
        <div
          v-for="c in categories"
          :key="c.key"
          class="rail-item"
          :class="{ active: c.id === activeId }"
          @click="switchCategory(c)"
        >
          <span class="dot" v-if="c.id === activeId" />
          {{ c.name }}
        </div>
        <div v-if="!categories.length" class="rail-empty">暂无分类</div>
      </aside>

      <main class="list" v-if="items.length">
        <div class="list-head">
          <span>{{ activeName }}</span>
          <span class="count">{{ items.length }} 款</span>
        </div>

        <div v-for="it in items" :key="it.id" class="dish">
          <div class="dish-img" :class="{ alt: isSetmeal }">
            <img
              v-if="it.image && !broken[it.id]"
              :src="it.image"
              @error="broken[it.id] = true"
            />
            <span v-else>{{ (it.name || '?').slice(0, 1) }}</span>
          </div>
          <div class="dish-main">
            <div class="dish-name">{{ it.name }}</div>
            <div class="dish-desc ellipsis" v-if="it.description">{{ it.description }}</div>
            <div class="dish-foot">
              <div class="dish-price"><span class="yuan">¥</span>{{ Number(it.price || 0).toFixed(2) }}</div>
              <div class="stepper">
                <van-icon
                  v-if="countOf(it) > 0"
                  name="minus"
                  class="step minus"
                  @click="minus(it)"
                />
                <span v-if="countOf(it) > 0" class="num">{{ countOf(it) }}</span>
                <van-icon name="plus" class="step plus" @click="add(it)" />
              </div>
            </div>
          </div>
        </div>
      </main>

      <main class="list empty" v-else>
        <van-empty image="search" description="这个分类还没有上架商品" />
      </main>
    </div>

    <div class="cartbar" v-if="cartTotalCount > 0">
      <div class="cart-info" @click="$router.push('/cart')">
        <div class="cart-icon">
          <van-icon name="shopping-cart" />
          <span class="badge">{{ cartTotalCount }}</span>
        </div>
        <div>
          <div class="cart-amount">¥{{ cartAmount.toFixed(2) }}</div>
          <div class="cart-hint">另需打包费 ¥0.00</div>
        </div>
      </div>
      <button class="go" :disabled="!open" @click="goCheckout">
        {{ open ? '去结算' : '已打烊' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import http, { ensureLogin, refreshCartCount } from '../api/http'

const router = useRouter()
const open = ref(true)
const categories = ref([])
const activeId = ref(null)
const items = ref([])
const isSetmeal = ref(false)
const cartList = ref([])
const broken = ref({})

const activeName = computed(() => categories.value.find((c) => c.id === activeId.value)?.name || '')
const cartTotalCount = computed(() => cartList.value.reduce((s, i) => s + Number(i.number || 0), 0))
const cartAmount = computed(() => cartList.value.reduce((s, i) => s + Number(i.amount || 0) * Number(i.number || 0), 0))

function countOf(it) {
  const key = isSetmeal.value ? 'setmealId' : 'dishId'
  const row = cartList.value.find((c) => c[key] === it.id)
  return Number(row?.number || 0)
}

async function loadShop() {
  try {
    open.value = (await http.get('/user/shop/status')) === 1
  } catch (e) { /* ignore */ }
}

async function loadCategories() {
  const [dishCats, setmealCats] = await Promise.all([
    http.get('/user/category/list', { params: { type: 1 } }),
    http.get('/user/category/list', { params: { type: 2 } })
  ])
  categories.value = [
    ...(dishCats || []).map((c) => ({ ...c, kind: 'dish' })),
    ...(setmealCats || []).map((c) => ({ ...c, kind: 'setmeal' }))
  ]
  if (categories.value.length && !activeId.value) switchCategory(categories.value[0])
}

async function switchCategory(c) {
  if (!c) return
  activeId.value = c.id
  isSetmeal.value = c.kind === 'setmeal'
  items.value = isSetmeal.value
    ? await http.get('/user/setmeal/list', { params: { categoryId: c.id } })
    : await http.get('/user/dish/list', { params: { categoryId: c.id } })
  items.value = items.value || []
}

async function loadCart() {
  cartList.value = (await http.get('/user/shoppingCart/list')) || []
  await refreshCartCount()
}

async function add(it) {
  if (!open.value) return showToast('店铺已打烊，暂不能下单')
  const body = isSetmeal.value ? { setmealId: it.id } : { dishId: it.id }
  await http.post('/user/shoppingCart/add', body)
  await loadCart()
}

async function minus(it) {
  const body = isSetmeal.value ? { setmealId: it.id } : { dishId: it.id }
  await http.post('/user/shoppingCart/sub', body)
  await loadCart()
}

function goCheckout() {
  if (!open.value) return showToast('店铺已打烊')
  router.push('/checkout')
}

onMounted(async () => {
  await ensureLogin()
  await Promise.all([loadShop(), loadCategories(), loadCart()])
})
</script>

<style scoped>
.hero {
  background: linear-gradient(150deg, #ff8f5a 0%, #f4552c 62%, #d33c17 100%);
  color: #fff;
  padding: 22px 18px 28px;
  border-radius: 0 0 22px 22px;
}
.hero-top { display: flex; gap: 12px; align-items: center; }
.shop-mark { width: 46px; height: 46px; border-radius: 14px; background: rgba(255,255,255,.22); display: grid; place-items: center; font-weight: 800; font-size: 20px; }
.shop-name { font-size: 21px; font-weight: 800; letter-spacing: .5px; }
.shop-tags { display: flex; gap: 6px; margin-top: 6px; }
.tag { font-size: 11px; padding: 3px 8px; border-radius: 999px; background: rgba(255,255,255,.9); color: #c8371a; font-weight: 600; }
.tag.light { background: rgba(255,255,255,.18); color: #fff; }
.hero-note { margin-top: 14px; font-size: 12px; background: rgba(0,0,0,.16); padding: 8px 12px; border-radius: 10px; }

.body { display: flex; min-height: 60vh; }
.rail { width: 86px; flex: none; background: #fafafa; border-right: 1px solid var(--line); padding: 8px 0; }
.rail-item { padding: 13px 10px; font-size: 13px; color: #6b7280; position: relative; text-align: center; line-height: 1.3; }
.rail-item.active { color: var(--ink); font-weight: 700; background: #fff; }
.rail-item.active .dot { position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 3px; height: 16px; background: var(--brand); border-radius: 0 3px 3px 0; }
.rail-empty { padding: 20px 10px; color: var(--muted); font-size: 12px; text-align: center; }

.list { flex: 1; padding: 4px 12px 0; min-width: 0; }
.list.empty { display: grid; place-items: center; }
.list-head { display: flex; justify-content: space-between; align-items: baseline; padding: 12px 4px 6px; font-size: 14px; font-weight: 700; }
.list-head .count { font-size: 11px; color: var(--muted); font-weight: 400; }

.dish { display: flex; gap: 11px; padding: 12px 4px; border-bottom: 1px solid #f6f4f6; }
.dish-img { width: 72px; height: 72px; border-radius: 12px; flex: none; overflow: hidden; background: #fff2ec; color: #e25420; display: grid; place-items: center; font-weight: 800; font-size: 20px; }
.dish-img.alt { background: #eef4ff; color: #2563eb; }
.dish-img img { width: 100%; height: 100%; object-fit: cover; }
.dish-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.dish-name { font-size: 14px; font-weight: 700; }
.dish-desc { font-size: 11px; color: var(--muted); margin-top: 3px; }
.dish-foot { margin-top: auto; display: flex; align-items: center; justify-content: space-between; padding-top: 8px; }
.dish-price { font-size: 16px; }
.yuan { font-size: 11px; margin-right: 2px; }
.stepper { display: flex; align-items: center; gap: 8px; }
.step { font-size: 19px; }
.step.plus { color: #fff; background: var(--brand); border-radius: 50%; padding: 3px; }
.step.minus { color: var(--brand); }
.num { font-size: 13px; font-weight: 700; min-width: 12px; text-align: center; }

.cartbar {
  position: fixed; bottom: 60px; left: 50%; transform: translateX(-50%);
  width: min(520px, 100%); padding: 10px 14px 12px;
  display: flex; align-items: center; gap: 12px;
  background: #fff; border-top: 1px solid var(--line);
  z-index: 5;
}
.cart-info { display: flex; align-items: center; gap: 12px; flex: 1; }
.cart-icon { width: 42px; height: 42px; border-radius: 50%; background: #26282e; color: #fff; display: grid; place-items: center; font-size: 21px; position: relative; }
.badge { position: absolute; top: -4px; right: -4px; min-width: 18px; height: 18px; border-radius: 9px; background: var(--brand); font-size: 11px; display: grid; place-items: center; padding: 0 4px; }
.cart-amount { font-size: 18px; font-weight: 800; }
.cart-hint { font-size: 11px; color: var(--muted); }
.go { border: 0; background: var(--brand); color: #fff; font-size: 15px; font-weight: 700; padding: 12px 26px; border-radius: 999px; }
.go:disabled { background: #cfd3d8; }
</style>
