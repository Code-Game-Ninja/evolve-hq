import PusherServer from 'pusher'
import PusherClient from 'pusher-js'

export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID || '',
  key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY || '',
  secret: process.env.PUSHER_APP_SECRET || '',
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'mt1',
  useTLS: true,
})

// Singleton client — reuse the same WebSocket connection across the entire app.
// Previously getPusherClient() created a NEW instance on every call, causing
// multiple simultaneous WebSocket connections and memory leaks.
let pusherClientInstance: PusherClient | null = null

export const getPusherClient = (): PusherClient | null => {
  if (typeof window === 'undefined') return null
  if (!process.env.NEXT_PUBLIC_PUSHER_APP_KEY) {
    console.warn('Pusher App Key is missing')
    return null
  }
  if (!pusherClientInstance) {
    pusherClientInstance = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_APP_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'mt1',
    })
  }
  return pusherClientInstance
}
