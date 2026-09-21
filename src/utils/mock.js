/**
 * Mock data generators for admin pages.
 * Used until backend admin API endpoints are implemented.
 */
import dayjs from 'dayjs'

const avatarBase = 'https://api.dicebear.com/7.x/avataaars/svg?seed='
const names = ['张三', '李四', '王五', '赵六', '孙七', '周八', '吴九', '郑十', '冯一', '陈二', '楚天', '林风', '方圆', '韩雪', '秦月', '宋云', '唐星', '许阳', '曹海', '袁石']
const usernames = ['zhangsan', 'lisi', 'wangwu', 'zhaoliu', 'sunqi', 'zhouba', 'wujiu', 'zhengshi', 'fengyi', 'chener', 'chutian', 'linfeng', 'fangyuan', 'hanxue', 'qinyue', 'songyun', 'tangxing', 'xuyang', 'caohai', 'yuanshi']

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randItem(arr) {
  return arr[rand(0, arr.length - 1)]
}

function randDate(daysBack = 90) {
  return dayjs().subtract(rand(0, daysBack), 'day').subtract(rand(0, 23), 'hour').subtract(rand(0, 59), 'minute').toISOString()
}

export function mockUsers(page = 1, pageSize = 20) {
  const total = 156
  const list = []
  const start = (page - 1) * pageSize
  for (let i = 0; i < Math.min(pageSize, total - start); i++) {
    const idx = (start + i) % names.length
    list.push({
      id: String(1000 + start + i),
      username: usernames[idx] + (start + i),
      nickname: names[idx],
      avatar: avatarBase + (start + i),
      email: `${usernames[idx]}${start + i}@example.com`,
      phone: `138${String(rand(10000000, 99999999))}`,
      signature: randItem(['天气不错', '今天也加油', '', '在线中', '忙碌勿扰']),
      status: Math.random() > 0.1 ? 'active' : 'disabled',
      created_at: randDate(365),
      updated_at: randDate(30),
    })
  }
  return { list, total, page, pageSize }
}

export function mockMessages(page = 1, pageSize = 20) {
  const total = 2340
  const msgTypes = ['text', 'image', 'file', 'audio', 'video']
  const contents = ['你好！', '在吗？', '明天一起吃饭', '收到了，谢谢', '好的没问题', '[图片]', '[文件]', '晚上有空吗', '已发送', '马上到']
  const list = []
  const start = (page - 1) * pageSize
  for (let i = 0; i < Math.min(pageSize, total - start); i++) {
    const chatType = Math.random() > 0.3 ? 'private' : 'group'
    list.push({
      id: String(5000 + start + i),
      msg_id: `msg_${Date.now()}_${start + i}`,
      from_user_id: String(1000 + rand(0, 19)),
      from_user: { nickname: randItem(names), avatar: avatarBase + rand(0, 19) },
      to_id: chatType === 'private' ? String(1000 + rand(0, 19)) : String(100 + rand(0, 9)),
      chat_type: chatType,
      msg_type: randItem(msgTypes),
      content: randItem(contents),
      status: randItem(['sent', 'delivered', 'read']),
      created_at: randDate(30),
    })
  }
  list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  return { list, total, page, pageSize }
}

export function mockFriends(page = 1, pageSize = 20) {
  const total = 89
  const list = []
  const start = (page - 1) * pageSize
  for (let i = 0; i < Math.min(pageSize, total - start); i++) {
    const idx1 = rand(0, names.length - 1)
    const idx2 = (idx1 + rand(1, names.length - 1)) % names.length
    list.push({
      id: String(2000 + start + i),
      user_id: String(1000 + idx1),
      friend_id: String(1000 + idx2),
      user: { nickname: names[idx1], avatar: avatarBase + idx1 },
      friend: { nickname: names[idx2], avatar: avatarBase + idx2 },
      remark: Math.random() > 0.5 ? randItem(['同事', '同学', '老友', '']) : '',
      group_name: randItem(['我的好友', '同事', '家人', '同学', '']),
      status: Math.random() > 0.05 ? 'normal' : 'blocked',
      created_at: randDate(180),
    })
  }
  return { list, total, page, pageSize }
}

