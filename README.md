# 食光外卖 · 小程序化外卖信息管理系统

一套本地可运行的外卖平台信息管理系统：**管理后台 + 手机点餐端（H5）+ 微信小程序源码 + 一套 MySQL 数据与一套后端接口**。

后端直接复用 GitHub 黑马程序员「苍穹外卖」sky-take-out（Spring Boot + MyBatis + MySQL + Redis），不另起表结构；管理后台与点餐端都是本项目新写的，接的是同一套接口。

---

## 一、跑起来（三步）

1. 双击 `启动服务.ps1`（或在 PowerShell 里执行 `powershell -File E:\foodxg\启动服务.ps1`）
2. 浏览器打开 <http://127.0.0.1:8080/>
3. 管理后台用 `admin / 123456` 登录

| 入口 | 地址 | 说明 |
| --- | --- | --- |
| 统一入口 | http://127.0.0.1:8080/ | 三张卡片分别进后台 / 点餐 / 接口文档 |
| 管理后台 | http://127.0.0.1:8080/admin-ui/index.html | admin / 123456 |
| 手机点餐（H5） | http://127.0.0.1:8080/h5/ | 免微信登录，自动 dev 登录 |
| 接口文档 | http://127.0.0.1:8080/doc.html | knife4j，管理端 / 用户端两组 |

停止：执行 `停止服务.ps1`。

---

## 二、组成与端口

| 组件 | 位置 / 端口 | 说明 |
| --- | --- | --- |
| 后端 jar | 8080 | `sky-take-out\sky-take-out\sky-server\target\sky-server-1.0-SNAPSHOT.jar`，静态托管 `webapp` 目录 |
| MySQL | 3307（root/123456） | 独立实例，数据目录 `E:\develop\mysql-data-foodxg`，库 `sky_take_out` |
| Redis | 6379 | 店铺营业状态等缓存 |
| 管理后台源码 | `admin-web/` | Vue3 + Element Plus + Vite，构建产物复制到 `webapp/admin` |
| H5 点餐源码 | `h5-mall/` | Vue3 + Vant4 + Vite，构建产物复制到 `webapp/h5` |
| 微信小程序源码 | `wx-mall/` | 原生小程序，用微信开发者工具导入 |
| 静态站点 | `webapp/` | `index.html` + `admin/` + `h5/`，由后端 8080 直接托管 |

改前端后：进对应目录 `npm run build`，把 `dist\*` 复制进 `webapp\{admin,h5}`，**不用重启 jar**。

---

## 三、功能清单

### 管理后台（8 个页面）
- 登录 / 工作台：今日营业额、有效订单、完成率、客单价、订单概览、商品概览（全部实时查 MySQL）
- 订单管理：全部 / 待接单 / 已接单 / 派送中 / 已完成 / 已取消；按订单号、手机号、时间区间查询；接单、拒单、派送、完成、取消、订单详情
- 菜品管理：分页、起售/停售、改价改图、新增、删除、按分类筛选
- 套餐管理、分类管理、员工管理、店铺设置（营业中/打烊）

### 手机点餐（H5 + 小程序同构）
- 左侧分类栏 + 右侧菜品/套餐列表，加减购物车，底部实时结算条
- 购物车：增减、清空
- 确认订单：收货地址（自动建档并设默认）、商品清单、备注、模拟支付
- 我的订单：历史订单、状态流转、详情、取消

### 订单状态机（后端真实字段 `orders.status`）
`1 待付款 → 2 待接单 → 3 已接单 → 4 派送中 → 5 已完成`，`6 已取消`；`pay_status` 0 未付 / 1 已付 / 2 退款。

---

## 四、关键约定（改代码前必看）

- **令牌头名不一样**：管理端是 `token`，用户端是 `authentication`。前端漏发会 401。
- **本地免微信登录**：`POST /user/user/login` 的 `code` 以 `dev_` 开头时，后端直接按 `dev_` 之后的串造 openid，返回可用 token。H5 用 `dev_h5_local`，小程序用 `dev_wx_xxx`（每次随机，会建新用户）。
- **下单必填字段**（`OrdersSubmitDTO`）：`addressBookId`、`amount`、`payMethod=1`、`remark`、`deliveryStatus=1`、`tablewareNumber`、`tablewareStatus`、`packAmount`、`estimatedDeliveryTime`。
  `estimatedDeliveryTime` 是 `LocalDateTime`，格式必须是 **`yyyy-MM-dd HH:mm:ss`（用空格，不能用 T）**，否则 400 JSON 解析失败。
