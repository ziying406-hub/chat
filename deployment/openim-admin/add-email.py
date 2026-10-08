"""Add the native email field to the pinned official admin create-user form."""
from pathlib import Path
import sys


def add_email(source):
    payload = 'phoneNumber:t.phoneNumber,password:k()(t.password)'
    password_field = '(0,n.jsx)(M.Z.Item,{label:d.formatMessage({id:"user.password"}),name:"password",rules:'
    email_field = '(0,n.jsx)(M.Z.Item,{label:"邮箱",name:"email",rules:[{type:"email",message:"请输入有效的邮箱地址"}],normalize:function(value){return value.trim()},children:(0,n.jsx)(j.Z,{type:"email",allowClear:!0,placeholder:"请输入邮箱（选填）",autoComplete:"off"})}),'
    for needle in (payload, password_field):
        if source.count(needle) != 1:
            raise ValueError('Official admin create-user form changed: ' + needle)
    return source.replace(payload, 'phoneNumber:t.phoneNumber,email:t.email,password:k()(t.password)').replace(password_field, email_field + password_field)


def add_batch(source):
    toolbar = '},"key")],settings:[]'
    if source.count(toolbar) != 1:
        raise ValueError('Official admin user toolbar changed')
    batch = '},"key"),(0,n.jsx)(window.AdminBatchUsers,{React:h,createUser:function(user){return(0,P.request)("/account/register",{method:"POST",data:{user:Object.assign({},user,{password:k()(user.password)}),platform:10,autoLogin:!1},headers:{isAccount:!0},baseURL:r(92762).bt})},reload:T},"batch")],settings:[]'
    return source.replace(toolbar, batch)


if __name__ == '__main__':
    root = Path(sys.argv[1])
    version = 'batch-20261008-v3'
    original = root / 'p__chat__user__UserList__index.51e9cb92.async.js'
    (root / f'p__chat__user__UserList__index.{version}.async.js').write_text(add_batch(add_email(original.read_text())))
    runtime = (root / 'umi.8cd017f3.js').read_text()
    if runtime.count('92:"51e9cb92"') != 1:
        raise ValueError('Official admin chunk map changed')
    if runtime.count('ao.ZP.error(m.errMsg)') != 1:
        raise ValueError('Official admin error handler changed')
    runtime = runtime.replace('ao.ZP.error(m.errMsg)', 'ao.ZP.error(m.errCode===20014?"该邮箱已注册，请使用其他邮箱":m.errMsg)')
    (root / f'umi.{version}.js').write_text(runtime.replace('92:"51e9cb92"', f'92:"{version}"'))
    index = root / 'index.html'
    if index.read_text().count('/umi.8cd017f3.js') != 1:
        raise ValueError('Official admin entry script changed')
    assets = f'<link rel="stylesheet" href="/batch-users.{version}.css"><script src="/batch-users.{version}.js"></script>'
    index.write_text(index.read_text().replace('<script src="/umi.8cd017f3.js">', assets + f'<script src="/umi.{version}.js">'))
