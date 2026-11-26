<template>
  <div class="login-wrap">
    <div class="login-brand">
      <div class="brand-badge">食光外卖</div>
      <h1>把每一单<br />都管得清清楚楚</h1>
      <p>菜品、套餐、订单、员工与营业状态，一套后台全部覆盖。数据落在 MySQL，接口由 Spring Boot 提供。</p>
      <ul>
        <li><span class="dot" />订单实时接单 / 派送 / 完成</li>
        <li><span class="dot" />菜品与套餐上下架、分类管理</li>
        <li><span class="dot" />营业数据一屏掌握</li>
      </ul>
    </div>

    <div class="login-panel">
      <div class="form-card">
        <h2>管理后台登录</h2>
        <p class="hint">员工账号登录，登录后进入工作台</p>
        <el-form :model="form" @submit.prevent>
          <el-form-item>
            <el-input v-model="form.username" size="large" placeholder="用户名" :prefix-icon="User" />
          </el-form-item>
          <el-form-item>
            <el-input
              v-model="form.password"
              size="large"
              type="password"
              show-password
              placeholder="密码"
              :prefix-icon="Lock"
              @keyup.enter="submit"
            />
          </el-form-item>
          <el-button class="submit" type="primary" size="large" :loading="loading" @click="submit">
            登录
          </el-button>
        </el-form>
        <p class="demo">演示账号 <b>admin</b> / <b>123456</b></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import http from '../api/http'

const router = useRouter()
const loading = ref(false)
const form = reactive({ username: 'admin', password: '123456' })

async function submit() {
  if (!form.username || !form.password) return ElMessage.warning('请输入用户名和密码')
  loading.value = true
  try {
    const data = await http.post('/admin/employee/login', { ...form })
    localStorage.setItem('admin_token', data.token)
    localStorage.setItem('admin_name', data.name || form.username)
    ElMessage.success('登录成功')
    router.push('/dashboard')
  } catch (e) {
    /* 拦截器已提示 */
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-wrap {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1.15fr 1fr;
}

.login-brand {
  position: relative;
  padding: 64px 56px;
  color: #fff;
  background:
    radial-gradient(1200px 600px at 15% 10%, #ffb08a 0%, rgba(255, 176, 138, 0) 60%),
    linear-gradient(150deg, #ff8a4c 0%, #f2542d 55%, #c8371a 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
}

.login-brand::after {
  content: '';
  position: absolute;
  right: -90px;
  bottom: -90px;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  border: 20px solid rgba(255, 255, 255, 0.12);
}

.brand-badge {
  display: inline-block;
  padding: 6px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  font-weight: 600;
  letter-spacing: 2px;
  font-size: 12px;
  width: fit-content;
}

.login-brand h1 {
  font-size: 40px;
  line-height: 1.25;
  margin: 26px 0 18px;
  font-weight: 800;
  letter-spacing: 1px;
}

.login-brand p { max-width: 420px; opacity: 0.92; line-height: 1.8; margin: 0 0 26px; }

.login-brand ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 12px; opacity: 0.95; }

.dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #fff;
  margin-right: 10px;
  vertical-align: 2px;
}

.login-panel { display: flex; align-items: center; justify-content: center; background: #fff; padding: 32px; }

.form-card { width: 100%; max-width: 380px; }
.form-card h2 { font-size: 26px; margin: 0 0 6px; }
.hint { color: #6b7280; margin: 0 0 26px; }

.submit { width: 100%; height: 46px; font-size: 15px; border-radius: 10px; margin-top: 6px; }
.demo { margin-top: 18px; color: #9aa1ab; font-size: 12px; }

@media (max-width: 900px) {
  .login-wrap { grid-template-columns: 1fr; }
  .login-brand { display: none; }
  .login-panel { min-height: 100vh; }
}
</style>
