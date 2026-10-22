/* ============================================================
   api.js · 异步服务桩层（签名即未来真实 API，内部返回 mock）
   后续对接时仅替换函数体为真实 fetch，请求/响应形状保持不变
   ============================================================ */
(function (global) {
  'use strict';

  function delay(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function readSession() {
    try {
      var raw = localStorage.getItem(DB.SESSION_KEY);
      if (!raw) return null;
      var s = JSON.parse(raw);
      if (!s || !s.username || Date.now() >= s.expiresAt) return null;
      return s;
    } catch (e) { return null; }
  }

  function writeSession(account) {
    var session = {
      username: account.username,
      name: account.name,
      role: account.role,
      perms: account.perms,
      token: 'mock-token-' + Math.random().toString(36).slice(2, 10),
      expiresAt: Date.now() + DB.SESSION_TTL_MS
    };
    localStorage.setItem(DB.SESSION_KEY, JSON.stringify(session));
    return session;
  }

  function clearSession() { localStorage.removeItem(DB.SESSION_KEY); }

  function findAccount(username) {
    for (var i = 0; i < DB.accounts.length; i++) {
      if (DB.accounts[i].username === username) return DB.accounts[i];
    }
    return null;
  }

  function findOrg(id) {
    for (var i = 0; i < DB.orgs.length; i++) {
      if (DB.orgs[i].id === id) return DB.orgs[i];
    }
    return null;
  }

  function findStudent(id) {
    for (var i = 0; i < DB.students.length; i++) {
      if (DB.students[i].id === id) return DB.students[i];
    }
    return null;
  }

  function findOrder(id) {
    for (var i = 0; i < DB.orders.length; i++) {
      if (DB.orders[i].id === id) return DB.orders[i];
    }
    return null;
  }

  // 当前时间（审核历史记录用），格式与种子数据一致：YYYY-MM-DD HH:mm:ss
  function pad2(n) { return n < 10 ? '0' + n : '' + n; }
  function fmtNow() {
    var d = new Date();
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate())
      + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds());
  }

  // 身份证号基础格式 + 校验位（GB 11643-1999）
  var ID_WEIGHTS = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  var ID_CHECK = '10X98765432';
  function idcardValid(n) {
    if (!/^\d{17}[\dX]$/.test(n)) return false;
    var y = parseInt(n.slice(6, 10), 10), m = parseInt(n.slice(10, 12), 10), d = parseInt(n.slice(12, 14), 10);
    if (y < 1900 || y > 2026 || m < 1 || m > 12 || d < 1 || d > 31) return false;
    var sum = 0;
    for (var i = 0; i < 17; i++) sum += parseInt(n.charAt(i), 10) * ID_WEIGHTS[i];
    return ID_CHECK[sum % 11] === n.charAt(17).toUpperCase();
  }

  // 唯一性校验：同一字段不允许被其他学员占用
  function studentFieldTaken(id, field, value) {
    for (var i = 0; i < DB.students.length; i++) {
      var s = DB.students[i];
      if (s.id !== id && s[field] && s[field] === value) return true;
    }
    return false;
  }

  // 列表项瘦身：手机号脱敏（敏感信息列表默认脱敏，详情按权限返回完整信息）
  function toListItem(o) {
    return {
      id: o.id, name: o.name, contactName: o.contactName,
      contactPhone: DB.maskPhone(o.contactPhone),
      creditCode: o.creditCode, status: o.status,
      submittedAt: o.submittedAt, platform: o.platform
    };
  }

  // 订单列表项：展示订单编号/班级名称/学员人数/订单总金额/购买机构/审核状态（PRD 4.5.1）
  function toOrderListItem(o) {
    return {
      id: o.id, klassName: o.klassName, studentCount: o.studentCount,
      totalAmount: o.totalAmount, orgName: o.orgName, status: o.status,
      paymentType: o.paymentType, paidAmount: o.paidAmount, rejectReason: o.rejectReason,
      createdAt: o.createdAt
    };
  }

  var API = {
    /** 读取当前有效会话（页面守卫用） */
    getSession: function () {
      // GET /api/auth/session → { code, data: Session | null }
      return Promise.resolve(readSession());
    },

    /**
     * 登录
     * POST /api/auth/login
     * req: { username, password, captcha }  res: { code, message?, data?: Session }
     * code 0 = 成功；40101 = 统一失败提示（不区分账号/密码/验证码错误，避免暴露账号是否存在）
     */
    login: function (_ref) {
      var username = _ref.username, password = _ref.password, captcha = _ref.captcha;
      return delay(650).then(function () {
        var account = findAccount(username);
        var captchaOk = captcha && captcha.toUpperCase() === DB.captchaCode.toUpperCase();
        if (!account || account.password !== password || !captchaOk) {
          return { code: 40101, message: '账号、密码或验证码错误' };
        }
        return { code: 0, data: writeSession(account) };
      });
    },

    /**
     * 修改当前登录账号密码
     * POST /api/auth/change-password
     * req: { username, oldPassword, newPassword }  res: { code, message? }
     * 成功后服务端使该账号既有会话失效，前端需清除本地会话并引导重新登录
     */
    changePassword: function (_ref2) {
      var username = _ref2.username, oldPassword = _ref2.oldPassword, newPassword = _ref2.newPassword;
      return delay(700).then(function () {
        var account = findAccount(username);
        if (!account || account.password !== oldPassword) {
          return { code: 40201, message: '原密码不正确' };
        }
        account.password = newPassword; // mock：直接更新演示账号密码
        DB.save();
        return { code: 0 };
      });
    },

    /** 退出登录 · POST /api/auth/logout → { code } */
    logout: function () {
      return delay(320).then(function () {
        clearSession();
        return { code: 0 };
      });
    },

    /* ==================== 机构管理 ==================== */

    /**
     * 机构列表（分页）
     * GET /api/orgs?tab=pending|all&keyword=&page=1&pageSize=6
     * res: { code, message?, data?: { list, total, hasMore, counts: { pending, all } } }
     * code 50001 = 网络异常（演示加载失败与重试入口）
     * 待审核 tab 仅返回待审核；全部 tab 支持机构名称关键词筛选；均按提交时间倒序
     */
    fetchOrgs: function (_ref3) {
      var tab = _ref3.tab || 'pending';
      var keyword = (_ref3.keyword || '').trim();
      var page = _ref3.page || 1;
      var pageSize = _ref3.pageSize || 6;
      return delay(480).then(function () {
        if (Math.random() < 0.12) return { code: 50001, message: '网络异常，加载失败' };
        var list = DB.orgs.filter(function (o) {
          if (tab === 'pending' && o.status !== 'pending') return false;
          if (keyword && o.name.indexOf(keyword) === -1) return false;
          return true;
        });
        list = list.slice().sort(function (a, b) { return b.submittedAt.localeCompare(a.submittedAt); });
        var start = (page - 1) * pageSize;
        var slice = list.slice(start, start + pageSize).map(toListItem);
        return {
          code: 0,
          data: {
            list: slice,
            total: list.length,
            hasMore: start + pageSize < list.length,
            counts: {
              pending: DB.orgs.filter(function (o) { return o.status === 'pending'; }).length,
              all: DB.orgs.length
            }
          }
        };
      });
    },

    /**
     * 机构详情（完整信息，联系人手机号不脱敏）
     * GET /api/orgs/:id → { code, message?, data?: OrgDetail }
     */
    fetchOrgDetail: function (id) {
      return delay(420).then(function () {
        var o = findOrg(id);
        if (!o) return { code: 40401, message: '机构不存在或已被删除' };
        return { code: 0, data: o };
      });
    },

    /**
     * 统一社会信用代码扫描件加载
     * GET /api/orgs/:id/scan → { code, message?, data?: Scan }
     * code 50002 = 扫描件加载失败（演示"提示重新加载"）
     */
    fetchOrgScan: function (id) {
      return delay(620).then(function () {
        var o = findOrg(id);
        if (!o) return { code: 40401, message: '机构不存在' };
        if (Math.random() < 0.12) return { code: 50002, message: '扫描件加载失败' };
        return {
          code: 0,
          data: {
            id: o.id, name: o.name, creditCode: o.creditCode, address: o.address,
            contactName: o.contactName, foundedAt: o.foundedAt,
            issuer: o.platform === 'hunan' ? '长沙市市场监督管理局' : o.address.slice(0, 2) + '市市场监督管理局',
            issuedAt: o.foundedAt
          }
        };
      });
    },

    /**
     * 审核通过（仅待审核状态可提交；通过后机构获得登录资格）
     * POST /api/orgs/:id/approve  req: {}  res: { code, message? }
     */
    approveOrg: function (id) {
      return delay(700).then(function () {
        var o = findOrg(id);
        if (!o) return { code: 40401, message: '机构不存在' };
        if (o.status !== 'pending') return { code: 40301, message: '仅待审核状态可提交审核' };
        o.status = 'approved';
        o.rejectReason = '';
        DB.save();
        return { code: 0 };
      });
    },

    /**
     * 审核不通过（原因必填 1~200 字）
     * POST /api/orgs/:id/reject  req: { reason }  res: { code, message? }
     */
    rejectOrg: function (id, reason) {
      return delay(700).then(function () {
        var o = findOrg(id);
        if (!o) return { code: 40401, message: '机构不存在' };
        if (o.status !== 'pending') return { code: 40301, message: '仅待审核状态可提交审核' };
        var r = (reason || '').trim();
        if (!r) return { code: 40202, message: '不通过原因不能为空' };
        if (r.length > 200) return { code: 40203, message: '不通过原因不能超过 200 字' };
        o.status = 'rejected';
        o.rejectReason = r;
        DB.save();
        return { code: 0 };
      });
    },

    /* ==================== 班级信息管理 ==================== */

    /**
     * 班级列表（按机构名称或班级名称关键词模糊查询，分页）
     * GET /api/klasses?keyword=&page=1&pageSize=6
     * req: keyword 必填，机构名称或班级名称任一模糊命中即返回（为空返回 40204，与前端"不发起查询"约束一致）
     * res: { code, message?, data?: { list, total, hasMore } }
     * 排序：班级结束时间倒序，结束时间为空的记录置于列表末尾
     */
    fetchKlasses: function (_ref4) {
      var keyword = (_ref4.keyword || '').trim();
      var page = _ref4.page || 1;
      var pageSize = _ref4.pageSize || 6;
      return delay(480).then(function () {
        if (!keyword) return { code: 40204, message: '请先输入机构或班级名称关键词' };
        if (Math.random() < 0.12) return { code: 50001, message: '网络异常，加载失败' };
        var orgNames = {};
        DB.orgs.forEach(function (o) { orgNames[o.id] = o.name; });
        // 机构名称或班级名称任一模糊命中即视为匹配
        var list = DB.klasses.filter(function (k) {
          var orgName = orgNames[k.orgId] || '';
          return orgName.indexOf(keyword) !== -1 || k.name.indexOf(keyword) !== -1;
        }).map(function (k) {
          return {
            id: k.id, orgId: k.orgId, orgName: orgNames[k.orgId], name: k.name,
            hours: k.hours, startTime: k.startTime, endTime: k.endTime
          };
        });
        // 结束时间倒序，空值置于末尾
        list.sort(function (a, b) {
          if (!a.endTime && !b.endTime) return 0;
          if (!a.endTime) return 1;
          if (!b.endTime) return -1;
          return b.endTime.localeCompare(a.endTime);
        });
        var start = (page - 1) * pageSize;
        return {
          code: 0,
          data: {
            list: list.slice(start, start + pageSize),
            total: list.length,
            hasMore: start + pageSize < list.length
          }
        };
      });
    },

    /**
     * 调整班级班期时间（保存即提交，无需二次确认；前端须防重复提交）
     * POST /api/klasses/:id/update-time
     * req: { startTime, endTime } 均必填，格式 yyyy-mm-dd hh:mm:ss，开始不得晚于结束
     * res: { code, message? }  40205 = 校验失败（格式/必填/先后关系）
     */
    updateKlassTime: function (id, _ref5) {
      var startTime = _ref5.startTime, endTime = _ref5.endTime;
      return delay(700).then(function () {
        var k = null;
        for (var i = 0; i < DB.klasses.length; i++) {
          if (DB.klasses[i].id === id) { k = DB.klasses[i]; break; }
        }
        if (!k) return { code: 40402, message: '班级不存在' };
        var fmt = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
        if (!startTime || !endTime) return { code: 40205, message: '开始时间与结束时间均为必填' };
        if (!fmt.test(startTime) || !fmt.test(endTime)) return { code: 40205, message: '时间格式须为 yyyy-mm-dd hh:mm:ss' };
        var s = new Date(startTime.replace(' ', 'T')).getTime();
        var e = new Date(endTime.replace(' ', 'T')).getTime();
        if (isNaN(s) || isNaN(e)) return { code: 40205, message: '时间格式非法' };
        if (s > e) return { code: 40205, message: '开始时间不得晚于结束时间' };
        k.startTime = startTime;
        k.endTime = endTime;
        DB.save();
        return { code: 0 };
      });
    },

    /* ==================== 应急处理（学员资料维护与密码重置） ==================== */

    /**
     * 学员检索（姓名 / 身份证号 / 手机号，至少一项，支持组合条件）
     * GET /api/students/search
     * req: { name?, idcard?, phone? } 均选填，模糊包含匹配，条件之间为 AND
     * res: { code, message?, data?: { list, total } }
     *   list 项为 { id, name, idcard, phone }（应急处理场景明文返回，卡片直接展示）
     *   40206 = 未提供任何查询条件；50001 = 网络异常（演示重试）
     */
    searchStudents: function (_ref6) {
      var name = (_ref6.name || '').trim();
      var idcard = (_ref6.idcard || '').trim().toUpperCase();
      var phone = (_ref6.phone || '').trim();
      return delay(460).then(function () {
        if (!name && !idcard && !phone) return { code: 40206, message: '请至少填写一个查询条件' };
        if (Math.random() < 0.12) return { code: 50001, message: '网络异常，加载失败' };
        var list = DB.students.filter(function (s) {
          if (name && s.name.indexOf(name) === -1) return false;
          if (idcard && s.idcard.toUpperCase().indexOf(idcard) === -1) return false;
          if (phone && s.phone.indexOf(phone) === -1) return false;
          return true;
        }).map(function (s) {
          return { id: s.id, name: s.name, idcard: s.idcard, phone: s.phone };
        });
        return { code: 0, data: { list: list, total: list.length } };
      });
    },

    /**
     * 学员详情（完整敏感信息，仅应急处理菜单权限可调用）
     * GET /api/students/:id
     * res: { code, message?, data?: { id, name, idcard, phone, photo } }
     *   40403 = 学员不存在；50001 = 网络异常（演示重试）
     */
    getStudent: function (id) {
      return delay(420).then(function () {
        if (Math.random() < 0.12) return { code: 50001, message: '网络异常，加载失败' };
        var s = findStudent(id);
        if (!s) return { code: 40403, message: '学员不存在或已被删除' };
        return { code: 0, data: { id: s.id, name: s.name, idcard: s.idcard, phone: s.phone, photo: s.photo } };
      });
    },

    /**
     * 修改学员姓名（高风险操作，前端须二次确认）
     * POST /api/students/:id/update-name
     * req: { name } 非空；长度与字符规则沿用后台主系统（2-20 位中文 / 字母 / 间隔号）
     * res: { code, message? }  40207 = 校验失败
     */
    updateStudentName: function (id, _ref7) {
      var name = (_ref7.name || '').trim();
      return delay(640).then(function () {
        var s = findStudent(id);
        if (!s) return { code: 40403, message: '学员不存在或已被删除' };
        if (!/^[\u4e00-\u9fa5A-Za-z·]{2,20}$/.test(name)) return { code: 40207, message: '姓名须为 2-20 位中文、字母或间隔号' };
        s.name = name;
        DB.save();
        return { code: 0 };
      });
    },

    /**
     * 修改学员手机号（高风险操作，前端须二次确认）
     * POST /api/students/:id/update-phone
     * req: { phone } 中国大陆 11 位基础格式，且系统内唯一
     * res: { code, message? }  40208 = 格式或唯一性校验失败
     */
    updateStudentPhone: function (id, _ref8) {
      var phone = (_ref8.phone || '').trim();
      return delay(640).then(function () {
        var s = findStudent(id);
        if (!s) return { code: 40403, message: '学员不存在或已被删除' };
        if (!/^1[3-9]\d{9}$/.test(phone)) return { code: 40208, message: '手机号须为中国大陆 11 位号码' };
        if (studentFieldTaken(id, 'phone', phone)) return { code: 40208, message: '该手机号已被其他学员绑定，请核对后重试' };
        s.phone = phone;
        DB.save();
        return { code: 0 };
      });
    },

    /**
     * 修改学员身份证号（高风险操作，前端须二次确认）
     * POST /api/students/:id/update-idcard
     * req: { idcard } 18 位基础格式 + 校验位，且系统内唯一
     * res: { code, message? }  40209 = 格式、校验位或唯一性校验失败
     */
    updateStudentIdcard: function (id, _ref9) {
      var idcard = (_ref9.idcard || '').trim().toUpperCase();
      return delay(640).then(function () {
        var s = findStudent(id);
        if (!s) return { code: 40403, message: '学员不存在或已被删除' };
        if (!idcardValid(idcard)) return { code: 40209, message: '身份证号格式或校验位不正确' };
        if (studentFieldTaken(id, 'idcard', idcard)) return { code: 40209, message: '该身份证号已被其他学员占用，请核对后重试' };
        s.idcard = idcard;
        DB.save();
        return { code: 0 };
      });
    },

    /**
     * 删除学员实名认证照片（高风险操作，前端须二次确认；删除后不可恢复、不可重新上传）
     * DELETE /api/students/:id/photo
     * res: { code, message? }  40404 = 照片不存在
     */
    deleteStudentPhoto: function (id) {
      return delay(560).then(function () {
        var s = findStudent(id);
        if (!s) return { code: 40403, message: '学员不存在或已被删除' };
        if (!s.photo) return { code: 40404, message: '实名认证照片不存在' };
        s.photo = false;
        DB.save();
        return { code: 0 };
      });
    },

    /**
     * 重置学员密码（高风险操作，前端须二次确认；重置为当前手机号后六位）
     * POST /api/students/:id/reset-password
     * res: { code, message?, data?: { password } }
     *   40210 = 手机号为空或不足六位，无法重置
     */
    resetStudentPassword: function (id) {
      return delay(680).then(function () {
        var s = findStudent(id);
        if (!s) return { code: 40403, message: '学员不存在或已被删除' };
        if (!s.phone || s.phone.replace(/\D/g, '').length < 6) return { code: 40210, message: '该学员手机号为空或不足六位，无法重置密码' };
        var pwd = s.phone.slice(-6);
        return { code: 0, data: { password: pwd } };
      });
    },

    /* ==================== 视频课订单管理 ==================== */

    /**
     * 订单列表（分页）
     * GET /api/orders?tab=pending|all&page=1&pageSize=6
     * res: { code, message?, data?: { list, total, hasMore, counts: { pending, all } } }
     * 待审核 tab 仅返回待审核订单；全部 tab 返回全部订单（含审核状态/付款方式/审核结果）；
     * 均按订单创建时间倒序；code 50001 = 网络异常（演示加载失败与重试入口）
     */
    fetchOrders: function (_ref) {
      var tab = _ref.tab || 'pending';
      var page = _ref.page || 1;
      var pageSize = _ref.pageSize || 6;
      return delay(480).then(function () {
        if (Math.random() < 0.12) return { code: 50001, message: '网络异常，加载失败' };
        var list = DB.orders.filter(function (o) {
          return tab === 'pending' ? o.status === 'pending' : true;
        });
        list = list.slice().sort(function (a, b) { return b.createdAt.localeCompare(a.createdAt); });
        var start = (page - 1) * pageSize;
        var slice = list.slice(start, start + pageSize).map(toOrderListItem);
        return {
          code: 0,
          data: {
            list: slice,
            total: list.length,
            hasMore: start + pageSize < list.length,
            counts: {
              pending: DB.orders.filter(function (o) { return o.status === 'pending'; }).length,
              all: DB.orders.length
            }
          }
        };
      });
    },

    /**
     * 订单详情（完整信息，含审核历史，按审核时间倒序）
     * GET /api/orders/:id → { code, message?, data?: OrderDetail }
     */
    fetchOrderDetail: function (id) {
      return delay(420).then(function () {
        var o = findOrder(id);
        if (!o) return { code: 40405, message: '订单不存在或已被删除' };
        var data = JSON.parse(JSON.stringify(o)); // 深拷贝，避免页面直接改到数据源
        data.history = data.history.slice().sort(function (a, b) { return b.at.localeCompare(a.at); });
        return { code: 0, data: data };
      });
    },

    /**
     * 审核通过（仅待审核订单可提交；通过即开通订单内学员账号学习权限，付款方式仅作信息留存，不触发支付）
     * POST /api/orders/:id/approve
     * req: { paymentType: '先付费'|'后付费', paidAmount?: number }  res: { code, message? }
     * 先付费：不要求录入已付金额，已付金额展示规则由后端订单数据决定（mock 记为订单总额）
     * 后付费：必须录入已付金额，允许为 0，非负且最多两位小数，允许超过订单总金额
     */
    approveOrder: function (id, paymentType, paidAmount) {
      return delay(700).then(function () {
        var o = findOrder(id);
        if (!o) return { code: 40405, message: '订单不存在' };
        if (o.status !== 'pending') return { code: 40304, message: '仅待审核订单可提交审核' };
        if (paymentType !== '先付费' && paymentType !== '后付费') return { code: 40211, message: '请选择付款方式' };
        var amount = null;
        if (paymentType === '后付费') {
          var raw = String(paidAmount === undefined || paidAmount === null ? '' : paidAmount).trim();
          if (!raw) return { code: 40212, message: '后付费订单须录入已付金额' };
          if (!/^\d+(\.\d{1,2})?$/.test(raw)) return { code: 40213, message: '已付金额须为非负数字且最多两位小数' };
          amount = parseFloat(raw);
        } else {
          amount = o.totalAmount; // 先付费：已付金额按后端订单数据规则留存
        }
        o.status = 'approved';
        o.paymentType = paymentType;
        o.paidAmount = amount;
        o.rejectReason = '';
        o.history.push({ at: fmtNow(), result: '审核通过', paymentType: paymentType, paidAmount: amount, rejectReason: '' });
        DB.save();
        return { code: 0 };
      });
    },

    /**
     * 审核不通过（仅待审核订单可提交；不通过原因选填，填写限 1~200 字）
     * POST /api/orders/:id/reject  req: { reason? }  res: { code, message? }
     * 发起方在原后台修改班级信息后可重新提交订单，H5 端不提供申诉或人工修正入口
     */
    rejectOrder: function (id, reason) {
      return delay(700).then(function () {
        var o = findOrder(id);
        if (!o) return { code: 40405, message: '订单不存在' };
        if (o.status !== 'pending') return { code: 40304, message: '仅待审核订单可提交审核' };
        var r = (reason || '').trim();
        if (r.length > 200) return { code: 40214, message: '不通过原因不能超过 200 字' };
        o.status = 'rejected';
        o.paymentType = '';
        o.paidAmount = null;
        o.rejectReason = r;
        o.history.push({ at: fmtNow(), result: '审核不通过', paymentType: '', paidAmount: null, rejectReason: r });
        DB.save();
        return { code: 0 };
      });
    },

    clearSession: clearSession
  };

  global.API = API;
})(window);
