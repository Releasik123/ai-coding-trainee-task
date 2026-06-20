import './style.css';
import { bindAuthLinks } from './auth';
import { CryptoFeed } from './crypto-feed';
import { createCryptoTicker } from './crypto-ui';
import type { FeedInstrument } from './crypto-feed';

const app = document.querySelector<HTMLDivElement>('#app');

const coins = [
  {
    productId: 'BTC',
    streamSymbol: 'BTCUSDT',
    symbol: 'BTC',
    name: 'Bitcoin',
    icon: '₿',
    decimals: 2,
    fallbackPrice: 87965.62,
  },
  {
    productId: 'ETH',
    streamSymbol: 'ETHUSDT',
    symbol: 'ETH',
    name: 'Ethereum',
    icon: '◆',
    decimals: 2,
    fallbackPrice: 2950.04,
  },
  {
    productId: 'SOL',
    streamSymbol: 'SOLUSDT',
    symbol: 'SOL',
    name: 'Solana',
    icon: '≋',
    decimals: 2,
    fallbackPrice: 124.53,
  },
  {
    productId: 'XRP',
    streamSymbol: 'XRPUSDT',
    symbol: 'XRP',
    name: 'XRP',
    icon: '×',
    decimals: 3,
    fallbackPrice: 1.862,
  },
  {
    productId: 'USDC',
    streamSymbol: 'USDCUSDT',
    symbol: 'USDC',
    name: 'USD Coin',
    icon: '$',
    decimals: 4,
    fallbackPrice: 0.9997,
  },
  {
    productId: 'BNB',
    streamSymbol: 'BNBUSDT',
    symbol: 'BNB',
    name: 'Binance Coin',
    icon: '◇',
    decimals: 2,
    fallbackPrice: 844.91,
  },
  {
    productId: 'MIDNIGHT',
    symbol: 'MID',
    name: 'Midnight',
    icon: '◐',
    decimals: 5,
    fallbackPrice: 0.06398,
  },
  {
    productId: 'DOGE',
    streamSymbol: 'DOGEUSDT',
    symbol: 'DOGE',
    name: 'Dogecoin',
    icon: 'Ð',
    decimals: 4,
    fallbackPrice: 0.1278,
  },
  {
    productId: 'SUI',
    streamSymbol: 'SUIUSDT',
    symbol: 'SUI',
    name: 'Sui',
    icon: '♢',
    decimals: 3,
    fallbackPrice: 1.427,
  },
  {
    productId: 'USDT',
    streamSymbol: 'USDCUSDT',
    symbol: 'USDT',
    name: 'Tether',
    icon: '₮',
    decimals: 3,
    fallbackPrice: 1,
    invert: true,
  },
] as const;