- 后端为了让本地前后端分离能跑，改过 4 个 Java 文件：两个 JWT 拦截器放行 `OPTIONS`、`WebMvcConfiguration` 加 CORS + 静态资源映射 + 首页 forward + `InternalResourceViewResolver`、`UserServiceImpl.getOpenid` 加 dev 分支。

---

## 五、微信小程序怎么用

1. 打开微信开发者工具 → 导入项目 → 目录选仓库里的 `wx-mall/`
2. AppID 选「测试号」（工程里填的是 `touristappid`）
3. 详情 → 本地设置 → 勾选 **「不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书」**
4. 编译后即可点餐下单；接口地址写死在 `utils/request.js` 的 `BASE = 'http://127.0.0.1:8080'`

页面：`pages/menu`（点餐）、`pages/cart`（购物车）、`pages/checkout`（确认订单）、`pages/orders`（我的订单）。
本机当前没有安装微信开发者工具，所以小程序源码已写好并通过语法/JSON 校验，但没有在工具里跑过界面；H5 端与小程序端走的是同一批接口，接口链路已在浏览器里全流程验证。

---

## 六、已验证的闭环（2026-11-26）

1. 后端启动、`/doc.html` 可访问，管理端登录成功
2. H5 加载分类 9 个、菜品/套餐正常展示，加购 3 件合计 ¥255.00
3. 结算页自动建地址并设默认 → 提交订单 → 模拟支付 → 订单号 `1795687620017`，`pay_status=1`、`status=2`
4. 管理端订单列表出现该单 → 接单（status=3）→ 派送（4）→ 完成（5）
5. 工作台实时刷新为：营业额 ¥255.00、有效订单 1、完成率 100%、客单价 ¥255.00

---

## 七、常见问题

- **8080 被占用 / 重新打包失败（Unable to rename ...jar）**：先 `停止服务.ps1`，再打包。
- **依赖下载慢**：Maven 已配华为镜像，离线构建用 `mvn -o -q -DskipTests package`；前端用 npm（本项目 pnpm 会拦 esbuild 构建脚本）。
- **图片是空白/色块**：库里的菜品图片是课程示例的 OSS 地址，本地取不到，前端已降级为「菜名首字」色块，不影响下单。
- **端口说明**：3306 上是原来的 MySQL95，本项目没动它，本项目专用 3307。

---

## 八、来源与致谢

本仓库是「课程作业 / 个人学习」性质的项目，由两部分构成：

**1. 后端基础（非原创）**
- 后端 `sky-take-out/` 源自 **黑马程序员《苍穹外卖》** 课程项目（Java 课程教学案例）。
- 本地取用的这份代码快照来自 GitHub 仓库：<https://github.com/tuanzi1234/sky-take-out>。
- 版权归原作者 / 黑马程序员所有。本仓库 **未对后端做功能性重写**：只在 4 个文件上做了本地运行适配——两个 JWT 拦截器放行 `OPTIONS`、`WebMvcConfiguration` 增加 CORS 与静态资源映射、`UserServiceImpl.getOpenid` 增加本地 dev 登录分支。
- 感谢黑马程序员提供的完整课程与示例代码，本项目的接口契约、数据库表结构、订单状态机都建立在其之上。

**2. 本项目新增（原创部分）**
- `admin-web/`：Vue3 + Element Plus 管理后台（登录、工作台、订单、菜品、套餐、分类、员工、店铺设置共 8 页）
- `h5-mall/`：Vue3 + Vant4 手机点餐端（分类点菜、购物车、结算、订单）
- `wx-mall/`：微信小程序原生工程（点餐、购物车、确认订单、我的订单）
- `webapp/index.html`：统一入口页
- `README.md`、启动 / 停止脚本、本地环境适配补丁

---

## 九、授权与使用范围

- **后端 `sky-take-out/`**：遵循原课程 / 原作者的权利要求，**仅限学习、教学演示与研究用途**，请勿用于商业经营。如需商用，请自行取得原作者授权或替换为自研后端。
- **本项目新增的前端与脚本**：可自由用于学习、毕设与二次开发；转载或再发布时请保留本节「来源与致谢」。
- 仓库内 `application-dev.yml`、`application.yml` 中的数据库口令、JWT 密钥、阿里云 / 微信参数均为 **本地演示占位值**，不构成任何真实凭证，请勿在生产环境复用；上线前须替换为自有配置并移出仓库。
- 数据库示例数据（菜品、套餐、分类）来自课程资料，仅作演示。

