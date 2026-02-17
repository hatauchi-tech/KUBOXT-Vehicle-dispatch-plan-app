import { useState, useEffect, useRef, useCallback } from 'react';
import {
  BookOpen,
  LayoutDashboard,
  CalendarCheck,
  Database,
  Users,
  MapPin,
  Settings,
  FileSpreadsheet,
  ChevronDown,
  ChevronRight,
  List,
  X,
} from 'lucide-react';
import { cn } from '../utils/cn';

type LucideIcon = typeof BookOpen;

interface Section {
  id: string;
  label: string;
  title: string;
  icon: LucideIcon;
  content: React.ReactNode;
}

/* ------------------------------------------------------------------ */
/*  Collapsible subsection component                                   */
/* ------------------------------------------------------------------ */

const Collapsible: React.FC<{
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}> = ({ title, defaultOpen = false, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200/60 rounded-lg overflow-hidden mb-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-gray-800 bg-gray-50/80 hover:bg-gray-100/80 transition-colors"
      >
        {open ? (
          <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-500 shrink-0" />
        )}
        {title}
      </button>
      {open && <div className="px-4 py-4 text-sm text-gray-600 leading-relaxed">{children}</div>}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Inline code badge                                                  */
/* ------------------------------------------------------------------ */

const Code: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <code className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono text-gray-700">
    {children}
  </code>
);

/* ------------------------------------------------------------------ */
/*  CSV column table                                                   */
/* ------------------------------------------------------------------ */

const CsvTable: React.FC<{ columns: { name: string; description: string; required?: boolean }[] }> = ({
  columns,
}) => (
  <div className="overflow-x-auto mb-4">
    <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
      <thead>
        <tr className="bg-gray-50 border-b border-gray-200">
          <th className="text-left px-4 py-2 font-semibold text-gray-700">列名</th>
          <th className="text-left px-4 py-2 font-semibold text-gray-700">説明</th>
          <th className="text-center px-4 py-2 font-semibold text-gray-700">必須</th>
        </tr>
      </thead>
      <tbody>
        {columns.map((col, i) => (
          <tr key={i} className="border-b border-gray-100 last:border-b-0">
            <td className="px-4 py-2">
              <Code>{col.name}</Code>
            </td>
            <td className="px-4 py-2 text-gray-600">{col.description}</td>
            <td className="px-4 py-2 text-center">
              {col.required !== false ? (
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  必須
                </span>
              ) : (
                <span className="text-xs text-gray-400">任意</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Section content definitions                                        */
/* ------------------------------------------------------------------ */

const GettingStartedContent = () => (
  <>
    <Collapsible title="アプリの概要" defaultOpen>
      <p className="mb-3">
        本システムは、株式会社KUBOXTの配車計画管理システムです。受注情報の登録から配車計画の作成、運行管理、日報管理まで、配車業務の一連のフローをWebブラウザ上で一元管理できます。
      </p>
      <p>
        ガントチャートを使った直感的な配車操作、CSVによるデータの一括登録、リアルタイムな配車状況の可視化など、業務効率を大幅に改善する機能を提供します。
      </p>
    </Collapsible>

    <Collapsible title="ロール（権限）について">
      <p className="mb-3">本システムには3つのロール（権限レベル）があります。</p>
      <ul className="space-y-2 list-none pl-0">
        <li className="flex items-start gap-2">
          <span className="shrink-0 mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded bg-red-50 text-red-600 text-xs font-bold">A</span>
          <span>
            <strong className="text-gray-800">管理者（admin）</strong> ― 全機能にアクセス可能。マスタデータの管理、ユーザー管理、システム設定を含む全ての操作が行えます。
          </span>
        </li>
        <li className="flex items-start gap-2">
          <span className="shrink-0 mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded bg-blue-50 text-blue-600 text-xs font-bold">D</span>
          <span>
            <strong className="text-gray-800">配車担当（dispatcher）</strong> ― 配車計画の作成・編集、配車状況の確認、日報管理が行えます。マスタ管理やユーザー管理にはアクセスできません。
          </span>
        </li>
        <li className="flex items-start gap-2">
          <span className="shrink-0 mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded bg-green-50 text-green-600 text-xs font-bold">D</span>
          <span>
            <strong className="text-gray-800">ドライバー（driver）</strong> ― 自分に割り当てられた配車の確認と日報の入力が行えます。
          </span>
        </li>
      </ul>
    </Collapsible>

    <Collapsible title="ログイン方法">
      <p className="mb-3">
        ログイン画面でGoogleアカウントを使用してログインします。初回ログイン時は管理者による承認が必要な場合があります。
      </p>
      <ol className="list-decimal pl-5 space-y-1">
        <li>ログイン画面の「Googleでログイン」ボタンをクリックします。</li>
        <li>Googleアカウントを選択し、認証を許可します。</li>
        <li>認証後、ロールに応じたトップページに遷移します。</li>
      </ol>
    </Collapsible>
  </>
);

const DispatchPlanContent = () => (
  <>
    <Collapsible title="リスト表示" defaultOpen>
      <p className="mb-3">
        受注一覧をリスト形式で確認できます。各受注の配車状況、荷主名、積込日時、荷卸日時などの情報が表示されます。
      </p>
      <ul className="list-disc pl-5 space-y-1 mb-3">
        <li>ステータス（未配車/配車済み/完了）による絞り込み</li>
        <li>荷主名や日付による検索</li>
        <li>受注の詳細表示と編集</li>
      </ul>
    </Collapsible>

    <Collapsible title="ガントチャート">
      <p className="mb-3">
        日別の配車状況をガントチャート形式でビジュアルに確認・操作できます。縦軸に車両、横軸に時間帯を配置し、各受注がバーとして表示されます。
      </p>

      <h4 className="text-sm font-semibold text-gray-800 mt-4 mb-2">ドラッグ&ドロップで配車</h4>
      <p className="mb-3">
        画面左の未配車パネルから受注を選択し、ガントチャート上の車両行にドラッグすることで配車を行えます。
      </p>

      <h4 className="text-sm font-semibold text-gray-800 mt-4 mb-2">バーの移動</h4>
      <p className="mb-3">
        配車済みのバーを別の車両行にドラッグすることで、車両の入れ替えが行えます。
      </p>

      <h4 className="text-sm font-semibold text-gray-800 mt-4 mb-2">時間の調整</h4>
      <p className="mb-3">
        バーの左右端をドラッグすることで、積込時間・荷卸時間を調整できます。時間は15分刻みでスナップします。
      </p>

      <h4 className="text-sm font-semibold text-gray-800 mt-4 mb-2">日またぎ案件</h4>
      <p>
        複数日にわたる案件は矢印マーク付きで表示されます。積込日と荷卸日が異なる場合、それぞれの日のガントチャートに表示されます。
      </p>
    </Collapsible>

    <Collapsible title="新規受注登録">
      <p className="mb-3">
        画面上部の「新規受注」ボタンから受注情報を登録できます。
      </p>
      <ul className="list-disc pl-5 space-y-1">
        <li>荷主名は荷主マスタに登録されている荷主から選択します。</li>
        <li>積込日時・荷卸日時を設定します。</li>
        <li>積込地・荷卸地の住所を入力します（2段階の住所入力に対応）。</li>
        <li>品名、依頼車種などの詳細情報を入力します。</li>
        <li>受注IDは <Code>ORD-YYYYMMDD-NNN</Code> の形式で自動採番されます。</li>
      </ul>
    </Collapsible>

    <Collapsible title="CSVインポート">
      <p className="mb-3">
        受注データをCSVファイルからまとめて取り込むことができます。荷主名は荷主マスタに登録されている名前と自動マッチングされ、受注IDは自動採番されます。
      </p>
      <p className="mb-2">
        詳細な列仕様については「CSVインポートガイド」セクションを参照してください。
      </p>
    </Collapsible>
  </>
);

const DispatchStatusContent = () => (
  <>
    <Collapsible title="統計情報の確認" defaultOpen>
      <p className="mb-3">
        配車状況ページでは、全体の配車状況を統計情報として確認できます。
      </p>
      <ul className="list-disc pl-5 space-y-1">
        <li>総受注件数、未配車件数、配車済み件数、完了件数</li>
        <li>車両稼働率</li>
        <li>日別・週別の配車推移</li>
      </ul>
    </Collapsible>

    <Collapsible title="フィルターとグルーピング">
      <p className="mb-3">
        さまざまな条件で配車状況を絞り込み、グルーピング表示できます。
      </p>
      <ul className="list-disc pl-5 space-y-1">
        <li>日付範囲の指定</li>
        <li>車両別、荷主別のグルーピング</li>
        <li>ステータスによるフィルタリング</li>
      </ul>
    </Collapsible>

    <Collapsible title="配車取消">
      <p>
        配車済みの受注を選択し、配車取消を行うことができます。取消された受注は未配車の状態に戻り、再度ガントチャートから配車可能になります。
      </p>
    </Collapsible>
  </>
);

const MasterDataContent = () => (
  <>
    <Collapsible title="車両マスタ" defaultOpen>
      <p className="mb-3">
        配車に使用する車両情報を管理します。
      </p>
      <ul className="list-disc pl-5 space-y-1 mb-3">
        <li>車両の新規登録・編集・削除</li>
        <li>ナンバー、無線番号、積載量、車種などの管理</li>
        <li>運転手の割り当て</li>
        <li>CSVファイルによる一括インポート</li>
      </ul>
      <p className="text-xs text-gray-500">
        CSV仕様の詳細は「CSVインポートガイド」セクションを参照してください。
      </p>
    </Collapsible>

    <Collapsible title="荷主マスタ">
      <p className="mb-3">
        荷主（取引先）情報を管理します。
      </p>
      <ul className="list-disc pl-5 space-y-1 mb-3">
        <li>荷主の新規登録・編集・削除</li>
        <li>荷主ID、荷主名、連絡先、住所、特記事項の管理</li>
        <li>CSVファイルによる一括インポート</li>
      </ul>
      <p className="text-xs text-gray-500">
        受注データのCSVインポート時、荷主名は荷主マスタの登録名と完全一致している必要があります。
      </p>
    </Collapsible>
  </>
);

const UserManagementContent = () => (
  <>
    <Collapsible title="ユーザー一覧" defaultOpen>
      <p className="mb-3">
        登録されている全ユーザーの一覧を確認できます。ユーザー名、メールアドレス、ロール、最終ログイン日時が表示されます。
      </p>
    </Collapsible>

    <Collapsible title="権限変更">
      <p className="mb-3">
        ユーザーのロール（admin / dispatcher / driver）を変更できます。権限の変更は管理者のみが行えます。
      </p>
      <p className="text-xs text-gray-500">
        自分自身のロールを変更することはできません。
      </p>
    </Collapsible>

    <Collapsible title="パスワードリセット">
      <p>
        Googleアカウント認証を使用しているため、パスワードの管理はGoogleアカウント側で行います。アカウントに問題がある場合はGoogle側のパスワードリセットをご利用ください。
      </p>
    </Collapsible>
  </>
);

const DriverFeaturesContent = () => (
  <>
    <Collapsible title="マイ配車" defaultOpen>
      <p className="mb-3">
        ドライバーに割り当てられた配車を日別で確認できます。
      </p>
      <ul className="list-disc pl-5 space-y-1">
        <li>本日の配車スケジュールの確認</li>
        <li>積込地・荷卸地の詳細情報</li>
        <li>品名、荷主名の確認</li>
        <li>日付を切り替えて先の予定を確認</li>
      </ul>
    </Collapsible>

    <Collapsible title="日報入力">
      <p className="mb-3">
        運行終了後、日報を入力します。
      </p>
      <ul className="list-disc pl-5 space-y-1">
        <li>出庫時間・帰庫時間の記録</li>
        <li>出発メーター・帰着メーターの記録</li>
        <li>出発前点検の結果入力</li>
        <li>運行中の特記事項の記録</li>
      </ul>
    </Collapsible>
  </>
);

const SettingsContent = () => (
  <>
    <Collapsible title="基本設定" defaultOpen>
      <p className="mb-3">
        システムの基本情報を設定します。
      </p>
      <ul className="list-disc pl-5 space-y-1">
        <li>会社名の設定</li>
      </ul>
    </Collapsible>

    <Collapsible title="車種設定">
      <p className="mb-3">
        システムで使用する車種の一覧を管理します。ここで登録した車種は、車両マスタの車種選択や受注登録の依頼車種選択で使用されます。
      </p>
      <ul className="list-disc pl-5 space-y-1">
        <li>車種の追加・削除</li>
        <li>例：4tユニック、10t平、トレーラーなど</li>
      </ul>
    </Collapsible>

    <Collapsible title="依頼タイプ設定">
      <p className="mb-3">
        受注で使用する依頼タイプの一覧を管理します。
      </p>
      <ul className="list-disc pl-5 space-y-1">
        <li>依頼タイプの追加・削除</li>
        <li>例：一般貨物、引越、チャーターなど</li>
      </ul>
    </Collapsible>
  </>
);

const CsvGuideContent = () => (
  <>
    <Collapsible title="テンプレートのダウンロード" defaultOpen>
      <p className="mb-3">
        各マスタ管理画面やCSVインポートダイアログから、CSVテンプレートファイルをダウンロードできます。テンプレートには正しいヘッダー行が含まれていますので、データ行を追加してインポートしてください。
      </p>
      <p>
        ファイルのエンコーディングは <Code>UTF-8</Code> または <Code>Shift-JIS</Code> に対応しています。
      </p>
    </Collapsible>

    <Collapsible title="車両マスタCSV">
      <p className="mb-3">車両マスタのCSVインポートに使用する列は以下の通りです。</p>
      <CsvTable
        columns={[
          { name: 'ナンバー', description: '車両のナンバープレート番号' },
          { name: '無線番号', description: '車両に割り当てられた無線番号' },
          { name: '積載量', description: '最大積載量（数値、トン単位）' },
          { name: '車種', description: '車種名（設定画面で登録済みの車種名）' },
          { name: '対応可能依頼', description: '対応可能な依頼タイプ（カンマ区切りで複数指定可）', required: false },
          { name: '運転手', description: '主担当ドライバーの名前', required: false },
          { name: '電話番号', description: 'ドライバーの連絡先電話番号', required: false },
          { name: 'メール', description: 'ドライバーのメールアドレス', required: false },
          { name: '備考', description: '車両に関する備考・特記事項', required: false },
        ]}
      />
    </Collapsible>

    <Collapsible title="荷主マスタCSV">
      <p className="mb-3">荷主マスタのCSVインポートに使用する列は以下の通りです。</p>
      <CsvTable
        columns={[
          { name: '荷主ID', description: '荷主を識別する一意のID' },
          { name: '荷主名', description: '荷主（取引先）の名称' },
          { name: '電話番号', description: '連絡先電話番号', required: false },
          { name: '住所', description: '荷主の住所', required: false },
          { name: '特記事項', description: '取引上の注意事項など', required: false },
        ]}
      />
    </Collapsible>

    <Collapsible title="受注データCSV">
      <p className="mb-3">受注データのCSVインポートに使用する列は以下の通りです。</p>
      <CsvTable
        columns={[
          { name: '受付日', description: '受注を受け付けた日付（YYYY/MM/DD形式）' },
          { name: '荷主名', description: '荷主マスタに登録済みの荷主名（完全一致）' },
          { name: '積込日', description: '積込予定日（YYYY/MM/DD形式）' },
          { name: '積込時間', description: '積込予定時間（HH:MM形式）' },
          { name: '積込地1', description: '積込地の住所（都道府県・市区町村）' },
          { name: '積込地2', description: '積込地の住所（番地・建物名）', required: false },
          { name: '品名', description: '輸送する品物の名称' },
          { name: '荷卸日', description: '荷卸予定日（YYYY/MM/DD形式）' },
          { name: '荷卸時間', description: '荷卸予定時間（HH:MM形式）' },
          { name: '荷卸地1', description: '荷卸地の住所（都道府県・市区町村）' },
          { name: '荷卸地2', description: '荷卸地の住所（番地・建物名）', required: false },
          { name: '依頼車種', description: '必要な車種（設定画面で登録済みの車種名）' },
        ]}
      />

      <h4 className="text-sm font-semibold text-gray-800 mt-4 mb-2">インポート時の注意事項</h4>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          受注IDは <Code>ORD-YYYYMMDD-NNN</Code> の形式で自動的に採番されます。CSVファイルに受注IDの列は不要です。
        </li>
        <li>
          荷主名は荷主マスタに登録されている名前と<strong>完全一致</strong>が必要です。一致しない場合はエラーとなり、該当行はスキップされます。
        </li>
        <li>
          同一内容（同じ荷主名・積込日時・荷卸日時・積込地・荷卸地）の受注が既に登録されている場合、重複として自動でスキップされます。
        </li>
        <li>
          インポート完了後、取り込み件数とスキップ件数が表示されます。
        </li>
      </ul>
    </Collapsible>

    <Collapsible title="エンコーディングについて">
      <p className="mb-3">
        CSVファイルのエンコーディングは以下の2種類に対応しています。
      </p>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <Code>UTF-8</Code> ― 推奨。Google スプレッドシートや多くのテキストエディタでの保存時のデフォルト形式。
        </li>
        <li>
          <Code>Shift-JIS</Code> ― Microsoft Excel で「CSV（コンマ区切り）」として保存した場合のデフォルト形式。
        </li>
      </ul>
      <p className="mt-3 text-xs text-gray-500">
        文字化けが発生する場合は、テキストエディタでファイルを開きUTF-8で保存し直してからインポートしてください。
      </p>
    </Collapsible>
  </>
);

/* ------------------------------------------------------------------ */
/*  Section definitions                                                */
/* ------------------------------------------------------------------ */

const sections: Section[] = [
  {
    id: 'getting-started',
    label: 'はじめに',
    title: 'はじめに',
    icon: BookOpen,
    content: <GettingStartedContent />,
  },
  {
    id: 'dispatch-plan',
    label: '配車計画',
    title: '配車計画',
    icon: LayoutDashboard,
    content: <DispatchPlanContent />,
  },
  {
    id: 'dispatch-status',
    label: '配車状況',
    title: '配車状況',
    icon: CalendarCheck,
    content: <DispatchStatusContent />,
  },
  {
    id: 'master-data',
    label: 'マスタ管理',
    title: 'マスタ管理',
    icon: Database,
    content: <MasterDataContent />,
  },
  {
    id: 'user-management',
    label: 'ユーザー管理',
    title: 'ユーザー管理',
    icon: Users,
    content: <UserManagementContent />,
  },
  {
    id: 'driver-features',
    label: '運転手向け',
    title: '運転手向け機能',
    icon: MapPin,
    content: <DriverFeaturesContent />,
  },
  {
    id: 'settings',
    label: '設定',
    title: '設定',
    icon: Settings,
    content: <SettingsContent />,
  },
  {
    id: 'csv-guide',
    label: 'CSVガイド',
    title: 'CSVインポートガイド',
    icon: FileSpreadsheet,
    content: <CsvGuideContent />,
  },
];

/* ------------------------------------------------------------------ */
/*  ManualPage component                                               */
/* ------------------------------------------------------------------ */

export const ManualPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>(sections[0].id);
  const [showToc, setShowToc] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());

  const registerRef = useCallback((id: string, el: HTMLElement | null) => {
    if (el) {
      sectionRefs.current.set(id, el);
    } else {
      sectionRefs.current.delete(id);
    }
  }, []);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0 && visible[0].target.id) {
          setActiveSection(visible[0].target.id);
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 },
    );

    sectionRefs.current.forEach((el) => {
      observerRef.current?.observe(el);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  /* re-observe when refs change */
  useEffect(() => {
    const observer = observerRef.current;
    if (!observer) return;

    sectionRefs.current.forEach((el) => {
      observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          マニュアル
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          配車計画管理システムの操作方法と各機能の詳細について説明します。
        </p>
      </div>

      {/* Floating TOC button for tablet/mobile */}
      <button
        onClick={() => setShowToc(true)}
        className="fixed bottom-6 right-6 z-40 lg:hidden inline-flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 active:bg-blue-800 transition-colors text-sm font-medium min-h-[48px]"
        aria-label="目次を開く"
      >
        <List className="w-5 h-5" />
        目次
      </button>

      {/* Overlay TOC for tablet/mobile */}
      {showToc && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowToc(false)}
          />
          <nav className="absolute right-0 top-0 h-full w-72 max-w-[85vw] bg-white shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-700">目次</p>
              <button
                onClick={() => setShowToc(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="目次を閉じる"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-3 space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      setShowToc(false);
                      const el = document.getElementById(section.id);
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                    className={cn(
                      'block px-3 py-2.5 text-sm rounded-lg transition-colors',
                      activeSection === section.id
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {section.label}
                    </span>
                  </a>
                );
              })}
            </div>
          </nav>
        </div>
      )}

      <div className="flex gap-8">
        {/* TOC sidebar (desktop only) */}
        <nav className="w-56 shrink-0 hidden lg:block">
          <div className="sticky top-0 space-y-1">
            <p className="px-3 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              目次
            </p>
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    const el = document.getElementById(section.id);
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  className={cn(
                    'block px-3 py-2 text-sm rounded-lg transition-colors',
                    activeSection === section.id
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {section.label}
                  </span>
                </a>
              );
            })}
          </div>
        </nav>

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-8">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <section
                key={section.id}
                id={section.id}
                ref={(el) => registerRef(section.id, el)}
                className="bg-white rounded-xl border border-gray-200/60 shadow-sm overflow-hidden"
              >
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-blue-600" />
                  </div>
                  <h2 className="text-base font-semibold text-gray-900">{section.title}</h2>
                </div>
                <div className="px-6 py-5">{section.content}</div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
};
