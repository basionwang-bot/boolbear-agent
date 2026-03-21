# BoolBear Agent TODO

- [x] 升级项目为全栈架构（web-db-user）
- [x] 设计并创建数据库表结构（users扩展, classes, bears, conversations）
- [x] 实现用户注册 API（用户名+密码+班级邀请码）
- [x] 实现用户登录 API
- [x] 实现班级管理 API（创建班级、生成邀请码）
- [x] 实现 Kimi AI 对话代理（流式输出 + 动态 Prompt）
- [x] 实现小熊领养 API（选择熊类型、设置性格）
- [x] 实现小熊养成系统（经验值累积、段位升级）
- [x] 实现对话历史保存和查询
- [x] 重构前端注册/登录页面（接入真实 API）
- [x] 重构前端对话页面（接入 Kimi 流式对话）
- [x] 重构前端养成看板（接入真实数据）
- [x] 重构前端广场页面（接入真实排行榜数据）
- [x] 重构前端领养页面（接入真实 API）
- [x] 实现简单管理员后台（班级管理、邀请码生成、学生数据查看）
- [x] 编写 vitest 测试（22 个测试全部通过）
- [x] 保存检查点并推送 GitHub
- [x] 为管理员后台添加删除用户功能（包括确认对话框、级联删除数据）
- [x] 修复登录流程中的 Cookie 问题（sameSite/secure 配置导致登录状态丢失，26 个测试全部通过）
- [x] 创建知识点数据库表（knowledge_points）
- [x] 实现 LLM 知识点自动提取逻辑（分析对话记录）
- [x] 实现 tRPC 接口（提取知识点、查询列表、学科统计）
- [x] 优化成长看板前端，添加知识点展示和学习轨迹 UI
- [x] 编写知识点功能的 vitest 测试（32 个测试全部通过）
- [x] 设计家长看板数据流和权限模型（分享链接机制）
- [x] 实现后端 API（家长分享链接生成、学习报告查询、对话摘要）
- [x] 实现家长看板前端页面（学习进度、知识点掌握、对话摘要）
- [x] 更新路由和导航，添加家长入口
- [x] 编写家长看板功能的 vitest 测试（41 个测试全部通过）
- [x] 实现后端 API：班级学习数据统计（活跃度、知识点覆盖率、对话数量等）
- [x] 实现后端 API：管理员一键生成学生学习报告（分享链接）
- [x] 实现管理员前端：班级数据可视化图表（学习时长、活跃度、知识点覆盖率）
- [x] 实现管理员前端：学生列表中添加"生成报告"按钮
- [x] 编写管理员数据可视化和报告功能的 vitest 测试（48 个测试全部通过）
- [x] 数据库：conversations 表添加 startedAt/endedAt/durationMinutes 字段
- [x] 后端：对话开始时记录 startedAt，发送消息时更新 endedAt，计算学习时长
- [x] 后端：用户学习时长统计 API（日/周/总计）
- [x] 后端：普通用户生成报告每天限制一次（管理员不限）
- [x] 前端：成长看板展示学习时长数据
- [x] 前端：管理员数据分析展示学习时长
- [x] 前端：报告生成限制提示（普通用户已用完今日次数）
- [x] 编写学习时长追踪和报告限制的 vitest 测试（58 个测试全部通过）

## Bug Fixes

- [x] 修复：报告生成时知识点被重复分析的问题（添加 isAnalyzed 标记字段，59 个测试全部通过）


## Phase 1: MVP - 学习资料管理和 AI 课程生成

### 数据库设计
- [x] 创建 learning_materials 表（资料名称、描述、内容、学科、创建者、创建时间）
- [x] 创建 generated_courses 表（资源 ID、学生 ID、课程大纲、生成时间、版本）
- [x] 创建 course_chapters 表（课程 ID、章节序号、标题、内容、学习时长预估）
- [x] 创建 student_course_progress 表（学生课程学习进度追踪）

### 后端 API - 资料管理
- [x] 实现 `material.create` - 上传学习资料（纯文本/Markdown）
- [x] 实现 `material.list` - 获取所有学习资料列表
- [x] 实现 `material.detail` - 获取资料详情（含关联课程）
- [x] 实现 `material.update` - 编辑资料内容
- [x] 实现 `material.delete` - 删除资料

### 后端 API - 课程生成
- [x] 实现 `course.generateOutline` - 基于资料生成课程大纲（LLM）
- [x] 实现 `course.generateChapter` - 生成单个章节内容（LLM）
- [x] 实现 `course.generateAllChapters` - 批量生成所有章节内容（LLM）
- [x] 实现 `course.listPublished` - 获取学生可用的课程列表
- [x] 实现 `course.detail` - 获取课程详情（大纲+章节+进度）
- [x] 实现 `course.updateProgress` - 更新学生学习进度
- [x] 实现 `course.myProgress` - 获取学生全部课程进度
- [x] 实现 `course.publish/archive/deleteCourse` - 课程生命周期管理

### AI 课程生成引擎
- [x] 实现 courseGenerator.ts（generateCourseOutline + generateChapterContent）
- [x] 使用 JSON Schema 结构化输出确保大纲格式一致

### 前端 - 管理员界面
- [x] 创建「资料与课程」标签页（资料列表、上传、编辑、删除）
- [x] 创建资料编辑器（Markdown 编辑器）
- [x] 创建课程生成预览界面（展示生成的大纲和章节）
- [x] 添加资料管理菜单到管理员后台

### 前端 - 学生界面
- [x] 创建 Courses.tsx 课程学习页面（课程列表、课程详情）
- [x] 创建课程阅读器（展示章节内容、进度追踪、Markdown 渲染）
- [x] 添加「学习课程」入口到主导航 Navbar

### 测试和优化
- [x] 编写资料管理 API 的 vitest 测试（6 个测试）
- [x] 编写课程生成 API 的 vitest 测试（14 个测试）
- [x] 全部 79 个测试通过

## 管理员停用学员 AI 聊天功能

- [x] 数据库：users 表添加 isChatDisabled 字段
- [x] 后端：管理员 API 停用/启用学员聊天权限
- [x] 后端：聊天接口拦截被停用学员的请求（返回 403 错误）
- [x] 前端：管理员界面添加停用/启用按钮（两个学生列表都已添加）
- [x] 前端：学生端被停用时显示友好提示（输入框替换为警告横幅）
- [x] 编写 vitest 测试（83 个测试全部通过）

- [x] 修复：管理员禁用学员AI对话后缺少解除禁用按钮（class.students 未返回 isChatDisabled 字段）
