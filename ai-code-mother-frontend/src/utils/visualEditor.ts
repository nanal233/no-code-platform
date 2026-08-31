import { onMounted, onUnmounted, ref, watch, type Ref } from 'vue'

export interface SelectedElementInfo {
  selector: string
  tagName: string
  id?: string
  className?: string
  textContent?: string
}

// 与注入脚本约定的消息标识，避免和页面上其他 postMessage 消息混淆
const MESSAGE_SOURCE = 'ai-code-mother-visual-editor'
const HOVER_CLASS = '__visual-editor-hover__'
const SELECTED_CLASS = '__visual-editor-selected__'

/**
 * 注入到预览 iframe 内部执行的脚本源码。
 * 该脚本运行在 iframe 自身的 window/document 上：监听鼠标悬浮/点击，
 * 为对应元素添加边框样式，并通过 postMessage 把选中的元素信息传给父页面。
 * 由于预览站点与主站同域（详见 vite.config.ts 的 /api 代理），父页面可以安全注入并通信。
 */
function buildInjectedScript(): string {
  return `(function () {
  if (window.__visualEditorInjected) {
    return
  }
  window.__visualEditorInjected = true

  var SOURCE = ${JSON.stringify(MESSAGE_SOURCE)}
  var HOVER_CLASS = ${JSON.stringify(HOVER_CLASS)}
  var SELECTED_CLASS = ${JSON.stringify(SELECTED_CLASS)}
  var enabled = false
  var hoveredEl = null
  var selectedEl = null

  var style = document.createElement('style')
  style.textContent =
    '.' + HOVER_CLASS + '{outline:2px dashed #1677ff !important;outline-offset:-2px !important;cursor:pointer !important;}' +
    '.' + SELECTED_CLASS + '{outline:2px solid #f5222d !important;outline-offset:-2px !important;}'
  document.head.appendChild(style)

  function cleanClassName(el) {
    if (!el.className || typeof el.className !== 'string') return ''
    return el.className
      .split(/\\s+/)
      .filter(function (c) { return c && c !== HOVER_CLASS && c !== SELECTED_CLASS })
      .join(' ')
  }

  function buildSelector(el) {
    var path = []
    var node = el
    while (node && node.nodeType === 1 && node.tagName.toLowerCase() !== 'html') {
      var part = node.tagName.toLowerCase()
      var cls = cleanClassName(node)
      if (cls) part += '.' + cls.split(/\\s+/).join('.')
      var parent = node.parentElement
      if (parent) {
        var siblings = Array.prototype.filter.call(parent.children, function (child) {
          return child.tagName === node.tagName
        })
        if (siblings.length > 1) part += ':nth-of-type(' + (siblings.indexOf(node) + 1) + ')'
      }
      path.unshift(part)
      node = node.parentElement
    }
    return path.join(' > ')
  }

  function handleMouseOver(e) {
    if (!enabled) return
    var target = e.target
    if (!(target instanceof Element) || target === hoveredEl) return
    if (hoveredEl && hoveredEl !== selectedEl) hoveredEl.classList.remove(HOVER_CLASS)
    hoveredEl = target
    if (hoveredEl !== selectedEl) hoveredEl.classList.add(HOVER_CLASS)
  }

  function handleMouseOut(e) {
    if (!enabled) return
    var target = e.target
    if (target instanceof Element && target !== selectedEl) target.classList.remove(HOVER_CLASS)
  }

  function handleClick(e) {
    if (!enabled) return
    var target = e.target
    if (!(target instanceof Element)) return
    e.preventDefault()
    e.stopPropagation()
    if (selectedEl) selectedEl.classList.remove(SELECTED_CLASS)
    selectedEl = target
    selectedEl.classList.remove(HOVER_CLASS)
    selectedEl.classList.add(SELECTED_CLASS)
    window.parent.postMessage({
      source: SOURCE,
      type: 'element-selected',
      data: {
        selector: buildSelector(target),
        tagName: target.tagName.toLowerCase(),
        id: target.id || undefined,
        className: cleanClassName(target) || undefined,
        textContent: (target.textContent || '').trim().slice(0, 60) || undefined,
      },
    }, window.location.origin)
  }

  function clearSelection() {
    if (selectedEl) {
      selectedEl.classList.remove(SELECTED_CLASS)
      selectedEl = null
    }
    if (hoveredEl) {
      hoveredEl.classList.remove(HOVER_CLASS)
      hoveredEl = null
    }
  }

  window.addEventListener('message', function (e) {
    if (!e.data || e.data.source !== SOURCE) return
    if (e.data.type === 'set-edit-mode') {
      enabled = !!e.data.enabled
      if (!enabled) clearSelection()
    } else if (e.data.type === 'clear-selection') {
      clearSelection()
    }
  })

  document.addEventListener('mouseover', handleMouseOver, true)
  document.addEventListener('mouseout', handleMouseOut, true)
  document.addEventListener('click', handleClick, true)
})();`
}

