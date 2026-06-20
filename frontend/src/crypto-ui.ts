import type { FeedStatus, PriceUpdate } from './crypto-feed';

export type CoinDefinition = {
  productId: string;
  symbol: string;
  name: string;
  accent: string;
  decimals: number;
};

type CoinElements = {
  card: HTMLElement;
  price: HTMLElement;
  meta: HTMLElement;
  spread: HTMLElement;
};

const statusLabels: Record<FeedStatus, string> = {
  connecting: 'Connecting',
  live: 'Live',
  reconnecting: 'Reconnecting',
  offline: 'Offline',
  error: 'Connection issue',
};

export function createCryptoTicker(root: HTMLElement, coins: readonly CoinDefinition[]) {
  root.innerHTML = `
    <section class="market-panel" aria-label="Realtime crypto prices">
      <div class="market-panel__header">
        <div>
          <p class="eyebrow eyebrow--compact">Market feed</p>
          <h2>Realtime prices</h2>
        </div>
        <p class="feed-status" data-feed-status="connecting" aria-live="polite">
          <span class="feed-status__dot" aria-hidden="true"></span>
          <span data-feed-status-label>Connecting</span>
        </p>
      </div>
      <div class="coin-grid"></div>
    </section>
  `;

  const grid = root.querySelector<HTMLElement>('.coin-grid');
  const status = root.querySelector<HTMLElement>('.feed-status');
  const statusLabel = root.querySelector<HTMLElement>('[data-feed-status-label]');
  const elements = new Map<string, CoinElements>();
  const lastPrices = new Map<string, number>();

  if (grid) {
    coins.forEach((coin) => {
      const card = document.createElement('article');
      card.className = 'coin-card';
      card.style.setProperty('--coin-accent', coin.accent);
      card.dataset.productId = coin.productId;
      card.innerHTML = `
        <div class="coin-card__top">
          <div>
            <p class="coin-card__symbol">${coin.symbol}</p>
            <h3>${coin.name}</h3>
          </div>
          <span class="coin-card__badge">${coin.productId}</span>
        </div>
        <p class="coin-card__price" data-price>--</p>
        <div class="coin-card__meta">
          <span data-meta>Waiting for first tick</span>
          <span data-spread>Spread --</span>
        </div>
      `;
      grid.append(card);

      elements.set(coin.productId, {
        card,
        price: card.querySelector<HTMLElement>('[data-price]') as HTMLElement,
        meta: card.querySelector<HTMLElement>('[data-meta]') as HTMLElement,
        spread: card.querySelector<HTMLElement>('[data-spread]') as HTMLElement,
      });
    });
  }

  function setStatus(feedStatus: FeedStatus): void {
    if (status) {
      status.dataset.feedStatus = feedStatus;
    }

    if (statusLabel) {
      statusLabel.textContent = statusLabels[feedStatus];
    }
  }

  function updatePrice(update: PriceUpdate): void {
    const coin = coins.find((item) => item.productId === update.productId);
    const refs = elements.get(update.productId);

    if (!coin || !refs) {
      return;
    }

    const previous = lastPrices.get(update.productId);
    const trend = previous === undefined ? 'flat' : update.price > previous ? 'up' : update.price < previous ? 'down' : 'flat';

    refs.card.dataset.trend = trend;
    refs.price.textContent = formatPrice(update.price, coin.decimals);
    refs.meta.textContent = update.time ? `Updated ${formatTime(update.time)}` : 'Updated now';
    refs.spread.textContent = formatSpread(update.bid, update.ask);
    lastPrices.set(update.productId, update.price);
  }

  return { setStatus, updatePrice };
}

function formatPrice(value: number, maximumFractionDigits: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits,
  }).format(value);
}

function formatTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'now';
  }

  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

function formatSpread(bid: number | undefined, ask: number | undefined): string {
  if (bid === undefined || ask === undefined) {
    return 'Spread --';
  }

  return `Spread ${formatPrice(Math.max(ask - bid, 0), 2)}`;
}
