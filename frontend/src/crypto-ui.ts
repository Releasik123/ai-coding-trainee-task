import type { FeedStatus, PriceUpdate } from './crypto-feed';

export type CoinDefinition = {
  productId: string;
  streamSymbol?: string;
  symbol: string;
  name: string;
  icon: string;
  decimals: number;
  fallbackPrice: number;
};

type CoinElements = {
  item: HTMLElement;
  price: HTMLElement;
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
    <div class="banking-orbit" aria-hidden="true">
      <span></span>
      <span></span>
      <span></span>
    </div>
    <div class="banking-center">
      <p class="section-title">Online Banking</p>
      <a class="add-crypto" href="#markets">
        <span>Add a Cryptocurrency</span>
        <span aria-hidden="true">›</span>
      </a>
      <p class="feed-status" data-feed-status="connecting" aria-live="polite">
        <span class="feed-status__dot" aria-hidden="true"></span>
        <span data-feed-status-label>Connecting</span>
      </p>
    </div>
    <div class="coin-list" aria-label="Realtime crypto prices"></div>
    <div class="tech-line tech-line--top" aria-hidden="true"></div>
    <div class="tech-line tech-line--bottom" aria-hidden="true"></div>
  `;

  const list = root.querySelector<HTMLElement>('.coin-list');
  const status = root.querySelector<HTMLElement>('.feed-status');
  const statusLabel = root.querySelector<HTMLElement>('[data-feed-status-label]');
  const elements = new Map<string, CoinElements>();

  if (list) {
    coins.forEach((coin) => {
      const item = document.createElement('article');
      item.className = 'coin-row';
      item.dataset.productId = coin.productId;
      item.innerHTML = `
        <span class="coin-icon" data-icon="${coin.symbol}">${coin.icon}</span>
        <span class="coin-name">${coin.name}</span>
        <span class="coin-price" data-price>${formatPrice(coin.fallbackPrice, coin.decimals)}</span>
      `;
      list.append(item);

      elements.set(coin.productId, {
        item,
        price: item.querySelector<HTMLElement>('[data-price]') as HTMLElement,
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

    refs.item.dataset.updated = 'true';
    refs.price.textContent = formatPrice(update.price, coin.decimals);
  }

  return { setStatus, updatePrice };
}

function formatPrice(value: number, maximumFractionDigits: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: maximumFractionDigits >= 3 ? 3 : 2,
    maximumFractionDigits,
  }).format(value);
}
