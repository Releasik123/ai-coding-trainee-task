export type FeedStatus = 'connecting' | 'live' | 'reconnecting' | 'offline' | 'error';

export type PriceUpdate = {
  productId: string;
  price: number;
  bid?: number;
  ask?: number;
  time?: string;
};

type TickerMessage = {
  stream?: string;
  data?: {
    e?: string;
    E?: number;
    s?: string;
    c?: string;
    b?: string;
    a?: string;
  };
};

export type FeedInstrument = {
  productId: string;
  streamSymbol: string;
  invert?: boolean;
};

type CryptoFeedOptions = {
  instruments: readonly FeedInstrument[];
  onPrice: (update: PriceUpdate) => void;
  onStatus: (status: FeedStatus) => void;
};

const BINANCE_WS_URL = 'wss://stream.binance.com:443/stream?streams=';
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
    this.reconnectAttempt = 0;
    this.options.onStatus('offline');
  }

  private connect(): void {
    this.options.onStatus(this.reconnectAttempt === 0 ? 'connecting' : 'reconnecting');
    this.socket = new WebSocket(this.getStreamUrl());

    this.socket.addEventListener('open', () => {
      this.reconnectAttempt = 0;
      this.options.onStatus('live');
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

    const payload = message.data;

    if (payload?.e !== '24hrTicker' || !payload.s || !payload.c) {
      return;
    }

    const instruments = this.options.instruments.filter((item) => item.streamSymbol === payload.s);
    const price = Number(payload.c);

    if (!Number.isFinite(price) || instruments.length === 0) {
      return;
    }

    instruments.forEach((instrument) => {
      this.options.onPrice({
        productId: instrument.productId,
        price: instrument.invert ? 1 / price : price,
        bid: parseOptionalNumber(payload.b),
        ask: parseOptionalNumber(payload.a),
        time: payload.E ? new Date(payload.E).toISOString() : undefined,
      });
    });
  }

  private scheduleReconnect(): void {
    const delay = Math.min(1_000 * 2 ** this.reconnectAttempt, MAX_RECONNECT_DELAY_MS);
    this.reconnectAttempt += 1;
    this.options.onStatus('reconnecting');
    this.reconnectTimer = window.setTimeout(() => this.connect(), delay);
  }

  private getStreamUrl(): string {
    const streams = Array.from(new Set(this.options.instruments.map((item) => item.streamSymbol.toLowerCase())))
      .map((symbol) => `${symbol}@ticker`)
      .join('/');

    return `${BINANCE_WS_URL}${streams}`;
  }
}

function parseOptionalNumber(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
