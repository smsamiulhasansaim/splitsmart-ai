
import React from 'react';
import { ReceiptData, ReceiptItem } from '../types';
import { FileText, Plus, User, AlertCircle } from 'lucide-react';

interface ReceiptPaneProps {
  data: ReceiptData | null;
  assignments: Record<string, string[]>;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isProcessing: boolean;
}

const ReceiptPane: React.FC<ReceiptPaneProps> = ({ data, assignments, onFileUpload, isProcessing }) => {
  if (!data && !isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white/50">
        <div className="p-4 bg-indigo-50 rounded-full mb-4">
          <FileText className="w-12 h-12 text-indigo-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">Upload your receipt</h3>
        <p className="text-slate-500 mb-6 max-w-xs">
          Take a photo or upload an image of your receipt to start splitting.
        </p>
        <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-xl transition-all shadow-lg shadow-indigo-200">
          Choose File
          <input type="file" className="hidden" accept="image/*" onChange={onFileUpload} />
        </label>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-indigo-400 animate-bounce" />
          </div>
          <div className="h-4 w-48 bg-slate-100 rounded mb-2"></div>
          <div className="h-3 w-32 bg-slate-50 rounded"></div>
        </div>
        <p className="mt-6 text-slate-600 font-medium">Gemini is parsing your receipt...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-50 bg-slate-50/50">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600" />
          Receipt Items
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {data?.items.map((item) => (
          <div key={item.id} className="group flex flex-col p-4 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all">
            <div className="flex justify-between items-start mb-2">
              <span className="font-semibold text-slate-700 group-hover:text-indigo-900">{item.name}</span>
              <span className="font-mono font-bold text-slate-900">${item.price.toFixed(2)}</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {assignments[item.id]?.length > 0 ? (
                assignments[item.id].map((person, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold shadow-sm animate-in fade-in zoom-in duration-300">
                    <User className="w-3 h-3" />
                    {person}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Unassigned
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-2">
        <div className="flex justify-between text-slate-600">
          <span>Subtotal</span>
          <span className="font-semibold">${data?.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Tax</span>
          <span className="font-semibold">${data?.tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Tip</span>
          <span className="font-semibold">${data?.tip.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-slate-900 pt-2 border-t border-slate-200 font-bold text-lg">
          <span>Total</span>
          <span>${((data?.subtotal || 0) + (data?.tax || 0) + (data?.tip || 0)).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default ReceiptPane;
