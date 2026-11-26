<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h2 class="page-title">菜品管理</h2>
        <p class="page-sub">菜品是点餐的基础数据，停售的菜品不会出现在小程序菜单里。</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="openCreate">新增菜品</el-button>
    </div>

    <div class="card">
      <div class="toolbar">
        <el-input v-model="query.name" placeholder="菜品名称" clearable style="width: 180px" @keyup.enter="search" />
        <el-select v-model="query.categoryId" placeholder="全部分类" clearable style="width: 170px">
          <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
        <el-select v-model="query.status" placeholder="全部状态" clearable style="width: 140px">
          <el-option label="在售" :value="1" />
          <el-option label="停售" :value="0" />
        </el-select>
        <el-button type="primary" @click="search">查询</el-button>
        <el-button @click="reset">重置</el-button>
      </div>

      <el-table :data="rows" v-loading="loading" stripe>
        <el-table-column label="图片" width="90">
          <template #default="{ row }">
            <div class="thumb">
              <img v-if="row.image" :src="row.image" :alt="row.name" @error="(e) => (e.target.style.display = 'none')" />
              <span v-else>{{ (row.name || '?').slice(0, 1) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="菜品名称" min-width="150" />
        <el-table-column prop="categoryName" label="分类" width="130" />
        <el-table-column label="售价" width="100" align="right">
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

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑菜品' : '新增菜品'" width="520px">
      <el-form :model="form" label-width="86px">
        <el-form-item label="菜品名称" required>
          <el-input v-model="form.name" placeholder="如：招牌黄焖鸡" />
        </el-form-item>
        <el-form-item label="所属分类" required>
          <el-select v-model="form.categoryId" placeholder="请选择分类" style="width: 100%">
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="售价" required>
          <el-input-number v-model="form.price" :min="0" :precision="2" :step="1" controls-position="right" style="width: 180px" />
        </el-form-item>
        <el-form-item label="图片地址">
          <el-input v-model="form.image" placeholder="https://… 留空则显示文字占位" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="一句话说明用料或口味" />
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
const dialogVisible = ref(false)
const query = reactive({ page: 1, pageSize: 10, name: '', categoryId: '', status: '' })
const form = reactive({ id: null, name: '', categoryId: null, price: 0, image: '', description: '', status: 1 })

async function loadCategories() {
  categories.value = await http.get('/admin/category/list', { params: { type: 1 } })
}

async function load() {
  loading.value = true
  try {
    const params = { ...query }
    Object.keys(params).forEach((k) => (params[k] === '' || params[k] === null) && delete params[k])
    const data = await http.get('/admin/dish/page', { params })
    rows.value = data.records || []
    total.value = data.total || 0
  } finally {
    loading.value = false
  }
}

function search() { query.page = 1; load() }
function reset() { Object.assign(query, { page: 1, name: '', categoryId: '', status: '' }); load() }

function openCreate() {
  Object.assign(form, { id: null, name: '', categoryId: categories.value[0]?.id ?? null, price: 0, image: '', description: '', status: 1 })
  dialogVisible.value = true
}

async function openEdit(row) {
  const data = await http.get(`/admin/dish/${row.id}`)
  Object.assign(form, {
    id: data.id, name: data.name, categoryId: data.categoryId, price: Number(data.price || 0),
    image: data.image || '', description: data.description || '', status: data.status
  })
  dialogVisible.value = true
}

async function save() {
  if (!form.name) return ElMessage.warning('请填写菜品名称')
  if (!form.categoryId) return ElMessage.warning('请选择分类')
  saving.value = true
  const payload = {
    id: form.id, name: form.name, categoryId: form.categoryId, price: form.price,
    image: form.image, description: form.description, status: form.status, flavors: []
  }
  try {
    if (form.id) await http.put('/admin/dish', payload)
    else await http.post('/admin/dish', payload)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    load()
  } finally {
    saving.value = false
  }
}

async function toggle(row) {
  const target = row.status === 1 ? 0 : 1
  await http.post(`/admin/dish/status/${target}`, null, { params: { id: row.id } })
  ElMessage.success(target === 1 ? '已起售' : '已停售')
  load()
}

async function remove(row) {
  await ElMessageBox.confirm(`确定删除“${row.name}”？`, '删除菜品', { type: 'warning' })
  await http.delete('/admin/dish', { params: { ids: row.id } })
  ElMessage.success('已删除')
  load()
}

onMounted(async () => {
  await loadCategories()
  await load()
})
</script>

<style scoped>
.thumb {
  width: 46px; height: 46px; border-radius: 10px; background: #fff2ec; color: #e25420;
  display: grid; place-items: center; font-weight: 700; overflow: hidden;
}
.thumb img { width: 100%; height: 100%; object-fit: cover; }
.pager { margin-top: 16px; justify-content: flex-end; }
</style>
