import '@testing-library/jest-dom';
import React from 'react';
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
  const createIcon = (name: string) => vi.fn(() => React.createElement('div', { 'data-testid': `${name.toLowerCase()}-icon` }));
  
  const iconNames = [
    'Menu', 'X', 'ChevronDown', 'ChevronUp', 'ChevronLeft', 'ChevronRight', 'Plus', 'Minus', 'Search', 'Filter',
    'Settings', 'User', 'Users', 'Bell', 'AlertTriangle', 'CheckCircle', 'XCircle', 'Info', 'Loader2',
    'Eye', 'EyeOff', 'Edit', 'Trash', 'Download', 'Upload', 'Mail', 'Phone', 'Globe', 'Shield', 'Lock',
    'Unlock', 'Key', 'LogOut', 'LogIn', 'ArrowRight', 'ArrowLeft', 'ExternalLink', 'Copy', 'Check',
    'MoreHorizontal', 'MoreVertical', 'Grid', 'List', 'Calendar', 'Clock', 'Activity', 'BarChart',
    'PieChart', 'TrendingUp', 'TrendingDown', 'AlertCircle', 'RefreshCw', 'RotateCcw', 'Send',
    'MessageSquare', 'FileText', 'FolderOpen', 'Home', 'LayoutDashboard', 'Server', 'Database',
    'Cpu', 'HardDrive', 'Wifi', 'WifiOff', 'Zap', 'Target', 'Flag', 'Bookmark', 'Star', 'Heart',
    'Share2', 'Link', 'Tag', 'Hash', 'AtSign', 'DollarSign', 'CreditCard', 'Receipt', 'Package',
    'Box', 'Truck', 'Ship', 'Plane', 'Car', 'Bike', 'Walk', 'Run', 'Swim', 'Gym', 'Dumbbell',
    'Trophy', 'Medal', 'Award', 'Crown', 'Gem', 'Sparkles', 'MagicWand', 'Wand', 'ZapOff',
    'Battery', 'BatteryLow', 'BatteryCharging', 'Signal', 'SignalLow', 'SignalMedium', 'SignalHigh',
    'SignalZero', 'Volume2', 'Volume1', 'VolumeX', 'Mic', 'MicOff', 'Camera', 'CameraOff', 'Video',
    'VideoOff', 'Monitor', 'Laptop', 'Tablet', 'Smartphone', 'Watch', 'Headphones', 'Speaker',
    'Music', 'Music2', 'Play', 'Pause', 'Stop', 'SkipBack', 'SkipForward', 'FastForward', 'Rewind',
    'Repeat', 'Shuffle', 'ListMusic', 'Library', 'Book', 'BookOpen', 'BookMarked', 'File', 'Files',
    'Folder', 'Archive', 'Inbox', 'Outbox', 'Send', 'Mail', 'MailOpen', 'MailCheck', 'MailX',
    'MailPlus', 'MailMinus', 'MailQuestion', 'MailSearch', 'MailWarning', 'MailAlert', 'MailLock',
    'MailUnlock', 'MailKey', 'MailShield', 'MailCheck2', 'MailX2', 'MailPlus2', 'MailMinus2',
    'MailQuestion2', 'MailSearch2', 'MailWarning2', 'MailAlert2', 'MailLock2', 'MailUnlock2',
    'MailKey2', 'MailShield2'
  ];
  
  const icons: Record<string, any> = {};
  for (const name of iconNames) {
    icons[name] = createIcon(name);
  }
  
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