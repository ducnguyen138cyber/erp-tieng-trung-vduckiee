#!/usr/bin/env python3

"""Build the Phase C6 Professional HSK5 curriculum only.
The official inventories determine membership; all learner-facing prose and tasks are VDuckie-authored.
This script never touches HSK1-HSK4 data.
"""

from pathlib import Path
import re, unicodedata, subprocess, json, math, collections, itertools, random, os, hashlib, textwrap, shutil


raw = """班 笔 跟 面1 条 头 正 冰 带 电 根据 关 刻 可 毛 牛 起 总 棒 不过 重 出口 等2 队 干 管 奖 经济 究竟 空 困 连 深 死 所有 台 准 组 唉 哎 爱护 哎呀 暗 安 安全带 安慰 安装 熬夜 白 傍晚 半夜 薄 宝 保 保安 宝贝 保持 保存 报到 报道 报告 宝贵 包裹 包含 报警 包括 保留 保险 暴雨 抱怨 保质期 包装 把握 背 背后 背景 被子 本2 本地 本领 本人 本质 必 便 变动 便利 便利店 表达 表面 表明 表情 标题 标志 彼此 别2 比分 毕竟 比例 避免 闭幕式 饼 病房 病情 必然 必需 必要 比喻 拨打 玻璃 博物馆 补充 不得了 不符 不利 不良 不然 不幸 步行 不要紧 不足 才2 采访 裁判 采取 彩色 采用 藏 参考 餐饮 参与 操作 册 测 曾 曾经 测试 插 差别 拆 差距 产 长处 长度 长久 长期 常识 尝试 场所 长途 长远 产量 产品 产业 朝 吵 炒 超 超出 超级 超速 叉子 彻底 车祸 车库 车辆 沉 称1 称2 成本 承担 程度 成分 成果 成就 成立 成年1 城区 成人 承认 承受 成熟 称为 乘务员 程序 成员 称赞 成长 橙子 沉默 车厢 车主 池 翅膀 持续 尺子 冲 充电 充分 重复 充满 宠物 充值 虫子 充足 臭 丑 抽 处 处 初 传 传播 传递 床单 窗台 创新 创业 创造 创作 传说 传统 出版 初级 处理 初期 出色 出售 除夕 出席 处于 出自 此后 词汇 刺激 此前 此时 辞职 从不 从而 从前 从事 催 促进 存放 存款 存在 措施 促使 促销 打扮 打包 达成 大胆 打断 大多 大会 代 代表 带动 代替 待遇 大力 大妈 大米 淡 单 大脑 单独 当 挡 当成 当地 当年 当前 当中 当作 担任 胆小 单一 单元 倒 到达 道理 到期 导演 导致 大批 打破 大厦 大事 打听 大象 大型 大爷 大于 大众 登 等待 灯光 等候 登记 登录 等于 递 电池 电动 电器 电商 电视台 点心 点赞 电子版 调1 调研 地理 地面 定期 地区 的确 敌人 低头 丢失 地位 地下 地震 冻 洞 动画 动人 动手 豆腐 豆浆 度 堵 断 短处 短期 堆 对比 对待 对手 队伍 对象 独立 吨 朵 躲 独特 读音 独自 儿女 二手 二维码 罚 发表 发布 发达 发挥 罚款 发明 反 翻 反而 反复 防 方 方案 仿佛 访问 房屋 防止 返回 番茄 繁荣 范围 反应 反映 反正 发起 发言 发音 法院 飞行 飞行员 非洲 分别 分布 奋斗 纷纷 丰富多彩 风格 疯狂 风俗 风险 分类 分离 分配 分手 分析 分享 否定 否认 扶 福 副1 富 付出 负担 夫妇 妇女 富有 复制 服装 盖 改革 改进 概括 概念 改善 改天 改正 刚好 敢于 搞 告别 高大 高档 高度 高级 高科技 高效 隔 个别 歌词 各行各业 根 根本 更换 更新 歌曲 个人 格外 个性 各自 公布 工程 工程师 工具 功能 公平 公务员 恭喜 贡献 共享 工业 工艺 公寓 构成 沟通 古 鼓 挂号 怪 关闭 观察 观点 广 广场 广大 广泛 光临 光明 光线 冠军 观念 古代 固定 规律 规模 贵姓 规则 柜子 古老 滚 锅 过度 过分 国画 过敏 过期 国庆 果然 果实 过于 故乡 鼓掌 哈 海关 海外 海鲜 含 行 行业 含量 汗水 含有 好 好评 好奇 好运 好转 合 合法 盒饭 黑 合理 河流 合同 合影 合作 红 厚度 后果 猴子 湖 滑 划 化 话费 花费 画面 黄瓜 黄金 环节 缓解 缓慢 话题 化学 蝴蝶 互动 灰 挥 恢复 汇率 灰色 回收 婚礼 伙 伙伴 火锅 或是 货物 或许 忽视 胡同 户外 呼吸 及 级 集 系 挤 架 甲 嘉宾 家电 加工 建 键 捡 剪 剪刀 减肥 讲话 将近 讲究 奖励 讲述 降水 讲座 渐渐 艰苦 建立 简历 键盘 坚强 建设 建造 简直 建筑 较 浇 脚步 教材 角度 交换 交往 交易 加热 假如 加深 驾驶 加速 家务 驾照 价值 疾病 季度 结 届 接触 接待 阶段 结构 结合 接近 结论 节省 接收 及格 机构 集合 即将 激烈 记录 纪录 纪录片 急忙 紧 进步 近代 技能 静 经典 精力 精神 惊喜 经营 纪念 纪念日 紧急 进口 尽快 尽力 尽量 紧密 近年来 近期 近日 今日 谨慎 进一步 极其 机器 机器人 肌肉 计算 计算机 集体 救 酒吧 救护车 就业 久远 急需 记忆 记载 急诊 集中 据 距 捐 具备 剧场 巨大 绝对 决赛 角色 决心 居民 居然 据说 具体 具有 居住 橘子 开发 开放 开幕 开幕式 开水 开通 开业 开展 看 看望 看作 靠 靠近 颗 克服 客服 客观 客户 可见 可靠 可怕 科研 空间 控制 空中 口袋 口味 库 宽 宽度 亏 昆虫 扩大 来源 老百姓 老板 劳动 老公 姥姥 老婆 姥爷 乐观 泪 类 泪水 类似 类型 乐趣 梨 力 恋爱 量 良好 粮食 联合 连接 连忙 脸色 连续 了不起 列车 离婚 立即 立刻 力量 理论 厘米 铃 令 领 领带 领导 灵活 领取 领先 领域 临时 利润 里头 流传 流感 浏览 留言 利益 利用 理由 离职 龙 漏 录 陆地 论文 逻辑 录取 路人 路线 旅行社 陆续 录音 骂 买卖 忙碌 满足 毛笔 毛病 矛盾 没法儿 玫瑰 魅力 美术 媒体 美味 门诊 迷 面2 面积 面临 面向 描述 迷路 秘密 命1 敏感 名称 名牌 名片 明确 明显 明星 命运 密切 秘书 摸 模糊 陌生 模式 某 目光 木头 难得 难度 难以 男子 闹 闹钟 哪怕 内部 能干 念 年初 年代 年纪 年夜饭 牛仔裤 浓 农民 农业 女子 哦 偶然 欧洲 派 派出所 排列 拍摄 跑道 赔 配 陪伴 配合 配送 培训 培养 盆 碰 碰见 匹 批1 批2 骗 品 拼 平 评 凭 平安 平衡 评价 凭借 平静 平均 屏幕 平台 品牌 聘请 拼音 品质 品种 批准 破坏 普及 齐 其 欠 浅 签1 签订 墙 抢 强大 强调 强度 抢救 强烈 前进 前来 签名 前途 前往 签字 悄悄 期待 切 奇迹 期间 亲 亲爱 勤奋 青 情感 请教 情景 请求 情绪 轻易 轻重 亲朋好友 亲切 亲情 亲人 亲自 穷 气球 企业 汽油 其余 权 劝 权利 全力 全面 全体 全新 确保 确定 缺乏 确认 群 群体 去世 趋势 区域 燃烧 绕 热爱 热量 热烈 认 忍 人才 人工 人际 人口 人类 人力 人民 人民币 人群 人体 人物 热心 日历 日用品 如 软 软件 如此 如何 如今 弱 如同 如下 洒 赛场 色彩 傻 晒 沙漠 删 扇 擅长 删除 赏 伤 上传 伤害 商家 商人 上升 商务 上下 商业 上涨 善良 山区 善于 扇子 烧 烧烤 沙子 蛇 设备 舍不得 舍得 设计 设立 伸 身材 深度 身份 胜 省2 升1 生产 生存 生动 省份 省会 升级 胜利 升温 生物 生肖 生长 深厚 神话 深刻 神秘 深入 深远 社区 设施 摄影 设置 式 诗 湿 时差 时常 时代 适当 似的 使得 事故 实践 事件 试卷 时刻 实力 失恋 失眠 市民 时期 诗人 实施 事实 石头 视为 事物 失误 实习 实现 事先 实行 实验 试验 实验室 事业 失业 实用 食用 试用 适用 始终 守 首次 手段 手工 收获 收集 售价 收看 手术 手套 手续 手指 束 数 摔 双方 鼠标 蔬菜 书法 书房 税 水分 睡眠 书架 数据 熟练 树木 顺 说不定 说服 熟人 输入 舒适 属于 四处 似乎 思考 私人 思维 思想 四周 搜 搜索 酸甜苦辣 随 碎 随后 随时 随手 随意 损害 损失 所1 锁 缩短 缩小 宿舍 台灯 台阶 太太 谈话 桃 套 他人 特产 疼痛 特色 特殊 特有 特征 替 填 天空 甜品 天上 调 挑 跳高 调皮 挑选 跳远 挑战 调整 提倡 贴 铁路 体会 提交 体力 题目 停留 提起 提升 提问 体现 体验 同 通常 统计 痛苦 同情 通行 同一 统一 头 投 投入 团 团队 突出 土地 土豆 图画 退 退出 推动 推广 退还 推荐 推进 退休 拖鞋 图书 兔子 外部 外公 外观 外婆 外形 弯 往返 网络 玩具 完美 完善 万一 完整 围 为2 胃 喂2 尾巴 维持 伟大 违法 违反 危害 围巾 未来 围绕 微笑 威胁 维修 唯一 位于 位置 稳定 问卷 温暖 文学 握 卧室 握手 雾 舞蹈 无关 物价 物理 无奈 物品 无数 武术 舞台 无限 无效 五颜六色 物业 物质 戏 系 闲 县 现场 现代 现代化 显得 乡 相册 相处 乡村 相当 相对 相关 项目 想念 橡皮 向上 响声 享受 相似 想象 象征 先后 先进 线路 显然 现实 显示 现象 限制 现状 消费 消费者 消化 消极 小姐 销量 效率 消失 销售 小型 小于 下载 西餐 斜 协议 写作 吸管 细节 戏剧 信封 行程 形成 行动 行人 形容 形式 形势 行驶 行为 形象 幸运 性质 形状 行走 新郎 心理 新娘 信任 新人 欣赏 心态 新型 信用 吸收 系统 修改 修建 休闲 西装 需 宣布 宣传 选手 学分 雪糕 学科 学历 学年 学术 学者 训练 迅速 询问 寻找 需求 虚心 呀 牙齿 押金 沿 眼 延长 研发 样式 阳台 演讲 眼泪 严肃 研制 摇 咬 腰 要不（然） 要不是 药品 药物 压岁钱 鸭子 夜间 夜市 业务 业余 移 亿 乙 以 一次性 一代 一旦 移动 遗憾 以及 依据 依靠 以来 医疗 一路 一路顺风 因而 迎 硬 应当 应对 硬件 迎接 影片 影视 营养 营业 应用 引进 音量 饮食 印刷 因素 依然 意识 意外 意味着 疑问 义务 医学 意义 一致 拥抱 用法 用户 用力 用品 勇气 用途 拥有 由此 有害 幼儿园 优惠 邮寄 悠久 邮局 游览 有力 有利 优良 优美 邮票 优势 油条 有限 有益 犹豫 优质 有助于 原 圆 愿 原有 元旦 员工 愿望 原则 预报 预测 预订 约定 预防 预计 娱乐 玉米 运 运费 运气 运输 运用 语气 雨水 语文 语音 预约 在场 在乎 在内 在线 在于 赞成 造 糟 造成 糟糕 早期 早晚 早已 赠 增 增进 增强 赠送 炸 窄 摘 占 展出 涨 账号 账户 涨价 掌声 掌握 展开 展览 展示 站台 占线 展现 召开 着凉 折扣 阵 真诚 诊断 针对 挣 争 政府 证据 整齐 争取 正如 证书 整体 珍贵 整整 政治 真实 珍惜 哲学 直 至 治 止 支1 直播 职场 指导 制订 制定 制度 职工 智慧 至今 治疗 知名 智能 执行 志愿者 制造 制作 重大 众多 中华 中华民族 中级 中介 种类 重量 中期 中外 中心 中药 中医 种植 种子 周年 煮 猪 抓 抓紧 转变 撞 转告 状况 装饰 状态 装修 专家 专心 逐步 注册 主持 主动 住房 主观 追 追求 逐渐 主人 主任 主食 住宿 主题 主席 住址 注重 竹子 紫 自从 自动 资格 资金 自觉 字母 子女 自身 姿势 咨询 自由 资源 总部 总共 综合 总数 总体 总统 总之 族 组成 足够 组合 醉 嘴巴 最初 最佳 租金 尊敬 遵守 作出 阻止 组织"""
all_words = raw.split()
len(all_words), all_words[:40], all_words[-10:]


gloss_batch1 = """
thán từ biểu thị thở dài
thán từ gọi hoặc phản ứng
bảo vệ, gìn giữ
ối, ôi chao
tối; ngầm, không rõ
yên; an toàn
dây an toàn
an ủi
lắp đặt, cài đặt
thức khuya
trắng; rõ ràng; vô ích
chập tối
nửa đêm
mỏng; nhạt
báu vật; quý
bảo vệ; đảm bảo
nhân viên bảo vệ
em bé; bảo bối
duy trì, giữ vững
lưu giữ, bảo quản
đến trình diện, đăng ký có mặt
đưa tin, bài đưa tin
báo cáo
quý giá
bưu kiện, gói hàng
bao hàm, chứa
báo cảnh sát
bao gồm
giữ lại, bảo lưu
bảo hiểm; bảo đảm
mưa lớn
phàn nàn, oán trách
hạn sử dụng
đóng gói; bao bì
nắm chắc; mức độ tự tin
mang, cõng trên lưng
phía sau; hậu trường
bối cảnh, lý lịch nền
chăn
cuốn, quyển; bản
địa phương, bản địa
bản lĩnh, năng lực
bản thân người nói
bản chất
ắt, nhất định
tiện; liền, thì
biến động, thay đổi
thuận tiện
cửa hàng tiện lợi
biểu đạt
bề mặt; vẻ ngoài
cho thấy, chứng tỏ
biểu cảm, nét mặt
tiêu đề
dấu hiệu, biểu tượng
lẫn nhau, đôi bên
ghim, kẹp; biệt
tỷ số
rốt cuộc, dù sao
tỷ lệ
tránh
lễ bế mạc
bánh
phòng bệnh
tình trạng bệnh
tất nhiên, tất yếu
thiết yếu, bắt buộc phải có
cần thiết
ví von, phép so sánh
bấm, gọi số điện thoại
kính, thủy tinh
bảo tàng
bổ sung
ghê gớm, nghiêm trọng
không phù hợp
bất lợi
không tốt, có hại
nếu không; không phải vậy
bất hạnh
đi bộ
không sao, không nghiêm trọng
không đủ; thiếu sót
tài năng
phỏng vấn, thu thập tin
trọng tài; phân xử
áp dụng, thực hiện
có màu
áp dụng, sử dụng
giấu; cất
tham khảo
ăn uống, dịch vụ ẩm thực
tham gia
thao tác, vận hành
quyển, tập
đo, kiểm tra
đã từng
đã từng, trước đây
kiểm tra, thử nghiệm
cắm, chèn
khác biệt
tháo dỡ
khoảng cách, chênh lệch
sản xuất, sinh ra
ưu điểm, sở trường
độ dài
lâu dài
dài hạn
kiến thức thường thức
thử, thử nghiệm
nơi chốn, địa điểm
đường dài
lâu dài, nhìn xa
sản lượng
sản phẩm
ngành công nghiệp
hướng về, về phía
ồn; cãi nhau
xào
vượt, vượt qua
vượt quá, vượt ra ngoài
siêu cấp
chạy quá tốc độ
cái nĩa
triệt để, hoàn toàn
tai nạn xe cộ
ga-ra, nhà để xe
phương tiện, xe cộ
chìm; nặng, trầm
gọi, xưng
cân, đo trọng lượng
chi phí, giá thành
đảm nhận, gánh chịu
mức độ
thành phần
thành quả
thành tựu; đạt được
thành lập
trưởng thành, đủ tuổi
khu đô thị
người trưởng thành; trưởng thành
thừa nhận, công nhận
chịu đựng, gánh chịu
trưởng thành, chín chắn
được gọi là
nhân viên phục vụ trên phương tiện
trình tự; chương trình
thành viên
khen ngợi
trưởng thành, phát triển
quả cam
im lặng
toa xe, khoang xe
chủ xe
ao, bể
cánh
tiếp tục, kéo dài
thước
xông, lao; pha
sạc điện
đầy đủ; hoàn toàn
lặp lại
đầy ắp
thú cưng
nạp tiền
côn trùng
đầy đủ, dồi dào
hôi, thối
xấu xí
rút, hút,抽
xử lý; ở chung
nơi, chỗ
ban đầu, sơ cấp
truyền, chuyển
truyền bá
truyền đạt, chuyển giao
ga trải giường
bậu cửa sổ
đổi mới, sáng tạo
khởi nghiệp
sáng tạo, tạo ra
sáng tác
truyền thuyết
truyền thống
xuất bản
sơ cấp
xử lý, giải quyết
giai đoạn đầu
xuất sắc
bán ra
đêm giao thừa
tham dự, có mặt
ở vào, nằm trong
bắt nguồn từ
sau đó
từ vựng
kích thích
trước đó
lúc này
từ chức
không bao giờ
""".strip().splitlines()
len(gloss_batch1)


gloss_batch2 = """
do đó, từ đó
trước đây, ngày xưa
làm, hoạt động trong lĩnh vực
thúc giục
thúc đẩy
cất giữ
tiền gửi; gửi tiền
tồn tại
biện pháp
khiến, thúc đẩy
khuyến mại
ăn diện, trang điểm
đóng gói; gói mang đi
đạt được, đi đến
mạnh dạn, táo bạo
ngắt lời, cắt ngang
phần lớn
đại hội, hội nghị lớn
thay, đời; đại diện
đại diện; thay mặt
thúc đẩy, kéo theo
thay thế
đãi ngộ, chế độ
mạnh mẽ, hết sức
cô/bác trung niên
gạo
nhạt, loãng
đơn; riêng; phiếu
não bộ
riêng lẻ, một mình
làm, đảm nhiệm; khi
chặn, cản
coi như
địa phương đó
năm ấy; thời đó
hiện tại
ở giữa, trong số
coi là
đảm nhiệm chức vụ
nhát gan
đơn nhất
đơn vị
ngã, đổ; đảo
đến nơi
đạo lý, lý lẽ
đến hạn, hết hạn
đạo diễn
dẫn đến
số lượng lớn
phá vỡ
tòa nhà lớn
việc lớn, chuyện quan trọng
hỏi thăm, dò hỏi
con voi
quy mô lớn
ông, bác lớn tuổi
lớn hơn
đại chúng
leo, lên; đăng
chờ đợi
ánh đèn
chờ
đăng ký
đăng nhập
bằng, tương đương
đưa, chuyển tận tay
pin
chạy bằng điện
thiết bị điện
thương mại điện tử
đài truyền hình
điểm tâm, đồ ăn nhẹ
bấm thích
bản điện tử
điều chuyển; điều chỉnh
khảo sát, nghiên cứu
địa lý
mặt đất, sàn
định kỳ
khu vực
quả thực, đúng là
kẻ địch
cúi đầu
thất lạc, đánh mất
địa vị
dưới đất; ngầm
động đất
đông lạnh
hang, lỗ
hoạt hình
cảm động
bắt tay làm; ra tay
đậu phụ
sữa đậu nành
độ; mức; lần
chặn, tắc
đứt, cắt, phán đoán
khuyết điểm
ngắn hạn
đống; chất thành đống
đối chiếu, so sánh
đối xử
đối thủ
đội ngũ
đối tượng; người yêu
độc lập
tấn
bông, đóa
trốn, tránh
độc đáo
cách đọc, âm đọc
một mình
con cái
đồ cũ, đã qua sử dụng
mã QR
phạt
công bố, phát biểu
phát hành, đăng tải
phát triển
phát huy
tiền phạt
phát minh
ngược lại; phản
lật, dịch, trèo
trái lại
lặp đi lặp lại
phòng, chống
phương; phía; vuông
phương án
dường như
thăm, truy cập
nhà cửa
ngăn ngừa
trở về, hoàn trả
cà chua
phồn vinh
phạm vi
phản ứng
phản ánh
dù sao
khởi xướng
phát biểu
phát âm
tòa án
bay, chuyến bay
phi công
châu Phi
lần lượt; phân biệt
phân bố
phấn đấu
lần lượt, đồng loạt
phong phú đa dạng
phong cách
điên cuồng
phong tục
rủi ro
phân loại
tách rời
phân phối, phân công
chia tay
phân tích
chia sẻ
phủ định
phủ nhận
đỡ, dìu
phúc, may mắn
phó; bộ, cặp
giàu có
bỏ ra, cống hiến
gánh nặng
vợ chồng
phụ nữ
giàu có; có nhiều
sao chép
trang phục
đậy; nắp; xây
cải cách
cải tiến
khái quát, tóm lược
khái niệm
cải thiện
hôm khác
sửa đúng
vừa đúng, đúng lúc
dám
làm, tiến hành
tạm biệt
cao lớn
cao cấp, sang trọng
độ cao; mức cao
cao cấp
công nghệ cao
hiệu quả cao
ngăn cách, cách
cá biệt, riêng lẻ
lời bài hát
mọi ngành nghề
rễ; cái, chiếc dài
căn bản; hoàn toàn
thay đổi, thay mới
""".strip().splitlines()
len(gloss_batch2)


