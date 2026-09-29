type EventType = 
  | 'incident.triggered'
  | 'incident.acknowledged'
  | 'incident.resolved'
  | 'incident.note_added'
  | 'api.status_changed'
  | 'api.check_completed'
  | 'alert.fired'
  | 'alert.acknowledged'
  | 'alert.resolved'
  | 'ticket.created'
  | 'ticket.updated'
  | 'ticket.resolved'
  | 'team.member_joined'
  | 'team.member_left'
  | 'team.role_changed';

interface RealtimeEvent<T = unknown> {
  type: EventType;
  payload: T;
  timestamp: string;
  orgId: string;
}

type EventHandler<T = unknown> = (event: RealtimeEvent<T>) => void;

interface ConnectionState {
  status: 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'failed';
  lastConnected: Date | null;
  reconnectAttempts: number;
}

class RealtimeClient {
  private ws: WebSocket | null = null;
  private es: EventSource | null = null;
  private url: string;
  private token: string;
  private orgId: string;
  private handlers = new Map<EventType, Set<EventHandler>>();
  private connectionState: ConnectionState = {
    status: 'disconnected',
    lastConnected: null,
    reconnectAttempts: 0,
  };
  private stateListeners = new Set<(state: ConnectionState) => void>();
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;
  private useSSE = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(orgId: string, token: string) {
    this.orgId = orgId;
    this.token = token;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    this.url = `${protocol}//${window.location.host}/api/realtime/ws?orgId=${orgId}&token=${token}`;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.setState({ status: 'connecting' });
      
      if (this.useSSE) {
        this.connectSSE(resolve, reject);
      } else {
        this.connectWS(resolve, reject);
      }
    });
  }

  private connectWS(resolve: () => void, reject: (err: Error) => void) {
    try {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = () => {
        this.connectionState.reconnectAttempts = 0;
        this.setState({ 
          status: 'connected', 
          lastConnected: new Date(),
          reconnectAttempts: 0 
        });
        this.startHeartbeat();
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (e) {
          console.error('Failed to parse realtime message:', e);
        }
      };

      this.ws.onclose = (event) => {
        this.stopHeartbeat();
        if (event.code !== 1000) {
          this.handleDisconnect();
        } else {
          this.setState({ status: 'disconnected' });
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        if (this.connectionState.status === 'connecting') {
          reject(new Error('WebSocket connection failed'));
        }
      };
    } catch (e) {
      this.handleConnectionError(e as Error);
    }
  }

  private connectSSE(resolve: () => void, reject: (err: Error) => void) {
    const sseUrl = this.url.replace('ws:', 'http:').replace('wss:', 'https:').replace('/ws', '/stream');
    this.es = new EventSource(sseUrl);
    
    this.es.onopen = () => {
      this.connectionState.reconnectAttempts = 0;
      this.setState({ 
        status: 'connected', 
        lastConnected: new Date(),
        reconnectAttempts: 0 
      });
      resolve();
    };

    this.es.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (e) {
        console.error('Failed to parse SSE message:', e);
      }
    };

    this.es.onerror = () => {
      this.es?.close();
      this.handleDisconnect();
    };
  }

  private handleMessage(message: RealtimeEvent) {
    const handlers = this.handlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message);
        } catch (e) {
          console.error(`Error in handler for ${message.type}:`, e);
        }
      });
    }
  }

  private handleDisconnect() {
    this.stopHeartbeat();
    this.setState({ status: 'disconnected' });
    
    if (this.connectionState.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnect();
    } else {
      this.setState({ status: 'failed' });
      this.switchToSSE();
    }
  }

  private handleConnectionError(error: Error) {
    console.error('Connection error:', error);
    if (this.connectionState.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnect();
    } else {
      this.setState({ status: 'failed' });
      this.switchToSSE();
    }
  }

  private scheduleReconnect() {
    this.setState({ status: 'reconnecting' });
    this.connectionState.reconnectAttempts++;
    
    const delay = this.reconnectDelay * Math.pow(1.5, this.connectionState.reconnectAttempts - 1);
    setTimeout(() => {
      this.connect().catch(() => {});
    }, Math.min(delay, 30000));
  }

  private switchToSSE() {
    if (!this.useSSE) {
      console.log('Switching to SSE fallback');
      this.useSSE = true;
      this.connect().catch(() => {});
    }
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private setState(partial: Partial<ConnectionState>) {
    this.connectionState = { ...this.connectionState, ...partial };
    this.stateListeners.forEach(listener => listener(this.connectionState));
  }

  onStateChange(listener: (state: ConnectionState) => void): () => void {
    this.stateListeners.add(listener);
    listener(this.connectionState);
    return () => this.stateListeners.delete(listener);
  }

  subscribe<T>(type: EventType, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler as EventHandler);
    
    return () => {
      this.handlers.get(type)?.delete(handler as EventHandler);
    };
  }

  unsubscribe<T>(type: EventType, handler: EventHandler<T>) {
    this.handlers.get(type)?.delete(handler as EventHandler);
  }

  getState(): ConnectionState {
    return { ...this.connectionState };
  }

  disconnect() {
    this.stopHeartbeat();
    this.ws?.close(1000, 'Client disconnect');
    this.es?.close();
    this.ws = null;
    this.es = null;
    this.setState({ status: 'disconnected' });
  }
}

let realtimeClient: RealtimeClient | null = null;

export function getRealtimeClient(orgId: string, token: string): RealtimeClient {
  if (!realtimeClient) {
    realtimeClient = new RealtimeClient(orgId, token);
  }
  return realtimeClient;
}

export function destroyRealtimeClient() {
  realtimeClient?.disconnect();
  realtimeClient = null;
}

export type { RealtimeEvent, EventType, ConnectionState };