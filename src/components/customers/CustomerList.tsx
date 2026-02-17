import React from 'react';
import { Customer } from '../../types';

interface CustomerListProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete: (customerId: string) => void;
}

export const CustomerList: React.FC<CustomerListProps> = ({ customers, onEdit, onDelete }) => {
  const handleDelete = (customer: Customer) => {
    if (window.confirm(`荷主 ${customer.customerName} (${customer.customerId}) を削除してもよろしいですか？`)) {
      onDelete(customer.customerId);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50/80">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">荷主ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">荷主名</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">電話番号</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">住所</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">備考</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {customers.map(customer => (
              <tr key={customer.customerId} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{customer.customerId}</td>
                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{customer.customerName}</td>
                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{customer.phone}</td>
                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{customer.address}</td>
                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{customer.notes}</td>
                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEdit(customer)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md px-2.5 py-1.5 min-h-[44px] text-xs font-medium transition-colors"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDelete(customer)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-md px-2.5 py-1.5 min-h-[44px] text-xs font-medium transition-colors"
                    >
                      削除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {customers.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <svg className="mx-auto h-10 w-10 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          <p className="text-sm">荷主データがありません</p>
        </div>
      )}
    </div>
  );
};