export function mockFriendRequests(page = 1, pageSize = 20) {
  const total = 45
  const list = []
  const start = (page - 1) * pageSize
  for (let i = 0; i < Math.min(pageSize, total - start); i++) {
    const idx1 = rand(0, names.length - 1)
    const idx2 = (idx1 + rand(1, names.length - 1)) % names.length
    list.push({
      id: String(3000 + start + i),
      from_user_id: String(1000 + idx1),
      to_user_id: String(1000 + idx2),
      fromUser: { nickname: names[idx1], avatar: avatarBase + idx1 },
      toUser: { nickname: names[idx2], avatar: avatarBase + idx2 },
      message: randItem(['你好，我是同事', '加个好友吧', '久仰大名', '', '请求添加好友']),
      status: randItem(['pending', 'accepted', 'rejected']),
      created_at: randDate(60),
      updated_at: randDate(30),
    })
  }
  return { list, total, page, pageSize }
}

export function mockOnlineStats() {
  return {
    onlineCount: rand(80, 200),
    totalUsers: 156,
    peakToday: rand(150, 300),
    wsConnections: rand(80, 200),
    activeSessions: rand(20, 80),
    activeCallRooms: rand(0, 10),
  }
}

export function mockOnlineUsers(page = 1, pageSize = 20) {
  const total = rand(80, 200)
  const list = []
  const start = (page - 1) * pageSize
  for (let i = 0; i < Math.min(pageSize, total - start); i++) {
    const idx = rand(0, names.length - 1)
    list.push({
      userId: String(1000 + idx + i),
      nickname: names[idx],
      avatar: avatarBase + (idx + i),
      loginTime: randDate(1),
      ip: `192.168.${rand(1, 255)}.${rand(1, 255)}`,
      device: randItem(['iOS', 'Android', 'Web', 'Desktop']),
    })
  }
  return { list, total, page, pageSize }
}

export function mockSessions() {
  const list = []
  for (let i = 0; i < rand(10, 30); i++) {
    const chatType = Math.random() > 0.4 ? 'private' : 'group'
    const participants = []
    const count = chatType === 'private' ? 2 : rand(3, 12)
    for (let j = 0; j < count; j++) {
      const idx = rand(0, names.length - 1)
      participants.push({ userId: String(1000 + idx + j), nickname: names[idx] })
    }
    list.push({
      sessionId: `sess_${i}`,
      chatType,
      participants,
      messageCount: rand(5, 200),
      lastActiveAt: randDate(0),
      startedAt: randDate(1),
    })
  }
  return list
}

export function mockCallRooms() {
  const types = ['video', 'audio']
  const qualities = ['excellent', 'good', 'fair', 'poor']
  const list = []
  for (let i = 0; i < rand(0, 8); i++) {
    const participants = []
    const count = rand(2, 4)
    for (let j = 0; j < count; j++) {
      const idx = rand(0, names.length - 1)
      participants.push({
        userId: String(1000 + idx + j),
        nickname: names[idx],
        joinedAt: randDate(0),
      })
    }
    list.push({
      roomId: `room_${1000 + i}`,
      type: randItem(types),
      participants,
      quality: randItem(qualities),
      duration: rand(30, 3600),
      startedAt: dayjs().subtract(rand(1, 120), 'minute').toISOString(),
    })
  }
  return list
}

export function mockServerMetrics() {
  const hours = []
  for (let i = 23; i >= 0; i--) {
    const t = dayjs().subtract(i, 'hour').format('HH:00')
    hours.push({
      time: t,
      cpu: rand(10, 85),
      memory: rand(40, 80),
      qps: rand(50, 500),
      wsConns: rand(50, 300),
      bandwidth: rand(10, 100),
      inTraffic: rand(5, 60),
      outTraffic: rand(5, 60),
      msgSuccessRate: (95 + Math.random() * 5).toFixed(1),
      msgDelay: rand(10, 200),
    })
  }
  return {
    current: {
      cpu: rand(20, 60),
      memory: rand(45, 75),
      qps: rand(100, 400),
      wsConns: rand(80, 250),
      bandwidth: rand(20, 80),
      inTraffic: rand(10, 50),
      outTraffic: rand(10, 50),
      msgSuccessRate: (97 + Math.random() * 3).toFixed(1),
      msgDelay: rand(15, 80),
      uptime: rand(100000, 9999999),
    },
    history: hours,
    nodes: [
      { name: 'node-01', ip: '10.0.1.10', status: 'normal', cpu: rand(20, 60), memory: rand(40, 70), connections: rand(50, 150) },
      { name: 'node-02', ip: '10.0.1.11', status: 'normal', cpu: rand(20, 60), memory: rand(40, 70), connections: rand(50, 150) },
      { name: 'node-03', ip: '10.0.1.12', status: Math.random() > 0.2 ? 'normal' : 'abnormal', cpu: rand(20, 90), memory: rand(40, 90), connections: rand(0, 150) },
    ],
  }
}

