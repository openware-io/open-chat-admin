<template>
  <div class="admin-page service-manage-page">
    <div class="page-header">
      <h2>服务管理</h2>
      <p class="hint">左侧选择服务类型，右侧维护该类型下的服务入口。</p>
    </div>

    <el-container class="split-wrap" direction="horizontal">
      <el-aside width="268px" class="type-aside">
        <div class="aside-title">服务类型</div>
        <div class="aside-toolbar">
          <el-button type="primary" size="small" @click="openTypeDialog()">新增</el-button>
          <el-button size="small" :disabled="selectedTypeId == null" @click="openTypeDialog(currentType)">
            编辑
          </el-button>
          <el-button size="small" @click="sortDialogVisible = true">排序</el-button>
        </div>
        <el-scrollbar class="type-scroll">
          <div
            v-for="t in types"
            :key="t.id"
            class="type-row"
            :class="{ active: selectedTypeId === t.id }"
            @click="selectType(t.id)"
          >
            <span>{{ t.name }}</span>
            <el-tag v-if="t.hidden" type="info" size="small" class="hidden-tag">隐藏</el-tag>
          </div>
          <div v-if="!types.length && !typesLoading" class="type-empty">暂无类型，请点击新增</div>
        </el-scrollbar>
        <el-button
          class="aside-del"
          text
          type="danger"
          size="small"
          :disabled="selectedTypeId == null"
          @click="deleteCurrentType"
        >
          删除当前类型
        </el-button>
      </el-aside>

      <el-main class="main-pane">
        <template v-if="selectedTypeId != null">
          <div class="main-head">
            <h3>{{ currentTypeName }}</h3>
            <el-button type="primary" @click="openServiceDialog()">新增服务</el-button>
          </div>
          <el-table :data="serviceList" v-loading="servicesLoading" stripe border class="svc-table">
            <el-table-column prop="id" label="ID" width="70" />
            <el-table-column label="图标" width="72">
              <template #default="{ row }">
                <el-image
                  v-if="hasIcon(row.icon)"
                  :src="iconUrls[row.icon]"
                  fit="cover"
                  style="width: 40px; height: 40px; border-radius: 8px"
                  preview-teleported
                />
                <span v-else class="no-icon">—</span>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="服务名称" min-width="120" />
            <el-table-column label="小程序介绍" min-width="160" show-overflow-tooltip>
              <template #default="{ row }">
                <span>{{ row.introduction?.trim() ? row.introduction : '—' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="链接" min-width="200" show-overflow-tooltip>
              <template #default="{ row }">
                <span class="link-text">{{ row.link }}</span>
              </template>
            </el-table-column>
            <el-table-column label="置顶" width="72">
              <template #default="{ row }">
                <el-tag :type="row.isTop ? 'warning' : 'info'" size="small">
                  {{ row.isTop ? '是' : '否' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
                  {{ row.status === 1 ? '启用' : '停用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="sortOrder" label="排序" width="72" />
            <el-table-column label="隐藏" width="86">
              <template #default="{ row }">
                <el-switch
                  :model-value="row.hidden === true"
                  @change="(val) => toggleServiceHidden(row, val)"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button text type="primary" size="small" @click="preview(row.link)">预览</el-button>
                <el-button text type="primary" size="small" @click="openServiceDialog(row)">编辑</el-button>
                <el-popconfirm title="确定删除？" @confirm="handleDeleteService(row.id)">
                  <template #reference>
                    <el-button text type="danger" size="small">删除</el-button>
                  </template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>
          <div class="svc-pagination">
            <el-pagination
              v-model:current-page="servicePage"
              :page-size="servicePageSize"
              :total="serviceTotal"
              layout="total, prev, pager, next"
              @current-change="loadServices"
            />
          </div>
        </template>
        <el-empty v-else-if="!typesLoading" description="暂无服务类型，请先在左侧新增" />
      </el-main>
    </el-container>

    <!-- 类型新增/编辑 -->
    <el-dialog v-model="typeDialogVisible" :title="typeEditingId ? '编辑类型' : '新增类型'" width="420px" destroy-on-close>
      <el-form :model="typeForm" label-width="88px">
        <el-form-item label="类型名称" required>
          <el-input v-model="typeForm.name" maxlength="64" show-word-limit />
        </el-form-item>
        <el-form-item label="排序值">
          <el-input-number v-model="typeForm.sortOrder" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="隐藏">
          <el-switch v-model="typeForm.hidden" :active-value="true" :inactive-value="false" />
          <div style="font-size: 12px; color: #909399; line-height: 1.5; margin-top: 4px">
            隐藏后该分组不在客户端「服务」列表展示；组内小程序仍可被搜索到，也可固定到快捷应用区。
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="typeDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="typeSubmitting" @click="submitType">确定</el-button>
      </template>
    </el-dialog>

    <!-- 类型排序 -->
    <el-dialog v-model="sortDialogVisible" title="调整类型排序" width="480px" destroy-on-close @open="initSortRows">
      <el-table :data="sortRows" border size="small">
        <el-table-column prop="name" label="类型名称" />
        <el-table-column label="排序" width="140">
          <template #default="{ row }">
            <el-input-number v-model="row.sortOrder" :min="0" size="small" />
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="sortDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="sortSaving" @click="saveTypeSort">保存</el-button>
      </template>
    </el-dialog>

    <!-- 服务新增/编辑 -->
    <el-dialog
      v-model="svcDialogVisible"
      :title="svcEditingId ? '编辑服务' : '新增服务'"
      width="580px"
      destroy-on-close
    >
      <el-form :model="svcForm" label-width="96px">
        <el-form-item label="服务名称" required>
          <el-input v-model="svcForm.name" maxlength="128" show-word-limit />
        </el-form-item>
        <el-form-item label="服务类型">
          <el-input :model-value="currentTypeName" disabled />
        </el-form-item>
        <el-form-item label="服务链接" required>
          <el-input
            v-model="svcForm.link"
            type="textarea"
            :rows="2"
            maxlength="1024"
            show-word-limit
            placeholder="H5 / 小程序路径 / 完整 URL"
          />
        </el-form-item>
        <el-form-item label="小程序介绍">
          <el-input
            v-model="svcForm.introduction"
            type="textarea"
            :rows="4"
            maxlength="2000"
            show-word-limit
            placeholder="面向用户的简短说明，将在客户端等服务入口展示（可选）"
          />
        </el-form-item>
        <el-form-item label="图标">
          <div class="icon-field">
            <el-image
              v-if="hasIcon(svcForm.icon)"
              :src="iconDisplayUrl"
              fit="cover"
              class="icon-preview"
              preview-teleported
            />
            <div v-else class="icon-placeholder">无图标</div>
            <div class="icon-actions">
              <input
                ref="iconFileRef"
                type="file"
                accept="image/*"
                class="visually-hidden"
                @change="onPickIconFile"
              />
            </div>
            <div class="icon-btn">
              <el-button size="small" type="primary" @click="iconFileRef?.click()">
                选择图片裁剪上传
              </el-button>
              <el-button
                  v-if="hasIcon(svcForm.icon)"
                  size="small"
                  text
                  type="danger"
                  @click="svcForm.icon = ''"
              >
                清除
              </el-button>
            </div>
            <p class="icon-tip">
              拖动调整选区，导出为 <strong>256×256</strong> 正方形 PNG；上传目录 scope=<code>system</code>
            </p>
          </div>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="svcForm.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="面向对象">
          <el-radio-group v-model="svcForm.audience">
            <el-radio value="consumer">消费者</el-radio>
            <el-radio value="operator">运营后台</el-radio>
          </el-radio-group>
          <div style="font-size: 12px; color: #909399; line-height: 1.5; margin-top: 4px">
            「运营后台」不进客户端固定展示，仅面向运营人员（需 IM 授权后使用）
          </div>
        </el-form-item>
        <el-form-item label="置顶">
          <el-switch v-model="svcForm.isTop" :active-value="true" :inactive-value="false" />
        </el-form-item>
        <el-form-item label="隐藏">
          <el-switch v-model="svcForm.hidden" :active-value="true" :inactive-value="false" />
          <div style="font-size: 12px; color: #909399; line-height: 1.5; margin-top: 4px">
            隐藏后不在客户端「服务」列表展示；仍可被搜索到，用户也可从搜索结果固定到快捷应用区。
          </div>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="svcForm.sortOrder" :min="0" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="svcDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="svcSubmitting" @click="submitService">确定</el-button>
      </template>
    </el-dialog>

    <!-- 图标裁剪：vue-cropper，固定 400×400 操作域 + 固定 256×256 截图框 → 导出 256×256 PNG -->
    <el-dialog
      v-model="cropVisible"
      class="crop-applet-dialog"
      title="裁剪图标（256×256）"
      width="520px"
      destroy-on-close
      append-to-body
      @closed="onCropDialogClosed"
    >
      <p class="crop-hint">
        操作域 <strong>{{ CROP_OPERATION_PX }}×{{ CROP_OPERATION_PX }}</strong>，截图框固定
        <strong>256×256</strong>，可拖移选区、滚轮缩放图片；确定后导出为 256×256 PNG 并上传。
      </p>
      <div
        class="crop-box-vue"
        :style="{ width: `${CROP_OPERATION_PX}px`, height: `${CROP_OPERATION_PX}px` }"
      >
        <VueCropper
          v-if="cropVisible && cropImgSrc"
          :key="cropSessionKey"
          ref="vueCropperRef"
          :img="cropImgSrc"
          :output-size="0.92"
          output-type="png"
          :info="true"
          :can-scale="true"
          :auto-crop="true"
          :auto-crop-width="CROP_FRAME_PX"
          :auto-crop-height="CROP_FRAME_PX"
          :fixed="true"
          :fixed-number="[1, 1]"
          :fixed-box="true"
          :full="false"
          :can-move="true"
          :can-move-box="true"
          :center-box="true"
          :high="false"
          :enlarge="1"
          mode="contain"
          @img-load="onVueCropperImgLoad"
        />
      </div>
      <template #footer>
        <el-button @click="cropVisible = false">取消</el-button>
        <el-button type="primary" :loading="iconUploading" @click="confirmCropUpload">
          确定并上传
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { VueCropper } from 'vue-cropper'
import 'vue-cropper/dist/index.css'
import {
  getServiceTypes,
  createServiceType,
  updateServiceType,
  deleteServiceType,
  batchSortServiceTypes,
  getServices,
  createService,
  updateService,
  deleteService,
} from '@/api/miniappService'
import { getMediaAccessUrl, uploadMedia } from '@/api/media'
import { exportVueCropperSquarePng } from '@/utils/vueCropperExport'

/** 裁剪操作域边长（CSS px），固定正方形 */
const CROP_OPERATION_PX = 400
/** 裁切框边长（CSS px），不可缩放；屏宽容不下时略缩小以保留边距 */
const CROP_FRAME_PX = 256

const types = ref([])
const typesLoading = ref(false)
const selectedTypeId = ref(null)

const serviceList = ref([])
const servicesLoading = ref(false)
const servicePage = ref(1)
const servicePageSize = 20
const serviceTotal = ref(0)
const iconUrls = ref({})

const typeDialogVisible = ref(false)
const typeEditingId = ref(null)
const typeSubmitting = ref(false)
const typeForm = ref({ name: '', sortOrder: 0, hidden: false })

const sortDialogVisible = ref(false)
const sortRows = ref([])
const sortSaving = ref(false)

const svcDialogVisible = ref(false)
const svcEditingId = ref(null)
const svcSubmitting = ref(false)
const svcForm = ref({
  name: '',
  link: '',
  introduction: '',
  icon: '',
  status: 1,
  audience: 'consumer',
  isTop: false,
  hidden: false,
  sortOrder: 0,
})

const currentType = computed(() => types.value.find((t) => t.id === selectedTypeId.value))
const currentTypeName = computed(() => currentType.value?.name ?? '')

const iconFileRef = ref(null)
const cropVisible = ref(false)
const cropImgSrc = ref('')
/** 每次选新图递增，强制重建裁剪组件，避免残留 cropW=0 等状态 */
const cropSessionKey = ref(0)
const vueCropperRef = ref(null)
const vueCropperImgOk = ref(false)
const iconUploading = ref(false)

function onVueCropperImgLoad(status) {
  vueCropperImgOk.value = status === 'success'
}

const iconDisplayUrl = ref('')

function hasIcon(url) {
  return !!(url && String(url).trim())
}

function onPickIconFile(e) {
  const input = e.target
  const f = input.files?.[0]
  input.value = ''
  if (!f) return
  if (!f.type.startsWith('image/')) {
    ElMessage.error('请选择图片文件')
    return
  }
  vueCropperImgOk.value = false
  cropSessionKey.value += 1
  const reader = new FileReader()
  reader.onload = () => {
    cropImgSrc.value = typeof reader.result === 'string' ? reader.result : ''
    cropVisible.value = true
  }
  reader.onerror = () => {
    ElMessage.error('读取图片失败')
  }
  // DataURL：避免 blob: + getCropBlob 内 crossOrigin 二次加载与裁剪区不一致
  reader.readAsDataURL(f)
}

function onCropDialogClosed() {
  vueCropperImgOk.value = false
  cropImgSrc.value = ''
}

async function confirmCropUpload() {
  const cropper = vueCropperRef.value
  if (!cropper || typeof cropper.getCropBlob !== 'function') {
    ElMessage.warning('裁剪组件未就绪')
    return
  }
  if (!vueCropperImgOk.value) {
    ElMessage.warning('请等待图片加载完成')
    return
  }
  iconUploading.value = true
  try {
    const blob = await exportVueCropperSquarePng(cropper, {
      framePx: CROP_FRAME_PX,
      exportPx: CROP_FRAME_PX,
      nextTick,
    })
    const file = new File([blob], 'applet-icon.png', { type: 'image/png' })
    const result = await uploadMedia(file, { scope: 'system', mediaKind: 'image' })
    svcForm.value.icon = result.objectId
    iconDisplayUrl.value = await getMediaAccessUrl(result.objectId)
    cropVisible.value = false
    ElMessage.success('图标已上传')
  } catch (e) {
  } finally {
    iconUploading.value = false
  }
}

onUnmounted(() => {
  cropImgSrc.value = ''
})

function preview(link) {
  if (!link) {
    ElMessage.warning('无链接')
    return
  }
  window.open(link, '_blank', 'noopener,noreferrer')
}

async function loadTypes(selectFirst = false) {
  typesLoading.value = true
  try {
    const data = await getServiceTypes()
    types.value = (data || []).map((r) => ({
      ...r,
      sortOrder: r.sortOrder ?? 0,
    }))
    if (selectFirst && types.value.length) {
      if (selectedTypeId.value == null || !types.value.some((t) => t.id === selectedTypeId.value)) {
        selectedTypeId.value = types.value[0].id
      }
    } else if (types.value.length && selectedTypeId.value != null) {
      if (!types.value.some((t) => t.id === selectedTypeId.value)) {
        selectedTypeId.value = types.value[0]?.id ?? null
      }
    } else if (!types.value.length) {
      selectedTypeId.value = null
    }
  } catch {
    types.value = []
    selectedTypeId.value = null
  } finally {
    typesLoading.value = false
  }
}

function selectType(id) {
  selectedTypeId.value = id
}

async function loadServices() {
  if (selectedTypeId.value == null) {
    serviceList.value = []
    serviceTotal.value = 0
    return
  }
  servicesLoading.value = true
  try {
    const res = await getServices({ typeId: selectedTypeId.value, page: servicePage.value, pageSize: servicePageSize })
    serviceList.value = res.items || []
    serviceTotal.value = res.total || 0
    const objectIds = serviceList.value.map((item) => item.icon).filter((value) => value && !iconUrls.value[value])
    const urls = await Promise.all(objectIds.map(async (objectId) => [objectId, await getMediaAccessUrl(objectId)]))
    iconUrls.value = { ...iconUrls.value, ...Object.fromEntries(urls) }
  } catch {
    serviceList.value = []
    serviceTotal.value = 0
  } finally {
    servicesLoading.value = false
  }
}

watch(selectedTypeId, () => {
  servicePage.value = 1
  loadServices()
}, { immediate: true })

function openTypeDialog(row) {
  if (row) {
    typeEditingId.value = row.id
    typeForm.value = { name: row.name, sortOrder: row.sortOrder ?? 0, hidden: row.hidden === true }
  } else {
    typeEditingId.value = null
    const max = types.value.reduce((m, t) => Math.max(m, t.sortOrder ?? 0), -1)
    typeForm.value = { name: '', sortOrder: max >= 0 ? max + 1 : 0, hidden: false }
  }
  typeDialogVisible.value = true
}

async function submitType() {
  if (!typeForm.value.name?.trim()) {
    ElMessage.warning('请填写类型名称')
    return
  }
  typeSubmitting.value = true
  try {
    const payload = {
      name: typeForm.value.name.trim(),
      sortOrder: typeForm.value.sortOrder,
      hidden: typeForm.value.hidden ? 1 : 0,
    }
    if (typeEditingId.value) {
      await updateServiceType(typeEditingId.value, payload)
      ElMessage.success('已更新')
    } else {
      await createServiceType(payload)
      ElMessage.success('已创建')
    }
    typeDialogVisible.value = false
    await loadTypes(true)
    await loadServices()
  } catch (e) {
  } finally {
    typeSubmitting.value = false
  }
}

function initSortRows() {
  sortRows.value = types.value.map((t) => ({
    id: t.id,
    name: t.name,
    sortOrder: t.sortOrder ?? 0,
  }))
}

async function saveTypeSort() {
  const items = sortRows.value.map((r) => ({ id: r.id, sortOrder: r.sortOrder ?? 0 }))
  sortSaving.value = true
  try {
    await batchSortServiceTypes(items)
    ElMessage.success('排序已保存')
    sortDialogVisible.value = false
    await loadTypes(true)
  } catch (e) {
  } finally {
    sortSaving.value = false
  }
}

async function deleteCurrentType() {
  if (selectedTypeId.value == null) return
  try {
    await ElMessageBox.confirm('删除后不可恢复；若该类型下仍有服务将无法删除。', '删除类型', {
      type: 'warning',
    })
    await deleteServiceType(selectedTypeId.value)
    ElMessage.success('已删除')
    selectedTypeId.value = null
    await loadTypes(true)
    await loadServices()
  } catch (e) {
    if (e !== 'cancel') {
    }
  }
}

function openServiceDialog(row) {
  if (selectedTypeId.value == null) {
    ElMessage.warning('请先选择服务类型')
    return
  }
  if (row) {
    svcEditingId.value = row.id
    svcForm.value = {
      name: row.name,
      link: row.link,
      introduction: row.introduction || '',
      icon: row.icon || '',
      status: row.status,
      audience: row.audience || 'consumer',
      isTop: !!row.isTop,
      hidden: row.hidden === true,
      sortOrder: row.sortOrder ?? 0,
    }
  } else {
    svcEditingId.value = null
    svcForm.value = {
      name: '',
      link: '',
      introduction: '',
      icon: '',
      status: 1,
      audience: 'consumer',
      isTop: false,
      hidden: false,
      sortOrder: 0,
    }
  }
  void refreshIconUrl()
  svcDialogVisible.value = true
}

async function refreshIconUrl() {
  iconDisplayUrl.value = ''
  if (!svcForm.value.icon) return
  try {
    iconDisplayUrl.value = await getMediaAccessUrl(svcForm.value.icon)
  } catch {
    iconDisplayUrl.value = ''
  }
}

async function submitService() {
  if (!svcForm.value.name?.trim()) {
    ElMessage.warning('请填写服务名称')
    return
  }
  if (!svcForm.value.link?.trim()) {
    ElMessage.warning('请填写服务链接')
    return
  }
  svcSubmitting.value = true
  try {
    const payload = {
      typeId: selectedTypeId.value,
      name: svcForm.value.name.trim(),
      link: svcForm.value.link.trim(),
      introduction: (svcForm.value.introduction || '').trim(),
      icon: (svcForm.value.icon || '').trim(),
      status: svcForm.value.status,
      audience: svcForm.value.audience || 'consumer',
      isTop: svcForm.value.isTop ? 1 : 0,
      hidden: svcForm.value.hidden ? 1 : 0,
      sortOrder: svcForm.value.sortOrder ?? 0,
    }
    if (svcEditingId.value) {
      await updateService(svcEditingId.value, payload)
      ElMessage.success('已更新')
    } else {
      await createService(payload)
      ElMessage.success('已创建')
    }
    svcDialogVisible.value = false
    await loadServices()
  } catch (e) {
  } finally {
    svcSubmitting.value = false
  }
}

async function handleDeleteService(id) {
  try {
    await deleteService(id)
    ElMessage.success('已删除')
    await loadServices()
  } catch (e) {
  }
}

/// 列表内快速切换隐藏：只提交 hidden 字段，其余字段由后端按"未提交则保持原值"处理。
async function toggleServiceHidden(row, next) {
  try {
    await updateService(row.id, { hidden: next ? 1 : 0 })
    ElMessage.success(next ? '已隐藏（仍可搜索、可固定）' : '已取消隐藏')
    await loadServices()
  } catch (e) {
    await loadServices()
  }
}

onMounted(async () => {
  await loadTypes(true)
})
</script>

<style scoped>
.service-manage-page {
  min-height: calc(100vh - 120px);
}
.page-header {
  margin-bottom: 16px;
}
.page-header h2 {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 600;
}
.hint {
  margin: 0;
  font-size: 13px;
  color: #909399;
}

.split-wrap {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--admin-radius, 10px);
  overflow: hidden;
  background: var(--el-bg-color);
  box-shadow: var(--admin-shadow-card, 0 1px 3px rgba(0, 0, 0, 0.05));
  min-height: 520px;
}

.type-aside {
  border-right: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-blank);
  display: flex;
  flex-direction: column;
  padding: 0;
}

.aside-title {
  padding: 14px 16px 8px;
  font-weight: 600;
  font-size: 14px;
  color: #303133;
}

.aside-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 0 12px 12px;
}

.type-scroll {
  flex: 1;
  min-height: 200px;
}

.type-row {
  padding: 12px 16px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: #606266;
  border-left: 3px solid transparent;
  transition: background 0.15s, color 0.15s;
}
.hidden-tag {
  flex: none;
}
.type-row:hover {
  background: var(--el-fill-color-light);
}
.type-row.active {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: 500;
  border-left-color: var(--el-color-primary);
}

.type-empty {
  padding: 24px 16px;
  text-align: center;
  color: #909399;
  font-size: 13px;
}

.aside-del {
  margin: 8px 12px 12px;
  align-self: flex-start;
}

.main-pane {
  padding: 16px 20px;
  background: var(--el-bg-color);
}

.main-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.main-head h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.svc-table {
  width: 100%;
}
.svc-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}
.link-text {
  font-size: 12px;
  color: #606266;
}
.no-icon {
  color: #c0c4cc;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.icon-field {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 12px;
}
.icon-preview {
  width: 72px;
  height: 72px;
  border-radius: 10px;
  border: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
}
.icon-placeholder {
  width: 72px;
  height: 72px;
  border-radius: 10px;
  border: 1px dashed var(--el-border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #c0c4cc;
  flex-shrink: 0;
}
.icon-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.icon-btn {
  width: 100%;
}

.icon-tip {
  width: 100%;
  margin: 0;
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}

.crop-hint {
  margin: 0 0 12px;
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}

/* vue-cropper 外层固定正方形（边长与脚本 CROP_OPERATION_PX 一致） */
.crop-box-vue {
  box-sizing: border-box;
  flex-shrink: 0;
  margin: 0 auto;
  background: #1a1a1a;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

.crop-box-vue :deep(.vue-cropper) {
  width: 100%;
  height: 100%;
}

.crop-applet-dialog :deep(.el-dialog__body) {
  overflow-x: auto;
}
</style>
