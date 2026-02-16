# 株式会社KUBOXT 配車計画アプリ 実装計画

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 運送業における配車計画業務を効率化するWebアプリケーションを構築し、電話受注からドライバーへの配車指示、実績管理までをデジタル化する。

**Architecture:**
- フロントエンド: React + TypeScript + Tailwind CSS
- バックエンド: Firebase (Authentication, Firestore)
- 状態管理: React Context + Firestore リアルタイムリスナー
- UI: ガントチャート形式の配車ビュー、ドラッグ&ドロップ操作

**Tech Stack:**
- React 18+ with TypeScript
- Firebase (Authentication, Firestore, Functions)
- Vite (build tool)
- Tailwind CSS
- React DnD (drag and drop)
- date-fns (date manipulation)
- Google Sheets API (backup)

---

## 開発規模・前提条件

**データ規模:**
- 車両数: 約140台
- 1日あたりの依頼件数: 約100件
- 未配車データ: 数百件が溜まる想定
- ユーザー数: 管理者・配車担当者 約10名、ドライバー 約140名

**権限:**
- 管理者: 全機能アクセス可能（マスタ管理、ユーザー管理、システム設定）
- 配車担当者: 配車業務のみ（配車計画、配車状況確認）
- ドライバー: 閲覧のみ（自分の配車予定、将来的に日報入力）

---

## MVP Phase 1: 基盤・マスタ管理・配車計画

### Task 1: プロジェクトセットアップ

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tailwind.config.js`
- Create: `.env.example`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `index.html`

**Step 1: Vite + React + TypeScript プロジェクト作成**

```bash
npm create vite@latest . -- --template react-ts
npm install
```

**Step 2: 必要な依存関係をインストール**

```bash
npm install firebase react-router-dom
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**Step 3: Tailwind CSS 設定**

`tailwind.config.js`:
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

`src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Step 4: Git初期化とコミット**

```bash
git add .
git commit -m "feat: initial project setup with Vite, React, TypeScript, Tailwind CSS"
```

---

### Task 2: Firebase セットアップ

**Files:**
- Create: `src/config/firebase.ts`
- Create: `src/types/index.ts`
- Create: `.env`

**Step 1: Firebaseプロジェクト作成（手動）**

Firebaseコンソールで以下を実施:
1. 新規プロジェクト作成（プロジェクト名: `kuboxt-dispatch-app`）
2. Webアプリ追加
3. Firestore Database作成（本番モードで開始）
4. Authentication有効化（メール/パスワード認証）

**Step 2: Firebase設定ファイル作成**

`.env`:
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

`src/config/firebase.ts`:
```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

**Step 3: 型定義作成**

`src/types/index.ts`:
```typescript
// ユーザー権限
export type UserRole = 'admin' | 'dispatcher' | 'driver';

// ユーザー
export interface User {
  uid: string;
  email: string;
  role: UserRole;
  displayName?: string;
  createdAt: Date;
}

// 荷主マスタ
export interface Customer {
  customerId: string; // キー
  customerName: string;
  phone?: string;
  address?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 車両マスタ
export interface Vehicle {
  vehicleNumber: string; // ナンバー（キー）
  radioNumber?: string;
  capacity?: number;
  vehicleType: string; // 車種
  supportedRequestTypes: string[]; // 対応可能依頼（カンマ区切りをパース）
  driverName?: string;
  phone?: string;
  email?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 受注データ（荷主依頼）
export interface Order {
  orderId: string; // 依頼ID（自動生成）
  receivedDate: Date; // 受付日
  customerId: string; // 荷主
  loadDate: Date; // 積込日
  loadTime?: string; // 積込時間（HH:mm形式）
  loadAddress1: string; // 積込地1
  loadAddress2?: string; // 積込地2
  itemName: string; // 品名
  unloadDate: Date; // 荷卸日
  unloadTime?: string; // 荷卸時間（HH:mm形式）
  unloadAddress1: string; // 荷卸地1
  unloadAddress2?: string; // 荷卸地2
  requestVehicleType: string; // 依頼車種
  assignedVehicleNumber?: string; // ナンバー
  assignedVehicleCode?: string; // 車番
  assignedVehicleType?: string; // 車種
  assignedDriverName?: string; // 運転手
  status: 'unassigned' | 'assigned'; // 配車状態
  createdAt: Date;
  updatedAt: Date;
}

// 実績データ（日報）- 将来対応
export interface DailyReport {
  reportId: string;
  orderId: string;
  vehicleNumber: string;
  departureTime?: string; // 出庫時間
  loadStartTime?: string; // 積込開始時間
  loadEndTime?: string; // 積込完了時間
  unloadStartTime?: string; // 荷下ろし開始時間
  unloadEndTime?: string; // 荷下ろし完了時間
  returnTime?: string; // 帰庫時間
  departureMeter?: number; // 出庫メーター
  returnMeter?: number; // 帰庫メーター
  vehicleInspection?: string; // 車両点検
  notes?: string; // 備考
  createdAt: Date;
  updatedAt: Date;
}
```

