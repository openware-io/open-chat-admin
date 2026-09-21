<template>
  <div class="admin-page">
    <div class="page-header">
      <h2>系统配置</h2>
    </div>

    <el-tabs v-model="activeTab" type="border-card">
      <!-- 基础配置 -->
      <el-tab-pane label="基础配置" name="basic">
        <el-form label-width="140px" style="max-width: 600px; margin-top: 20px">
          <el-form-item label="APP 名称">
            <el-input v-model="configValues['app.name']" />
          </el-form-item>
          <el-form-item label="客服链接">
            <el-input v-model="configValues['app.supportUrl']" />
          </el-form-item>
          <el-form-item label="系统公告">
            <el-input v-model="configValues['app.announcement']" type="textarea" :rows="3" />
          </el-form-item>
          <el-form-item label="消息存储时长">
            <el-input-number v-model.number="configValues['message.retentionDays']" :min="1" :max="365" />
            <span style="margin-left: 8px; color: #909399">天</span>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="saveGroup('basic')">保存配置</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 功能开关 -->
      <el-tab-pane label="功能开关" name="features">
        <div class="feature-groups">
          <div class="feature-group" v-for="group in featureGroups" :key="group.title">
            <div class="feature-group-title">{{ group.title }}</div>
            <el-row :gutter="20">
              <el-col :span="12" v-for="item in group.items" :key="item.key">
                <div class="feature-item">
                  <div class="feature-item-main">
                    <div class="feature-item-label">{{ item.label }}</div>
                    <div class="feature-item-desc">{{ item.desc }}</div>
                  </div>
                  <el-switch v-model="configValues[item.key]" />
                </div>
              </el-col>
            </el-row>
          </div>
        </div>
        <div class="config-save-bar">
          <el-button type="primary" @click="saveGroup('features')">保存配置</el-button>
        </div>
      </el-tab-pane>

      <!-- 通话配置 -->
      <el-tab-pane label="通话配置" name="rtc">
        <el-form label-width="160px" style="max-width: 600px; margin-top: 20px">
          <el-form-item label="视频清晰度">
            <el-select v-model="configValues['rtc.videoQuality']" style="width: 200px">
              <el-option label="流畅 (360p)" value="360p" />
              <el-option label="标清 (480p)" value="480p" />
              <el-option label="高清 (720p)" value="720p" />
              <el-option label="超清 (1080p)" value="1080p" />
            </el-select>
          </el-form-item>
          <el-form-item label="视频码率 (kbps)">
            <el-slider v-model.number="configValues['rtc.videoBitrate']" :min="200" :max="4000" :step="100" show-input />
          </el-form-item>
          <el-form-item label="音频码率 (kbps)">
            <el-slider v-model.number="configValues['rtc.audioBitrate']" :min="32" :max="256" :step="8" show-input />
          </el-form-item>
          <el-form-item label="最大通话时长">
            <el-input-number v-model.number="configValues['rtc.maxCallDuration']" :min="1" :max="480" />
            <span style="margin-left: 8px; color: #909399">分钟</span>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="saveGroup('rtc')">保存配置</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 上传配置 -->
      <el-tab-pane label="上传配置" name="upload">
        <el-form label-width="160px" style="max-width: 600px; margin-top: 20px">
          <el-form-item label="图片大小限制">
            <el-input-number v-model.number="configValues['upload.maxImageSize']" :min="1" :max="50" />
            <span style="margin-left: 8px; color: #909399">MB</span>
          </el-form-item>
          <el-form-item label="文件大小限制">
            <el-input-number v-model.number="configValues['upload.maxFileSize']" :min="1" :max="200" />
            <span style="margin-left: 8px; color: #909399">MB</span>
          </el-form-item>
          <el-form-item label="视频大小限制">
            <el-input-number v-model.number="configValues['upload.maxVideoSize']" :min="1" :max="500" />
            <span style="margin-left: 8px; color: #909399">MB</span>
          </el-form-item>
          <el-form-item label="上传限速">
            <el-input-number v-model.number="configValues['upload.speedLimit']" :min="0" :max="10240" />
            <span style="margin-left: 8px; color: #909399">KB/s (0 为不限)</span>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="saveGroup('upload')">保存配置</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 推送配置 -->
      <el-tab-pane label="推送配置" name="push">
        <el-form label-width="160px" style="max-width: 600px; margin-top: 20px">
          <el-form-item label="推送总开关">
            <el-switch v-model="configValues['push.enabled']" />
          </el-form-item>
          <el-divider content-position="left">推送渠道</el-divider>
          <el-form-item label="APNs（iOS 原生 token）">
            <el-switch v-model="configValues['push.apnsEnabled']" :disabled="!configValues['push.enabled']" />
          </el-form-item>
          <el-form-item label="FCM（Firebase）">
            <el-switch v-model="configValues['push.fcmEnabled']" :disabled="!configValues['push.enabled']" />
          </el-form-item>
          <el-form-item label="极光 JPush">
            <el-switch v-model="configValues['push.jpushEnabled']" :disabled="!configValues['push.enabled']" />
          </el-form-item>
          <el-alert
            type="info"
            :closable="false"
            show-icon
            style="max-width: 560px; margin-bottom: 12px"
            title="客户端注册时需上报 pushProvider（fcm / apns / jpush）。密钥：FCM 用服务账号 JSON；APNs 用 .p8 与环境变量；极光用 JPUSH_APP_KEY / JPUSH_MASTER_SECRET。"
          />
          <el-form-item>
            <el-button type="primary" @click="saveGroup('push')">保存配置</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 地图配置（客户端瓦片与逆地理编码；键名与后端 system_configs 一致） -->
      <el-tab-pane label="地图配置" name="map">
        <el-form label-width="180px" style="max-width: 720px; margin-top: 20px">
          <el-form-item label="瓦片 URL 模板">
            <el-input
              v-model="configValues['map.tileUrl']"
              type="textarea"
              :autosize="{ minRows: 2, maxRows: 4 }"
              placeholder="例如 https://example.com/tiles/{z}/{x}/{y}，须含 {z}、{x}、{y}"
            />
          </el-form-item>
          <el-form-item label="瓦片子域 / 服务编号">
            <el-input
              v-model="configValues['map.subdomains']"
              placeholder="逗号分隔，如 0,1,2,3 或 a,b,c；URL 模板中用 {s}；留空表示不轮询"
            />
          </el-form-item>
          <el-form-item label="逆地理编码服务地址">
            <el-input
              v-model="configValues['map.reverseGeocodeUrl']"
              type="textarea"
              :autosize="{ minRows: 2, maxRows: 3 }"
              placeholder="GET 根地址，无末尾斜杠；客户端会附加 lat、lon、format 等参数"
            />
          </el-form-item>
          <el-alert
            type="info"
            :closable="false"
            show-icon
            style="max-width: 640px; margin-bottom: 16px"
            title="留空表示使用客户端内置默认；保存后由 IM 服务写入 system_configs，客户端需在拉取 /config/client 后生效。"
          />
          <el-form-item>
            <el-button type="primary" @click="saveGroup('map')">保存配置</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getAllConfigs, batchUpdateConfigs } from '@/api/config'

