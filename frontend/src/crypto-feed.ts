export type FeedStatus = 'connecting' | 'live' | 'reconnecting' | 'offline' | 'error';

export type PriceUpdate = {
  productId: string;
  price: number;
  bid?: number;
  ask?: number;
  time?: string;
};

type TickerMessage = {
  type?: string;
  product_id?: string;
  price?: string;
  best_bid?: string;
  best_ask?: string;
  time?: string;
};

type CryptoFeedOptions = {
  productIds: readonly string[];
  onPrice: (update: PriceUpdate) => void;
  onStatus: (status: FeedStatus) => void;
};

const COINBASE_WS_URL = 'wss://ws-feed.exchange.coinbase.com';
const MAX_RECONNECT_DELAY_MS = 10_000;

export class CryptoFeed {
  private socket: WebSocket | null = null;
  private reconnectTimer: number | undefined;
  private reconnectAttempt = 0;
  private stopped = true;

  constructor(private readonly options: CryptoFeedOptions) {}

  start(): void {
    if (!this.stopped) {
      return;
    }

    this.stopped = false;
    this.connect();
  }

  stop(): void {
    this.stopped = true;
    window.clearTimeout(this.reconnectTimer);
    this.socket?.close();
    this.socket = null;
    this.options.onStatus('offline');
  }

  private connect(): void {
    this.options.onStatus(this.reconnectAttempt === 0 ? 'connecting' : 'reconnecting');
    this.socket = new WebSocket(COINBASE_WS_URL);

    this.socket.addEventListener('open', () => {
      this.reconnectAttempt = 0;
      this.options.onStatus('live');
      this.socket?.send(
        JSON.stringify({
          type: 'subscribe',
          product_ids: this.options.productIds,
          channels: ['ticker'],
        }),
      );
    });

    this.socket.addEventListener('message', (event) => {
      this.handleMessage(event.data);
    });

    this.socket.addEventListener('error', () => {
      this.options.onStatus('error');
      this.socket?.close();
    });

    this.socket.addEventListener('close', () => {
      if (!this.stopped) {
        this.scheduleReconnect();
      }
    });
  }

  private handleMessage(data: string): void {
    let message: TickerMessage;

    try {
      message = JSON.parse(data) as TickerMessage;
    } catch {
      return;
    }

    if (message.type !== 'ticker' || !message.product_id || !message.price) {
      return;
    }

    const price = Number(message.price);

    if (!Number.isFinite(price)) {
      return;
    }

    this.options.onPrice({
      productId: message.product_id,
      price,
      bid: parseOptionalNumber(message.best_bid),
      ask: parseOptionalNumber(message.best_ask),
      time: message.time,
    });
  }

  private scheduleReconnect(): void {
    const delay = Math.min(1_000 * 2 ** this.reconnectAttempt, MAX_RECONNECT_DELAY_MS);
    this.reconnectAttempt += 1;
    this.options.onStatus('reconnecting');
    this.reconnectTimer = window.setTimeout(() => this.connect(), delay);
  }
}

function parseOptionalNumber(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
