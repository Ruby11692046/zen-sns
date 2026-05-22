import { ExternalLink, MessageSquare, Bug, ShieldAlert } from 'lucide-react';
import './Report.css';

const REPORT_ITEMS = [
  {
    id: 'feedback',
    icon: MessageSquare,
    title: '運営に関するご意見',
    desc: 'サービスについてのご意見やご要望',
    url: 'https://forms.google.com',
  },
  {
    id: 'bug',
    icon: Bug,
    title: '不具合・修正',
    desc: 'バグや不具合のご報告',
    url: 'https://forms.google.com',
  },
  {
    id: 'appeal',
    icon: ShieldAlert,
    title: 'ミュートに対する異議申し立て',
    desc: 'ミュート処分への異議申し立て',
    url: 'https://forms.google.com',
  },
];

export default function Report() {
  return (
    <div className="report" id="report-screen">
      {/* Header */}
      <header className="page-header">
        <h1 className="page-header__title">報告</h1>
      </header>

      <div className="report__content">
        <p className="report__desc">
          ご意見・不具合報告はGoogleフォームにて受け付けています。
        </p>
        <div className="report__items">
          {REPORT_ITEMS.map((item) => {
            const Icon = item.icon;
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