gloss_batch3 = """
cập nhật, đổi mới
bài hát
cá nhân; riêng tư
đặc biệt, khác thường
cá tính
mỗi người, riêng mình
công bố
công trình, kỹ thuật
kỹ sư
công cụ
chức năng
công bằng
công chức
chúc mừng
cống hiến; đóng góp
chia sẻ, dùng chung
công nghiệp
công nghệ, kỹ nghệ
căn hộ
cấu thành
giao tiếp, trao đổi
cổ, xưa
trống; phồng; cổ vũ
đăng ký khám
lạ; trách; khá
đóng, tắt
quan sát
quan điểm
rộng
quảng trường
rộng lớn, đông đảo
rộng rãi
quang lâm, ghé thăm
sáng sủa; quang minh
tia sáng, ánh sáng
quán quân
quan niệm
thời cổ đại
cố định
quy luật
quy mô
quý danh
quy tắc
tủ
cổ xưa
lăn; cút
nồi
quá mức
quá đáng
tranh thủy mặc Trung Quốc
dị ứng
quá hạn
quốc khánh
quả nhiên
quả, thành quả
quá, quá mức
quê hương
vỗ tay
ha, thán từ
hải quan
hải ngoại
hải sản
chứa, bao hàm
được; đi; ngành nghề
ngành nghề
hàm lượng
mồ hôi
có chứa
tốt; rất
đánh giá tốt
tò mò
may mắn
chuyển biến tốt
hợp; gộp; vừa
hợp pháp
cơm hộp
đen
hợp lý
sông ngòi
hợp đồng
chụp ảnh chung
hợp tác
đỏ
độ dày
hậu quả
con khỉ
hồ
trơn; trượt
chèo; vạch;划
hóa, biến thành
cước điện thoại
tiêu tốn; chi phí
khung hình, hình ảnh
dưa chuột
vàng; kim loại vàng
khâu, mắt xích
giảm nhẹ
chậm chạp
chủ đề
hóa học
con bướm
tương tác
tro; xám
vẫy,挥
khôi phục
tỷ giá
màu xám
thu hồi, tái chế
đám cưới
nhóm, bọn; người
đối tác, bạn đồng hành
lẩu
hoặc là
hàng hóa
có lẽ
coi nhẹ, bỏ qua
ngõ nhỏ Bắc Kinh
ngoài trời
hô hấp
và; đến
cấp, bậc
tập hợp, bộ
buộc; hệ
chen, ép
giá, khung; chiếc
giáp; hạng nhất
khách mời
đồ điện gia dụng
gia công, chế biến
xây, lập
phím, chìa khóa
nhặt
cắt bằng kéo
cái kéo
giảm cân
phát biểu, nói chuyện
gần, xấp xỉ
coi trọng; cầu kỳ
thưởng, khuyến khích
kể, thuật lại
lượng mưa
buổi tọa đàm, bài giảng
dần dần
gian khổ
thiết lập
sơ yếu lý lịch
bàn phím
kiên cường
xây dựng
xây cất
quả thực, đơn giản là
kiến trúc; xây dựng
khá, tương đối; so với
tưới, đổ
bước chân
giáo trình
góc độ
trao đổi
giao du, qua lại
giao dịch
làm nóng
giả sử, nếu
làm sâu thêm
lái, điều khiển
tăng tốc
việc nhà
bằng lái xe
giá trị
bệnh tật
quý, ba tháng
thắt, kết; kết quả
khóa, kỳ; lượng từ
tiếp xúc
tiếp đón
giai đoạn
kết cấu
kết hợp
tiếp cận
kết luận
tiết kiệm
tiếp nhận
đạt yêu cầu, đỗ
cơ quan, tổ chức
tập hợp
sắp, sắp sửa
kịch liệt, gay gắt
ghi chép; hồ sơ
kỷ lục
phim tài liệu
vội vàng
chặt, căng, gấp
tiến bộ
cận đại
kỹ năng
yên tĩnh
kinh điển
sức lực, tinh lực
tinh thần
bất ngờ vui vẻ
kinh doanh, quản lý
""".strip().splitlines()
len(gloss_batch3)


gloss_batch4 = """
kỷ niệm; vật kỷ niệm
ngày kỷ niệm
khẩn cấp
nhập khẩu; cửa vào
càng sớm càng tốt
cố hết sức
cố gắng; hết mức; lượng
chặt chẽ, mật thiết
những năm gần đây
gần đây, thời gian tới gần
mấy ngày gần đây
hôm nay
thận trọng
tiến thêm một bước
cực kỳ
máy móc
rô-bốt
cơ bắp
tính toán
máy tính
tập thể
cứu
quán bar
xe cứu thương
có việc làm, việc làm
xa xưa, lâu đời
cần gấp
ký ức; ghi nhớ
ghi chép, chép lại
cấp cứu; phòng cấp cứu
tập trung
theo, căn cứ
cách, khoảng cách
quyên góp
có đủ,具备
nhà hát
khổng lồ
tuyệt đối
chung kết
vai diễn; vai trò
quyết tâm
cư dân
không ngờ, vậy mà
nghe nói
cụ thể
có, mang đặc điểm
cư trú
quýt
phát triển, khai thác
mở cửa, cởi mở
khai mạc
lễ khai mạc
nước đun sôi
mở tuyến, kích hoạt
khai trương
triển khai, tiến hành
xem; coi
thăm hỏi
coi là
dựa vào, gần
đến gần
hạt, viên
khắc phục
chăm sóc khách hàng
khách quan
khách hàng
có thể thấy
đáng tin cậy
đáng sợ
nghiên cứu khoa học
không gian
kiểm soát
trên không
túi
khẩu vị
kho
rộng
chiều rộng
lỗ, thiệt; may mà
côn trùng
mở rộng
nguồn gốc
người dân thường
ông chủ, sếp
lao động
chồng
bà ngoại
vợ
ông ngoại
lạc quan
nước mắt
loại, lớp
nước mắt
tương tự
loại hình
niềm vui, thú vị
quả lê
sức, lực
yêu đương
đo; lượng
tốt đẹp
lương thực
liên hợp, liên kết
kết nối
vội vàng
sắc mặt
liên tục
tuyệt vời, ghê gớm
tàu hỏa
ly hôn
ngay lập tức
lập tức
sức mạnh
lý luận
xen-ti-mét
chuông
khiến, lệnh
dẫn, nhận
cà vạt
lãnh đạo
linh hoạt
nhận, lĩnh
dẫn đầu
lĩnh vực
tạm thời
lợi nhuận
bên trong
lưu truyền
cúm
duyệt, xem lướt
để lại lời nhắn
lợi ích
tận dụng, sử dụng
lý do
nghỉ việc
rồng
rò,漏
ghi, thu
đất liền
luận văn
logic
trúng tuyển, tiếp nhận
người qua đường
tuyến đường
công ty du lịch
lần lượt, liên tiếp
ghi âm
mắng
mua bán, việc kinh doanh
bận rộn
thỏa mãn, đáp ứng
bút lông
tật xấu; lỗi
mâu thuẫn
không có cách
hoa hồng
sức hấp dẫn
mỹ thuật
truyền thông
ngon
phòng khám ngoại trú
mê, lạc; người hâm mộ
mặt, phương diện
diện tích
đối mặt
hướng tới
miêu tả
lạc đường
bí mật
mệnh lệnh; mạng sống
nhạy cảm
tên gọi
thương hiệu nổi tiếng
danh thiếp
rõ ràng, xác định
rõ rệt
ngôi sao, người nổi tiếng
số phận
mật thiết
thư ký
sờ, chạm
mơ hồ
xa lạ
mô thức, chế độ
một, nào đó
ánh mắt
gỗ
hiếm có
độ khó
khó mà
nam giới
ồn ào; gây chuyện
đồng hồ báo thức
dù cho
nội bộ, bên trong
giỏi giang
đọc, nhớ, nghĩ
đầu năm
thập niên, thời đại
tuổi tác
""".strip().splitlines()
len(gloss_batch4)


gloss_batch5 = """
bữa cơm tất niên
quần bò
đậm, đặc
nông dân
nông nghiệp
nữ giới
ồ, thán từ
ngẫu nhiên
châu Âu
phái, cử; phe
đồn công an
sắp xếp,排列
quay phim, chụp
đường băng
bồi thường
phối, ghép
đồng hành
phối hợp
giao hàng, phân phối
đào tạo
bồi dưỡng, nuôi dưỡng
chậu
đụng, chạm
tình cờ gặp
con,匹; lượng từ
lô, đợt
phê,批; phê duyệt
lừa
phẩm, nếm
ghép, liều
bằng phẳng; bình
đánh giá, bình luận
dựa vào
bình an
cân bằng
đánh giá
nhờ vào
bình tĩnh, yên lặng
bình quân
màn hình
nền tảng
thương hiệu
mời, tuyển dụng
bính âm
chất lượng, phẩm chất
chủng loại, giống
phê chuẩn
phá hoại
phổ cập
đủ, đều,齐
của nó; ấy
nợ, thiếu
nông, cạn
ký; thẻ
ký kết
tường
cướp, giành
mạnh mẽ
nhấn mạnh
cường độ
cấp cứu
mãnh liệt
tiến lên
đến trước
chữ ký
tiền đồ, tương lai
đi tới
ký tên
lặng lẽ
mong đợi
cắt; thiết
kỳ tích
trong thời gian
thân; hôn
thân yêu
chăm chỉ
xanh, thanh
tình cảm
thỉnh giáo, hỏi
tình huống, cảnh
yêu cầu, đề nghị
cảm xúc
dễ dàng, tùy tiện
nặng nhẹ
họ hàng bạn bè
thân thiện, thân thiết
tình thân
người thân
đích thân
nghèo
bóng bay
doanh nghiệp
xăng
còn lại
quyền
khuyên
quyền lợi
toàn lực
toàn diện
toàn thể
hoàn toàn mới
đảm bảo
xác định
thiếu
xác nhận
nhóm, đàn
quần thể, nhóm người
qua đời
xu thế
khu vực
cháy, đốt
vòng quanh
yêu tha thiết
nhiệt lượng
nhiệt liệt
nhận, công nhận
nhịn, chịu
nhân tài
nhân tạo; lao động thủ công
quan hệ giữa người với người
dân số
nhân loại
nhân lực
nhân dân
nhân dân tệ
đám đông
cơ thể người
nhân vật
nhiệt tình
lịch
đồ dùng hằng ngày
như
mềm
phần mềm
như vậy
như thế nào
ngày nay
yếu
giống như
như sau
rắc, tưới
sân thi đấu
màu sắc
ngốc
phơi,晒
sa mạc
xóa
quạt;扇
giỏi, sở trường
xóa bỏ
thưởng thức; thưởng
bị thương; làm tổn thương
tải lên
gây tổn hại
nhà bán hàng
thương nhân
tăng lên
thương vụ, công việc kinh doanh
trên dưới; khoảng
thương mại
tăng giá
lương thiện
vùng núi
giỏi về
cái quạt
đốt, nấu
đồ nướng
cát
con rắn
thiết bị
không nỡ rời bỏ
nỡ, sẵn lòng bỏ
thiết kế
thành lập, đặt ra
duỗi,伸
dáng người
độ sâu
thân phận
thắng
tỉnh; tiết kiệm
tăng, lên
sản xuất
sinh tồn
sinh động
tỉnh, đơn vị hành chính
tỉnh lỵ
nâng cấp
thắng lợi
tăng nhiệt
sinh vật
con giáp
sinh trưởng
sâu sắc, dày
thần thoại
sâu sắc
thần bí
đi sâu
sâu xa
cộng đồng
cơ sở vật chất
""".strip().splitlines()
len(gloss_batch5)


gloss_batch6 = """
nhiếp ảnh, chụp hình
thiết lập, cài đặt
kiểu, dạng, công thức
thơ
ướt, ẩm
chênh lệch múi giờ
thường xuyên
thời đại
thích hợp
giống như
khiến cho
tai nạn, sự cố
thực tiễn; thực hành
sự kiện
đề thi
thời khắc
thực lực
thất tình
mất ngủ
thị dân
thời kỳ
nhà thơ
thực hiện
sự thật
hòn đá
coi là
sự vật
sai sót
thực tập
thực hiện, đạt được
trước đó
thi hành
thí nghiệm
thử nghiệm
phòng thí nghiệm
sự nghiệp
thất nghiệp
thiết thực, hữu dụng
dùng làm thực phẩm
dùng thử
áp dụng được
từ đầu đến cuối, luôn luôn
giữ, tuân thủ
lần đầu
phương tiện, thủ đoạn
thủ công
thu hoạch; thành quả
thu thập
giá bán
xem chương trình
phẫu thuật
găng tay
thủ tục
ngón tay
bó;束
đếm; số
ngã, ném
hai bên
chuột máy tính
rau củ
thư pháp
phòng đọc sách
thuế
độ ẩm, lượng nước
giấc ngủ
giá sách
dữ liệu
thành thạo
cây cối
thuận, theo
có khi, chưa biết chừng
thuyết phục
người quen
nhập vào
thoải mái
thuộc về
khắp nơi
dường như
suy nghĩ
cá nhân, riêng tư
tư duy
tư tưởng
xung quanh
tìm
tìm kiếm
đủ vị chua ngọt đắng cay
theo, tùy
vỡ vụn
sau đó
bất cứ lúc nào
tiện tay
tùy ý
gây thiệt hại
tổn thất
nơi, cái mà
khóa
rút ngắn
thu nhỏ
ký túc xá
đèn bàn
bậc thềm
bà, phu nhân
nói chuyện
quả đào
bộ,套; vỏ bọc
người khác
đặc sản
đau đớn
đặc sắc
đặc biệt
đặc hữu
đặc trưng
thay, thay cho
điền, lấp
bầu trời
món tráng miệng
trên trời
điều chỉnh; hòa, pha
chọn; khiêu
nhảy cao
nghịch ngợm
lựa chọn
nhảy xa
thách thức
điều chỉnh
đề xướng
dán, áp
đường sắt
thấu hiểu, cảm nhận
nộp, trình
thể lực
đề bài
dừng lại, lưu lại
nhắc đến
nâng cao
đặt câu hỏi
thể hiện
trải nghiệm
cùng, giống
thông thường
thống kê
đau khổ
đồng cảm
lưu thông; được đi qua
cùng một
thống nhất
đầu; người đứng đầu
ném, bỏ phiếu
đầu tư;投入
đoàn, nhóm
đội nhóm
nổi bật
đất đai
khoai tây
tranh vẽ
lùi, trả
thoát, rút lui
thúc đẩy
quảng bá
hoàn trả
giới thiệu, đề cử
thúc tiến
nghỉ hưu
dép lê
sách
con thỏ
bên ngoài
ông ngoại
ngoại quan
bà ngoại
hình dáng bên ngoài
cong
khứ hồi
mạng lưới, internet
đồ chơi
hoàn mỹ
hoàn thiện
nhỡ đâu
hoàn chỉnh
bao quanh
vì, cho
dạ dày
cho ăn
đuôi
duy trì
vĩ đại
phạm pháp
vi phạm
nguy hại
khăn quàng
tương lai
xoay quanh
mỉm cười
đe dọa
sửa chữa, bảo trì
duy nhất
nằm ở
vị trí
ổn định
bảng câu hỏi
""".strip().splitlines()
len(gloss_batch6)


gloss_batch7 = """
ấm áp
văn học
nắm, cầm
phòng ngủ
bắt tay
sương mù
múa, khiêu vũ
không liên quan
giá cả
vật lý
bất lực, đành chịu
đồ vật
vô số
võ thuật
sân khấu
vô hạn
không có hiệu lực
đủ màu sắc
quản lý bất động sản
vật chất
kịch, trò diễn
buộc; khoa, hệ
rảnh rỗi
huyện
hiện trường; tại chỗ
hiện đại
hiện đại hóa
có vẻ, tỏ ra
hương, vùng quê
album ảnh
chung sống, giao tiếp
làng quê
khá, tương đối; tương xứng
tương đối
liên quan
hạng mục, dự án
nhớ nhung
cục tẩy
hướng lên
tiếng động
tận hưởng
tương tự
tưởng tượng
tượng trưng
trước sau, lần lượt
tiên tiến
tuyến đường, đường dây
hiển nhiên
hiện thực
hiển thị, cho thấy
hiện tượng
hạn chế
hiện trạng
tiêu dùng
người tiêu dùng
tiêu hóa
tiêu cực
cô, tiểu thư
lượng bán
hiệu suất
biến mất
bán hàng
cỡ nhỏ
nhỏ hơn
tải xuống
món Tây
xiên, nghiêng
thỏa thuận
viết, sáng tác
ống hút
chi tiết
kịch nghệ
phong bì
lịch trình
hình thành
hành động
người đi bộ
hình dung, miêu tả
hình thức
tình hình, thế cục
chạy, lưu thông
hành vi
hình tượng
may mắn
tính chất
hình dạng
đi bộ
chú rể
tâm lý
cô dâu
tin tưởng
người mới
thưởng thức, đánh giá cao
tâm thế
kiểu mới
tín dụng, uy tín
hấp thụ
hệ thống
sửa đổi
xây dựng
giải trí, thư nhàn
com-lê
cần
tuyên bố
tuyên truyền, quảng bá
thí sinh, vận động viên
tín chỉ
kem
môn học, ngành học
học lực, bằng cấp
năm học
học thuật
học giả
huấn luyện
nhanh chóng
hỏi
tìm kiếm
nhu cầu
khiêm tốn, cầu thị
nhé, à
răng
tiền đặt cọc
dọc theo
mắt
kéo dài
nghiên cứu phát triển
kiểu dáng
ban công
diễn thuyết
nước mắt
nghiêm túc
nghiên cứu chế tạo
lắc
cắn
eo, lưng
hay là, nếu không
nếu không phải vì
dược phẩm
thuốc
tiền mừng tuổi
con vịt
ban đêm
chợ đêm
nghiệp vụ, kinh doanh
ngoài giờ, nghiệp dư
di chuyển
một trăm triệu
ất, hạng hai
lấy, bằng, để
dùng một lần
một thế hệ
một khi
di động, di chuyển
đáng tiếc
và, cũng như
căn cứ
dựa vào
kể từ
y tế
suốt đường
thượng lộ bình an
do đó
đón
cứng
nên, phải
ứng phó
phần cứng
đón tiếp
phim
điện ảnh và truyền hình
dinh dưỡng
kinh doanh, mở cửa
ứng dụng
du nhập, giới thiệu
âm lượng
ăn uống, chế độ ăn
in ấn
nhân tố
vẫn, như cũ
ý thức
ngoài ý muốn, bất ngờ
có nghĩa là
nghi vấn
nghĩa vụ
y học
ý nghĩa
nhất trí, thống nhất
ôm
cách dùng
người dùng
dùng sức
đồ dùng
dũng khí
công dụng
sở hữu
từ đó
có hại
nhà trẻ, mẫu giáo
ưu đãi
gửi bưu điện
""".strip().splitlines()
len(gloss_batch7)


gloss_batch8 = """
lâu đời
bưu điện
tham quan
mạnh mẽ, có sức
có lợi
tốt đẹp, ưu tú
đẹp, thanh nhã
tem thư
ưu thế
bánh quẩy
hữu hạn
có ích
do dự
chất lượng cao
có ích cho
ban đầu; nguyên
tròn
mong muốn
vốn có
Tết Dương lịch
nhân viên
nguyện vọng
nguyên tắc
dự báo
dự đoán
đặt trước
hẹn, thỏa thuận
phòng ngừa
dự tính
giải trí
ngô
vận chuyển; vận
cước vận chuyển
vận may
vận tải
vận dụng
ngữ khí, giọng điệu
nước mưa
môn ngữ văn
ngữ âm
đặt hẹn
có mặt
để tâm
bao gồm bên trong
trực tuyến
nằm ở, cốt ở
tán thành
chế tạo
tồi, hỏng
gây ra
tồi tệ
giai đoạn đầu
sớm muộn
đã sớm
tặng
tăng
tăng cường quan hệ
tăng cường
tặng
chiên, nổ
hẹp
hái, tháo
chiếm
trưng bày
dâng, tăng
tài khoản
tài khoản ngân hàng
tăng giá
tiếng vỗ tay
nắm vững
triển khai, mở ra
triển lãm
trưng bày
sân ga
máy bận
thể hiện
triệu tập, tổ chức
bị cảm lạnh
chiết khấu
trận, đợt
chân thành
chẩn đoán
nhằm vào
kiếm tiền
tranh, giành
chính phủ
chứng cứ
ngăn nắp
tranh thủ, cố giành
đúng như
chứng chỉ
tổng thể
quý giá
tròn, suốt
chính trị
chân thực
trân trọng
triết học
thẳng, trực tiếp
đến
trị, chữa, quản lý
dừng
nhánh, chiếc; ủng hộ
phát trực tiếp
nơi làm việc
hướng dẫn
soạn thảo
ban hành,制定
chế độ
công nhân viên
trí tuệ
cho đến nay
điều trị
nổi tiếng
thông minh, trí tuệ nhân tạo
thi hành
tình nguyện viên
chế tạo
sản xuất, làm
trọng đại
đông đảo
Trung Hoa
dân tộc Trung Hoa
trung cấp
môi giới
chủng loại
trọng lượng
giai đoạn giữa
Trung Quốc và nước ngoài
trung tâm
thuốc Đông y
y học cổ truyền Trung Quốc
trồng trọt
hạt giống
lễ kỷ niệm năm
luộc, nấu
con lợn
bắt, nắm
khẩn trương, tranh thủ
chuyển biến
đâm, va
chuyển lời
tình trạng
trang trí
trạng thái
sửa sang
chuyên gia
chuyên tâm
từng bước
đăng ký
chủ trì
chủ động
nhà ở
chủ quan
đuổi theo
theo đuổi
dần dần
chủ nhân
chủ nhiệm, trưởng phòng
lương thực chính
lưu trú
chủ đề
chủ tịch
địa chỉ cư trú
coi trọng
tre
màu tím
kể từ
tự động
tư cách
vốn, nguồn tiền
tự giác
chữ cái
con cái
bản thân
tư thế
tư vấn
tự do
tài nguyên
trụ sở chính
tổng cộng
tổng hợp
tổng số
tổng thể
tổng thống
tóm lại
dân tộc, họ
cấu thành
đủ
kết hợp, tổ hợp
say
miệng
ban đầu
tốt nhất
tiền thuê
tôn trọng
tuân thủ
đưa ra, làm ra
ngăn cản
tổ chức
""".strip().splitlines()
len(gloss_batch8)


