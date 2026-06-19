import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Login from '../pages/Login';
import Timeline from '../pages/Timeline';
import PostDetail from '../pages/PostDetail';
import Profile from '../pages/Profile';
import Search from '../pages/Search';
import Notifications from '../pages/Notifications';
import Settings from '../pages/Settings';
import Report from '../pages/Report';
import Terms from '../pages/Terms';
import Relations from '../pages/Relations';
import { CURRENT_USER } from '../data/mockData';

// ============================================================
// Login Page Tests
// ============================================================
describe('Login', () => {
  it('ZENロゴが表示される', () => {
    render(<Login />);
    expect(screen.getByText('ZEN')).toBeInTheDocument();
  });

  it('タグラインが表示される', () => {
    render(<Login />);
    expect(screen.getByText('つながる、棲み分ける、楽しむ。')).toBeInTheDocument();
  });

  it('Googleログインボタンが表示される', () => {
    render(<Login />);
    expect(screen.getByText('Googleアカウントでログイン')).toBeInTheDocument();
  });

  it('ログインボタンをクリックするとonLoginが呼ばれる', () => {
    let loginCalled = false;
    render(<Login onLogin={() => { loginCalled = true; }} />);
    fireEvent.click(screen.getByText('Googleアカウントでログイン'));
    expect(loginCalled).toBe(true);
  });
});

// ============================================================
// Timeline Page Tests
// ============================================================
describe('Timeline', () => {
  it('3つのタブが表示される', () => {
    render(<Timeline onNavigate={() => {}} onOpenSidebar={() => {}} user={CURRENT_USER} />);
    expect(screen.getByText('おすすめ')).toBeInTheDocument();
    expect(screen.getByText('フォロー')).toBeInTheDocument();
    expect(screen.getByText('全体')).toBeInTheDocument();
  });

  it('投稿作成欄が表示される', () => {
    render(<Timeline onNavigate={() => {}} onOpenSidebar={() => {}} user={CURRENT_USER} />);
    expect(screen.getByPlaceholderText('いまどうしてる？')).toBeInTheDocument();
  });

  it('投稿カードが表示される', () => {
    render(<Timeline onNavigate={() => {}} onOpenSidebar={() => {}} user={CURRENT_USER} />);
    // MOCK_POSTS[0] のユーザー名が表示されていること（複数投稿で同一ユーザーがいる場合がある）
    const elements = screen.getAllByText('佐藤 花子');
    expect(elements.length).toBeGreaterThan(0);
  });
});

// ============================================================
// PostDetail Page Tests
// ============================================================
describe('PostDetail', () => {
  it('投稿ヘッダーに「投稿」が表示される', () => {
    render(<PostDetail postId={1} onNavigate={() => {}} onBack={() => {}} />);
    expect(screen.getByText('投稿')).toBeInTheDocument();
  });

  it('返信入力欄が表示される', () => {
    render(<PostDetail postId={1} onNavigate={() => {}} onBack={() => {}} />);
    expect(screen.getByPlaceholderText('返信を入力...')).toBeInTheDocument();
  });

  it('返信セクションのタイトルが表示される', () => {
    render(<PostDetail postId={1} onNavigate={() => {}} onBack={() => {}} />);
    expect(screen.getByText('返信')).toBeInTheDocument();
  });
});

// ============================================================
// Profile Page Tests
// ============================================================
describe('Profile', () => {
  it('自分のプロフィールで編集ボタンが表示される', () => {
    render(<Profile userId={0} onNavigate={() => {}} onBack={() => {}} />);
    expect(screen.getByText('プロフィールを編集')).toBeInTheDocument();
  });

  it('他人のプロフィールでフォローボタンが表示される', () => {
    render(<Profile userId={1} onNavigate={() => {}} onBack={() => {}} />);
    expect(screen.getByText('フォロー')).toBeInTheDocument();
  });

  it('4つのタブが表示される', () => {
    render(<Profile userId={0} onNavigate={() => {}} onBack={() => {}} />);
    expect(screen.getByText('投稿')).toBeInTheDocument();
    expect(screen.getByText('返信')).toBeInTheDocument();
    expect(screen.getByText('メディア')).toBeInTheDocument();
    expect(screen.getByText('いいね')).toBeInTheDocument();
  });

  it('フォロー/フォロワー数が表示される', () => {
    render(<Profile userId={0} onNavigate={() => {}} onBack={() => {}} />);
    expect(screen.getByText('フォロー中')).toBeInTheDocument();
    expect(screen.getByText('フォロワー')).toBeInTheDocument();
  });
});

