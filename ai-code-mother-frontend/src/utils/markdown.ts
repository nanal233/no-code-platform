import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js/lib/core'
import xml from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'
import javascript from 'highlight.js/lib/languages/javascript'

hljs.registerLanguage('html', xml)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('css', css)
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('js', javascript)

// 关闭原始 HTML 解析，避免 AI 输出被当作可执行 HTML 注入到页面中
const md: InstanceType<typeof MarkdownIt> = new MarkdownIt({
  html: false,
  breaks: true,
  linkify: true,
  highlight(code, lang) {
    const language = hljs.getLanguage(lang) ? lang : ''
    const highlighted = language
      ? hljs.highlight(code, { language }).value
      : md.utils.escapeHtml(code)
    return `<pre class="hljs"><code>${highlighted}</code></pre>`
  },
})

export function renderMarkdown(content: string): string {
  return md.render(content ?? '')
}