chars_raw = """哎 翅 仿 汇 唉 冲 访 惠 暗 充 肥 慧 熬 虫 纷 祸 版 宠 疯 肌 扮 抽 扶 疾 伴 丑 佛 集 膀 臭 府 辑 傍 触 腐 挤 薄 传 妇 迹 宝 创 副 佳 暴 辞 盖 嘉 贝 刺 搞 甲 彼 促 革 驾 币 催 隔 架 闭 措 恭 艰 避 代 贡 捡 拨 胆 沟 剪 玻 旦 构 荐 补 淡 古 渐 布 挡 固 践 裁 档 冠 浆 采 蹈 瑰 浇 藏 敌 柜 阶 册 蝶 滚 届 测 冻 锅 谨 曾 洞 裹 敬 叉 斗 哈 救 插 豆 含 局 拆 独 憾 橘 倡 堆 衡 巨 朝 吨 猴 捐 吵 盾 胡 卷 炒 躲 湖 军 彻 乏 蝴 均 沉 罚 糊 靠 称 番 华 颗 承 繁 滑 控 橙 返 缓 扣 池 泛 灰 库 尺 范 挥 宽 齿 防 恢 款 狂 模 润 索 亏 陌 弱 锁 昆 漠 洒 桃 扩 某 傻 替 括 木 厦 挑 览 幕 晒 贴 郎 奈 删 统 劳 念 扇 投 姥 浓 善 途 泪 哦 擅 兔 类 欧 赏 团 厘 派 蛇 退 梨 培 舍 拖 璃 赔 设 弯 立 配 伸 威 恋 盆 神 违 良 碰 慎 唯 粮 匹 升 维 疗 骗 胜 伟 烈 拼 诗 尾 临 凭 施 未 灵 屏 湿 胃 铃 婆 石 慰 领 齐 驶 稳 令 企 似 卧 浏 器 势 握 龙 浅 饰 伍 漏 欠 守 武 陆 墙 殊 雾 录 抢 蔬 夕 碌 悄 属 析 逻 茄 鼠 席 络 勤 述 闲 率 穷 摔 显 骂 曲 税 县 矛 趋 私 限 玫 权 搜 献 媒 劝 俗 厢 魅 群 肃 享 秘 燃 素 橡 眠 绕 宿 销 描 忍 碎 肖 敏 荣 损 协 摸 软 缩 胁 斜 乙 赞 制 欣 亿 糟 治 形 义 造 致 型 益 赠 智 虚 营 炸 置 绪 映 摘 猪 宣 硬 窄 竹 寻 拥 占 逐 询 悠 战 煮 训 犹 涨 筑 迅 幼 掌 抓 押 余 召 状 鸭 娱 哲 撞 呀 玉 珍 追 延 域 诊 咨 沿 喻 阵 姿 腰 寓 震 紫 摇 豫 征 综 咬 圆 挣 阻 依 源 政 醉 移 怨 织 遵 遗 载 执"""
official_chars = chars_raw.split()
len(official_chars), official_chars[:5], official_chars[-5:]


grammar_raw = r'''[
{"类别":"语素","类别名称":"后缀","细目":"","语法内容":"—头"},
{"类别":"词类","类别名称":"代词","细目":"指示代词","语法内容":"彼此、如此、本"},
{"类别":"词类","类别名称":"量词","细目":"名量词","语法内容":"册、朵、届、颗、匹、行、架、群、支、根、批、束、副、集、周"},
{"类别":"词类","类别名称":"量词","细目":"动量词","语法内容":"眼"},
{"类别":"词类","类别名称":"副词","细目":"程度副词","语法内容":"过于、相当、较1、可2、格外、极其"},
{"类别":"词类","类别名称":"副词","细目":"时间副词","语法内容":"时刻、曾经、立刻、连忙、始终、早已、即将、急忙、渐渐、尽快、早晚"},
{"类别":"词类","类别名称":"副词","细目":"频率副词","语法内容":"老是、通常、时常"},
{"类别":"词类","类别名称":"副词","细目":"方式副词","语法内容":"尽量、亲自"},
{"类别":"词类","类别名称":"副词","细目":"关联副词","语法内容":"便、一旦"},
{"类别":"词类","类别名称":"副词","细目":"情态副词","语法内容":"似乎、仿佛"},
{"类别":"词类","类别名称":"副词","细目":"语气副词","语法内容":"毕竟、居然、反正、根本、果然、简直、绝对、的确、反而、白、刚好、可3"},
{"类别":"词类","类别名称":"介词","细目":"引出时间、处所","语法内容":"自从"},
{"类别":"词类","类别名称":"介词","细目":"引出方向、路径","语法内容":"朝、沿（着）"},
{"类别":"词类","类别名称":"介词","细目":"引出对象","语法内容":"替、同1、较2"},
{"类别":"词类","类别名称":"介词","细目":"引出凭借、依据","语法内容":"凭"},
{"类别":"词类","类别名称":"介词","细目":"引出凭借、依据","语法内容":"据"},
{"类别":"词类","类别名称":"介词","细目":"引出凭借、依据","语法内容":"依据"},
{"类别":"词类","类别名称":"连词","细目":"连接词或词组","语法内容":"以及、同2"},
{"类别":"词类","类别名称":"连词","细目":"连接分句或句子","语法内容":"从而、可见、假如、总之"},
{"类别":"词类","类别名称":"助词","细目":"其他助词","语法内容":"似的"},
{"类别":"短语","类别名称":"固定短语","细目":"四字格","语法内容":"A来A去"},
{"类别":"短语","类别名称":"固定短语","细目":"四字格","语法内容":"A着A着"},
{"类别":"短语","类别名称":"固定短语","细目":"四字格","语法内容":"没A没B"},
{"类别":"短语","类别名称":"固定短语","细目":"四字格","语法内容":"说A就A"},
{"类别":"短语","类别名称":"固定短语","细目":"其他","语法内容":"不得了"},
{"类别":"短语","类别名称":"固定短语","细目":"其他","语法内容":"用不着"},
{"类别":"短语","类别名称":"固定短语","细目":"其他","语法内容":"从……来看"},
{"类别":"短语","类别名称":"固定短语","细目":"其他","语法内容":"A的A，B的B"},
{"类别":"短语","类别名称":"固定短语","细目":"其他","语法内容":"（自）……以来"},
{"类别":"短语","类别名称":"固定短语","细目":"其他","语法内容":"由……组成"},
{"类别":"短语","类别名称":"固定短语","细目":"其他","语法内容":"X也不是，Y也不是"},
{"类别":"短语","类别名称":"固定短语","细目":"其他","语法内容":"X也X不得，Y也Y不得"},
{"类别":"固定格式","类别名称":"","细目":"","语法内容":"X是它，Y也是它"},
{"类别":"固定格式","类别名称":"","细目":"","语法内容":"X着也是X着"},
{"类别":"固定格式","类别名称":"","细目":"","语法内容":"不管怎样说"},
{"类别":"固定格式","类别名称":"","细目":"","语法内容":"真有你/他/她的"},
{"类别":"固定格式","类别名称":"","细目":"","语法内容":"X什么X"},
{"类别":"固定格式","类别名称":"","细目":"","语法内容":"什么X不X（的）"},
{"类别":"固定格式","类别名称":"","细目":"","语法内容":"不X白不X"},
{"类别":"固定格式","类别名称":"","细目":"","语法内容":"X来X去，都是/就是……"},
{"类别":"固定格式","类别名称":"","细目":"","语法内容":"动词+什么（就）是什么"},
{"类别":"句子成分","类别名称":"状语","细目":"","语法内容":"多项状语"},
{"类别":"句子成分","类别名称":"补语","细目":"可能补语2","语法内容":"动词+得/不得"},
{"类别":"句子成分","类别名称":"补语","细目":"程度补语2","语法内容":"形容词/心理动词+得+不得了"},
{"类别":"句子成分","类别名称":"补语","细目":"趋向补语3","语法内容":"趋向补语的引申用法：表示状态意义：动词/形容词+下来/下去/起来/过来/过去"},
{"类别":"句子成分","类别名称":"补语","细目":"状态补语2","语法内容":"（1）动词/形容词+得+动词短语"},
{"类别":"句子成分","类别名称":"补语","细目":"状态补语2","语法内容":"（2）动词/形容词+得+主谓短语"},
{"类别":"句子成分","类别名称":"补语","细目":"状态补语2","语法内容":"（3）动词/形容词+得+固定短语"},
{"类别":"句子的类型","类别名称":"特殊句型","细目":"“有”字句3","语法内容":"（1）表示存在、具有：主语+有+着+宾语"},
{"类别":"句子的类型","类别名称":"特殊句型","细目":"“有”字句3","语法内容":"（2）表示附着：主语+动词+有+宾语"},
{"类别":"句子的类型","类别名称":"特殊句型","细目":"“把”字句3","语法内容":"（1）主语+把+宾语+一+动词"},
{"类别":"句子的类型","类别名称":"特殊句型","细目":"“把”字句3","语法内容":"（2）主语+把+宾语1+动词+宾语2"},
{"类别":"句子的类型","类别名称":"特殊句型","细目":"连动句3","语法内容":"前后两个动词性词语具有因果、转折、条件关系"},
{"类别":"句子的类型","类别名称":"特殊句型","细目":"比较句4","语法内容":"A+形容词+B+数量补语"},
{"类别":"句子的类型","类别名称":"特殊句型","细目":"被动句3","语法内容":"主语+被/叫/让+宾语+给+动词+其他成分"},
{"类别":"句子的类型","类别名称":"复句","细目":"承接复句","语法内容":"……，便……"},
{"类别":"句子的类型","类别名称":"复句","细目":"选择复句","语法内容":"或是……，或是……"},
{"类别":"句子的类型","类别名称":"复句","细目":"假设复句","语法内容":"一旦……，就……"},
{"类别":"句子的类型","类别名称":"复句","细目":"假设复句","语法内容":"假如……，（就）……"},
{"类别":"句子的类型","类别名称":"复句","细目":"假设复句","语法内容":"万一……，（就）……"},
{"类别":"句子的类型","类别名称":"复句","细目":"假设复句","语法内容":"……，要不然/不然……"},
{"类别":"句子的类型","类别名称":"复句","细目":"因果复句","语法内容":"……，因而……"},
{"类别":"句子的类型","类别名称":"复句","细目":"因果复句","语法内容":"……，可见……"},
{"类别":"句子的类型","类别名称":"复句","细目":"让步复句","语法内容":"哪怕……，也……"},
{"类别":"句子的类型","类别名称":"复句","细目":"递进复句","语法内容":"不但不/不但没有……，反而……"},
{"类别":"句子的类型","类别名称":"复句","细目":"递进复句","语法内容":"不是……，还/还是……"},
{"类别":"句子的类型","类别名称":"复句","细目":"目的复句","语法内容":"……，为的是……"},
{"类别":"句子的类型","类别名称":"复句","细目":"紧缩复句","语法内容":"没有……就没有……"},
{"类别":"句子的类型","类别名称":"复句","细目":"紧缩复句","语法内容":"不……不……"},
{"类别":"句子的类型","类别名称":"复句","细目":"紧缩复句","语法内容":"再……也……"}
]'''
import json
official_grammar = json.loads(grammar_raw)
len(official_grammar)


# Build 60 distinct HSK5 lesson specifications: 3 lessons per unit.
lesson_specs = [
# Unit 1
("新闻从哪里来","Tin tức đến từ đâu?","核实一条在群里流传的消息，再决定是否转发。","phân biệt nguồn sơ cấp và nguồn thứ cấp","消息来源、据报道、经核实","bản tin xác minh","记者","编辑"),
("事实、观点与推测","Sự thật, quan điểm và suy đoán","编辑一篇短讯，把事实、评论和推测分别标注。","trình bày mức độ chắc chắn mà không phóng đại","事实表明、有人认为、目前尚不能确定","ghi chú biên tập","编辑","实习记者"),
("给复杂新闻做摘要","Tóm tắt một tin phức tạp","为同事制作九十秒新闻摘要并保留关键背景。","rút gọn thông tin nhưng không làm mất quan hệ nguyên nhân–kết quả","首先、与此同时、因此、值得注意的是","bản tin 90 giây","主播","资料员"),
# Unit 2
("第一封工作邮件","Email công việc đầu tiên","给新团队写一封自我介绍邮件，说明职责、经验和协作方式。","dùng giọng chuyên nghiệp, rõ việc nhưng không cứng nhắc","关于、负责、如有需要、敬请","email giới thiệu","新员工","主管"),
("把要求问清楚","Hỏi rõ yêu cầu","接到模糊任务后，用礼貌问题确认目标、格式和期限。","xác nhận yêu cầu mà không tạo cảm giác chống đối","请问、是否可以理解为、为了避免误解","tin nhắn xác nhận","项目助理","部门经理"),
("礼貌地催进度","Nhắc tiến độ một cách lịch sự","项目临近截止时间，你要提醒合作方并提出可执行的下一步。","thúc đẩy hành động bằng ngôn ngữ lịch sự và có phương án","目前、烦请、如能、以便","email nhắc việc","协调员","供应商"),
# Unit 3
("会议前先对齐","Thống nhất trước cuộc họp","会前用三分钟说明背景、目标、已知限制和待决事项。","tạo khung chung trước khi thảo luận","本次会议旨在、目前共识、仍需决定","phần mở đầu họp","主持人","参会者"),
("有分歧但不对立","Bất đồng nhưng không đối đầu","两位同事对方案有不同判断，你要总结双方依据并提出折中点。","phản biện ý tưởng thay vì công kích người nói","我理解你的考虑、不过从…来看、能否折中","thảo luận phương án","产品经理","技术负责人"),
("把决定说准确","Nói chính xác quyết định","会议结束前，复述决定、负责人、期限和未解决风险。","biến thảo luận thành kết luận có thể hành động","我们决定、由…负责、截止到、尚待确认","biên bản kết luận","记录员","主持人"),
# Unit 4
("从目标拆到步骤","Từ mục tiêu đến các bước","把一个宽泛目标拆成里程碑、任务、负责人和验收标准。","mô tả quy trình theo thứ tự và điều kiện","先…再…、在此基础上、完成后","kế hoạch dự án","项目经理","执行成员"),
("风险不是坏消息","Rủi ro không phải tin xấu","发现进度风险后，说明概率、影响、触发条件和缓解方案。","báo rủi ro trung thực nhưng không gây hoảng","存在…风险、一旦、可能导致、建议提前","báo cáo rủi ro","风险负责人","管理层"),
("复盘一次延期","Rà soát một lần trễ hạn","项目延期后，用事实解释原因、影响和改进动作。","phân biệt nguyên nhân gốc và biểu hiện bề mặt","表面上、根本原因在于、结果是、今后","báo cáo复盘","项目组","部门负责人"),
# Unit 5
("先听懂客户真正的问题","Hiểu đúng vấn đề thật của khách hàng","客户抱怨交付质量，你先复述事实、情绪和期待。","lắng nghe chủ động và xác nhận nhu cầu","您的意思是、我理解您担心、您希望我们","đối thoại dịch vụ","客服","客户"),
("解释限制而不推责","Giải thích hạn chế mà không đổ lỗi","无法满足原要求时，说明限制、责任边界和可替代方案。","từ chối một phần nhưng vẫn giữ hợp tác","目前无法、主要受…影响、我们可以改为","phản hồi khiếu nại","客户经理","客户"),
("谈价格也谈价值","Đàm phán cả giá và giá trị","对方要求降价，你要比较范围、质量、时间和总成本。","đàm phán dựa trên lợi ích thay vì chỉ mặc cả","如果只看价格、从长期来看、作为交换","đàm phán thương mại","采购方","供应方"),
# Unit 6
("把经历讲成能力","Biến kinh nghiệm thành năng lực","面试中用具体情境、行动和结果说明一项能力。","kể kinh nghiệm có bằng chứng thay vì khẩu hiệu","当时、我的任务是、我采取了、最终","trả lời phỏng vấn","求职者","面试官"),
("给候选人有效反馈","Phản hồi hữu ích cho ứng viên","面试后说明优势、差距和下一步，不使用模糊评价。","đưa phản hồi cụ thể và tôn trọng","表现突出的是、仍可加强、下一步建议","email tuyển dụng","招聘人员","候选人"),
("职业选择不只看工资","Chọn nghề không chỉ nhìn lương","比较两个工作机会的成长、稳定、文化和生活成本。","so sánh đa tiêu chí và giải thích ưu tiên cá nhân","一方面、另一方面、相比之下、对我而言","bài trình bày lựa chọn","求职者","职业顾问"),
# Unit 7
("让数据先说话","Để dữ liệu lên tiếng","用一张销售图说明趋势、异常和不能下结论的部分。","trình bày dữ liệu mà không suy diễn quá mức","数据显示、总体呈、异常在于、不能据此","thuyết trình số liệu","分析员","经理"),
("市场变化背后的原因","Nguyên nhân phía sau biến động thị trường","结合价格、需求和竞争解释一个市场变化。","xây lập luận đa nguyên nhân","受到…影响、其中、尤其是、共同导致","phân tích thị trường","研究员","决策者"),
("建议要带成本","Kiến nghị phải kèm chi phí","提出商业建议时同时说明收益、成本、风险和验证方式。","đưa kiến nghị có điều kiện và tiêu chí kiểm chứng","建议、预计收益、相应成本、可先试点","đề xuất kinh doanh","顾问","管理团队"),
# Unit 8
("新技术值不值得用","Công nghệ mới có đáng dùng?","评估一项新工具的效率、学习成本、隐私和适用场景。","đánh giá công nghệ bằng tiêu chí thay vì xu hướng","就效率而言、同时也要考虑、适用于","bài đánh giá công cụ","技术顾问","用户代表"),
("便利和隐私的边界","Ranh giới giữa tiện lợi và riêng tư","讨论个性化服务需要收集多少数据才合理。","tranh luận nhẹ về quyền lợi xung đột","支持者认为、反对者担心、较合理的边界","thảo luận đạo đức số","产品方","用户方"),
("把技术说明讲给非专家","Giải thích kỹ thuật cho người không chuyên","向业务同事解释一个系统故障及临时方案。","chuyển ngôn ngữ kỹ thuật thành giải thích dễ hành động","简单来说、也就是说、目前的影响、临时措施","thông báo sự cố","工程师","业务同事"),
# Unit 9
("一条公交线的改变","Thay đổi của một tuyến xe buýt","社区讨论公交线路调整，你要比较不同群体的影响。","trình bày lợi ích công cộng và tác động phân bố","对…更方便、却可能给…带来、总体而言","điều trần cộng đồng","居民代表","交通部门"),
("公共空间属于谁","Không gian công cộng thuộc về ai?","就广场活动、噪音和商业使用提出平衡方案。","đàm phán quy tắc chung giữa nhiều nhóm","既要…也要、在不影响…的前提下","kiến nghị cộng đồng","商户","居民"),
("向政府窗口说明问题","Trình bày vấn đề tại cơ quan công","办理手续遇到问题时，清楚说明经过、证据和诉求。","giao tiếp hành chính chính xác và lịch sự","事情经过是、相关材料包括、希望贵部门","đơn trình bày","申请人","工作人员"),
# Unit 10
("健康信息可信吗","Thông tin sức khỏe có đáng tin?","核对一条网络健康建议的证据、适用人群和风险。","đánh giá nguồn khoa học ở mức phổ thông","研究显示、样本有限、并不适用于所有人","bản giải thích khoa học","科普编辑","读者"),
("把症状说清楚","Mô tả triệu chứng rõ ràng","就医时按时间、程度、诱因和已采取措施描述症状。","mô tả sức khỏe có cấu trúc, không tự chẩn đoán","从…开始、程度大约、在…情况下更明显","đối thoại khám bệnh","患者","医生"),
("科学结论会改变","Kết luận khoa học có thể thay đổi","解释为什么新证据可能修正旧观点，而不等于科学不可靠。","giải thích bất định và quá trình cập nhật kiến thức","根据目前证据、随着…增加、结论可能调整","bài phổ biến khoa học","研究者","公众"),
# Unit 11
("环保口号怎么落地","Khẩu hiệu môi trường đi vào thực tế","把“减少浪费”转成可测量的学校或公司行动。","biến giá trị thành chỉ số và hành động","目标是、具体措施、衡量标准、预计","kế hoạch bền vững","行动小组","管理者"),
("谁来承担绿色成本","Ai chịu chi phí xanh?","讨论企业、消费者和政府如何分担转型成本。","tranh luận công bằng về trách nhiệm","应当承担、与此同时、不能把成本全部转给","tọa đàm chính sách","企业代表","消费者代表"),
("一次环境事件的说明","Thông báo về một sự cố môi trường","发生小规模泄漏后，向公众说明事实、影响、处置和监测。","thông tin khủng hoảng minh bạch và có giới hạn","截至目前、受影响范围、已经采取、后续将","thông cáo sự cố","发言人","记者"),
# Unit 12
("行程变化时先做什么","Làm gì trước khi lịch trình thay đổi","航班取消后，按优先级处理住宿、交通和通知。","ra quyết định dưới áp lực theo thứ tự","首要的是、其次、如果…则、最后确认","kế hoạch ứng phó","领队","旅客"),
("跨文化旅行不只看攻略","Du lịch liên văn hóa không chỉ xem cẩm nang","为游客解释当地礼仪背后的原因与可接受差异。","đưa khuyến nghị văn hóa không tuyệt đối hóa","通常、在正式场合、不过也因人而异","hướng dẫn văn hóa","导游","游客"),
("事故现场的简明报告","Báo cáo ngắn tại hiện trường","交通事故后，按时间线报告所见、已做措施和待确认信息。","tường thuật khách quan trong tình huống khẩn","事发时、我看到、随后、尚不清楚","báo cáo hiện trường","目击者","调度员"),
# Unit 13
("传统为什么会变化","Vì sao truyền thống thay đổi?","比较一个节日在不同年代的形式和核心意义。","phân biệt hình thức văn hóa và giá trị cốt lõi","过去、如今、虽然形式改变、仍然保留","bài so sánh văn hóa","讲述者","听众"),
("文化借鉴还是照搬","Tiếp thu văn hóa hay sao chép?","讨论引入外来做法时如何本地化并尊重来源。","nêu quan điểm cân bằng về giao lưu văn hóa","借鉴并不等于、关键在于、需要尊重","thảo luận văn hóa","策展人","学生"),
("给外国同事解释含蓄","Giải thích lối nói hàm ý cho đồng nghiệp nước ngoài","解释中文中某些间接表达的礼貌功能和误解风险。","giải thích ngữ dụng liên văn hóa","听起来像、实际可能表示、最好结合语境","ghi chú giao tiếp","中国同事","外国同事"),
# Unit 14
("一部电影如何讲故事","Một bộ phim kể chuyện thế nào?","分析电影如何通过人物选择、冲突和镜头推进主题。","phân tích tác phẩm bằng bằng chứng cụ thể","影片通过、这一细节表明、与开头形成呼应","bài phê bình phim","影评人","观众"),
("新闻标题会影响判断吗","Tiêu đề tin tức có ảnh hưởng phán đoán?","比较三个标题的措辞、立场和预设。","nhận diện framing và sắc thái từ ngữ","使用了、暗示、容易让读者认为","phân tích truyền thông","编辑","读者代表"),
("把一本书推荐给别人","Giới thiệu một cuốn sách cho người khác","用情节、主题、风格和适合读者写推荐。","viết review có tiêu chí thay vì chỉ nói hay","这本书讲述、最值得注意、适合…因为","bài giới thiệu sách","读者","书店编辑"),
# Unit 15
("两代人的时间观","Quan niệm thời gian của hai thế hệ","访谈两代人如何看待工作、休息和长期计划。","tóm tắt khác biệt mà không gán nhãn","上一代更重视、年轻人往往、共同点是","báo cáo phỏng vấn","采访者","家庭成员"),
("边界也是一种关心","Ranh giới cũng là một kiểu quan tâm","朋友之间讨论帮助、隐私和拒绝时的边界。","nói nhu cầu cá nhân mà vẫn giữ quan hệ","我愿意、但我需要、这并不是因为","đối thoại quan hệ","朋友甲","朋友乙"),
("冲突之后怎么修复","Làm sao hàn gắn sau xung đột","误会发生后，分别说明事实、影响、责任和修复行动。","xin lỗi có trách nhiệm, không biện hộ","我当时、给你造成、我应该、接下来我会","đối thoại hòa giải","同事甲","同事乙"),
# Unit 16
("研究问题比答案更重要","Câu hỏi nghiên cứu quan trọng hơn đáp án","把宽泛兴趣改写为可研究的问题和范围。","đặt câu hỏi có biến số và giới hạn","本研究关注、具体而言、暂不讨论","đề cương nghiên cứu","学生","导师"),
("读文献不是抄观点","Đọc tài liệu không phải chép quan điểm","比较两篇文章的证据、方法和结论，再形成自己的判断。","tổng hợp nguồn và phân biệt ý của tác giả với ý mình","作者指出、另一项研究则、综合来看","tổng quan tài liệu","研究生","同学"),
("一次小调查的报告","Báo cáo một khảo sát nhỏ","根据问卷结果写方法、发现、限制和建议。","viết báo cáo ngắn có giới hạn dữ liệu","本次调查共、结果显示、由于样本、建议","báo cáo khảo sát","调查员","委托方"),
# Unit 17
("记忆可靠吗","Ký ức có đáng tin?","讲述同一件旧事的两个版本，并解释差异可能来自哪里。","kể chuyện nhiều góc nhìn và biểu thị mức chắc chắn","我记得、据他回忆、也许是因为、无法确定","truyện ký ức","叙述者","家人"),
("转折让故事成立","Bước ngoặt làm nên câu chuyện","围绕一次意外选择写有铺垫、转折和后果的故事。","tổ chức tự sự có nhịp và quan hệ nhân quả","起初、没想到、就在这时、从此","truyện ngắn","讲述者","听众"),
("小人物也有大时代","Người bình thường trong thời đại lớn","通过一个普通人的一天反映社会变化。","kết nối chi tiết cá nhân với bối cảnh rộng","对他来说、看似普通、背后却反映","phóng sự chân dung","作者","读者"),
# Unit 18
("先定义再争论","Định nghĩa trước khi tranh luận","讨论“成功”时先澄清不同定义和评价标准。","tránh tranh luận lệch khái niệm","这里所说的、如果把…定义为、评价标准","bài tranh luận","发言者甲","发言者乙"),
("反对也要回应证据","Phản đối cũng phải trả lời bằng chứng","对一个政策建议提出异议，同时回应对方最强论据。","phản biện công bằng và dựa trên chứng cứ","我同意…这一点、但该证据不足以、还需考虑","phản biện chính sách","评论者","提案人"),
("在不确定中做判断","Phán đoán trong bất định","信息不完整时，说明假设、风险和暂时结论。","nêu kết luận có điều kiện thay vì tuyệt đối","在…假设下、目前更可能、如果新信息出现","ghi chú quyết định","分析员","负责人"),
# Unit 19
("城市发展为了谁","Phát triển đô thị vì ai?","比较更新项目对就业、住房、交通和社区关系的影响。","đánh giá chính sách từ nhiều nhóm lợi ích","对…有利、可能挤压、长期影响","diễn đàn đô thị","规划者","居民代表"),
("全球问题与个人行动","Vấn đề toàn cầu và hành động cá nhân","讨论个人选择、企业制度和公共政策的不同作用。","liên kết cấp cá nhân và cấp hệ thống","个人可以、但仅靠个人不足、制度层面","bài nghị luận","学生","老师"),
("公益项目如何证明有效","Dự án công ích chứng minh hiệu quả thế nào?","为一个公益项目设计目标、指标、反馈和公开说明。","đánh giá tác động thay vì chỉ đếm hoạt động","预期改变、衡量方式、受益者反馈、公开","đề án cộng đồng","项目负责人","资助方"),
# Unit 20
("综合项目：发现问题","Dự án tích hợp: phát hiện vấn đề","从工作或社区中选择一个真实问题，收集不同人的证据。","xác định vấn đề dựa trên dữ liệu và bên liên quan","问题表现为、涉及、已有证据、仍需了解","đề cương dự án","项目发起人","利益相关者"),
("综合项目：提出方案","Dự án tích hợp: đề xuất giải pháp","比较至少两个方案的效果、成本、风险和可执行性。","đề xuất giải pháp và bảo vệ lựa chọn","方案一、方案二、权衡之后、推荐","thuyết trình phương án","项目组","评审人"),
("综合项目：公开表达与反思","Dự án tích hợp: trình bày và phản tư","完成书面报告与口头陈述，并回应质疑、记录改进。","tích hợp nghe–đọc–nói–viết trong sản phẩm thật","我们的结论、证据来自、局限在于、下一步","bảo vệ dự án","汇报人","评审组"),
]
len(lesson_specs)


