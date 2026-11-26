<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h2 class="page-title">套餐管理</h2>
        <p class="page-sub">套餐由多个菜品组合而成，用户端按套餐分类展示。</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="openCreate">新增套餐</el-button>
    </div>

    <div class="card">
      <div class="toolbar">
        <el-input v-model="query.name" placeholder="套餐名称" clearable style="width: 180px" @keyup.enter="search" />
        <el-select v-model="query.categoryId" placeholder="全部分类" clearable style="width: 170px">
          <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
        <el-button type="primary" @click="search">查询</el-button>
        <el-button @click="reset">重置</el-button>
      </div>

      <el-table :data="rows" v-loading="loading" stripe>
        <el-table-column label="图片" width="90">
          <template #default="{ row }">
            <div class="thumb">
              <img v-if="row.image" :src="row.image" @error="(e) => (e.target.style.display = 'none')" />
              <span v-else>{{ (row.name || '?').slice(0, 1) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="套餐名称" min-width="160" />
        <el-table-column prop="categoryName" label="分类" width="130" />
        <el-table-column label="价格" width="100" align="right">
          <template #default="{ row }"><span class="price">¥{{ Number(row.price || 0).toFixed(2) }}</span></template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="180" show-overflow-tooltip />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" effect="light" round>
              {{ row.status === 1 ? '在售' : '停售' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="210">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link :type="row.status === 1 ? 'warning' : 'success'" @click="toggle(row)">
              {{ row.status === 1 ? '停售' : '起售' }}
            </el-button>
            <el-button link type="danger" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        class="pager"
        layout="total, prev, pager, next, sizes"
        :total="total"
        v-model:current-page="query.page"
        v-model:page-size="query.pageSize"
        :page-sizes="[10, 20, 50]"
        @current-change="load"
        @size-change="() => { query.page = 1; load() }"
      />
    </div>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑套餐' : '新增套餐'" width="640px">
      <el-form :model="form" label-width="86px">
        <el-form-item label="套餐名称" required>
          <el-input v-model="form.name" placeholder="如：双人工作餐" />
        </el-form-item>
        <el-form-item label="套餐分类" required>
          <el-select v-model="form.categoryId" placeholder="请选择" style="width: 100%">
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="价格" required>
          <el-input-number v-model="form.price" :min="0" :precision="2" controls-position="right" style="width: 180px" />
        </el-form-item>
        <el-form-item label="图片地址">
          <el-input v-model="form.image" placeholder="https://… 可留空" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="包含菜品" required>
          <div class="picker">
            <div class="picker-list">
              <label v-for="d in dishes" :key="d.id" class="pick-row" :class="{ on: picked.has(d.id) }">
                <el-checkbox :model-value="picked.has(d.id)" @change="(v) => toggleDish(d, v)" />
                <span class="pick-name">{{ d.name }}</span>
                <span class="pick-price">¥{{ Number(d.price).toFixed(2) }}</span>
              </label>
            </div>
            <p class="picker-tip">已选 {{ picked.size }} 个菜品，套餐价建议低于单品之和。</p>
          </div>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" active-text="在售" inactive-text="停售" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import http from '../api/http'

const loading = ref(false)
const saving = ref(false)
const rows = ref([])
const total = ref(0)
const categories = ref([])
const dishes = ref([])
const picked = ref(new Set())
const dialogVisible = ref(false)
const query = reactive({ page: 1, pageSize: 10, name: '', categoryId: '' })
const form = reactive({ id: null, name: '', categoryId: null, price: 0, image: '', description: '', status: 1 })

async function loadCategories() {
  categories.value = await http.get('/admin/category/list', { params: { type: 2 } })
}

async function loadDishes() {
  dishes.value = await http.get('/admin/dish/list')
}

async function load() {
  loading.value = true
  try {
    const params = { ...query }
    Object.keys(params).forEach((k) => (params[k] === '' || params[k] === null) && delete params[k])
    const data = await http.get('/admin/setmeal/page', { params })
    rows.value = data.records || []
    total.value = data.total || 0
  } finally {
    loading.value = false
  }
}

const search = () => { query.page = 1; load() }
const reset = () => { Object.assign(query, { page: 1, name: '', categoryId: '' }); load() }

function toggleDish(d, v) {
  const s = new Set(picked.value)
  v ? s.add(d.id) : s.delete(d.id)
  picked.value = s
}

async function openCreate() {
  Object.assign(form, { id: null, name: '', categoryId: categories.value[0]?.id ?? null, price: 0, image: '', description: '', status: 1 })
  picked.value = new Set()
  dialogVisible.value = true
}

async function openEdit(row) {
  const data = await http.get(`/admin/setmeal/${row.id}`)
  Object.assign(form, {
    id: data.id, name: data.name, categoryId: data.categoryId, price: Number(data.price || 0),
    image: data.image || '', description: data.description || '', status: data.status
  })
  picked.value = new Set((data.setmealDishes || []).map((x) => x.dishId))
  dialogVisible.value = true
}

async function save() {
  if (!form.name) return ElMessage.warning('请填写套餐名称')
  if (!form.categoryId) return ElMessage.warning('请选择套餐分类')
  if (!picked.value.size) return ElMessage.warning('请至少选择一个菜品')
  saving.value = true
  const setmealDishes = dishes.value
    .filter((d) => picked.value.has(d.id))
    .map((d) => ({ dishId: d.id, name: d.name, price: d.price, copies: 1 }))
  const payload = { ...form, setmealDishes }
  try {
    if (form.id) await http.put('/admin/setmeal', payload)
    else await http.post('/admin/setmeal', payload)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    load()
  } finally {
    saving.value = false
  }
}

async function toggle(row) {
  await http.post(`/admin/setmeal/status/${row.status === 1 ? 0 : 1}`, null, { params: { id: row.id } })
  load()
}

async function remove(row) {
  await ElMessageBox.confirm(`确定删除套餐“${row.name}”？`, '删除套餐', { type: 'warning' })
  await http.delete('/admin/setmeal', { params: { ids: row.id } })
  ElMessage.success('已删除')
  load()
}

onMounted(async () => {
  await Promise.all([loadCategories(), loadDishes()])
  await load()
})
</script>

<style scoped>
.thumb { width: 46px; height: 46px; border-radius: 10px; background: #eef4ff; color: #2563eb; display: grid; place-items: center; font-weight: 700; overflow: hidden; }
.thumb img { width: 100%; height: 100%; object-fit: cover; }
.pager { margin-top: 16px; justify-content: flex-end; }
.picker { width: 100%; }
.picker-list { max-height: 220px; overflow: auto; border: 1px solid var(--line); border-radius: 10px; padding: 6px; }
.pick-row { display: flex; align-items: center; gap: 8px; padding: 7px 8px; border-radius: 8px; cursor: pointer; }
.pick-row:hover { background: #fafbfc; }
.pick-row.on { background: var(--brand-soft); }
.pick-name { flex: 1; }
.pick-price { color: var(--brand); font-weight: 600; font-size: 13px; }
.picker-tip { color: var(--muted); font-size: 12px; margin: 8px 0 0; }
</style>
