/**
 * APIレスポンスの投稿データをフロントエンドの PostCard が期待する形式に変換します。
 * Timeline・Profile・Search・PostDetail など複数画面で共通利用できます。
 *
 * @param {Object} p - バックエンドAPIからの投稿データ
 * @returns {Object} PostCard props として渡せる形式の投稿オブジェクト
 */
export function formatPost(p) {
  return {
    id: p.id,
    content: p.content,
    image: p.image_url,
    createdAt: formatDateTime(p.created_at),
    user: {
      id: p.user.id,
      name: p.user.name,
      userId: `@${p.user.username || p.user.id}`,
      avatar: p.user.avatar_url,
    },
    likes: p.likes_count,
    reposts: p.reposts_count,
    replies: p.replies_count,
    isLiked: p.is_liked_by_me,
    isReposted: p.is_reposted_by_me,
    repostedBy: p.reposted_by ?? null,
  };
}

/**
 * ISO 8601 形式の日時文字列を日本語形式にフォーマットします。
 *
 * @param {string} dateString - ISO 8601 形式の日時文字列
 * @returns {string} 「6月18日 09:00」のような日本語形式
 */
export function formatDateTime(dateString) {
  if (!dateString) return '';
  let utcString = dateString;
  if (
    typeof dateString === 'string' &&
    !dateString.endsWith('Z') &&
    !dateString.includes('+') &&
    !dateString.match(/-\d{2}:\d{2}$/)
  ) {
    utcString = dateString + 'Z';
  }
  return new Date(utcString).toLocaleString('ja-JP', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