const activeTab = ref('basic')
const configValues = reactive({})

const featureGroups = [
  {
    title: '聊天功能',
    items: [
      { key: 'feature.privateChatEnabled', label: '单聊功能', desc: '一对一会话' },
      { key: 'feature.groupChatEnabled', label: '群聊功能', desc: '多人会话' },
      { key: 'feature.hideGroupMemberInfo', label: '群成员隐私保护', desc: '群内隐藏非好友成员的昵称和头像（平台级）' },
      { key: 'feature.recallEnabled', label: '消息撤回', desc: '发送方撤回消息' },
      { key: 'feature.readReceiptEnabled', label: '已读回执', desc: '消息已读状态' },
      { key: 'feature.channelEnabled', label: '频道（单向广播）', desc: '频道主发布、订阅者只读' },
      { key: 'feature.secretChatEnabled', label: '私密聊天（E2EE）', desc: '端到端加密 · 不同步到新设备' },
      { key: 'feature.secretGroupChatEnabled', label: '私密群聊', desc: '对应 Telegram 群组业务 · 逐成员加密' },
      { key: 'feature.groupDeleteEveryoneEnabled', label: '私密群聊 · 删除所有人/撤回', desc: '' },
      { key: 'feature.groupEditMessageEnabled', label: '私密群聊 · 编辑消息', desc: '' },
      { key: 'feature.groupAnonymityEnabled', label: '私密群聊 · 匿名发言', desc: '' },
      { key: 'feature.groupInviteLinkEnabled', label: '私密群聊 · 邀请链接', desc: '' },
      { key: 'feature.groupPinnedEnabled', label: '私密群聊 · 置顶/公告', desc: '' },
    ],
  },
  {
    title: '通话功能',
    items: [
      { key: 'feature.voiceCallEnabled', label: '语音通话', desc: '' },
      { key: 'feature.videoCallEnabled', label: '视频通话', desc: '' },
    ],
  },
  {
    title: '内容审核',
    items: [
      { key: 'feature.imageAuditEnabled', label: '图片内容审核', desc: '' },
      { key: 'feature.voiceAuditEnabled', label: '语音内容审核', desc: '' },
    ],
  },
]

function parseValue(val) {
  if (val === undefined || val === null) return ''
  try {
    return JSON.parse(val)
  } catch {
    return val
  }
}

async function loadConfigs() {
  try {
    const data = await getAllConfigs()
    // 后端返回 ConfigResponse 数组：[{id, configKey, configValue, ...}]
    if (Array.isArray(data)) {
      for (const item of data) {
        if (item && item.configKey) {
          configValues[item.configKey] = parseValue(item.configValue)
        }
      }
    } else {
      // 兼容旧的对象形态 { key: { value } }
      for (const [key, item] of Object.entries(data)) {
        configValues[key] = parseValue(item?.value ?? item)
      }
    }
  } catch (err) {
    console.error('Load configs failed:', err)
  }
}

async function saveGroup(group) {
  const groupKeys = Object.keys(configValues).filter(k => {
    const prefix = k.split('.')[0]
    const groupMap = {
      app: 'basic', message: 'basic',
      feature: 'features',
      rtc: 'rtc',
      upload: 'upload',
      push: 'push',
      map: 'map',
    }
    return groupMap[prefix] === group
  })

  // 字符串原样存储（避免 JSON.stringify 给 app.name 等加引号）；布尔/数字才 JSON 序列化。
  const configs = groupKeys.map(key => ({
    configKey: key,
    configValue: typeof configValues[key] === 'string' ? configValues[key] : JSON.stringify(configValues[key]),
  }))

  try {
    await batchUpdateConfigs(configs)
    ElMessage.success('配置保存成功')
  } catch (err) {
    console.error('Save config failed:', err)
  }
}

onMounted(loadConfigs)
</script>

<style scoped>
.feature-groups {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 16px;
  max-width: 960px;
}

.feature-group {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 16px 20px;
  background: #fff;
}

.feature-group-title {
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 8px;
}

.feature-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px dashed var(--el-border-color-extra-light);
}

.feature-item:last-child {
  border-bottom: none;
}

.feature-item-label {
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.feature-item-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}

.config-save-bar {
  margin-top: 16px;
}
</style>
