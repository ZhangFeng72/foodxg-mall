<template>
  <el-container class="shell">
    <el-aside width="216px" class="aside">
      <div class="logo">
        <div class="logo-mark">食</div>
        <div>
          <div class="logo-name">食光外卖</div>
          <div class="logo-sub">管理后台</div>
        </div>
      </div>

      <nav class="menu">
        <router-link v-for="m in menus" :key="m.path" :to="m.path" class="menu-item" active-class="active">
          <el-icon><component :is="m.icon" /></el-icon>
          <span>{{ m.label }}</span>
        </router-link>
      </nav>

      <div class="aside-foot">
        <div class="foot-label">店铺状态</div>
        <div class="foot-value" :class="shopOpen ? 'open' : 'closed'">
          {{ shopOpen ? '营业中' : '已打烊' }}
        </div>
        <router-link to="/shop" class="foot-link">去设置 →</router-link>
      </div>
    </el-aside>

    <el-container>
      <el-header class="header" height="62px">
        <div>
          <span class="crumb">食光外卖 / </span>{{ route.meta.title || '工作台' }}
        </div>
        <div class="header-right">
          <el-tag :type="shopOpen ? 'success' : 'info'" effect="light" round>
            {{ shopOpen ? '营业中' : '已打烊' }}
          </el-tag>
          <el-dropdown @command="onCommand">
            <span class="user">
              <el-icon><Avatar /></el-icon>{{ name }}
              <el-icon class="caret"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="main">
        <router-view v-slot="{ Component }">
          <component :is="Component" />
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import http from '../api/http'

const route = useRoute()
const router = useRouter()
const name = ref(localStorage.getItem('admin_name') || '管理员')
const shopOpen = ref(true)

const menus = [
  { path: '/dashboard', label: '工作台', icon: 'DataBoard' },
  { path: '/orders', label: '订单管理', icon: 'Tickets' },
  { path: '/dishes', label: '菜品管理', icon: 'Dish' },
  { path: '/setmeals', label: '套餐管理', icon: 'Box' },
  { path: '/categories', label: '分类管理', icon: 'Menu' },
  { path: '/employees', label: '员工管理', icon: 'User' },
  { path: '/shop', label: '店铺设置', icon: 'Shop' }
]

async function loadShop() {
  try {
    const status = await http.get('/admin/shop/status')
    shopOpen.value = status === 1
  } catch (e) {
    /* ignore */
  }
}

async function onCommand(cmd) {
  if (cmd === 'logout') {
    try { await http.post('/admin/employee/logout') } catch (e) { /* ignore */ }
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_name')
    ElMessage.success('已退出')
    router.push('/login')
  }
}

onMounted(loadShop)
</script>

<style scoped>
.shell { min-height: 100vh; }

.aside {
  background: #fff;
  border-right: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  padding: 18px 14px;
  position: sticky;
  top: 0;
  height: 100vh;
}

.logo { display: flex; gap: 10px; align-items: center; padding: 4px 8px 18px; }

.logo-mark {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: linear-gradient(135deg, #ff8a4c, #f2542d);
  color: #fff;
  font-weight: 800;
  display: grid;
  place-items: center;
  font-size: 18px;
}

.logo-name { font-weight: 700; font-size: 15px; }
.logo-sub { color: var(--muted); font-size: 11px; letter-spacing: 1px; }

.menu { display: grid; gap: 4px; margin-top: 6px; }

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 12px;
  border-radius: 10px;
  color: #4b5563;
  text-decoration: none;
  font-size: 14px;
  transition: background 0.15s, color 0.15s;
}

.menu-item:hover { background: #f6f7f9; color: var(--ink); }

.menu-item.active {
  background: var(--brand-soft);
  color: var(--brand-dark);
  font-weight: 600;
  box-shadow: inset 3px 0 0 var(--brand);
}

.aside-foot {
  margin-top: auto;
  border-top: 1px solid var(--line);
  padding: 14px 10px 4px;
}

.foot-label { color: var(--muted); font-size: 12px; }
.foot-value { font-weight: 700; margin: 4px 0 6px; font-size: 15px; }
.foot-value.open { color: #16a34a; }
.foot-value.closed { color: #9ca3af; }
.foot-link { font-size: 12px; color: var(--brand); text-decoration: none; }

.header {
  background: #fff;
  border-bottom: 1px solid var(--line);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 10;
  font-size: 15px;
  font-weight: 600;
}

.crumb { color: #9aa1ab; font-weight: 400; font-size: 13px; }

.header-right { display: flex; align-items: center; gap: 16px; }

.user { display: flex; align-items: center; gap: 6px; cursor: pointer; color: #374151; font-size: 14px; }
.caret { font-size: 12px; color: #9aa1ab; }

.main { padding: 0; background: var(--bg); }
</style>
