# CLAUDE.md - 配車計画アプリ開発ガイド

## プロジェクト概要

株式会社KUBOXT向け配車計画Webアプリ。Firebase (Auth + Firestore) をバックエンドに使用。

- **Firebase Project**: `vehicle-dispatch-plan-app`
- **Hosting**: https://vehicle-dispatch-plan-app.web.app
- **ブランチ**: `feature/vehicle-dispatch-app` で開発

## コマンド

```bash
# 開発サーバー
npm run dev

# ビルド（TypeScript チェック + Vite ビルド）
npm run build

# デプロイ
npm run build && npx firebase deploy --project vehicle-dispatch-plan-app

# Lint
npm run lint
```

## 技術スタック・バージョン

- **Vite 7.3** + **React 19** + **TypeScript 5.9**
- **Tailwind CSS 4.x**: `@import "tailwindcss"` を使用（`@tailwind base/components/utilities` は旧形式なので使わない）
- **Firebase 12.9**: Authentication (Google Sign-In) + Cloud Firestore
- **react-dnd 16**: ドラッグ&ドロップ（HTML5 Backend）
- **date-fns 4**: 日付処理
- **papaparse 5**: CSV パース
- **lucide-react**: アイコン

## アーキテクチャ

```
Firestore ←→ Services (src/services/) ←→ Hooks (src/hooks/) ←→ Components
```

### レイヤー規約

1. **Service層** (`src/services/`): Firestore の CRUD 操作のみ。UI ロジックを含めない
2. **Hooks層** (`src/hooks/`): Service を呼び出し、useState/useEffect で状態管理。エラーハンドリングもここ
3. **Component層** (`src/components/`, `src/pages/`): Hooks からデータを受け取り UI を描画
4. **Context** (`src/contexts/`): グローバル状態（認証、サイドバー開閉）

### ファイル配置

- ページコンポーネント: `src/pages/XxxPage.tsx`
- UIコンポーネント: `src/components/<domain>/Xxx.tsx`
- フック: `src/hooks/useXxx.ts`
- サービス: `src/services/xxxService.ts`
- 型定義: `src/types/index.ts`（全ての型をここに集約）

## コーディング規約

### Tailwind CSS 4.x

- `src/index.css` で `@import "tailwindcss"` を使用
- テーマカスタマイズは `@theme { }` ブロック内で CSS 変数として定義
- `postcss.config.js` は `@tailwindcss/postcss` プラグインを使用（autoprefixer は不要）
- ユーティリティ関数 `cn()` (`src/utils/cn.ts`) で clsx + tailwind-merge を使用

### React / TypeScript

- 関数コンポーネント + React.FC 型注釈
- カスタムフックは `use` プレフィックス
- named export を使用（default export は App.tsx のみ）
- react-dnd の ref ブリッジには `useDropRef` / `useDragRef` ヘルパーを使用（React 19 互換）

### Firestore

- Timestamp ↔ Date 変換は Service 層で行う
- バッチ書き込みは最大 500 件ずつ分割
- セキュリティルール: `firestore.rules` でロールベースアクセス制御
  - `allow create`: 初回 Google ログイン時の自己登録用
  - `allow update, delete`: admin ロールのみ
  - 全コレクション: `request.auth != null` で認証必須

### ガントチャート

- `src/components/gantt/` 配下の 4 コンポーネントで構成
- 無限スクロール: 動的な日付範囲 + スクロール端検知で ±1 日ずつ拡張
- `useLayoutEffect` でプリペンド時のスクロール位置補正
- 車両列とタイムラインは別コンテナで垂直スクロールを同期（ref 経由）
- 1 時間 = 80px (`HOUR_WIDTH` 定数)
- 行の高さは車両列・タイムライン共に 48px に固定（ずれ防止）

## Firestore セキュリティルール

```
users:     read=認証済み, create=自分のUID, update/delete=admin
vehicles:  read=認証済み, write=admin
customers: read=認証済み, write=admin
orders:    read=認証済み, write=admin/dispatcher
settings:  read=認証済み, write=admin
dailyReports: read=認証済み, create=認証済み, update/delete=admin/dispatcher
```

## ルーティングとロール

| パス | ページ | 許可ロール |
|------|--------|-----------|
| `/login` | ログイン | 全員 |
| `/` | リダイレクト | 認証済み |
| `/dispatch-plan` | 配車計画 | admin, dispatcher |
| `/dispatch-status` | 配車状況 | admin, dispatcher |
| `/driver` | ドライバーダッシュボード | admin, dispatcher, driver |
| `/daily-report` | 日報（自分） | admin, dispatcher, driver |
| `/daily-reports` | 日報（全員） | admin, dispatcher |
| `/master/vehicles` | 車両マスタ | admin |
| `/master/customers` | 荷主マスタ | admin |
| `/users` | ユーザー管理 | admin |
| `/settings` | 設定 | admin |
| `/manual` | マニュアル | 認証済み |

## 注意事項

- `.env` ファイルは git にコミットしない（`.gitignore` に含まれている）
- 初回 Google ログインで自動的にユーザーが `admin` ロールで作成される
- Firebase アカウント: `appsheetdemo2617@gmail.com`
