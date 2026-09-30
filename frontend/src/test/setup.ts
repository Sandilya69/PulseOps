import '@testing-library/jest-dom';
import { vi, beforeAll, afterEach, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: vi.fn(),
    resolvedTheme: 'light',
  }),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    promise: vi.fn(),
  },
  Toaster: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    create: vi.fn(() => ({
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: { use: vi.fn(), eject: vi.fn() },
        response: { use: vi.fn(), eject: vi.fn() },
      },
    })),
  },
}));

// Mock react-query
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => ({ data: undefined, isLoading: false, error: null, refetch: vi.fn() })),
  useMutation: vi.fn(() => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false, isError: false, isSuccess: false })),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
    getQueryData: vi.fn(),
  })),
  QueryClient: vi.fn(),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock zustand
vi.mock('zustand', () => ({
  create: vi.fn((fn) => {
    const state = fn(() => ({}), () => ({}), () => ({}));
    return vi.fn(() => state);
  }),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => {
  const icons = {
    Menu: vi.fn(() => <div data-testid="menu-icon" />),
    X: vi.fn(() => <div data-testid="x-icon" />),
    ChevronDown: vi.fn(() => <div data-testid="chevron-down-icon" />),
    ChevronUp: vi.fn(() => <div data-testid="chevron-up-icon" />),
    ChevronLeft: vi.fn(() => <div data-testid="chevron-left-icon" />),
    ChevronRight: vi.fn(() => <div data-testid="chevron-right-icon" />),
    Plus: vi.fn(() => <div data-testid="plus-icon" />),
    Minus: vi.fn(() => <div data-testid="minus-icon" />),
    Search: vi.fn(() => <div data-testid="search-icon" />),
    Filter: vi.fn(() => <div data-testid="filter-icon" />),
    Settings: vi.fn(() => <div data-testid="settings-icon" />),
    User: vi.fn(() => <div data-testid="user-icon" />),
    Users: vi.fn(() => <div data-testid="users-icon" />),
    Bell: vi.fn(() => <div data-testid="bell-icon" />),
    AlertTriangle: vi.fn(() => <div data-testid="alert-triangle-icon" />),
    CheckCircle: vi.fn(() => <div data-testid="check-circle-icon" />),
    XCircle: vi.fn(() => <div data-testid="x-circle-icon" />),
    Info: vi.fn(() => <div data-testid="info-icon" />),
    Loader2: vi.fn(() => <div data-testid="loader-icon" />),
    Eye: vi.fn(() => <div data-testid="eye-icon" />),
    EyeOff: vi.fn(() => <div data-testid="eye-off-icon" />),
    Edit: vi.fn(() => <div data-testid="edit-icon" />),
    Trash: vi.fn(() => <div data-testid="trash-icon" />),
    Download: vi.fn(() => <div data-testid="download-icon" />),
    Upload: vi.fn(() => <div data-testid="upload-icon" />),
    Mail: vi.fn(() => <div data-testid="mail-icon" />),
    Phone: vi.fn(() => <div data-testid="phone-icon" />),
    Globe: vi.fn(() => <div data-testid="globe-icon" />),
    Shield: vi.fn(() => <div data-testid="shield-icon" />),
    Lock: vi.fn(() => <div data-testid="lock-icon" />),
    Unlock: vi.fn(() => <div data-testid="unlock-icon" />),
    Key: vi.fn(() => <div data-testid="key-icon" />),
    LogOut: vi.fn(() => <div data-testid="log-out-icon" />),
    LogIn: vi.fn(() => <div data-testid="log-in-icon" />),
    ArrowRight: vi.fn(() => <div data-testid="arrow-right-icon" />),
    ArrowLeft: vi.fn(() => <div data-testid="arrow-left-icon" />),
    ExternalLink: vi.fn(() => <div data-testid="external-link-icon" />),
    Copy: vi.fn(() => <div data-testid="copy-icon" />),
    Check: vi.fn(() => <div data-testid="check-icon" />),
    MoreHorizontal: vi.fn(() => <div data-testid="more-horizontal-icon" />),
    MoreVertical: vi.fn(() => <div data-testid="more-vertical-icon" />),
    Grid: vi.fn(() => <div data-testid="grid-icon" />),
    List: vi.fn(() => <div data-testid="list-icon" />),
    Calendar: vi.fn(() => <div data-testid="calendar-icon" />),
    Clock: vi.fn(() => <div data-testid="clock-icon" />),
    Activity: vi.fn(() => <div data-testid="activity-icon" />),
    BarChart: vi.fn(() => <div data-testid="bar-chart-icon" />),
    PieChart: vi.fn(() => <div data-testid="pie-chart-icon" />),
    TrendingUp: vi.fn(() => <div data-testid="trending-up-icon" />),
    TrendingDown: vi.fn(() => <div data-testid="trending-down-icon" />),
    AlertCircle: vi.fn(() => <div data-testid="alert-circle-icon" />),
    RefreshCw: vi.fn(() => <div data-testid="refresh-cw-icon" />),
    RotateCcw: vi.fn(() => <div data-testid="rotate-ccw-icon" />),
    Send: vi.fn(() => <div data-testid="send-icon" />),
    MessageSquare: vi.fn(() => <div data-testid="message-square-icon" />),
    FileText: vi.fn(() => <div data-testid="file-text-icon" />),
    FolderOpen: vi.fn(() => <div data-testid="folder-open-icon" />),
    Home: vi.fn(() => <div data-testid="home-icon" />),
    LayoutDashboard: vi.fn(() => <div data-testid="layout-dashboard-icon" />),
    Server: vi.fn(() => <div data-testid="server-icon" />),
    Database: vi.fn(() => <div data-testid="database-icon" />),
    Cpu: vi.fn(() => <div data-testid="cpu-icon" />),
    HardDrive: vi.fn(() => <div data-testid="hard-drive-icon" />),
    Wifi: vi.fn(() => <div data-testid="wifi-icon" />),
    WifiOff: vi.fn(() => <div data-testid="wifi-off-icon" />),
    Zap: vi.fn(() => <div data-testid="zap-icon" />),
    Target: vi.fn(() => <div data-testid="target-icon" />),
    Flag: vi.fn(() => <div data-testid="flag-icon" />),
    Bookmark: vi.fn(() => <div data-testid="bookmark-icon" />),
    Star: vi.fn(() => <div data-testid="star-icon" />),
    Heart: vi.fn(() => <div data-testid="heart-icon" />),
    Share2: vi.fn(() => <div data-testid="share2-icon" />),
    Link: vi.fn(() => <div data-testid="link-icon" />),
    Tag: vi.fn(() => <div data-testid="tag-icon" />),
    Hash: vi.fn(() => <div data-testid="hash-icon" />),
    AtSign: vi.fn(() => <div data-testid="at-sign-icon" />),
    DollarSign: vi.fn(() => <div data-testid="dollar-sign-icon" />),
    CreditCard: vi.fn(() => <div data-testid="credit-card-icon" />),
    Receipt: vi.fn(() => <div data-testid="receipt-icon" />),
    Package: vi.fn(() => <div data-testid="package-icon" />),
    Box: vi.fn(() => <div data-testid="box-icon" />),
    Truck: vi.fn(() => <div data-testid="truck-icon" />),
    Ship: vi.fn(() => <div data-testid="ship-icon" />),
    Plane: vi.fn(() => <div data-testid="plane-icon" />),
    Car: vi.fn(() => <div data-testid="car-icon" />),
    Bike: vi.fn(() => <div data-testid="bike-icon" />),
    Walk: vi.fn(() => <div data-testid="walk-icon" />),
    Run: vi.fn(() => <div data-testid="run-icon" />),
    Swim: vi.fn(() => <div data-testid="swim-icon" />),
    Gym: vi.fn(() => <div data-testid="gym-icon" />),
    Dumbbell: vi.fn(() => <div data-testid="dumbbell-icon" />),
    Trophy: vi.fn(() => <div data-testid="trophy-icon" />),
    Medal: vi.fn(() => <div data-testid="medal-icon" />),
    Award: vi.fn(() => <div data-testid="award-icon" />),
    Crown: vi.fn(() => <div data-testid="crown-icon" />),
    Gem: vi.fn(() => <div data-testid="gem-icon" />),
    Sparkles: vi.fn(() => <div data-testid="sparkles-icon" />),
    MagicWand: vi.fn(() => <div data-testid="magic-wand-icon" />),
    Wand: vi.fn(() => <div data-testid="wand-icon" />),
    ZapOff: vi.fn(() => <div data-testid="zap-off-icon" />),
    Battery: vi.fn(() => <div data-testid="battery-icon" />),
    BatteryLow: vi.fn(() => <div data-testid="battery-low-icon" />),
    BatteryCharging: vi.fn(() => <div data-testid="battery-charging-icon" />),
    Signal: vi.fn(() => <div data-testid="signal-icon" />),
    SignalLow: vi.fn(() => <div data-testid="signal-low-icon" />),
    SignalMedium: vi.fn(() => <div data-testid="signal-medium-icon" />),
    SignalHigh: vi.fn(() => <div data-testid="signal-high-icon" />),
    SignalZero: vi.fn(() => <div data-testid="signal-zero-icon" />),
    Volume2: vi.fn(() => <div data-testid="volume2-icon" />),
    Volume1: vi.fn(() => <div data-testid="volume1-icon" />),
    VolumeX: vi.fn(() => <div data-testid="volume-x-icon" />),
    Mic: vi.fn(() => <div data-testid="mic-icon" />),
    MicOff: vi.fn(() => <div data-testid="mic-off-icon" />),
    Camera: vi.fn(() => <div data-testid="camera-icon" />),
    CameraOff: vi.fn(() => <div data-testid="camera-off-icon" />),
    Video: vi.fn(() => <div data-testid="video-icon" />),
    VideoOff: vi.fn(() => <div data-testid="video-off-icon" />),
    Monitor: vi.fn(() => <div data-testid="monitor-icon" />),
    Laptop: vi.fn(() => <div data-testid="laptop-icon" />),
    Tablet: vi.fn(() => <div data-testid="tablet-icon" />),
    Smartphone: vi.fn(() => <div data-testid="smartphone-icon" />),
    Watch: vi.fn(() => <div data-testid="watch-icon" />),
    Headphones: vi.fn(() => <div data-testid="headphones-icon" />),
    Speaker: vi.fn(() => <div data-testid="speaker-icon" />),
    Music: vi.fn(() => <div data-testid="music-icon" />),
    Music2: vi.fn(() => <div data-testid="music2-icon" />),
    Play: vi.fn(() => <div data-testid="play-icon" />),
    Pause: vi.fn(() => <div data-testid="pause-icon" />),
    Stop: vi.fn(() => <div data-testid="stop-icon" />),
    SkipBack: vi.fn(() => <div data-testid="skip-back-icon" />),
    SkipForward: vi.fn(() => <div data-testid="skip-forward-icon" />),
    FastForward: vi.fn(() => <div data-testid="fast-forward-icon" />),
    Rewind: vi.fn(() => <div data-testid="rewind-icon" />),
    Repeat: vi.fn(() => <div data-testid="repeat-icon" />),
    Shuffle: vi.fn(() => <div data-testid="shuffle-icon" />),
    ListMusic: vi.fn(() => <div data-testid="list-music-icon" />),
    Library: vi.fn(() => <div data-testid="library-icon" />),
    Book: vi.fn(() => <div data-testid="book-icon" />),
    BookOpen: vi.fn(() => <div data-testid="book-open-icon" />),
    BookMarked: vi.fn(() => <div data-testid="book-marked-icon" />),
    File: vi.fn(() => <div data-testid="file-icon" />),
    Files: vi.fn(() => <div data-testid="files-icon" />),
    Folder: vi.fn(() => <div data-testid="folder-icon" />),
    Archive: vi.fn(() => <div data-testid="archive-icon" />),
    Inbox: vi.fn(() => <div data-testid="inbox-icon" />),
    Outbox: vi.fn(() => <div data-testid="outbox-icon" />),
    Send: vi.fn(() => <div data-testid="send-icon" />),
    Mail: vi.fn(() => <div data-testid="mail-icon" />),
    MailOpen: vi.fn(() => <div data-testid="mail-open-icon" />),
    MailCheck: vi.fn(() => <div data-testid="mail-check-icon" />),
    MailX: vi.fn(() => <div data-testid="mail-x-icon" />),
    MailPlus: vi.fn(() => <div data-testid="mail-plus-icon" />),
    MailMinus: vi.fn(() => <div data-testid="mail-minus-icon" />),
    MailQuestion: vi.fn(() => <div data-testid="mail-question-icon" />),
    MailSearch: vi.fn(() => <div data-testid="mail-search-icon" />),
    MailWarning: vi.fn(() => <div data-testid="mail-warning-icon" />),
    MailAlert: vi.fn(() => <div data-testid="mail-alert-icon" />),
    MailLock: vi.fn(() => <div data-testid="mail-lock-icon" />),
    MailUnlock: vi.fn(() => <div data-testid="mail-unlock-icon" />),
    MailKey: vi.fn(() => <div data-testid="mail-key-icon" />),
    MailShield: vi.fn(() => <div data-testid="mail-shield-icon" />),
    MailCheck2: vi.fn(() => <div data-testid="mail-check2-icon" />),
    MailX2: vi.fn(() => <div data-testid="mail-x2-icon" />),
    MailPlus2: vi.fn(() => <div data-testid="mail-plus2-icon" />),
    MailMinus2: vi.fn(() => <div data-testid="mail-minus2-icon" />),
    MailQuestion2: vi.fn(() => <div data-testid="mail-question2-icon" />),
    MailSearch2: vi.fn(() => <div data-testid="mail-search2-icon" />),
    MailWarning2: vi.fn(() => <div data-testid="mail-warning2-icon" />),
    MailAlert2: vi.fn(() => <div data-testid="mail-alert2-icon" />),
    MailLock2: vi.fn(() => <div data-testid="mail-lock2-icon" />),
    MailUnlock2: vi.fn(() => <div data-testid="mail-unlock2-icon" />),
    MailKey2: vi.fn(() => <div data-testid="mail-key2-icon" />),
    MailShield2: vi.fn(() => <div data-testid="mail-shield2-icon" />),
  };
  return {
    ...icons,
    __esModule: true,
  };
});

beforeAll(() => {
  // Set up any global test config
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  Object.defineProperty(window, 'localStorage', {
    writable: true,
    value: {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    },
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

afterAll(() => {
  vi.restoreAllMocks();
});

// Extend Vitest matchers
declare global {
  namespace Vi {
    interface Jest {
      toBeInTheDocument(): void;
      toHaveTextContent(text: string | RegExp): void;
      toHaveAttribute(attr: string, value?: string): void;
      toHaveClass(className: string): void;
      toHaveStyle(style: Record<string, any>): void;
      toBeVisible(): void;
      toBeDisabled(): void;
      toBeEnabled(): void;
      toBeChecked(): void;
      toHaveValue(value: string | string[] | number): void;
      toHaveDisplayValue(value: string | RegExp | (string | RegExp)[]): void;
      toBeRequired(): void;
      toBeInvalid(): void;
      toBeValid(): void;
    }
  }
}