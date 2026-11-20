# dsh-localllmtranslate

<div align="center">

<h2>天下人苦XX久矣，<br/>又要会员又限次数还要打广告！！怎会如此😭😭😭</h2>

<h3>现在已经是AI大强兼时代了，<br/>大丈夫生居天地间，岂能郁郁久居人下😡😡😡</h3>

<h3><strong>不管了，我自己来</strong></h3>

</div>

于是有了这个完全本地运行的翻译插件：不用会员、不计次数、没有广告，模型和文本都留在自己机器上。

---

DeepSeek Harness（DSH）的左侧栏「翻译」插件：在本机运行 **Hy-MT2-1.8B**，提供实时双栏翻译、段落级对照、术语本、历史记录与 CLI 风格提示播报。

A local Hy-MT2 translation workspace for the DeepSeek Harness Web UI. Everything runs on your machine; text never leaves it.

![icon](icon.svg)

## 功能

- 左侧栏入口 **翻译**；面板内部导航默认在右侧，可在设置里切到左侧，并可收起。
- **实时翻译**：停止输入约 0.8 秒自动出译文，逐段流式显示；可随时取消、重译。
- **默认左右布局**：左原文、右译文；也可在「设置 → 界面」切换为上下分栏（上译文、下原文）。
- **段落对照**：悬停/选中原文会高亮对应译文，并在译文栏下方浮出原文片段（毛玻璃浮层，不挤动译文行）；点击固定，再点取消。
- **术语本**：手动增删改、搜索、CSV / JSON 导入导出；作用域支持「当前语言对」与「全局」。
- **自动术语候选**：手动翻译后由本地模型列出术语并逐条翻译，进入「待确认」列表，采纳后才参与翻译。
- **历史记录**：手动翻译自动保存；实时翻译可用「保存历史」保存当前结果。侧栏二级菜单可快速载入。
- **提示播报器**：临时提示集中在右下角，CLI 打字/退格动画；点击固定，× 关闭，设置里可整体关闭。
- **设置分类**：模型 / 界面 / 诊断；带返回与恢复默认设置。
- **模型手势**：双击侧栏模型状态卡片加载 / 停止模型（可关闭）。
- 导入 `.txt` / `.md` / `.srt`，导出纯译文、双语对照或双语字幕。
- Agent 工具 `translate_text`，可在对话里直接调用本地翻译。

## 环境要求

- DeepSeek Harness `>=0.2.2-rc.5 <0.3.0`（当前基线在 0.2.2-rc.5 上验证）。
- 本机 `llama-server`（llama.cpp）。插件会在 PATH、WinGet 安装目录、`$DSH_HOME/local-model/runtime` 和设置里填写的路径中自动查找。
- 建议至少 6 GB 可用显存/内存；默认 F16 模型约 3.34 GiB。
- 插件本身**没有 npm 运行时依赖**，也没有构建步骤；模型与 llama.cpp 运行时都不随包分发。

Windows 安装 llama.cpp 可直接：

```powershell
winget install ggml.llamacpp
```

其他平台从 <https://github.com/ggml-org/llama.cpp/releases> 下载对应包，把 `llama-server` 放进 PATH 或 `$DSH_HOME/local-model/runtime/`。

## 兼容性

- `package.json` 声明 `engines.dsh`：`>=0.2.2-rc.5 <0.3.0`。
- 已在 DSH **0.2.2-rc.5** 上验证；0.3.0 未验证，DSH 插件管理器会阻止不满足该范围的安装/激活。
- 插件没有声明 Node.js 引擎要求，运行时由 DSH 自带环境提供。

## 安装

### 从 npm 安装（推荐）

```bash
dsh plugin --profile web add dsh-localllmtranslate
```

把 `web` 换成你自己的 profile 名（例如 `desktop`）。安装后重启 DSH，左侧栏才会出现 **翻译**。

### 从 GitHub / 本地目录安装

```bash
git clone https://github.com/leoncolond/dsh-localllmtranslate.git
dsh plugin --profile web add /absolute/path/to/dsh-localllmtranslate
```

也可以在 DSH 的 **Plugins → Add plugin** 中选择这个目录。

### 从 Git 镜像安装（Gitee 备用）

Gitee 不是 npm 公共 registry，但可以作为 Git 镜像，让没有 npm 账号的用户直接安装。镜像创建后：

```bash
dsh plugin --profile web add git+https://gitee.com/leoncolond/dsh-localllmtranslate.git
```

固定到基线版本：

```bash
dsh plugin --profile web add git+https://gitee.com/leoncolond/dsh-localllmtranslate.git#v0.1.1
```

如果 `dsh plugin` 不接受 Git URL，先 clone 再按本地目录安装：