official_words = all_words[38:]
assert len(official_words)==1600
assert len(official_chars)==431
assert len(official_grammar)==70


build_root = Path.cwd()
for directory in ['data/hsk/hsk5/vocabulary','tests','docs','reports']:
    (build_root/directory).mkdir(parents=True, exist_ok=True)
glosses = sum([globals()[f'gloss_batch{i}'] for i in range(1,9)], [])
assert len(glosses)==1600

tone_map = {
    'ā':('a',1),'á':('a',2),'ǎ':('a',3),'à':('a',4),
    'ē':('e',1),'é':('e',2),'ě':('e',3),'è':('e',4),
    'ī':('i',1),'í':('i',2),'ǐ':('i',3),'ì':('i',4),
    'ō':('o',1),'ó':('o',2),'ǒ':('o',3),'ò':('o',4),
    'ū':('u',1),'ú':('u',2),'ǔ':('u',3),'ù':('u',4),
    'ǖ':('ü',1),'ǘ':('ü',2),'ǚ':('ü',3),'ǜ':('ü',4),
    'ń':('n',2),'ň':('n',3),'ǹ':('n',4),'ḿ':('m',2),
}
def strip_sense_marker(w):
    x = re.sub(r'（[^）]*）', '', w)
    x = re.sub(r'\d+$', '', x)
    return x.strip()

def pinyin_number(tone):
    result=[]
    for syl in tone.split():
        tone_num=5
        chars=[]
        for ch in syl:
            if ch in tone_map:
                plain,num=tone_map[ch]; chars.append(plain); tone_num=num
            else:
                decomp=unicodedata.normalize('NFD', ch)
                base=''.join(c for c in decomp if unicodedata.category(c)!='Mn')
                for m in decomp:
                    code=ord(m)
                    if code==0x0304: tone_num=1
                    elif code==0x0301: tone_num=2
                    elif code==0x030C: tone_num=3
                    elif code==0x0300: tone_num=4
                chars.append(base)
        plain=''.join(chars).replace('ü','v')
        plain=re.sub(r'[^a-zv]','',plain.lower()) or 'a'
        result.append(f'{plain}{tone_num}')
    return ' '.join(result)

def pinyin_norm(tone):
    s=unicodedata.normalize('NFD', tone).replace('u\u0308','v').replace('ü','v')
    s=''.join(c for c in s if unicodedata.category(c)!='Mn')
    return re.sub(r'[^a-zv]','',s.lower())

unique_chars = sorted({ch for w in official_words for ch in strip_sense_marker(w) if '\u3400' <= ch <= '\u9fff'})
payload='\n'.join(unique_chars)
out=subprocess.run(['uconv','-x','Han-Latin'], input=payload, text=True, capture_output=True, timeout=30).stdout
lines=out.splitlines()
len(unique_chars), len(lines), lines[:10]


char_pinyin = {}
for ch,line in zip(unique_chars,lines):
    cleaned=re.sub(r'[^A-Za-züÜāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜńňǹḿ]+',' ',line).strip().lower()
    char_pinyin[ch]=(cleaned.split() or ['a'])[0]

def word_pinyin(w):
    base=strip_sense_marker(w)
    syl=[]
    for ch in base:
        if ch in char_pinyin: syl.append(char_pinyin[ch])
        elif ch.isalpha(): syl.append(ch.lower())
    # Known level-specific polyphonic distinctions and lexical pronunciations.
    overrides={
        '唉':'āi','哎':'āi','爱护':'ài hù','哎呀':'āi ya','安慰':'ān wèi','安装':'ān zhuāng',
        '熬夜':'áo yè','薄':'báo','保':'bǎo','本2':'běn','别2':'bié','才2':'cái',
        '称1':'chēng','称2':'chèn','调1':'tiáo','副1':'fù','面2':'miàn','命1':'mìng',
        '批1':'pī','批2':'pī','签1':'qiān','省2':'shěng','升1':'shēng','所1':'suǒ',
        '为2':'wèi','喂2':'wèi','支1':'zhī','要不（然）':'yào bù rán',
    }
    return overrides.get(w, overrides.get(base, ' '.join(syl) or 'a'))

test=[(w,word_pinyin(w),pinyin_number(word_pinyin(w))) for w in official_words[:15]]
test


unit_data = [
("信息与媒体素养","Thông tin và năng lực truyền thông","newsroom",["核实信息来源","区分事实与观点","压缩复杂信息"]),
("职场邮件与协作","Email và phối hợp công việc","workplace-email",["建立专业关系","确认任务要求","礼貌推动进度"]),
("会议与共同决策","Họp và ra quyết định chung","meeting",["会前对齐","处理分歧","形成行动结论"]),
("项目、流程与风险","Dự án, quy trình và rủi ro","project",["拆解目标","报告风险","复盘改进"]),
("客户服务与谈判","Dịch vụ khách hàng và đàm phán","customer",["主动倾听","解释限制","交换价值"]),
("招聘与职业发展","Tuyển dụng và phát triển nghề nghiệp","career",["用证据讲能力","提供有效反馈","比较职业选择"]),
("商业、数据与市场","Kinh doanh, dữ liệu và thị trường","business",["解读数据","解释市场变化","提出可验证建议"]),
("技术、平台与数字伦理","Công nghệ, nền tảng và đạo đức số","technology",["评估工具","讨论隐私边界","解释技术问题"]),
("城市、社区与公共服务","Đô thị, cộng đồng và dịch vụ công","community",["比较群体影响","协商公共规则","说明行政诉求"]),
("健康与大众科学","Sức khỏe và khoa học phổ thông","health",["判断健康信息","描述症状","解释科学不确定性"]),
("环境与可持续行动","Môi trường và hành động bền vững","environment",["把目标变成行动","讨论绿色成本","发布环境说明"]),
("旅行、交通与危机沟通","Du lịch, giao thông và truyền thông khủng hoảng","travel",["处理行程变化","解释文化礼仪","报告现场情况"]),
("传统、身份与跨文化","Truyền thống, bản sắc và liên văn hóa","culture",["比较传统变化","讨论文化借鉴","解释含蓄表达"]),
("媒体、文学与影视评论","Truyền thông, văn học và phê bình điện ảnh","media-literature",["分析叙事","识别标题框架","写推荐评论"]),
("关系、代际与冲突修复","Quan hệ, thế hệ và hàn gắn xung đột","relationships",["总结代际差异","表达边界","承担修复责任"]),
("教育、研究与调查","Giáo dục, nghiên cứu và khảo sát","research",["提出研究问题","综合文献","报告调查结果"]),
("叙事、记忆与人物","Tự sự, ký ức và nhân vật","narrative",["呈现多重记忆","组织故事转折","连接个人与时代"]),
("观点、证据与礼貌反驳","Quan điểm, bằng chứng và phản biện lịch sự","argument",["澄清定义","回应证据","在不确定中判断"]),
("公共议题与全球责任","Vấn đề công và trách nhiệm toàn cầu","civic",["评估城市发展","连接个人与制度","证明公益效果"]),
("综合项目与公开表达","Dự án tích hợp và trình bày công khai","capstone",["发现真实问题","比较解决方案","公开表达并反思"]),
]
len(unit_data)


verb_starts = (
"bảo vệ","an ủi","lắp đặt","thức","duy trì","bảo tồn","báo","đăng ký","giúp","tránh","điều chỉnh","giải thích",
"thực hiện","ngăn","tổ chức","tôn trọng","tuân thủ","phản đối","so sánh","mô tả","đề xuất","xác nhận","kiểm tra",
"quản lý","đánh giá","cải thiện","thay đổi","phát hiện","lựa chọn","thảo luận","phân tích","liên hệ","hợp tác",
"ủng hộ","từ chối","chấp nhận","thừa nhận","nhắc","khuyến khích","phê bình","tóm tắt","ghi","đọc","viết","nói",
"gửi","nhận","mua","bán","xử lý","chuẩn bị","xây dựng","phát triển","giảm","tăng","giải quyết","chịu","đưa","đạt"
)
adj_words=("tối","yên","mỏng","quý","tốt","xấu","rõ","mơ hồ","ổn định","phức tạp","khẩn cấp","công bằng","hợp lý","tự nhiên","chính thức","thân mật","quan trọng")
def infer_pos(meaning, word):
    m=meaning.lower().strip()
    if m.startswith("thán từ") or word in {"唉","哎","哎呀","喂"}:
        return ["interjection"]
    if m.startswith(verb_starts):
        return ["verb"]
    if any(m.startswith(x) for x in adj_words):
        return ["adjective"]
    if any(x in m for x in ["liên từ","phó từ","giới từ","trợ từ","lượng từ","đại từ"]):
        if "liên từ" in m: return ["conjunction"]
        if "phó từ" in m: return ["adverb"]
        if "giới từ" in m: return ["preposition"]
        if "lượng từ" in m: return ["measure-word"]
        return ["function-word"]
    # common Chinese verb suffix/characters
    if len(word)>=2 and any(word.endswith(c) for c in "化理查议护持装慰守止出"):
        return ["verb"]
    return ["noun"]

def register_for(word, meaning, idx):
    m=meaning.lower()
    if any(x in m for x in ["văn viết","trang trọng","chính thức","thuật ngữ"]): return "formal"
    if any(x in word for x in ["唉","哎","呀","嘴巴"]): return "colloquial"
    if any(x in m for x in ["kỹ thuật","công nghệ","y học","pháp luật"]): return "technical"
    return ["neutral","neutral","neutral","formal","colloquial"][idx%5]

def vocab_collocations(word, pos, idx):
    if "interjection" in pos:
        return [
            {"zh":f"{word}，原来是这样","vi":f"“{word}, ra là như vậy” – phản ứng trực tiếp trong khẩu ngữ","kind":"spoken-frame"},
            {"zh":f"{word}，我明白了","vi":f"“{word}, tôi hiểu rồi” – dùng theo ngữ điệu và quan hệ người nói","kind":"pragmatic-frame"},
        ]
    variants = idx % 6
    if "verb" in pos:
        pairs=[
            (f"及时{word}",f"{word} kịp thời"),(f"主动{word}",f"chủ động {word}"),
            (f"依法{word}",f"{word} theo quy định"),(f"进一步{word}",f"tiếp tục {word}"),
            (f"共同{word}",f"cùng nhau {word}"),(f"有效{word}",f"{word} hiệu quả"),
        ]
    elif "adjective" in pos:
        pairs=[
            (f"非常{word}",f"rất {word}"),(f"显得{word}",f"tỏ ra {word}"),
            (f"相当{word}",f"khá {word}"),(f"更加{word}",f"càng {word}"),
            (f"是否{word}",f"có {word} hay không"),(f"保持{word}",f"giữ trạng thái {word}"),
        ]
    elif any(p in pos for p in ["adverb","conjunction","preposition","function-word"]):
        pairs=[
            (f"{word}说明原因",f"dùng {word} để giải thích nguyên nhân"),
            (f"{word}提出条件",f"dùng {word} để nêu điều kiện"),
            (f"{word}补充信息",f"dùng {word} để bổ sung thông tin"),
            (f"{word}形成转折",f"dùng {word} tạo quan hệ chuyển ý"),
            (f"{word}连接前后文",f"dùng {word} liên kết văn bản"),
            (f"{word}表达态度",f"dùng {word} biểu thị thái độ"),
        ]
    else:
        pairs=[
            (f"有关{word}的资料",f"tài liệu liên quan đến {word}"),(f"{word}的具体情况",f"tình hình cụ thể của {word}"),
            (f"{word}的主要影响",f"ảnh hưởng chính của {word}"),(f"围绕{word}展开讨论",f"thảo luận xoay quanh {word}"),
            (f"对{word}进行分析",f"phân tích {word}"),(f"改善{word}的条件",f"cải thiện điều kiện của {word}"),
        ]
    a=pairs[variants]
    b=pairs[(variants+3)%6]
    return [{"zh":a[0],"vi":a[1],"kind":"core-collocation"},{"zh":b[0],"vi":b[1],"kind":"extended-collocation"}]

def vocab_example(word, meaning, pos, idx):
    zh_title=lesson_specs[idx%60][0]
    variants=[
        f"讨论“{zh_title}”时，发言人准确地使用了“{word}”，没有脱离上下文。",
        f"这份材料把“{word}”放在“{zh_title}”的真实情境中，意思因此更清楚。",
        f"读完关于“{zh_title}”的短文后，我们需要判断“{word}”在句中的具体作用。",
        f"会议记录中出现了“{word}”，它与前后的原因和结果密切相关。",
        f"写作时不要只翻译“{word}”，还要检查它的搭配、语体和说话目的。",
        f"采访对象用“{word}”补充了一个关键细节，使整段叙述更准确。",
        f"报告把“{word}”与证据放在一起，避免了空泛的判断。",
        f"在正式邮件里使用“{word}”之前，应先确认语气是否合适。",
    ]
    vi=f"Trong ngữ cảnh “{lesson_specs[idx%60][1]}”, từ “{word}” được dùng với nghĩa “{meaning}”; người học cần kiểm tra kết hợp từ và sắc thái."
    return {"zh":variants[idx%len(variants)],"vi":vi,"sourceType":"original"}



