import './Terms.css';

export default function Terms() {
  return (
    <div className="terms" id="terms-screen">
      {/* Header */}
      <header className="page-header">
        <h1 className="page-header__title">利用規約</h1>
      </header>

      <div className="terms__content">
        <div className="terms__document">
          <h2>ZEN SNS 利用規約</h2>
          <p className="terms__updated">最終更新日: 2026年5月1日</p>

          <section>
            <h3>第1条（目的）</h3>
            <p>
              本利用規約（以下「本規約」）は、ZEN SNS（以下「本サービス」）の利用条件を定めるものです。
              ユーザーは本規約に同意の上、本サービスをご利用ください。
            </p>
          </section>

          <section>
            <h3>第2条（利用資格）</h3>
            <p>
              本サービスは、所定の学校ドメイン（@xxx.ac.jp）のGoogleアカウントを所持する学生のみ利用可能です。
            </p>
          </section>

          <section>
            <h3>第3条（禁止事項）</h3>
            <ul>
              <li>他のユーザーへの誹謗中傷、嫌がらせ行為</li>
              <li>虚偽の情報の投稿</li>
              <li>著作権を侵害するコンテンツの投稿</li>
              <li>法令に違反する行為</li>
              <li>サービスの運営を妨害する行為</li>
              <li>その他、運営が不適切と判断する行為</li>
            </ul>
          </section>

          <section>
            <h3>第4条（ミュート措置）</h3>
            <p>
              運営は、本規約に違反したユーザーに対し、投稿機能を制限する「ミュート」措置を行うことがあります。
              ミュート措置に対する異議申し立ては、所定のGoogleフォームより受け付けます。
            </p>
          </section>

          <section>
            <h3>第5条（免責事項）</h3>
            <p>
              本サービスは学生プロジェクトとして運営されており、サービスの継続性・安定性について保証するものではありません。
              ユーザー間のトラブルについて、運営は一切の責任を負いません。
            </p>
          </section>

          <section>
            <h3>第6条（規約の変更）</h3>
            <p>
              運営は、必要と判断した場合、ユーザーへの事前通知なく本規約を変更できるものとします。
              変更後の規約は、本サービス上に掲示した時点で効力を生じるものとします。
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
