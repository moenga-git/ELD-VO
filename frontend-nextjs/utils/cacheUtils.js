// Cache clearing utilities for ELD-VO Professional

export const clearAllCaches = async () => {
  try {
    // Clear browser caches
    if ('caches' in window) {
      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      )
    }

    // Clear service worker caches
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.all(
        registrations.map(registration => registration.unregister())
      )
    }

    // Clear localStorage and sessionStorage
    localStorage.clear()
    sessionStorage.clear()

    // Clear IndexedDB
    if ('indexedDB' in window) {
      const databases = await indexedDB.databases()
      await Promise.all(
        databases.map(db => {
          return new Promise((resolve, reject) => {
            const deleteReq = indexedDB.deleteDatabase(db.name)
            deleteReq.onsuccess = () => resolve()
            deleteReq.onerror = () => reject(deleteReq.error)
          })
        })
      )
    }

    return true
  } catch (error) {
    console.error('Error clearing caches:', error)
    return false
  }
}

export const forceRefresh = () => {
  // Clear all caches first
  clearAllCaches().then(() => {
    // Force reload
    window.location.reload(true)
  })
}

export const clearAuthCache = () => {
  // Clear auth-related storage
  localStorage.removeItem('supabase.auth.token')
  localStorage.removeItem('supabase.auth.user')
  sessionStorage.clear()
  
  // Clear any auth-related cookies
  document.cookie.split(";").forEach(cookie => {
    const eqPos = cookie.indexOf("=")
    const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/"
  })
}

export const isCacheStale = (key, maxAge = 300000) => { // 5 minutes default
  const lastUpdate = localStorage.getItem(key)
  if (!lastUpdate) return true
  
  const now = Date.now()
  const age = now - parseInt(lastUpdate)
  return age > maxAge
}
