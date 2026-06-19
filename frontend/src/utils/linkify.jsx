import React from 'react';

/**
 * テキスト内のURL（http:// または https:// で始まるもの）を検知し、
 * Reactの <a> タグ要素に置き換えた配列を返します。
 *
 * @param {string} text - 投稿本文
 * @returns {React.ReactNode} リンク化されたコンテンツ
 */
export function renderContentWithLinks(text) {
  if (!text) return null;

  // URLを検出するための正規表現
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="post-card__text-link"
          onClick={(e) => e.stopPropagation()} // 親カードのクリックイベント（詳細画面への遷移）を防止
        >
          {part}
        </a>
      );
    }
    return part;
  });
}