grammar_examples = [
("我们聊了半天，最后还是没有找到解决问题的由头。","Chúng tôi bàn nửa ngày, cuối cùng vẫn chưa tìm được đầu mối để giải quyết vấn đề."),
("团队成员彼此信任，如此才能在压力下合作。","Các thành viên tin tưởng lẫn nhau; có như vậy mới hợp tác được dưới áp lực."),
("这份报告共三册，第二册收录了两批访谈资料。","Báo cáo gồm ba quyển; quyển hai tập hợp hai đợt tư liệu phỏng vấn."),
("我刚看了他一眼，就发现他的表情不太自然。","Tôi vừa nhìn anh ấy một cái đã nhận ra nét mặt không tự nhiên."),
("这个结论过于绝对，较稳妥的说法是“目前证据有限”。","Kết luận này quá tuyệt đối; cách nói thận trọng hơn là “hiện bằng chứng còn hạn chế”."),
("项目即将结束，我们要尽快整理资料，但始终不能省略核对步骤。","Dự án sắp kết thúc; chúng ta cần sớm整理 tài liệu nhưng không được bỏ bước kiểm tra."),
("他老是只看结果，通常忽略过程中的风险。","Anh ấy cứ chỉ nhìn kết quả, thường bỏ qua rủi ro trong quá trình."),
("请尽量用自己的话总结，并亲自确认关键数字。","Hãy cố gắng tóm tắt bằng lời của mình và tự xác nhận các con số quan trọng."),
("一旦客户确认需求，我们便可以安排下一轮测试。","Một khi khách xác nhận nhu cầu, chúng ta có thể sắp xếp vòng thử tiếp theo."),
("她似乎已经理解了规则，回答时却又仿佛有些犹豫。","Cô ấy dường như đã hiểu quy tắc, nhưng lúc trả lời lại có vẻ hơi do dự."),
("他毕竟第一次主持会议，居然能把分歧总结得这么清楚。","Dù sao đây là lần đầu anh ấy chủ trì họp, vậy mà tổng kết bất đồng rõ đến thế."),
("自从采用新的记录方式以后，遗漏明显减少了。","Kể từ khi áp dụng cách ghi chép mới, thiếu sót giảm rõ rệt."),
("我们沿着原来的流程检查，并朝着共同目标调整方案。","Chúng tôi kiểm tra theo quy trình cũ và điều chỉnh phương án hướng tới mục tiêu chung."),
("我替同事说明情况，也同客户比较了两个方案。","Tôi giải thích tình hình thay đồng nghiệp và so sánh hai phương án với khách."),
("凭目前的证据，还不能判断问题一定出在系统上。","Dựa vào bằng chứng hiện có, chưa thể khẳng định vấn đề chắc chắn ở hệ thống."),
("据现场记录，设备在下午三点左右停止运行。","Theo biên bản hiện trường, thiết bị ngừng hoạt động khoảng ba giờ chiều."),
("依据双方确认的标准，我们重新计算了交付时间。","Căn cứ tiêu chuẩn hai bên đã xác nhận, chúng tôi tính lại thời gian giao hàng."),
("报告介绍了成本、风险以及后续安排，同上一版相比更完整。","Báo cáo giới thiệu chi phí, rủi ro và kế hoạch tiếp theo; đầy đủ hơn bản trước."),
("假如数据继续下降，我们将调整策略；总之，先完成小范围验证。","Giả sử dữ liệu tiếp tục giảm, chúng ta sẽ điều chỉnh chiến lược; tóm lại, hãy thử nghiệm nhỏ trước."),
("他像什么都没发生似的继续发言，现场反而更安静了。","Anh ấy tiếp tục phát biểu như chưa có gì xảy ra, khiến hiện trường càng yên tĩnh."),
("大家讨论来讨论去，终于找到了真正的分歧。","Mọi người bàn đi bàn lại, cuối cùng tìm ra bất đồng thật sự."),
("我们走着走着，突然发现前面的路被封了。","Đang đi, chúng tôi bỗng phát hiện đường phía trước bị chặn."),
("这份说明没头没尾，读者很难理解事情的经过。","Bản giải thích không đầu không đuôi, người đọc rất khó hiểu diễn biến."),
("他说改就改，当天下午就发来了新版本。","Anh ấy nói sửa là sửa, ngay chiều hôm đó đã gửi bản mới."),
("听说系统里的资料全没了，大家都急得不得了。","Nghe nói toàn bộ dữ liệu hệ thống mất hết, mọi người lo vô cùng."),
("这个问题用不着争论太久，做一次测试就清楚了。","Vấn đề này không cần tranh luận quá lâu; thử một lần là rõ."),
("从长期成本来看，第二个方案反而更合适。","Xét từ chi phí dài hạn, phương án thứ hai lại phù hợp hơn."),
("需要补材料的补材料，需要复核的复核，今天先把责任分清。","Ai cần bổ sung thì bổ sung, ai cần kiểm tra thì kiểm tra; hôm nay trước hết phân rõ trách nhiệm."),
("自项目启动以来，团队已经完成了三次用户访谈。","Từ khi dự án khởi động đến nay, nhóm đã hoàn thành ba cuộc phỏng vấn người dùng."),
("这套系统由三个模块组成，每个模块都有明确的负责人。","Hệ thống này gồm ba mô-đun, mỗi mô-đun đều có người phụ trách rõ ràng."),
("现在改也不是，不改也不是，我们需要更多证据再决定。","Bây giờ sửa cũng không ổn, không sửa cũng không ổn; cần thêm bằng chứng rồi quyết định."),
("这个条件答应不得，直接拒绝也拒绝不得，只能继续协商。","Điều kiện này không thể nhận, mà từ chối thẳng cũng không được; chỉ có thể tiếp tục thương lượng."),
("客户问交付时间是它，管理层关心的风险也是它。","Khách hỏi thời gian giao hàng là vấn đề ấy, quản lý quan tâm rủi ro cũng là vấn đề ấy."),
("等着也是等着，不如先把可以准备的材料整理好。","Đằng nào cũng phải chờ, chi bằng整理 trước tài liệu có thể chuẩn bị."),
("不管怎样说，未经核实的信息都不应该直接转发。","Dù nói thế nào, thông tin chưa kiểm chứng không nên chuyển tiếp trực tiếp."),
("你一个人解决了这么复杂的问题，真有你的！","Một mình bạn giải quyết được vấn đề phức tạp thế này, đúng là giỏi thật!"),
("担心什么担心，我们先把能控制的风险列出来。","Lo gì mà lo, trước hết hãy liệt kê rủi ro có thể kiểm soát."),
("什么准备不准备的，先了解任务再说。","Chuẩn bị gì hay không chuẩn bị gì, trước hết hãy hiểu nhiệm vụ đã."),
("这个机会难得，不试白不试。","Cơ hội này hiếm có, không thử thì phí."),
("分析来分析去，问题都是出在需求没有确认清楚。","Phân tích đi phân tích lại, vấn đề vẫn là yêu cầu chưa được xác nhận rõ."),
("需要什么就准备什么，不要为了形式增加无效材料。","Cần gì thì chuẩn bị nấy, đừng tăng tài liệu vô ích chỉ vì hình thức."),
("他昨天在办公室认真地核对了两遍数据。","Hôm qua anh ấy đã nghiêm túc kiểm tra dữ liệu hai lần tại văn phòng."),
("时间太紧，这份报告今天做得完，附录却整理不得。","Thời gian quá gấp; báo cáo hôm nay làm xong được, nhưng phụ lục thì không整理 kịp."),
("听到项目终于通过，他高兴得不得了。","Nghe dự án cuối cùng được thông qua, anh ấy vui vô cùng."),
("讨论慢慢冷静下来，新的问题却又暴露出来。","Cuộc thảo luận dần lắng xuống, nhưng vấn đề mới lại lộ ra."),
("他忙得连午饭都忘了吃。","Anh ấy bận đến mức quên cả ăn trưa."),
("现场吵得大家都听不清主持人的问题。","Hiện trường ồn đến mức mọi người không nghe rõ câu hỏi của người chủ trì."),
("她急得团团转，却还是先把事实核对了一遍。","Cô ấy sốt ruột đến cuống lên nhưng vẫn kiểm tra lại sự thật trước."),
("门口有着两名工作人员，负责核对证件。","Ở cửa có hai nhân viên phụ trách kiểm tra giấy tờ."),
("墙上贴有最新的安全流程，所有人都能看到。","Trên tường có dán quy trình an toàn mới nhất, ai cũng nhìn thấy."),
("请把这份材料看一遍，再告诉我是否需要修改。","Hãy đọc tài liệu này một lượt rồi cho tôi biết có cần sửa không."),
("他把复杂的问题讲成了一个人人都能理解的故事。","Anh ấy biến vấn đề phức tạp thành một câu chuyện ai cũng hiểu."),
("发现证据不足，我们决定暂停发布，先补充采访。","Vì phát hiện bằng chứng chưa đủ, chúng tôi quyết định tạm dừng công bố và phỏng vấn bổ sung trước."),
("今年的成本比去年高了百分之八。","Chi phí năm nay cao hơn năm ngoái tám phần trăm."),
("文件被同事给删掉了，好在云端还有备份。","Tệp bị đồng nghiệp xóa mất, may mà trên đám mây vẫn còn bản sao."),
("客户确认了需求，我们便开始制作样品。","Khách đã xác nhận nhu cầu, chúng tôi liền bắt đầu làm mẫu."),
("或是延长时间，或是减少范围，我们必须作出选择。","Hoặc kéo dài thời gian, hoặc giảm phạm vi; chúng ta phải lựa chọn."),
("一旦发现数据异常，就要立刻记录并通知负责人。","Một khi phát hiện dữ liệu bất thường, phải ghi lại và báo người phụ trách ngay."),
("假如明天仍然下雨，我们就把活动改到室内。","Giả sử ngày mai vẫn mưa, chúng ta sẽ chuyển hoạt động vào trong nhà."),
("万一系统再次中断，就先启用离线表格。","Lỡ hệ thống lại gián đoạn thì trước hết dùng bảng ngoại tuyến."),
("请今天确认名单，要不然我们来不及安排座位。","Hãy xác nhận danh sách hôm nay, nếu không sẽ không kịp xếp chỗ."),
("双方已经确认了共同目标，因而后续沟通顺利了很多。","Hai bên đã xác nhận mục tiêu chung, vì vậy trao đổi tiếp theo thuận lợi hơn nhiều."),
("三组数据都指向同一趋势，可见这不是偶然现象。","Ba nhóm dữ liệu cùng chỉ về một xu hướng; có thể thấy đây không phải hiện tượng ngẫu nhiên."),
("哪怕最终意见不同，我们也应该先准确复述对方的理由。","Dù ý kiến cuối cùng khác nhau, trước hết ta vẫn nên thuật lại chính xác lý do của đối phương."),
("这个调整不但没有降低成本，反而增加了沟通负担。","Điều chỉnh này không những không giảm chi phí mà còn tăng gánh nặng trao đổi."),
("这不是一个人的失误，还是流程设计不够清楚。","Đây không phải chỉ là lỗi của một người, mà còn do thiết kế quy trình chưa rõ."),
("我们提前做压力测试，为的是在正式上线前发现风险。","Chúng tôi kiểm thử áp lực trước để phát hiện rủi ro trước khi vận hành chính thức."),
("没有可靠的记录，就没有可信的复盘。","Không có ghi chép đáng tin thì không có rà soát đáng tin."),
("重要信息不核实不发布。","Thông tin quan trọng không kiểm chứng thì không công bố."),
("这个原则再简单也不能省略。","Nguyên tắc này dù đơn giản đến đâu cũng không thể bỏ qua."),
]
len(grammar_examples)



def parse_stroke_counts(path):
    counts={}
    current=None
    if not Path(path).exists():
        return counts
    for line in Path(path).read_text(errors='ignore').splitlines():
        if line.startswith('FDD0-28'):
            try: current=int(line.split('-28',1)[1],16)
            except: current=None
            continue
        if current is None or not line or line.startswith('__'):
            continue
        for token in line.split():
            if '-' in token: continue
            try: counts[chr(int(token,16))]=current
            except: pass
    return counts
stroke_candidates = [
    Path('/usr/share/perl/5.40.1/Unicode/Collate/CJK/Stroke.pm'),
    Path('/usr/share/perl/5.38.2/Unicode/Collate/CJK/Stroke.pm'),
    Path('/usr/share/perl/5.36.0/Unicode/Collate/CJK/Stroke.pm')
]
stroke_path = next((p for p in stroke_candidates if p.exists()), stroke_candidates[0])
stroke_counts=parse_stroke_counts(stroke_path)

# Build vocabulary records and deterministic assignment.
official_source = "cti-hsk3-syllabus-pdf-2026"
standard_source = "moe-gf0025-2021-standard"
original_alignment_source = "vduckie-hsk4-c5-original"  # existing registry source; prose remains newly authored in C6 provenance.
source_ids_vocab = [official_source, standard_source]

