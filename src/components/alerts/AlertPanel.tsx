import React, { useState, useMemo } from 'react';
import { isSameDay, isBefore, startOfDay } from 'date-fns';
import { AlertTriangle, AlertCircle, Info, CheckCircle2, ChevronDown } from 'lucide-react';
import { Order, Vehicle } from '../../types';

interface AlertPanelProps {
  orders: Order[];
  vehicles: Vehicle[];
}

interface AlertItem {
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  count: number;
}

interface AlertSectionProps {
  alert: AlertItem;
  defaultOpen?: boolean;
}

const AlertIcon: React.FC<{ type: AlertItem['type'] }> = ({ type }) => {
  switch (type) {
    case 'error':
      return <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />;
    case 'warning':
      return <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />;
    case 'info':
      return <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />;
  }
};

const alertStyles: Record<AlertItem['type'], { bg: string; border: string; badge: string }> = {
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-700',
  },
  warning: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    badge: 'bg-orange-100 text-orange-700',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
  },
};

const AlertSection: React.FC<AlertSectionProps> = ({ alert, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const styles = alertStyles[alert.type];

  return (
    <div className={`rounded-lg border ${styles.border} ${styles.bg} overflow-hidden`}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between p-3 text-left hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-2 min-w-0">
          <AlertIcon type={alert.type} />
          <span className="text-sm font-medium text-gray-800 truncate">
            {alert.title}
          </span>
          <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold ${styles.badge} flex-shrink-0`}>
            {alert.count}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ml-2 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      {isOpen && (
        <div className="px-3 pb-3 pt-0">
          <p className="text-xs text-gray-600 leading-relaxed">{alert.message}</p>
        </div>
      )}
    </div>
  );
};

export const AlertPanel: React.FC<AlertPanelProps> = ({ orders, vehicles }) => {
  const alerts = useMemo(() => {
    const today = startOfDay(new Date());
    const result: AlertItem[] = [];

    // 1. 期限超過の未配車案件 (赤)
    const overdueUnassigned = orders.filter(
      (order) =>
        order.status === 'unassigned' &&
        isBefore(startOfDay(order.loadDate), today)
    );
    if (overdueUnassigned.length > 0) {
      result.push({
        type: 'error',
        title: '期限超過の未配車案件',
        message: `積込日を過ぎても未配車の案件が ${overdueUnassigned.length} 件あります。早急に配車手配を行ってください。`,
        count: overdueUnassigned.length,
      });
    }

    // 2. 本日積込で未配車の案件 (オレンジ)
    const todayUnassigned = orders.filter(
      (order) =>
        order.status === 'unassigned' &&
        isSameDay(order.loadDate, today)
    );
    if (todayUnassigned.length > 0) {
      result.push({
        type: 'warning',
        title: '本日積込の未配車案件',
        message: `本日積込予定で未配車の案件が ${todayUnassigned.length} 件あります。至急配車手配を行ってください。`,
        count: todayUnassigned.length,
      });
    }

    // 3. 本日割当のない車両 (青)
    const todayAssignedVehicleNumbers = new Set(
      orders
        .filter(
          (order) =>
            order.status === 'assigned' &&
            isSameDay(order.loadDate, today) &&
            order.assignedVehicleNumber
        )
        .map((order) => order.assignedVehicleNumber)
    );
    const idleVehicles = vehicles.filter(
      (vehicle) => !todayAssignedVehicleNumbers.has(vehicle.vehicleNumber)
    );
    if (idleVehicles.length > 0) {
      result.push({
        type: 'info',
        title: '本日未割当の車両',
        message: `本日配車割当のない車両が ${idleVehicles.length} 台あります: ${idleVehicles
          .slice(0, 5)
          .map((v) => v.vehicleNumber)
          .join('、')}${idleVehicles.length > 5 ? ' 他' : ''}`,
        count: idleVehicles.length,
      });
    }

    // 4. 配車率が70%未満の場合 (警告)
    const todayOrders = orders.filter((order) =>
      isSameDay(order.loadDate, today)
    );
    if (todayOrders.length > 0) {
      const assignedCount = todayOrders.filter(
        (order) => order.status === 'assigned'
      ).length;
      const assignmentRate = Math.round((assignedCount / todayOrders.length) * 100);
      if (assignmentRate < 70) {
        result.push({
          type: 'warning',
          title: '配車率が低下しています',
          message: `本日の配車率は ${assignmentRate}% です（${assignedCount}/${todayOrders.length} 件）。目標の70%を下回っています。`,
          count: assignmentRate,
        });
      }
    }

    return result;
  }, [orders, vehicles]);

  if (alerts.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          <span className="text-sm font-medium text-green-800">
            アラートはありません
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-gray-700">アラート</h3>
        <span className="text-xs text-gray-500">{alerts.length} 件</span>
      </div>
      {alerts.map((alert, index) => (
        <AlertSection
          key={`${alert.type}-${alert.title}`}
          alert={alert}
          defaultOpen={index === 0}
        />
      ))}
    </div>
  );
};
