# 发布与镜像

当前基线：`main` / `v0.1.1`。发布物不包含模型、`models/` 或 `state/`。

## GitHub

```bash
gh auth login
git remote add origin https://github.com/leoncolond/dsh-localllmtranslate.git
git push -u origin main
git push origin v0.1.1
```

如果 `gh` 是在 DSH 启动后才安装的，先重启 DSH：发布工具使用启动时的 PATH 快照。

## npm

npm 现在要求通过网页创建账号：

1. 打开 <https://www.npmjs.com/signup>，完成邮箱验证。
2. 发布需要 2FA，或者一个勾选了 **Bypass 2FA** 的 Granular Access Token。
3. 配置 token：

   ```bash
   npm config set //registry.npmjs.org/:_authToken <token>
   npm whoami
   ```

4. 发布：

   ```bash
   npm publish --access public
   ```

`npm adduser --auth-type=legacy` 创建账号会返回：

```text
Account creation via legacy auth is unavailable.
```

这是 npm 的策略限制，不是密码或用户名错误；CLI 目前只能登录已有账号。

## Gitee 镜像（不依赖 npm）

Gitee 是 Git 代码托管，不是 npm 公共 registry。它适合作为**备用安装源**，不能替代 `npm install dsh-localllmtranslate`。

### 1. 账号与公开仓库

1. 注册 Gitee（手机号/邮箱；Gitee 目前通常还要求实名认证）。
2. 新建公开仓库 `dsh-localllmtranslate`，不要初始化 README。
3. 确认仓库地址，例如：

   ```text
   https://gitee.com/leoncolond/dsh-localllmtranslate.git
   ```

公开仓库若提示实名认证，按 Gitee 流程完成；审核通常需要一段时间。

如果 GitHub 仓库已经存在，也可以先在 Gitee 网页用 **新建 → 从 GitHub 导入** 建立镜像，再按下面的方式补推 tags/后续提交。

### 2. 认证方式

Gitee 没有官方 CLI，使用 Git 自带的 SSH 或 HTTPS 凭据。

**SSH（推荐）**

```powershell
ssh-keygen -t ed25519 -C "gitee"
Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub
```

把公钥添加到 Gitee：**设置 → SSH 公钥**，然后验证：

```powershell
ssh -T git@gitee.com
```

**HTTPS**

使用 Gitee 私人令牌作为密码，交给 Git Credential Manager 保存；不要把 token 写进 remote URL。

### 3. 推送

```powershell
cd D:\dsh\dsh-localllmtranslate
git remote add gitee git@gitee.com:leoncolond/dsh-localllmtranslate.git
git push -u gitee main
git push gitee v0.1.1
```

HTTPS 等价写法：

```powershell
git remote add gitee https://gitee.com/leoncolond/dsh-localllmtranslate.git
git push -u gitee main
git push gitee v0.1.1
```

后续同步：

```powershell
git push gitee main --tags
```

### 4. 安装

```bash
dsh plugin --profile web add git+https://gitee.com/leoncolond/dsh-localllmtranslate.git
```

固定 tag：

```bash
dsh plugin --profile web add git+https://gitee.com/leoncolond/dsh-localllmtranslate.git#v0.1.1
```

如果当前 DSH 版本不接受 Git URL，先 clone 再装：

```bash
git clone https://gitee.com/leoncolond/dsh-localllmtranslate.git
dsh plugin --profile web add ./dsh-localllmtranslate
```

安装后重启 DSH；模型仍由插件从默认地址自动下载。

## DSH 发布工具

`dsh-publish-plugin` 的 `publish_plugin` / `/publish-dsh-plugin` 支持 **npm + GitHub** 双平台，不支持 Gitee。前置条件：

- `gh auth login`
- npm 已登录，且有 2FA 或 Bypass 2FA token
- 工作区干净，版本号未被占用

它会在执行前展示动作摘要并要求一次确认；部分失败会报告已完成到哪一步。