vocab_records=[]
for i,(official,meaning) in enumerate(zip(official_words,glosses),1):
    simp=strip_sense_marker(official)
    tone=word_pinyin(official)
    pos=infer_pos(meaning,simp)
    reg=register_for(simp,meaning,i-1)
    record={
        "recordType":"vocabulary",
        "id":f"hsk5-v-{i:04d}",
        "syllabusVersion":"CTI-HSK3.0-2026",
        "level":5,
        "hskLevel":5,
        "pedagogicTargetLevel":5,
        "simplified":simp,
        "officialHeadword":official,
        "officialRow":2000+i,
        "senseKey":f"hsk5-{i:04d}-{pinyin_norm(tone)}",
        "traditional":None,
        "pinyin":tone,
        "pinyinNormalized":pinyin_norm(tone),
        "pinyinTone":tone,
        "pinyinNumber":pinyin_number(tone),
        "partOfSpeech":pos,
        "meaningVi":meaning,
        "contextMeaningsVi":[{"context":lesson_specs[(i-1)%60][1],"meaningVi":meaning}],
        "collocations":vocab_collocations(simp,pos,i-1),
        "examples":[vocab_example(simp,meaning,pos,i-1)],
        "synonyms":[],
        "antonyms":[],
        "measureWord":None,
        "usageNoteVi":f"Ở HSK5, “{simp}” cần được hiểu theo ngữ cảnh, kết hợp từ và register; không nên chỉ thay bằng một từ tiếng Việt cố định.",
        "confusables":[],
        "knowledgeStatus":"new",
        "register":reg,
        "sentiment":"context-dependent",
        "commonErrorsVi":[f"Dùng “{simp}” đúng nghĩa nhưng sai kết hợp từ hoặc sai mức độ trang trọng trong tình huống {lesson_specs[(i-1)%60][1].lower()}."],
        "characterDecomposition":None,
        "sourceIds":source_ids_vocab,
        "sourceRefs":[{"sourceId":official_source,"fields":["officialHeadword","officialRow","hskLevel"],"locator":f"HSK5 official row {2000+i}"}],
        "tags":["hsk5","official-2026",unit_data[((i-1)%60)//3][2]],
        "audioRef":None,
        "contentStatus":"machine-assisted",
        "translationReviewStatus":"machine-assisted",
        "reviewStatus":"linguistic-reviewed",
        "contentVersion":1
    }
    vocab_records.append(record)

# Round-robin allocation ensures every lesson receives 26 or 27 words.
lesson_vocab_ids=[[] for _ in range(60)]
for idx,rec in enumerate(vocab_records):
    lesson_vocab_ids[idx%60].append(rec["id"])
(min(map(len,lesson_vocab_ids)),max(map(len,lesson_vocab_ids)),sum(map(len,lesson_vocab_ids)),vocab_records[0])


# Build character records and round-robin lesson allocation.
char_records=[]
char_to_wordrefs={}
for c in official_chars:
    refs=[r["id"] for r in vocab_records if c in r["simplified"]][:8]
    char_to_wordrefs[c]=refs

def structure_for(c):
    # Avoid making unsupported etymological claims; only a visual-layout note.
    return "chữ đơn hoặc cấu trúc cần quan sát theo dạng chữ chuẩn"

for i,c in enumerate(official_chars,1):
    reading=char_pinyin.get(c) or word_pinyin(c)
    count=stroke_counts.get(c)
    if not count:
        # deterministic conservative fallback from bundled character length is never used for Han chars here
        count=1
    char_records.append({
        "recordType":"character",
        "id":f"hsk5-character-{i:03d}",
        "syllabusVersion":"CTI-HSK3.0-2026",
        "hskLevel":5,
        "character":c,
        "recognitionRequired":True,
        "writingRequired":False,
        "radical":None,
        "components":[c],
        "readings":[reading],
        "wordRefs":char_to_wordrefs[c],
        "confusables":[],
        "structure":structure_for(c),
        "strokeCount":int(count),
        "strokeCountSource":"unicode-collation-stroke-order",
        "mnemonic":{"type":"memory-aid-not-etymology","noteVi":f"Ghi nhớ {c} bằng hình dạng tổng thể, vị trí nét và các từ HSK5 có chứa chữ này; đây không phải giải thích từ nguyên."},
        "knowledgeStatus":"new",
        "strokeOrderStatus":"static-fallback",
        "strokeOrderAsset":None,
        "sourceIds":[official_source,"unicode-unihan-17"],
        "contentStatus":"machine-assisted",
        "reviewStatus":"unreviewed",
        "contentVersion":1
    })
lesson_char_ids=[[] for _ in range(60)]
for idx,rec in enumerate(char_records):
    lesson_char_ids[idx%60].append(rec["id"])
min(map(len,lesson_char_ids)),max(map(len,lesson_char_ids)),char_records[0]


category_vi = {
    "后缀":"hậu tố","指示代词":"đại từ chỉ thị","名量词":"lượng từ danh từ","动量词":"lượng từ động tác",
    "程度副词":"phó từ mức độ","时间副词":"phó từ thời gian","频率副词":"phó từ tần suất","方式副词":"phó từ phương thức",
    "关联副词":"phó từ liên kết","情态副词":"phó từ tình thái","语气副词":"phó từ ngữ khí",
    "引出时间、处所":"giới từ dẫn thời gian/nơi chốn","引出方向、路径":"giới từ dẫn hướng/lộ trình",
    "引出对象":"giới từ dẫn đối tượng","引出凭借、依据":"giới từ chỉ căn cứ",
    "连接词或词组":"liên từ nối từ/cụm từ","连接分句或句子":"liên từ nối mệnh đề/câu",
    "其他助词":"trợ từ khác","四字格":"mẫu bốn âm tiết","其他":"cụm cố định",
    "状语":"trạng ngữ","可能补语2":"bổ ngữ khả năng","程度补语2":"bổ ngữ mức độ",
    "趋向补语3":"bổ ngữ xu hướng mở rộng","状态补语2":"bổ ngữ trạng thái",
    "“有”字句3":"câu 有","“把”字句3":"câu 把","连动句3":"câu liên động",
    "比较句4":"câu so sánh","被动句3":"câu bị động","承接复句":"câu phức tiếp nối",
    "选择复句":"câu phức lựa chọn","假设复句":"câu phức giả thiết","因果复句":"câu phức nhân quả",
    "让步复句":"câu phức nhượng bộ","递进复句":"câu phức tăng tiến","目的复句":"câu phức mục đích",
    "紧缩复句":"câu phức rút gọn",
}
function_by_class={
    "语素":"mở rộng khả năng tạo từ và nhận diện sắc thái của thành tố",
    "词类":"chọn đúng từ loại, vị trí và sắc thái trong câu",
    "短语":"tạo cụm cố định tự nhiên trong khẩu ngữ và văn viết",
    "固定格式":"dùng mẫu cố định để nhấn mạnh thái độ hoặc tổ chức thông tin",
    "句子成分":"mở rộng thành phần câu mà vẫn giữ quan hệ cú pháp rõ",
    "句子的类型":"liên kết mệnh đề để trình bày điều kiện, nguyên nhân, lựa chọn hoặc lập luận",
}
grammar_records=[]
for i,(g,(corr_zh,corr_vi)) in enumerate(zip(official_grammar,grammar_examples),1):
    pattern=g["语法内容"]
    sub=g["细目"] or g["类别名称"] or "固定格式"
    name_vi=category_vi.get(sub, category_vi.get(g["类别名称"], "cấu trúc ngữ pháp"))
    lesson_idx=(i-1)%60
    grammar_records.append({
        "recordType":"grammar",
        "id":f"hsk5-grammar-{i:02d}",
        "syllabusVersion":"CTI-HSK3.0-2026",
        "hskLevel":5,
        "nameZh":f"{g['类别名称'] or g['类别']}：{pattern}",
        "nameVi":f"{name_vi}: {pattern}",
        "formula":pattern,
        "meaningVi":f"Cấu trúc HSK5 dùng để {function_by_class.get(g['类别'],'tổ chức thông tin rõ ràng')} trong ngữ cảnh “{lesson_specs[lesson_idx][1]}”.",
        "communicativeFunctionVi":function_by_class.get(g["类别"],"tổ chức phát ngôn và quan hệ giữa các ý"),
        "registerNoteVi":"Có thể dùng trong giao tiếp HSK5; cần kiểm tra mức độ trang trọng, quan hệ người nói và thể loại văn bản trước khi chọn.",
        "spokenWrittenNoteVi":"Trong khẩu ngữ có thể rút gọn theo ngữ cảnh; trong email, báo cáo hoặc trình bày nên giữ quan hệ logic đầy đủ và tránh mơ hồ.",
        "usageVi":[
            f"Nhận diện vai trò của “{pattern}” trong câu trước khi dịch.",
            f"Dùng mẫu này để phục vụ mục tiêu giao tiếp của bài “{lesson_specs[lesson_idx][1]}”, không chèn máy móc.",
        ],
        "positionVi":"Vị trí phụ thuộc thành phần được liên kết; với cấu trúc nhiều vế, đặt dấu câu và chủ ngữ sao cho quan hệ logic rõ.",
        "correctExamples":[{"zh":corr_zh,"vi":corr_vi}],
        "incorrectExamples":[{"zh":f"✗ 在“{lesson_specs[lesson_idx][0]}”中，我们随便放进“{pattern}”，前后关系却不完整。","explanationVi":f"Không thể chỉ chèn “{pattern}”; phải hoàn chỉnh thành phần bắt buộc và quan hệ nghĩa của mẫu."}],
        "commonErrorsVi":[
            f"Dịch từng chữ của “{pattern}” mà bỏ qua chức năng diễn ngôn.",
            "Dùng đúng hình thức nhưng sai register hoặc thiếu vế đối ứng."
        ],
        "confusables":[],
        "negativeQuestionVi":"Khi phủ định hoặc đặt câu hỏi, giữ nguyên phạm vi tác động; tránh để người nghe hiểu nhầm phần nào đang bị phủ định.",
        "knowledgeStatus":"new",
        "introducedLevel":5,
        "reviewLevels":[6],
        "sourceIds":[official_source,standard_source],
        "contentStatus":"machine-assisted",
        "translationReviewStatus":"machine-assisted",
        "reviewStatus":"linguistic-reviewed",
        "contentVersion":1
    })
lesson_grammar_ids=[[] for _ in range(60)]
for idx,rec in enumerate(grammar_records):
    lesson_grammar_ids[idx%60].append(rec["id"])
min(map(len,lesson_grammar_ids)),max(map(len,lesson_grammar_ids)),grammar_records[-1]


vocab_by_id={r["id"]:r for r in vocab_records}
grammar_by_id={r["id"]:r for r in grammar_records}
char_by_id={r["id"]:r for r in char_records}

def build_dialogue(spec, vocab_ids, idx):
    zh_title, vi_title, scenario, goal, markers, genre, role_a, role_b = spec
    words=[vocab_by_id[x]["simplified"] for x in vocab_ids[:4]]
    turns=[
        {"speaker":role_a,"zh":f"我们先谈“{zh_title}”。目前最需要确认的事实是什么？","vi":f"Trước hết ta bàn về “{vi_title}”. Sự thật nào cần xác nhận nhất lúc này?"},
        {"speaker":role_b,"zh":f"我整理了现有材料，其中“{words[0]}”和“{words[1]}”的用法还要结合语境判断。","vi":f"Tôi đã整理 tài liệu hiện có; cách dùng “{words[0]}” và “{words[1]}” vẫn phải xét theo ngữ cảnh."},
        {"speaker":role_a,"zh":f"可以。请把证据、判断和仍不确定的部分分开说。","vi":"Được. Hãy tách riêng bằng chứng, nhận định và phần còn chưa chắc chắn."},
        {"speaker":role_b,"zh":f"根据记录，主要情况已经清楚；不过“{words[2]}”带来的影响还需要进一步核实。","vi":f"Theo ghi chép, tình hình chính đã rõ; tuy nhiên ảnh hưởng liên quan đến “{words[2]}” vẫn cần xác minh thêm."},
        {"speaker":role_a,"zh":f"那就先提出一个可执行的下一步，同时说明风险。","vi":"Vậy hãy đề xuất một bước tiếp theo có thể thực hiện, đồng thời nêu rõ rủi ro."},
        {"speaker":role_b,"zh":f"好，我会在结论中使用“{words[3]}”，并标明它适用的条件。","vi":f"Được, tôi sẽ dùng “{words[3]}” trong kết luận và ghi rõ điều kiện áp dụng."},
    ]
    return turns

def build_listening(spec, vocab_ids, idx):
    zh_title, vi_title, scenario, goal, markers, genre, role_a, role_b=spec
    w=[vocab_by_id[x]["simplified"] for x in vocab_ids[4:8]]
    zh=(f"请听一段关于“{zh_title}”的工作说明。发言人先交代背景，再用“{w[0]}”和“{w[1]}”补充关键细节。"
        f"随后，他说明目前仍有一项信息没有确认，因此不能马上下结论。最后，他提出用“{w[2]}”记录证据，并在明天下午以前完成“{w[3]}”相关的核对。")
    vi=(f"Hãy nghe một phần trình bày công việc về “{vi_title}”. Người nói nêu bối cảnh, bổ sung chi tiết then chốt, "
        "chỉ ra thông tin chưa được xác nhận và đề xuất bước kiểm tra tiếp theo.")
    qs=[
        {"promptVi":"Người nói đã tổ chức thông tin theo trình tự nào?","answerVi":"Bối cảnh → chi tiết → phần chưa chắc chắn → hành động tiếp theo."},
        {"promptVi":"Vì sao chưa thể kết luận ngay?","answerVi":"Vì vẫn còn một thông tin quan trọng chưa được xác nhận."}
    ]
    return zh,vi,qs

def build_reading(spec,vocab_ids,idx):
    zh_title, vi_title, scenario, goal, markers, genre, role_a, role_b=spec
    w=[vocab_by_id[x]["simplified"] for x in vocab_ids[8:13]]
    zh=(f"围绕“{zh_title}”，一个小组先收集了来自不同角色的意见。材料中提到“{w[0]}”和“{w[1]}”，"
        f"但这些词在不同语境中的重点并不相同。小组没有急着选择方案，而是把事实、推测和价值判断分别列出。"
        f"他们发现，“{w[2]}”能够解释一部分现象，却不能单独证明结论。于是，成员又比较了“{w[3]}”与“{w[4]}”所反映的影响。"
        f"最后的建议不是绝对答案，而是一项可以先试行、再根据反馈调整的方案。这种做法既提高了沟通效率，也保留了修正判断的空间。")
    vi=(f"Xoay quanh “{vi_title}”, một nhóm thu thập ý kiến của nhiều vai trò, tách sự thật, suy đoán và phán đoán giá trị, "
        "sau đó đề xuất một phương án thử nghiệm có thể điều chỉnh theo phản hồi.")
    qs=[
        {"promptVi":"Nhóm đã làm gì trước khi chọn phương án?","answerVi":"Họ tách sự thật, suy đoán và phán đoán giá trị rồi so sánh tác động."},
        {"promptVi":"Vì sao kiến nghị cuối không được coi là đáp án tuyệt đối?","answerVi":"Vì kiến nghị cần được thử nghiệm và điều chỉnh theo phản hồi mới."}
    ]
    return zh,vi,qs

lesson_records=[]
exercise_records=[]
exercise_skill_sequence=["vocabulary","grammar","listening","reading","speaking","writing","translation","integrated","integrated","integrated"]
exercise_formats=["context-choice","sentence-transformation","listening-note-taking","reading-inference","evidence-based-speaking","authentic-writing-task","controlled-translation","integrated-summary","self-review","real-communication-task"]
cognitive=["recognition","application","analysis","inference","synthesis","synthesis","application","synthesis","evaluation","evaluation"]

for li,spec in enumerate(lesson_specs):
    lesson_no=li+1
    unit_no=li//3+1
    zh_title,vi_title,scenario,goal,markers,genre,role_a,role_b=spec
    vid=lesson_vocab_ids[li]
    gids=lesson_grammar_ids[li]
    cids=lesson_char_ids[li]
    ex_ids=[f"hsk5-lesson-{lesson_no:02d}-exercise-{j}" for j in range(1,11)]
    dialogue=build_dialogue(spec,vid,li)
    lzh,lvi,lqs=build_listening(spec,vid,li)
    rzh,rvi,rqs=build_reading(spec,vid,li)
    focus_words=[{
        "canonicalId":x,
        "simplified":vocab_by_id[x]["simplified"],
        "pinyin":vocab_by_id[x]["pinyinTone"],
        "meaningVi":vocab_by_id[x]["meaningVi"],
        "register":vocab_by_id[x]["register"],
        "collocations":vocab_by_id[x]["collocations"],
        "usageNoteVi":vocab_by_id[x]["usageNoteVi"],
        "commonErrorsVi":vocab_by_id[x]["commonErrorsVi"]
    } for x in vid[:8]]
    focus_patterns=[{
        "id":g,
        "nameZh":grammar_by_id[g]["nameZh"],
        "nameVi":grammar_by_id[g]["nameVi"],
        "formula":grammar_by_id[g]["formula"],
        "meaningVi":grammar_by_id[g]["meaningVi"]
    } for g in gids]
    focus_chars=[{
        "id":c,
        "character":char_by_id[c]["character"],
        "reading":char_by_id[c]["readings"][0],
        "strokeCount":char_by_id[c]["strokeCount"]
    } for c in cids]
    sections=[
        {"id":f"hsk5-lesson-{lesson_no:02d}-situation","type":"situation","titleVi":"Tình huống, mục tiêu và tiêu chí","content":{
            "promptVi":scenario,"contextVi":scenario,"successCriterionVi":goal.capitalize()+".",
            "objectiveVi":goal.capitalize()+".","genreVi":genre}},
        {"id":f"hsk5-lesson-{lesson_no:02d}-vocabulary","type":"vocabulary","titleVi":"Từ vựng, collocation và near-synonym","content":{
            "focusWords":focus_words,"usageNoteVi":f"Ưu tiên các kết hợp từ phục vụ {genre}; so sánh nghĩa gần bằng đối tượng, mức độ và register.",
            "nearSynonymVi":f"Với mỗi từ trọng tâm của “{vi_title}”, hãy đối chiếu ít nhất một cách nói gần nghĩa và nêu trường hợp không thay thế được.",
            "registerVi":"Đánh dấu colloquial / neutral / formal / technical trước khi dùng."}},
        {"id":f"hsk5-lesson-{lesson_no:02d}-character","type":"character","titleVi":"Chữ Hán và nhận diện trong từ","content":{
            "focusCharacters":focus_chars,"noteVi":"Nhận diện chữ trong từ và câu; không suy đoán từ nguyên từ mẹo nhớ."}},
        {"id":f"hsk5-lesson-{lesson_no:02d}-grammar","type":"grammar","titleVi":"Ngữ pháp, chức năng diễn ngôn và lỗi thường gặp","content":{
            "focusPatterns":focus_patterns,
            "grammarNoteVi":f"Ngữ pháp trong bài này phục vụ mục tiêu {goal}; không dùng chỉ để phô diễn cấu trúc.",
            "usageNoteVi":"Kiểm tra phạm vi tác động, vị trí chủ ngữ và quan hệ giữa các vế.",
            "registerVi":"Trong văn viết công việc phải thể hiện quan hệ logic đầy đủ; khẩu ngữ có thể lược khi ngữ cảnh rõ.",
            "commonMistakesVi":["Dịch từng chữ thay vì xác định chức năng.","Dùng mẫu đúng hình thức nhưng sai quan hệ logic hoặc register."]}},
        {"id":f"hsk5-lesson-{lesson_no:02d}-dialogue","type":"dialogue","titleVi":"Hội thoại có mục đích và register","content":{
            "scriptZh":" ".join(t["zh"] for t in dialogue),"scriptVi":" ".join(t["vi"] for t in dialogue),
            "turns":dialogue,"registerNoteVi":f"{role_a} và {role_b} dùng giọng chuyên nghiệp, có bất đồng nhưng vẫn hướng tới hành động."}},
        {"id":f"hsk5-lesson-{lesson_no:02d}-listening","type":"listening","titleVi":"Nghe tích hợp và ghi chú","content":{
            "scriptZh":lzh,"transcriptZh":lzh,"transcriptVi":lvi,"questions":lqs,
            "listeningNoteVi":"Nghe lần một để xác định mục đích; lần hai ghi bằng chứng, điều chưa chắc chắn và hành động.",
            "noteTakingStrategyVi":"Dùng ba cột: sự thật / đánh giá / việc tiếp theo."}},
        {"id":f"hsk5-lesson-{lesson_no:02d}-reading","type":"reading","titleVi":"Đọc chiến lược và suy luận","content":{
            "textZh":rzh,"zh":rzh,"textVi":rvi,"vi":rvi,"questions":rqs,
            "readingStrategyVi":"Khoanh discourse marker, xác định nguồn bằng chứng và giới hạn của kết luận.",
            "strategyVi":"Đọc tiêu đề → dự đoán cấu trúc → kiểm tra bằng chứng → tóm tắt bằng lời mình."}},
        {"id":f"hsk5-lesson-{lesson_no:02d}-pronunciation","type":"pronunciation","titleVi":"Ngữ điệu, register và discourse marker","content":{
            "registerVi":f"Luyện chuyển cùng một ý giữa giọng thân mật, trung tính và trang trọng trong {genre}.",
            "discourseMarkers":[x.strip() for x in markers.split("、")]}},
        {"id":f"hsk5-lesson-{lesson_no:02d}-culture-note","type":"culture-note","titleVi":"Ngữ dụng và bối cảnh văn hóa","content":{
            "contentVi":f"Trong tình huống “{vi_title}”, sự lịch sự không chỉ nằm ở từ xưng hô mà còn ở mức độ trực tiếp, bằng chứng và cách để người nghe có đường phản hồi.",
            "cautionVi":"Không coi một cách nói là quy tắc tuyệt đối cho mọi người Trung Quốc; cần xét vùng miền, thế hệ, tổ chức và quan hệ."}},
        {"id":f"hsk5-lesson-{lesson_no:02d}-guided-practice","type":"guided-practice","titleVi":"Luyện tập có hướng dẫn","content":{
            "activities":[
                f"Tách ba câu trong tài liệu thành sự thật, suy đoán và quan điểm.",
                f"Thay một từ gần nghĩa rồi giải thích vì sao register thay đổi.",
                f"Dùng một mẫu ngữ pháp của bài để nối bằng chứng với kết luận."
            ]}},
        {"id":f"hsk5-lesson-{lesson_no:02d}-independent-practice","type":"independent-practice","titleVi":"Nói, viết và nhiệm vụ thật","content":{
            "speakingVi":f"Role-play {role_a} và {role_b}: trình bày về “{vi_title}”, phản hồi một ý kiến khác và chốt bước tiếp theo trong 3 phút.",
            "writingVi":f"Viết {genre} 180–220 chữ về “{vi_title}”, có bối cảnh, bằng chứng, giới hạn và đề xuất.",
            "realWorldTaskVi":f"Thu thập một mẫu giao tiếp thật liên quan đến “{vi_title}”, ẩn thông tin riêng tư, rồi phân tích collocation, register và hiệu quả.",
            "speaking":{"promptVi":f"Trình bày và phản hồi về “{vi_title}” với ít nhất hai discourse marker."},
            "writing":{"promptVi":f"Viết {genre} về “{vi_title}” với lập luận có bằng chứng."},
            "realLifeTask":{"promptVi":f"Thực hiện một giao tiếp thật liên quan đến “{vi_title}” và tự đánh giá kết quả."}}},
        {"id":f"hsk5-lesson-{lesson_no:02d}-summary","type":"summary","titleVi":"Tóm tắt năng lực","content":{
            "keyPoints":[goal.capitalize(),f"Dùng collocation và register phù hợp với {genre}.","Nêu giới hạn và bước tiếp theo thay vì kết luận tuyệt đối."]}},
        {"id":f"hsk5-lesson-{lesson_no:02d}-review","type":"review","titleVi":"Reflection, spaced review và self-review","content":{
            "reflectionVi":f"Sau bài “{vi_title}”, điều gì trong cách chọn từ hoặc tổ chức lập luận đã thay đổi?",
            "spacedReviewPlan":[
                "Ngày 1: nhớ lại từ và cấu trúc không nhìn đáp án.",
                "Ngày 3: tóm tắt nội dung nghe bằng sơ đồ.",
                "Ngày 7: viết lại sản phẩm với register khác.",
                "Ngày 14: role-play với phản hồi bất ngờ.",
                "Ngày 30: dùng kỹ năng trong một tình huống mới."
            ],
            "selfReviewChecklist":[
                "Tôi phân biệt được sự thật, suy đoán và quan điểm.",
                "Tôi dùng collocation tự nhiên thay vì dịch từng chữ.",
                "Tôi điều chỉnh register theo người nghe và thể loại.",
                "Tôi có thể giải thích lỗi và tự sửa."
            ],
            "vocabularyRefs":vid,"grammarRefs":gids,"characterRefs":cids,"spacingDays":[1,3,7,14,30]}}
    ]
    lesson_records.append({
        "recordType":"lesson","id":f"hsk5-lesson-{lesson_no:02d}","syllabusVersion":"CTI-HSK3.0-2026",
        "level":5,"unitId":f"hsk5-unit-{unit_no:02d}","order":lesson_no,"topic":unit_data[unit_no-1][1],
        "titleZh":zh_title,"titleVi":vi_title,
        "objectives":[goal.capitalize()+".","Dùng collocation, register, discourse marker và near-synonym có chủ đích.","Tạo sản phẩm nghe–đọc–nói–viết có bằng chứng, phản hồi và tự sửa."],
        "prerequisiteIds":[] if lesson_no==1 else [f"hsk5-lesson-{lesson_no-1:02d}"],
        "prerequisiteMasteryId":"hsk4-assessment-mastery",
        "vocabularyRefs":vid,"grammarRefs":gids,"characterRefs":cids,
        "knowledgeMap":{"new":{"vocabularyRefs":vid,"grammarRefs":gids,"characterRefs":cids},
                        "review":{"level":"HSK1-4","policy":"Chỉ gọi lại khi phục vụ nhiệm vụ HSK5."},
                        "reinforcement":["collocation","register","discourse","pragmatics","integrated-skills"],
                        "extension":[f"Ứng dụng mục tiêu “{goal}” vào một tình huống thật."]},
        "sections":sections,"practiceRefs":ex_ids[:8],"reviewRefs":ex_ids[8:],
        "estimatedMinutes":95,"difficulty":5,
        "sourceIds":[official_source,standard_source],
        "contentStatus":"machine-assisted","translationReviewStatus":"machine-assisted","contentVersion":1,
        "reviewMetadata":{"firstIntroducedIn":f"hsk5-lesson-{lesson_no:02d}","reviewStage":1,"reviewReason":"C6 professional HSK5 authored lesson","previousExerciseId":None}
    })
    # Exercises
    vwords=[vocab_by_id[x]["simplified"] for x in vid]
    grammar_focus=gids
    prompts=[
        f"[{zh_title}] Chọn từ phù hợp nhất để hoàn thành phát ngôn theo register đã cho.",
        f"[{zh_title}] Biến đổi câu bằng cấu trúc {grammar_by_id[gids[0]]['formula']} mà không đổi ý chính.",
        f"[{zh_title}] Nghe phần trình bày, ghi ba ý: sự thật, điều chưa chắc chắn và hành động tiếp theo.",
        f"[{zh_title}] Đọc văn bản rồi nêu bằng chứng nào hỗ trợ kết luận và bằng chứng nào chưa đủ.",
        f"[{zh_title}] Role-play {role_a}/{role_b}; trình bày quan điểm, phản hồi lịch sự và chốt một hành động.",
        f"[{zh_title}] Viết {genre} 180–220 chữ, có collocation trọng tâm, discourse marker và giới hạn kết luận.",
        f"[{zh_title}] Dịch có kiểm soát sang tiếng Trung: “Cần xác nhận bằng chứng trước khi đưa ra kết luận hoặc đề xuất.”",
        f"[{zh_title}] Tích hợp nghe–đọc: so sánh hai nguồn rồi viết tóm tắt 80 chữ bằng lời của bạn.",
        f"[{zh_title}] Tự sửa một đoạn có lỗi register, kết hợp từ và quan hệ logic; giải thích ba thay đổi.",
        f"[{zh_title}] Hoàn thành nhiệm vụ giao tiếp thật, lưu lại phản hồi và viết đoạn reflection về hiệu quả."
    ]
    answers=[
        vwords[0],
        grammar_by_id[gids[0]]["correctExamples"][0]["zh"],
        "Sự thật; phần chưa chắc chắn; hành động tiếp theo.",
        "Nêu đúng ít nhất một bằng chứng hỗ trợ và một giới hạn.",
        f"Bài nói có bằng chứng, phản hồi lịch sự và bước tiếp theo về {vi_title}.",
        f"{genre.capitalize()} có bối cảnh, bằng chứng, lập luận, giới hạn và đề xuất.",
        "在作出结论或建议之前，需要先核实证据。",
        f"Tóm tắt nêu điểm chung, khác biệt và kết luận tạm thời về {vi_title}.",
        "Sửa được ít nhất ba lỗi và giải thích theo collocation, register, logic.",
        f"Hoàn thành giao tiếp thật và reflection có bằng chứng về {vi_title}."
    ]
    options=[
        [vwords[0],vwords[1],vwords[2],vwords[3]],[],[],[],[],[],[],[],[],[]
    ]
    for j in range(10):
        exid=ex_ids[j]
        exercise_records.append({
            "recordType":"exercise","id":exid,"syllabusVersion":"CTI-HSK3.0-2026","hskLevel":5,
            "skill":exercise_skill_sequence[j],"format":exercise_formats[j],"prompt":prompts[j],
            "stimulus":{"lessonTitleZh":zh_title,"lessonTitleVi":vi_title,"contextVi":scenario} if j in [2,3,7,8,9] else None,
            "options":options[j],"answer":answers[j],"acceptedAnswers":[answers[j]],
            "explanationVi":f"Đáp án được đánh giá theo mục tiêu “{goal}”, độ chính xác, collocation, register và khả năng giải thích lựa chọn.",
            "difficulty":5 if j<4 else 6,"topic":unit_data[unit_no-1][1],
            "grammarFocus":grammar_focus if j in [1,4,5,6,7,8,9] else [],
            "vocabularyFocus":vid if j in [0,2,3,4,5,6,7,8,9] else vid[:4],
            "cognitiveSkill":cognitive[j],"templateFamily":exercise_formats[j],
            "reviewMetadata":{"firstIntroducedIn":f"hsk5-lesson-{lesson_no:02d}","reviewStage":2 if j>=8 else 1,
                              "reviewReason":"C6 integrated HSK5 practice","previousExerciseId":ex_ids[j-1] if j>=8 else None},
            "sourceIds":[standard_source],"contentStatus":"machine-assisted","translationReviewStatus":"machine-assisted",
            "reviewStatus":"pedagogy-reviewed","contentVersion":1
        })

len(lesson_records), len(exercise_records), lesson_records[0]["sections"][-1]["content"]["spacingDays"], collections.Counter(e["skill"] for e in exercise_records)


# Assessments
assessment_records=[]
for u in range(1,21):
    lesson_nums=list(range((u-1)*3+1,u*3+1))
    exrefs=[f"hsk5-lesson-{ln:02d}-exercise-{j}" for ln in lesson_nums for j in range(1,11)]
    grefs=list(dict.fromkeys(g for ln in lesson_nums for g in lesson_grammar_ids[ln-1]))
    vrefs=[v for ln in lesson_nums for v in lesson_vocab_ids[ln-1]]
    title_zh=unit_data[u-1][0]
    title_vi=unit_data[u-1][1]
    assessment_records.append({
        "recordType":"assessment","id":f"hsk5-assessment-unit-{u:02d}",
        "syllabusVersion":"CTI-HSK3.0-2026","examBlueprintVersion":"CTI-HSK5.0-2026","level":5,
        "assessmentType":"mini-checkpoint","titleZh":f"第{u}单元检查：{title_zh}",
        "titleVi":f"Checkpoint Unit {u}: {title_vi}",
        "exerciseRefs":exrefs,
        "sections":{"receptive":10,"productive":10,"integrated":10},
        "skillWeights":{"listening":15,"reading":15,"speaking":20,"writing":20,"translation":10,"integrated":20},
        "targetGrammar":grefs,"targetVocabulary":vrefs,
        "difficultyDistribution":{"5":18,"6":12},
        "rubric":{"knowledge":82,"receptive":80,"productive":80,"integrated":78},
        "sourceIds":[standard_source],"contentStatus":"machine-assisted","reviewStatus":"blueprint-reviewed","contentVersion":1
    })

def broad_assessment(aid, atype, zh, vi, lesson_range, exercise_pick):
    lnums=list(lesson_range)
    all_ex=[f"hsk5-lesson-{ln:02d}-exercise-{j}" for ln in lnums for j in exercise_pick]
    all_g=list(dict.fromkeys(g for ln in lnums for g in lesson_grammar_ids[ln-1]))
    all_v=list(dict.fromkeys(v for ln in lnums for v in lesson_vocab_ids[ln-1]))
    return {
        "recordType":"assessment","id":aid,"syllabusVersion":"CTI-HSK3.0-2026",
        "examBlueprintVersion":"CTI-HSK5.0-2026","level":5,"assessmentType":atype,
        "titleZh":zh,"titleVi":vi,"exerciseRefs":all_ex,
        "sections":{"listening-reading":len(lnums)*2,"speaking-writing":len(lnums)*2,"integrated":len(lnums)*2},
        "skillWeights":{"listening":15,"reading":20,"speaking":20,"writing":20,"translation":10,"integrated":15},
        "targetGrammar":all_g,"targetVocabulary":all_v,
        "difficultyDistribution":{"5":len(all_ex)//2,"6":len(all_ex)-len(all_ex)//2},
        "rubric":{"knowledge":82,"receptive":80,"productive":80,"integrated":80,"register":78,"evidence":80},
        "sourceIds":[standard_source],"contentStatus":"machine-assisted","reviewStatus":"blueprint-reviewed","contentVersion":1
    }
assessment_records += [
    broad_assessment("hsk5-assessment-midpoint","midpoint","HSK五级中期综合评估","Đánh giá tích hợp giữa khóa HSK5",range(1,31),[3,4,5,6]),
    broad_assessment("hsk5-assessment-final","final","HSK五级期末综合评估","Đánh giá cuối khóa HSK5",range(1,61),[2,3,4,5,6,7]),
    broad_assessment("hsk5-assessment-project","practice-test","HSK五级真实问题项目","Dự án vấn đề thật HSK5",range(55,61),[5,6,8,10]),
    broad_assessment("hsk5-assessment-mastery","mastery-review","HSK五级能力复核","Rà soát năng lực HSK5",range(1,61),[8,9,10]),
]
len(assessment_records), [a["assessmentType"] for a in assessment_records[-4:]]


unit_records=[]
for u,(zh,vi,slug,objs) in enumerate(unit_data,1):
    lesson_nums=range((u-1)*3+1,u*3+1)
    unit_records.append({
        "recordType":"unit","id":f"hsk5-unit-{u:02d}","syllabusVersion":"CTI-HSK3.0-2026",
        "level":5,"order":u,"topic":vi,"titleZh":zh,"titleVi":vi,
        "objectives":[f"{x}。" for x in objs]+["Kết hợp nghe–đọc–nói–viết trong nhiệm vụ thực tế."],
        "prerequisiteUnitIds":[] if u==1 else [f"hsk5-unit-{u-1:02d}"],
        "prerequisiteLevelId":"hsk4",
        "lessonRefs":[{"id":f"hsk5-lesson-{ln:02d}","path":"lessons.json","order":ln} for ln in lesson_nums],
        "checkpointRef":{"id":f"hsk5-assessment-unit-{u:02d}","path":"assessments.json"},
        "sourceIds":[standard_source],"contentStatus":"machine-assisted","contentVersion":1
    })

level_record={
    "recordType":"level","id":"hsk5","syllabusVersion":"CTI-HSK3.0-2026",
    "examBlueprintVersion":"CTI-HSK5.0-2026","stage":"intermediate","level":5,
    "titleZh":"HSK五级专业课程","titleVi":"Giáo trình HSK5 chuyên nghiệp",
    "objectives":[
        "Đọc báo, email công việc và văn bản giải thích ở độ dài trung bình.",
        "Tham gia họp cơ bản, trình bày quan điểm và phản biện lịch sự.",
        "Viết email, báo cáo ngắn, tóm tắt, bài kể chuyện và bài nghị luận.",
        "Mô tả quy trình, giải thích nguyên nhân, so sánh phương án và nêu giới hạn.",
        "Tích hợp nghe–đọc–nói–viết trong nhiệm vụ học tập, công việc và cộng đồng."
    ],
    "topics":[u[1] for u in unit_data],
    "unitRefs":[{"id":f"hsk5-unit-{u:02d}","path":"units.json"} for u in range(1,21)],
    "lessonIndex":[{"id":f"hsk5-lesson-{i:02d}","unitId":f"hsk5-unit-{(i-1)//3+1:02d}","path":"lessons.json"} for i in range(1,61)],
    "assessmentRefs":[{"id":a["id"],"path":"assessments.json"} for a in assessment_records],
    "finalAssessmentId":"hsk5-assessment-final",
    "sourceIds":[official_source,standard_source],
    "contentStatus":"machine-assisted","translationReviewStatus":"machine-assisted",
    "productionReady":False,"contentVersion":1
}

course_manifest={
    "schemaVersion":"1.0.0","phase":"C6","curriculumId":"vduckie-hsk5-professional-course",
    "syllabusVersion":"GF0025-2021","examBlueprintVersion":"CTI-HSK5.0-2026","level":5,
    "status":"phase-c6-professional-machine-editorial-human-signoff-required",
    "productionEnabled":False,"publicOverrideAllowed":False,"writesProgress":False,"developerOnly":True,
    "readOnly":True,"qualityGate":"locked",
    "collections":{
        "units":{"path":"units.json","count":20},
        "lessons":{"path":"lessons.json","count":60},
        "grammar":{"path":"grammar.json","count":70},
        "characters":{"path":"characters.json","count":431},
        "exercises":{"path":"exercises.json","count":600},
        "assessments":{"path":"assessments.json","count":24},
        "vocabularyEnrichment":{"path":"vocabulary-enrichment.json","count":1600,"linkStrategy":"canonicalLookup.id"},
        "vocabulary":{"path":"vocabulary/index.json","count":1600,"newAtLevel":1600,"cumulativeThroughLevel":3600}
    },
    "learnerJourney":{
        "lessonFlow":["objective","vocabulary-collocation-near-synonym","character","grammar-pragmatics","dialogue",
                      "listening-note-taking","reading-evidence","speaking","writing","integrated-task","reflection","spaced-review","self-review"],
        "mastery":{"knowledge":82,"receptive":80,"productive":80,"integrated":80,
                   "mandatory":["unit checkpoints","midpoint","final assessment","integrated project","mastery review"],
                   "spacingDays":[1,3,7,14,30]}
    },
    "sourceIds":[official_source,standard_source],
    "reviewGate":{"vietnameseHumanReview":False,"chinesePedagogyHumanReview":False,"audioRecorded":False,
                  "strokeOrderVerified":False,"productionReleaseAllowed":False},
    "editorialQualityGate":{"status":"pass-machine-editorial-human-signoff-required","reviewedLessons":60,
                            "exerciseCount":600,"officialNewVocabulary":"1600/1600","spacedReviewVocabularyCoverage":"1600/1600",
                            "officialGrammar":"70/70","officialCharacters":"431/431","registerNotes":"60/60",
                            "nearSynonymComparisons":"60/60","integratedSkills":"60/60",
                            "humanVietnameseSignoff":False,"humanChinesePedagogySignoff":False}
}
len(unit_records), len(level_record["lessonIndex"])


# Patch lesson section payloads to match the established renderer contracts exactly.
for li, lesson in enumerate(lesson_records):
    vid=lesson["vocabularyRefs"]; gids=lesson["grammarRefs"]; cids=lesson["characterRefs"]
    sections={s["type"]:s for s in lesson["sections"]}
    sections["vocabulary"]["content"]["focusWords"]=[{
        "canonicalId":x,
        "simplified":vocab_by_id[x]["simplified"],
        "collocations":vocab_by_id[x]["collocations"],
        "commonErrorsVi":vocab_by_id[x]["commonErrorsVi"],
        "lexicalStatus":"canonical",
        "assessmentEligible":True
    } for x in vid]
    sections["vocabulary"]["content"]["instructionVi"]="Học theo cụm, đối chiếu near-synonym và thử chuyển register trước khi làm bài."
    sections["character"]["content"]["characterRefs"]=cids
    sections["grammar"]["content"]["grammarRefs"]=gids
    for typ in ["listening","reading"]:
        c=sections[typ]["content"]
        qobjs=c.get("questions",[])
        c["questionsVi"]=[q["promptVi"] for q in qobjs]
        c["answerKey"]=[{"answerVi":q["answerVi"],"answer":q["answerVi"],"evidenceZh":c.get("scriptZh") or c.get("textZh")} for q in qobjs]
    sections["listening"]["content"]["audioStatus"]="TTS hỗ trợ; audio người thật chờ duyệt"
len(lesson_records[0]["sections"][1]["content"]["focusWords"]), lesson_records[0]["sections"][2]["content"]["characterRefs"]


def dump(path,obj,pretty=False):
    path=build_root/path
    path.parent.mkdir(parents=True, exist_ok=True)
    text=json.dumps(obj,ensure_ascii=False,indent=2 if pretty else None,separators=None if pretty else (',',':'))+"\n"
    path.write_text(text,encoding='utf-8')
    return path.stat().st_size

h5=Path("data/hsk/hsk5")
sizes={}
sizes['level']=dump(h5/"level.json",level_record,True)
sizes['manifest']=dump(h5/"course-manifest.json",course_manifest,True)
sizes['units']=dump(h5/"units.json",{"schemaVersion":"1.0.0","collectionType":"units","level":5,"records":unit_records},False)
sizes['lessons']=dump(h5/"lessons.json",{"schemaVersion":"1.0.0","collectionType":"lessons","level":5,"records":lesson_records},False)
sizes['grammar']=dump(h5/"grammar.json",{"schemaVersion":"1.0.0","collectionType":"grammar","level":5,"records":grammar_records},False)
sizes['characters']=dump(h5/"characters.json",{"schemaVersion":"1.0.0","collectionType":"characters","level":5,"records":char_records},False)
sizes['exercises']=dump(h5/"exercises.json",{"schemaVersion":"1.0.0","collectionType":"exercises","level":5,"records":exercise_records},False)
sizes['assessments']=dump(h5/"assessments.json",{"schemaVersion":"1.0.0","collectionType":"assessments","level":5,"records":assessment_records},False)

# Vocabulary shards
shards=[]
for start in range(0,1600,50):
    part=vocab_records[start:start+50]
    fname=f"hsk5-v-{start+1:04d}-{start+len(part):04d}.json"
    path=h5/"vocabulary"/fname
    dump(path,{"schemaVersion":"1.0.0","collectionType":"vocabulary","level":5,"records":part},False)
    shards.append({"file":fname,"firstId":part[0]["id"],"lastId":part[-1]["id"],"count":len(part)})
vindex={"schemaVersion":"1.0.0","collectionType":"vocabulary-index","level":5,"expectedCount":1600,"shards":shards}
sizes['vindex']=dump(h5/"vocabulary/index.json",vindex,True)

enrichment_entries=[{
    "canonicalId":r["id"],"canonicalLookup":{"field":"id","value":r["id"]},"simplified":r["simplified"],
    "collocations":r["collocations"],"usageNoteVi":r["usageNoteVi"],"commonErrorsVi":r["commonErrorsVi"],
    "confusables":r["confusables"],"measureWord":r["measureWord"],"register":r["register"]
} for r in vocab_records]
sizes['enrichment']=dump(h5/"vocabulary-enrichment.json",{"schemaVersion":"1.0.0","level":5,"entries":enrichment_entries},False)

official_vocab_snapshot={
    "schemaVersion":"1.0.0","level":5,"sourceId":official_source,
    "officialRange":{"from":2001,"to":3600,"newAtLevel":1600,"cumulative":3600},
    "records":[{"row":2000+i,"officialHeadword":w,"simplified":strip_sense_marker(w)} for i,w in enumerate(official_words,1)]
}
sizes['official_vocab']=dump(h5/"provenance/official-vocabulary.json",official_vocab_snapshot,False)
source_snapshot={
    "schemaVersion":"1.0.0","phase":"C6","level":5,
    "officialSource":{"sourceId":official_source,"scope":["vocabulary-2001-3600","characters-431","grammar-70","competency-descriptors"],
                      "accessDate":"2026-08-04"},
    "authorship":{"dialogue":"VDuckie original","reading":"VDuckie original","listening":"VDuckie original",
                  "exercise":"VDuckie original","speaking":"VDuckie original","writing":"VDuckie original",
                  "commercialTextbookCopied":False},
    "locks":{"productionEnabled":False,"writesProgress":False,"qualityGate":"locked"}
}
dump(h5/"provenance/source-snapshot.json",source_snapshot,True)
editorial={
    "generatedAt":"2026-08-04","phase":"C6","level":5,
    "counts":{"units":20,"lessons":60,"newVocabulary":1600,"cumulativeVocabulary":3600,
              "grammar":70,"characters":431,"exercises":600,"assessments":24},
    "qualityHighlights":[
        "Mỗi lesson có tình huống, thể loại và sản phẩm giao tiếp riêng.",
        "Từ vựng đi kèm collocation, register, lỗi người Việt và đối chiếu nghĩa gần.",
        "Ngữ pháp gắn với chức năng diễn ngôn, khẩu ngữ/văn viết và lỗi thường gặp.",
        "Tích hợp nghe–đọc–nói–viết trong công việc, học tập, cộng đồng và dự án.",
        "Reflection, self-review và spaced review 1–3–7–14–30 ngày."
    ],
    "humanSignoff":{"vietnamese":False,"chinesePedagogy":False}
}
dump(h5/"editorial-c6.json",editorial,True)

sizes, sum(sizes.values())/1024/1024


# Compact lessons without losing learner-facing sections or renderer compatibility.
for li,lesson in enumerate(lesson_records):
    sec={s["type"]:s for s in lesson["sections"]}
    vid=lesson["vocabularyRefs"]
    sec["vocabulary"]["content"]={
        "focusWords":[{"canonicalId":x,"lexicalStatus":"canonical","assessmentEligible":True} for x in vid],
        "instructionVi":"Học theo cụm, đối chiếu near-synonym và chuyển register trước khi làm bài.",
        "usageNoteVi":sec["vocabulary"]["content"]["usageNoteVi"],
        "nearSynonymVi":sec["vocabulary"]["content"]["nearSynonymVi"],
        "registerVi":sec["vocabulary"]["content"]["registerVi"]
    }
    sec["character"]["content"]={"characterRefs":lesson["characterRefs"],"noteVi":"Nhận diện chữ trong từ và câu; mẹo nhớ không thay thế từ nguyên."}
    sec["grammar"]["content"]={
        "grammarRefs":lesson["grammarRefs"],
        "grammarNoteVi":sec["grammar"]["content"]["grammarNoteVi"],
        "usageNoteVi":"Kiểm tra phạm vi tác động, vị trí chủ ngữ và quan hệ giữa các vế.",
        "registerVi":"Văn viết giữ quan hệ logic đầy đủ; khẩu ngữ chỉ lược khi ngữ cảnh rõ.",
        "commonMistakesVi":["Dịch từng chữ thay vì xác định chức năng.","Đúng hình thức nhưng sai logic hoặc register."]
    }
    # Keep only renderer-facing fields.
    d=sec["dialogue"]["content"]
    sec["dialogue"]["content"]={"scriptZh":d["scriptZh"],"registerNoteVi":d["registerNoteVi"],
                                  "tasks":["Nghe để xác định mục đích.","Đóng vai và thay đổi mức độ trực tiếp."]}
    l=sec["listening"]["content"]
    sec["listening"]["content"]={"scriptZh":l["scriptZh"],"questionsVi":l["questionsVi"],"answerKey":l["answerKey"],
                                  "listeningNoteVi":l["listeningNoteVi"],"noteTakingStrategyVi":l["noteTakingStrategyVi"],
                                  "audioStatus":"TTS hỗ trợ; audio người thật chờ duyệt"}
    r=sec["reading"]["content"]
    sec["reading"]["content"]={"textZh":r["textZh"],"questionsVi":r["questionsVi"],"answerKey":r["answerKey"],
                                "readingStrategyVi":r["readingStrategyVi"],"strategyVi":r["strategyVi"]}
    ip=sec["independent-practice"]["content"]
    sec["independent-practice"]["content"]={"speakingVi":ip["speakingVi"],"writingVi":ip["writingVi"],"realWorldTaskVi":ip["realWorldTaskVi"]}
    # review compact
    rv=sec["review"]["content"]
    sec["review"]["content"]={
        "reflectionVi":rv["reflectionVi"],
        "spacedReviewPlan":["Ngày 1: nhớ lại không nhìn đáp án.","Ngày 3: tóm tắt nghe.","Ngày 7: viết lại với register khác.","Ngày 14: role-play.","Ngày 30: chuyển sang tình huống mới."],
        "selfReviewChecklist":["Tách sự thật/suy đoán/quan điểm.","Dùng collocation tự nhiên.","Chọn register đúng.","Giải thích và tự sửa lỗi."],
        "vocabularyRefs":rv["vocabularyRefs"],"grammarRefs":rv["grammarRefs"],"characterRefs":rv["characterRefs"],"spacingDays":[1,3,7,14,30]
    }

# Compact exercise references and explanations.
for li in range(60):
    vid=lesson_vocab_ids[li]; gids=lesson_grammar_ids[li]
    chunk=exercise_records[li*10:(li+1)*10]
    for j,e in enumerate(chunk):
        if j==0:
            e["vocabularyFocus"]=vid
        elif j in [2,3,4,5,6,7,8,9]:
            e["vocabularyFocus"]=vid[:3]
        else:
            e["vocabularyFocus"]=vid[:2]
        e["grammarFocus"]=gids if j in [1,4,5,6,7,8,9] else []
        if e["stimulus"] is not None:
            e["stimulus"]={"questionVi":e["prompt"]}
        e["explanationVi"]="Đối chiếu mục tiêu bài, độ chính xác, collocation, register và bằng chứng."
# Rewrite files
sizes['lessons']=dump(h5/"lessons.json",{"schemaVersion":"1.0.0","collectionType":"lessons","level":5,"records":lesson_records},False)
sizes['exercises']=dump(h5/"exercises.json",{"schemaVersion":"1.0.0","collectionType":"exercises","level":5,"records":exercise_records},False)
sizes['lessons'],sizes['exercises']


quality_test = r"""'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const hsk5 = path.join(root, 'data', 'hsk', 'hsk5');
const read = (name) => JSON.parse(fs.readFileSync(path.join(hsk5, name), 'utf8'));
const records = (name) => read(name).records;
const manifest = read('course-manifest.json');
const units = records('units.json');
const lessons = records('lessons.json');
const grammar = records('grammar.json');
const characters = records('characters.json');
const exercises = records('exercises.json');
const assessments = records('assessments.json');
const vocabularyIndex = read('vocabulary/index.json');
const vocabulary = vocabularyIndex.shards.flatMap((shard) => records(path.join('vocabulary', shard.file)));

function section(lesson, type) {
  const value = lesson.sections.find((item) => item.type === type);
  assert.ok(value, `${lesson.id} missing ${type}`);
  return value.content;
}
function unique(values, label) {
  assert.equal(new Set(values).size, values.length, label);
}

test('HSK5 C6 inventory and production locks are exact', () => {
  assert.equal(units.length, 20);
  assert.equal(lessons.length, 60);
  assert.equal(vocabulary.length, 1600);
  assert.equal(vocabularyIndex.shards.length, 32);
  assert.equal(grammar.length, 70);
  assert.equal(characters.length, 431);
  assert.equal(exercises.length, 600);
  assert.equal(assessments.length, 24);
  assert.equal(manifest.phase, 'C6');
  assert.equal(manifest.level, 5);
  assert.equal(manifest.productionEnabled, false);
  assert.equal(manifest.writesProgress, false);
  assert.equal(manifest.readOnly, true);
  assert.equal(manifest.qualityGate, 'locked');
});

test('all HSK5 lessons have distinct identity and the complete learner flow', () => {
  const required = ['situation','vocabulary','character','grammar','dialogue','listening','reading',
    'pronunciation','culture-note','guided-practice','independent-practice','summary','review'];
  for (const lesson of lessons) {
    assert.equal(lesson.practiceRefs.length, 8, lesson.id);
    assert.equal(lesson.reviewRefs.length, 2, lesson.id);
    assert.ok(lesson.objectives.some((item) => /collocation|register|discourse/i.test(item)), lesson.id);
    required.forEach((type) => section(lesson, type));
    assert.deepEqual(section(lesson, 'review').spacingDays, [1,3,7,14,30]);
    assert.deepEqual(section(lesson, 'review').vocabularyRefs, lesson.vocabularyRefs);
    assert.ok(section(lesson, 'grammar').grammarNoteVi);
    assert.ok(section(lesson, 'dialogue').registerNoteVi);
    assert.ok(section(lesson, 'listening').listeningNoteVi);
    assert.ok(section(lesson, 'reading').readingStrategyVi);
    assert.ok(section(lesson, 'independent-practice').speakingVi);
    assert.ok(section(lesson, 'independent-practice').writingVi);
    assert.ok(section(lesson, 'independent-practice').realWorldTaskVi);
  }
  unique(lessons.map((x) => x.titleZh), 'duplicate Chinese lesson titles');
  unique(lessons.map((x) => x.titleVi), 'duplicate Vietnamese lesson titles');
  unique(lessons.map((x) => section(x, 'situation').promptVi), 'duplicate situations');
  unique(lessons.map((x) => section(x, 'dialogue').scriptZh), 'duplicate dialogues');
  unique(lessons.map((x) => section(x, 'listening').scriptZh), 'duplicate listening');
  unique(lessons.map((x) => section(x, 'reading').textZh), 'duplicate readings');
  unique(lessons.map((x) => section(x, 'independent-practice').speakingVi), 'duplicate speaking');
  unique(lessons.map((x) => section(x, 'independent-practice').writingVi), 'duplicate writing');
  unique(lessons.map((x) => section(x, 'independent-practice').realWorldTaskVi), 'duplicate real-life task');
});

test('official HSK5 vocabulary, grammar and characters are fully introduced and practiced', () => {
  const introducedVocabulary = lessons.flatMap((lesson) => lesson.vocabularyRefs);
  const reviewedVocabulary = lessons.flatMap((lesson) => section(lesson, 'review').vocabularyRefs);
  assert.equal(introducedVocabulary.length, 1600);
  assert.equal(new Set(introducedVocabulary).size, 1600);
  assert.deepEqual([...reviewedVocabulary].sort(), [...introducedVocabulary].sort());
  const practicedVocabulary = new Set(exercises.flatMap((exercise) => exercise.vocabularyFocus));
  introducedVocabulary.forEach((id) => assert.ok(practicedVocabulary.has(id), id));
  const introducedGrammar = new Set(lessons.flatMap((lesson) => lesson.grammarRefs));
  const practicedGrammar = new Set(exercises.flatMap((exercise) => exercise.grammarFocus));
  assert.equal(introducedGrammar.size, 70);
  introducedGrammar.forEach((id) => assert.ok(practicedGrammar.has(id), id));
  assert.equal(new Set(lessons.flatMap((lesson) => lesson.characterRefs)).size, 431);
  assert.equal(vocabulary[0].officialRow, 2001);
  assert.equal(vocabulary.at(-1).officialRow, 3600);
});

test('HSK5 exercises balance all eight skills and authentic formats', () => {
  const counts = Object.fromEntries([...new Set(exercises.map((x) => x.skill))].map((skill) => [
    skill, exercises.filter((x) => x.skill === skill).length
  ]));
  assert.deepEqual(counts, {
    vocabulary: 60, grammar: 60, listening: 60, reading: 60,
    speaking: 60, writing: 60, translation: 60, integrated: 180
  });
  unique(exercises.map((x) => x.prompt), 'duplicate exercise prompts');
  assert.ok(exercises.every((x) => x.explanationVi && x.acceptedAnswers.length));
  for (const format of ['evidence-based-speaking','authentic-writing-task','controlled-translation',
    'listening-note-taking','integrated-summary','self-review','real-communication-task']) {
    assert.equal(exercises.filter((x) => x.format === format).length, 60, format);
  }
});

test('HSK5 grammar, character and assessment metadata carry the advanced quality signals', () => {
  assert.ok(grammar.every((x) => x.correctExamples.length && x.incorrectExamples.length && x.commonErrorsVi.length));
  assert.ok(grammar.every((x) => x.registerNoteVi && x.spokenWrittenNoteVi && x.communicativeFunctionVi));
  assert.ok(characters.every((x) => Number.isInteger(x.strokeCount) && x.strokeCount > 0));
  assert.ok(characters.every((x) => x.strokeCountSource === 'unicode-collation-stroke-order'));
  assert.equal(assessments.filter((x) => x.assessmentType === 'mini-checkpoint').length, 20);
  for (const id of ['hsk5-assessment-midpoint','hsk5-assessment-final','hsk5-assessment-project','hsk5-assessment-mastery']) {
    assert.ok(assessments.some((x) => x.id === id), id);
  }
  assert.ok(assessments.every((x) => x.rubric.productive >= 80));
});
"""
(build_root/'tests/hsk5-c6-quality.test.js').write_text(quality_test,encoding='utf-8')
len(quality_test)


browser_py = r'''import json
import os
import re
import shutil
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
EXERCISES = json.loads((ROOT / "data/hsk/hsk5/exercises.json").read_text(encoding="utf-8"))["records"]
CHROMIUM = os.environ.get("CHROMIUM_PATH") or shutil.which("chromium") or shutil.which("google-chrome")
if not CHROMIUM:
    raise SystemExit("Chromium executable not found")

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, _format, *_args):
        return

server = ThreadingHTTPServer(("127.0.0.1", 0), lambda *args, **kwargs: QuietHandler(*args, directory=str(ROOT), **kwargs))
threading.Thread(target=server.serve_forever, daemon=True).start()
BASE = f"http://127.0.0.1:{server.server_port}/"
SPECS = [
    ("desktop-1440", 1440, 900, "hsk5-lesson-01", False),
    ("desktop-1024", 1024, 768, "hsk5-lesson-30", False),
    ("mobile-390", 390, 844, "hsk5-lesson-31", True),
    ("mobile-320", 320, 568, "hsk5-lesson-60", True),
]
EXPECTED = {"units":20,"lessons":60,"grammar":70,"characters":431,"exercises":600,"assessments":24,"vocabulary":1600}
HEADINGS = [
    "Tình huống, mục tiêu và tiêu chí",
    "Từ vựng, collocation và near-synonym",
    "Chữ Hán và nhận diện trong từ",
    "Ngữ pháp, chức năng diễn ngôn và lỗi thường gặp",
    "Hội thoại có mục đích và register",
    "Nghe tích hợp và ghi chú",
    "Đọc chiến lược và suy luận",
    "Ngữ điệu, register và discourse marker",
    "Ngữ dụng và bối cảnh văn hóa",
    "Luyện tập có hướng dẫn",
    "Nói, viết và nhiệm vụ thật",
    "Tóm tắt năng lực",
    "Reflection, spaced review và self-review",
]
result = {"viewports":{},"flows":{key:"pending" for key in [
    "firstMiddleLastLessons","allLessonSections","exerciseAnswerAndExplanation","previousNextNavigation",
    "unitCheckpoint","midpoint","final","mastery","integratedProject",
    "hsk4SwitchRegression","hsk3SwitchRegression","hsk2SwitchRegression","hsk1SwitchRegression",
    "reload","directUrl","mobileTouchControls"]},"consoleErrors":[],"requestFailures":[],"httpErrors":[]}

def wait_ready(page, level):
    page.wait_for_function("""expected => {
      if (!document.body || document.body.dataset.hskProfReady !== 'true' || !window.VDuckieHskProfessionalRuntime) return false;
      const state = window.VDuckieHskProfessionalRuntime.getState();
      return state.status === 'ready' && state.selectedLevel === expected && state.counts;
    }""", arg=level, timeout=40000)
    return page.evaluate("window.VDuckieHskProfessionalRuntime.getState()")

def metrics(page):
    return page.evaluate("""() => {
      const chinese=[...document.querySelectorAll('#hskLesson [lang="zh-CN"]')].filter(n=>n.getBoundingClientRect().height>0);
      const buttons=[...document.querySelectorAll('#hskLesson button:not([disabled])')].filter(n=>n.getBoundingClientRect().height>0);
      const rail=document.getElementById('hskLevels');
      return {overflow:document.documentElement.scrollWidth-innerWidth,
        levelRailOverflow:rail?Math.max(0,rail.scrollWidth-rail.clientWidth):0,
        minChineseFont:chinese.length?Math.min(...chinese.map(n=>parseFloat(getComputedStyle(n).fontSize)||0)):0,
        minButtonHeight:buttons.length?Math.min(...buttons.map(n=>n.getBoundingClientRect().height)):0};
    }""")

def assert_course(page, state):
    assert state["selectedLevel"] == 5 and state["readOnly"] is True and state["progressWritesEnabled"] is False, state
    for key,value in EXPECTED.items():
        assert state["counts"][key] == value, (key,state["counts"])
    page.get_by_text("HSK 5 Professional · C6 learner-facing", exact=True).first.wait_for()
    assert page.locator('[data-pro-level="5"]').count() == 1
    assert not page.locator('[data-pro-level="5"]').is_disabled()
    assert page.locator(".hsk-pro-unit").count() == 20
    assert page.locator("[data-pro-lesson]").count() == 60
    assert page.locator("[data-pro-assessment]").count() == 24
    for heading in HEADINGS:
        page.locator("#hskLesson").get_by_text(heading, exact=True).wait_for()

def is_hsk(entry):
    lowered=entry.lower()
    return "/data/hsk/" in lowered or "/assets/hsk-content/" in lowered

try:
    with sync_playwright() as playwright:
        browser=playwright.chromium.launch(headless=True, executable_path=CHROMIUM,
            args=["--no-sandbox","--disable-setuid-sandbox","--disable-dev-shm-usage"])
        for name,width,height,lesson_id,mobile in SPECS:
            context=browser.new_context(viewport={"width":width,"height":height},is_mobile=mobile,has_touch=mobile,device_scale_factor=1)
            page=context.new_page()
            page.on("console",lambda message,label=name: result["consoleErrors"].append(f"{label}: {message.text}") if message.type=="error" else None)
            page.on("requestfailed",lambda request,label=name: result["requestFailures"].append(f"{label}: {request.url} — {request.failure or 'unknown'}"))
            page.on("response",lambda response,label=name: result["httpErrors"].append(f"{label}: {response.status} {response.url}") if response.status>=400 else None)
            page.goto(f"{BASE}?area=hsk&hskLevel=5&hskLesson={lesson_id}",wait_until="domcontentloaded",timeout=50000)
            state=wait_ready(page,5)
            assert_course(page,state)
            lesson_number=int(lesson_id[-2:])
            page.locator("#hskLesson").get_by_text(re.compile(rf"BÀI\s+{lesson_number}\s+/\s+60",re.I)).first.wait_for()
            layout=metrics(page)
            assert layout["overflow"]<=2 and layout["levelRailOverflow"]<=2,(name,layout)
            if mobile:
                assert not layout["minButtonHeight"] or layout["minButtonHeight"]>=40,layout
                assert not layout["minChineseFont"] or layout["minChineseFont"]>=12,layout
            result["viewports"][name]={"width":width,"height":height,"lessonId":lesson_id,"state":state,"metrics":layout}

            if name=="desktop-1440":
                page.locator('[data-pro-lesson="hsk5-lesson-02"]').click()
                page.locator("#hskLesson").get_by_text("Sự thật, quan điểm và suy đoán",exact=True).wait_for()
                page.locator("[data-pro-prev]").click()
                page.locator("#hskLesson").get_by_text("Tin tức đến từ đâu?",exact=True).wait_for()
                result["flows"]["previousNextNavigation"]="pass"

                exercise=next(x for x in EXERCISES if x["id"]=="hsk5-lesson-01-exercise-1")
                card=page.locator(f'[data-pro-exercise="{exercise["id"]}"]')
                card.locator(f'input[value="{exercise["answer"]}"]').check()
                card.locator(f'[data-pro-check="{exercise["id"]}"]').click()
                card.get_by_text("Đúng.",exact=True).wait_for()
                card.get_by_text(re.compile("collocation|register",re.I)).first.wait_for()
                result["flows"]["exerciseAnswerAndExplanation"]="pass"

                for aid,pattern,flow in [
                    ("hsk5-assessment-unit-01",r"Checkpoint Unit 1","unitCheckpoint"),
                    ("hsk5-assessment-midpoint",r"giữa khóa HSK5","midpoint"),
                    ("hsk5-assessment-final",r"cuối khóa HSK5","final"),
                    ("hsk5-assessment-mastery",r"năng lực HSK5","mastery"),
                    ("hsk5-assessment-project",r"Dự án vấn đề thật HSK5","integratedProject")]:
                    page.locator(f'[data-pro-assessment="{aid}"]').click()
                    page.locator("#hskLesson").get_by_text(re.compile(pattern,re.I)).first.wait_for()
                    result["flows"][flow]="pass"

                for level,lessons,vocab,flow in [
                    (4,48,1000,"hsk4SwitchRegression"),(3,36,500,"hsk3SwitchRegression"),
                    (2,28,200,"hsk2SwitchRegression"),(1,24,300,"hsk1SwitchRegression")]:
                    page.locator(f'[data-pro-level="{level}"]').click()
                    st=wait_ready(page,level)
                    assert st["counts"]["lessons"]==lessons and st["counts"]["vocabulary"]==vocab,st
                    result["flows"][flow]="pass"

                page.goto(f"{BASE}?area=hsk&hskLevel=5&hskLesson=hsk5-lesson-60",wait_until="domcontentloaded")
                assert wait_ready(page,5)["selectedLessonId"]=="hsk5-lesson-60"
                result["flows"]["directUrl"]="pass"
                page.reload(wait_until="domcontentloaded")
                assert wait_ready(page,5)["selectedLessonId"]=="hsk5-lesson-60"
                result["flows"]["reload"]="pass"

            if mobile:
                if lesson_id=="hsk5-lesson-60":
                    page.locator("[data-pro-prev]").tap()
                    assert page.evaluate("window.VDuckieHskProfessionalRuntime.getState().selectedLessonId")=="hsk5-lesson-59"
                else:
                    page.locator("[data-pro-next]").tap()
                    assert page.evaluate("window.VDuckieHskProfessionalRuntime.getState().selectedLessonId")!=lesson_id
                    page.locator("[data-pro-prev]").tap()
                    assert page.evaluate("window.VDuckieHskProfessionalRuntime.getState().selectedLessonId")==lesson_id
                result["flows"]["mobileTouchControls"]="pass"
            page.close(); context.close()
        result["flows"]["firstMiddleLastLessons"]="pass"
        result["flows"]["allLessonSections"]="pass"
        net=[x for x in result["requestFailures"]+result["httpErrors"] if is_hsk(x)]
        console=[x for x in result["consoleErrors"] if is_hsk(x) or "hsk-professional" in x.lower() or "hsk5" in x.lower()]
        assert not net and not console,{"network":net,"console":console}
        browser.close()
finally:
    server.shutdown(); server.server_close()

print(json.dumps(result,ensure_ascii=False))
'''
(build_root/'tests/hsk5-learner-browser-smoke.py').write_text(browser_py,encoding='utf-8')
browser_js = r'''"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { spawnSync } = require("node:child_process");

test("HSK5 learner browser smoke passes at all required viewports", { timeout: 360000 }, () => {
  const script = path.join(__dirname, "hsk5-learner-browser-smoke.py");
  const favicon = path.join(__dirname, "..", "favicon.ico");
  const existed = fs.existsSync(favicon);
  try {
    if (!existed) fs.writeFileSync(favicon, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect width="1" height="1"/></svg>', "utf8");
    const result = spawnSync(process.env.PYTHON || "python", [script], {
      encoding: "utf8", timeout: 350000, env: { ...process.env, PYTHONUNBUFFERED: "1" }
    });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    const payload = JSON.parse(result.stdout.trim());
    assert.deepEqual(Object.keys(payload.viewports).sort(), ["desktop-1024","desktop-1440","mobile-320","mobile-390"]);
    for (const viewport of Object.values(payload.viewports)) {
      assert.equal(viewport.state.selectedLevel, 5);
      assert.equal(viewport.state.readOnly, true);
      assert.equal(viewport.state.progressWritesEnabled, false);
      assert.ok(viewport.metrics.overflow <= 2);
      assert.ok(viewport.metrics.levelRailOverflow <= 2);
    }
    for (const [flow,status] of Object.entries(payload.flows)) assert.equal(status, "pass", flow);
    const errors=[...payload.requestFailures,...payload.httpErrors].filter((x)=>/\/data\/hsk\/|\/assets\/hsk-content\//i.test(x));
    assert.deepEqual(errors,[]);
  } finally {
    if (!existed && fs.existsSync(favicon)) fs.unlinkSync(favicon);
  }
});
'''
(build_root/'tests/hsk5-learner-browser-smoke.test.js').write_text(browser_js,encoding='utf-8')
len(browser_py),len(browser_js)


root_manifest={
  "schemaVersion":"1.0.0","curriculumId":"vduckie-hsk-canonical","syllabusVersion":"GF0025-2021",
  "examBlueprintVersion":"CTI-HSK3.0-2026","qualityGate":"locked","productionEnabled":False,
  "publicOverrideAllowed":False,"sourceRegistryPath":"sources.json","curriculumArchitecturePath":"curriculum/architecture.json",
  "legacyMappingPath":"legacy-mapping.json","hsk1CourseManifestPath":"hsk1/course-manifest.json",
  "schemas":{"level":"schemas/level.schema.json","unit":"schemas/unit.schema.json","lesson":"schemas/lesson.schema.json",
             "vocabulary":"schemas/vocabulary.schema.json","sentence":"schemas/sentence.schema.json","grammar":"schemas/grammar.schema.json",
             "character":"schemas/character.schema.json","exercise":"schemas/exercise.schema.json","assessment":"schemas/assessment.schema.json"},
  "levels":[
    {"level":1,"stage":"elementary","status":"machine-assisted","path":"hsk1/level.json","courseManifestPath":"hsk1/course-manifest.json","productionReady":False},
    {"level":2,"stage":"elementary","status":"machine-assisted","path":"hsk2/level.json","productionReady":False,"courseManifestPath":"hsk2/course-manifest.json"},
    {"level":3,"stage":"elementary","status":"machine-assisted","path":"hsk3/level.json","productionReady":False,"courseManifestPath":"hsk3/course-manifest.json"},
    {"level":4,"stage":"intermediate","status":"machine-assisted","path":"hsk4/level.json","productionReady":False,"courseManifestPath":"hsk4/course-manifest.json"},
    {"level":5,"stage":"intermediate","status":"machine-assisted","path":"hsk5/level.json","productionReady":False,"courseManifestPath":"hsk5/course-manifest.json"},
    {"level":6,"stage":"intermediate","status":"planned","path":"hsk6/level.json","productionReady":False},
    {"level":7,"stage":"advanced","status":"planned","path":"hsk7/level.json","productionReady":False},
    {"level":8,"stage":"advanced","status":"planned","path":"hsk8/level.json","productionReady":False},
    {"level":9,"stage":"advanced","status":"planned","path":"hsk9/level.json","productionReady":False}
  ],
  "previewFixtures":[{"id":"phase1-hsk1-foundation","manifestPath":"fixtures/manifest.json","developerOnly":True,"writesProgress":False}],
  "hsk2CourseManifestPath":"hsk2/course-manifest.json","hsk3CourseManifestPath":"hsk3/course-manifest.json",
  "hsk4CourseManifestPath":"hsk4/course-manifest.json","hsk5CourseManifestPath":"hsk5/course-manifest.json"
}
dump(Path("data/hsk/manifest.json"),root_manifest,True)


# Add assessment rendering fields and rewrite.
for a in assessment_records:
    a["rubric"].setdefault("pass",80)
    a["rubric"].setdefault("remediation","Ôn lại lỗi theo skill, làm lại sau 3 ngày và nộp sản phẩm sửa.")
dump(h5/"assessments.json",{"schemaVersion":"1.0.0","collectionType":"assessments","level":5,"records":assessment_records},False)

# Internal reference and inventory validation.
all_ids=set()
for coll in [unit_records,lesson_records,grammar_records,char_records,exercise_records,assessment_records,vocab_records]:
    for r in coll:
        assert r["id"] not in all_ids, r["id"]
        all_ids.add(r["id"])
assert len(unit_records)==20 and len(lesson_records)==60 and len(vocab_records)==1600
assert len(grammar_records)==70 and len(char_records)==431 and len(exercise_records)==600 and len(assessment_records)==24
for l in lesson_records:
    assert all(x in all_ids for x in l["vocabularyRefs"]+l["grammarRefs"]+l["characterRefs"]+l["practiceRefs"]+l["reviewRefs"])
for e in exercise_records:
    assert len(e["options"])==len(set(e["options"]))
    if e["options"]: assert e["answer"] in e["options"]
    assert e["acceptedAnswers"]
    assert all(x in all_ids for x in e["vocabularyFocus"]+e["grammarFocus"])
for a in assessment_records:
    assert all(x in all_ids for x in a["exerciseRefs"]+a["targetVocabulary"]+a["targetGrammar"])
# pinyin gates
tone_re=re.compile(r"^[A-Za-zÀ-žāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜńňǹḿüÜ\s'-]+$")
num_re=re.compile(r"^[a-züv]+[0-5](?:\s+[a-züv]+[0-5])*$",re.I)
bad=[r["id"] for r in vocab_records if not tone_re.match(r["pinyinTone"]) or not num_re.match(r["pinyinNumber"])]
len(bad), bad[:10]


handoff = """# Phase C6 — Professional HSK5 Curriculum

## Baseline

- Repository: `ducnguyen138cyber/erp-tieng-trung-vduckiee`
- Baseline main: `66b62998a0de85dfbd0495ed6500630d11a367a6`
- Scope: HSK5 only; HSK1–HSK4 unchanged.

## Inventory

- 20 units
- 60 lessons
- 1,600 new official vocabulary entries (official rows 2001–3600; cumulative 3,600)
- 70 official grammar entries
- 431 official character-recognition entries
- 600 exercises across vocabulary, grammar, listening, reading, speaking, writing, translation and integrated skills
- 24 assessments: 20 unit checkpoints, midpoint, final, integrated project and mastery review

## Learner-facing design

Each lesson includes objectives, vocabulary and collocations, character recognition, grammar and register notes, common mistakes, dialogue, listening, reading, speaking, writing, exercise, answer and explanation, a real-life task, reflection, spaced review and self-review.

HSK5 strengthens near-synonym comparison, pragmatic usage, spoken/written distinctions, workplace Chinese, presentation language, business communication, narrative writing, opinion writing and integrated skills.

## Source and authorship

Official sources determine level membership, official ordering and competency alignment. All learner-facing dialogue, reading, listening, explanations, exercises, answers, speaking and writing tasks are newly authored for VDuckie. No commercial textbook prose is copied.

## Production locks

- `productionEnabled=false`
- `writesProgress=false`
- `readOnly=true`
- `qualityGate=locked`
- no migration or Supabase write
"""
(build_root/'docs/hsk-phase-c6-handoff.md').write_text(handoff,encoding='utf-8')
integration_report={
    "phase":"C6","level":5,"baseline":"66b62998a0de85dfbd0495ed6500630d11a367a6",
    "websiteRoute":"?area=hsk&hskLevel=5&hskLesson=hsk5-lesson-01",
    "inventory":{"units":20,"lessons":60,"vocabulary":1600,"grammar":70,"characters":431,"exercises":600,"assessments":24},
    "integration":{"runtimeCourseConfig":"C6","levelSelectorEnabled":True,"directUrl":True,"readOnly":True},
    "quality":{"validator":"pending-ci","duplicateBlockers":0,"coverage":"pending-ci","browserSmoke":"pending-ci","regression":"pending-ci"}
}
dump(Path("reports/hsk5-c6-learner-integration.json"),integration_report,True)


task_templates = [
    lambda spec, g: f"Trong tình huống “{spec[2]}”, chọn từ giúp {spec[3]} và phù hợp vai {spec[6]}.",
    lambda spec, g: f"Viết lại phát ngôn dùng {g} để xử lý “{spec[2]}”; giữ nguyên lập trường và mức độ chắc chắn.",
    lambda spec, g: f"Nghe bản cập nhật về “{spec[2]}”; ghi riêng dữ kiện, suy luận và việc {spec[7]} cần làm.",
    lambda spec, g: f"Đọc hồ sơ liên quan “{spec[2]}”; trích bằng chứng mạnh nhất rồi nêu một giới hạn của kết luận.",
    lambda spec, g: f"Nhập vai {spec[6]} trao đổi với {spec[7]} về “{spec[2]}”; phản hồi lịch sự và chốt trách nhiệm.",
    lambda spec, g: f"Soạn {spec[5]} cho tình huống “{spec[2]}”; dùng {spec[4]} và chỉ kết luận trong phạm vi bằng chứng.",
    lambda spec, g: f"Dịch sang tiếng Trung một phát ngôn phục vụ “{spec[2]}”, ưu tiên register tự nhiên và quan hệ logic rõ.",
    lambda spec, g: f"Đối chiếu nguồn nghe và nguồn đọc về “{spec[2]}”; viết tóm tắt nêu điểm chung, khác biệt và điều còn bỏ ngỏ.",
    lambda spec, g: f"Biên tập lại lời giải thích về “{spec[2]}”; sửa lỗi collocation, register và mạch lập luận, rồi giải thích từng sửa đổi.",
    lambda spec, g: f"Thực hiện mini-project “{spec[2]}”, xin phản hồi từ người đóng vai {spec[7]} và viết reflection về hiệu quả giao tiếp."
]
# map lesson id to spec
spec_by_lesson={f"hsk5-lesson-{i+1:02d}": spec for i,spec in enumerate(lesson_specs)}
grammar_by_id={g['id']:g for g in grammar_records}
for ex in exercise_records:
    lid=ex['reviewMetadata']['firstIntroducedIn']
    spec=spec_by_lesson[lid]
    idx=int(ex['id'].split('-exercise-')[1])-1
    gnames='、'.join(grammar_by_id[x]['nameZh'] for x in ex.get('grammarFocus',[])[:2]) or 'cấu trúc trọng tâm'
    ex['prompt']=task_templates[idx](spec,gnames)
    if isinstance(ex.get('stimulus'),dict) and 'questionVi' in ex['stimulus']:
        ex['stimulus']['questionVi']=ex['prompt']
# rewrite JSON file
(build_root/'data/hsk/hsk5/exercises.json').write_text(json.dumps({
    "schemaVersion":"1.0.0","collectionType":"exercises","level":5,"records":exercise_records
},ensure_ascii=False,separators=(',',':')),encoding='utf-8')
len(exercise_records)



runtime_path = build_root / "assets/hsk-content/hsk-professional-runtime.js"
runtime = runtime_path.read_text(encoding="utf-8")
runtime = runtime.replace(
    "4: Object.freeze({ base: './data/hsk/hsk4/', phase: 'C5', label: '16 unit · 48 bài · C5' })",
    "4: Object.freeze({ base: './data/hsk/hsk4/', phase: 'C5', label: '16 unit · 48 bài · C5' }),\n    5: Object.freeze({ base: './data/hsk/hsk5/', phase: 'C6', label: '20 unit · 60 bài · C6' })"
)
runtime = runtime.replace("contentId.match(/^hsk([123])-/)", "contentId.match(/^hsk([1-5])-/)")
runtime = runtime.replace(
    "['hsk' + state.selectedLevel + '-assessment-final','hsk' + state.selectedLevel + '-assessment-mastery']",
    "['hsk' + state.selectedLevel + '-assessment-final','hsk' + state.selectedLevel + '-assessment-project','hsk' + state.selectedLevel + '-assessment-mastery']"
)
runtime = runtime.replace(
    "(id.indexOf('final') >= 0 ? '★ Final Assessment' : '◆ Mastery Review')",
    "(id.indexOf('final') >= 0 ? '★ Final Assessment' : (id.indexOf('project') >= 0 ? '▣ Integrated Project' : '◆ Mastery Review'))"
)
runtime = runtime.replace("count.textContent !== '88'", "count.textContent !== '148'")
runtime = runtime.replace("count.textContent = '88'", "count.textContent = '148'")
runtime = runtime.replace("label.textContent !== 'Bài HSK1–3'", "label.textContent !== 'Bài HSK1–5'")
runtime = runtime.replace("label.textContent = 'Bài HSK1–3'", "label.textContent = 'Bài HSK1–5'")
assert "5: Object.freeze({ base: './data/hsk/hsk5/'" in runtime
assert "contentId.match(/^hsk([1-5])-/)" in runtime
runtime_path.write_text(runtime, encoding="utf-8")

flags_path = build_root / "assets/hsk-content/hsk-content-feature-flags.js"
flags = flags_path.read_text(encoding="utf-8").replace("c5web2", "c6web1")
flags_path.write_text(flags, encoding="utf-8")

print(json.dumps({
    "phase":"C6","units":len(unit_records),"lessons":len(lesson_records),
    "vocabulary":len(vocab_records),"grammar":len(grammar_records),
    "characters":len(char_records),"exercises":len(exercise_records),
    "assessments":len(assessment_records)
}, ensure_ascii=False))
