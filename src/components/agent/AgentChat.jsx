import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Send, Square, Bot, ChevronDown, ChevronRight, Wrench,
  Loader2, Sparkles, Copy, Check, Trash2, ArrowDown,
  Database, Search, GitBranch, FileText, Zap, Clock,
  BarChart3, DollarSign, ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import useAppStore from '../../store/useAppStore'
import './AgentChat.css'

const DEFAULT_BACKEND = 'http://localhost:3001'

/* ── Tool icon map ────────────────────────────────────────────────────────── */
const TOOL_ICONS = {
  search_graph: Search,
  run_query: Database,
  read_reference: FileText,
  get_node_detail: GitBranch,
  default: Wrench,
}
function getToolIcon(name) {
  const key = Object.keys(TOOL_ICONS).find(k => name?.includes(k))
  return TOOL_ICONS[key] || TOOL_ICONS.default
}

/* ── Markdown renderer ────────────────────────────────────────────────────── */
function renderMarkdown(text) {
  if (!text) return ''
  let html = text
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) =>
      `<pre class="ac-code-block"><code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`)
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="ac-inline-code">$1</code>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Headings
    .replace(/^#### (.+)$/gm, '<h4 class="ac-h4">$1</h4>')
    .replace(/^### (.+)$/gm, '<h3 class="ac-h3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="ac-h2">$1</h2>')
    // HR
    .replace(/^---$/gm, '<hr class="ac-hr"/>')
    // Tables
    .replace(/^\|(.+)\|$/gm, (match, content) => {
      const cells = content.split('|').map(c => c.trim())
      if (cells.every(c => /^[-:]+$/.test(c))) return ''
      const isHeader = cells.some(c => /^\*\*/.test(c))
      const tag = isHeader ? 'th' : 'td'
      const row = cells.map(c => {
        const clean = c.replace(/\*\*/g, '')
        return `<${tag} class="ac-table-cell">${clean}</${tag}>`
      }).join('')
      return `<tr>${row}</tr>`
    })
    // Lists
    .replace(/^- (.+)$/gm, '<li class="ac-li">$1</li>')
    .replace(/^\d+\.\s+(.+)$/gm, '<li class="ac-oli">$1</li>')
    // Line breaks
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>')

  // Wrap consecutive <tr>
  html = html.replace(/((?:<tr>.*?<\/tr><br\/>?)+)/g, (m) => {
    return `<table class="ac-table">${m.replace(/<br\/?>/g, '')}</table>`
  })
  // Wrap consecutive <li>
  html = html.replace(/((?:<li class="ac-li">.*?<\/li><br\/>?)+)/g, (m) => {
    return `<ul class="ac-ul">${m.replace(/<br\/?>/g, '')}</ul>`
  })
  html = html.replace(/((?:<li class="ac-oli">.*?<\/li><br\/>?)+)/g, (m) => {
    return `<ol class="ac-ol">${m.replace(/<br\/?>/g, '')}</ol>`
  })

  return html
}

/* ── Tool Call Card ────────────────────────────────────────────────────────── */
function ToolCallCard({ tool, isRunning }) {
  const [expanded, setExpanded] = useState(false)
  const Icon = getToolIcon(tool.name)

  return (
    <div className={`tc-card ${isRunning ? 'tc-card--running' : 'tc-card--done'}`}>
      <button className="tc-header" onClick={() => setExpanded(!expanded)}>
        <div className="tc-left">
          {isRunning ? (
            <Loader2 size={14} className="tc-spinner" />
          ) : (
            <Icon size={14} className="tc-icon" />
          )}
          <span className="tc-name">{tool.displayName || tool.name}</span>
        </div>
        <div className="tc-right">
          {isRunning && <span className="tc-badge">Running</span>}
          {!isRunning && tool.result && <span className="tc-badge tc-badge--done">Done</span>}
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
      </button>
      {expanded && (
        <div className="tc-body">
          {tool.input && (
            <div className="tc-section">
              <span className="tc-label">Input</span>
              <pre className="tc-pre">{JSON.stringify(tool.input, null, 2)}</pre>
            </div>
          )}
          {tool.result && (
            <div className="tc-section">
              <span className="tc-label">Result</span>
              <pre className="tc-pre">{tool.result}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Token Usage Card ─────────────────────────────────────────────────────── */
function TokenUsageCard({ tokenUsage }) {
  if (!tokenUsage) return null

  const { inputTokens, outputTokens, totalTokens, cacheCreationTokens, cacheReadTokens, durationMs } = tokenUsage

  // Pricing: Claude Sonnet — $3/M input, $15/M output
  const inputCost  = (inputTokens / 1_000_000) * 3
  const outputCost = (outputTokens / 1_000_000) * 15
  const totalCost  = inputCost + outputCost

  const fmt = (n) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toLocaleString()
  const fmtCost = (c) => c < 0.001 ? '<$0.001' : `$${c.toFixed(4)}`
  const fmtDuration = (ms) => {
    if (!ms) return null
    return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`
  }

  return (
    <div className="ac-token-card">
      <div className="ac-token-header">
        <BarChart3 size={13} className="ac-token-icon" />
        <span className="ac-token-title">Token Consumption</span>
        {durationMs && (
          <span className="ac-token-duration">
            <Clock size={11} />
            {fmtDuration(durationMs)}
          </span>
        )}
      </div>
      <div className="ac-token-grid">
        <div className="ac-token-stat">
          <span className="ac-token-stat-label">
            <ArrowUpRight size={11} className="ac-token-in" />
            Input
          </span>
          <span className="ac-token-stat-value">{fmt(inputTokens)}</span>
        </div>
        <div className="ac-token-stat">
          <span className="ac-token-stat-label">
            <ArrowDownRight size={11} className="ac-token-out" />
            Output
          </span>
          <span className="ac-token-stat-value">{fmt(outputTokens)}</span>
        </div>
        <div className="ac-token-stat">
          <span className="ac-token-stat-label">Total</span>
          <span className="ac-token-stat-value ac-token-stat-value--total">{fmt(totalTokens || (inputTokens + outputTokens))}</span>
        </div>
        <div className="ac-token-stat">
          <span className="ac-token-stat-label">
            <DollarSign size={11} className="ac-token-cost" />
            Est. Cost
          </span>
          <span className="ac-token-stat-value ac-token-stat-value--cost">{fmtCost(totalCost)}</span>
        </div>
      </div>
      {(cacheCreationTokens > 0 || cacheReadTokens > 0) && (
        <div className="ac-token-cache">
          {cacheCreationTokens > 0 && <span>Cache write: {fmt(cacheCreationTokens)}</span>}
          {cacheReadTokens > 0 && <span>Cache read: {fmt(cacheReadTokens)}</span>}
        </div>
      )}
      <div className="ac-token-footnote">
        Pricing: Sonnet — $3/M input · $15/M output
      </div>
    </div>
  )
}

/* ── Message Bubble ────────────────────────────────────────────────────────── */
function MessageBubble({ message, showTokenUsage }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    const text = message.text || message.thinking || ''
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (message.role === 'user') {
    return (
      <div className="ac-msg ac-msg--user">
        <div className="ac-msg-row ac-msg-row--user">
          <div className="ac-bubble ac-bubble--user">
            {message.text}
          </div>
        </div>
      </div>
    )
  }

  // Assistant
  return (
    <div className="ac-msg ac-msg--assistant">
      <div className="ac-msg-row ac-msg-row--assistant">
        <div className="ac-avatar">
          <Sparkles size={18} />
        </div>
        <div className="ac-content">
          {/* Tool calls */}
          {message.tools && message.tools.length > 0 && (
            <div className="ac-tools">
              {message.tools.map((tool, i) => (
                <ToolCallCard key={tool.id || i} tool={tool} isRunning={tool.running} />
              ))}
            </div>
          )}

          {/* Thinking */}
          {message.thinking && !message.text && (
            <div className="ac-thinking">
              <Loader2 size={14} className="tc-spinner" />
              <span dangerouslySetInnerHTML={{ __html: renderMarkdown(message.thinking) }} />
            </div>
          )}

          {/* Final answer */}
          {message.text && (
            <div className="ac-answer">
              <div
                className="ac-markdown"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(message.text) }}
              />
              <div className="ac-actions">
                <button className="ac-action-btn" onClick={handleCopy} title="Copy">
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Token usage */}
          {showTokenUsage && message.tokenUsage && message.text && (
            <TokenUsageCard tokenUsage={message.tokenUsage} />
          )}

          {/* Loading dots */}
          {message.loading && !message.text && !message.thinking && message.tools?.length === 0 && (
            <div className="ac-dots">
              <span className="ac-dot" />
              <span className="ac-dot" />
              <span className="ac-dot" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Main AgentChat — Full Page ────────────────────────────────────────────── */
export default function AgentChat() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [mcpStatus, setMcpStatus] = useState(null)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const messagesEndRef = useRef(null)
  const scrollContainerRef = useRef(null)
  const inputRef = useRef(null)
  const abortRef = useRef(null)
  const backendUrl = useAppStore(s => s.backendUrl) || DEFAULT_BACKEND
  const showTokenUsage = useAppStore(s => s.showTokenUsage)

  // Auto-scroll
  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120
    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Scroll detection for "jump to bottom" button
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    setShowScrollBtn(distFromBottom > 200)
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = async (e) => {
    e?.preventDefault()
    const question = input.trim()
    if (!question || isStreaming) return

    setInput('')
    setIsStreaming(true)

    const userMsg = { id: Date.now(), role: 'user', text: question }
    const assistantId = Date.now() + 1
    const assistantMsg = {
      id: assistantId,
      role: 'assistant',
      text: '',
      thinking: '',
      tools: [],
      loading: true,
    }

    setMessages(prev => [...prev, userMsg, assistantMsg])

    // Scroll to bottom immediately
    setTimeout(scrollToBottom, 50)

    try {
      const base = backendUrl.replace(/\/$/, '')
      abortRef.current = new AbortController()

      const response = await fetch(`${base}/api/agent/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
        signal: abortRef.current.signal,
      })

      if (!response.ok) throw new Error(`Backend returned ${response.status}`)

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        let eventType = ''
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7).trim()
          } else if (line.startsWith('data: ') && eventType) {
            try {
              const data = JSON.parse(line.slice(6))
              processSSEEvent(eventType, data, assistantId)
            } catch { /* skip malformed */ }
            eventType = ''
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') return

      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, loading: false, text: `**Error:** ${err.message}\n\nMake sure nerve-backend is running on ${backendUrl}` }
          : m
      ))
    } finally {
      setIsStreaming(false)
      abortRef.current = null
    }
  }

  function processSSEEvent(type, data, assistantId) {
    setMessages(prev => prev.map(m => {
      if (m.id !== assistantId) return m
      const updated = { ...m }

      switch (type) {
        case 'init':
          if (data.servers?.[0]) setMcpStatus(data.servers[0])
          break
        case 'thinking':
          updated.thinking = data.text
          updated.loading = false
          break
        case 'tool_start':
          updated.tools = [...(m.tools || []), {
            id: data.id, name: data.name,
            displayName: data.displayName,
            input: data.input, running: true,
          }]
          updated.loading = false
          break
        case 'tool_result':
          updated.tools = (m.tools || []).map(t =>
            t.id === data.id ? { ...t, running: false, result: data.preview } : t
          )
          break
        case 'done':
          updated.text = data.answer || updated.thinking || ''
          updated.thinking = ''
          updated.loading = false
          updated.tools = (m.tools || []).map(t => ({ ...t, running: false }))
          if (data.tokenUsage) updated.tokenUsage = data.tokenUsage
          break
        case 'error':
          updated.text = `**Error:** ${data.error}${data.hint ? `\n\n*Hint: ${data.hint}*` : ''}`
          updated.loading = false
          updated.tools = (m.tools || []).map(t => ({ ...t, running: false }))
          break
        default: break
      }
      return updated
    }))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleStop = () => {
    abortRef.current?.abort()
    setIsStreaming(false)
  }

  const handleClear = () => {
    setMessages([])
    setMcpStatus(null)
  }

  const hasMessages = messages.length > 0

  /* ── Render ──────────────────────────────────────────────────────────────── */
  return (
    <div className="ac-page">
      {/* Top bar */}
      <div className="ac-topbar">
        <div className="ac-topbar-left">
          <Sparkles size={20} className="ac-topbar-icon" />
          <span className="ac-topbar-title">CRM Agent</span>
          {mcpStatus && (
            <span className={`ac-mcp-badge ${mcpStatus.status === 'connected' ? 'ac-mcp-badge--ok' : 'ac-mcp-badge--err'}`}>
              <span className={`ac-mcp-dot ${mcpStatus.status === 'connected' ? 'dot-green' : 'dot-red'}`} />
              {mcpStatus.status === 'connected' ? `${mcpStatus.toolCount} tools` : 'Disconnected'}
            </span>
          )}
        </div>
        <div className="ac-topbar-right">
          {hasMessages && (
            <button className="ac-topbar-btn" onClick={handleClear}>
              <Trash2 size={14} />
              <span>New chat</span>
            </button>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="ac-chat-area" ref={scrollContainerRef} onScroll={handleScroll}>
        <div className="ac-chat-inner">
          {/* Empty state */}
          {!hasMessages && (
            <div className="ac-empty">
              <div className="ac-empty-glow">
                <Sparkles size={40} />
              </div>
              <h2 className="ac-empty-title">What do you want to know?</h2>
              <p className="ac-empty-desc">
                Ask anything about the IB-CRM — pages, workflows, stored procedures, subscriber data, call flows, or system dependencies.
              </p>
              <div className="ac-empty-grid">
                {[
                  { icon: Search, text: 'List all MCP tools available', color: 'blue' },
                  { icon: Database, text: 'What does the search_graph tool do?', color: 'teal' },
                  { icon: GitBranch, text: 'What are the CRM page categories?', color: 'purple' },
                  { icon: Zap, text: 'How many SPs are in the CRM?', color: 'amber' },
                ].map(({ icon: Icon, text, color }) => (
                  <button
                    key={text}
                    className={`ac-empty-card ac-empty-card--${color}`}
                    onClick={() => { setInput(text); setTimeout(() => handleSubmit({ preventDefault: () => {} }), 50) }}
                  >
                    <Icon size={18} className="ac-empty-card-icon" />
                    <span>{text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} showTokenUsage={showTokenUsage} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Scroll to bottom button */}
      {showScrollBtn && (
        <button className="ac-scroll-btn" onClick={scrollToBottom}>
          <ArrowDown size={16} />
        </button>
      )}

      {/* Input area */}
      <div className="ac-input-area">
        <div className="ac-input-container">
          <form className="ac-input-form" onSubmit={handleSubmit}>
            <textarea
              ref={inputRef}
              className="ac-textarea"
              placeholder="Ask about the CRM system..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={isStreaming}
            />
            <div className="ac-input-actions">
              {isStreaming ? (
                <button type="button" className="ac-send-btn ac-send-btn--stop" onClick={handleStop} title="Stop">
                  <Square size={16} />
                </button>
              ) : (
                <button type="submit" className="ac-send-btn" disabled={!input.trim()} title="Send">
                  <Send size={16} />
                </button>
              )}
            </div>
          </form>
          <div className="ac-input-hint">
            <span>Press <kbd>Enter</kbd> to send, <kbd>Shift+Enter</kbd> for new line</span>
          </div>
        </div>
      </div>
    </div>
  )
}
