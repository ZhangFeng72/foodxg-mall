<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h2 class="page-title">订单管理</h2>
        <p class="page-sub">接单、派送、完成与取消，全部走后端真实订单状态机。</p>
      </div>
      <el-button :icon="Refresh" @click="load">刷新</el-button>
    </div>

    <div class="card">
      <div class="toolbar">
        <el-radio-group v-model="query.status" @change="() => { query.page = 1; load() }">
          <el-radio-button :value="''">全部</el-radio-button>
          <el-radio-button :value="2">待接单</el-radio-button>
          <el-radio-button :value="3">已接单</el-radio-button>
          <el-radio-button :value="4">派送中</el-radio-button>
          <el-radio-button :value="5">已完成</el-radio-button>
          <el-radio-button :value="6">已取消</el-radio-button>
        </el-radio-group>

        <el-input v-model="query.number" placeholder="订单号" clearable style="width: 180px" @keyup.enter="search" />
        <el-input v-model="query.phone" placeholder="手机号" clearable style="width: 150px" @keyup.enter="search" />
        <el-date-picker
          v-model="range"
          type="datetimerange"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="width: 340px"
        />
        <el-button type="primary" @click="search">查询</el-button>
        <el-button @click="reset">重置</el-button>
      </div>

      <div class="table-wrap">
      <el-table :data="rows" v-loading="loading" stripe size="small" style="min-width: 1000px">
        <el-table-column prop="number" label="订单号" width="168">
          <template #default="{ row }"><span class="mono">{{ row.number }}</span></template>
        </el-table-column>
        <el-table-column prop="orderTime" label="下单时间" width="150" />
        <el-table-column label="菜品" min-width="190" show-overflow-tooltip>
          <template #default="{ row }">{{ row.orderDishes }}</template>
        </el-table-column>
        <el-table-column prop="consignee" label="收货人" width="86" />
        <el-table-column prop="phone" label="手机号" width="120" />
        <el-table-column label="金额" width="92" align="right">
          <template #default="{ row }"><span class="price">¥{{ Number(row.amount || 0).toFixed(2) }}</span></template>
        </el-table-column>
        <el-table-column label="状态" width="92">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" effect="light" round>{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="210">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">详情</el-button>
            <el-button v-if="row.status === 2" link type="success" @click="confirmOrder(row)">接单</el-button>
            <el-button v-if="row.status === 2" link type="danger" @click="reject(row)">拒单</el-button>
            <el-button v-if="row.status === 3" link type="primary" @click="delivery(row)">派送</el-button>
            <el-button v-if="row.status === 4" link type="success" @click="complete(row)">完成</el-button>
            <el-button v-if="[1, 2, 3].includes(row.status)" link type="warning" @click="cancel(row)">取消</el-button>
          </template>
        </el-table-column>
      </el-table>
      </div>

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

    <el-dialog v-model="detailVisible" title="订单详情" width="620px">
      <template v-if="detail">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="订单号">{{ detail.number }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ statusText(detail.status) }}</el-descriptions-item>
          <el-descriptions-item label="收货人">{{ detail.consignee }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ detail.phone }}</el-descriptions-item>
          <el-descriptions-item label="地址" :span="2">{{ detail.address }}</el-descriptions-item>
          <el-descriptions-item label="下单时间">{{ detail.orderTime }}</el-descriptions-item>
          <el-descriptions-item label="金额">¥{{ Number(detail.amount || 0).toFixed(2) }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ detail.remark || '无' }}</el-descriptions-item>
        </el-descriptions>

        <h4 class="detail-title">菜品明细</h4>
        <el-table :data="detail.orderDetailList || []" size="small" border>
          <el-table-column prop="name" label="名称" />
          <el-table-column prop="dishFlavor" label="口味" width="120" />
          <el-table-column prop="number" label="数量" width="70" align="center" />
          <el-table-column label="金额" width="90" align="right">
            <template #default="{ row }">¥{{ Number(row.amount || 0).toFixed(2) }}</template>
          </el-table-column>
        </el-table>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import http from '../api/http'

const loading = ref(false)
const rows = ref([])
const total = ref(0)
const range = ref([])
const detailVisible = ref(false)
const detail = ref(null)

const query = reactive({ page: 1, pageSize: 10, status: '', number: '', phone: '' })

const statusMap = {
  1: ['待付款', 'warning'],
  2: ['待接单', 'warning'],
  3: ['已接单', 'primary'],
  4: ['派送中', 'primary'],
  5: ['已完成', 'success'],
  6: ['已取消', 'info']
}
const statusText = (s) => (statusMap[s] || ['未知', 'info'])[0]
const statusType = (s) => (statusMap[s] || ['未知', 'info'])[1]

async function load() {
  loading.value = true
  try {
    const params = { ...query }
    if (!params.status) delete params.status
    if (range.value && range.value.length === 2) {
      params.beginTime = range.value[0]
      params.endTime = range.value[1]
    }
    Object.keys(params).forEach((k) => params[k] === '' && delete params[k])
    const data = await http.get('/admin/order/conditionSearch', { params })
    rows.value = data.records || []
    total.value = data.total || 0
  } finally {
    loading.value = false
  }
}

function search() { query.page = 1; load() }
function reset() {
  query.page = 1; query.status = ''; query.number = ''; query.phone = ''
  range.value = []
  load()
}

async function openDetail(row) {
  detail.value = await http.get(`/admin/order/details/${row.id}`)
  detailVisible.value = true
}

async function confirmOrder(row) {
  await http.put('/admin/order/confirm', { id: row.id, status: row.status })
  ElMessage.success('已接单')
  load()
}

async function reject(row) {
  const { value } = await ElMessageBox.prompt('请输入拒单原因', '拒单', { inputPlaceholder: '如：菜品已售罄' })
  await http.put('/admin/order/rejection', { id: row.id, rejectionReason: value })
  ElMessage.success('已拒单')
  load()
}

async function delivery(row) {
  await http.put(`/admin/order/delivery/${row.id}`)
  ElMessage.success('已派送')
  load()
}

async function complete(row) {
  await http.put(`/admin/order/complete/${row.id}`)
  ElMessage.success('订单已完成')
  load()
}

async function cancel(row) {
  const { value } = await ElMessageBox.prompt('请输入取消原因', '取消订单', { inputPlaceholder: '如：用户要求取消' })
  await http.put('/admin/order/cancel', { id: row.id, cancelReason: value })
  ElMessage.success('已取消')
  load()
}

onMounted(load)
</script>

<style scoped>
.pager { margin-top: 16px; justify-content: flex-end; }
.table-wrap { overflow-x: auto; }
.detail-title { margin: 18px 0 8px; font-size: 14px; }
</style>
