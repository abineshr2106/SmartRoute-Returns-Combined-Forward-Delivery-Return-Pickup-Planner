import React, { useEffect } from 'react';
import { ReturnItem } from '../types';
import { Package, Clock, ShieldCheck, MapPin, AlertCircle, CheckCircle2, X } from 'lucide-react';

interface ReturnDetailModalProps {
  returnItem: ReturnItem | null;
  onClose: () => void;
}

export const ReturnDetailModal: React.FC<ReturnDetailModalProps> = ({ returnItem, onClose }) => {
  useEffect(() => {
    if (returnItem) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = 'unset'; };
    }
  }, [returnItem]);

  if (!returnItem) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">{returnItem.return_id}</h3>
              <p className="text-xs text-slate-400">Customer: {returnItem.customer_id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-xl transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="font-medium text-slate-500">Status</span>
            <span className={`px-2.5 py-1 rounded-full font-bold text-xs ${
              returnItem.status === 'Assigned' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
              'bg-rose-100 text-rose-800 border border-rose-300'
            }`}>
              {returnItem.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block font-medium">Item & Size</span>
              <span className="font-bold text-slate-900 text-sm mt-0.5 block">{returnItem.item_type}</span>
              <span className="text-slate-500">{returnItem.item_size} ({returnItem.item_weight_kg} kg)</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block font-medium">Return Type</span>
              <span className="font-bold text-slate-900 text-sm mt-0.5 block">{returnItem.return_type}</span>
              <span className="text-slate-500">Priority: {returnItem.priority}</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Pickup Time Window:</span>
              <span className="font-bold text-slate-800">{returnItem.pickup_time_start} - {returnItem.pickup_time_end}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Coordinates:</span>
              <span className="font-mono text-slate-700">{returnItem.latitude.toFixed(4)}, {returnItem.longitude.toFixed(4)}</span>
            </div>
          </div>

          {returnItem.status === 'Assigned' ? (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5 text-emerald-900">
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Assigned to Route {returnItem.assigned_route_id}
              </div>
              <p className="text-slate-600">Inserted at Sequence Position #{returnItem.insertion_sequence}</p>
              <div className="text-slate-700 pt-1 font-semibold">
                Additional Distance: <span className="text-sky-700 font-extrabold">+{returnItem.incremental_km} km</span>
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1 text-rose-900">
              <div className="flex items-center gap-1.5 font-bold text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                Return Pickup Blocked
              </div>
              <p className="text-rose-700 font-medium">
                Reason: {returnItem.blocked_reason || 'No feasible insertion route found'}
              </p>
            </div>
          )}
        </div>

        <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white font-semibold text-xs rounded-xl shadow-sm hover:bg-slate-800"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