```bash
git clone https://gitee.com/leoncolond/dsh-localllmtranslate.git
dsh plugin --profile web add ./dsh-localllmtranslate
```

镜像创建、实名、SSH/token 和同步步骤见 [docs/PUBLISHING.md](docs/PUBLISHING.md)。

安装后在左侧栏打开 **翻译**。首次打开时：

1. 若未找到模型，插件会按设置自动下载默认模型（可关闭）；也可以在「设置 → 模型」里手动下载。
2. 下载完成后自动启动模型（可关闭）；状态会在侧栏模型卡片与设置里显示。
3. 在左侧原文输入，右侧实时出现译文。

如果本机没有 llama.cpp，**设置 → 模型 → 首次配置** 会显示三步向导：

1. **安装运行时**：Windows 可一键 `winget install ggml.llamacpp`，macOS 可一键 Homebrew；其他平台复制命令或打开 llama.cpp Releases 手动安装，完成后点「重新检测」。
2. **准备模型**：下载默认 Hy-MT2-1.8B F16。
3. **启动模型**：启动成功后点「开始翻译」。

Windows 也可以直接手动执行：

```powershell
winget install ggml.llamacpp
```

## 模型

**模型文件不随本仓库分发。** 默认模型是社区转换的 `Hy-MT2-1.8B.f16.gguf`（约 3.34 GiB，F16 非量化），来源：

```text
https://hf-mirror.com/mradermacher/Hy-MT2-1.8B-GGUF/resolve/main/Hy-MT2-1.8B.f16.gguf
```

- 下载地址、文件名可以在「设置 → 模型」中修改；`自动下载默认模型` 与 `下载完成后自动启动` 开关在「设置 → 界面」。
- 模型保存在 `$DSH_HOME/localllmtranslate/models/`；也可以手动放入任意 `*.gguf` 并在设置中指向它。
- 该 F16 GGUF 的 tokenizer 元数据缺少正确的 EOS 标记；插件启动时会自动追加
  `--override-kv tokenizer.ggml.eos_token_id=int:120020`，否则模型可能在译文后继续编造内容。可在设置里关闭。
- 模型权重遵循其上游 **Apache-2.0** 许可；本插件代码使用 MIT 许可。仓库不会提交 `*.gguf` / `models/` / `state/`。

## 使用提示

- 实时翻译默认开启；点「翻译」会走完整流程（保存历史、按设置抽取术语）。
- 实时翻译本身不自动写历史；需要时点译文栏的「保存历史」。
- 顶部的语言选择支持 38 种语言，中间按钮可互换；源语言为自动时，中文→英文，其他→中文。
- 「设置 → 界面」可调整布局方向、侧栏位置、提示播报、模型卡片双击、自动下载/启动。
- 「恢复默认设置」会保留模型文件路径，但重置其它参数和界面选项。

## 数据与隐私

- 翻译推理全部在本机 llama.cpp 上完成，文本不会上传到云端。
- 术语本、历史、设置与模型日志保存在 `$DSH_HOME/localllmtranslate/`：
  - `models/`：模型文件
  - `state/glossary.json`、`state/history.json`、`state/settings.json`
  - `state/llama-server.log`
- 插件 HTTP 接口只注册在 DSH 的同源 Web 服务下，沿用 DSH 的连接信任检查。

## 开发

仓库是纯 Node ESM，无构建步骤：

- `index.js`：Host 半侧（模型管理、翻译、术语/历史、HTTP 路由、Agent 工具）。
- `lib/`：模型管理、存储、翻译提示词与共享工具。
- `client.js`：Web 面板（React，通过 DSH Client Module Loader 加载）。
- `docs/DETAIL.md`：更完整的实现与边界说明。

修改 `client.js` 后刷新页面即可；修改 Host 文件需要重启 DSH 才会加载新的模块代际。

## 发布（维护者）

发布前需要：

- npm 登录，并启用 2FA 或使用带 **Bypass 2FA** 的 Granular Access Token；
- GitHub CLI `gh` 已安装并 `gh auth login`；
- 工作区干净（`git status`），版本号未在 npm 上占用。

发布到 npm 与 GitHub：

```bash
npm publish --access public
git push -u origin main
git push origin v0.1.1
```

也可以使用 DSH 的 `dsh-publish-plugin`（`publish_plugin` 工具 / `/publish-dsh-plugin` 命令）一次完成 npm 发布、GitHub 仓库创建与推送。

## 版本

当前基线版本：**0.1.1**（见 `CHANGELOG.md`）。

## 许可

- 插件代码：MIT（`LICENSE`）。
- 默认模型：Apache-2.0（Tencent Hy-MT2 / mradermacher GGUF 转换）。
- llama.cpp：MIT。
