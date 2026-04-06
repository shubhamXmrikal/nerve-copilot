import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const DEFAULT_BACKEND = 'http://localhost:3001'

const useAppStore = create(
  persist(
    (set, get) => ({
      // Agent settings (persisted)
      agentId: '',
      agentName: '',
      apiKey: '',
      backendUrl: '',
      geminiApiKey: '',
      useGeminiTts: false,
      showTokenUsage: false,

      // Session state (not persisted)
      vcNo: '',
      subscriber: null,
      isLoadingSubscriber: false,
      subscriberError: '',

      transcript: '',
      selectedDemoId: null,

      intentResult: null,
      isClassifying: false,

      toasts: [],

      // ── Settings actions ───────────────────────────────────
      setAgentId:    (v) => set({ agentId: v }),
      setAgentName:  (v) => set({ agentName: v }),
      setApiKey:     (v) => set({ apiKey: v }),
      setBackendUrl: (v) => set({ backendUrl: v }),
      setGeminiApiKey:  (v) => set({ geminiApiKey: v }),
      setUseGeminiTts:  (v) => set({ useGeminiTts: v }),
      setShowTokenUsage: (v) => set({ showTokenUsage: v }),

      // ── Session actions ────────────────────────────────────
      setVcNo:                 (v) => set({ vcNo: v }),
      setSubscriber:           (v) => set({ subscriber: v }),
      setIsLoadingSubscriber:  (v) => set({ isLoadingSubscriber: v }),
      setSubscriberError:      (v) => set({ subscriberError: v }),
      setTranscript:           (v) => set({ transcript: v }),
      setSelectedDemoId:       (v) => set({ selectedDemoId: v }),
      setIntentResult:         (v) => set({ intentResult: v }),
      setIsClassifying:        (v) => set({ isClassifying: v }),

      // ── Fetch subscriber from real backend ─────────────────
      fetchSubscriber: async (vcNo) => {
        const { backendUrl, agentId, addToast } = get()
        const base = (backendUrl || DEFAULT_BACKEND).replace(/\/$/, '')

        set({ isLoadingSubscriber: true, subscriberError: '', subscriber: null })

        try {
          const res = await fetch(
            `${base}/api/subscriber/${encodeURIComponent(vcNo.trim())}` +
            (agentId ? `?agentId=${encodeURIComponent(agentId)}` : ''),
            {
              headers: {
                'Content-Type': 'application/json',
                ...(agentId ? { 'x-agent-id': agentId } : {}),
              },
            }
          )

          const data = await res.json()

          if (!res.ok || !data.success) {
            const msg = data.error || `Error ${res.status}`
            set({ subscriberError: msg, isLoadingSubscriber: false })
            addToast({ type: 'error', message: `Subscriber: ${msg}` })
            return
          }

          set({ subscriber: data.subscriber, vcNo: vcNo.trim(), isLoadingSubscriber: false })
          addToast({ type: 'success', message: `Loaded: ${data.subscriber.name}` })
        } catch (err) {
          const msg = err.message.includes('fetch')
            ? 'Cannot reach backend — is nerve-backend running?'
            : err.message
          set({ subscriberError: msg, isLoadingSubscriber: false })
          addToast({ type: 'error', message: msg })
        }
      },

      // ── Reset ──────────────────────────────────────────────
      resetSession: () => set({
        subscriber: null,
        subscriberError: '',
        transcript: '',
        selectedDemoId: null,
        intentResult: null,
        vcNo: '',
        isClassifying: false,
        isLoadingSubscriber: false,
      }),

      // ── Toasts ─────────────────────────────────────────────
      addToast: (toast) => {
        const id = Date.now()
        set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }))
        setTimeout(() => {
          set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
        }, 3500)
      },
      removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
    }),
    {
      name: 'nerve-settings',
      partialize: (state) => ({
        agentId:      state.agentId,
        agentName:    state.agentName,
        apiKey:       state.apiKey,
        backendUrl:   state.backendUrl,
        geminiApiKey: state.geminiApiKey,
        useGeminiTts: state.useGeminiTts,
        showTokenUsage: state.showTokenUsage,
      }),
    }
  )
)

export default useAppStore