**Step 4: コミット**

```bash
git add .
git commit -m "feat: setup Firebase configuration and type definitions"
```

---

### Task 3: 認証機能（ログイン・ログアウト）

**Files:**
- Create: `src/contexts/AuthContext.tsx`
- Create: `src/pages/LoginPage.tsx`
- Create: `src/components/ProtectedRoute.tsx`
- Create: `src/hooks/useAuth.ts`

**Step 1: AuthContext作成**

`src/contexts/AuthContext.tsx`:
```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User, UserRole } from '../types';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Firestoreからユーザー情報取得
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setCurrentUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email!,
            role: userData.role as UserRole,
            displayName: userData.displayName,
            createdAt: userData.createdAt.toDate(),
          });
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const value = {
    currentUser,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

**Step 2: ログイン画面作成**

`src/pages/LoginPage.tsx`:
```typescript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError('ログインに失敗しました。メールアドレスとパスワードを確認してください。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">配車計画アプリ</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          {error && <div className="mb-4 text-red-500 text-sm">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>
      </div>
    </div>
  );
};
```

**Step 3: ProtectedRoute作成**

`src/components/ProtectedRoute.tsx`:
```typescript
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">読み込み中...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return <div className="min-h-screen flex items-center justify-center">アクセス権限がありません</div>;
  }

  return <>{children}</>;
};
```

**Step 4: ルーティング設定**

`src/App.tsx`:
```typescript
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';

// 仮のダッシュボード
const Dashboard: React.FC = () => {
  return <div>ダッシュボード（実装予定）</div>;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
```

**Step 5: テスト用ユーザー作成（Firebaseコンソール）**

Firebaseコンソールで手動作成:
1. Authentication > Users > Add user
   - Email: `admin@kuboxt.test`
   - Password: `admin123`
2. Firestore > users コレクション > ドキュメント追加
   - Document ID: （上記ユーザーのUID）
   - Fields:
     - role: "admin"
     - displayName: "管理者"
     - createdAt: （現在のタイムスタンプ）

**Step 6: ローカルサーバー起動してログイン確認**

```bash
npm run dev
```

ブラウザで `http://localhost:5173` にアクセスし、ログイン動作を確認。

**Step 7: コミット**

```bash
git add .
git commit -m "feat: implement authentication (login/logout) with Firebase Auth"
```

---

### Task 4: レイアウト・ナビゲーション

**Files:**
- Create: `src/components/Layout.tsx`
- Create: `src/components/Sidebar.tsx`
- Create: `src/components/Header.tsx`
- Modify: `src/App.tsx`

**Step 1: サイドバー作成**

`src/components/Sidebar.tsx`:
```typescript
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { currentUser } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    { path: '/dispatch-plan', label: '配車計画', roles: ['admin', 'dispatcher'] },
    { path: '/dispatch-status', label: '配車状況確認', roles: ['admin', 'dispatcher'] },
    { path: '/master/vehicles', label: '車両マスタ', roles: ['admin'] },
    { path: '/master/customers', label: '荷主マスタ', roles: ['admin'] },
    { path: '/users', label: 'ユーザー管理', roles: ['admin'] },
    { path: '/settings', label: '設定', roles: ['admin'] },
  ];

  const filteredMenuItems = menuItems.filter(item =>
    currentUser && item.roles.includes(currentUser.role)
  );

  return (
    <aside className="w-64 bg-gray-800 text-white min-h-screen p-4">
      <div className="mb-8">
        <h1 className="text-xl font-bold">配車計画アプリ</h1>
      </div>
      <nav>
        <ul className="space-y-2">
          {filteredMenuItems.map(item => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`block px-4 py-2 rounded ${
                  isActive(item.path) ? 'bg-blue-600' : 'hover:bg-gray-700'
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};
```

**Step 2: ヘッダー作成**

`src/components/Header.tsx`:
```typescript
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Header: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow px-6 py-4 flex justify-between items-center">
      <div>
        <span className="text-gray-600">ようこそ、{currentUser?.displayName || currentUser?.email}さん</span>
      </div>
      <button
        onClick={handleLogout}
        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        ログアウト
      </button>
    </header>
  );
};
```

**Step 3: レイアウト作成**

`src/components/Layout.tsx`:
```typescript
import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
};
```

**Step 4: App.tsxを更新**

`src/App.tsx`:
```typescript
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';

