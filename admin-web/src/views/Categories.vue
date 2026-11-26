<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h2 class="page-title">分类管理</h2>
        <p class="page-sub">菜品分类与套餐分类分开维护，排序值越小越靠前。</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="openCreate">新增分类</el-button>
    </div>

    <div class="card">
      <el-tabs v-model="type" @tab-change="load">
        <el-tab-pane label="菜品分类" name="1" />
        <el-tab-pane label="套餐分类" name="2" />
      </el-tabs>

      <el-table :data="rows" v-loading="loading" stripe>
        <el-table-column prop="name" label="分类名称" min-width="180" />
        <el-table-column prop="sort" label="排序" width="90" align="center" />
        <el-table-column label="类型" width="120">
          <template #default> {{ type === '1' ? '菜品分类' : '套餐分类' }} </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" effect="light" round>
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updateTime" label="更新时间" width="180" />
        <el-table-column label="操作" width="190">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link :type="row.status === 1 ? 'warning' : 'success'" @click="toggle(row)">
              {{ row.status === 1 ? '禁用' : '启用' }}
            </el-button>
            <el-button link type="danger" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        class="pager"
        layout="total, prev, pager, next"
        :total="total"
        v-model:current-page="page"
        :page-size="20"
        @current-change="load"
      />
    </div>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑分类' : '新增分类'" width="420px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="分类名称" required>
          <el-input v-model="form.name" placeholder="如：招牌热销" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" controls-position="right" />
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

const type = ref('1')
const page = ref(1)
const total = ref(0)
const rows = ref([])
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const form = reactive({ id: null, name: '', sort: 0 })

async function load() {
  loading.value = true
  try {
    const data = await http.get('/admin/category/page', { params: { type: Number(type.value), page: page.value, pageSize: 20 } })
    rows.value = data.records || []
    total.value = data.total || 0
  } finally {
    loading.value = false
  }
}

function openCreate() {
  Object.assign(form, { id: null, name: '', sort: (rows.value.at(-1)?.sort ?? 0) + 1 })
  dialogVisible.value = true
}

function openEdit(row) { Object.assign(form, { id: row.id, name: row.name, sort: row.sort }); dialogVisible.value = true }

async function save() {
  if (!form.name) return ElMessage.warning('请填写分类名称')
  saving.value = true
  try {
    const payload = { id: form.id, name: form.name, sort: form.sort, type: Number(type.value) }
    if (form.id) await http.put('/admin/category', payload)
    else await http.post('/admin/category', payload)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    load()
  } finally {
    saving.value = false
  }
}

async function toggle(row) {
  await http.post(`/admin/category/status/${row.status === 1 ? 0 : 1}`, null, { params: { id: row.id } })
  load()
}

async function remove(row) {
  await ElMessageBox.confirm('分类下若已有菜品或套餐，删除会被后端拒绝。确定继续？', '删除分类', { type: 'warning' })
  await http.delete('/admin/category', { params: { id: row.id } })
  ElMessage.success('已删除')
  load()
}

onMounted(load)
</script>

<style scoped>
.pager { margin-top: 16px; justify-content: flex-end; }
</style>
