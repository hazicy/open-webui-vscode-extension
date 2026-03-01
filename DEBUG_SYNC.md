# 实时同步调试指南

## 如何测试和调试 Yjs + Socket.IO 实时同步

### 1. 打开开发者工具

在 VSCode 中：
1. 按 `Ctrl+Shift+P` 打开命令面板
2. 输入 "Developer: Toggle Developer Tools"
3. 切换到 "Console" 标签页

### 2. 查看调试日志

现在所有 Socket.IO 和 Yjs 操作都会输出详细日志：

```
[YjsSocketIO] Connecting to: ws://127.0.0.1:3000
[YjsSocketIO] Note ID: xxx
[YjsSocketIO] Connected with ID: xxx
[YjsSocketIO] Joining document with data: {...}
[YjsSocketIO] Event received: ydoc:document:state [...]
```

### 3. 测试步骤

#### A. 测试连接
1. 打开一个笔记
2. 在控制台中查看是否有以下日志：
   - `[YjsSocketIO] Connecting to: ws://...`
   - `[YjsSocketIO] Connected with ID: ...`
   - `[YjsSocketIO] Joining document with data: ...`

如果没有看到这些日志，说明：
- 检查 `openwebui.api.baseUrl` 配置是否正确
- 检查 Open WebUI 服务器是否正在运行
- 检查防火墙是否阻止了 WebSocket 连接

#### B. 测试本地更改同步
1. 在 VSCode 中修改文档内容
2. 查看控制台是否有：
   - `[YjsSocketIO] Sending update: ...`
   - `[YjsSocketIO] Update sent successfully`

如果没有看到这些日志，说明本地更改没有触发同步。

#### C. 测试远程更改接收
1. 在另一个客户端（如 Open WebUI Web 界面）修改同一文档
2. 查看控制台是否有：
   - `[YjsSocketIO] Event received: ydoc:document:update:broadcast`
   - `[YjsSocketIO] Broadcast update received: ...`
   - `[YjsSocketIO] Applying remote update`

### 4. 常见问题排查

#### 问题 1: 连接失败
**症状**: 看到 `[YjsSocketIO] Connection error: ...`

**可能原因**:
- WebSocket URL 配置错误
- 服务器未运行
- 需要认证但未提供 token

**解决方案**:
```json
// settings.json
{
  "openwebui.api.baseUrl": "http://127.0.0.1:3000",
  "openwebui.api.token": "your-token-here"
}
```

#### 问题 2: 本地更改不同步
**症状**: 修改文档后没有看到 `[YjsSocketIO] Sending update`

**可能原因**:
- Yjs 文档未正确初始化
- 更新处理器未注册

**解决方案**:
1. 关闭并重新打开笔记
2. 检查 `[YjsSocketIO] Joining document` 日志

#### 问题 3: 远程更改不接收
**症状**: 其他客户端修改后看不到更新

**可能原因**:
- 服务器未广播更新
- 事件名称不匹配
- Socket.IO room 未正确加入

**解决方案**:
1. 检查服务器日志
2. 查看 `[YjsSocketIO] Event received:` 日志，确认接收到事件
3. 尝试不同的事件名称（代码已监听多个可能的名称）

### 5. 手动测试 Socket.IO 连接

在浏览器控制台中运行（在 Open WebUI 页面上）：

```javascript
// 测试 Socket.IO 连接
const socket = io('ws://127.0.0.1:3000', {
  path: '/ws/socket.io'
});

socket.on('connect', () => {
  console.log('Connected!', socket.id);

  // 监听所有事件
  socket.onAny((eventName, ...args) => {
    console.log('Event:', eventName, args);
  });

  // 加入文档
  socket.emit('ydoc:document:join', {
    noteId: 'your-note-id',
    state: [],
    content: 'test'
  });
});
```

### 6. 服务器端检查

确保 Open WebUI 后端正确处理 Socket.IO 事件：

1. 查看服务器日志
2. 确认以下事件被正确处理：
   - `ydoc:document:join`
   - `ydoc:document:update`
   - `ydoc:awareness:update`

3. 确认服务器将更新广播给其他客户端

### 7. 网络检查

使用浏览器开发者工具的 "Network" 标签：
1. 切换到 "WS" (WebSocket) 标签
2. 查看 `/ws/socket.io` 连接
3. 检查消息帧（Frames）：
   - 发送的消息
   - 接收的消息

### 8. 性能监控

在控制台中运行：

```javascript
// 监控 Yjs 更新频率
let updateCount = 0;
const originalEmit = socket.emit;
socket.emit = function(...args) {
  if (args[0] === 'ydoc:document:update') {
    updateCount++;
    console.log(`Total updates sent: ${updateCount}`);
  }
  return originalEmit.apply(this, args);
};
```

## 需要帮助？

如果以上步骤都无法解决问题，请提供：
1. 完整的控制台日志
2. VSCode 版本和扩展版本
3. Open WebUI 服务器版本
4. `settings.json` 中的 `openwebui.*` 配置
