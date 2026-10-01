const env = import.meta.env || {}
let initialized = false

// Missing configuration is intentionally a no-op, including in local development.
export function initAnalytics() {
  if (initialized) return true
  const id = env.VITE_GA_MEASUREMENT_ID?.trim()
  if (typeof window === 'undefined' || !/^G-[A-Z0-9]+$/.test(id || '')) return false
  if (env.DEV && env.VITE_GA_DEBUG !== 'true') return false

  window.dataLayer = window.dataLayer || []
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments) }
  window.gtag('js', new Date())
  window.gtag('config', id, {
    send_page_view: false,
    page_location: window.location.origin + window.location.pathname,
    page_referrer: '',
    ...(env.VITE_GA_DEBUG === 'true' ? { debug_mode: true } : {}),
  })
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`
  document.head.appendChild(script)
  initialized = true
  return true
}

// Explicit allowlist: never send account details, answers, or free-form test titles.
const allowedParams = new Set([
  'quiz_id', 'question_count', 'duration_minutes', 'status', 'user_role',
  'submission_type', 'report_type', 'file_format', 'method',
])

export function trackEvent(name, parameters = {}) {
  try {
    if (!initAnalytics()) return
    const safe = Object.fromEntries(Object.entries(parameters).filter(([key, value]) =>
      allowedParams.has(key) && ['string', 'number', 'boolean'].includes(typeof value)))
    window.gtag('event', name, {
      ...safe,
      page_location: window.location.origin + window.location.pathname,
      page_referrer: '',
    })
  } catch {
    // Analytics must never interrupt a quiz or other application action.
  }
}

export function trackPageView(pathname, previousPath = '') {
  try {
    if (!initAnalytics()) return
    const params = {
      page_path: pathname,
      page_location: window.location.origin + pathname,
      page_title: document.title,
      page_referrer: previousPath ? window.location.origin + previousPath : '',
    }
    window.gtag('set', params)
    window.gtag('event', 'page_view', params)
    window.gtag('event', 'page_viewed', params)
  } catch { /* Tracking is best effort. */ }
}

// Call only after a future registration service confirms account creation.
export function trackSignupCompleted(method = 'email') {
  trackEvent('signup_completed', { method })
}
