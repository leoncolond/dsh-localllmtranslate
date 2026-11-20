window.__ModuleLoader__.load({
  id: 'dsh-localllmtranslate',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useState, useEffect, useRef, useCallback, useMemo } = React

    const API = '/localllmtranslate'
    const UI_NS = 'dshLocalllmtranslate'
    const VIEWS = { translate: 'translate', glossary: 'glossary', history: 'history', settings: 'settings' }
    const PREF_ORIENTATION = 'dsh-localllmtranslate/orientation-v3'
    const PREF_LIVE = 'dsh-localllmtranslate/live'
    const PREF_AUTO_DOWNLOAD = 'dsh-localllmtranslate/auto-download'
    const PREF_AUTO_START = 'dsh-localllmtranslate/auto-start'
    const PREF_SIDEBAR_COLLAPSED = 'dsh-localllmtranslate/sidebar-collapsed'
    const PREF_SIDEBAR_SIDE = 'dsh-localllmtranslate/sidebar-side'
    const PREF_TOAST_ENABLED = 'dsh-localllmtranslate/toast-enabled'
    const PREF_MODEL_DBL = 'dsh-localllmtranslate/model-dblclick'
    const PREF_TIPS_SEEN = 'dsh-localllmtranslate/tips-seen'
    const SIDEBAR_WIDTH = 216

    function readPref(key, fallback) {
      try {
        if (typeof window === 'undefined' || !window.localStorage) return fallback
        const value = window.localStorage.getItem(key)
        return value === null || value === '' ? fallback : value
      } catch (error) {
        return fallback
      }
    }

    function writePref(key, value) {
      try {
        if (typeof window === 'undefined' || !window.localStorage) return
        window.localStorage.setItem(key, String(value))
      } catch (error) {
        /* preference memory is best effort */
      }
    }

    const LANGUAGES = [
      ['zh', '中文'], ['zh-Hant', '繁体中文'], ['yue', '粤语'], ['en', '英语'], ['ja', '日语'],
      ['ko', '韩语'], ['fr', '法语'], ['de', '德语'], ['es', '西班牙语'], ['pt', '葡萄牙语'],
      ['it', '意大利语'], ['nl', '荷兰语'], ['pl', '波兰语'], ['cs', '捷克语'], ['ru', '俄语'],
      ['uk', '乌克兰语'], ['tr', '土耳其语'], ['ar', '阿拉伯语'], ['fa', '波斯语'], ['he', '希伯来语'],
      ['hi', '印地语'], ['bn', '孟加拉语'], ['gu', '古吉拉特语'], ['mr', '马拉地语'], ['te', '泰卢固语'],
      ['ta', '泰米尔语'], ['ur', '乌尔都语'], ['th', '泰语'], ['vi', '越南语'], ['ms', '马来语'],
      ['id', '印尼语'], ['tl', '菲律宾语'], ['km', '高棉语'], ['my', '缅甸语'], ['bo', '藏语'],
      ['kk', '哈萨克语'], ['mn', '蒙古语'], ['ug', '维吾尔语'],
    ]

    const zhDict = {
      panelTitle: '翻译',
      panelSubtitle: '本地 Hy-MT2 翻译台',
      navTranslate: '翻译',
      navGlossary: '术语本',
      navHistory: '历史',
      navSettings: '设置',
      historyRecent: '最近记录',
      historyEmpty: '暂无历史',
      translateTab: '翻译',
      sourceTitle: '原文',
      targetTitle: '译文',
      editMode: '编辑',
      compareMode: '对照',
      swapLanguages: '互换语言',
      layoutHorizontal: '左右',
      layoutVertical: '上下',
      layoutLabel: '布局',
      settingsLayout: '布局方向',
      layoutVerticalOption: '上下（上译文 / 下原文）',
      layoutHorizontalOption: '左右（左原文 / 右译文）',
      settingsLayoutHint: '默认左右：左原文、右译文；也可以切换为上下分栏（上译文、下原文）。',
      settingsAutoDownload: '自动下载默认模型',
      settingsAutoDownloadHint: '模型不随插件分发；未找到时自动从下载地址获取 Hy-MT2-1.8B F16（约 3.3 GB）。',
      settingsAutoStart: '下载完成后自动启动模型',
      settingsAutoStartHint: '启动后首次翻译更快；关闭则等到第一次翻译请求时再加载。',
      autoDownloadStarting: '未找到默认模型，开始自动下载 Hy-MT2-1.8B F16（约 3.3 GB）…',
      autoDownloadFailed: '自动下载失败：{error}（可在设置里手动重试）',
      autoStartFailed: '自动启动模型失败：{error}',
      setupTitle: '首次配置',
      setupHint: '本机还没有完整运行时。按下面 3 步完成后即可开始本地翻译。',
      setupProgress: '{done}/{total} 步完成',
      setupDone: '已完成',
      setupStepRuntime: '安装 llama.cpp 运行时',
      setupStepModel: '准备 Hy-MT2 模型',
      setupStepStart: '启动本地模型',
      setupRuntimeMissing: '未找到 llama-server',
      setupRuntimeFound: '已找到 llama-server',
      setupInstallWinget: '用 winget 安装 llama.cpp',
      setupInstallBrew: '用 Homebrew 安装 llama.cpp',
      setupInstallConfirm: '将使用系统包管理器安装 llama.cpp，可能需要几分钟，确认继续？',
      setupInstallStarted: '已开始安装 llama.cpp，安装过程中可以继续使用面板。',
      setupInstallFailed: '安装失败',
      setupInstalling: '正在安装…',
      setupShowLog: '查看安装日志',
      setupHideLog: '收起安装日志',
      setupCancel: '取消安装',
      setupCommand: '手动安装命令',
      setupCopyCommand: '复制命令',
      setupReleases: '打开 llama.cpp Releases',
      setupRescan: '重新检测',
      setupManualHint: '没有一键安装时：打开 Releases 下载对应包，解压后把 llama-server 放进 PATH，或在下方「llama-server 路径」里填写完整路径，再点「重新检测」。',
      setupModelMissing: '未找到模型文件',
      setupDownload: '下载默认模型',
      setupDownloadHint: 'Hy-MT2-1.8B F16，约 3.3 GiB；下载后会自动配置。',
      setupStarting: '正在启动…',
      setupStart: '启动模型',
      setupNeedSteps: '完成前两步后即可启动模型。',
      setupReady: '模型已就绪，可以开始翻译。',
      setupGoTranslate: '开始翻译',
      setupBannerRuntime: '还差本机 llama.cpp，完成首次配置后即可翻译。',
      setupBannerModel: '还没有可用的翻译模型，先完成首次配置。',
      setupBannerDownloading: '正在下载默认模型（{percent}%）…',
      openSetup: '打开配置',
      setupLogTitle: '安装日志',
      setupCancelDownload: '取消下载',
      liveTranslate: '实时翻译',
      liveHint: '停止输入约 0.8 秒后自动翻译；点「翻译」会保存历史并按设置抽取术语。',
      liveOffHint: '实时翻译已关闭，点「翻译」手动翻译。',
      targetEmpty: '译文会实时显示在这里',
      targetEmptyHint: '在左侧输入或粘贴文本，停止输入后自动翻译。',
      saveHistory: '保存历史',
      saveHistoryNeedsRestart: '重启一次 DSH 后即可使用「保存历史」。',
      historySaved: '已保存到历史',
      extractTerms: '抽取术语',
      extractingShort: '抽取中…',
      sourceEcho: '第 {n} 段原文',
      liveBadge: '实时',
      sourceCompareHint: '悬停原文段落可同时高亮对应译文。',
      sourceEditHint: '在原文里选中文字，会高亮对应译文段。',
      sourceEchoPinned: '已固定 · 再点一次取消',
      savedState: '已保存',
      switchToEdit: '编辑原文',
      liveStopped: '实时翻译已关闭',
      sourceLang: '原文语言',
      targetLang: '译文语言',
      autoDetect: '自动检测',
      autoTarget: '自动（中→英 / 其他→中）',
      translate: '翻译',
      translating: '翻译中…',
      cancel: '取消',
      retranslate: '重新翻译',
      editSource: '编辑原文',
      inputPlaceholder: '粘贴要翻译的文本，建议用空行分段。',
      inputHint: '按空行分段；也可以导入 .txt / .md / .srt 文件。',
      charCount: '{n} 字符',
      segmentCount: '{n} 段',
      importFile: '导入文件',
      clear: '清空',
      copy: '复制译文',
      copied: '已复制',
      export: '导出',
      exportText: '纯译文 txt',
      exportBilingual: '双语对照 txt',
      exportSrt: '双语字幕 srt',
      noTranslation: '译文会显示在这里',
      noTranslationHint: '点击「翻译」开始，译文按段落与原文一一对应。',
      hoverHint: '悬停任一段会同时高亮对应的原文和译文；选中文字或点段号可固定高亮。',
      modelReady: '模型就绪',
      modelIdle: '模型待机',
      modelDownloading: '下载中',
      modelMissing: '未下载模型',
      modelStarting: '模型加载中',
      modelError: '模型出错',
      modelLoadingNote: '正在加载本地模型，首次可能需要几秒…',
      modelLoadingBanner: '正在加载本地模型（首次约 30 秒，之后会快很多）…',
      modelMissingShort: '还没有模型文件，先去设置里下载模型。',
      limitSegments: '一次最多 500 段，请分批翻译。',
      limitChars: '一次最多 12 万字符，请分批翻译。',
      cancelledNotice: '已取消：完成 {done}/{total} 段，可以重新翻译剩余内容。',
      segmentFailedShort: '第 {n} 段翻译失败',
      pinSegment: '固定这一段的对应高亮',
      unpinSegment: '取消固定高亮',
      clearSourceConfirm: '清空当前输入文本吗？',
      loadHistoryConfirm: '载入历史记录会覆盖当前编辑内容，继续吗？',
      historyViewAll: '查看全部（{n} 条）',
      settings: '设置',
      glossaryTitle: '术语本',
      glossaryAdd: '新增术语',
      glossarySearch: '搜索术语',
      glossaryAll: '全部词条',
      glossaryPending: '待确认',
      glossarySource: '原文',
      glossaryTarget: '译文',
      glossaryScope: '作用域',
      glossaryScopePair: '当前语言对',
      glossaryScopeGlobal: '全局',
      glossaryHits: '命中',
      glossaryImport: '导入',
      glossaryExport: '导出 CSV',
      glossarySave: '保存',
      glossaryDelete: '删除',
      glossaryEdit: '编辑',
      glossaryApprove: '采纳',
      glossaryReject: '忽略',
      glossaryClearPending: '清空待确认',
      glossaryEmpty: '术语本还是空的。翻译后会自动抽取候选，也可以手动新增。',
      glossaryPendingEmpty: '没有待确认的术语。',
      glossaryPairRange: '语言对',
      glossaryNote: '备注（可选）',
      glossaryDuplicate: '已存在，已更新译文',
      glossaryImported: '已导入 {n} 条术语',
      glossaryExtracting: '正在用本地模型抽取术语…',
      glossaryExtracted: '已新增 {n} 条待确认术语',
      glossaryImportResult: '新增 {added} 条，跳过 {skipped} 条（重复或无效）',
      clearPendingConfirm: '确定清空全部待确认术语吗？此操作不能撤销。',
      clearedPending: '已清空 {n} 条待确认术语',
      rejectTermConfirm: '忽略并删除这条候选术语吗？',
      termApproved: '已采纳',
      termRejected: '已忽略',
      termFieldsRequired: '原文和译文都不能为空',
      timeJustNow: '刚刚',
      timeMinutesAgo: '{n} 分钟前',
      timeHoursAgo: '{n} 小时前',
      back: '返回',
      settingsReset: '恢复默认设置',
      settingsResetConfirm: '恢复默认设置吗？模型文件会保留，其余参数和界面选项会重置。',
      settingsResetDone: '已恢复默认设置',
      settingsTabModel: '模型',
      settingsTabInterface: '界面',
      settingsTabDiagnostics: '诊断',
      settingsToast: '提示播报',
      settingsToastHint: '在右下角以 CLI 打字/退格样式显示提示；点击提示可固定。关闭后不再显示提示。',
      settingsDoubleClick: '双击模型状态卡片加载 / 停止',
      settingsDoubleClickHint: '关闭后点击模型状态卡片不会有任何反应。',
      modelCardDoubleClickHint: '双击加载 / 停止模型',
      modelCardClickDisabled: '模型卡片操作已关闭',
      modelLoadingToast: '正在加载本地模型…',
      modelStartedToast: '模型已就绪',
      modelStoppedToast: '模型已停止',
      settingsInterfaceHint: '侧栏位置、提示播报和模型卡片手势。',
      toastPinned: '已固定',
      toastPinHint: '点击固定这条提示',
      tipLive: '实时翻译已开启：停止输入约 0.8 秒后自动出译文。',
      tipHover: '悬停译文段会浮出对应原文；点击可固定，再点取消。',
      settingsGroupInterface: '界面',
      settingsSidebar: '侧栏位置',
      sidebarLeft: '左侧',
      sidebarRight: '右侧',
      collapseSidebar: '收起边栏',
      expandSidebar: '展开边栏',
      historyTitle: '历史记录',
      historyCount: '{n} 条记录',
      historySearch: '搜索历史',
      historyLoad: '载入',
      historyDelete: '删除',
      historyClear: '清空历史',
      historyConfirmClear: '确定清空全部历史记录吗？',
      historyEmpty: '还没有历史记录。',
      historyChars: '{n} 字符',
      historySegments: '{n} 段',
      historyLoadFailed: '载入失败',
      settingsTitle: '设置',
      settingsModel: '模型与运行时',
      settingsModelFile: '模型文件',
      settingsRuntime: 'llama-server',
      settingsRuntimeMissing: '未找到',
      settingsPort: '端口',
      settingsCtx: '上下文长度',
      settingsGpu: 'GPU 层数',
      settingsIdle: '闲置卸载（分钟）',
      settingsTemp: '温度',
      settingsMaxTokens: '单段最大输出',
      settingsEos: '修正 EOS（Hy-MT2 F16 必开）',
      settingsEosHint: '社区 Hy-MT2 F16 GGUF 缺少 EOS 标记；关闭后模型可能在译文后继续编造内容。',
      settingsExtraArgs: '附加启动参数',
      settingsLlamaPath: 'llama-server 路径（可选）',
      settingsDownloadUrl: '模型下载地址',
      settingsSave: '保存设置',
      settingsSaved: '设置已保存',
      settingsRestartHint: '启动参数已改变，下次翻译会重新加载模型。',
      settingsDownload: '下载模型',
      settingsCancelDownload: '取消下载',
      settingsStart: '启动模型',
      settingsStarting: '启动中…',
      settingsSavedShort: '已保存',
      settingsGroupSource: '模型来源',
      settingsGroupRuntime: '推理参数',
      settingsGroupBehavior: '行为开关',
      settingsStop: '停止模型',
      settingsRescan: '重新扫描',
      settingsDownloading: '正在下载 {done} / {total}',
      settingsDownloadDone: '下载完成',
      settingsDownloadFailed: '下载失败',
      settingsPaths: '路径',
      settingsModelsDir: '模型目录',
      settingsStateDir: '状态目录',
      settingsCopyPath: '复制路径',
      settingsDiagnostics: '诊断日志',
      settingsShowLog: '查看日志',
      settingsHideLog: '隐藏日志',
      settingsModelHint: '首次使用请下载 Hy-MT2-1.8B F16（约 3.3 GiB）；下载后点「启动模型」。',
      settingsLocalOnly: '所有翻译都在本机完成，文本不会离开这台机器。',
      settingsRuntimeHint: '自动在 PATH、WinGet 与 $DSH_HOME/local-model/runtime 中查找。',
      fileReadFailed: '读取文件失败',
      networkError: '网络异常，请稍后重试',
      genericError: '操作失败',
      dismiss: '关闭',
      sourceEmpty: '请先输入要翻译的文本',
      targetMissing: '请选择目标语言',
      deleteTermConfirm: '删除这条术语吗？',
      deleteHistoryConfirm: '删除这条历史记录吗？',
      pendingBadge: '待确认',
      modelDownloadNeeded: '还没有模型，先下载',
      openSettings: '打开设置',
      autoExtract: '翻译后自动抽取术语',
      autoSave: '自动保存历史',
      languagePair: '语言对',
      global: '全局',
      selectLanguage: '选择语言',
      translateHint: '本地模型逐段翻译，长文会分多次请求。',
      noModelHint: '未检测到模型文件。',
      loading: '加载中…',
      refresh: '刷新',
      serverStopped: '服务未启动',
      segment: '第 {n} 段',
      charTotal: '共 {n} 字符',
    }

    const enDict = {
      panelTitle: 'Translation',
      panelSubtitle: 'Local Hy-MT2 workspace',
      navTranslate: 'Translate',
      navGlossary: 'Glossary',
      navHistory: 'History',
      navSettings: 'Settings',
      historyRecent: 'Recent',
      historyEmpty: 'No history yet',
      translateTab: 'Translate',
      sourceTitle: 'Source',
      targetTitle: 'Translation',
      editMode: 'Edit',
      compareMode: 'Compare',
      swapLanguages: 'Swap languages',
      layoutHorizontal: 'Side by side',
      layoutVertical: 'Stacked',
      layoutLabel: 'Layout',
      settingsLayout: 'Layout direction',
      layoutVerticalOption: 'Stacked (translation above, source below)',
      layoutHorizontalOption: 'Side by side (source left, translation right)',
      settingsLayoutHint: 'Side-by-side by default: source left, translation right; switch to stacked (translation above, source below) here.',
      settingsAutoDownload: 'Download the default model automatically',
      settingsAutoDownloadHint: 'The model is not shipped with the plugin; when missing, Hy-MT2-1.8B F16 (about 3.3 GB) is fetched from the download URL.',
      settingsAutoStart: 'Start the model after download',
      settingsAutoStartHint: 'Starting early makes the first translation faster; when off, the model loads on the first translation.',
      autoDownloadStarting: 'Default model missing; downloading Hy-MT2-1.8B F16 (about 3.3 GB)…',
      autoDownloadFailed: 'Automatic download failed: {error} (retry in Settings)',
      autoStartFailed: 'Automatic model start failed: {error}',
      setupTitle: 'First-time setup',
      setupHint: 'The local runtime is not complete. Finish these three steps to start translating.',
      setupProgress: '{done}/{total} steps done',
      setupDone: 'Done',
      setupStepRuntime: 'Install the llama.cpp runtime',
      setupStepModel: 'Prepare the Hy-MT2 model',
      setupStepStart: 'Start the local model',
      setupRuntimeMissing: 'llama-server not found',
      setupRuntimeFound: 'llama-server found',
      setupInstallWinget: 'Install llama.cpp with winget',
      setupInstallBrew: 'Install llama.cpp with Homebrew',
      setupInstallConfirm: 'This installs llama.cpp with the system package manager and may take a few minutes. Continue?',
      setupInstallStarted: 'llama.cpp installation started; you can keep using the panel.',
      setupInstallFailed: 'Installation failed',
      setupInstalling: 'Installing…',
      setupShowLog: 'Show install log',
      setupHideLog: 'Hide install log',
      setupCancel: 'Cancel installation',
      setupCommand: 'Manual install command',
      setupCopyCommand: 'Copy command',
      setupReleases: 'Open llama.cpp releases',
      setupRescan: 'Check again',
      setupManualHint: 'Without a one-click installer: download a build from Releases, put llama-server on PATH, or fill its full path in the llama-server path field below, then press Check again.',
      setupModelMissing: 'Model file not found',
      setupDownload: 'Download the default model',
      setupDownloadHint: 'Hy-MT2-1.8B F16, about 3.3 GiB; it is configured automatically after download.',
      setupStarting: 'Starting…',
      setupStart: 'Start model',
      setupNeedSteps: 'Finish the first two steps to start the model.',
      setupReady: 'The model is ready; you can start translating.',
      setupGoTranslate: 'Start translating',
      setupBannerRuntime: 'llama.cpp is not configured yet. Finish first-time setup to translate.',
      setupBannerModel: 'No translation model is available yet. Finish first-time setup.',
      setupBannerDownloading: 'Downloading the default model ({percent}%)…',
      openSetup: 'Open setup',
      setupLogTitle: 'Install log',
      setupCancelDownload: 'Cancel download',
      liveTranslate: 'Live translate',
      liveHint: 'Translates about 0.8s after you stop typing; the Translate button saves history and extracts terms.',
      liveOffHint: 'Live translation is off; use the Translate button.',
      targetEmpty: 'The translation appears here live',
      targetEmptyHint: 'Type or paste on the left; translation starts when you pause.',
      saveHistory: 'Save history',
      saveHistoryNeedsRestart: 'Restart DSH once to enable Save history.',
      historySaved: 'Saved to history',
      extractTerms: 'Extract terms',
      extractingShort: 'Extracting…',
      sourceEcho: 'Source paragraph {n}',
      liveBadge: 'Live',
      sourceCompareHint: 'Hover a source paragraph to highlight its translation.',
      sourceEditHint: 'Select text in the source to highlight the matching translation.',
      sourceEchoPinned: 'Pinned · click again to unpin',
      savedState: 'Saved',
      switchToCompare: 'Compare source',
      switchToEdit: 'Edit source',
      liveStopped: 'Live translation is off',
      sourceLang: 'Source',
      targetLang: 'Target',
      autoDetect: 'Auto detect',
      autoTarget: 'Auto (zh→en, else zh)',
      translate: 'Translate',
      translating: 'Translating…',
      cancel: 'Cancel',
      retranslate: 'Translate again',
      editSource: 'Edit source',
      inputPlaceholder: 'Paste the text to translate. Separate paragraphs with blank lines.',
      inputHint: 'Paragraphs are split on blank lines. You can also import .txt / .md / .srt.',
      charCount: '{n} characters',
      segmentCount: '{n} paragraphs',
      importFile: 'Import file',
      clear: 'Clear',
      copy: 'Copy translation',
      copied: 'Copied',
      export: 'Export',
      exportText: 'Plain text (.txt)',
      exportBilingual: 'Bilingual (.txt)',
      exportSrt: 'Bilingual subtitles (.srt)',
      noTranslation: 'The translation appears here',
      noTranslationHint: 'Press Translate. Each paragraph keeps its matching translation.',
      hoverHint: 'Hover a paragraph to highlight its counterpart; select text or click the paragraph number to pin the highlight.',
      modelReady: 'Model ready',
      modelIdle: 'Model idle',
      modelDownloading: 'Downloading',
      modelMissing: 'Model not downloaded',
      modelStarting: 'Loading model',
      modelError: 'Model error',
      modelLoadingNote: 'Loading the local model; the first run may take a few seconds…',
      modelLoadingBanner: 'Loading the local model (about 30 seconds the first time)…',
      modelMissingShort: 'No model file yet. Download it in Settings first.',
      limitSegments: 'At most 500 paragraphs per run; split the text into batches.',
      limitChars: 'At most 120,000 characters per run; split the text into batches.',
      cancelledNotice: 'Cancelled: {done}/{total} paragraphs finished. Translate again to finish the rest.',
      segmentFailedShort: 'Paragraph {n} failed',
      pinSegment: 'Pin this paragraph highlight',
      unpinSegment: 'Unpin highlight',
      clearSourceConfirm: 'Clear the current source text?',
      loadHistoryConfirm: 'Loading this history record replaces the current content. Continue?',
      historyViewAll: 'View all ({n})',
      settings: 'Settings',
      glossaryTitle: 'Glossary',
      glossaryAdd: 'Add term',
      glossarySearch: 'Search terms',
      glossaryAll: 'All terms',
      glossaryPending: 'Pending',
      glossarySource: 'Source',
      glossaryTarget: 'Target',
      glossaryScope: 'Scope',
      glossaryScopePair: 'This language pair',
      glossaryScopeGlobal: 'Global',
      glossaryHits: 'Hits',
      glossaryImport: 'Import',
      glossaryExport: 'Export CSV',
      glossarySave: 'Save',
      glossaryDelete: 'Delete',
      glossaryEdit: 'Edit',
      glossaryApprove: 'Approve',
      glossaryReject: 'Ignore',
      glossaryClearPending: 'Clear pending',
      glossaryEmpty: 'The glossary is empty. Candidates appear after translation, or add terms manually.',
      glossaryPendingEmpty: 'No pending terms.',
      glossaryPairRange: 'Language pair',
      glossaryNote: 'Note (optional)',
      glossaryDuplicate: 'Already existed; target updated',
      glossaryImported: 'Imported {n} terms',
      glossaryExtracting: 'Extracting terms with the local model…',
      glossaryExtracted: 'Added {n} pending terms',
      glossaryImportResult: 'Added {added}, skipped {skipped} (duplicate or invalid)',
      clearPendingConfirm: 'Clear every pending term? This cannot be undone.',
      clearedPending: 'Cleared {n} pending terms',
      rejectTermConfirm: 'Ignore and delete this candidate?',
      termApproved: 'Approved',
      termRejected: 'Ignored',
      termFieldsRequired: 'Source and target cannot be empty',
      timeJustNow: 'just now',
      timeMinutesAgo: '{n} min ago',
      timeHoursAgo: '{n} h ago',
      back: 'Back',
      settingsReset: 'Restore defaults',
      settingsResetConfirm: 'Restore default settings? The model file is kept; other parameters and interface options are reset.',
      settingsResetDone: 'Defaults restored',
      settingsTabModel: 'Model',
      settingsTabInterface: 'Interface',
      settingsTabDiagnostics: 'Diagnostics',
      settingsToast: 'Toast broadcaster',
      settingsToastHint: 'Show tips at the bottom right in a CLI typing/backspace style; click a toast to pin it. When off, no toasts appear.',
      settingsDoubleClick: 'Double-click the model card to load / stop',
      settingsDoubleClickHint: 'When off, clicking the model card does nothing.',
      modelCardDoubleClickHint: 'Double-click to load / stop the model',
      modelCardClickDisabled: 'Model card actions are off',
      modelLoadingToast: 'Loading the local model…',
      modelStartedToast: 'Model ready',
      modelStoppedToast: 'Model stopped',
      settingsInterfaceHint: 'Sidebar position, toast broadcaster, and model card gesture.',
      toastPinned: 'Pinned',
      toastPinHint: 'Click to pin this message',
      tipLive: 'Live translation is on: translation starts about 0.8s after you stop typing.',
      tipHover: 'Hover a translated paragraph to reveal its source; click to pin, click again to unpin.',
      settingsGroupInterface: 'Interface',
      settingsSidebar: 'Sidebar position',
      sidebarLeft: 'Left',
      sidebarRight: 'Right',
      collapseSidebar: 'Collapse sidebar',
      expandSidebar: 'Expand sidebar',
      historyTitle: 'History',
      historyCount: '{n} records',
      historySearch: 'Search history',
      historyLoad: 'Load',
      historyDelete: 'Delete',
      historyClear: 'Clear history',
      historyConfirmClear: 'Clear all translation history?',
      historyEmpty: 'No translation history yet.',
      historyChars: '{n} characters',
      historySegments: '{n} paragraphs',
      historyLoadFailed: 'Could not load this record',
      settingsTitle: 'Settings',
      settingsModel: 'Model and runtime',
      settingsModelFile: 'Model file',
      settingsRuntime: 'llama-server',
      settingsRuntimeMissing: 'Not found',
      settingsPort: 'Port',
      settingsCtx: 'Context size',
      settingsGpu: 'GPU layers',
      settingsIdle: 'Unload after idle (minutes)',
      settingsTemp: 'Temperature',
      settingsMaxTokens: 'Max output per paragraph',
      settingsEos: 'Fix EOS (required for Hy-MT2 F16)',
      settingsEosHint: 'The community Hy-MT2 F16 GGUF lacks an EOS marker; without the override the model may invent text after the translation.',
      settingsExtraArgs: 'Extra launch arguments',
      settingsLlamaPath: 'llama-server path (optional)',
      settingsDownloadUrl: 'Model download URL',
      settingsSave: 'Save settings',
      settingsSaved: 'Settings saved',
      settingsRestartHint: 'Launch settings changed; the model reloads on the next translation.',
      settingsDownload: 'Download model',
      settingsCancelDownload: 'Cancel download',
      settingsStart: 'Start model',
      settingsStarting: 'Starting…',
      settingsSavedShort: 'Saved',
      settingsGroupSource: 'Model source',
      settingsGroupRuntime: 'Inference',
      settingsGroupBehavior: 'Behavior',
      settingsStop: 'Stop model',
      settingsRescan: 'Rescan',
      settingsDownloading: 'Downloading {done} / {total}',
      settingsDownloadDone: 'Download complete',
      settingsDownloadFailed: 'Download failed',
      settingsPaths: 'Paths',
      settingsModelsDir: 'Model directory',
      settingsStateDir: 'State directory',
      settingsCopyPath: 'Copy path',
      settingsDiagnostics: 'Diagnostics',
      settingsShowLog: 'Show log',
      settingsHideLog: 'Hide log',
      settingsModelHint: 'Download Hy-MT2-1.8B F16 (about 3.3 GiB) once, then press Start model.',
      settingsLocalOnly: 'Every translation runs on this machine; text never leaves it.',
      settingsRuntimeHint: 'Searched in PATH, WinGet, and $DSH_HOME/local-model/runtime.',
      fileReadFailed: 'Could not read the file',
      networkError: 'Network error; please retry',
      genericError: 'Operation failed',
      dismiss: 'Dismiss',
      sourceEmpty: 'Enter text to translate first',
      targetMissing: 'Choose a target language',
      deleteTermConfirm: 'Delete this term?',
      deleteHistoryConfirm: 'Delete this history record?',
      pendingBadge: 'pending',
      modelDownloadNeeded: 'Model missing — download it first',
      openSettings: 'Open settings',
      autoExtract: 'Extract terms after translation',
      autoSave: 'Save history automatically',
      languagePair: 'Language pair',
      global: 'Global',
      selectLanguage: 'Choose language',
      translateHint: 'The local model translates paragraph by paragraph; long texts use several requests.',
      noModelHint: 'No model file detected.',
      loading: 'Loading…',
      refresh: 'Refresh',
      serverStopped: 'Server stopped',
      segment: 'Paragraph {n}',
      charTotal: '{n} characters',
    }

    const langName = code => {
      if (code === 'auto') return zhDict.autoDetect
      const found = LANGUAGES.find(item => item[0] === code)
      return found ? found[1] : code
    }

    /* ------------------------------------------------------------------ */
    /* Formatting and local helpers                                       */
    /* ------------------------------------------------------------------ */

    function formatTemplate(template, params) {
      if (typeof template !== 'string') return ''
      if (!params) return template
      return template.replace(/\{(\w+)\}/g, (match, name) => (
        Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match
      ))
    }

    function formatBytes(bytes) {
      const value = Number(bytes) || 0
      if (value < 1024) return value + ' B'
      if (value < 1024 * 1024) return (value / 1024).toFixed(1) + ' KB'
      if (value < 1024 * 1024 * 1024) return (value / 1024 / 1024).toFixed(1) + ' MB'
      return (value / 1024 / 1024 / 1024).toFixed(2) + ' GB'
    }

    function formatTime(timestamp, t) {
      const tr = typeof t === 'function' ? t : key => (zhDict[key] ?? key)
      const date = new Date(Number(timestamp) || 0)
      if (Number.isNaN(date.getTime())) return ''
      const now = Date.now()
      const delta = now - date.getTime()
      if (delta < 60000) return tr('timeJustNow')
      if (delta < 3600000) return formatTemplate(tr('timeMinutesAgo'), { n: Math.round(delta / 60000) })
      if (delta < 86400000) return formatTemplate(tr('timeHoursAgo'), { n: Math.round(delta / 3600000) })
      const pad = value => String(value).padStart(2, '0')
      return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate())
        + ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes())
    }

    function splitParagraphs(text) {
      const normalized = String(text || '').replace(/\r\n?/g, '\n').trim()
      if (normalized === '') return []
      let blocks = normalized.split(/\n[ \t]*\n+/).map(part => part.trim()).filter(Boolean)
      if (blocks.length === 1) {
        const lines = normalized.split('\n').map(part => part.trim()).filter(Boolean)
        if (lines.length > 1 && lines.every(line => line.length <= 300)) blocks = lines
      }
      const segments = []
      for (const block of blocks) {
        let rest = block
        while (rest.length > 1400) {
          const windowText = rest.slice(0, 1400)
          const match = /[。！？!?；;…](?:[”』」）)]*)?/g
          let boundary = -1
          let hit
          while ((hit = match.exec(windowText)) !== null) {
            if (hit.index + hit[0].length >= windowText.length * 0.5) {
              boundary = hit.index + hit[0].length
              break
            }
          }
          if (boundary <= 0) boundary = windowText.lastIndexOf('\n') > 0 ? windowText.lastIndexOf('\n') : 1400
          segments.push(rest.slice(0, boundary).trim())
          rest = rest.slice(boundary)
        }
        if (rest.trim() !== '') segments.push(rest.trim())
      }
      return segments
    }

    function parseSrt(text) {
      const normalized = String(text || '').replace(/\r\n?/g, '\n').trim()
      if (normalized === '') return []
      const cues = []
      const blocks = normalized.split(/\n{2,}/)
      for (const block of blocks) {
        const lines = block.split('\n').map(line => line.trim()).filter(Boolean)
        if (lines.length === 0) continue
        let index = 0
        let start = ''
        let end = ''
        let contentStart = 0
        if (/^\d+$/.test(lines[0])) {
          index = Number(lines[0])
          contentStart = 1
        }
        const timing = (lines[contentStart] || '').match(/^(\d{1,2}:\d{2}:\d{2}[,.]\d{1,3})\s*-->\s*(\d{1,2}:\d{2}:\d{2}[,.]\d{1,3})/)
        if (timing) {
          start = timing[1].replace(',', ',')
          end = timing[2]
          contentStart += 1
        }
        const content = lines.slice(contentStart).join('\n').trim()
        if (content === '') continue
        cues.push({ index: cues.length + 1, start, end, text: content })
      }
      return cues
    }

    function buildSrt(cues, translations) {
      const toSrtTime = value => {
        const text = String(value || '00:00:00,000').replace('.', ',')
        return text
      }
      return cues.map((cue, index) => {
        const original = String(cue.text || '').trim()
        const translated = String(translations[index] || '').trim()
        return [
          String(index + 1),
          toSrtTime(cue.start || '00:00:00,000') + ' --> ' + toSrtTime(cue.end || '00:00:00,000'),
          original,
          ...(translated === '' ? [] : [translated]),
        ].join('\n')
      }).join('\n\n') + '\n'
    }

    function downloadText(filename, text) {
      try {
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = filename
        anchor.rel = 'noopener'
        anchor.click()
        setTimeout(() => URL.revokeObjectURL(url), 2000)
      } catch (error) {
        /* download is best effort */
      }
    }

    async function copyText(text) {
      try {
        await navigator.clipboard.writeText(text)
        return true
      } catch (error) {
        try {
          const area = document.createElement('textarea')
          area.value = text
          area.style.position = 'fixed'
          area.style.opacity = '0'
          document.body.appendChild(area)
          area.select()
          document.execCommand('copy')
          document.body.removeChild(area)
          return true
        } catch (fallbackError) {
          return false
        }
      }
    }

    async function requestApi(path, options) {
      const response = await fetch(API + path, options)
      let payload
      try {
        payload = await response.json()
      } catch (error) {
        payload = null
      }
      if (!response.ok || (payload && payload.ok === false)) {
        const message = payload && payload.error ? String(payload.error) : 'HTTP ' + response.status
        const failure = new Error(message)
        failure.payload = payload
        throw failure
      }
      return payload
    }

    /* ------------------------------------------------------------------ */
    /* Icons                                                              */
    /* ------------------------------------------------------------------ */

    function svgIcon(paths, props) {
      const size = props && typeof props.size === 'number' ? props.size : 18
      const children = Array.isArray(paths) ? paths : [paths]
      return h('svg', {
        viewBox: '0 0 24 24',
        width: size,
        height: size,
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.7,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': true,
        style: { display: 'block', flexShrink: 0 },
      }, children.map((entry, index) => h(entry.tag, {
        key: index,
        ...entry.props,
      })))
    }

    const IconTranslate = props => svgIcon([
      { tag: 'path', props: { d: 'M4 5h9M8.5 5v2c0 3.4-2 5.7-4.5 7' } },
      { tag: 'path', props: { d: 'M5.5 9.5c1.8 2.5 4 4 6.5 4.8' } },
      { tag: 'path', props: { d: 'M13 19l3.5-8 3.5 8' } },
      { tag: 'path', props: { d: 'M14.4 16.4h4.2' } },
    ], props)

    function Icon(props) {
      const size = props && typeof props.size === 'number' ? props.size : 20
      const active = !!(props && props.active)
      return h('svg', {
        viewBox: '0 0 24 24',
        width: size,
        height: size,
        fill: 'none',
        'aria-hidden': true,
        style: { display: 'block', flexShrink: 0 },
      },
        h('path', {
          d: 'M4 5.5h8.5M8.2 5.5v2.1c0 3.2-1.8 5.4-4.2 6.7',
          stroke: 'currentColor',
          strokeWidth: active ? 2 : 1.7,
          strokeLinecap: 'round',
        }),
        h('path', {
          d: 'M5.2 9.2c1.6 2.2 3.6 3.6 5.9 4.4',
          stroke: 'currentColor',
          strokeWidth: active ? 2 : 1.7,
          strokeLinecap: 'round',
        }),
        h('path', {
          d: 'M13.4 19.5 16.8 11l3.4 8.5',
          stroke: 'currentColor',
          strokeWidth: active ? 2 : 1.7,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }),
        h('path', {
          d: 'M14.6 16.6h4.5',
          stroke: 'currentColor',
          strokeWidth: active ? 2 : 1.7,
          strokeLinecap: 'round',
        }),
        h('rect', {
          x: 3,
          y: 4.2,
          width: 18,
          height: 16,
          rx: 4,
          stroke: 'currentColor',
          strokeWidth: active ? 2 : 1.7,
          opacity: active ? 0.9 : 0.35,
        })
      )
    }

    const IconGlossary = props => svgIcon([
      { tag: 'path', props: { d: 'M5 4.5A2.5 2.5 0 0 1 7.5 2H19v18H7.5A2.5 2.5 0 0 1 5 17.5z' } },
      { tag: 'path', props: { d: 'M5 17.5A2.5 2.5 0 0 1 7.5 15H19' } },
      { tag: 'path', props: { d: 'M9 6.5h6M9 10h4' } },
    ], props)

    const IconHistory = props => svgIcon([
      { tag: 'circle', props: { cx: 12, cy: 12, r: 8.2 } },
      { tag: 'path', props: { d: 'M12 7.5V12l3 1.8' } },
    ], props)

    const IconSettings = props => svgIcon([
      { tag: 'circle', props: { cx: 12, cy: 12, r: 3.1 } },
      { tag: 'path', props: { d: 'M19.2 13.6a7.6 7.6 0 0 0 0-3.2l2-1.5-2-3.4-2.3.9a7.5 7.5 0 0 0-2.7-1.6L13.8 2h-3.9l-.4 2.8a7.5 7.5 0 0 0-2.7 1.6l-2.3-.9-2 3.4 2 1.5a7.6 7.6 0 0 0 0 3.2l-2 1.5 2 3.4 2.3-.9a7.5 7.5 0 0 0 2.7 1.6l.4 2.8h3.9l.4-2.8a7.5 7.5 0 0 0 2.7-1.6l2.3.9 2-3.4z' } },
    ], props)

    const IconDownload = props => svgIcon([
      { tag: 'path', props: { d: 'M12 3v11' } },
      { tag: 'path', props: { d: 'M7.5 10.5 12 15l4.5-4.5' } },
      { tag: 'path', props: { d: 'M4 17.5v1A2.5 2.5 0 0 0 6.5 21h11a2.5 2.5 0 0 0 2.5-2.5v-1' } },
    ], props)

    const IconPlay = props => svgIcon([{ tag: 'path', props: { d: 'M8 5.5 18 12 8 18.5z' } }], props)
    const IconStop = props => svgIcon([{ tag: 'rect', props: { x: 7, y: 7, width: 10, height: 10, rx: 1.5 } }], props)
    const IconRefresh = props => svgIcon([
      { tag: 'path', props: { d: 'M19.5 12a7.5 7.5 0 1 1-2.4-5.5' } },
      { tag: 'path', props: { d: 'M19.8 4.8v4h-4' } },
    ], props)
    const IconUpload = props => svgIcon([
      { tag: 'path', props: { d: 'M12 16V5' } },
      { tag: 'path', props: { d: 'M7.5 9.5 12 5l4.5 4.5' } },
      { tag: 'path', props: { d: 'M4 17.5v1A2.5 2.5 0 0 0 6.5 21h11a2.5 2.5 0 0 0 2.5-2.5v-1' } },
    ], props)
    const IconCopy = props => svgIcon([
      { tag: 'rect', props: { x: 9, y: 9, width: 11, height: 11, rx: 2 } },
      { tag: 'path', props: { d: 'M15 5.5A1.5 1.5 0 0 0 13.5 4h-8A1.5 1.5 0 0 0 4 5.5v8A1.5 1.5 0 0 0 5.5 15' } },
    ], props)
    const IconTrash = props => svgIcon([
      { tag: 'path', props: { d: 'M4.5 6.5h15' } },
      { tag: 'path', props: { d: 'M9 6.5V4.8A1.3 1.3 0 0 1 10.3 3.5h3.4A1.3 1.3 0 0 1 15 4.8v1.7' } },
      { tag: 'path', props: { d: 'M6.5 6.5 7.4 19a1.5 1.5 0 0 0 1.5 1.4h6.2A1.5 1.5 0 0 0 16.6 19l.9-12.5' } },
    ], props)
    const IconPlus = props => svgIcon([
      { tag: 'path', props: { d: 'M12 5v14M5 12h14' } },
    ], props)
    const IconCheck = props => svgIcon([{ tag: 'path', props: { d: 'm5 12.5 4.5 4.5L19 7' } }], props)
    const IconClose = props => svgIcon([{ tag: 'path', props: { d: 'm6 6 12 12M18 6 6 18' } }], props)
    const IconEdit = props => svgIcon([
      { tag: 'path', props: { d: 'M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17z' } },
      { tag: 'path', props: { d: 'm13.5 6.5 3 3' } },
    ], props)
    const IconSearch = props => svgIcon([
      { tag: 'circle', props: { cx: 10.8, cy: 10.8, r: 6.3 } },
      { tag: 'path', props: { d: 'm15.5 15.5 4.5 4.5' } },
    ], props)
    const IconChevron = props => svgIcon([{ tag: 'path', props: { d: 'm8 10 4 4 4-4' } }], props)
    const IconFile = props => svgIcon([
      { tag: 'path', props: { d: 'M6 3h7l5 5v13H6z' } },
      { tag: 'path', props: { d: 'M13 3v5h5' } },
    ], props)
    const IconArrow = props => svgIcon([
      { tag: 'path', props: { d: 'M5 12h14' } },
      { tag: 'path', props: { d: 'm15 8 4 4-4 4' } },
    ], props)
    const IconSwap = props => svgIcon([
      { tag: 'path', props: { d: 'M4 8h13' } },
      { tag: 'path', props: { d: 'm14 5 3 3-3 3' } },
      { tag: 'path', props: { d: 'M20 16H7' } },
      { tag: 'path', props: { d: 'm10 13-3 3 3 3' } },
    ], props)
    const IconArrowLeft = props => svgIcon([
      { tag: 'path', props: { d: 'M19 12H5' } },
      { tag: 'path', props: { d: 'm11 6-6 6 6 6' } },
    ], props)
    const IconColumns = props => svgIcon([
      { tag: 'rect', props: { x: 3, y: 4.5, width: 18, height: 15, rx: 2.5 } },
      { tag: 'path', props: { d: 'M12 4.5v15' } },
    ], props)
    const IconRows = props => svgIcon([
      { tag: 'rect', props: { x: 3, y: 4.5, width: 18, height: 15, rx: 2.5 } },
      { tag: 'path', props: { d: 'M3 12h18' } },
    ], props)

    function IconSidebar(props) {
      const size = props && typeof props.size === 'number' ? props.size : 16
      return h('svg', {
        viewBox: '0 0 24 24',
        width: size,
        height: size,
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.7,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': true,
        style: {
          display: 'block',
          flexShrink: 0,
          transform: props && props.mirrored ? 'scaleX(-1)' : 'none',
        },
      },
        h('rect', { x: 3, y: 4.5, width: 18, height: 15, rx: 3 }),
        h('path', { d: 'M9 4.5v15' }),
        h('path', { d: 'M5.6 9.2h1.2M5.6 12h1.2M5.6 14.8h1.2' })
      )
    }
    const IconSpark = props => svgIcon([
      { tag: 'path', props: { d: 'M12 3.5 13.6 9 19 10.6 13.6 12.2 12 17.7 10.4 12.2 5 10.6 10.4 9z' } },
      { tag: 'circle', props: { cx: 17.5, cy: 17.5, r: 1.4 } },
    ], props)

    /* ------------------------------------------------------------------ */
    /* Styles                                                             */
    /* ------------------------------------------------------------------ */

    const colors = {
      base: 'var(--dsw-alias-bg-base)',
      layer1: 'var(--dsw-alias-bg-layer-1)',
      layer2: 'var(--dsw-alias-bg-layer-2)',
      border: 'var(--dsw-alias-border-l1)',
      borderStrong: 'var(--dsw-alias-border-l2)',
      text: 'var(--dsw-alias-label-primary)',
      muted: 'var(--dsw-alias-label-secondary)',
      brand: 'var(--dsw-alias-brand-primary)',
      error: 'var(--dsw-alias-state-error-primary)',
      success: 'var(--dsw-alias-state-success-primary)',
      warn: 'var(--dsw-alias-state-warn-primary)',
      idle: 'var(--dsw-alias-state-idle-primary)',
    }

    function tint(color, percent) {
      return 'color-mix(in srgb, ' + color + ' ' + percent + '%, transparent)'
    }

    function useHover() {
      const [hover, setHover] = useState(false)
      return [hover, {
        onMouseEnter: () => setHover(true),
        onMouseLeave: () => setHover(false),
        onFocus: () => setHover(true),
        onBlur: () => setHover(false),
      }]
    }

    function Button(props) {
      const { children, onClick, disabled, variant = 'ghost', title, icon, size = 'md', type = 'button', style } = props
      const [hover, hoverProps] = useHover()
      const base = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        height: size === 'sm' ? 28 : 34,
        padding: size === 'sm' ? '0 10px' : '0 14px',
        borderRadius: 8,
        border: '1px solid transparent',
        fontSize: size === 'sm' ? 12.5 : 13.5,
        fontFamily: 'inherit',
        fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'background 120ms ease, border-color 120ms ease',
        whiteSpace: 'nowrap',
        ...style,
      }
      if (variant === 'primary') {
        base.background = colors.brand
        base.color = 'var(--dsw-alias-bg-base)'
        if (hover && !disabled) base.filter = 'brightness(1.06)'
      } else if (variant === 'danger') {
        base.color = colors.error
        base.border = '1px solid ' + tint(colors.error, 35)
        base.background = hover && !disabled ? tint(colors.error, 10) : 'transparent'
      } else if (variant === 'outline') {
        base.border = '1px solid ' + colors.borderStrong
        base.color = colors.text
        base.background = hover && !disabled ? colors.layer2 : 'transparent'
      } else {
        base.color = colors.muted
        base.background = hover && !disabled ? colors.layer2 : 'transparent'
      }
      return h('button', {
        type,
        title: title || undefined,
        'aria-label': title || undefined,
        disabled: !!disabled,
        onClick,
        style: base,
        ...hoverProps,
      }, icon ? h(icon, { size: size === 'sm' ? 15 : 17 }) : null, children)
    }

    function IconButton(props) {
      const { icon: Glyph, title, onClick, disabled, variant = 'ghost', size = 30 } = props
      const [hover, hoverProps] = useHover()
      const style = {
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid transparent',
        borderRadius: 8,
        background: hover && !disabled ? colors.layer2 : 'transparent',
        color: variant === 'danger' ? colors.error : colors.muted,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        padding: 0,
      }
      return h('button', {
        type: 'button',
        title,
        'aria-label': title,
        disabled: !!disabled,
        onClick,
        style,
        ...hoverProps,
      }, h(Glyph, { size: 17 }))
    }

    function TextInput(props) {
      const { value, onChange, placeholder, ariaLabel, type = 'text', style, min, max, step } = props
      return h('input', {
        type,
        value: value ?? '',
        placeholder,
        'aria-label': ariaLabel || placeholder,
        min,
        max,
        step,
        onChange: event => onChange(event.target.value),
        style: {
          width: '100%',
          height: 34,
          padding: '0 10px',
          boxSizing: 'border-box',
          borderRadius: 8,
          border: '1px solid ' + colors.border,
          background: colors.base,
          color: colors.text,
          fontFamily: 'inherit',
          fontSize: 13,
          ...style,
        },
      })
    }

    function Select(props) {
      const { value, onChange, children, ariaLabel, style } = props
      return h('select', {
        value,
        'aria-label': ariaLabel,
        onChange: event => onChange(event.target.value),
        style: {
          height: 34,
          padding: '0 26px 0 10px',
          boxSizing: 'border-box',
          borderRadius: 8,
          border: '1px solid ' + colors.border,
          background: colors.base,
          color: colors.text,
          fontFamily: 'inherit',
          fontSize: 13,
          cursor: 'pointer',
          appearance: 'auto',
          ...style,
        },
      }, children)
    }

    function Toggle(props) {
      const { checked, onChange, label, hint } = props
      return h('div', {
        role: 'switch',
        'aria-checked': checked ? 'true' : 'false',
        'aria-label': typeof label === 'string' ? label : undefined,
        tabIndex: 0,
        onClick: () => onChange(!checked),
        onKeyDown: event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onChange(!checked)
          }
        },
        style: {
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          cursor: 'pointer',
          padding: '7px 0',
          userSelect: 'none',
        },
      },
        h('span', {
          style: {
            width: 32,
            height: 18,
            flex: 'none',
            borderRadius: 9,
            marginTop: 2,
            background: checked ? colors.brand : colors.borderStrong,
            position: 'relative',
            transition: 'background 140ms ease',
          },
        }, h('span', {
          style: {
            position: 'absolute',
            top: 2,
            left: checked ? 16 : 2,
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: colors.base,
            transition: 'left 140ms ease',
          },
        })),
        h('span', { style: { display: 'flex', flexDirection: 'column', gap: 2 } },
          h('span', { style: { fontSize: 13, color: colors.text } }, label),
          hint ? h('span', { style: { fontSize: 11.5, color: colors.muted, lineHeight: 1.5 } }, hint) : null
        )
      )
    }

    function Badge(props) {
      const { children, tone = 'muted' } = props
      const color = tone === 'brand' ? colors.brand
        : tone === 'success' ? colors.success
          : tone === 'warn' ? colors.warn
            : tone === 'error' ? colors.error
              : colors.muted
      return h('span', {
        style: {
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          height: 20,
          padding: '0 8px',
          borderRadius: 10,
          fontSize: 11,
          fontWeight: 500,
          color,
          background: tint(color, 12),
          whiteSpace: 'nowrap',
        },
      }, children)
    }

    function Spinner(props) {
      const size = props && props.size ? props.size : 14
      return h('span', {
        style: {
          display: 'inline-block',
          width: size,
          height: size,
          borderRadius: '50%',
          border: '2px solid ' + tint(colors.brand, 25),
          borderTopColor: colors.brand,
          animation: 'dsh-localllmtranslate-spin 0.8s linear infinite',
          flexShrink: 0,
        },
      })
    }

    function EmptyState(props) {
      return h('div', {
        style: {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: '40px 20px',
          color: colors.muted,
          textAlign: 'center',
          fontSize: 13,
          lineHeight: 1.6,
        },
      }, props.icon ? h(props.icon, { size: 26 }) : null, h('div', null, props.children))
    }

    function ProgressBar(props) {
      const { value } = props
      const percent = Math.max(0, Math.min(100, Number(value) || 0))
      return h('div', {
        style: { height: 6, borderRadius: 3, background: colors.layer2, overflow: 'hidden' },
        role: 'progressbar',
        'aria-valuenow': Math.round(percent),
        'aria-valuemin': 0,
        'aria-valuemax': 100,
      }, h('div', {
        style: {
          height: '100%',
          width: percent + '%',
          background: colors.brand,
          transition: 'width 300ms ease',
        },
      }))
    }

    /* ------------------------------------------------------------------ */
    /* Panel shell                                                        */
    /* ------------------------------------------------------------------ */

    function useT(ctx) {
      const [, force] = React.useReducer(value => value + 1, 0)
      useEffect(() => {
        const locale = ctx && typeof ctx.get === 'function' ? ctx.get('locale') : undefined
        if (!locale || typeof locale.subscribe !== 'function') return undefined
        return locale.subscribe(() => force())
      }, [ctx])
      return useCallback((key, params) => {
        const locale = ctx && typeof ctx.get === 'function' ? ctx.get('locale') : undefined
        let value
        if (locale && typeof locale.bind === 'function') {
          try {
            value = locale.bind(UI_NS)(key)
          } catch (error) {
            value = undefined
          }
        }
        if (typeof value !== 'string' || value === key) value = zhDict[key] ?? enDict[key] ?? key
        return formatTemplate(value, params)
      }, [ctx])
    }

    function modelStatusOf(data, t) {
      const tr = key => (typeof t === 'function' ? t(key) : (zhDict[key] ?? key))
      if (!data) return { tone: 'muted', label: tr('loading'), detail: '' }
      const model = data.model || {}
      if (model.download && model.download.active) {
        return { tone: 'warn', label: tr('modelDownloading'), detail: model.download.received + '/' + model.download.total }
      }
      if (model.phase === 'error' || model.error) return { tone: 'error', label: tr('modelError'), detail: model.error }
      if (model.ready) return { tone: 'success', label: tr('modelReady'), detail: ':' + model.port }
      if (model.starting) return { tone: 'warn', label: tr('modelStarting'), detail: '' }
      if (!model.model || !model.model.found) return { tone: 'warn', label: tr('modelMissing'), detail: '' }
      return { tone: 'muted', label: tr('modelIdle'), detail: '' }
    }

    function StatusDot(props) {
      const { tone } = props
      const color = tone === 'success' ? colors.success
        : tone === 'warn' ? colors.warn
          : tone === 'error' ? colors.error
            : colors.idle
      return h('span', {
        style: {
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: color,
          boxShadow: '0 0 0 3px ' + tint(color, 16),
          flexShrink: 0,
        },
      })
    }

    function SidebarToggle(props) {
      const { side, collapsed, onToggle, t } = props
      const [hover, hoverProps] = useHover()
      const label = collapsed ? t('expandSidebar') : t('collapseSidebar')
      return h('button', {
        type: 'button',
        title: label,
        'aria-label': label,
        'aria-expanded': collapsed ? 'false' : 'true',
        onClick: onToggle,
        style: {
          position: 'absolute',
          top: collapsed ? '50%' : 18,
          transform: collapsed ? 'translateY(-50%)' : 'none',
          ...(side === 'left'
            ? { left: collapsed ? 14 : SIDEBAR_WIDTH - 6 }
            : { right: collapsed ? 14 : SIDEBAR_WIDTH - 6 }),
          width: 26,
          height: 26,
          minWidth: 26,
          padding: 0,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid ' + colors.border,
          borderRadius: '50%',
          background: hover ? tint(colors.brand, 14) : colors.layer2,
          color: hover ? colors.brand : colors.muted,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.16)',
          cursor: 'pointer',
          zIndex: 9,
          transition: 'left 150ms ease, right 150ms ease, color 120ms ease, background 120ms ease',
        },
        ...hoverProps,
      }, h(IconSidebar, { size: 15, mirrored: side === 'right' }))
    }

    function ToastItem(props) {
      const { item, t, onDone, onDismiss } = props
      const text = String(item.text || '')
      const [count, setCount] = useState(0)
      const [phase, setPhase] = useState('typing')
      const [pinned, setPinned] = useState(false)
      const tone = item.tone === 'success' ? colors.success
        : item.tone === 'warn' ? colors.warn
          : item.tone === 'error' ? colors.error
            : colors.brand
      useEffect(() => {
        if (phase !== 'typing') return undefined
        if (count >= text.length) {
          setPhase('waiting')
          return undefined
        }
        const timer = setTimeout(() => setCount(value => Math.min(text.length, value + 1)), 14)
        return () => clearTimeout(timer)
      }, [phase, count, text])
      useEffect(() => {
        if (phase !== 'waiting' || pinned) return undefined
        const timer = setTimeout(() => {
          setCount(text.length)
          setPhase('erasing')
        }, item.duration || 4200)
        return () => clearTimeout(timer)
      }, [phase, pinned, item.duration, text.length])
      useEffect(() => {
        if (phase !== 'erasing') return undefined
        if (count <= 0) {
          onDone(item.id)
          return undefined
        }
        const timer = setTimeout(() => setCount(value => Math.max(0, value - 1)), 8)
        return () => clearTimeout(timer)
      }, [phase, count, item.id, onDone])
      const pin = () => {
        setPinned(true)
        if (phase === 'erasing') {
          setCount(text.length)
          setPhase('waiting')
        }
      }
      const opacity = phase === 'erasing' ? Math.max(0.12, count / Math.max(1, text.length)) : 1
      return h('div', {
        role: item.tone === 'error' ? 'alert' : 'status',
        title: t('toastPinHint'),
        onClick: pin,
        style: {
          pointerEvents: 'auto',
          maxWidth: 360,
          minWidth: 180,
          padding: '8px 10px 8px 9px',
          borderRadius: 8,
          border: '1px solid ' + colors.borderStrong,
          borderLeft: '3px solid ' + tone,
          background: 'color-mix(in srgb, ' + colors.layer1 + ' 92%, transparent)',
          backdropFilter: 'blur(9px)',
          WebkitBackdropFilter: 'blur(9px)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.22)',
          color: colors.text,
          cursor: 'pointer',
          opacity,
          transition: 'opacity 80ms linear',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Courier New", monospace',
          boxSizing: 'border-box',
        },
      },
        h('div', { style: { display: 'flex', alignItems: 'flex-start', gap: 7, minWidth: 0 } },
          h('span', { style: { color: tone, fontSize: 12, lineHeight: '18px', flex: 'none', fontWeight: 700 } }, '>'),
          h('div', {
            style: {
              flex: '1 1 auto',
              minWidth: 0,
              fontSize: 12,
              lineHeight: 1.65,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              maxHeight: 150,
              overflowY: 'auto',
            },
          },
            text.slice(0, count),
            phase === 'erasing' || count < text.length || phase === 'waiting'
              ? h('span', {
                style: {
                  display: 'inline-block',
                  width: 6,
                  height: 12,
                  marginLeft: 2,
                  verticalAlign: 'text-bottom',
                  background: tone,
                  animation: 'dsh-localllmtranslate-blink 1s steps(2) infinite',
                },
              })
              : null
          ),
          h('button', {
            type: 'button',
            title: t('dismiss'),
            'aria-label': t('dismiss'),
            onClick: event => {
              event.stopPropagation()
              onDismiss(item.id)
            },
            style: {
              flex: 'none',
              width: 18,
              height: 18,
              padding: 0,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              borderRadius: 4,
              background: 'transparent',
              color: colors.muted,
              cursor: 'pointer',
              fontSize: 13,
              lineHeight: 1,
            },
          }, '×'),
          pinned
            ? h('span', { style: { flex: 'none', fontSize: 9, color: tone, marginTop: 2, letterSpacing: '0.04em' } }, t('toastPinned'))
            : null
        )
      )
    }

    function ToastCenter(props) {
      const { toasts, t, onDone, onDismiss } = props
      if (!toasts || toasts.length === 0) return null
      return h('div', { style: S.toastCenter, 'aria-live': 'polite' },
        toasts.map(item => h(ToastItem, {
          key: item.id,
          item,
          t,
          onDone,
          onDismiss,
        }))
      )
    }


    function SetupWizard(props) {
      const { t, data, onRefresh, showToast, onGoTranslate } = props
      const model = (data && data.model) || {}
      const setup = (data && data.setup) || {}
      const install = setup.install || {}
      const runtimeFound = !!(model.runtime && model.runtime.found)
      const modelFound = !!(model.model && model.model.found)
      const ready = !!model.ready
      const download = model.download || {}
      const [showLog, setShowLog] = useState(false)
      const [busy, setBusy] = useState('')
      if (runtimeFound && modelFound) return null
      const percent = download.total > 0 ? Math.round((download.received / download.total) * 1000) / 10 : 0
      const doneCount = (runtimeFound ? 1 : 0) + (modelFound ? 1 : 0) + (ready ? 1 : 0)
      const startInstall = async () => {
        if (!window.confirm(t('setupInstallConfirm'))) return
        setBusy('install')
        try {
          await requestApi('/api/setup/install', { method: 'POST' })
          showToast(t('setupInstallStarted'), 'info', 6000)
          await onRefresh()
        } catch (failure) {
          showToast(failure.message, 'error', 7000)
        } finally {
          setBusy('')
        }
      }
      const cancelInstall = async () => {
        setBusy('cancel-install')
        try {
          await requestApi('/api/setup?action=cancel', { method: 'POST' })
          await onRefresh()
        } catch (failure) {
          showToast(failure.message, 'error')
        } finally {
          setBusy('')
        }
      }
      const downloadModel = async () => {
        setBusy('download')
        try {
          await requestApi('/api/model?action=download', { method: 'POST' })
          await onRefresh()
        } catch (failure) {
          showToast(failure.message, 'error')
        } finally {
          setBusy('')
        }
      }
      const cancelDownload = async () => {
        setBusy('cancel-download')
        try {
          await requestApi('/api/model?action=cancel-download', { method: 'POST' })
          await onRefresh()
        } catch (failure) {
          showToast(failure.message, 'error')
        } finally {
          setBusy('')
        }
      }
      const rescan = async () => {
        setBusy('rescan')
        try {
          await requestApi('/api/model?action=rescan', { method: 'POST' })
          await onRefresh()
          showToast(t('setupRescan'), 'success')
        } catch (failure) {
          showToast(failure.message, 'error')
        } finally {
          setBusy('')
        }
      }
      const copyCommand = async () => {
        const ok = await copyText(setup.command || '')
        showToast(ok ? t('copied') : t('genericError'), ok ? 'success' : 'error')
      }
      const step = (number, title, done, body) => h('div', {
        style: { ...S.setupStep, ...(done ? S.setupStepDone : null) },
      },
        h('div', { style: S.setupStepHeader },
          h('span', {
            style: {
              ...S.setupNumber,
              color: done ? colors.success : colors.brand,
              background: tint(done ? colors.success : colors.brand, 14),
            },
          }, done ? '✓' : String(number)),
          h('span', { style: S.setupStepTitle }, title),
          done ? h(Badge, { tone: 'success' }, t('setupDone')) : null
        ),
        body
      )
      const runtimeBody = runtimeFound
        ? h('div', { style: S.setupPath }, model.runtime.path)
        : h('div', { style: S.setupStepBody },
          install.active
            ? h('div', { style: { display: 'flex', flexDirection: 'column', gap: 8 } },
              h('div', { style: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 } },
                h(Spinner, { size: 13 }),
                h('span', null, t('setupInstalling'))
              ),
              h('div', { style: { display: 'flex', gap: 8 } },
                h(Button, { variant: 'ghost', size: 'sm', onClick: () => setShowLog(value => !value) },
                  showLog ? t('setupHideLog') : t('setupShowLog')),
                h(Button, { variant: 'danger', size: 'sm', onClick: cancelInstall, disabled: busy !== '' }, t('setupCancel'))
              ),
              showLog ? h('pre', { style: S.log }, install.log || '—') : null
            )
            : h('div', { style: { display: 'flex', flexDirection: 'column', gap: 9 } },
              h('div', { style: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' } },
                setup.canInstall
                  ? h(Button, {
                    variant: 'primary',
                    icon: IconDownload,
                    onClick: startInstall,
                    disabled: busy !== '',
                  }, setup.platform === 'darwin' ? t('setupInstallBrew') : t('setupInstallWinget'))
                  : null,
                h(Button, { variant: 'outline', size: 'sm', icon: IconRefresh, onClick: rescan, disabled: busy !== '' }, t('setupRescan'))
              ),
              h('div', { style: S.setupCommandRow },
                h('span', { style: S.fieldLabel }, t('setupCommand')),
                h('code', { style: S.code }, setup.command || '—'),
                h(Button, { variant: 'ghost', size: 'sm', icon: IconCopy, onClick: copyCommand }, t('setupCopyCommand'))
              ),
              h('div', { style: { display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' } },
                h('a', {
                  href: setup.releasesUrl || 'https://github.com/ggml-org/llama.cpp/releases',
                  target: '_blank',
                  rel: 'noreferrer',
                  style: { color: colors.brand, fontSize: 12, textDecoration: 'none' },
                }, t('setupReleases')),
                setup.canInstall ? null : h('span', { style: S.subtle }, t('setupManualHint'))
              ),
              install.error ? h('div', { style: S.inlineError, role: 'alert' }, install.error) : null,
              install.log && !install.active
                ? h('div', null,
                  h(Button, { variant: 'ghost', size: 'sm', onClick: () => setShowLog(value => !value) },
                    showLog ? t('setupHideLog') : t('setupShowLog')),
                  showLog ? h('pre', { style: S.log }, install.log) : null
                )
                : null
            )
        )
      const modelBody = modelFound
        ? h('div', { style: S.setupPath }, model.model.name + ' · ' + formatBytes(model.model.bytes))
        : h('div', { style: S.setupStepBody },
          download.active
            ? h('div', { style: { display: 'flex', flexDirection: 'column', gap: 7 } },
              h('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: 12, color: colors.muted } },
                h('span', null, t('setupBannerDownloading', { percent })),
                h('span', null, percent + '%')
              ),
              h(ProgressBar, { value: percent }),
              h('div', null, h(Button, { variant: 'danger', size: 'sm', onClick: cancelDownload, disabled: busy !== '' }, t('setupCancelDownload')))
            )
            : h('div', { style: { display: 'flex', flexDirection: 'column', gap: 8 } },
              h('div', { style: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' } },
                h(Button, { variant: 'primary', icon: IconDownload, onClick: downloadModel, disabled: busy !== '' }, t('setupDownload')),
                h(Button, { variant: 'ghost', size: 'sm', icon: IconRefresh, onClick: onRefresh }, t('refresh'))
              ),
              h('span', { style: S.subtle }, t('setupDownloadHint')),
              download.error ? h('div', { style: S.inlineError }, download.error) : null
            )
        )
      const startBody = h('div', { style: S.setupStepBody },
        ready
          ? h('div', { style: S.setupPath }, t('setupReady'))
          : (!runtimeFound || !modelFound)
              ? h('span', { style: S.subtle }, t('setupNeedSteps'))
              : h('div', { style: { display: 'flex', gap: 8, alignItems: 'center' } },
                h(Button, {
                  variant: 'primary',
                  icon: IconPlay,
                  onClick: async () => {
                    setBusy('start')
                    try {
                      await requestApi('/api/model?action=start', { method: 'POST' })
                      await onRefresh()
                    } catch (failure) {
                      showToast(failure.message, 'error')
                    } finally {
                      setBusy('')
                    }
                  },
                  disabled: busy !== '' || model.phase === 'starting',
                }, model.phase === 'starting' ? t('setupStarting') : t('setupStart')),
                model.error ? h('span', { style: S.inlineError }, model.error) : null
              )
      )
      return h('section', { style: S.card },
        h('div', { style: S.cardHeader },
          h('h2', { style: S.h2 }, t('setupTitle')),
          h(Badge, { tone: ready ? 'success' : 'brand' }, t('setupProgress', { done: doneCount, total: 3 }))
        ),
        h('div', { style: { ...S.subtle, marginBottom: 10 } }, t('setupHint')),
        step(1, t('setupStepRuntime'), runtimeFound, runtimeBody),
        step(2, t('setupStepModel'), modelFound, modelBody),
        step(3, t('setupStepStart'), ready, startBody),
        ready
          ? h('div', { style: { display: 'flex', justifyContent: 'flex-end', marginTop: 10 } },
            h(Button, { variant: 'primary', icon: IconTranslate, onClick: onGoTranslate }, t('setupGoTranslate')))
          : null
      )
    }

    function Panel(props) {
      const { ctx } = props
      const t = useT(ctx)
      const [data, setData] = useState(null)
      const [loadError, setLoadError] = useState('')
      const [view, setView] = useState(VIEWS.translate)
      const [historyOpen, setHistoryOpen] = useState(false)
      const [sourceText, setSourceText] = useState('')
      const [sourceView, setSourceView] = useState('edit')
      const [orientation, setOrientation] = useState(() => (
        readPref(PREF_ORIENTATION, 'horizontal') === 'vertical' ? 'vertical' : 'horizontal'
      ))
      const [autoLive, setAutoLive] = useState(() => readPref(PREF_LIVE, 'on') !== 'off')
      const [autoDownloadLocal, setAutoDownloadLocal] = useState(() => readPref(PREF_AUTO_DOWNLOAD, 'on') !== 'off')
      const [autoStartLocal, setAutoStartLocal] = useState(() => readPref(PREF_AUTO_START, 'on') !== 'off')
      const [sourceLang, setSourceLang] = useState('auto')
      const [targetLang, setTargetLang] = useState('auto')
      const [resolved, setResolved] = useState({ source: '', target: '' })
      const [segments, setSegments] = useState([])
      const [targets, setTargets] = useState([])
      const [srtCues, setSrtCues] = useState(null)
      const [activeSeg, setActiveSeg] = useState(-1)
      const [pinnedSeg, setPinnedSeg] = useState(-1)
      const [phase, setPhase] = useState('idle')
      const [currentSeg, setCurrentSeg] = useState(-1)
      const [stage, setStage] = useState('')
      const [segmentErrors, setSegmentErrors] = useState({})
      const [error, setError] = useState('')
      const [toasts, setToasts] = useState([])
      const [toastEnabledLocal, setToastEnabledLocal] = useState(() => readPref(PREF_TOAST_ENABLED, 'on') !== 'off')
      const [doubleClickLocal, setDoubleClickLocal] = useState(() => readPref(PREF_MODEL_DBL, 'on') !== 'off')
      const [lastSavedId, setLastSavedId] = useState('')
      const [lastUsedTerms, setLastUsedTerms] = useState([])
      const [extracting, setExtracting] = useState(false)
      const [busyAction, setBusyAction] = useState('')
      const [settingsDraft, setSettingsDraft] = useState(null)
      const [sidebarCollapsed, setSidebarCollapsed] = useState(() => readPref(PREF_SIDEBAR_COLLAPSED, '0') === '1')
      const [sidebarSideLocal, setSidebarSideLocal] = useState(() => {
        const stored = readPref(PREF_SIDEBAR_SIDE, '')
        return stored === 'left' || stored === 'right' ? stored : ''
      })
      const settingsInitialised = useRef(false)
      const settingsReturnRef = useRef(VIEWS.translate)
      const abortRef = useRef(null)
      const runTranslationRef = useRef(null)
      const liveTimerRef = useRef(null)
      const skipLiveRef = useRef(false)
      const lastKeyRef = useRef('')
      const savedSignatureRef = useRef('')
      const autoDownloadTriedRef = useRef(false)
      const autoStartTriedRef = useRef(false)
      const runtimeSeenRef = useRef(null)
      const fileRef = useRef(null)
      const toastSeqRef = useRef(0)

      const showToast = useCallback((message, tone = 'info', duration = 4200) => {
        if (!toastEnabledLocal) return
        const text = String(message ?? '').trim()
        if (text === '') return
        toastSeqRef.current += 1
        const id = 'toast-' + toastSeqRef.current
        setToasts(previous => [...previous.slice(-3), { id, text, tone, duration }])
      }, [toastEnabledLocal])

      const dismissToast = useCallback(id => {
        setToasts(previous => previous.filter(item => item.id !== id))
      }, [])

      useEffect(() => {
        if (!toastEnabledLocal) setToasts([])
      }, [toastEnabledLocal])

      useEffect(() => () => {
        if (abortRef.current) {
          try { abortRef.current.abort() } catch (error) { /* ignore */ }
        }
      }, [])

      const reloadState = useCallback(async () => {
        try {
          const payload = await requestApi('/api/state', { headers: { accept: 'application/json' } })
          setData(payload)
          setLoadError('')
          return payload
        } catch (failure) {
          setLoadError(failure.message)
          return undefined
        }
      }, [])

      useEffect(() => {
        let alive = true
        let timer
        const tick = async () => {
          if (!alive) return
          const payload = await reloadState()
          if (!alive) return
          const fast = !!payload && (
            (payload.model && (payload.model.download?.active || payload.model.starting))
            || (payload.setup && payload.setup.install && payload.setup.install.active)
          )
          timer = setTimeout(tick, fast ? 1500 : 6000)
        }
        tick()
        return () => {
          alive = false
          clearTimeout(timer)
        }
      }, [reloadState])

      const tipShownRef = useRef(false)
      useEffect(() => {
        if (!data || tipShownRef.current) return
        tipShownRef.current = true
        if (readPref(PREF_TIPS_SEEN, '0') === '1') return
        writePref(PREF_TIPS_SEEN, '1')
        showToast(t('tipLive'), 'info', 6200)
        const timer = setTimeout(() => showToast(t('tipHover'), 'info', 6200), 1100)
        return () => clearTimeout(timer)
      }, [data, showToast, t])

      const status = modelStatusOf(data, t)
      const settings = (data && data.settings) || {}
      const sidebarSide = sidebarSideLocal === 'left' || sidebarSideLocal === 'right'
        ? sidebarSideLocal
        : (settings.sidebarSide === 'left' ? 'left' : 'right')
      const canSaveHistory = !!(data && data.features && data.features.saveHistory)
      const toastEnabled = toastEnabledLocal
      const doubleClickEnabled = doubleClickLocal
      const prefsSyncedRef = useRef(false)
      useEffect(() => {
        if (!data || !data.settings || prefsSyncedRef.current) return
        prefsSyncedRef.current = true
        if (readPref(PREF_TOAST_ENABLED, '') === '' && data.settings.toastEnabled === false) {
          setToastEnabledLocal(false)
        }
        if (readPref(PREF_MODEL_DBL, '') === '' && data.settings.modelStatusDoubleClick === false) {
          setDoubleClickLocal(false)
        }
        if (readPref(PREF_AUTO_DOWNLOAD, '') === '' && data.settings.autoDownloadModel === false) {
          setAutoDownloadLocal(false)
        }
        if (readPref(PREF_AUTO_START, '') === '' && data.settings.autoStartModel === false) {
          setAutoStartLocal(false)
        }
      }, [data])
      const applyToastEnabled = value => {
        const enabled = value !== false
        setToastEnabledLocal(enabled)
        writePref(PREF_TOAST_ENABLED, enabled ? 'on' : 'off')
      }
      const applyDoubleClick = value => {
        const enabled = value !== false
        setDoubleClickLocal(enabled)
        writePref(PREF_MODEL_DBL, enabled ? 'on' : 'off')
      }
      const applyAutoDownload = value => {
        const enabled = value !== false
        setAutoDownloadLocal(enabled)
        writePref(PREF_AUTO_DOWNLOAD, enabled ? 'on' : 'off')
        if (enabled) autoDownloadTriedRef.current = false
      }
      const applyAutoStart = value => {
        const enabled = value !== false
        setAutoStartLocal(enabled)
        writePref(PREF_AUTO_START, enabled ? 'on' : 'off')
        if (enabled) autoStartTriedRef.current = false
      }
      const resetUiPreferences = () => {
        applySidebarSide('right')
        changeOrientation('horizontal')
        toggleLive(true)
        setSidebarCollapsed(false)
        writePref(PREF_SIDEBAR_COLLAPSED, '0')
        applyToastEnabled(true)
        applyDoubleClick(true)
        applyAutoDownload(true)
        applyAutoStart(true)
      }
      const applySidebarSide = value => {
        const side = value === 'left' ? 'left' : 'right'
        setSidebarSideLocal(side)
        writePref(PREF_SIDEBAR_SIDE, side)
      }
      const toggleSidebar = () => {
        setSidebarCollapsed(value => {
          const next = !value
          writePref(PREF_SIDEBAR_COLLAPSED, next ? '1' : '0')
          return next
        })
      }
      const toggleModelFromCard = async () => {
        if (!doubleClickEnabled) return
        const current = data && data.model ? data.model : {}
        if (current.download && current.download.active) {
          showToast(t('settingsDownloading', {
            done: formatBytes(current.download.received),
            total: current.download.total > 0 ? formatBytes(current.download.total) : '…',
          }), 'info')
          return
        }
        if (!current.model || !current.model.found) {
          showToast(t('modelMissingShort'), 'warn')
          return
        }
        if (current.phase === 'starting') {
          showToast(t('modelLoadingToast'), 'info')
          return
        }
        const action = current.ready ? 'stop' : 'start'
        try {
          await requestApi('/api/model?action=' + action, { method: 'POST' })
          showToast(action === 'start' ? t('modelLoadingToast') : t('modelStoppedToast'), action === 'start' ? 'info' : 'success')
          reloadState()
        } catch (failure) {
          showToast(failure.message, 'error')
        }
      }
      useEffect(() => {
        if (!data || !data.settings || settingsInitialised.current) return
        settingsInitialised.current = true
        setSettingsDraft({
          ...data.settings,
          sidebarSide: sidebarSideLocal || data.settings.sidebarSide || 'right',
        })
      }, [data])
      const pendingCount = (data && data.glossary && data.glossary.pending) || 0
      const historyRecords = (data && data.history && data.history.records) || []
      const modelReady = !!(data && data.model && data.model.model && data.model.model.found)
      const modelFound = !!(data && data.model && data.model.model && data.model.model.found)
      const stateLoaded = data !== null

      useEffect(() => {
        if (!data) return
        const found = !!(data.model && data.model.runtime && data.model.runtime.found)
        const previous = runtimeSeenRef.current
        runtimeSeenRef.current = found
        if (previous === false && found) autoStartTriedRef.current = false
      }, [data])

      useEffect(() => {
        if (!data || !autoDownloadLocal || autoDownloadTriedRef.current) return
        if (readPref(PREF_AUTO_DOWNLOAD, '') === '' && data.settings && data.settings.autoDownloadModel === false) return
        const current = data.model || {}
        if (!current.model || current.model.found) return
        if (current.download && current.download.active) {
          autoDownloadTriedRef.current = true
          return
        }
        autoDownloadTriedRef.current = true
        showToast(t('autoDownloadStarting'), 'info', 7000)
        requestApi('/api/model?action=download', { method: 'POST' })
          .then(() => reloadState())
          .catch(failure => {
            showToast(formatTemplate(t('autoDownloadFailed'), { error: failure.message }), 'error', 7000)
          })
      }, [data, autoDownloadLocal, reloadState, showToast, t])

      useEffect(() => {
        if (!data || !autoStartLocal || autoStartTriedRef.current) return
        if (readPref(PREF_AUTO_START, '') === '' && data.settings && data.settings.autoStartModel === false) return
        const current = data.model || {}
        if (!current.runtime || !current.runtime.found) return
        if (!current.model || !current.model.found) return
        if (current.download && current.download.active) return
        if (current.ready || current.phase === 'starting') return
        autoStartTriedRef.current = true
        requestApi('/api/model?action=start', { method: 'POST' })
          .then(() => reloadState())
          .catch(failure => {
            showToast(formatTemplate(t('autoStartFailed'), { error: failure.message }), 'error', 7000)
          })
      }, [data, autoStartLocal, reloadState, showToast, t])

      const onSection = next => {
        if (next === VIEWS.settings && view !== VIEWS.settings) {
          settingsReturnRef.current = view
        }
        setView(next)
        setError('')
      }
      const backFromSettings = () => {
        onSection(settingsReturnRef.current || VIEWS.translate)
      }

      const makeSignature = (list, translated, sourceCode, targetCode) => (
        sourceCode + '|' + targetCode + '|'
        + list.map((text, index) => String(text) + '\u0001' + String(translated[index] || '')).join('\u0002')
      )
      const currentSignature = () => makeSignature(
        segments,
        targets,
        sourceLang,
        targetLang,
      )

      const extractTerms = async (list, translated) => {
        const pairs = list.map((text, index) => ({ source: text, target: translated[index] || '' }))
          .filter(pair => pair.target !== '')
        if (pairs.length === 0) return { added: 0 }
        setExtracting(true)
        try {
          const result = await requestApi('/api/extract', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              pairs,
              sourceLang: resolved.source || sourceLang,
              targetLang: resolved.target || targetLang,
            }),
          })
          if (result && result.added > 0) {
            showToast(formatTemplate(t('glossaryExtracted'), { n: result.added }))
            reloadState()
          }
          return result
        } catch (failure) {
          showToast(failure.message || t('genericError'))
          return { added: 0 }
        } finally {
          setExtracting(false)
        }
      }

      const extractNow = () => extractTerms(segments, targets)

      const saveHistoryNow = async () => {
        if (!canSaveHistory) {
          showToast(t('saveHistoryNeedsRestart'), 'warn', 5200)
          return
        }
        if (!targets.some(text => String(text || '').trim() !== '')) {
          showToast(t('noTranslation'))
          return
        }
        try {
          const payload = await requestApi('/api/history', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              action: 'save',
              record: {
                sourceLang: resolved.source || sourceLang,
                targetLang: resolved.target || targetLang,
                segments: segments.map((text, index) => ({ source: text, target: targets[index] || '' })),
                glossaryUsed: lastUsedTerms,
              },
            }),
          })
          if (payload && payload.record) {
            setLastSavedId(payload.record.id)
            savedSignatureRef.current = makeSignature(segments, targets, sourceLang, targetLang)
            showToast(t('historySaved'))
            reloadState()
          }
        } catch (failure) {
          showToast(failure.message)
        }
      }

      const runTranslation = async options => {
        const live = options && options.live === true
        const settingsNow = (data && data.settings) || {}
        const found = !!(data && data.model && data.model.model && data.model.model.found)
        const list = srtCues ? srtCues.map(cue => cue.text) : splitParagraphs(sourceText)
        if (list.length === 0) {
          if (!live) showToast(t('sourceEmpty'))
          return
        }
        if (!found) {
          if (!live) {
            showToast(t('modelMissingShort'))
            onSection(VIEWS.settings)
          }
          return
        }
        const totalChars = list.reduce((sum, item) => sum + item.length, 0)
        if (list.length > 500 || totalChars > 120000) {
          showToast(list.length > 500 ? t('limitSegments') : t('limitChars'), 'warn')
          return
        }
        const key = makeSignature(list, [], sourceLang, targetLang)
        if (live && key === lastKeyRef.current) return
        lastKeyRef.current = key
        if (liveTimerRef.current) {
          clearTimeout(liveTimerRef.current)
          liveTimerRef.current = null
        }
        if (abortRef.current) {
          try { abortRef.current.abort() } catch (error) { /* ignore */ }
        }
        const controller = new AbortController()
        abortRef.current = controller
        setSegments(list)
        setTargets(new Array(list.length).fill(''))
        setSegmentErrors({})
        setStage('')
        setError('')
        setPhase('translating')
        setCurrentSeg(0)
        setPinnedSeg(-1)
        setActiveSeg(0)
        setLastUsedTerms([])
        if (!live) setLastSavedId('')
        const collected = new Array(list.length).fill('')
        let failed = false
        try {
          const response = await fetch(API + '/api/translate', {
            method: 'POST',
            headers: { 'content-type': 'application/json', accept: 'text/event-stream' },
            body: JSON.stringify({
              segments: list,
              sourceLang,
              targetLang,
              saveHistory: !live,
            }),
            signal: controller.signal,
          })
          if (!response.ok) {
            let detail = 'HTTP ' + response.status
            try {
              const payload = await response.json()
              if (payload && payload.error) detail = payload.error
            } catch (parseError) { /* ignore */ }
            throw new Error(detail)
          }
          if (!response.body) throw new Error('no response body')
          const reader = response.body.getReader()
          const decoder = new TextDecoder()
          let buffer = ''
          let finished = false
          while (!finished) {
            const { value, done } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true }).replace(/\r/g, '')
            let boundary = buffer.indexOf('\n\n')
            while (boundary >= 0) {
              const chunk = buffer.slice(0, boundary)
              buffer = buffer.slice(boundary + 2)
              boundary = buffer.indexOf('\n\n')
              const dataLines = chunk.split('\n').filter(line => line.startsWith('data:')).map(line => line.slice(5).trim())
              if (dataLines.length === 0) continue
              let event
              try {
                event = JSON.parse(dataLines.join('\n'))
              } catch (parseError) {
                continue
              }
              if (event.type === 'status') {
                setStage(event.phase || '')
              } else if (event.type === 'meta') {
                setResolved({ source: event.sourceLang, target: event.targetLang })
                setStage('')
              } else if (event.type === 'segment-start') {
                setCurrentSeg(event.index)
              } else if (event.type === 'delta') {
                collected[event.index] = (collected[event.index] || '') + event.text
                setTargets(previous => {
                  const next = previous.slice()
                  next[event.index] = (next[event.index] || '') + event.text
                  return next
                })
              } else if (event.type === 'segment') {
                collected[event.index] = event.text
                setTargets(previous => {
                  const next = previous.slice()
                  next[event.index] = event.text
                  return next
                })
              } else if (event.type === 'segment-error') {
                setSegmentErrors(previous => ({ ...previous, [event.index]: event.error }))
              } else if (event.type === 'saved') {
                if (live) {
                  // Older hosts ignore saveHistory:false and persist live output.
                  // Remove that record immediately so live mode stays history-free.
                  requestApi('/api/history', {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({ action: 'delete', id: event.id }),
                  }).catch(() => {})
                } else {
                  setLastSavedId(event.id)
                  savedSignatureRef.current = makeSignature(list, collected, sourceLang, targetLang)
                  reloadState()
                }
              } else if (event.type === 'error') {
                failed = true
                setError(event.message)
                setStage('')
              } else if (event.type === 'done') {
                if (Array.isArray(event.glossaryUsed)) setLastUsedTerms(event.glossaryUsed)
              }
            }
          }
          if (failed) {
            setPhase('error')
            setCurrentSeg(-1)
            return
          }
          setPhase('done')
          setStage('')
          setCurrentSeg(-1)
          if (!live) {
            if (settingsNow.autoSaveHistory) {
              savedSignatureRef.current = makeSignature(list, collected, sourceLang, targetLang)
            }
            if (settingsNow.autoExtractGlossary) await extractTerms(list, collected)
          }
        } catch (failure) {
          if (failure && failure.name === 'AbortError') {
            setPhase('idle')
          } else {
            setError(failure && failure.message ? failure.message : String(failure))
            setPhase('error')
            setStage('')
          }
        } finally {
          if (abortRef.current === controller) abortRef.current = null
          setCurrentSeg(-1)
        }
      }

      runTranslationRef.current = runTranslation

      const doTranslate = () => {
        if (liveTimerRef.current) {
          clearTimeout(liveTimerRef.current)
          liveTimerRef.current = null
        }
        runTranslation({ live: false })
      }

      const cancelTranslation = () => {
        if (liveTimerRef.current) {
          clearTimeout(liveTimerRef.current)
          liveTimerRef.current = null
        }
        if (abortRef.current) {
          try { abortRef.current.abort() } catch (error) { /* ignore */ }
          abortRef.current = null
        }
        setPhase('idle')
        setCurrentSeg(-1)
        setStage('')
        const done = targets.filter(text => String(text || '').trim() !== '').length
        if (segments.length > 0 && done < segments.length) {
          showToast(t('cancelledNotice', { done, total: segments.length }), 'warn')
        }
      }

      const toggleLive = value => {
        setAutoLive(value)
        writePref(PREF_LIVE, value ? 'on' : 'off')
      }

      const changeOrientation = value => {
        const next = value === 'horizontal' ? 'horizontal' : 'vertical'
        setOrientation(next)
        writePref(PREF_ORIENTATION, next)
      }

      const swapLanguages = () => {
        const source = resolved.source || sourceLang
        const target = resolved.target || targetLang
        const nextSource = target === 'auto' ? 'zh' : target
        const nextTarget = source === 'auto' ? 'en' : source
        setSourceLang(nextSource)
        setTargetLang(nextTarget)
      }

      useEffect(() => {
        if (!autoLive) {
          if (abortRef.current) {
            try { abortRef.current.abort() } catch (error) { /* ignore */ }
            abortRef.current = null
          }
          return undefined
        }
        if (skipLiveRef.current) {
          skipLiveRef.current = false
          return undefined
        }
        if (sourceText.trim() === '') {
          if (abortRef.current) {
            try { abortRef.current.abort() } catch (error) { /* ignore */ }
            abortRef.current = null
          }
          setPhase('idle')
          setSegments([])
          setTargets([])
          setError('')
          setStage('')
          return undefined
        }
        if (abortRef.current) {
          try { abortRef.current.abort() } catch (error) { /* ignore */ }
          abortRef.current = null
        }
        setError('')
        liveTimerRef.current = setTimeout(() => {
          liveTimerRef.current = null
          if (runTranslationRef.current) runTranslationRef.current({ live: true })
        }, 850)
        return () => {
          if (liveTimerRef.current) {
            clearTimeout(liveTimerRef.current)
            liveTimerRef.current = null
          }
        }
      }, [sourceText, sourceLang, targetLang, autoLive])

      const onPickFile = async event => {
        const file = event.target.files && event.target.files[0]
        event.target.value = ''
        if (!file) return
        try {
          const text = await file.text()
          if (/\.srt$/i.test(file.name)) {
            const cues = parseSrt(text)
            if (cues.length === 0) throw new Error(t('fileReadFailed'))
            setSrtCues(cues)
            setSourceText(cues.map(cue => cue.text).join('\n\n'))
            setSegments(cues.map(cue => cue.text))
            setTargets([])
            setSourceView('edit')
            setPhase('idle')
            showToast(file.name + ' · SRT · ' + cues.length)
          } else {
            setSrtCues(null)
            setSourceText(text)
            setSegments([])
            setTargets([])
            setSourceView('edit')
            setPhase('idle')
          }
        } catch (failure) {
          showToast(failure.message || t('fileReadFailed'))
        }
      }

      const exportPlain = () => downloadText('translation.txt', targets.filter(Boolean).join('\n\n'))
      const exportBilingual = () => downloadText('bilingual.txt', segments.map((text, index) => (
        String(text).trim() + '\n' + String(targets[index] || '').trim()
      )).join('\n\n'))
      const exportSrt = () => {
        if (!srtCues || srtCues.length === 0) return
        downloadText('translation-bilingual.srt', buildSrt(srtCues, targets))
      }

      const loadHistory = useCallback(async id => {
        if (sourceText.trim() !== '' && !window.confirm(t('loadHistoryConfirm'))) return
        setBusyAction('history-load')
        try {
          const payload = await requestApi('/api/history?id=' + encodeURIComponent(id))
          const record = payload.record
          skipLiveRef.current = true
          lastKeyRef.current = ''
          setSourceText(record.segments.map(segment => segment.source).join('\n\n'))
          setSegments(record.segments.map(segment => segment.source))
          setTargets(record.segments.map(segment => segment.target))
          setResolved({ source: record.sourceLang, target: record.targetLang })
          setSourceLang(record.sourceLang)
          setTargetLang(record.targetLang)
          setSrtCues(null)
          setPhase('done')
          setSourceView('compare')
          setView(VIEWS.translate)
          setActiveSeg(-1)
          setPinnedSeg(-1)
          setError('')
          setLastUsedTerms(Array.isArray(record.glossaryUsed) ? record.glossaryUsed : [])
          setLastSavedId(record.id)
          savedSignatureRef.current = makeSignature(
            record.segments.map(segment => segment.source),
            record.segments.map(segment => segment.target),
            record.sourceLang,
            record.targetLang,
          )
        } catch (failure) {
          showToast(failure.message || t('historyLoadFailed'))
        } finally {
          setBusyAction('')
        }
      }, [showToast, t, sourceText])

      const nav = [
        { id: VIEWS.translate, label: t('navTranslate'), icon: IconTranslate },
        { id: VIEWS.glossary, label: t('navGlossary'), icon: IconGlossary, badge: pendingCount },
        { id: VIEWS.history, label: t('navHistory'), icon: IconHistory },
      ]

      return h('div', { style: S.root, className: 'dsh-localllmtranslate' },
        h('div', { style: { ...S.body, position: 'relative' } },
          h('aside', {
            style: {
              ...S.sidebar,
              order: sidebarSide === 'left' ? 0 : 1,
              borderRight: sidebarSide === 'left' ? '1px solid ' + colors.border : 'none',
              borderLeft: sidebarSide === 'right' ? '1px solid ' + colors.border : 'none',
              display: sidebarCollapsed ? 'none' : 'flex',
            },
            'aria-label': t('panelTitle'),
          },
            h('div', { style: S.brandRow },
              h('div', { style: S.brandMark }, h(IconTranslate, { size: 20 })),
              h('div', { style: { display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 } },
                h('div', { style: S.brandTitle }, t('panelTitle')),
                h('div', { style: S.brandSub }, t('panelSubtitle'))
              )
            ),
            h('div', { style: S.navGroup },
              nav.map(item => h('div', { key: item.id },
                h('button', {
                  type: 'button',
                  onClick: () => onSection(item.id),
                  style: {
                    ...S.navItem,
                    ...(view === item.id ? S.navItemActive : null),
                  },
                  'aria-current': view === item.id ? 'page' : undefined,
                },
                  h(item.icon, { size: 17 }),
                  h('span', { style: { flex: '1 1 auto', textAlign: 'left' } }, item.label),
                  item.badge > 0 ? h(Badge, { tone: 'warn' }, String(item.badge)) : null
                ),
                item.id === VIEWS.history
                  ? h('div', null,
                    h('button', {
                      type: 'button',
                      onClick: event => {
                        event.stopPropagation()
                        setHistoryOpen(value => !value)
                      },
                      style: S.submenuToggle,
                      'aria-expanded': historyOpen ? 'true' : 'false',
                      'aria-label': t('historyRecent'),
                    },
                      h('span', { style: { fontSize: 11, color: colors.muted, flex: '1 1 auto', textAlign: 'left' } }, t('historyRecent')),
                      h('span', {
                        style: {
                          transform: historyOpen ? 'rotate(180deg)' : 'none',
                          transition: 'transform 150ms ease',
                          display: 'inline-flex',
                        },
                      }, h(IconChevron, { size: 13 }))
                    ),
                    historyOpen
                      ? h('div', { style: S.submenu },
                        ...(historyRecords.length === 0
                          ? [h('div', { key: 'empty', style: S.submenuEmpty }, t('historyEmpty'))]
                          : [
                            ...historyRecords.slice(0, 6).map(record => h('button', {
                              key: record.id,
                              type: 'button',
                              onClick: () => loadHistory(record.id),
                              style: {
                                ...S.submenuItem,
                                ...(record.id === lastSavedId ? S.submenuItemActive : null),
                              },
                              title: record.title,
                            },
                              h('span', { style: S.submenuItemTitle }, record.title),
                              h('span', { style: S.submenuItemMeta }, formatTime(record.createdAt, t))
                            )),
                            h('button', {
                              key: 'view-all',
                              type: 'button',
                              onClick: () => {
                                setHistoryOpen(false)
                                onSection(VIEWS.history)
                              },
                              style: S.submenuAll,
                            }, t('historyViewAll', { n: historyRecords.length })),
                          ])
                      )
                      : null
                  )
                  : null
              ))
            ),
            h('div', { style: S.sidebarFooter },
              h('button', {
                type: 'button',
                onDoubleClick: toggleModelFromCard,
                onKeyDown: event => {
                  if (!doubleClickEnabled) return
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    toggleModelFromCard()
                  }
                },
                style: {
                  ...S.modelCard,
                  borderColor: colors.border,
                  cursor: doubleClickEnabled ? 'pointer' : 'default',
                },
                title: doubleClickEnabled ? t('modelCardDoubleClickHint') : t('modelCardClickDisabled'),
              },
                h('div', { style: { display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 } },
                  h(StatusDot, { tone: status.tone }),
                  h('span', { style: { fontSize: 12, color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, status.label)
                ),
                h('div', { style: { fontSize: 11, color: colors.muted, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } },
                  !modelReady
                    ? ((data && data.model && data.model.download && data.model.download.active)
                        ? t('settingsDownloading', {
                          done: formatBytes(data.model.download.received),
                          total: data.model.download.total > 0 ? formatBytes(data.model.download.total) : '…',
                        })
                        : t('modelDownloadNeeded'))
                    : (data && data.model && data.model.model ? data.model.model.name : ''))
              ),
              h('button', {
                type: 'button',
                onClick: () => onSection(VIEWS.settings),
                style: {
                  ...S.navItem,
                  ...(view === VIEWS.settings ? S.navItemActive : null),
                  marginTop: 4,
                },
              }, h(IconSettings, { size: 17 }), h('span', { style: { flex: 1, textAlign: 'left' } }, t('navSettings')))
            )
          ),
          h('section', { style: { ...S.main, order: sidebarSide === 'left' ? 1 : 0 } },
            view === VIEWS.translate
              ? h(TranslateView, {
                t,
                sourceView,
                setSourceView,
                orientation,
                autoLive,
                onToggleLive: toggleLive,
                sourceText,
                setSourceText,
                sourceLang,
                setSourceLang,
                targetLang,
                setTargetLang,
                onSwap: swapLanguages,
                resolved,
                segments,
                targets,
                srtCues,
                phase,
                currentSeg,
                activeSeg,
                setActiveSeg,
                pinnedSeg,
                setPinnedSeg,
                error,
                data,
                modelReady,
                modelFound,
                stateLoaded,
                sidebarCollapsed,
                stage,
                segmentErrors,
                onOpenSettings: () => onSection(VIEWS.settings),
                extracting,
                onTranslate: doTranslate,
                onCancel: cancelTranslation,
                onPickFile: () => fileRef.current && fileRef.current.click(),
                onExportPlain: exportPlain,
                onExportBilingual: exportBilingual,
                onExportSrt: exportSrt,
                onSaveHistory: saveHistoryNow,
                canSaveHistory,
                onExtract: extractNow,
                savedNow: savedSignatureRef.current !== '' && savedSignatureRef.current === currentSignature(),
                showToast,
                lastSavedId,
              })
              : null,
            view === VIEWS.glossary
              ? h(GlossaryView, {
                t,
                ctx,
                data,
                reloadState,
                showToast,
                resolved,
                settings,
                sidebarCollapsed,
                onOpenSettings: () => onSection(VIEWS.settings),
              })
              : null,
            view === VIEWS.history
              ? h(HistoryView, {
                t,
                data,
                reloadState,
                showToast,
                onLoad: loadHistory,
                busyAction,
                sidebarCollapsed,
                onOpenSettings: () => onSection(VIEWS.settings),
              })
              : null,
            view === VIEWS.settings
              ? h(SettingsView, {
                t,
                data,
                reloadState,
                showToast,
                busyAction,
                setBusyAction,
                draft: settingsDraft,
                setDraft: setSettingsDraft,
                onSidebarSideChange: applySidebarSide,
                toastEnabled,
                onToastEnabledChange: applyToastEnabled,
                doubleClickEnabled,
                onDoubleClickChange: applyDoubleClick,
                layoutOrientation: orientation,
                onLayoutOrientationChange: changeOrientation,
                autoDownloadModel: autoDownloadLocal,
                onAutoDownloadChange: applyAutoDownload,
                autoStartModel: autoStartLocal,
                onAutoStartChange: applyAutoStart,
                onBack: backFromSettings,
                onResetUi: resetUiPreferences,
                onGoTranslate: () => onSection(VIEWS.translate),
              })
              : null,
            loadError ? h('div', { style: S.loadError }, loadError) : null,
            h(ToastCenter, {
              toasts,
              t,
              onDone: dismissToast,
              onDismiss: dismissToast,
            })
          ),
          h(SidebarToggle, {
            side: sidebarSide,
            collapsed: sidebarCollapsed,
            onToggle: toggleSidebar,
            t,
          })
        ),
        h('input', {
          ref: fileRef,
          type: 'file',
          accept: '.txt,.md,.markdown,.srt,text/plain',
          style: { display: 'none' },
          onChange: onPickFile,
        }),
        h('style', null,
          '@keyframes dsh-localllmtranslate-spin{to{transform:rotate(360deg)}}'
          + '@keyframes dsh-localllmtranslate-blink{50%{opacity:0}}'
          + '.dsh-localllmtranslate button:focus-visible,.dsh-localllmtranslate input:focus-visible,'
          + '.dsh-localllmtranslate select:focus-visible,.dsh-localllmtranslate textarea:focus-visible{'
          + 'outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}'
        )
      )
    }

    /* ------------------------------------------------------------------ */
    /* Translate view                                                     */
    /* ------------------------------------------------------------------ */

    function TranslateView(props) {
      const {
        t, sourceView, setSourceView, orientation, autoLive, onToggleLive, sidebarCollapsed,
        sourceText, setSourceText, sourceLang, setSourceLang, targetLang, setTargetLang, onSwap,
        resolved, segments, targets, srtCues, phase, currentSeg, activeSeg, setActiveSeg, pinnedSeg, setPinnedSeg,
        error, stage, segmentErrors, data, modelReady, modelFound, stateLoaded, extracting,
        onTranslate, onCancel, onPickFile, onExportPlain, onExportBilingual, onExportSrt, onSaveHistory,
        onExtract, savedNow, showToast, onOpenSettings, canSaveHistory,
      } = props
      const translating = phase === 'translating'
      const hasResult = targets.some(text => String(text || '').trim() !== '')
      const effectiveActive = pinnedSeg >= 0 ? pinnedSeg : activeSeg
      const languages = (data && data.languages) || LANGUAGES.map(([code, name]) => ({ code, name }))
      const paragraphs = splitParagraphs(sourceText)
      const charCount = sourceText.length
      const overLimit = paragraphs.length > 500 || charCount > 120000
      const echo = effectiveActive >= 0 ? segments[effectiveActive] : ''
      const textareaRef = useRef(null)
      const hoverTimerRef = useRef(null)
      const horizontal = orientation === 'horizontal'
      const runtimeFound = !!(data && data.model && data.model.runtime && data.model.runtime.found)
      const downloadState = (data && data.model && data.model.download) || {}
      const setupNeeded = !runtimeFound || !modelFound
      const downloadPercent = downloadState.total > 0
        ? Math.round((downloadState.received / downloadState.total) * 1000) / 10
        : 0
      useEffect(() => () => {
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
      }, [])
      const copyAll = async () => {
        const ok = await copyText(targets.filter(Boolean).join('\n\n'))
        showToast(ok ? t('copied') : t('genericError'))
      }
      const clearSource = () => {
        if (sourceText.trim() !== '' && !window.confirm(t('clearSourceConfirm'))) return
        setSourceText('')
        setActiveSeg(-1)
        setPinnedSeg(-1)
      }
      const pinRow = index => {
        if (pinnedSeg === index) {
          setPinnedSeg(-1)
          setActiveSeg(-1)
          return
        }
        setPinnedSeg(index)
        setActiveSeg(index)
      }
      const hoverIn = index => {
        if (hoverTimerRef.current) {
          clearTimeout(hoverTimerRef.current)
          hoverTimerRef.current = null
        }
        setActiveSeg(index)
      }
      const hoverOut = () => {
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
        hoverTimerRef.current = setTimeout(() => {
          hoverTimerRef.current = null
          setActiveSeg(-1)
        }, 140)
      }
      const sourceIndexAtCaret = event => {
        const position = event.currentTarget.selectionStart
        let cursor = 0
        for (let index = 0; index < paragraphs.length; index += 1) {
          const start = sourceText.indexOf(paragraphs[index], cursor)
          if (start < 0) continue
          const end = start + paragraphs[index].length
          if (position <= end) {
            setActiveSeg(index)
            return
          }
          cursor = end
        }
        setActiveSeg(-1)
      }
      const targetRow = (index, text) => {
        const active = effectiveActive === index
        const pinned = pinnedSeg === index
        const streamed = currentSeg === index
        const segmentError = segmentErrors[index]
        const errorMessage = segmentError
          ? (segmentError.message || segmentError.error || String(segmentError))
          : ''
        return h('div', {
          key: index,
          style: {
            ...S.targetRow,
            ...(pinned ? S.targetRowPinned : active ? S.targetRowActive : null),
          },
          onMouseEnter: () => hoverIn(index),
          onMouseLeave: () => hoverOut(),
          onFocus: () => hoverIn(index),
          onBlur: () => hoverOut(),
          onClick: () => pinRow(index),
          onKeyDown: event => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              pinRow(index)
            }
          },
          tabIndex: 0,
          role: 'row',
          'aria-label': t('segment', { n: index + 1 }),
          'aria-current': active ? 'true' : undefined,
          'data-segment': index,
        },
          h('div', { style: { display: 'flex', gap: 8, minWidth: 0 } },
            h('button', {
              type: 'button',
              style: { ...S.segIndexButton, ...(pinned ? S.segIndexButtonPinned : null) },
              title: pinned ? t('unpinSegment') : t('pinSegment'),
              'aria-pressed': pinned ? 'true' : 'false',
              onClick: event => {
                event.stopPropagation()
                pinRow(index)
              },
            }, pinned ? '●' : String(index + 1)),
            errorMessage !== ''
              ? h('div', { style: S.segmentError, title: errorMessage }, t('segmentFailedShort', { n: index + 1 }))
              : String(targets[index] || '') === ''
                ? h('span', { style: S.targetPlaceholder }, streamed ? '…' : (translating ? '' : t('noTranslation')))
                : h('div', { style: S.targetText }, String(targets[index]), streamed ? h('span', { style: S.caret }) : null)
          )
        )
      }
      return h('div', { style: S.view },
        h('header', { style: S.viewHeader },
          h('div', { style: { display: 'flex', alignItems: 'baseline', gap: 10, minWidth: 0 } },
            h('h1', { style: S.h1 }, t('panelTitle'))
          ),
          h('div', { style: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' } },
            sidebarCollapsed
              ? h(IconButton, {
                icon: IconSettings,
                title: t('navSettings'),
                onClick: onOpenSettings,
              })
              : null,
            h('button', {
              type: 'button',
              onClick: () => onToggleLive(!autoLive),
              style: { ...S.liveChip, ...(autoLive ? S.liveChipOn : null) },
              'aria-pressed': autoLive ? 'true' : 'false',
              title: autoLive ? t('liveHint') : t('liveOffHint'),
            },
              h('span', { style: { ...S.liveDot, background: autoLive ? colors.brand : colors.idle } }),
              t('liveTranslate')
            ),
            h(Button, { variant: 'outline', icon: IconUpload, onClick: onPickFile, disabled: translating }, t('importFile'))
          )
        ),
        h('div', { style: S.langBar },
          h('span', { style: S.fieldLabel }, t('sourceLang')),
          h(Select, {
            value: sourceLang,
            onChange: setSourceLang,
            ariaLabel: t('sourceLang'),
            style: { width: 124 },
          },
            h('option', { value: 'auto' }, t('autoDetect')),
            languages.map(language => h('option', { key: language.code, value: language.code }, language.name))
          ),
          h('button', {
            type: 'button',
            title: t('swapLanguages'),
            'aria-label': t('swapLanguages'),
            onClick: onSwap,
            style: S.swapButton,
          }, h(IconSwap, { size: 16 })),
          h('span', { style: S.fieldLabel }, t('targetLang')),
          h(Select, {
            value: targetLang,
            onChange: setTargetLang,
            ariaLabel: t('targetLang'),
            style: { width: 150 },
          },
            h('option', { value: 'auto' }, t('autoTarget')),
            languages.map(language => h('option', { key: language.code, value: language.code }, language.name))
          ),
          h('span', { style: { flex: 1 } }),
          translating
            ? h(Button, { variant: 'danger', icon: IconStop, onClick: onCancel }, t('cancel'))
            : (!stateLoaded
                ? null
                : (modelFound
                    ? h(Button, { variant: 'primary', icon: IconTranslate, onClick: onTranslate, disabled: overLimit }, t('translate'))
                    : h(Button, { variant: 'primary', icon: IconDownload, onClick: onOpenSettings }, t('settingsDownload'))))
        ),
        resolved.source && resolved.target
          ? h('div', { style: S.subtle }, langName(resolved.source) + ' → ' + langName(resolved.target))
          : null,
        setupNeeded
          ? h('div', { style: S.setupBanner, role: 'status' },
            downloadState.active ? h(Spinner, { size: 13 }) : null,
            h('span', null,
              !runtimeFound
                ? t('setupBannerRuntime')
                : (downloadState.active
                    ? t('setupBannerDownloading', { percent: downloadPercent })
                    : t('setupBannerModel'))),
            h('span', { style: { flex: '1 1 auto' } }),
            h(Button, { variant: 'outline', size: 'sm', onClick: onOpenSettings }, t('openSetup'))
          )
          : null,
        translating && stage === 'loading'
          ? h('div', { style: S.loadingBanner, role: 'status' },
            h(Spinner, { size: 14 }),
            h('span', null, t('modelLoadingBanner')),
            h('span', { style: { flex: 1 } }),
            h(Button, { variant: 'ghost', size: 'sm', onClick: onCancel }, t('cancel'))
          )
          : null,
        error ? h('div', { style: S.errorBanner, role: 'alert' }, error) : null,
        h('div', {
          style: {
            ...S.split,
            flexDirection: horizontal ? 'row' : 'column',
          },
        },
          h('section', { style: { ...S.pane, order: horizontal ? 0 : 1 }, 'aria-label': t('sourceTitle') },
            h('div', { style: S.paneHeader },
              h('span', { style: S.paneTitle }, t('sourceTitle')),
              srtCues ? h(Badge, { tone: 'brand' }, 'SRT · ' + srtCues.length) : null,
              h('span', { style: { flex: 1 } }),
              h(Button, {
                variant: 'ghost',
                size: 'sm',
                icon: sourceView === 'edit' ? IconGlossary : IconEdit,
                onClick: () => setSourceView(sourceView === 'edit' ? 'compare' : 'edit'),
              }, sourceView === 'edit' ? t('switchToCompare') : t('switchToEdit')),
              h(Button, { variant: 'ghost', size: 'sm', onClick: clearSource }, t('clear'))
            ),
            sourceView === 'edit'
              ? h('textarea', {
                ref: textareaRef,
                value: sourceText,
                onChange: event => setSourceText(event.target.value),
                onSelect: sourceIndexAtCaret,
                onClick: sourceIndexAtCaret,
                onBlur: () => setActiveSeg(-1),
                placeholder: t('inputPlaceholder'),
                style: S.sourceTextarea,
                spellCheck: false,
              })
              : h('div', { style: S.paneScroll },
                paragraphs.length === 0
                  ? h(EmptyState, { icon: IconFile }, t('inputHint'))
                  : paragraphs.map((text, index) => {
                    const active = effectiveActive === index
                    return h('div', {
                      key: 'source-' + index,
                      style: { ...S.sourceRow, ...(active ? S.sourceRowActive : null) },
                      onMouseEnter: () => hoverIn(index),
                      onMouseLeave: () => hoverOut(),
                      onClick: () => pinRow(index),
                      role: 'row',
                      'aria-label': t('segment', { n: index + 1 }),
                      'aria-current': active ? 'true' : undefined,
                    },
                      h('span', { style: { ...S.segIndexButton, cursor: 'default' } }, String(index + 1)),
                      h('div', { style: S.sourceText }, text)
                    )
                  })
              ),
            h('div', { style: S.paneFooter },
              h('span', { style: { color: overLimit ? colors.error : colors.muted } },
                t('charCount', { n: charCount }) + ' / 120000 · '
                + t('segmentCount', { n: paragraphs.length }) + ' / 500')
            )
          ),
          h('section', { style: { ...S.pane, order: horizontal ? 1 : 0 }, 'aria-label': t('targetTitle') },
            h('div', { style: S.paneHeader },
              h('span', { style: S.paneTitle }, t('targetTitle')),
              resolved.source && resolved.target
                ? h(Badge, { tone: 'brand' }, langName(resolved.source) + ' → ' + langName(resolved.target))
                : null,
              translating ? h(Spinner, { size: 13 }) : null,
              extracting ? h(Badge, { tone: 'warn' }, t('extractingShort')) : null,
              savedNow ? h(Badge, { tone: 'success' }, t('savedState')) : null,
              h('span', { style: { flex: 1 } }),
              h(Button, { variant: 'ghost', size: 'sm', icon: IconCopy, onClick: copyAll, disabled: !hasResult }, t('copy')),
              h(Button, { variant: 'ghost', size: 'sm', onClick: onSaveHistory, disabled: !hasResult || savedNow || translating }, t('saveHistory')),
              h(Button, { variant: 'ghost', size: 'sm', icon: IconSpark, onClick: onExtract, disabled: !hasResult || extracting }, t('extractTerms'))
            ),
            h('div', { style: { ...S.paneBody, position: 'relative' } },
              h('div', { style: { ...S.paneScroll, paddingBottom: pinnedSeg >= 0 ? 96 : 10 } },
                segments.length === 0
                  ? h(EmptyState, { icon: IconTranslate }, t('targetEmpty') + ' · ' + t('targetEmptyHint'))
                  : segments.map((text, index) => targetRow(index, text))
              ),
              echo
                ? h('div', { style: S.sourceEcho, title: echo, 'aria-live': 'polite' },
                  h('div', { style: S.sourceEchoLabel },
                    t('sourceEcho', { n: effectiveActive + 1 })
                    + (pinnedSeg === effectiveActive ? ' · ' + t('sourceEchoPinned') : '')),
                  h('div', { style: S.sourceEchoText }, echo)
                )
                : null
            ),
            hasResult
              ? h('div', { style: S.paneFooter },
                h('span', { style: S.subtle }, t('export') + '：'),
                h('button', { type: 'button', style: S.linkButton, onClick: onExportPlain }, t('exportText')),
                h('span', { style: S.subtle }, '·'),
                h('button', { type: 'button', style: S.linkButton, onClick: onExportBilingual }, t('exportBilingual')),
                srtCues ? h('span', { style: S.subtle }, '·') : null,
                srtCues ? h('button', { type: 'button', style: S.linkButton, onClick: onExportSrt }, t('exportSrt')) : null
              )
              : null
          )
        )
      )
    }

    /* ------------------------------------------------------------------ */
    /* Glossary view                                                      */
    /* ------------------------------------------------------------------ */

    function GlossaryView(props) {
      const { t, data, reloadState, showToast, resolved, settings, sidebarCollapsed, onOpenSettings } = props
      const [entries, setEntries] = useState([])
      const [stats, setStats] = useState({ total: 0, active: 0, pending: 0 })
      const [tab, setTab] = useState('active')
      const [search, setSearch] = useState('')
      const [formOpen, setFormOpen] = useState(false)
      const [editing, setEditing] = useState(null)
      const [draft, setDraft] = useState({ source: '', target: '', scope: 'pair', sourceLang: 'zh', targetLang: 'en', note: '' })
      const [loading, setLoading] = useState(true)
      const [saving, setSaving] = useState(false)
      const [formError, setFormError] = useState('')
      const importRef = useRef(null)
      const defaultSource = (resolved && resolved.source) || 'zh'
      const defaultTarget = (resolved && resolved.target) || 'en'

      const load = useCallback(async () => {
        try {
          const payload = await requestApi('/api/glossary', { headers: { accept: 'application/json' } })
          setEntries(payload.entries || [])
          setStats(payload.stats || { total: 0, active: 0, pending: 0 })
        } catch (failure) {
          showToast(failure.message)
        } finally {
          setLoading(false)
        }
      }, [showToast])

      useEffect(() => { load() }, [load])

      const statsTotal = data && data.glossary ? data.glossary.total : 0
      const statsPending = data && data.glossary ? data.glossary.pending : 0
      useEffect(() => {
        if (statsTotal > 0 || statsPending > 0) load()
      }, [statsTotal, statsPending, load])

      useEffect(() => {
        if (!formOpen) return
        const source = (resolved && resolved.source) || defaultSource
        const target = (resolved && resolved.target) || defaultTarget
        setDraft({
          source: '',
          target: '',
          scope: 'pair',
          sourceLang: source === 'auto' ? 'zh' : source,
          targetLang: target === 'auto' ? 'en' : target,
          note: '',
        })
      }, [formOpen])

      const filtered = entries.filter(entry => {
        if (tab === 'pending' ? entry.status !== 'pending' : entry.status !== 'active') return false
        const query = search.trim().toLowerCase()
        if (query === '') return true
        return entry.source.toLowerCase().includes(query) || entry.target.toLowerCase().includes(query)
      })

      const openAdd = () => {
        setEditing(null)
        setFormError('')
        setFormOpen(true)
      }
      const openEdit = entry => {
        setEditing(entry)
        setFormError('')
        setDraft({
          source: entry.source,
          target: entry.target,
          scope: entry.scope,
          sourceLang: entry.sourceLang === '*' ? defaultSource : entry.sourceLang,
          targetLang: entry.targetLang === '*' ? defaultTarget : entry.targetLang,
          note: entry.note || '',
        })
        setFormOpen(true)
      }

      const save = async () => {
        if (draft.source.trim() === '' || draft.target.trim() === '') {
          setFormError(t('termFieldsRequired'))
          return
        }
        setSaving(true)
        setFormError('')
        try {
          const body = {
            action: editing ? 'update' : 'add',
            entry: {
              id: editing ? editing.id : undefined,
              source: draft.source,
              target: draft.target,
              scope: draft.scope,
              sourceLang: draft.sourceLang,
              targetLang: draft.targetLang,
              note: draft.note,
              status: editing ? editing.status : 'active',
            },
            sourceLang: draft.sourceLang,
            targetLang: draft.targetLang,
          }
          const result = await requestApi('/api/glossary', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(body),
          })
          if (!editing && result && result.created === false) showToast(t('glossaryDuplicate'))
          setFormOpen(false)
          setEditing(null)
          await load()
          if (reloadState) reloadState()
        } catch (failure) {
          setFormError(failure.message)
        } finally {
          setSaving(false)
        }
      }

      const act = async (action, entry, successMessage) => {
        try {
          await requestApi('/api/glossary', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ action, id: entry.id }),
          })
          await load()
          if (reloadState) reloadState()
          if (successMessage) showToast(successMessage)
        } catch (failure) {
          showToast(failure.message)
        }
      }

      const onImportFile = async event => {
        const file = event.target.files && event.target.files[0]
        event.target.value = ''
        if (!file) return
        try {
          const text = await file.text()
          const payload = await requestApi('/api/glossary', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              action: 'import',
              text,
              format: /\.json$/i.test(file.name) ? 'json' : 'csv',
              scope: 'pair',
              sourceLang: defaultSource === 'auto' ? 'zh' : defaultSource,
              targetLang: defaultTarget === 'auto' ? 'en' : defaultTarget,
            }),
          })
          showToast(formatTemplate(t('glossaryImportResult'), { added: payload.added, skipped: payload.skipped }))
          await load()
          if (reloadState) reloadState()
        } catch (failure) {
          showToast(failure.message)
        }
      }

      const exportCsv = () => {
        const anchor = document.createElement('a')
        anchor.href = API + '/api/glossary?format=csv'
        anchor.download = 'glossary.csv'
        anchor.rel = 'noopener'
        anchor.click()
      }

      return h('div', { style: S.view },
        h('header', { style: S.viewHeader },
          h('div', null,
            h('h1', { style: S.h1 }, t('glossaryTitle')),
            h('div', { style: S.subtle },
              t('glossaryScope') + ' · ' + t('glossaryScopePair') + ' / ' + t('glossaryScopeGlobal'))
          ),
          h('div', { style: S.headerActions },
            sidebarCollapsed
              ? h(IconButton, { icon: IconSettings, title: t('navSettings'), onClick: onOpenSettings })
              : null,
            h('div', { style: S.searchBox },
              h(IconSearch, { size: 15 }),
              h('input', {
                value: search,
                onChange: event => setSearch(event.target.value),
                placeholder: t('glossarySearch'),
                'aria-label': t('glossarySearch'),
                style: S.searchInput,
              })
            ),
            h(Button, { variant: 'outline', icon: IconUpload, onClick: () => importRef.current && importRef.current.click() }, t('glossaryImport')),
            h(Button, { variant: 'outline', icon: IconDownload, onClick: exportCsv }, t('glossaryExport')),
            h(Button, { variant: 'primary', icon: IconPlus, onClick: openAdd }, t('glossaryAdd'))
          )
        ),
        h('div', { style: S.tabs },
          h('button', {
            type: 'button',
            onClick: () => setTab('active'),
            style: { ...S.tab, ...(tab === 'active' ? S.tabActive : null) },
          }, t('glossaryAll') + ' ' + stats.active),
          h('button', {
            type: 'button',
            onClick: () => setTab('pending'),
            style: { ...S.tab, ...(tab === 'pending' ? S.tabActive : null) },
          }, t('glossaryPending') + ' ' + stats.pending),
          h('span', { style: { flex: 1 } }),
          tab === 'pending' && stats.pending > 0
            ? h(Button, {
              variant: 'danger',
              size: 'sm',
              onClick: async () => {
                if (!window.confirm(t('clearPendingConfirm'))) return
                try {
                  const result = await requestApi('/api/glossary', {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({ action: 'clear-pending' }),
                  })
                  await load()
                  if (reloadState) reloadState()
                  showToast(t('clearedPending', { n: result.removed || 0 }))
                } catch (failure) {
                  showToast(failure.message)
                }
              },
            }, t('glossaryClearPending'))
            : null
        ),
        formOpen
          ? h('div', { style: S.formCard },
            h('div', { style: S.formGrid },
              h('div', { style: S.formField },
                h('label', { style: S.fieldLabel }, t('glossarySource')),
                h(TextInput, { value: draft.source, onChange: value => setDraft({ ...draft, source: value }), placeholder: 'Hunyuan' })
              ),
              h('div', { style: S.formField },
                h('label', { style: S.fieldLabel }, t('glossaryTarget')),
                h(TextInput, { value: draft.target, onChange: value => setDraft({ ...draft, target: value }), placeholder: 'Hunyuan' })
              ),
              h('div', { style: S.formField },
                h('label', { style: S.fieldLabel }, t('sourceLang')),
                h(Select, {
                  value: draft.sourceLang,
                  onChange: value => setDraft({ ...draft, sourceLang: value }),
                  style: { width: '100%' },
                }, LANGUAGES.map(item => h('option', { key: item[0], value: item[0] }, item[1])))
              ),
              h('div', { style: S.formField },
                h('label', { style: S.fieldLabel }, t('targetLang')),
                h(Select, {
                  value: draft.targetLang,
                  onChange: value => setDraft({ ...draft, targetLang: value }),
                  style: { width: '100%' },
                }, LANGUAGES.map(item => h('option', { key: item[0], value: item[0] }, item[1])))
              ),
              h('div', { style: S.formField },
                h('label', { style: S.fieldLabel }, t('glossaryScope')),
                h(Select, {
                  value: draft.scope,
                  onChange: value => setDraft({ ...draft, scope: value }),
                  style: { width: '100%' },
                },
                  h('option', { value: 'pair' }, t('glossaryScopePair')),
                  h('option', { value: 'global' }, t('glossaryScopeGlobal'))
                )
              ),
              h('div', { style: { ...S.formField, gridColumn: 'span 2' } },
                h('label', { style: S.fieldLabel }, t('glossaryNote')),
                h(TextInput, { value: draft.note, onChange: value => setDraft({ ...draft, note: value }), placeholder: t('glossaryNote') })
              )
            ),
            h('div', { style: S.formActions },
              h(Button, { variant: 'ghost', onClick: () => { setFormOpen(false); setEditing(null) } }, t('cancel')),
              h(Button, { variant: 'primary', icon: IconCheck, onClick: save, disabled: saving }, t('glossarySave'))
            ),
            formError ? h('div', { style: S.inlineError, role: 'alert' }, formError) : null
          )
          : null,
        loading
          ? h('div', { style: S.loadingRow }, h(Spinner, { size: 16 }), t('loading'))
          : filtered.length === 0
            ? h(EmptyState, { icon: IconGlossary }, tab === 'pending' ? t('glossaryPendingEmpty') : t('glossaryEmpty'))
            : h('div', { style: S.table },
              h('div', { style: S.tableHeader },
                h('span', { style: { flex: '1.1 1 0', minWidth: 0 } }, t('glossarySource')),
                h('span', { style: { flex: '1.1 1 0', minWidth: 0 } }, t('glossaryTarget')),
                h('span', { style: { width: 130 } }, t('glossaryPairRange')),
                h('span', { style: { width: 66, textAlign: 'right' } }, t('glossaryHits')),
                h('span', { style: { width: 132, textAlign: 'right' } }, '')
              ),
              filtered.map(entry => h('div', { key: entry.id, style: S.tableRow },
                h('div', { style: { ...S.tableCell, flex: '1.1 1 0' }, title: entry.source }, entry.source),
                h('div', { style: { ...S.tableCell, flex: '1.1 1 0' }, title: entry.target }, entry.target),
                h('div', { style: { width: 130, fontSize: 11.5, color: colors.muted } },
                  entry.scope === 'global' ? t('global') : langName(entry.sourceLang) + '→' + langName(entry.targetLang)),
                h('div', { style: { width: 66, textAlign: 'right', fontSize: 12, color: colors.muted } }, String(entry.hits || 0)),
                h('div', { style: { width: 132, display: 'flex', justifyContent: 'flex-end', gap: 2 } },
                  tab === 'pending' ? h(IconButton, { icon: IconCheck, title: t('glossaryApprove'), onClick: () => act('approve', entry, t('termApproved')) }) : null,
                  tab === 'pending' ? h(IconButton, {
                    icon: IconClose,
                    title: t('glossaryReject'),
                    onClick: () => {
                      if (!window.confirm(t('rejectTermConfirm'))) return
                      act('reject', entry, t('termRejected'))
                    },
                  }) : null,
                  h(IconButton, { icon: IconEdit, title: t('glossaryEdit'), onClick: () => openEdit(entry) }),
                  h(IconButton, {
                    icon: IconTrash,
                    title: t('glossaryDelete'),
                    variant: 'danger',
                    onClick: () => {
                      if (window.confirm(t('deleteTermConfirm'))) act('delete', entry)
                    },
                  })
                )
              ))
            ),
        h('input', {
          ref: importRef,
          type: 'file',
          accept: '.csv,.json,text/csv,application/json',
          style: { display: 'none' },
          onChange: onImportFile,
        })
      )
    }

    /* ------------------------------------------------------------------ */
    /* History view                                                       */
    /* ------------------------------------------------------------------ */

    function HistoryView(props) {
      const { t, data, reloadState, showToast, onLoad, busyAction, sidebarCollapsed, onOpenSettings } = props
      const [records, setRecords] = useState([])
      const [search, setSearch] = useState('')
      const [loading, setLoading] = useState(true)
      const load = useCallback(async () => {
        try {
          const payload = await requestApi('/api/history', { headers: { accept: 'application/json' } })
          setRecords(payload.records || [])
        } catch (failure) {
          showToast(failure.message)
        } finally {
          setLoading(false)
        }
      }, [showToast])
      useEffect(() => { load() }, [load])
      useEffect(() => {
        const total = data && data.history ? data.history.total : undefined
        const firstId = data && data.history && data.history.records && data.history.records[0]
          ? data.history.records[0].id
          : ''
        const currentFirstId = records[0] ? records[0].id : ''
        if ((typeof total === 'number' && total !== records.length) || (firstId !== '' && firstId !== currentFirstId)) load()
      }, [data, load, records])

      const filtered = records.filter(record => {
        const query = search.trim().toLowerCase()
        if (query === '') return true
        return String(record.title || '').toLowerCase().includes(query)
      })
      const remove = async id => {
        if (!window.confirm(t('deleteHistoryConfirm'))) return
        try {
          await requestApi('/api/history', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ action: 'delete', id }),
          })
          await load()
          if (reloadState) reloadState()
        } catch (failure) {
          showToast(failure.message)
        }
      }
      const clearAll = async () => {
        if (!window.confirm(t('historyConfirmClear'))) return
        try {
          await requestApi('/api/history', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ action: 'clear' }),
          })
          await load()
          if (reloadState) reloadState()
        } catch (failure) {
          showToast(failure.message)
        }
      }
      return h('div', { style: S.view },
        h('header', { style: S.viewHeader },
          h('div', null,
            h('h1', { style: S.h1 }, t('historyTitle')),
            h('div', { style: S.subtle }, t('historyCount', { n: records.length }))
          ),
          h('div', { style: S.headerActions },
            sidebarCollapsed
              ? h(IconButton, { icon: IconSettings, title: t('navSettings'), onClick: onOpenSettings })
              : null,
            h('div', { style: S.searchBox },
              h(IconSearch, { size: 15 }),
              h('input', {
                value: search,
                onChange: event => setSearch(event.target.value),
                placeholder: t('historySearch'),
                'aria-label': t('historySearch'),
                style: S.searchInput,
              })
            ),
            h(Button, { variant: 'danger', icon: IconTrash, onClick: clearAll, disabled: records.length === 0 }, t('historyClear'))
          )
        ),
        loading
          ? h('div', { style: S.loadingRow }, h(Spinner, { size: 16 }), t('loading'))
          : filtered.length === 0
            ? h(EmptyState, { icon: IconHistory }, t('historyEmpty'))
            : h('div', { style: S.table },
              filtered.map(record => h('div', { key: record.id, style: S.tableRow },
                h('button', {
                  type: 'button',
                  onClick: () => onLoad(record.id),
                  style: {
                    flex: '1 1 0',
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    border: 'none',
                    background: 'transparent',
                    padding: 0,
                    textAlign: 'left',
                    cursor: 'pointer',
                    color: colors.text,
                    fontFamily: 'inherit',
                  },
                  disabled: busyAction === 'history-load',
                },
                  h('span', { style: { fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, record.title),
                  h('span', { style: { fontSize: 11.5, color: colors.muted } },
                    formatTime(record.createdAt, t) + ' · ' + langName(record.sourceLang) + '→' + langName(record.targetLang)
                    + ' · ' + t('historySegments', { n: record.segmentCount })
                  )
                ),
                h('div', { style: { display: 'flex', gap: 4 } },
                  h(Button, { variant: 'outline', size: 'sm', icon: IconUpload, onClick: () => onLoad(record.id) }, t('historyLoad')),
                  h(IconButton, { icon: IconTrash, variant: 'danger', title: t('historyDelete'), onClick: () => remove(record.id) })
                )
              ))
            )
      )
    }

    /* ------------------------------------------------------------------ */
    /* Settings view                                                      */
    /* ------------------------------------------------------------------ */

    const SETTINGS_FIELDS = [
      ['port', 'settingsPort', 'number'],
      ['ctxSize', 'settingsCtx', 'number'],
      ['gpuLayers', 'settingsGpu', 'number'],
      ['idleUnloadMinutes', 'settingsIdle', 'number'],
      ['temperature', 'settingsTemp', 'number'],
      ['maxTokens', 'settingsMaxTokens', 'number'],
    ]

    const DEFAULT_PUBLIC_SETTINGS = {
      port: 18081,
      ctxSize: 8192,
      gpuLayers: 99,
      idleUnloadMinutes: 10,
      autoExtractGlossary: true,
      autoSaveHistory: true,
      maxHistory: 200,
      maxTermsPerSegment: 24,
      temperature: 0.7,
      topP: 0.6,
      topK: 20,
      repeatPenalty: 1.05,
      maxTokens: 4096,
      overrideEos: true,
      extraArgs: '',
      llamaServerPath: '',
      downloadUrl: 'https://hf-mirror.com/mradermacher/Hy-MT2-1.8B-GGUF/resolve/main/Hy-MT2-1.8B.f16.gguf',
      downloadName: 'Hy-MT2-1.8B.f16.gguf',
      sidebarSide: 'right',
      toastEnabled: true,
      modelStatusDoubleClick: true,
      layoutOrientation: 'horizontal',
      autoDownloadModel: true,
      autoStartModel: true,
    }

    function SettingsView(props) {
      const {
        t, data, reloadState, showToast, draft, setDraft, onSidebarSideChange,
        toastEnabled, onToastEnabledChange, doubleClickEnabled, onDoubleClickChange,
        layoutOrientation, onLayoutOrientationChange, autoDownloadModel, onAutoDownloadChange,
        autoStartModel, onAutoStartChange, onBack, onResetUi, onGoTranslate,
      } = props
      const model = (data && data.model) || {}
      const download = model.download || {}
      const [category, setCategory] = useState('model')
      const [saving, setSaving] = useState(false)
      const [busy, setBusy] = useState('')
      const [showLog, setShowLog] = useState(false)
      const [log, setLog] = useState('')
      const [settingsError, setSettingsError] = useState('')
      const cleanForCompare = value => {
        const copy = { ...(value || {}) }
        delete copy.sidebarSide
        delete copy.toastEnabled
        delete copy.modelStatusDoubleClick
        return copy
      }
      const dirty = (() => {
        if (!draft || !data || !data.settings) return false
        return JSON.stringify(cleanForCompare(draft)) !== JSON.stringify(cleanForCompare(data.settings))
      })()

      const update = (key, value) => setDraft(current => ({ ...(current || {}), [key]: value }))

      const save = async () => {
        if (!draft) return
        setSaving(true)
        setSettingsError('')
        const side = draft.sidebarSide === 'left' ? 'left' : 'right'
        const settingsToSave = {
          ...draft,
          sidebarSide: side,
          toastEnabled: toastEnabled !== false,
          modelStatusDoubleClick: doubleClickEnabled !== false,
          layoutOrientation: layoutOrientation === 'horizontal' ? 'horizontal' : 'vertical',
          autoDownloadModel: autoDownloadModel !== false,
          autoStartModel: autoStartModel !== false,
        }
        try {
          const payload = await requestApi('/api/settings', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ settings: settingsToSave }),
          })
          if (payload.restartRequired) showToast(t('settingsRestartHint'), 'warn')
          else showToast(t('settingsSaved'), 'success')
          if (typeof onSidebarSideChange === 'function') onSidebarSideChange(side)
          if (payload.settings) {
            setDraft({
              ...payload.settings,
              sidebarSide: side,
              toastEnabled: settingsToSave.toastEnabled,
              modelStatusDoubleClick: settingsToSave.modelStatusDoubleClick,
              layoutOrientation: settingsToSave.layoutOrientation,
              autoDownloadModel: settingsToSave.autoDownloadModel,
              autoStartModel: settingsToSave.autoStartModel,
            })
          }
          await reloadState()
        } catch (failure) {
          setSettingsError(failure.message)
        } finally {
          setSaving(false)
        }
      }

      const resetDefaults = async () => {
        if (!window.confirm(t('settingsResetConfirm'))) return
        setSaving(true)
        setSettingsError('')
        try {
          const payload = await requestApi('/api/settings', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ settings: DEFAULT_PUBLIC_SETTINGS }),
          })
          const merged = {
            ...DEFAULT_PUBLIC_SETTINGS,
            ...(payload.settings || {}),
            sidebarSide: 'right',
            toastEnabled: true,
            modelStatusDoubleClick: true,
          }
          setDraft(merged)
          if (typeof onSidebarSideChange === 'function') onSidebarSideChange('right')
          if (typeof onToastEnabledChange === 'function') onToastEnabledChange(true)
          if (typeof onDoubleClickChange === 'function') onDoubleClickChange(true)
          if (typeof onAutoDownloadChange === 'function') onAutoDownloadChange(true)
          if (typeof onAutoStartChange === 'function') onAutoStartChange(true)
          if (typeof onResetUi === 'function') onResetUi()
          if (toastEnabled) showToast(t('settingsResetDone'), 'success')
          await reloadState()
        } catch (failure) {
          setSettingsError(failure.message)
        } finally {
          setSaving(false)
        }
      }

      const modelAction = async (action, successMessage) => {
        setBusy(action)
        setSettingsError('')
        try {
          await requestApi('/api/model?action=' + action, { method: 'POST' })
          if (successMessage) showToast(successMessage, 'success')
          await reloadState()
        } catch (failure) {
          setSettingsError(failure.message)
        } finally {
          setBusy('')
        }
      }
      const loadLog = async () => {
        try {
          const payload = await requestApi('/api/model?action=diagnostics')
          setLog(payload.log || '')
          setShowLog(true)
        } catch (failure) {
          setSettingsError(failure.message)
        }
      }
      const copyPath = async path => {
        const ok = await copyText(path)
        showToast(ok ? t('copied') : t('genericError'), ok ? 'success' : 'error')
      }
      const downloading = !!download.active
      const percent = download.total > 0 ? Math.round((download.received / download.total) * 1000) / 10 : 0
      const modelFound = !!(model.model && model.model.found)
      const tone = model.ready ? 'success' : model.error ? 'error' : model.phase === 'starting' ? 'warn' : 'muted'
      const tabs = [
        ['model', t('settingsTabModel')],
        ['interface', t('settingsTabInterface')],
        ['diagnostics', t('settingsTabDiagnostics')],
      ]

      const modelCard = h('section', { style: S.card },
        h('div', { style: S.cardHeader },
          h('h2', { style: S.h2 }, t('settingsModel')),
          h(Badge, { tone }, model.ready ? t('modelReady') : model.error ? t('modelError') : model.phase === 'starting' ? t('modelStarting') : t('modelIdle'))
        ),
        h('div', { style: S.kvGrid },
          h('span', { style: S.kvKey }, t('settingsModelFile')),
          h('span', { style: S.kvValue },
            modelFound ? model.model.name + ' · ' + formatBytes(model.model.bytes) : t('settingsRuntimeMissing')),
          h('span', { style: S.kvKey }, t('settingsRuntime')),
          h('span', { style: S.kvValue },
            model.runtime && model.runtime.found
              ? model.runtime.path
              : h('span', { style: { color: colors.warn } }, t('settingsRuntimeMissing'))),
          h('span', { style: S.kvKey }, t('settingsPort')),
          h('span', { style: S.kvValue }, String(model.ready || model.phase === 'starting' ? (model.port || '—') : (data?.settings?.port || '—')))
        ),
        model.model && model.model.path
          ? h('div', { style: S.pathRow },
            h('code', { style: S.code }, model.model.path),
            h(Button, { variant: 'ghost', size: 'sm', icon: IconCopy, onClick: () => copyPath(model.model.path) }, t('settingsCopyPath')))
          : null,
        !modelFound
          ? h('div', { style: S.hintBox }, t('settingsModelHint'))
          : null,
        h('div', { style: { ...S.modelActions } },
          !modelFound && !downloading
            ? h(Button, { variant: 'primary', icon: IconDownload, onClick: () => modelAction('download') }, t('settingsDownload'))
            : null,
          downloading
            ? h(Button, { variant: 'danger', icon: IconClose, onClick: () => modelAction('cancel-download') }, t('settingsCancelDownload'))
            : null,
          modelFound && !model.ready && !downloading
            ? h(Button, {
              variant: 'primary',
              icon: IconPlay,
              onClick: () => modelAction('start'),
              disabled: busy !== '' || model.phase === 'starting',
            }, model.phase === 'starting' ? t('settingsStarting') : t('settingsStart'))
            : null,
          model.ready
            ? h(Button, { variant: 'outline', icon: IconStop, onClick: () => modelAction('stop') }, t('settingsStop'))
            : null,
          h(Button, { variant: 'ghost', icon: IconRefresh, onClick: () => modelAction('rescan') }, t('settingsRescan'))
        ),
        downloading
          ? h('div', { style: { marginTop: 12 } },
            h('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: 12, color: colors.muted, marginBottom: 6 } },
              h('span', null, t('settingsDownloading', { done: formatBytes(download.received), total: download.total > 0 ? formatBytes(download.total) : '…' })),
              h('span', null, percent + '%')
            ),
            h(ProgressBar, { value: percent })
          )
          : null,
        download.error ? h('div', { style: S.inlineError }, download.error) : null,
        model.error ? h('div', { style: S.inlineError }, model.error) : null
      )

      const inferenceCard = h('section', { style: S.card },
        h('div', { style: S.cardHeader },
          h('h2', { style: S.h2 }, t('settingsModel') + ' · ' + t('settingsParams')),
          h('span', { style: S.subtle }, t('settingsRestartHint'))
        ),
        draft
          ? h('div', { style: S.settingsGrid },
            h('div', { style: S.groupTitle }, t('settingsGroupRuntime')),
            SETTINGS_FIELDS.map(([key, label, type]) => h('label', { key, style: S.settingsField },
              h('span', { style: S.fieldLabel }, t(label)),
              h(TextInput, {
                type,
                value: draft[key],
                onChange: value => update(key, value === '' ? '' : Number(value)),
              })
            )),
            h('div', { style: S.groupTitle }, t('settingsGroupSource')),
            h('label', { style: S.settingsField },
              h('span', { style: S.fieldLabel }, t('settingsLlamaPath')),
              h(TextInput, { value: draft.llamaServerPath, onChange: value => update('llamaServerPath', value), placeholder: 'C:\\...\\llama-server.exe' })
            ),
            h('label', { style: { ...S.settingsField, gridColumn: 'span 2' } },
              h('span', { style: S.fieldLabel }, t('settingsDownloadUrl')),
              h(TextInput, { value: draft.downloadUrl, onChange: value => update('downloadUrl', value) })
            ),
            h('div', { style: S.groupTitle }, t('settingsGroupBehavior')),
            h('label', { style: { ...S.settingsField, gridColumn: 'span 2' } },
              h('span', { style: S.fieldLabel }, t('settingsExtraArgs')),
              h(TextInput, { value: draft.extraArgs, onChange: value => update('extraArgs', value), placeholder: '--threads 8' })
            ),
            h('div', { style: { ...S.settingsField, gridColumn: 'span 2' } },
              h(Toggle, {
                checked: draft.overrideEos !== false,
                onChange: value => update('overrideEos', value),
                label: t('settingsEos'),
                hint: t('settingsEosHint'),
              }),
              h(Toggle, {
                checked: draft.autoExtractGlossary !== false,
                onChange: value => update('autoExtractGlossary', value),
                label: t('autoExtract'),
              }),
              h(Toggle, {
                checked: draft.autoSaveHistory !== false,
                onChange: value => update('autoSaveHistory', value),
                label: t('autoSave'),
              })
            )
          )
          : h('div', { style: S.loadingRow }, h(Spinner, { size: 14 }), t('loading')),
        h('div', { style: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 } },
          h(Button, { variant: 'primary', onClick: save, disabled: saving || !draft || !dirty },
            dirty ? t('settingsSave') : t('settingsSavedShort'))
        )
      )

      const interfaceCard = h('section', { style: S.card },
        h('div', { style: S.cardHeader },
          h('h2', { style: S.h2 }, t('settingsTabInterface')),
          h('span', { style: S.subtle }, t('settingsInterfaceHint'))
        ),
        draft
          ? h('div', { style: { display: 'flex', flexDirection: 'column', gap: 8 } },
            h('label', { style: { ...S.settingsField, maxWidth: 360 } },
              h('span', { style: S.fieldLabel }, t('settingsLayout')),
              h(Select, {
                value: layoutOrientation === 'horizontal' ? 'horizontal' : 'vertical',
                onChange: value => {
                  update('layoutOrientation', value)
                  if (typeof onLayoutOrientationChange === 'function') onLayoutOrientationChange(value)
                },
                style: { width: '100%' },
              },
                h('option', { value: 'vertical' }, t('layoutVerticalOption')),
                h('option', { value: 'horizontal' }, t('layoutHorizontalOption'))
              ),
              h('span', { style: S.subtle }, t('settingsLayoutHint'))
            ),
            h('label', { style: { ...S.settingsField, maxWidth: 320 } },
              h('span', { style: S.fieldLabel }, t('settingsSidebar')),
              h(Select, {
                value: draft.sidebarSide === 'left' ? 'left' : 'right',
                onChange: value => {
                  update('sidebarSide', value)
                  if (typeof onSidebarSideChange === 'function') onSidebarSideChange(value)
                },
                style: { width: '100%' },
              },
                h('option', { value: 'right' }, t('sidebarRight')),
                h('option', { value: 'left' }, t('sidebarLeft'))
              )
            ),
            h(Toggle, {
              checked: toastEnabled !== false,
              onChange: value => {
                update('toastEnabled', value)
                if (typeof onToastEnabledChange === 'function') onToastEnabledChange(value)
              },
              label: t('settingsToast'),
              hint: t('settingsToastHint'),
            }),
            h(Toggle, {
              checked: doubleClickEnabled !== false,
              onChange: value => {
                update('modelStatusDoubleClick', value)
                if (typeof onDoubleClickChange === 'function') onDoubleClickChange(value)
              },
              label: t('settingsDoubleClick'),
              hint: t('settingsDoubleClickHint'),
            }),
            h(Toggle, {
              checked: autoDownloadModel !== false,
              onChange: value => {
                update('autoDownloadModel', value)
                if (typeof onAutoDownloadChange === 'function') onAutoDownloadChange(value)
              },
              label: t('settingsAutoDownload'),
              hint: t('settingsAutoDownloadHint'),
            }),
            h(Toggle, {
              checked: autoStartModel !== false,
              onChange: value => {
                update('autoStartModel', value)
                if (typeof onAutoStartChange === 'function') onAutoStartChange(value)
              },
              label: t('settingsAutoStart'),
              hint: t('settingsAutoStartHint'),
            })
          )
          : h('div', { style: S.loadingRow }, h(Spinner, { size: 14 }), t('loading')),
        h('div', { style: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 } },
          h(Button, { variant: 'outline', onClick: save, disabled: saving || !draft }, t('settingsSave'))
        )
      )

      const pathsCard = h('section', { style: S.card },
        h('div', { style: S.cardHeader }, h('h2', { style: S.h2 }, t('settingsPaths'))),
        h('div', { style: S.kvGrid },
          h('span', { style: S.kvKey }, t('settingsModelsDir')),
          h('span', { style: S.kvValue }, (data?.paths?.modelsDir || '—')),
          h('span', { style: S.kvKey }, t('settingsStateDir')),
          h('span', { style: S.kvValue }, (data?.paths?.stateDir || '—'))
        ),
        h('div', { style: { display: 'flex', gap: 8, marginTop: 10 } },
          h(Button, { size: 'sm', variant: 'ghost', icon: IconCopy, onClick: () => copyPath(data?.paths?.modelsDir || '') }, t('settingsCopyPath'))
        ),
        h('div', { style: { ...S.subtle, marginTop: 10, lineHeight: 1.7 } }, t('settingsRuntimeHint'))
      )

      const logCard = h('section', { style: S.card },
        h('div', { style: S.cardHeader },
          h('h2', { style: S.h2 }, t('settingsDiagnostics')),
          h('span', { style: S.subtle }, t('settingsShowLog'))
        ),
        h(Button, {
          variant: 'ghost',
          size: 'sm',
          onClick: showLog ? () => setShowLog(false) : loadLog,
        }, showLog ? t('settingsHideLog') : t('settingsShowLog')),
        showLog ? h('pre', { style: S.log }, log || '—') : null
      )

      return h('div', { style: S.view },
        h('header', { style: S.viewHeader },
          h('div', { style: { display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 } },
            h(Button, { variant: 'ghost', icon: IconArrowLeft, onClick: onBack }, t('back')),
            h('h1', { style: S.h1 }, t('settingsTitle'))
          ),
          h('div', { style: S.headerActions },
            h(Button, { variant: 'outline', icon: IconRefresh, onClick: () => reloadState() }, t('refresh')),
            h(Button, { variant: 'outline', icon: IconRefresh, onClick: resetDefaults, disabled: saving }, t('settingsReset'))
          )
        ),
        h('div', { style: S.settingsTabs, role: 'tablist' },
          tabs.map(([id, label]) => h('button', {
            key: id,
            type: 'button',
            role: 'tab',
            'aria-selected': category === id ? 'true' : 'false',
            onClick: () => setCategory(id),
            style: { ...S.settingsTab, ...(category === id ? S.settingsTabActive : null) },
          }, label))
        ),
        settingsError ? h('div', { style: { ...S.inlineError, marginBottom: 10 }, role: 'alert' }, settingsError) : null,
        h('div', { style: S.settingsScroll },
          category === 'model' ? h(SetupWizard, {
            t,
            data,
            onRefresh: reloadState,
            showToast,
            onGoTranslate,
          }) : null,
          category === 'model' ? modelCard : null,
          category === 'model' ? inferenceCard : null,
          category === 'interface' ? interfaceCard : null,
          category === 'diagnostics' ? pathsCard : null,
          category === 'diagnostics' ? logCard : null
        )
      )
    }


    /* ------------------------------------------------------------------ */
    /* Plugin object                                                      */
    /* ------------------------------------------------------------------ */

    const S = {
      root: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: colors.base,
        color: colors.text,
        fontFamily: 'inherit',
        boxSizing: 'border-box',
        position: 'relative',
      },
      body: { flex: '1 1 auto', minHeight: 0, display: 'flex' },
      sidebar: {
        width: 216,
        flex: 'none',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid ' + colors.border,
        background: 'var(--dsw-specific-sidebar-fill)',
        padding: '14px 10px 10px',
        boxSizing: 'border-box',
        minHeight: 0,
      },
      brandRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '2px 8px 14px' },
      brandMark: {
        width: 32,
        height: 32,
        borderRadius: 9,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: tint(colors.brand, 14),
        color: colors.brand,
        flex: 'none',
      },
      brandTitle: { fontSize: 14, fontWeight: 600, letterSpacing: '0.02em' },
      brandSub: { fontSize: 11, color: colors.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
      navGroup: { display: 'flex', flexDirection: 'column', gap: 2, minHeight: 0, overflowY: 'auto', flex: '1 1 auto' },
      navItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        width: '100%',
        height: 34,
        padding: '0 10px',
        border: 'none',
        borderRadius: 8,
        background: 'transparent',
        color: colors.muted,
        fontFamily: 'inherit',
        fontSize: 13,
        cursor: 'pointer',
        boxSizing: 'border-box',
      },
      navItemActive: {
        background: tint(colors.brand, 12),
        color: colors.brand,
        fontWeight: 600,
      },
      submenuToggle: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        width: '100%',
        height: 24,
        padding: '0 10px 0 36px',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        fontFamily: 'inherit',
      },
      submenu: { display: 'flex', flexDirection: 'column', gap: 1, padding: '2px 6px 6px 28px' },
      submenuItem: {
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        padding: '6px 8px',
        border: 'none',
        borderRadius: 6,
        background: 'transparent',
        textAlign: 'left',
        cursor: 'pointer',
        fontFamily: 'inherit',
        color: colors.muted,
        width: '100%',
        boxSizing: 'border-box',
      },
      submenuItemActive: { background: tint(colors.brand, 10), color: colors.text },
      submenuItemTitle: {
        fontSize: 12,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        width: '100%',
      },
      submenuItemMeta: { fontSize: 10.5, color: colors.muted },
      submenuAll: {
        border: 'none',
        background: 'transparent',
        color: colors.brand,
        fontSize: 11.5,
        textAlign: 'left',
        padding: '6px 8px',
        cursor: 'pointer',
        fontFamily: 'inherit',
        width: '100%',
        borderRadius: 6,
      },
      submenuEmpty: { fontSize: 11, color: colors.muted, padding: '4px 8px' },
      sidebarFooter: { flex: 'none', paddingTop: 8, borderTop: '1px solid ' + colors.border, display: 'flex', flexDirection: 'column', gap: 2 },
      modelCard: {
        display: 'flex',
        flexDirection: 'column',
        padding: '9px 10px',
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: colors.border,
        borderRadius: 9,
        background: colors.base,
        cursor: 'pointer',
        fontFamily: 'inherit',
        textAlign: 'left',
        width: '100%',
        boxSizing: 'border-box',
      },
      main: { flex: '1 1 auto', minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', position: 'relative' },
      view: { flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column', padding: '18px 24px 16px', boxSizing: 'border-box' },
      viewHeader: {
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap',
        marginBottom: 12,
      },
      h1: { margin: 0, fontSize: 18, fontWeight: 600, letterSpacing: '0.01em' },
      h2: { margin: 0, fontSize: 14, fontWeight: 600 },
      subtle: { fontSize: 12, color: colors.muted, lineHeight: 1.6 },
      headerActions: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
      langGroup: { display: 'flex', alignItems: 'center', gap: 7 },
      fieldLabel: { fontSize: 11, color: colors.muted, whiteSpace: 'nowrap' },
      metaRow: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 },
      errorBanner: {
        padding: '9px 12px',
        borderRadius: 8,
        border: '1px solid ' + tint(colors.error, 35),
        background: tint(colors.error, 8),
        color: colors.error,
        fontSize: 12.5,
        lineHeight: 1.6,
        marginBottom: 10,
        whiteSpace: 'pre-wrap',
      },
      inputPane: { flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column', gap: 8 },
      inputToolbar: { display: 'flex', alignItems: 'center', gap: 8 },
      textarea: {
        flex: '1 1 auto',
        minHeight: 220,
        width: '100%',
        boxSizing: 'border-box',
        resize: 'none',
        border: '1px solid ' + colors.border,
        borderRadius: 10,
        background: colors.layer1,
        color: colors.text,
        fontFamily: 'inherit',
        fontSize: 14,
        lineHeight: 1.75,
        padding: '14px 16px',
      },
      inputFooter: { display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' },
      comparePane: { flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column' },
      langBar: { display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginTop: 10 },
      swapButton: {
        width: 30,
        height: 30,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid ' + colors.border,
        borderRadius: 8,
        background: colors.layer1,
        color: colors.muted,
        cursor: 'pointer',
        padding: 0,
        flexShrink: 0,
      },
      layoutToggle: {
        display: 'inline-flex',
        border: '1px solid ' + colors.border,
        borderRadius: 8,
        overflow: 'hidden',
        background: colors.layer1,
      },
      layoutButton: {
        width: 30,
        height: 30,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: 'none',
        background: 'transparent',
        color: colors.muted,
        cursor: 'pointer',
        padding: 0,
      },
      layoutButtonActive: {
        background: tint(colors.brand, 14),
        color: colors.brand,
      },
      liveChip: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        height: 30,
        padding: '0 11px',
        borderRadius: 15,
        border: '1px solid ' + colors.border,
        background: colors.layer1,
        color: colors.muted,
        fontSize: 12,
        fontFamily: 'inherit',
        cursor: 'pointer',
      },
      liveChipOn: {
        borderColor: tint(colors.brand, 40),
        background: tint(colors.brand, 10),
        color: colors.brand,
      },
      liveDot: {
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: colors.idle,
        flexShrink: 0,
      },
      split: {
        flex: '1 1 auto',
        minHeight: 0,
        display: 'flex',
        gap: 10,
        marginTop: 10,
      },
      pane: {
        flex: '1 1 0',
        minWidth: 0,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid ' + colors.border,
        borderRadius: 10,
        background: colors.layer1,
        overflow: 'hidden',
      },
      paneHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '7px 10px',
        borderBottom: '1px solid ' + colors.border,
        flex: 'none',
        minHeight: 40,
        boxSizing: 'border-box',
      },
      paneTitle: { fontSize: 12.5, fontWeight: 600, color: colors.text },
      paneBody: { flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column' },
      paneScroll: { flex: '1 1 auto', minHeight: 0, overflowY: 'auto', padding: '10px 12px' },
      paneFooter: {
        flex: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        padding: '6px 10px',
        borderTop: '1px solid ' + colors.border,
        fontSize: 11,
        color: colors.muted,
        flexWrap: 'wrap',
      },
      sourceTextarea: {
        flex: '1 1 auto',
        minHeight: 120,
        width: '100%',
        boxSizing: 'border-box',
        resize: 'none',
        border: 'none',
        background: 'transparent',
        color: colors.text,
        fontFamily: 'inherit',
        fontSize: 14.5,
        lineHeight: 1.8,
        padding: '14px 16px',
      },
      sourceRow: {
        display: 'flex',
        gap: 8,
        padding: '8px 10px',
        borderLeftWidth: 3,
        borderLeftStyle: 'solid',
        borderLeftColor: 'transparent',
        borderRadius: 6,
        cursor: 'pointer',
        marginBottom: 4,
      },
      sourceRowActive: {
        background: tint(colors.brand, 10),
        borderLeftColor: colors.brand,
      },
      sourceText: {
        fontSize: 14,
        lineHeight: 1.8,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        minWidth: 0,
      },
      targetRow: {
        display: 'flex',
        flexDirection: 'column',
        padding: '8px 10px',
        borderLeftWidth: 3,
        borderLeftStyle: 'solid',
        borderLeftColor: 'transparent',
        borderRadius: 6,
        cursor: 'pointer',
        marginBottom: 4,
      },
      targetRowActive: {
        background: tint(colors.brand, 9),
        borderLeftColor: colors.brand,
      },
      targetRowPinned: {
        background: tint(colors.brand, 16),
        borderLeftColor: colors.brand,
        borderLeftWidth: 4,
      },      targetText: {
        fontSize: 14,
        lineHeight: 1.8,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        minWidth: 0,
      },
      sourceEcho: {
        position: 'absolute',
        left: 10,
        right: 10,
        bottom: 10,
        zIndex: 3,
        padding: '8px 10px',
        borderLeft: '3px solid ' + colors.brand,
        borderRadius: 8,
        border: '1px solid ' + colors.borderStrong,
        background: 'color-mix(in srgb, ' + colors.layer1 + ' 80%, transparent)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        boxShadow: '0 8px 22px rgba(0, 0, 0, 0.18)',
        maxHeight: 96,
        overflow: 'hidden',
        pointerEvents: 'none',
      },
      sourceEchoLabel: { fontSize: 10.5, color: colors.muted, marginBottom: 2 },
      sourceEchoText: {
        fontSize: 12,
        lineHeight: 1.6,
        color: colors.text,
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
      },
      linkButton: {
        border: 'none',
        background: 'transparent',
        color: colors.brand,
        fontSize: 11,
        fontFamily: 'inherit',
        cursor: 'pointer',
        padding: 0,
      },
      compareToolbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8, flexWrap: 'wrap' },
      tableHead: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 22,
        padding: '0 14px 6px',
        fontSize: 11,
        color: colors.muted,
        letterSpacing: '0.03em',
      },
      compareScroll: {
        flex: '1 1 auto',
        minHeight: 0,
        overflowY: 'auto',
        border: '1px solid ' + colors.border,
        borderRadius: 10,
        background: colors.layer1,
      },
      row: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 22,
        padding: '11px 14px',
        borderLeft: '3px solid transparent',
        borderBottom: '1px solid ' + colors.border,
        cursor: 'default',
        transition: 'background 100ms ease',
      },
      rowActive: {
        background: tint(colors.brand, 9),
        borderLeftColor: colors.brand,
      },
      rowPinned: {
        background: tint(colors.brand, 16),
        borderLeftColor: colors.brand,
        borderLeftWidth: 4,
      },
      loadingBanner: {
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        padding: '8px 12px',
        borderRadius: 8,
        border: '1px solid ' + tint(colors.brand, 22),
        background: tint(colors.brand, 8),
        color: colors.text,
        fontSize: 12.5,
        marginBottom: 10,
      },
      noticeBanner: {
        padding: '8px 12px',
        borderRadius: 8,
        border: '1px solid ' + tint(colors.warn, 30),
        background: tint(colors.warn, 8),
        color: colors.text,
        fontSize: 12.5,
        lineHeight: 1.6,
        marginBottom: 10,
      },
      segIndexButton: {
        fontSize: 10.5,
        color: colors.muted,
        minWidth: 18,
        height: 18,
        padding: 0,
        border: 'none',
        borderRadius: 4,
        background: 'transparent',
        cursor: 'pointer',
        flex: 'none',
        fontFamily: 'inherit',
      },
      segIndexButtonPinned: {
        color: colors.brand,
        background: tint(colors.brand, 18),
        fontWeight: 700,
      },
      segmentError: {
        fontSize: 12,
        color: colors.error,
        lineHeight: 1.6,
      },
      cellSource: { display: 'flex', gap: 8, minWidth: 0 },
      cellTarget: { minWidth: 0, borderLeft: '1px dashed ' + colors.border, paddingLeft: 16 },
      segIndex: { fontSize: 10.5, color: colors.muted, minWidth: 16, paddingTop: 3, textAlign: 'right', flex: 'none' },
      cellText: { fontSize: 13.5, lineHeight: 1.75, whiteSpace: 'pre-wrap', wordBreak: 'break-word', minWidth: 0 },
      targetPlaceholder: { fontSize: 12, color: colors.muted, fontStyle: 'italic' },
      caret: {
        display: 'inline-block',
        width: 2,
        height: 14,
        background: colors.brand,
        marginLeft: 2,
        verticalAlign: 'text-bottom',
        animation: 'dsh-localllmtranslate-blink 1s steps(2) infinite',
      },
      emptyHint: { padding: '10px 4px 0', fontSize: 12, color: colors.muted },
      tabs: { display: 'flex', alignItems: 'center', gap: 4, borderBottom: '1px solid ' + colors.border, marginBottom: 10 },
      tab: {
        border: 'none',
        background: 'transparent',
        padding: '7px 10px',
        fontFamily: 'inherit',
        fontSize: 12.5,
        color: colors.muted,
        cursor: 'pointer',
        boxShadow: 'inset 0 -2px 0 transparent',
        marginBottom: -1,
      },
      tabActive: { color: colors.brand, boxShadow: 'inset 0 -2px 0 ' + colors.brand, fontWeight: 600 },
      formCard: {
        border: '1px solid ' + colors.border,
        borderRadius: 10,
        background: colors.layer1,
        padding: 14,
        marginBottom: 12,
      },
      formGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 },
      formField: { display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 },
      formActions: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 },
      table: {
        flex: '1 1 auto',
        minHeight: 0,
        overflowY: 'auto',
        border: '1px solid ' + colors.border,
        borderRadius: 10,
        background: colors.layer1,
      },
      tableHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '9px 14px',
        borderBottom: '1px solid ' + colors.border,
        fontSize: 11,
        color: colors.muted,
        position: 'sticky',
        top: 0,
        background: colors.layer1,
        zIndex: 1,
      },
      tableRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '9px 14px',
        borderBottom: '1px solid ' + colors.border,
      },
      tableCell: {
        minWidth: 0,
        fontSize: 13,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      },
      loadingRow: { display: 'flex', alignItems: 'center', gap: 8, padding: 20, fontSize: 12.5, color: colors.muted },
      searchBox: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        height: 34,
        padding: '0 10px',
        border: '1px solid ' + colors.border,
        borderRadius: 8,
        background: colors.base,
        color: colors.muted,
      },
      searchInput: {
        border: 'none',
        background: 'transparent',
        color: colors.text,
        fontFamily: 'inherit',
        fontSize: 13,
        width: 170,
      },
      toast: {
        position: 'absolute',
        left: '50%',
        bottom: 22,
        transform: 'translateX(-50%)',
        maxWidth: '70%',
        padding: '9px 14px',
        borderRadius: 9,
        background: colors.layer2,
        border: '1px solid ' + colors.borderStrong,
        color: colors.text,
        fontSize: 12.5,
        boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
        zIndex: 5,
        whiteSpace: 'pre-wrap',
        textAlign: 'center',
      },
      loadError: {
        position: 'absolute',
        left: 24,
        right: 24,
        bottom: 12,
        padding: '6px 10px',
        borderRadius: 8,
        background: tint(colors.error, 10),
        color: colors.error,
        fontSize: 11.5,
      },
      setupStep: {
        borderTop: '1px solid ' + colors.border,
        padding: '10px 0',
      },
      setupStepDone: { opacity: 0.9 },
      setupStepHeader: { display: 'flex', alignItems: 'center', gap: 9 },
      setupNumber: {
        width: 22,
        height: 22,
        borderRadius: '50%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 11,
        fontWeight: 700,
        flexShrink: 0,
      },
      setupStepTitle: { fontSize: 13, fontWeight: 600, flex: '1 1 auto' },
      setupStepBody: { marginTop: 8, paddingLeft: 31, display: 'flex', flexDirection: 'column', gap: 7 },
      setupPath: {
        marginTop: 6,
        paddingLeft: 31,
        fontSize: 11.5,
        color: colors.muted,
        overflowWrap: 'anywhere',
        lineHeight: 1.6,
      },
      setupCommandRow: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
      setupBanner: {
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        padding: '8px 12px',
        marginBottom: 10,
        borderRadius: 8,
        border: '1px solid ' + tint(colors.brand, 24),
        background: tint(colors.brand, 8),
        color: colors.text,
        fontSize: 12.5,
      },
      settingsScroll: { flex: '1 1 auto', minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingRight: 4 },
      settingsTabs: {
        display: 'flex',
        gap: 4,
        borderBottom: '1px solid ' + colors.border,
        marginBottom: 12,
        flex: 'none',
      },
      settingsTab: {
        border: 'none',
        background: 'transparent',
        padding: '8px 12px',
        fontFamily: 'inherit',
        fontSize: 12.5,
        color: colors.muted,
        cursor: 'pointer',
        boxShadow: 'inset 0 -2px 0 transparent',
        marginBottom: -1,
      },
      settingsTabActive: {
        color: colors.brand,
        boxShadow: 'inset 0 -2px 0 ' + colors.brand,
        fontWeight: 600,
      },
      toastCenter: {
        position: 'absolute',
        right: 14,
        bottom: 14,
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 8,
        maxWidth: 380,
        pointerEvents: 'none',
      },
      card: {
        border: '1px solid ' + colors.border,
        borderRadius: 10,
        background: colors.layer1,
        padding: 14,
      },
      cardHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 },
      kvGrid: {
        display: 'grid',
        gridTemplateColumns: '120px minmax(0, 1fr)',
        gap: '7px 10px',
        fontSize: 12.5,
        alignItems: 'start',
      },
      kvKey: { color: colors.muted },
      kvValue: { minWidth: 0, overflowWrap: 'anywhere', color: colors.text },
      pathRow: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 },
      code: {
        flex: '1 1 auto',
        minWidth: 0,
        padding: '6px 8px',
        borderRadius: 6,
        background: colors.base,
        border: '1px solid ' + colors.border,
        fontSize: 11.5,
        color: colors.muted,
        overflowWrap: 'anywhere',
      },
      hintBox: {
        marginTop: 10,
        padding: '8px 10px',
        borderRadius: 8,
        background: tint(colors.brand, 7),
        border: '1px solid ' + tint(colors.brand, 18),
        color: colors.text,
        fontSize: 12,
        lineHeight: 1.6,
      },
      modelActions: { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 },
      inlineError: {
        marginTop: 10,
        padding: '7px 10px',
        borderRadius: 7,
        background: tint(colors.error, 8),
        border: '1px solid ' + tint(colors.error, 25),
        color: colors.error,
        fontSize: 11.5,
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
      },
      log: {
        margin: '8px 0 0',
        padding: 10,
        maxHeight: 220,
        overflow: 'auto',
        borderRadius: 8,
        background: colors.base,
        border: '1px solid ' + colors.border,
        fontSize: 11,
        lineHeight: 1.5,
        color: colors.muted,
        whiteSpace: 'pre-wrap',
      },
      settingsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 },
      groupTitle: {
        gridColumn: '1 / -1',
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.04em',
        color: colors.muted,
        paddingTop: 6,
        borderTop: '1px solid ' + colors.border,
        marginTop: 2,
      },
      settingsField: { display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 },
    }

    function PanelShell(props) {
      class Boundary extends React.Component {
        constructor(innerProps) {
          super(innerProps)
          this.state = { error: null }
        }
        static getDerivedStateFromError(error) {
          return { error }
        }
        componentDidCatch(error, info) {
          if (typeof console !== 'undefined' && console.error) {
            console.error('[dsh-localllmtranslate] panel render failed', error, info)
          }
        }
        render() {
          if (this.state.error) {
            return h('div', {
              style: {
                padding: 28,
                color: 'var(--dsw-alias-state-error-primary)',
                fontSize: 13,
                lineHeight: 1.7,
              },
            }, '翻译面板渲染失败：' + String(this.state.error && this.state.error.message ? this.state.error.message : this.state.error))
          }
          return this.props.children
        }
      }
      return h(Boundary, null, h(Panel, props))
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        const translate = key => {
          const locale = typeof ctx.get === 'function' ? ctx.get('locale') : undefined
          if (locale && typeof locale.bind === 'function') {
            try {
              const value = locale.bind(UI_NS)(key)
              if (typeof value === 'string' && value !== key) return value
            } catch (error) { /* fall through */ }
          }
          return zhDict[key] ?? enDict[key] ?? key
        }
        const registerLocales = localeCtx => {
          const locale = localeCtx && localeCtx.locale !== undefined
            ? localeCtx.locale
            : (localeCtx && typeof localeCtx.get === 'function' ? localeCtx.get('locale') : undefined)
          if (!locale || typeof locale.register !== 'function') return
          localeCtx.effect(() => locale.register(UI_NS, 'zh', zhDict), UI_NS + ': zh')
          localeCtx.effect(() => locale.register(UI_NS, 'en', enDict), UI_NS + ': en')
        }
        if (typeof ctx.inject === 'function') {
          ctx.inject(['locale'], registerLocales)
        }
        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist',
          id: 'localllmtranslate',
          order: 27,
          label: () => translate('panelTitle'),
        }, Icon))
        ctx.slots.inject('main', () => ctx.slots.register({
          name: 'main',
          key: 'localllmtranslate',
          locale: UI_NS,
        }, PanelShell))
      },
    }
  },
})
