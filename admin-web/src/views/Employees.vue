<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h2 class="page-title">员工管理</h2>
        <p class="page-sub">员工账号用于登录本后台，新建员工默认密码为 123456。</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="openCreate">新增员工</el-button>
    </div>

    <div class="card">
      <div class="toolbar">
        <el-input v-model="query.name" placeholder="姓名" clearable style="width: 180px" @keyup.enter="search" />
        <el-button type="primary" @click="search">查询</el-button>
        <el-button @click="reset">重置</el-button>
      </div>

      <el-table :data="rows" v-loading="loading" stripe>
        <el-table-column prop="name" label="姓名" min-width="110" />
        <el-table-column prop="username" label="账号" min-width="120" />
        <el-table-column prop="phone" label="手机号" width="140" />
        <el-table-column label="性别" width="80">
          <template #default="{ row }">{{ row.sex === '1' ? '男' : '女' }}</template>
        </el-table-column>
        <el-table-column prop="idNumber" label="身份证号" min-width="180" show-overflow-tooltip />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" effect="light" round>
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="190">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link :type="row.status === 1 ? 'warning' : 'success'" @click="toggle(row)">
              {{ row.status === 1 ? '禁用' : '启用' }}
            </el-button>
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

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑员工' : '新增员工'" width="480px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="姓名" required><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="账号" required><el-input v-model="form.username" placeholder="登录用户名" /></el-form-item>
        <el-form-item label="手机号" required><el-input v-model="form.phone" maxlength="11" /></el-form-item>
        <el-form-item label="性别" required>
          <el-radio-group v-model="form.sex">
            <el-radio value="1">男</el-radio>
            <el-radio value="0">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="身份证号" required><el-input v-model="form.idNumber" maxlength="18" /></el-form-item>
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
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import http from '../api/http'

const loading = ref(false)
const saving = ref(false)
const rows = ref([])
const total = ref(0)
const dialogVisible = ref(false)
const query = reactive({ page: 1, pageSize: 10, name: '' })
const form = reactive({ id: null, name: '', username: '', phone: '', sex: '1', idNumber: '' })

async function load() {
  loading.value = true
  try {
    const params = { ...query }
    if (!params.name) delete params.name
    const data = await http.get('/admin/employee/page', { params })
    rows.value = data.records || []
    total.value = data.total || 0
  } finally {
    loading.value = false
  }
}

const search = () => { query.page = 1; load() }
const reset = () => { query.page = 1; query.name = ''; load() }

function openCreate() {
  Object.assign(form, { id: null, name: '', username: '', phone: '', sex: '1', idNumber: '' })
  dialogVisible.value = true
}

function openEdit(row) {
  Object.assign(form, {
    id: row.id, name: row.name, username: row.username, phone: row.phone,
    sex: String(row.sex), idNumber: row.idNumber
  })
  dialogVisible.value = true
}

async function save() {
  if (!form.name || !form.username || !form.phone || !form.idNumber) return ElMessage.warning('请填写完整信息')
  saving.value = true
  try {
    if (form.id) await http.put('/admin/employee', { ...form })
    else await http.post('/admin/employee', { ...form })
    ElMessage.success('保存成功')
    dialogVisible.value = false
    load()
  } finally {
    saving.value = false
  }
}

async function toggle(row) {
  await http.post(`/admin/employee/status/${row.status === 1 ? 0 : 1}`, null, { params: { id: row.id } })
  load()
}

onMounted(load)
</script>

<style scoped>
.pager { margin-top: 16px; justify-content: flex-end; }
</style>
