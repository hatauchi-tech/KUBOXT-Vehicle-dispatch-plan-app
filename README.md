# KUBOXT 配車計画アプリ

株式会社KUBOXT向けの配車計画・管理Webアプリケーション。
受注管理、車両・荷主マスタ管理、ガントチャートによる配車計画、配車状況の確認、日報管理などを提供します。

**本番URL**: https://vehicle-dispatch-plan-app.web.app

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フロントエンド | React 19 + TypeScript 5.9 |
| ビルドツール | Vite 7.3 |
| スタイリング | Tailwind CSS 4.x |
| バックエンド | Firebase (Authentication + Cloud Firestore) |
| 認証 | Google Sign-In (signInWithPopup) |
| D&D | react-dnd + HTML5 Backend |
| CSV処理 | PapaParse |
| 日付処理 | date-fns |
| アイコン | Lucide React |

## 機能一覧

### 配車計画 (`/dispatch-plan`)
- **リストビュー**: 未配車/配車済の受注一覧表示
- **ガントチャート**: 無限スクロール対応のタイムライン表示
  - 左右スクロールで日付を自動拡張（±1日ずつ）
  - 車両列は左端に固定表示
  - 現在時刻に赤いバー表示
  - ドラッグ&ドロップで車両への配車割当
  - オーダーバーのリサイズで時間変更
  - 「今日」ボタンで現在時刻にスクロール
- **フィルタ**: 積込日範囲・荷主・車種で絞り込み
- **CSV一括インポート**: 受注データの一括取り込み

### 配車状況 (`/dispatch-status`)
- 配車済オーダーの進行状況管理
- 車両別・日付別のグルーピング表示（アコーディオン）
- ステータス更新（積込中・運搬中・荷卸中・完了）

### ドライバーダッシュボード (`/driver`)
- ドライバー向けの当日割当オーダー表示
- ステータス報告機能

### 日報管理 (`/daily-report`, `/daily-reports`)
- 出発/帰着時間、メーター記録
- 積込・荷卸時間の記録
- 車両点検メモ

### マスタ管理
- **車両マスタ** (`/master/vehicles`): 車両番号・車種・対応車種・ドライバー情報の管理
- **荷主マスタ** (`/master/customers`): 荷主名・連絡先・住所の管理
- CSV一括インポート対応（重複検知付き）

### ユーザー管理 (`/users`)
- Google アカウントベースのユーザー管理
- ロール割当: admin / dispatcher / driver

### 設定 (`/settings`)
- 対応車種・依頼種別のカスタマイズ
- 会社名設定

### マニュアル (`/manual`)
- アプリ内操作ガイド

## ロールベースアクセス制御

| 機能 | admin | dispatcher | driver |
|------|-------|-----------|--------|
| 配車計画 | ✅ | ✅ | - |
| 配車状況 | ✅ | ✅ | - |
| ドライバーダッシュボード | ✅ | ✅ | ✅ |
| 日報（自分の分） | ✅ | ✅ | ✅ |
| 日報（全員分） | ✅ | ✅ | - |
| 車両マスタ | ✅ | - | - |
| 荷主マスタ | ✅ | - | - |
| ユーザー管理 | ✅ | - | - |
| 設定 | ✅ | - | - |
| マニュアル | ✅ | ✅ | ✅ |

## セットアップ

### 前提条件
- Node.js 18+
- Firebase プロジェクト（Authentication + Firestore 有効化済み）

### インストール

```bash
git clone https://github.com/hatauchi-tech/KUBOXT-Vehicle-dispatch-plan-app.git
cd KUBOXT-Vehicle-dispatch-plan-app
npm install
```

### 環境変数の設定

`.env.example` をコピーして `.env` を作成し、Firebase の設定値を入力:

```bash
cp .env.example .env
```

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 開発サーバー起動

```bash
npm run dev
```

### ビルド & デプロイ

```bash
npm run build
npx firebase deploy --project vehicle-dispatch-plan-app
```

## プロジェクト構成

```
src/
├── components/          # UIコンポーネント
│   ├── alerts/          # アラートパネル
│   ├── csv/             # CSVインポートモーダル
│   ├── customers/       # 荷主フォーム・リスト
│   ├── gantt/           # ガントチャート関連
│   ├── orders/          # 受注フォーム・リスト・配車モーダル
│   ├── users/           # ユーザーフォーム・リスト
│   ├── vehicles/        # 車両フォーム・リスト
│   ├── Header.tsx       # ヘッダーナビゲーション
│   ├── Layout.tsx       # レイアウトラッパー
│   ├── ProtectedRoute.tsx # 認証・ロール保護
│   └── Sidebar.tsx      # サイドバーナビゲーション
├── config/
│   └── firebase.ts      # Firebase初期化
├── contexts/
│   ├── AuthContext.tsx   # 認証コンテキスト
│   └── SidebarContext.tsx # サイドバー開閉状態
├── hooks/               # カスタムフック（各リソースのCRUD）
├── pages/               # ページコンポーネント（10ページ）
├── services/            # Firestoreサービス層
├── types/
│   └── index.ts         # 型定義（User, Vehicle, Customer, Order等）
├── utils/
│   ├── cn.ts            # clsx + tailwind-merge ユーティリティ
│   └── csvParser.ts     # CSV解析ロジック
├── App.tsx              # ルーティング定義
├── main.tsx             # エントリーポイント
└── index.css            # Tailwind CSS 4.x インポート + テーマ変数
```

## アーキテクチャ

```
Firestore ←→ Services ←→ Custom Hooks ←→ Components
                                ↑
                          Context (Auth, Sidebar)
```

- **Service層**: Firestore との CRUD 操作をカプセル化
- **Hooks層**: Service を利用し、状態管理・エラーハンドリングを提供
- **Component層**: Hooks からデータと操作を受け取りUIを描画
- **Context**: アプリ全体の認証状態とサイドバー状態を管理

## Firestore コレクション

| コレクション | キー | 用途 |
|-------------|------|------|
| `users` | uid | ユーザー情報・ロール |
| `vehicles` | vehicleNumber | 車両マスタ |
| `customers` | customerId | 荷主マスタ |
| `orders` | orderId | 受注データ |
| `settings` | app-settings | アプリ設定 |
| `dailyReports` | reportId | 日報データ |

## ライセンス

Private - 株式会社KUBOXT
