<template>
  <div class="admin-page">
    <div class="page-header">
      <h2>审计日志</h2>
    </div>

    <div class="admin-card">
      <div class="filter-bar">
        <el-input v-model="filters.action" placeholder="动作码（如 im-user.delete）" clearable style="width: 240px"
          @keyup.enter="reload" @clear="reload" />
        <el-select v-model="filters.resourceType" placeholder="资源类型" clearable filterable allow-create
          default-first-option class="filter-select" style="width: 200px" @change="reload">
          <el-option
            v-for="option in RESOURCE_TYPE_OPTIONS"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
        <el-input v-model="filters.operator" placeholder="操作人（姓名 / ID）" clearable style="width: 180px"
          @keyup.enter="reload" @clear="reload" />
        <el-select v-model="filters.result" placeholder="结果" clearable class="filter-select" style="width: 130px"
          @change="reload">
          <el-option label="成功" value="SUCCESS" />
          <el-option label="失败" value="FAILURE" />
        </el-select>
        <el-date-picker
          v-model="timeRange"
          type="daterange"
          value-format="YYYY-MM-DD"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="width: 260px"
          @change="reload"
        />
        <el-button type="primary" @click="reload">
          <el-icon><Search /></el-icon> 查询
        </el-button>
        <el-button @click="resetFilters">重置</el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" stripe border style="width: 100%">
        <el-table-column label="序号" width="64" align="center">
          <template #default="{ $index }">{{ (page - 1) * pageSize + $index + 1 }}</template>
        </el-table-column>
        <el-table-column label="时间" width="170">
          <template #default="{ row }">{{ formatTime(row.occurredAt || row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="动作" min-width="170" show-overflow-tooltip>
          <template #default="{ row }">
            <div>{{ row.actionLabel || row.action }}</div>
            <div class="audit-action-code">{{ row.action }}</div>
          </template>
        </el-table-column>
        <el-table-column label="操作人" width="150">
          <template #default="{ row }">{{ row.operatorName || row.operatorAccount || row.operatorId || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作人类型" width="110" align="center">
          <template #default="{ row }">{{ operatorTypeText(row.operatorType) }}</template>
        </el-table-column>
        <el-table-column label="资源" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <div>{{ resourceTypeText(row.resourceType) }}</div>
            <div class="audit-action-code">{{ row.resourceName || row.resourceId || '-' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="结果" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.result === 'SUCCESS' ? 'success' : 'danger'" size="small">
              {{ row.result === 'SUCCESS' ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="失败原因" width="150" show-overflow-tooltip>
          <template #default="{ row }">{{ row.errorCode || '-' }}</template>
        </el-table-column>
        <el-table-column label="详情" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">{{ detailText(row.detailJson) }}</template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total < 0 ? 0 : total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        class="admin-pagination"
        @size-change="reload"
        @current-change="reload"
      />

      <p v-if="retentionFloor" class="audit-floor">
        {{ formatDate(retentionFloor) }} 之前的审计记录已归档，不在本页可查范围内。
      </p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { getAuditLogs } from '@/api/audit'
import { formatDate, formatTime } from '@/utils/format'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const timeRange = ref([])
const retentionFloor = ref(null)
const filters = reactive({ action: '', resourceType: '', operator: '', result: '' })

const OPERATOR_TYPES = { PLATFORM: '平台', TENANT: '租户' }

/*
 * 资源类型（iam_audit_log.resource_type）中文词表。
 *
 * 口径对齐 SaaS 后台的 `AUDIT_RESOURCE_TYPE_TEXT`（gv_saas_admin/src/constants/terms.js）：
 * 同一种资源在两套后台里必须叫同一个中文名，本仓不再新造第二套词表。
 * 但两边**取值形态不同**——IM 后台实测落库的是（按行数，共 261 行）：
 *   res_resource 45 / ktv_session 42 / reservation 41 / ord_order_item 37 /
 *   inventory_material 34 / ord_order 28 / collect 14 / ord_product 13 /
 *   res_room_type 6 / audit_partition 1（另有 user_account 等更早的记录）
 * 取值来自 `resourceType("…")` 上报点，故这里按实测码收录，不猜前缀形态。
 * 词表外的类型在表格里回退显示原始 resource_type 码（不显示空白），
 * 下拉保留 filterable allow-create，新类型可直接手输。
 */
const RESOURCE_TYPES = {
  // IM 后台实测形态（本页筛选的主要对象）
  user_account: '统一账号',
  adm_client_release: '客户端发布',
  cst_member: '客户',
  ord_order: '订单',
  ord_order_item: '订单加项',
  ord_product: '商品',
  inventory_material: '库存物料',
  res_resource: '包厢',
  res_room_type: '房型',
  ktv_session: '开台会话',
  ktv_server_session: '服务人员会话',
  reservation: '预约',
  collect: '收款',
  refund: '退款',
  pay_shift: '交班',
  pay_daily_closing: '日结',
  pay_channel_config: '支付渠道',
  tenant_payment_method: '支付方式',
  audit_partition: '审计分区',
  tnt_tenant: '租户',
  tnt_tenant_config: '租户配置',
  iam_approval: '审批单',
  role: '角色',
}

/** 下拉选项：中文业务名 + 原始码（便于运营对照动作码/日志原文）。 */
const RESOURCE_TYPE_OPTIONS = Object.entries(RESOURCE_TYPES)
  .map(([value, label]) => ({ value, label: `${label} ${value}` }))
  .sort((left, right) => left.value.localeCompare(right.value))

async function loadData() {
  loading.value = true
  try {
    const res = await getAuditLogs({
      page: page.value,
      pageSize: pageSize.value,
      action: filters.action,
      resourceType: filters.resourceType,
      operator: filters.operator,
      result: filters.result,
      from: timeRange.value?.[0],
      to: timeRange.value?.[1],
    })
    tableData.value = res.items || []
    total.value = res.total ?? 0
    retentionFloor.value = res.retentionFloor || null
  } catch {
    tableData.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function reload() {
  page.value = 1
  loadData()
}

function resetFilters() {
  filters.action = ''
  filters.resourceType = ''
  filters.operator = ''
  filters.result = ''
  timeRange.value = []
  reload()
}

function operatorTypeText(value) {
  return OPERATOR_TYPES[value] || value || '-'
}

/* 未收录的资源类型显示原始码，而不是空白：新类型也能被运营认出来。 */
function resourceTypeText(value) {
  if (!value) {
    return '-'
  }
  return RESOURCE_TYPES[value] || value
}

/* 详情按 JSON 单行展示：审计 detail 是结构化数据，折叠展示会让人误以为「没有内容」。 */
function detailText(detail) {
  if (detail === null || detail === undefined) {
    return '-'
  }
  if (typeof detail === 'string') {
    return detail
  }
  try {
    return JSON.stringify(detail)
  } catch {
    return '-'
  }
}

onMounted(loadData)
</script>

<style scoped>
.audit-action-code {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* 窄屏下「结果」等 select 的选中文本不能被截断（"成功" 显示成 "成"）。 */
.filter-select {
  min-width: 130px;
}

.audit-floor {
  margin: 12px 0 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
</style>