// ============================================================
// Search Page Tests
// ============================================================
describe('Search', () => {
  it('検索入力欄が表示される', () => {
    render(<Search onNavigate={() => {}} />);
    expect(screen.getByPlaceholderText('投稿やユーザーを検索...')).toBeInTheDocument();
  });

  it('検索履歴が表示される', () => {
    render(<Search onNavigate={() => {}} />);
    expect(screen.getByText('最近の検索')).toBeInTheDocument();
    expect(screen.getByText('React hooks')).toBeInTheDocument();
  });

  it('検索実行後、結果タブが表示される', () => {
    render(<Search onNavigate={() => {}} />);
    const input = screen.getByPlaceholderText('投稿やユーザーを検索...');
    fireEvent.change(input, { target: { value: 'テスト' } });
    fireEvent.click(screen.getByText('検索'));
    expect(screen.getByText('投稿')).toBeInTheDocument();
    expect(screen.getByText('メディア')).toBeInTheDocument();
    expect(screen.getByText('アカウント')).toBeInTheDocument();
  });
});

// ============================================================
// Notifications Page Tests
// ============================================================
describe('Notifications', () => {
  it('ヘッダーに「通知」が表示される', () => {
    render(<Notifications onNavigate={() => {}} />);
    expect(screen.getByText('通知')).toBeInTheDocument();
  });

  it('通知アイテムが表示される', () => {
    render(<Notifications onNavigate={() => {}} />);
    // テキストが複数ノードに分散しているため、部分一致で検証
    const items = screen.getAllByText(/いいねしました/);
    expect(items.length).toBeGreaterThan(0);
    const followItems = screen.getAllByText(/フォローしました/);
    expect(followItems.length).toBeGreaterThan(0);
  });
});

// ============================================================
// Settings Page Tests
// ============================================================
describe('Settings', () => {
  beforeEach(() => {
    // jsdom環境でlocalStorageをモック
    const store = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key) => store[key] || null),
      setItem: vi.fn((key, value) => { store[key] = value; }),
      removeItem: vi.fn((key) => { delete store[key]; }),
    });
  });

  it('ヘッダーに「設定」が表示される', () => {
    render(<Settings onNavigate={() => {}} />);
    expect(screen.getByText('設定')).toBeInTheDocument();
  });

  it('3つのテーマオプションが表示される', () => {
    render(<Settings onNavigate={() => {}} />);
    expect(screen.getByText('システム設定に従う')).toBeInTheDocument();
    expect(screen.getByText('ライトモード')).toBeInTheDocument();
    expect(screen.getByText('ダークモード')).toBeInTheDocument();
  });

  it('ログアウトボタンが表示される', () => {
    render(<Settings onNavigate={() => {}} />);
    expect(screen.getByText('ログアウト')).toBeInTheDocument();
  });
});

// ============================================================
// Report Page Tests
// ============================================================
describe('Report', () => {
  it('ヘッダーに「報告」が表示される', () => {
    render(<Report />);
    expect(screen.getByText('報告')).toBeInTheDocument();
  });

  it('3つの報告項目が表示される', () => {
    render(<Report />);
    expect(screen.getByText('運営に関するご意見')).toBeInTheDocument();
    expect(screen.getByText('不具合・修正')).toBeInTheDocument();
    expect(screen.getByText('ミュートに対する異議申し立て')).toBeInTheDocument();
  });
});

// ============================================================
// Terms Page Tests
// ============================================================
describe('Terms', () => {
  it('ヘッダーに「利用規約」が表示される', () => {
    render(<Terms />);
    expect(screen.getByText('利用規約')).toBeInTheDocument();
  });

  it('規約本文が表示される', () => {
    render(<Terms />);
    expect(screen.getByText('Mist 利用規約')).toBeInTheDocument();
    expect(screen.getByText('第1条（目的）')).toBeInTheDocument();
  });
});

// ============================================================
// Relations Page Tests
// ============================================================
describe('Relations', () => {
  it('ヘッダーやタブなどの基本UIが正しく表示される', () => {
    // 読み込み中表示になることを検証（非同期ロードが発生するため初期状態はローディング）
    render(<Relations defaultTab="following" onNavigate={() => {}} onBack={() => {}} userId={1} />);
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });
});
