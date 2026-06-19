import { useCallback } from 'react';
import api from '../services/api';

/**
 * PostCard の onAction を処理する共通カスタムフック。
 * Timeline・Profile・Search・PostDetail など複数画面で再利用できます。
 *
 * @param {Object}   options
 * @param {Array|Object} options.posts      投稿リスト（リスト画面）または単一の投稿オブジェクト（詳細画面）
 * @param {Function} options.setPosts       React の状態更新関数
 * @param {Function} [options.onNavigate]   画面遷移関数
 * @param {Function} [options.onDelete]     削除完了後の追加コールバック (postId) => void
 *                                          ・リスト画面: 省略可（フックがリストから自動除去）
 *                                          ・詳細画面: onBack() など必要な処理を渡す
 * @param {Function} [options.onBlock]      ブロック完了後の追加コールバック (userId) => void
 *                                          ・省略時はブロックしたユーザーの投稿をリストから自動除去
 * @returns {Function} (type: string, postId: number) => Promise<void>
 *                     PostCard の onAction に直接渡せます。
 */
export function usePostActions({ posts, setPosts, onNavigate, onDelete, onBlock } = {}) {
  return useCallback(
    async (type, postId) => {
      const isList = Array.isArray(posts);
      // リストの場合は該当IDを検索、単一オブジェクトの場合はそのまま使用
      const post = isList ? posts.find((p) => p.id === postId) : posts;

      if (!post && type !== 'reply') return;

      // いいね・リポスト共通の楽観的状態更新ヘルパー
      const mapUpdate = (updater) => {
        if (isList) {
          setPosts?.((prev) => prev.map((p) => (p.id === postId ? updater(p) : p)));
        } else {
          // 単一オブジェクトの場合はそのまま更新
          setPosts?.((prev) => (prev ? updater(prev) : prev));
        }
      };

      switch (type) {
        case 'like':
          try {
            if (post.isLiked) {
              await api.delete(`/posts/${postId}/likes`);
            } else {
              await api.post(`/posts/${postId}/likes`);
            }
            mapUpdate((p) => ({
              ...p,
              isLiked: !p.isLiked,
              likes: p.isLiked ? p.likes - 1 : p.likes + 1,
            }));
          } catch (err) {
            console.error('Failed to toggle like:', err);
          }
          break;

        case 'repost':
          try {
            if (post.isReposted) {
              await api.delete(`/posts/${postId}/reposts`);
            } else {
              await api.post(`/posts/${postId}/reposts`);
            }
            mapUpdate((p) => ({
              ...p,
              isReposted: !p.isReposted,
              reposts: p.isReposted ? p.reposts - 1 : p.reposts + 1,
            }));
          } catch (err) {
            console.error('Failed to toggle repost:', err);
          }
          break;

        case 'delete':
          window.showConfirm?.('この投稿を削除しますか？', async () => {
            try {
              await api.delete(`/posts/${postId}`);
              // デフォルト: リストから除去（単一オブジェクト時はスキップ）
              if (isList) {
                setPosts?.((prev) => prev.filter((p) => p.id !== postId));
              }
              // カスタムコールバック（詳細画面での onBack 等）を追加実行
              onDelete?.(postId);
              window.showToast?.('投稿を削除しました。');
            } catch (err) {
              console.error('Failed to delete post:', err);
              window.showToast?.('削除に失敗しました。', 'error');
            }
          });
          break;

        case 'block': {
          const blockedUserId = post.user?.id;
          const blockedUserName = post.user?.name;
          window.showConfirm?.(
            `ユーザー ${blockedUserName} をブロックしますか？`,
            async () => {
              try {
                await api.post(`/users/${blockedUserId}/block`);
                // デフォルト: ブロックしたユーザーの投稿をリストから除去
                if (isList) {
                  setPosts?.((prev) => prev.filter((p) => p.user?.id !== blockedUserId));
                }
                // カスタムコールバックを追加実行
                onBlock?.(blockedUserId);
                window.showToast?.(`${blockedUserName} をブロックしました。`);
              } catch (err) {
                console.error('Failed to block user:', err);
                window.showToast?.('ブロックに失敗しました。', 'error');
              }
            }
          );
          break;
        }

        case 'reply':
          onNavigate?.('postDetail', { postId });
          break;

        default:
          break;
      }
    },
    // posts が変わるたびに最新状態を参照できるよう依存配列に含める
    [posts, setPosts, onNavigate, onDelete, onBlock]
  );
}
