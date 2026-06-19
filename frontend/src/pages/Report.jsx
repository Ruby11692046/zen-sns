import { ExternalLink, MessageSquare, Bug, ShieldAlert } from 'lucide-react';
import './Report.css';

export default function Report() {
  const handleBugReportClick = (e) => {
    e.preventDefault();
    window.showConfirm?.(
      '現在Slack上のチャンネル、#{TODO:後で書く}で不具合・修正についての報告を承っております。',
      () => {}, // OK
      false     // キャンセルボタンを表示しない
    );
  };

  const REPORT_ITEMS = [
    {
      id: 'feedback',
      icon: MessageSquare,
      title: '運営に関するご意見',
      desc: 'サービスについてのご意見やご要望',
      url: 'https://docs.google.com/forms/d/e/1FAIpQLSfjo-QIx7E5zxjWcWEHLKFscwGna04EVyzs_hC7tDom7Na22w/viewform?usp=publish-editor',
    },
    {
      id: 'bug',
      icon: Bug,
      title: '不具合・修正',
      desc: 'バグや不具合のご報告',
      onClick: handleBugReportClick,
    },
    {
      id: 'appeal',
      icon: ShieldAlert,
      title: 'ミュートに対する異議申し立て',
      desc: 'ミュート処分への異議申し立て',
      url: 'https://docs.google.com/forms/d/e/1FAIpQLSeht10uCG-C5OnSse8OaZvsSgUIKJ2eI8ricizD2RG4DPXGJQ/viewform?usp=publish-editor',
    },
  ];

  return (
    <div className="report" id="report-screen">
      {/* Header */}
      <header className="page-header">
        <h1 className="page-header__title">報告</h1>
      </header>

      <div className="report__content">
        <p className="report__desc">
          ご意見・不具合報告を受け付けています。
        </p>
        <div className="report__items">
          {REPORT_ITEMS.map((item) => {
            const Icon = item.icon;
            
            if (item.onClick) {
              return (
                <button
                  key={item.id}
                  className="report__item report__item--button"
                  onClick={item.onClick}
                  style={{
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    width: '100%',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                  id={`report-${item.id}`}
                >
                  <div className="report__item-icon">
                    <Icon size={22} />
                  </div>
                  <div className="report__item-info">
                    <span className="report__item-title">{item.title}</span>
                    <span className="report__item-desc">{item.desc}</span>
                  </div>
                  <ExternalLink size={16} className="report__item-arrow" />
                </button>
              );
            }

            return (
              <a
                key={item.id}
                className="report__item"
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                id={`report-${item.id}`}
              >
                <div className="report__item-icon">
                  <Icon size={22} />
                </div>
                <div className="report__item-info">
                  <span className="report__item-title">{item.title}</span>
                  <span className="report__item-desc">{item.desc}</span>
                </div>
                <ExternalLink size={16} className="report__item-arrow" />
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
