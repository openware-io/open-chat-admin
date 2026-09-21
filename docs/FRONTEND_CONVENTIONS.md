# Admin 前端基础规范

状态：生效。适用范围：`gv_chat_admin` 的所有页面、组件与后续迭代需求。

本文沉淀后台列表类页面反复踩过的「基础规范问题」：列表结构、序号、分页、表头、时间、状态标签、字段命名等。新页面与改动必须遵循，代码评审据此核对。

## 一、页面骨架

列表页统一使用如下层级结构，禁止在 `admin-page` 外另起布局：

```html
<div class="admin-page">
  <div class="page-header"><h2>页面标题</h2></div>
  <div class="admin-card">
    <!-- 筛选栏 + 表格 + 分页 -->
  </div>
</div>
```

- 筛选栏统一使用 `filter-bar`（全局样式已含 `flex-wrap: wrap`），查询按钮 `type="primary"`，并提供「重置」恢复默认条件：

```html
<div class="filter-bar">
  <el-input v-model="filters.keyword" placeholder="…" clearable
    style="width: 240px" @clear="loadData" @keyup.enter="loadData" />
  <el-button type="primary" @click="loadData"><el-icon><Search /></el-icon> 查询</el-button>
  <el-button @click="resetFilters"><el-icon><Refresh /></el-icon> 重置</el-button>
</div>
```

## 二、列表表格规范

### 1. 序号列（必需）

每个列表第一列必须是「序号」，宽度 `64`、居中，跨页连续：

```html
<el-table-column label="序号" width="64" align="center">
  <template #default="{ $index }">{{ (page - 1) * pageSize + $index + 1 }}</template>
</el-table-column>
```

> 注意：分页变量名必须与当前表格对应（如积分流水表用 `ledgerPage` / `ledgerPageSize`），不能用错别的表格变量。

### 2. 分页（必需）

列表必须配 `el-pagination`，统一 `layout="total, sizes, prev, pager, next"`：

```html
<el-pagination
  v-model:current-page="page"
  v-model:page-size="pageSize"
  :total="total"
  :page-sizes="[10, 20, 50]"
  layout="total, sizes, prev, pager, next"
  class="admin-pagination"
  @size-change="loadData"
  @current-change="loadData"
/>
```

- `page` / `pageSize` / `total` 必须是响应式变量；`loadData` 时把 `page`、`pageSize` 传给接口并读取 `result.total`。

### 3. 表头统一居中

全局样式已生效（`src/styles/global.css`），**无需**在每个列上重复写 `header-align`。所有表头左右上下居中，表体单元格保持各自对齐方式。

### 4. 时间列

- 时间列统一用 `formatTime()`（`@/utils/format`，dayjs → `YYYY-MM-DD HH:mm:ss`）格式化，**禁止**直接展示后端原始 ISO 字符串（`2026-08-22T12:34:56`）。
- 列宽要给足，避免时间换行；如好友「添加时间」等，加宽至 `190` 左右并走 `formatTime`：

```html
<el-table-column label="添加时间" width="190" sortable>
  <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
</el-table-column>
```

### 5. 状态 / 枚举列

状态统一用 `el-tag`，并在 `<script setup>` 中提供「值 → 文案 / 标签类型」映射函数，禁止在模板里堆三元判断：

```html
<el-table-column label="状态" width="90" align="center">
  <template #default="{ row }">
    <el-tag :type="statusType(row.status)" size="small">{{ statusText(row.status) }}</el-tag>
  </template>
</el-table-column>
```

### 6. 复合信息分列

用户/积分等列表里「头像 + 昵称 + 账号」禁止挤在同一单元格上下堆叠，必须分列：

```html
<el-table-column label="头像" width="70" align="center">…</el-table-column>
<el-table-column label="昵称" min-width="140">…</el-table-column>
<el-table-column label="账号" min-width="160">…</el-table-column>
```

## 三、字段与数据契约

- **后端返回 camelCase**（`createdAt` / `updatedAt` / `status` …），前端 `prop`、`row.xxx` 必须用 **camelCase**，**禁止**使用 `created_at` / `updated_at` 等 snake_case。历史上「注册时间一直为空」就是 snake_case 与后端 camelCase 不匹配导致。
- 金额 / 数值列右对齐（`align="right"`）；纯展示时间、状态、序号等居中；文本列默认左对齐。
- 时间、枚举、状态展示统一经 `formatTime` / 映射函数，不在 `el-table-column` 上直接用 `prop` 输出原始时间或原始枚举。

## 四、验证与评审

- 提交前执行 `npm run validate:error-messages` 和 `npm run build`，二者均需通过。
- 代码评审核对：序号列存在、分页完整、时间已格式化、状态走映射、字段名为 camelCase、表头未重复写对齐样式。
