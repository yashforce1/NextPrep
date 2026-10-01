import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { trackPageView } from '../../lib/analytics.js'

export default function AnalyticsTracker() {
  const { pathname } = useLocation()
  const previousPath = useRef(null)

  useEffect(() => {
    if (previousPath.current === pathname) return
    trackPageView(pathname, previousPath.current || '')
    previousPath.current = pathname
  }, [pathname])

  return null
}