export function mockLogs(page = 1, pageSize = 50) {
  const levels = ['INFO', 'WARN', 'ERROR', 'DEBUG']
  const modules = ['Gateway', 'AuthService', 'MessageService', 'UserService', 'RTCService', 'Redis', 'MySQL']
  const templates = {
    INFO: ['用户 {user} 登录成功', 'WebSocket 连接建立 {user}', '消息投递成功 msg_{id}', '群组创建成功 group_{id}'],
    WARN: ['消息投递延迟 {ms}ms', 'Redis 连接重试', '用户 {user} 频率限制触发', '内存使用率超过 80%'],
    ERROR: ['WebSocket 连接异常断开', '消息持久化失败 msg_{id}', '数据库连接超时', 'JWT 验证失败'],
    DEBUG: ['收到心跳包 {user}', 'Redis pub/sub 消息', '路由匹配 /api/{path}', 'TypeORM 查询耗时 {ms}ms'],
  }
  const total = 5000
  const list = []
  for (let i = 0; i < Math.min(pageSize, total - (page - 1) * pageSize); i++) {
    const level = randItem(levels)
    let msg = randItem(templates[level])
    msg = msg.replace('{user}', randItem(usernames))
      .replace('{id}', String(rand(1000, 9999)))
      .replace('{ms}', String(rand(50, 5000)))
      .replace('{path}', randItem(['messages/history', 'users/me', 'friends', 'groups/mine']))
    list.push({
      id: String(10000 + (page - 1) * pageSize + i),
      timestamp: randDate(7),
      level,
      module: randItem(modules),
      message: msg,
    })
  }
  list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  return { list, total, page, pageSize }
}

export function mockKeywords() {
  const categories = ['政治', '色情', '广告', '暴力', '诈骗', '其他']
  const words = ['测试敏感词1', '垃圾广告', '违规内容', '代开发票', '刷单', '免费领取', '低价转让', '内部渠道', '兼职日结', '加微信']
  return words.map((w, i) => ({
    id: String(i + 1),
    word: w,
    category: randItem(categories),
    level: randItem(['low', 'medium', 'high']),
    enabled: Math.random() > 0.2,
    created_at: randDate(180),
    hitCount: rand(0, 500),
  }))
}

export function mockViolations(page = 1, pageSize = 20) {
  const types = ['sensitive_word', 'spam', 'ad', 'abuse', 'image']
  const actions = ['warn', 'mute', 'ban', 'pending']
  const total = 230
  const list = []
  for (let i = 0; i < Math.min(pageSize, total - (page - 1) * pageSize); i++) {
    const idx = rand(0, names.length - 1)
    list.push({
      id: String(4000 + (page - 1) * pageSize + i),
      userId: String(1000 + idx),
      user: { nickname: names[idx], avatar: avatarBase + idx },
      type: randItem(types),
      content: randItem(['违规文字内容...', '[图片]', '广告信息...', '刷屏消息...']),
      action: randItem(actions),
      reason: randItem(['触发敏感词', '频率过高', '图片违规', '用户举报']),
      created_at: randDate(60),
    })
  }
  return { list, total, page, pageSize }
}

export function mockReports(page = 1, pageSize = 20) {
  const reasons = ['骚扰', '广告', '色情', '欺诈', '人身攻击', '其他']
  const statuses = ['pending', 'processing', 'resolved', 'dismissed']
  const total = 78
  const list = []
  for (let i = 0; i < Math.min(pageSize, total - (page - 1) * pageSize); i++) {
    const idx1 = rand(0, names.length - 1)
    const idx2 = (idx1 + rand(1, names.length - 1)) % names.length
    list.push({
      id: String(6000 + (page - 1) * pageSize + i),
      reporter: { id: String(1000 + idx1), nickname: names[idx1], avatar: avatarBase + idx1 },
      reported: { id: String(1000 + idx2), nickname: names[idx2], avatar: avatarBase + idx2 },
      reason: randItem(reasons),
      description: randItem(['发送广告信息', '言语骚扰', '发送不良图片', '冒充客服', '恶意刷屏']),
      status: randItem(statuses),
      evidence: randItem(['[消息截图]', '[聊天记录]', '']),
      created_at: randDate(30),
      updated_at: randDate(15),
    })
  }
  return { list, total, page, pageSize }
}
