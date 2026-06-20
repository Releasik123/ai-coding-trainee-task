import './style.css';
import { bindAuthLinks } from './auth';
import { CryptoFeed } from './crypto-feed';
import { createCryptoTicker } from './crypto-ui';

const app = document.querySelector<HTMLDivElement>('#app');

const coins = [
  {
    productId: 'BTC-USD',
    symbol: 'BTC',
    name: 'Bitcoin',
    accent: '#f2a900',
    decimals: 2,
  },
  {
    productId: 'ETH-USD',
    symbol: 'ETH',
    name: 'Ethereum',
    accent: '#62d5ff',
    decimals: 2,
  },
  {
    productId: 'SOL-USD',
    symbol: 'SOL',
    name: 'Solana',
    accent: '#35e8a8',
    decimals: 3,
  },
] as const;

if (app) {
  app.innerHTML = `
    <main class="page">
      <section class="hero" aria-labelledby="hero-title">
        <video class="hero__video" autoplay muted loop playsinline preload="auto" aria-hidden="true">
          <source src="/HP.mp4" type="video/mp4" />
        </video>
        <div class="hero__shade" aria-hidden="true"></div>

        <header class="topbar">
          <a class="brand" href="/" aria-label="AI Trading home">
            <span class="brand__mark" aria-hidden="true"></span>
            <span>AI Trading</span>
          </a>
          <a class="button button--google" href="/api/auth/google/login" data-auth-link>
            <span class="google-mark" aria-hidden="true">G</span>
            <span>Continue with Google</span>
          </a>
        </header>

        <div class="hero__layout">
          <div class="hero__copy">
            <p class="eyebrow">Live market intelligence</p>
            <h1 id="hero-title">AI-powered crypto dashboard</h1>
            <p class="hero__lead">
              Realtime digital asset prices with a secure Google sign-in flow built for fast market checks.
            </p>
            <div class="hero__actions">
              <a class="button button--primary" href="/api/auth/google/login" data-auth-link>
                <span class="google-mark" aria-hidden="true">G</span>
                <span>Sign in with Google</span>
              </a>
              <a class="button button--secondary" href="#markets">Live prices</a>
            </div>
          </div>

          <aside class="signal-panel" aria-label="Market signal summary">
            <div class="signal-panel__row">
              <span>Latency</span>
              <strong>Live</strong>
            </div>
            <div class="signal-panel__row">
              <span>Source</span>
              <strong>Coinbase</strong>
            </div>
            <div class="signal-panel__row">
              <span>Auth</span>
              <strong>OAuth2</strong>
            </div>
          </aside>
        </div>

        <div class="hero__markets" id="markets"></div>
      </section>
    </main>
  `;

  bindAuthLinks(document);

  const tickerRoot = document.querySelector<HTMLElement>('#markets');

  if (tickerRoot) {
    const ticker = createCryptoTicker(tickerRoot, coins);
    const feed = new CryptoFeed({
      productIds: coins.map((coin) => coin.productId),
      onStatus: ticker.setStatus,
      onPrice: ticker.updatePrice,
    });

    feed.start();
    window.addEventListener('beforeunload', () => feed.stop());
  }
}
