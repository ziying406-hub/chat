/* Uses the official page's React and authenticated native registration helper. */
(function () {
  function parseRows(text) {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (!lines.length || lines.length > 50) throw new Error('每批请输入 1–50 个账号');
    const emails = new Set(), phones = new Set();
    return lines.map((line, index) => {
      const fields = line.split(line.includes('\t') ? '\t' : ',').map(value => value.trim());
      if (fields.length !== 4) throw new Error(`第 ${index + 1} 行需要四列：昵称、邮箱、手机号、密码`);
      const [nickname, email, phoneNumber, password] = fields;
      if (!nickname || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password) {
        throw new Error(`第 ${index + 1} 行请填写昵称、有效邮箱和密码`);
      }
      if (phoneNumber && !/^\d{5,15}$/.test(phoneNumber)) throw new Error(`第 ${index + 1} 行手机号需为 5–15 位数字（区号 +86）`);
      if (emails.has(email) || (phoneNumber && phones.has(phoneNumber))) throw new Error(`第 ${index + 1} 行的邮箱或手机号与本批其他账号重复`);
      emails.add(email);
      if (phoneNumber) phones.add(phoneNumber);
      return { nickname, email, phoneNumber, password, areaCode: phoneNumber ? '+86' : '', status: '待创建' };
    });
  }

  async function runBatch(rows, createUser, update) {
    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      row.status = '创建中';
      update(rows.slice());
      try {
        const response = await createUser({ nickname: row.nickname, email: row.email, phoneNumber: row.phoneNumber, areaCode: row.areaCode, password: row.password });
        if (!response?.data?.userID) throw new Error('未取得创建结果');
        row.status = '成功';
        row.result = response.data.userID;
      } catch (error) {
        const rejection = typeof error === 'string' && ({ EmailAlreadyRegister: '邮箱已注册', PhoneAlreadyRegister: '手机号已注册' })[error];
        if (rejection) {
          row.status = '失败';
          row.result = rejection;
        } else {
          row.status = '结果待确认';
          row.result = '请查询用户列表确认此账号，勿重复提交';
          row.password = '';
          update(rows.slice());
          break;
        }
      }
      row.password = '';
      update(rows.slice());
    }
    rows.forEach(row => { row.password = ''; });
    update(rows.slice());
  }

  globalThis.AdminBatchCore = { parseRows, runBatch };
  globalThis.AdminBatchUsers = function ({ React, createUser, reload }) {
    const el = React.createElement;
    const [open, setOpen] = React.useState(false);
    const [text, setText] = React.useState('');
    const [rows, setRows] = React.useState([]);
    const [error, setError] = React.useState('');
    const [running, setRunning] = React.useState(false);
    const [submitted, setSubmitted] = React.useState(false);
    const busy = React.useRef(false);
    function reset() { setRows([]); setText(''); setError(''); setSubmitted(false); }
    function preview() {
      try { setRows(parseRows(text)); setError(''); }
      catch (failure) { setRows([]); setError(failure.message); }
    }
    async function start() {
      if (busy.current || submitted || !rows.length) return;
      busy.current = true;
      setRunning(true);
      setSubmitted(true);
      setText('');
      try { await runBatch(rows, createUser, setRows); }
      finally { busy.current = false; setRunning(false); reload(); }
    }
    const button = (label, onClick, disabled, primary) => el('button', { type: 'button', className: `ant-btn admin-batch-button ${primary ? 'ant-btn-primary' : 'ant-btn-default'}`, onClick, disabled }, label);
    return el(React.Fragment, null,
      button('批量创建用户', () => { reset(); setOpen(true); }, false, false),
      open && el('div', { className: 'admin-batch-overlay' },
        el('section', { role: 'dialog', 'aria-modal': true, 'aria-label': '批量创建用户', className: 'admin-batch-panel' },
          el('header', null, el('h2', null, '批量创建用户'), button('关闭', () => { reset(); setOpen(false); }, running, false)),
          el('p', null, '每行一个账号：昵称、邮箱、手机号、密码，用 Tab 或英文逗号分隔。邮箱必填，手机号选填，区号 +86，每批最多 50 个。可从表格复制四列粘贴。'),
          !submitted && el('label', null, '账号资料', el('textarea', {
            'aria-label': '批量账号资料', placeholder: '张三,zhangsan@example.com,13800138000,设置密码\n李四,lisi@example.com,,设置密码',
            value: text, onChange: event => { setText(event.target.value); setRows([]); setError(''); },
            autoComplete: 'off', spellCheck: false,
          })),
          error && el('p', { role: 'alert', className: 'admin-batch-error' }, error),
          rows.length > 0 && el('div', { className: 'admin-batch-table' }, el('table', null,
            el('thead', null, el('tr', null, ...['行', '昵称', '邮箱', '手机号', '状态', '结果 / 用户ID'].map(value => el('th', { key: value }, value)))),
            el('tbody', null, ...rows.map((row, index) => el('tr', { key: index }, ...[index + 1, row.nickname, row.email, row.phoneNumber || '—', row.status, row.result || '—'].map((value, cell) => el('td', { key: cell }, value))))))),
          submitted && el('p', { role: 'status' }, `成功 ${rows.filter(row => row.status === '成功').length}，失败 ${rows.filter(row => row.status === '失败').length}，待确认 ${rows.filter(row => row.status === '结果待确认').length}，未提交 ${rows.filter(row => row.status === '待创建').length}。已提交的批次不能再次执行。`),
          el('footer', null,
            !submitted && button('检查账号', preview, !text.trim(), false),
            !submitted && button('开始创建', start, !rows.length || running, true),
            submitted && button('新建批次', reset, running, false)),
        )));
  };
}());
