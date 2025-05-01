server: {
  allowedHosts: [
    '.ngrok-free.app'
  ],
  proxy: {
    '/api': {
      target: 'https://14de-176-36-32-104.ngrok-free.app',
      changeOrigin: true,
      secure: false,
      ws: true
    }
  }
} 