// 仮ページコンポーネント
const DispatchPlanPage: React.FC = () => <div>配車計画画面（実装予定）</div>;
const DispatchStatusPage: React.FC = () => <div>配車状況確認画面（実装予定）</div>;
const VehicleMasterPage: React.FC = () => <div>車両マスタ画面（実装予定）</div>;
const CustomerMasterPage: React.FC = () => <div>荷主マスタ画面（実装予定）</div>;
const UsersPage: React.FC = () => <div>ユーザー管理画面（実装予定）</div>;
const SettingsPage: React.FC = () => <div>設定画面（実装予定）</div>;

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Navigate to="/dispatch-plan" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dispatch-plan"
            element={
              <ProtectedRoute allowedRoles={['admin', 'dispatcher']}>
                <Layout><DispatchPlanPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dispatch-status"
            element={
              <ProtectedRoute allowedRoles={['admin', 'dispatcher']}>
                <Layout><DispatchStatusPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/master/vehicles"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout><VehicleMasterPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/master/customers"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout><CustomerMasterPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout><UsersPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout><SettingsPage /></Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
```

**Step 5: 動作確認**

```bash
npm run dev
```

ログイン後、サイドバーとヘッダーが表示され、各ページに遷移できることを確認。

**Step 6: コミット**

```bash
git add .
git commit -m "feat: add layout with sidebar and header navigation"
```

---

### Task 5: 車両マスタ CRUD

**Files:**
- Create: `src/pages/VehicleMasterPage.tsx`
- Create: `src/components/vehicles/VehicleList.tsx`
- Create: `src/components/vehicles/VehicleForm.tsx`
- Create: `src/hooks/useVehicles.ts`
- Create: `src/services/vehicleService.ts`

**Step 1: Firestore操作サービス作成**

`src/services/vehicleService.ts`:
```typescript
import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Vehicle } from '../types';

const COLLECTION_NAME = 'vehicles';

export const vehicleService = {
  async getAll(): Promise<Vehicle[]> {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
    })) as Vehicle[];
  },

  async getById(vehicleNumber: string): Promise<Vehicle | null> {
    const docRef = doc(db, COLLECTION_NAME, vehicleNumber);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as Vehicle;
    }
    return null;
  },

  async create(vehicle: Omit<Vehicle, 'createdAt' | 'updatedAt'>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, vehicle.vehicleNumber);
    await setDoc(docRef, {
      ...vehicle,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  },

  async update(vehicleNumber: string, updates: Partial<Vehicle>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, vehicleNumber);
    await setDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    }, { merge: true });
  },

  async delete(vehicleNumber: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, vehicleNumber);
    await deleteDoc(docRef);
  },
};
```

**Step 2: カスタムフック作成**

`src/hooks/useVehicles.ts`:
```typescript
import { useState, useEffect } from 'react';
import { Vehicle } from '../types';
import { vehicleService } from '../services/vehicleService';

