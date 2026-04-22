import PusherServer from 'pusher'
import PusherClient from 'pusher-js'

export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID || '',
  key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY || '',
  secret: process.env.PUSHER_APP_SECRET || '',
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'mt1',
  useTLS: true,
})

// Client-side instance is usually initialized within components or a custom hook
// to handle dynamic configuration and connection state properly.
// But we can export a creator function or a singleton.

export const getPusherClient = () => {
  if (!process.env.NEXT_PUBLIC_PUSHER_APP_KEY) {
    console.warn('Pusher App Key is missing')
    return null
  }
  return new PusherClient(process.env.NEXT_PUBLIC_PUSHER_APP_KEY, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'mt1',
  })
}
