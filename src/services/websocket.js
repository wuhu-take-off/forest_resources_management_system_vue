class WebSocketService {
    constructor() {
        this.ws = null
        this.wsConnected = false
        this.reconnectAttempts = 0
        this.maxReconnectAttempts = 5
        this.reconnectInterval = 3000
        this.messageHandlers = new Set()
        this.currentUserId = null
    }

    connect() {
        const token = localStorage.getItem('token')
        const userId = localStorage.getItem('userid')

        if (!token || !userId) {
            console.error('No token or userId found')
            return
        }

        if (this.ws && this.wsConnected && this.currentUserId === userId) {
            return
        }

        if (this.ws) {
            this.disconnect()
        }

        this.currentUserId = userId

        const wsUrl = 'ws://127.0.0.1:8000/chat'
        this.ws = new WebSocket(wsUrl)

        this.ws.addEventListener('open', () => {
            this.ws.send(token)
            this.wsConnected = true
            this.reconnectAttempts = 0
            console.log('WebSocket connected for user:', this.currentUserId)
        })

        this.ws.addEventListener('message', (event) => {
            if (this.currentUserId === localStorage.getItem('userid')) {
                this.messageHandlers.forEach(handler => handler(event))
            }
        })

        this.ws.addEventListener('close', () => {
            this.wsConnected = false
            console.log('WebSocket connection closed for user:', this.currentUserId)
            if (this.currentUserId === localStorage.getItem('userid')) {
                this.attemptReconnect()
            }
        })

        this.ws.addEventListener('error', (error) => {
            console.error('WebSocket error for user:', this.currentUserId, error)
            this.wsConnected = false
        })
    }

    disconnect() {
        if (this.ws) {
            this.ws.close()
            this.ws = null
            this.wsConnected = false
            this.currentUserId = null
            this.messageHandlers.clear()
        }
    }

    addMessageHandler(handler) {
        if (this.currentUserId === localStorage.getItem('userid')) {
            this.messageHandlers.add(handler)
        }
    }

    removeMessageHandler(handler) {
        this.messageHandlers.delete(handler)
    }

    attemptReconnect() {
        if (this.currentUserId !== localStorage.getItem('userid')) {
            return
        }

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            setTimeout(() => {
                console.log(`Attempting to reconnect for user ${this.currentUserId}... (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`)
                this.reconnectAttempts++
                this.connect()
            }, this.reconnectInterval)
        } else {
            console.error('Max reconnection attempts reached for user:', this.currentUserId)
        }
    }
}

export default new WebSocketService() 