/**
 * 可视化编辑：在对话页的预览 iframe 上启用元素悬浮高亮 + 点击选中，
 * 并将选中的元素信息同步到父页面，供拼接进发送给 AI 的提示词。
 */
export function useVisualEditor(iframeEl: Ref<HTMLIFrameElement | undefined>) {
  const editMode = ref(false)
  const selectedElement = ref<SelectedElementInfo | null>(null)

  const postToIframe = (payload: Record<string, unknown>) => {
    const win = iframeEl.value?.contentWindow
    if (!win) {
      return
    }
    try {
      win.postMessage({ source: MESSAGE_SOURCE, ...payload }, win.location.origin)
    } catch {
      // 预览地址与主站不同域时无法通信，静默忽略
    }
  }

  const injectScript = () => {
    try {
      const doc = iframeEl.value?.contentDocument
      if (!doc) {
        return
      }
      const script = doc.createElement('script')
      script.textContent = buildInjectedScript()
      doc.documentElement.appendChild(script)
      script.remove()
      // 注入后立即同步当前编辑模式状态（应对预览刷新/重新生成后的重新挂载）
      postToIframe({ type: 'set-edit-mode', enabled: editMode.value })
    } catch {
      // 同源限制之外的异常场景（如预览尚未加载完成），静默忽略
    }
  }

  const handleIframeLoad = () => {
    injectScript()
  }

  const handleMessage = (event: MessageEvent) => {
    if (iframeEl.value && event.source !== iframeEl.value.contentWindow) {
      return
    }
    if (!event.data || event.data.source !== MESSAGE_SOURCE) {
      return
    }
    if (event.data.type === 'element-selected') {
      selectedElement.value = event.data.data
    }
  }

  const enterEditMode = () => {
    editMode.value = true
    postToIframe({ type: 'set-edit-mode', enabled: true })
  }

  const exitEditMode = () => {
    editMode.value = false
    selectedElement.value = null
    postToIframe({ type: 'set-edit-mode', enabled: false })
  }

  const toggleEditMode = () => {
    if (editMode.value) {
      exitEditMode()
    } else {
      enterEditMode()
    }
  }

  const clearSelection = () => {
    selectedElement.value = null
    postToIframe({ type: 'clear-selection' })
  }

  watch(
    iframeEl,
    (el, oldEl) => {
      oldEl?.removeEventListener('load', handleIframeLoad)
      el?.addEventListener('load', handleIframeLoad)
    },
    { immediate: true },
  )

  onMounted(() => {
    window.addEventListener('message', handleMessage)
  })

  onUnmounted(() => {
    window.removeEventListener('message', handleMessage)
    iframeEl.value?.removeEventListener('load', handleIframeLoad)
  })

  return {
    editMode,
    selectedElement,
    enterEditMode,
    exitEditMode,
    toggleEditMode,
    clearSelection,
  }
}

/**
 * 将选中的元素信息格式化后追加到用户输入的提示词中
 */
export function appendSelectedElementToPrompt(prompt: string, info: SelectedElementInfo): string {
  const lines = [`标签：<${info.tagName}>`]
  if (info.id) {
    lines.push(`id：${info.id}`)
  }
  if (info.className) {
    lines.push(`class：${info.className}`)
  }
  lines.push(`选择器：${info.selector}`)
  if (info.textContent) {
    lines.push(`文本内容：${info.textContent}`)
  }
  return `${prompt}\n\n[用户在页面上选中了以下元素，请针对该元素进行修改]\n${lines.join('\n')}`
}