export const useVehicles = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const data = await vehicleService.getAll();
      setVehicles(data);
      setError(null);
    } catch (err) {
      setError('車両データの取得に失敗しました');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const createVehicle = async (vehicle: Omit<Vehicle, 'createdAt' | 'updatedAt'>) => {
    try {
      await vehicleService.create(vehicle);
      await fetchVehicles();
    } catch (err) {
      throw new Error('車両の追加に失敗しました');
    }
  };

  const updateVehicle = async (vehicleNumber: string, updates: Partial<Vehicle>) => {
    try {
      await vehicleService.update(vehicleNumber, updates);
      await fetchVehicles();
    } catch (err) {
      throw new Error('車両の更新に失敗しました');
    }
  };

  const deleteVehicle = async (vehicleNumber: string) => {
    try {
      await vehicleService.delete(vehicleNumber);
      await fetchVehicles();
    } catch (err) {
      throw new Error('車両の削除に失敗しました');
    }
  };

  return {
    vehicles,
    loading,
    error,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    refetch: fetchVehicles,
  };
};
```

**Step 3: 車両フォームコンポーネント作成**

`src/components/vehicles/VehicleForm.tsx`:
```typescript
import React, { useState, useEffect } from 'react';
import { Vehicle } from '../../types';

interface VehicleFormProps {
  vehicle?: Vehicle | null;
  onSubmit: (vehicle: Omit<Vehicle, 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
}

const VEHICLE_TYPES = ['4t', '2t', '1t', '0.5t'];

export const VehicleForm: React.FC<VehicleFormProps> = ({ vehicle, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    vehicleNumber: '',
    radioNumber: '',
    capacity: '',
    vehicleType: '',
    supportedRequestTypes: [] as string[],
    driverName: '',
    phone: '',
    email: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (vehicle) {
      setFormData({
        vehicleNumber: vehicle.vehicleNumber,
        radioNumber: vehicle.radioNumber || '',
        capacity: vehicle.capacity?.toString() || '',
        vehicleType: vehicle.vehicleType,
        supportedRequestTypes: vehicle.supportedRequestTypes,
        driverName: vehicle.driverName || '',
        phone: vehicle.phone || '',
        email: vehicle.email || '',
        notes: vehicle.notes || '',
      });
    }
  }, [vehicle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onSubmit({
        vehicleNumber: formData.vehicleNumber,
        radioNumber: formData.radioNumber || undefined,
        capacity: formData.capacity ? parseFloat(formData.capacity) : undefined,
        vehicleType: formData.vehicleType,
        supportedRequestTypes: formData.supportedRequestTypes,
        driverName: formData.driverName || undefined,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        notes: formData.notes || undefined,
      } as Omit<Vehicle, 'createdAt' | 'updatedAt'>);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSupportedType = (type: string) => {
    if (formData.supportedRequestTypes.includes(type)) {
      setFormData({
        ...formData,
        supportedRequestTypes: formData.supportedRequestTypes.filter(t => t !== type),
      });
    } else {
      setFormData({
        ...formData,
        supportedRequestTypes: [...formData.supportedRequestTypes, type],
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">{vehicle ? '車両編集' : '車両追加'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">ナンバー *</label>
              <input
                type="text"
                value={formData.vehicleNumber}
                onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
                disabled={!!vehicle}
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">無線番号</label>
              <input
                type="text"
                value={formData.radioNumber}
                onChange={(e) => setFormData({ ...formData, radioNumber: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">積載量 (t)</label>
              <input
                type="number"
                step="0.1"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">車種 *</label>
              <select
                value={formData.vehicleType}
                onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
              >
                <option value="">選択してください</option>
                {VEHICLE_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-gray-700 mb-2">対応可能依頼 *</label>
              <div className="flex space-x-4">
                {VEHICLE_TYPES.map(type => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.supportedRequestTypes.includes(type)}
                      onChange={() => toggleSupportedType(type)}
                      className="mr-2"
                    />
                    {type}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-gray-700 mb-2">運転手</label>
              <input
                type="text"
                value={formData.driverName}
                onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">電話番号</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-gray-700 mb-2">メールアドレス</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-gray-700 mb-2">備考</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                rows={3}
              />
            </div>
          </div>
          {error && <div className="mt-4 text-red-500 text-sm">{error}</div>}
          <div className="mt-6 flex justify-end space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              {loading ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
```

**Step 4: 車両一覧コンポーネント作成**

`src/components/vehicles/VehicleList.tsx`:
```typescript
import React from 'react';
import { Vehicle } from '../../types';

interface VehicleListProps {
  vehicles: Vehicle[];
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (vehicleNumber: string) => void;
}

export const VehicleList: React.FC<VehicleListProps> = ({ vehicles, onEdit, onDelete }) => {
  const handleDelete = (vehicle: Vehicle) => {
    if (window.confirm(`車両 ${vehicle.vehicleNumber} を削除してもよろしいですか？`)) {
      onDelete(vehicle.vehicleNumber);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 border">ナンバー</th>
            <th className="px-4 py-2 border">無線番号</th>
            <th className="px-4 py-2 border">車種</th>
            <th className="px-4 py-2 border">対応可能依頼</th>
            <th className="px-4 py-2 border">運転手</th>
            <th className="px-4 py-2 border">電話番号</th>
            <th className="px-4 py-2 border">操作</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map(vehicle => (
            <tr key={vehicle.vehicleNumber} className="hover:bg-gray-50">
              <td className="px-4 py-2 border">{vehicle.vehicleNumber}</td>
              <td className="px-4 py-2 border">{vehicle.radioNumber}</td>
              <td className="px-4 py-2 border">{vehicle.vehicleType}</td>
              <td className="px-4 py-2 border">{vehicle.supportedRequestTypes.join(', ')}</td>
              <td className="px-4 py-2 border">{vehicle.driverName}</td>
              <td className="px-4 py-2 border">{vehicle.phone}</td>
              <td className="px-4 py-2 border">
                <button
                  onClick={() => onEdit(vehicle)}
                  className="px-2 py-1 bg-blue-500 text-white rounded mr-2 hover:bg-blue-600"
                >
                  編集
                </button>
                <button
                  onClick={() => handleDelete(vehicle)}
                  className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  削除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {vehicles.length === 0 && (
        <div className="text-center py-8 text-gray-500">車両データがありません</div>
      )}
    </div>
  );
};
```

**Step 5: 車両マスタページ作成**

`src/pages/VehicleMasterPage.tsx`:
```typescript
import React, { useState } from 'react';
import { useVehicles } from '../hooks/useVehicles';
import { VehicleList } from '../components/vehicles/VehicleList';
import { VehicleForm } from '../components/vehicles/VehicleForm';
import { Vehicle } from '../types';

export const VehicleMasterPage: React.FC = () => {
  const { vehicles, loading, error, createVehicle, updateVehicle, deleteVehicle } = useVehicles();
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const handleAdd = () => {
    setEditingVehicle(null);
    setShowForm(true);
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setShowForm(true);
  };

  const handleSubmit = async (vehicle: Omit<Vehicle, 'createdAt' | 'updatedAt'>) => {
    if (editingVehicle) {
      await updateVehicle(editingVehicle.vehicleNumber, vehicle);
    } else {
      await createVehicle(vehicle);
    }
    setShowForm(false);
    setEditingVehicle(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingVehicle(null);
  };

  if (loading) {
    return <div>読み込み中...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">車両マスタ</h1>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          車両追加
        </button>
      </div>
      <VehicleList vehicles={vehicles} onEdit={handleEdit} onDelete={deleteVehicle} />
      {showForm && (
        <VehicleForm
          vehicle={editingVehicle}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
};
```

**Step 6: App.tsxを更新**

`src/App.tsx`を修正し、`VehicleMasterPage`をインポートして使用:
```typescript
import { VehicleMasterPage } from './pages/VehicleMasterPage';
// ...
const VehicleMasterPageRoute = <Route
  path="/master/vehicles"
  element={
    <ProtectedRoute allowedRoles={['admin']}>
      <Layout><VehicleMasterPage /></Layout>
    </ProtectedRoute>
  }
/>
```

**Step 7: 動作確認**

```bash
npm run dev
```

ログイン後、車両マスタ画面で追加・編集・削除ができることを確認。

**Step 8: コミット**

```bash
git add .
git commit -m "feat: implement vehicle master CRUD functionality"
```

---

### Task 6: 荷主マスタ CRUD

**Files:**
- Create: `src/pages/CustomerMasterPage.tsx`
- Create: `src/components/customers/CustomerList.tsx`
- Create: `src/components/customers/CustomerForm.tsx`
- Create: `src/hooks/useCustomers.ts`
- Create: `src/services/customerService.ts`

**Step 1: Firestore操作サービス作成**

`src/services/customerService.ts`:
```typescript
import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Customer } from '../types';

const COLLECTION_NAME = 'customers';

export const customerService = {
  async getAll(): Promise<Customer[]> {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
    })) as Customer[];
  },

  async getById(customerId: string): Promise<Customer | null> {
    const docRef = doc(db, COLLECTION_NAME, customerId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as Customer;
    }
    return null;
  },

  async create(customer: Omit<Customer, 'createdAt' | 'updatedAt'>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, customer.customerId);
    await setDoc(docRef, {
      ...customer,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  },

  async update(customerId: string, updates: Partial<Customer>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, customerId);
    await setDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    }, { merge: true });
  },

  async delete(customerId: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, customerId);
    await deleteDoc(docRef);
  },
};
```

**Step 2: カスタムフック作成**

`src/hooks/useCustomers.ts`:
```typescript
import { useState, useEffect } from 'react';
import { Customer } from '../types';
import { customerService } from '../services/customerService';

export const useCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await customerService.getAll();
      setCustomers(data);
      setError(null);
    } catch (err) {
      setError('荷主データの取得に失敗しました');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const createCustomer = async (customer: Omit<Customer, 'createdAt' | 'updatedAt'>) => {
    try {
      await customerService.create(customer);
      await fetchCustomers();
    } catch (err) {
      throw new Error('荷主の追加に失敗しました');
    }
  };

  const updateCustomer = async (customerId: string, updates: Partial<Customer>) => {
    try {
      await customerService.update(customerId, updates);
      await fetchCustomers();
    } catch (err) {
      throw new Error('荷主の更新に失敗しました');
    }
  };

  const deleteCustomer = async (customerId: string) => {
    try {
      await customerService.delete(customerId);
      await fetchCustomers();
    } catch (err) {
      throw new Error('荷主の削除に失敗しました');
    }
  };

  return {
    customers,
    loading,
    error,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    refetch: fetchCustomers,
  };
};
```

**Step 3: 荷主フォームコンポーネント作成**

`src/components/customers/CustomerForm.tsx`:
```typescript
import React, { useState, useEffect } from 'react';
import { Customer } from '../../types';

interface CustomerFormProps {
  customer?: Customer | null;
  onSubmit: (customer: Omit<Customer, 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({ customer, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    phone: '',
    address: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (customer) {
      setFormData({
        customerId: customer.customerId,
        customerName: customer.customerName,
        phone: customer.phone || '',
        address: customer.address || '',
        notes: customer.notes || '',
      });
    }
  }, [customer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onSubmit({
        customerId: formData.customerId,
        customerName: formData.customerName,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        notes: formData.notes || undefined,
      } as Omit<Customer, 'createdAt' | 'updatedAt'>);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-4">{customer ? '荷主編集' : '荷主追加'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2">荷主ID *</label>
              <input
                type="text"
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
                disabled={!!customer}
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">荷主名 *</label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">電話番号</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">住所</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">特記事項</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                rows={3}
              />
            </div>
          </div>
          {error && <div className="mt-4 text-red-500 text-sm">{error}</div>}
          <div className="mt-6 flex justify-end space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              {loading ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
```

**Step 4: 荷主一覧コンポーネント作成**

`src/components/customers/CustomerList.tsx`:
```typescript
import React from 'react';
import { Customer } from '../../types';

interface CustomerListProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete: (customerId: string) => void;
}

export const CustomerList: React.FC<CustomerListProps> = ({ customers, onEdit, onDelete }) => {
  const handleDelete = (customer: Customer) => {
    if (window.confirm(`荷主 ${customer.customerName} を削除してもよろしいですか？`)) {
      onDelete(customer.customerId);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 border">荷主ID</th>
            <th className="px-4 py-2 border">荷主名</th>
            <th className="px-4 py-2 border">電話番号</th>
            <th className="px-4 py-2 border">住所</th>
            <th className="px-4 py-2 border">特記事項</th>
            <th className="px-4 py-2 border">操作</th>
          </tr>
        </thead>
        <tbody>
          {customers.map(customer => (
            <tr key={customer.customerId} className="hover:bg-gray-50">
              <td className="px-4 py-2 border">{customer.customerId}</td>
              <td className="px-4 py-2 border">{customer.customerName}</td>
              <td className="px-4 py-2 border">{customer.phone}</td>
              <td className="px-4 py-2 border">{customer.address}</td>
              <td className="px-4 py-2 border">{customer.notes}</td>
              <td className="px-4 py-2 border">
                <button
                  onClick={() => onEdit(customer)}
                  className="px-2 py-1 bg-blue-500 text-white rounded mr-2 hover:bg-blue-600"
                >
                  編集
                </button>
                <button
                  onClick={() => handleDelete(customer)}
                  className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  削除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {customers.length === 0 && (
        <div className="text-center py-8 text-gray-500">荷主データがありません</div>
      )}
    </div>
  );
};
```

**Step 5: 荷主マスタページ作成**

`src/pages/CustomerMasterPage.tsx`:
```typescript
import React, { useState } from 'react';
import { useCustomers } from '../hooks/useCustomers';
import { CustomerList } from '../components/customers/CustomerList';
import { CustomerForm } from '../components/customers/CustomerForm';
import { Customer } from '../types';

export const CustomerMasterPage: React.FC = () => {
  const { customers, loading, error, createCustomer, updateCustomer, deleteCustomer } = useCustomers();
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const handleAdd = () => {
    setEditingCustomer(null);
    setShowForm(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setShowForm(true);
  };

  const handleSubmit = async (customer: Omit<Customer, 'createdAt' | 'updatedAt'>) => {
    if (editingCustomer) {
      await updateCustomer(editingCustomer.customerId, customer);
    } else {
      await createCustomer(customer);
    }
    setShowForm(false);
    setEditingCustomer(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCustomer(null);
  };

  if (loading) {
    return <div>読み込み中...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">荷主マスタ</h1>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          荷主追加
        </button>
      </div>
      <CustomerList customers={customers} onEdit={handleEdit} onDelete={deleteCustomer} />
      {showForm && (
        <CustomerForm
          customer={editingCustomer}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
};
```

**Step 6: App.tsxを更新**

`src/App.tsx`を修正し、`CustomerMasterPage`をインポートして使用。

**Step 7: 動作確認**

```bash
npm run dev
```

荷主マスタ画面で追加・編集・削除ができることを確認。

**Step 8: コミット**

```bash
git add .
git commit -m "feat: implement customer master CRUD functionality"
```

---

## 次のフェーズ

この計画書は **Phase 1（基盤・マスタ管理）** の一部を詳細化したものです。

**残りの実装タスク:**
- Task 7: マスタCSVインポート機能
- Task 8: 受注データモデルとCSVインポート
- Task 9: 配車計画画面（未配車一覧）
- Task 10: ガントチャート表示
- Task 11: ドラッグ&ドロップ配車
- Task 12: 配車状況確認画面
- Task 13: アラート・統計機能
- Task 14: ドライバー専用画面（将来）
- Task 15: バックアップ機能
- Task 16: リアルタイム更新最適化

各タスクは同様に細かいステップ（TDD方式）に分解して実装していきます。

---

## 実装時の注意事項

### DRY (Don't Repeat Yourself)
- サービス層、カスタムフック、コンポーネントを適切に分離
- 共通ロジックは utils/ に配置

### YAGNI (You Aren't Gonna Need It)
- 必要な機能のみ実装、過度な抽象化を避ける
- MVPフェーズでは最小限の機能に集中

### TDD (Test-Driven Development)
- 各機能実装前にテストを書く（理想）
- 最低限、手動テストで動作確認

### 頻繁なコミット
- 機能単位で細かくコミット
- コミットメッセージは明確に（feat:, fix:, refactor: など）

### パフォーマンス考慮
- Firestore クエリの最適化（インデックス設定）
- 大量データ（140台の車両、数百件の未配車データ）を考慮したページネーション
- リアルタイムリスナーの適切な使用（必要な画面のみ）

---

## 技術スタックの補足

### 追加で必要になるライブラリ

**ガントチャート:**
```bash
npm install gantt-task-react
# または
npm install @bryntum/gantt
# または自作（Canvas/SVG）
```

**ドラッグ&ドロップ:**
```bash
npm install react-dnd react-dnd-html5-backend
```

**日付処理:**
```bash
npm install date-fns
```

**CSV処理:**
```bash
npm install papaparse
npm install -D @types/papaparse
```

**Google Sheets API:**
```bash
npm install googleapis
```

---

計画書は以上です。実装を開始する準備が整いました。
