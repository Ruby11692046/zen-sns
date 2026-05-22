import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PostCard from '../components/PostCard';
import Composer from '../components/Composer';
import BottomNav from '../components/BottomNav';
import { MOCK_POSTS, CURRENT_USER } from '../data/mockData';

// ============================================================
// PostCard Component Tests
// ============================================================
describe('PostCard', () => {
  const mockPost = MOCK_POSTS[0];

  it('ユーザー名と投稿内容が表示される', () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByText(mockPost.user.name)).toBeInTheDocument();
    expect(screen.getByText(mockPost.content)).toBeInTheDocument();
  });

  it('ユーザーIDが表示される', () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByText(mockPost.user.userId)).toBeInTheDocument();
  });

  it('いいね数・リポスト数・返信数が表示される', () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByText(String(mockPost.likes))).toBeInTheDocument();
    expect(screen.getByText(String(mockPost.reposts))).toBeInTheDocument();
    expect(screen.getByText(String(mockPost.replies))).toBeInTheDocument();
  });

  it('投稿時間が表示される', () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByText(mockPost.createdAt)).toBeInTheDocument();
  });

  it('投稿をクリックするとonPostClickが呼ばれる', () => {
    let clickedId = null;
    render(
      <PostCard
        post={mockPost}
        onPostClick={(id) => { clickedId = id; }}
      />
    );
    fireEvent.click(screen.getByText(mockPost.content));
    expect(clickedId).toBe(mockPost.id);
  });

  it('アバターのイニシャルが表示される', () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByLabelText(`${mockPost.user.name}のプロフィール`)).toBeInTheDocument();
  });
});

// ============================================================
// Composer Component Tests
// ============================================================
describe('Composer', () => {
  it('テキストエリアが表示される', () => {
    render(<Composer user={CURRENT_USER} />);
    expect(screen.getByPlaceholderText('いまどうしてる？')).toBeInTheDocument();
  });

  it('テキストが空の場合、投稿ボタンが無効化される', () => {
    render(<Composer user={CURRENT_USER} />);
    const submitBtn = screen.getByText('投稿');
    expect(submitBtn.closest('button')).toBeDisabled();
  });

  it('テキスト入力後、投稿ボタンが有効化される', () => {
    render(<Composer user={CURRENT_USER} />);
    const textarea = screen.getByPlaceholderText('いまどうしてる？');
    fireEvent.change(textarea, { target: { value: 'テスト投稿' } });
    const submitBtn = screen.getByText('投稿');
    expect(submitBtn.closest('button')).not.toBeDisabled();
  });

  it('ミュート中の場合、ミュート表示が出る', () => {
    render(<Composer user={CURRENT_USER} isMuted={true} />);
    expect(screen.getByText('あなたはミュートされています')).toBeInTheDocument();
  });

  it('ミュート中の場合、異議申し立てリンクが表示される', () => {
    render(<Composer user={CURRENT_USER} isMuted={true} />);
    expect(screen.getByText('異議申し立てはこちら')).toBeInTheDocument();
  });
});

// ============================================================
// BottomNav Component Tests
// ============================================================
describe('BottomNav', () => {
  it('ホーム・検索・通知・マイページの4アイテムが表示される', () => {
    render(<BottomNav currentScreen="timeline" onNavigate={() => {}} />);
    expect(screen.getByText('ホーム')).toBeInTheDocument();
    expect(screen.getByText('検索')).toBeInTheDocument();
    expect(screen.getByText('通知')).toBeInTheDocument();
    expect(screen.getByText('マイページ')).toBeInTheDocument();
  });

  it('currentScreenに対応するアイテムにactiveクラスが付く', () => {
    render(<BottomNav currentScreen="timeline" onNavigate={() => {}} />);
    const homeBtn = screen.getByText('ホーム').closest('button');
    expect(homeBtn).toHaveClass('active');
  });

  it('ナビアイテムをクリックするとonNavigateが呼ばれる', () => {
    let navigatedTo = null;
    render(
      <BottomNav
        currentScreen="timeline"
        onNavigate={(screen) => { navigatedTo = screen; }}
      />
    );
    fireEvent.click(screen.getByText('検索'));
    expect(navigatedTo).toBe('search');
  });
});