if (app) {
  app.innerHTML = `
    <main class="page" id="home">
      <div class="page-curtain" aria-hidden="true"></div>
      <section class="hero" aria-labelledby="hero-title">
        <video class="hero__video" autoplay muted loop playsinline preload="auto" aria-hidden="true">
          <source src="/HP.mp4" type="video/mp4" />
        </video>
        <div class="hero__shade" aria-hidden="true"></div>

        <header class="topbar">
          <a class="kairos-logo reveal" href="/" aria-label="Kairos home" style="--reveal-delay: 960ms">
            <span>KAIROS</span>
          </a>
          <nav class="nav-links reveal" aria-label="Primary navigation" style="--reveal-delay: 1080ms">
            <a href="#home">Home</a>
            <a href="#about">About Us</a>
            <a href="#projects">Projects</a>
            <a href="#contact">Contact Us</a>
          </nav>
          <button class="menu-button reveal" type="button" aria-label="Open menu" aria-expanded="false" data-menu-open style="--reveal-delay: 1080ms">
            <span></span>
            <span></span>
            <span></span>
          </button>
        </header>

        <div class="hero__layout" id="about">
          <div class="hero__copy">
            <h1 id="hero-title">
              <span class="reveal reveal--line" style="--reveal-delay: 1180ms">From The</span>
              <span class="reveal reveal--line" style="--reveal-delay: 1320ms">Field Of All</span>
              <span class="reveal reveal--line" style="--reveal-delay: 1460ms">Possibility</span>
            </h1>
            <p class="hero__lead reveal" style="--reveal-delay: 1620ms">
              This is an emergent space where ideas are not created, but carefully discovered.
              We navigate the vast potential to bring forth only the most resonant patterns and
              coherent forms. Here, the future is curated from the infinite.
            </p>
            <div class="hero__actions reveal" style="--reveal-delay: 1760ms">
              <a class="split-button" href="#projects">
                <span>Learn More</span>
                <span aria-hidden="true">→</span>
              </a>
              <button class="video-button" type="button">
                <span>Play Video</span>
                <span aria-hidden="true">▶</span>
              </button>
            </div>
          </div>

          <aside class="auth-card reveal" aria-label="Online banking sign in" style="--reveal-delay: 1520ms">
            <h2>Online Banking</h2>
            <div class="auth-tabs" role="tablist" aria-label="Account type">
              <button class="auth-tab auth-tab--active" type="button">Sign In</button>
              <button class="auth-tab" type="button">Enter Email</button>
            </div>
            <div class="auth-card__body">
              <a class="google-login" href="/api/auth/google/login" data-auth-link>
                <span class="google-mark" aria-hidden="true">G</span>
                <span>Google</span>
              </a>
              <p>Start Your Journey Now!</p>
              <div class="auth-divider"><span>or</span></div>
              <a class="create-account" href="/api/auth/google/login" data-auth-link>Create account</a>
            </div>
          </aside>
        </div>
      </section>

      <section class="markets reveal" id="projects">
        <div class="markets__inner" id="markets"></div>
      </section>

      <div class="menu-panel" data-menu-panel hidden>
        <div class="menu-panel__scrim" data-menu-close></div>
        <nav class="menu-panel__content" aria-label="Mobile navigation">
          <a class="kairos-logo kairos-logo--menu" href="/" aria-label="Kairos home">
            <span>KAIROS</span>
          </a>
          <button class="menu-close" type="button" aria-label="Close menu" data-menu-close>×</button>
          <a href="#home">Home</a>
          <a href="#about">About Us</a>
          <a href="#projects">Projects</a>
          <a href="#contact">Contact Us</a>
        </nav>
      </div>
    </main>
  `;

  bindAuthLinks(document);
  bindMenu(document);

  const tickerRoot = document.querySelector<HTMLElement>('#markets');

  if (tickerRoot) {
    const ticker = createCryptoTicker(tickerRoot, coins);
    const instruments = coins.flatMap((coin): FeedInstrument[] => {
      if (!('streamSymbol' in coin)) {
        return [];
      }

      return [
        {
          productId: coin.productId,
          streamSymbol: coin.streamSymbol,
          invert: 'invert' in coin ? coin.invert : false,
        },
      ];
    });
    const feed = new CryptoFeed({
      instruments,
      onStatus: ticker.setStatus,
      onPrice: ticker.updatePrice,
    });

    feed.start();
    window.addEventListener('beforeunload', () => feed.stop());
  }

  bindRevealAnimations(document);
}

function bindMenu(root: ParentNode): void {
  const panel = root.querySelector<HTMLElement>('[data-menu-panel]');
  const openButton = root.querySelector<HTMLButtonElement>('[data-menu-open]');
  const closeTargets = root.querySelectorAll<HTMLElement>('[data-menu-close], .menu-panel__content a');

  if (!panel || !openButton) {
    return;
  }

  const setOpen = (isOpen: boolean) => {
    panel.hidden = !isOpen;
    document.body.classList.toggle('is-menu-open', isOpen);
    openButton.setAttribute('aria-expanded', String(isOpen));
  };

  openButton.addEventListener('click', () => setOpen(true));
  closeTargets.forEach((target) => target.addEventListener('click', () => setOpen(false)));
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setOpen(false);
    }
  });
}

function bindRevealAnimations(root: ParentNode): void {
  const animatedItems = Array.from(root.querySelectorAll<HTMLElement>('.reveal'));

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.body.classList.add('is-loaded');
    animatedItems.forEach((item) => item.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.16,
      rootMargin: '0px 0px -8% 0px',
    },
  );

  animatedItems.forEach((item) => observer.observe(item));

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.body.classList.add('is-loaded');
    });
  });
}
