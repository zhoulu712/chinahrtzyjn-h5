/* ============================================================
   mock.js · 唯一数据源（演示账号 / 模块权限 / 机构数据 / 验证码）
   机构与账号数据经 localStorage 持久化：审核结果跨页面保持一致
   ============================================================ */
(function (global) {
  'use strict';

  // v4：机构种子新增管理员密码字段，旧版持久化数据自动重置播种
  var STORE_KEY = 'eduops.mockdb.v4';

  function seedData() {
    var data = {
      // 演示账号：admin = 全部 4 个模块权限；demo = 无任何模块权限（演示空状态）
      // 真实环境中账号、密码与菜单权限均来自后台管理系统，此处仅作前端演示
      accounts: [
        { username: 'admin', password: 'Admin@2026', name: '周雯', role: '运营管理员', perms: ['org', 'klass', 'emergency', 'order'] },
        { username: 'demo', password: 'Demo@2026', name: '林晓', role: '审核员', perms: [] }
      ],
      // 机构数据：status 待审核/已通过/不通过；platform hunan=湖南平台（不通过后可再次提交）
      orgs: [
        // —— 待审核（按提交时间倒序）——
        { id: 'ORG-2601', name: '长沙启航教育培训学校有限公司', adminAccount: 'qihang_edu', contactName: '罗志强', contactPhone: '13873164852', creditCode: '91430105MA4L7Q3X8B', status: 'pending', platform: 'hunan', submittedAt: '2026-10-21 09:42:17', address: '湖南省长沙市岳麓区麓谷大道658号', foundedAt: '2019-03-18', rejectReason: '' },
        { id: 'ORG-2602', name: '武汉光谷精英学堂培训学校有限公司', adminAccount: 'whjy_admin', contactName: '陈思远', contactPhone: '15927358461', creditCode: '91420100MA4K9T2M6C', status: 'pending', platform: 'other', submittedAt: '2026-10-20 16:08:44', address: '湖北省武汉市洪山区光谷大道77号', foundedAt: '2018-06-25', rejectReason: '' },
        { id: 'ORG-2603', name: '成都锦程职业技能培训学校', adminAccount: 'cdjc_ops', contactName: '周建国', contactPhone: '13666194730', creditCode: '91510107MA6C3N8Y2D', status: 'pending', platform: 'other', submittedAt: '2026-10-20 10:25:36', address: '四川省成都市武侯区天府三街99号', foundedAt: '2017-11-08', rejectReason: '' },
        { id: 'ORG-2604', name: '杭州西子乐学教育咨询有限公司', adminAccount: 'hxzx_admin', contactName: '沈雨薇', contactPhone: '18768124593', creditCode: '91330106MA2H8P4Q1E', status: 'pending', platform: 'other', submittedAt: '2026-10-19 15:52:09', address: '浙江省杭州市西湖区文三路478号华星世纪大厦', foundedAt: '2020-04-13', rejectReason: '' },
        { id: 'ORG-2605', name: '长沙岳麓新星艺术培训中心', adminAccount: 'xxys_school', contactName: '刘倩', contactPhone: '13508472916', creditCode: '91430104MA4M2R6W9F', status: 'pending', platform: 'hunan', submittedAt: '2026-10-19 09:15:28', address: '湖南省长沙市岳麓区金星中路388号', foundedAt: '2021-09-01', rejectReason: '' },
        { id: 'ORG-2606', name: '南京金陵树人教育培训有限公司', adminAccount: 'njsr_edu', contactName: '赵明轩', contactPhone: '13951876240', creditCode: '91320102MA1W6K3J7G', status: 'pending', platform: 'other', submittedAt: '2026-10-18 17:36:51', address: '江苏省南京市秦淮区中山东路300号', foundedAt: '2016-05-20', rejectReason: '' },
        { id: 'ORG-2607', name: '广州羊城编程少年培训基地', adminAccount: 'gzbc_kids', contactName: '孙浩然', contactPhone: '13602489571', creditCode: '91440104MA9D5F8S3H', status: 'pending', platform: 'other', submittedAt: '2026-10-18 08:47:02', address: '广东省广州市海珠区新港中路397号', foundedAt: '2022-03-15', rejectReason: '' },
        // —— 已通过（仅可查看）——
        { id: 'ORG-2501', name: '北京海淀启文教育科技有限公司', adminAccount: 'qw_edu_bj', contactName: '王丽娟', contactPhone: '13811254967', creditCode: '91110108MA01Y8T4X2', status: 'approved', platform: 'other', submittedAt: '2026-10-12 11:20:35', address: '北京市海淀区中关村大街27号', foundedAt: '2015-08-10', rejectReason: '' },
        { id: 'ORG-2502', name: '上海浦东卓越外语培训学校', adminAccount: 'zywy_sh', contactName: '徐文博', contactPhone: '15821369740', creditCode: '91310115MA1K4B9N6P', status: 'approved', platform: 'other', submittedAt: '2026-10-09 14:05:22', address: '上海市浦东新区张江路665号', foundedAt: '2014-12-02', rejectReason: '' },
        { id: 'ORG-2503', name: '深圳南山创新思维培训中心', adminAccount: 'cxsw_sz', contactName: '郑晓岚', contactPhone: '13715128460', creditCode: '91440305MA5F7Q2R8T', status: 'approved', platform: 'other', submittedAt: '2026-09-28 10:41:19', address: '广东省深圳市南山区科技园南区', foundedAt: '2019-07-22', rejectReason: '' },
        { id: 'ORG-2504', name: '重庆山城育才教育培训学校', adminAccount: 'cycq_edu', contactName: '何俊杰', contactPhone: '13637958412', creditCode: '91500105MA5U3W6K4V', status: 'approved', platform: 'other', submittedAt: '2026-09-15 16:29:47', address: '重庆市渝中区民生路318号', foundedAt: '2018-10-16', rejectReason: '' },
        { id: 'ORG-2505', name: '苏州园林书院国学培训中心', adminAccount: 'ylsy_sz', contactName: '顾云帆', contactPhone: '13914087536', creditCode: '91320594MA1XC8L2W3', status: 'approved', platform: 'other', submittedAt: '2026-09-03 09:58:12', address: '江苏省苏州市工业园区星湖街328号', foundedAt: '2017-04-27', rejectReason: '' },
        // —— 不通过（湖南平台可再次提交，其他平台不支持）——
        { id: 'ORG-2401', name: '长沙天心博雅书法培训学校', adminAccount: 'bysf_cs', contactName: '黄立诚', contactPhone: '13787215904', creditCode: '91430103MA4N6D1B5J', status: 'rejected', platform: 'hunan', submittedAt: '2026-10-15 13:44:58', address: '湖南省长沙市天心区芙蓉中路二段198号', foundedAt: '2020-08-19', rejectReason: '统一社会信用代码扫描件模糊，无法核验证照信息，请重新上传清晰的扫描件后再提交审核。' },
        { id: 'ORG-2402', name: '西安古都学府文化培训有限公司', adminAccount: 'gdxh_xa', contactName: '马腾宇', contactPhone: '13488291756', creditCode: '91610103MA7P2H9C4K', status: 'rejected', platform: 'other', submittedAt: '2026-09-22 11:17:33', address: '陕西省西安市碑林区南二环西段69号', foundedAt: '2016-11-30', rejectReason: '机构名称与统一社会信用代码登记信息不一致，审核不通过。' },
        { id: 'ORG-2403', name: '长沙雨花知行研学教育咨询有限公司', adminAccount: 'zxyj_cs', contactName: '唐雨欣', contactPhone: '13548629173', creditCode: '91430111MA4Q8F5E7L', status: 'rejected', platform: 'hunan', submittedAt: '2026-08-30 15:03:26', address: '湖南省长沙市雨花区韶山中路489号', foundedAt: '2023-02-14', rejectReason: '联系人手机号无法接通，预留联系方式无效，请确认后再提交。' }
      ],
      // 班级数据：orgId 关联 DB.orgs；endTime 为空表示班期结束时间未设置（列表排序置于末尾）
      klasses: [
        { id: 'KL-2601', orgId: 'ORG-2601', name: '启航2026春季雅思冲刺班', hours: 60, startTime: '2026-03-02 08:00:00', endTime: '2026-06-15 18:00:00' },
        { id: 'KL-2602', orgId: 'ORG-2601', name: '启航少儿编程基础班（周末）', hours: 32, startTime: '2026-04-11 09:00:00', endTime: '2026-08-22 16:30:00' },
        { id: 'KL-2603', orgId: 'ORG-2602', name: '光谷精英高三全日制班', hours: 120, startTime: '2026-02-23 07:40:00', endTime: '2026-06-05 17:30:00' },
        { id: 'KL-2604', orgId: 'ORG-2602', name: '光谷初中数学培优班', hours: 45, startTime: '2026-03-07 14:00:00', endTime: '2026-07-04 12:00:00' },
        { id: 'KL-2605', orgId: 'ORG-2603', name: '锦程电工取证培训班', hours: 24, startTime: '2026-05-12 09:00:00', endTime: '2026-05-30 17:00:00' },
        { id: 'KL-2606', orgId: 'ORG-2604', name: '西子日语N3直通班', hours: 48, startTime: '2026-04-06 18:30:00', endTime: '2026-09-12 20:30:00' },
        { id: 'KL-2607', orgId: 'ORG-2604', name: '西子乐学硬笔书法体验班', hours: 12, startTime: '2026-06-06 10:00:00', endTime: null },
        { id: 'KL-2608', orgId: 'ORG-2605', name: '新星少儿美术启蒙班', hours: 16, startTime: '2026-03-14 09:30:00', endTime: '2026-06-27 11:30:00' },
        { id: 'KL-2609', orgId: 'ORG-2501', name: '启文高一物理竞赛班', hours: 40, startTime: '2026-02-28 08:30:00', endTime: '2026-05-23 16:00:00' },
        { id: 'KL-2610', orgId: 'ORG-2501', name: '启文中考全科冲刺班', hours: 90, startTime: '2026-03-16 07:50:00', endTime: '2026-06-18 17:20:00' },
        { id: 'KL-2611', orgId: 'ORG-2502', name: '卓越商务英语BEC中级班', hours: 36, startTime: '2026-04-20 19:00:00', endTime: '2026-08-08 21:00:00' },
        { id: 'KL-2612', orgId: 'ORG-2502', name: '卓越青少年口语外教班', hours: 20, startTime: '2026-05-09 13:30:00', endTime: null },
        { id: 'KL-2613', orgId: 'ORG-2503', name: '创新思维机器人搭建班', hours: 28, startTime: '2026-03-21 09:00:00', endTime: '2026-07-11 11:00:00' },
        { id: 'KL-2614', orgId: 'ORG-2503', name: '创新少儿Python启蒙班', hours: 24, startTime: '2026-04-18 14:00:00', endTime: '2026-08-01 16:00:00' },
        { id: 'KL-2615', orgId: 'ORG-2401', name: '博雅成人书法研习班', hours: 18, startTime: '2026-03-08 14:30:00', endTime: '2026-06-20 17:00:00' },
        { id: 'KL-2616', orgId: 'ORG-2505', name: '园林书院国学诵读班', hours: 30, startTime: '2026-02-07 09:00:00', endTime: '2026-05-30 11:30:00' }
      ],
      // 学员数据：应急处理模块用；idcard 均为校验位合法的演示号码且系统内唯一，phone 系统内唯一
      // 姓名与手机号为学员必然存在的字段；苏晚晴 photo=false（演示"暂无实名认证照片"）
      students: [
        { id: 'STU-3001', name: '李嘉禾', idcard: '110101200503120113', phone: '13802451976', photo: true },
        { id: 'STU-3002', name: '李嘉禾', idcard: '440304200611280225', phone: '15910472830', photo: true },
        { id: 'STU-3003', name: '王梓萌', idcard: '430102200408250332', phone: '13787240651', photo: true },
        { id: 'STU-3004', name: '陈奕辰', idcard: '31010120050719044X', phone: '18817302954', photo: true },
        { id: 'STU-3005', name: '苏晚晴', idcard: '320102200601090558', phone: '13584217906', photo: false },
        { id: 'STU-3006', name: '赵子墨', idcard: '440305200406320669', phone: '13691847502', photo: true },
        { id: 'STU-3007', name: '林诗涵', idcard: '33010620051123077X', phone: '15868104379', photo: true },
        { id: 'STU-3008', name: '周敬之', idcard: '50010320040315088X', phone: '13983647251', photo: true },
        { id: 'STU-3009', name: '郑安琪', idcard: '320105200509270993', phone: '13776501284', photo: true },
        { id: 'STU-3010', name: '何博文', idcard: '110105200412301029', phone: '18612843950', photo: true },
        { id: 'STU-3011', name: '罗天佑', idcard: '500105200504111137', phone: '13752960483', photo: true },
        { id: 'STU-3012', name: '孙一鸣', idcard: '330102200602191248', phone: '13858197402', photo: true }
      ],
      // 视频课订单数据：klassId/orgId 关联种子班级与机构；status 待审核/已通过/不通过
      // paymentType 先付费/后付费（仅审核通过后产生）；已付金额：先付费按后端规则记为订单总额，后付费为审核录入值
      // history 为订单审核历史（含提交订单记录），按时间倒序展示，重新提交订单时新增记录不覆盖
      orders: [
        // —— 待审核（按订单创建时间倒序）——
        { id: 'VD-20261021-0008', klassId: 'KL-2608', klassName: '新星少儿美术启蒙班', studentCount: 18, totalAmount: 4320, orgId: 'ORG-2605', orgName: '长沙岳麓新星艺术培训中心', status: 'pending', paymentType: '', paidAmount: null, rejectReason: '', createdAt: '2026-10-21 16:20:35', history: [ { at: '2026-10-21 16:20:35', result: '提交订单', paymentType: '', paidAmount: null, rejectReason: '' } ] },
        { id: 'VD-20261021-0007', klassId: 'KL-2606', klassName: '西子日语N3直通班', studentCount: 26, totalAmount: 12480, orgId: 'ORG-2604', orgName: '杭州西子乐学教育咨询有限公司', status: 'pending', paymentType: '', paidAmount: null, rejectReason: '', createdAt: '2026-10-21 10:05:12', history: [ { at: '2026-10-21 10:05:12', result: '提交订单', paymentType: '', paidAmount: null, rejectReason: '' } ] },
        { id: 'VD-20261020-0006', klassId: 'KL-2602', klassName: '启航少儿编程基础班（周末）', studentCount: 22, totalAmount: 8800, orgId: 'ORG-2601', orgName: '长沙启航教育培训学校有限公司', status: 'pending', paymentType: '', paidAmount: null, rejectReason: '', createdAt: '2026-10-20 17:42:56', history: [ { at: '2026-10-20 17:42:56', result: '提交订单', paymentType: '', paidAmount: null, rejectReason: '' } ] },
        { id: 'VD-20261020-0005', klassId: 'KL-2603', klassName: '光谷精英高三全日制班', studentCount: 35, totalAmount: 52500, orgId: 'ORG-2602', orgName: '武汉光谷精英学堂培训学校有限公司', status: 'pending', paymentType: '', paidAmount: null, rejectReason: '', createdAt: '2026-10-20 09:31:24', history: [ { at: '2026-10-20 09:31:24', result: '提交订单', paymentType: '', paidAmount: null, rejectReason: '' } ] },
        { id: 'VD-20261019-0004', klassId: 'KL-2605', klassName: '锦程电工取证培训班', studentCount: 30, totalAmount: 7200, orgId: 'ORG-2603', orgName: '成都锦程职业技能培训学校', status: 'pending', paymentType: '', paidAmount: null, rejectReason: '', createdAt: '2026-10-19 14:18:47', history: [ { at: '2026-10-19 14:18:47', result: '提交订单', paymentType: '', paidAmount: null, rejectReason: '' } ] },
        // —— 已通过（只读：先付费已付金额按后端规则记为订单总额；后付费为审核录入值）——
        { id: 'VD-20261018-0003', klassId: 'KL-2610', klassName: '启文中考全科冲刺班', studentCount: 28, totalAmount: 36400, orgId: 'ORG-2501', orgName: '北京海淀启文教育科技有限公司', status: 'approved', paymentType: '后付费', paidAmount: 36400, rejectReason: '', createdAt: '2026-10-18 11:26:09', history: [ { at: '2026-10-18 15:40:22', result: '审核通过', paymentType: '后付费', paidAmount: 36400, rejectReason: '' }, { at: '2026-10-18 11:26:09', result: '提交订单', paymentType: '', paidAmount: null, rejectReason: '' } ] },
        { id: 'VD-20261017-0002', klassId: 'KL-2611', klassName: '卓越商务英语BEC中级班', studentCount: 16, totalAmount: 9600, orgId: 'ORG-2502', orgName: '上海浦东卓越外语培训学校', status: 'approved', paymentType: '先付费', paidAmount: 9600, rejectReason: '', createdAt: '2026-10-17 08:55:31', history: [ { at: '2026-10-17 10:12:45', result: '审核通过', paymentType: '先付费', paidAmount: 9600, rejectReason: '' }, { at: '2026-10-17 08:55:31', result: '提交订单', paymentType: '', paidAmount: null, rejectReason: '' } ] },
        // —— 不通过（发起方在原后台修改班级信息后重新提交，H5 端无申诉入口）——
        { id: 'VD-20261016-0001', klassId: 'KL-2613', klassName: '创新思维机器人搭建班', studentCount: 20, totalAmount: 5600, orgId: 'ORG-2503', orgName: '深圳南山创新思维培训中心', status: 'rejected', paymentType: '', paidAmount: null, rejectReason: '订单学员人数与班级报名名单不一致，请核对后重新提交。', createdAt: '2026-10-16 16:48:20', history: [ { at: '2026-10-16 17:30:08', result: '审核不通过', paymentType: '', paidAmount: null, rejectReason: '订单学员人数与班级报名名单不一致，请核对后重新提交。' }, { at: '2026-10-16 16:48:20', result: '提交订单', paymentType: '', paidAmount: null, rejectReason: '' } ] }
      ]
    };
    // 机构管理员初始登录密码：演示数据统一为 Org@2026，详情页明文展示
    data.orgs.forEach(function (o) { o.adminPassword = 'Org@2026'; });
    return data;
  }

  function loadPersisted() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return null;
      var d = JSON.parse(raw);
      // klasses / students 允许缺省（旧版本持久化数据自动合并种子数据）
      if (d && d.accounts && d.orgs) return d;
    } catch (e) { /* 忽略损坏数据，重新播种 */ }
    return null;
  }

  var persisted = loadPersisted();
  var seeded = seedData();

  var DB = {
    // 会话存储键与有效期（模拟与 PC 后台一致的会话策略）
    SESSION_KEY: 'eduops.session',
    EXPIRED_FLAG: 'eduops.expired',
    SESSION_TTL_MS: 30 * 60 * 1000,

    accounts: persisted ? persisted.accounts : seeded.accounts,
    orgs: persisted ? persisted.orgs : seeded.orgs,
    klasses: persisted && persisted.klasses ? persisted.klasses : seeded.klasses,
    students: persisted && persisted.students ? persisted.students : seeded.students,
    orders: persisted && persisted.orders ? persisted.orders : seeded.orders,

    // 首页业务入口（与后台菜单权限一一对应）
    modules: [
      { key: 'org', label: '机构管理', desc: '机构审核与证照查看', icon: 'building-2' },
      { key: 'klass', label: '班级信息管理', desc: '班级查询与班期时间调整', icon: 'graduation-cap' },
      { key: 'emergency', label: '应急处理', desc: '学员资料维护与密码重置', icon: 'siren' },
      { key: 'order', label: '视频课订单管理', desc: '订单审核与付款方式留存', icon: 'monitor-play' }
    ],

    // 审核等变更操作后调用，保证跨页面数据一致
    save: function () {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify({ accounts: this.accounts, orgs: this.orgs, klasses: this.klasses, students: this.students, orders: this.orders }));
      } catch (e) { /* 存储不可用时静默降级为内存态 */ }
    },

    // 重置演示数据（登录页提供入口）
    resetMock: function () {
      try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    },

    // 手机号脱敏（机构列表展示用，详情页按权限返回完整信息）
    maskPhone: function (p) {
      return p && p.length >= 7 ? p.slice(0, 3) + '****' + p.slice(-4) : p || '';
    },

    // 金额统一格式化：货币单位 + 两位小数（订单列表/详情展示用）
    formatAmount: function (n) {
      if (n === null || n === undefined || n === '') return '—';
      return '¥' + Number(n).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },

    // 当前图形验证码（大小写不敏感比对）与过期时间戳
    captchaCode: '',
    captchaExpiresAt: 0,

    // 生成 4 位图形验证码并绘制到 canvas（去除易混淆字符 0O1lI）
    genCaptcha: function (canvas) {
      var chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
      var code = '';
      for (var i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
      this.captchaCode = code;
      this.captchaExpiresAt = Date.now() + 60 * 1000;

      var ctx = canvas.getContext('2d');
      var w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#EEF2FB';
      ctx.fillRect(0, 0, w, h);

      for (var l = 0; l < 4; l++) {
        ctx.strokeStyle = 'rgba(29,79,215,' + (0.12 + Math.random() * 0.14).toFixed(2) + ')';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(Math.random() * w, Math.random() * h);
        ctx.lineTo(Math.random() * w, Math.random() * h);
        ctx.stroke();
      }

      var colors = ['#1D4FD7', '#163FA8', '#0E9F6E', '#B4540A'];
      for (var c = 0; c < 4; c++) {
        ctx.save();
        ctx.translate(18 + c * 26, h / 2 + (Math.random() * 8 - 4));
        ctx.rotate((Math.random() - 0.5) * 0.44);
        ctx.font = 'bold 24px "DIN Alternate", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = colors[c % colors.length];
        ctx.fillText(code[c], 0, 0);
        ctx.restore();
      }

      for (var d = 0; d < 26; d++) {
        ctx.fillStyle = 'rgba(27,36,48,' + (Math.random() * 0.15).toFixed(2) + ')';
        ctx.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);
      }
      return code;
    }
  };

  global.DB = DB;
})(window);
