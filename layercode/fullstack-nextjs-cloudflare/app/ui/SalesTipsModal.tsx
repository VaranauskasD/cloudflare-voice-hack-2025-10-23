'use client';

import { useState, useEffect } from 'react';

interface SalesTip {
  strategy: string;
  focus: string;
  question: string;
  followUp: string;
}

interface SalesTipsData {
  type: 'sales_tips';
  tips: SalesTip[];
  context: string;
  timestamp: string;
  analysis?: string;
}

interface SalesTipsModalProps {
  isOpen: boolean;
  onClose: () => void;
  salesTips: SalesTipsData | null;
}

export default function SalesTipsModal({ isOpen, onClose, salesTips }: SalesTipsModalProps) {
  if (!isOpen || !salesTips) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Sales Strategy Tips</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Context */}
        <div className="p-6 bg-blue-50 border-b">
          <p className="text-sm text-blue-800 font-medium">
            {salesTips.context}
          </p>
          {salesTips.analysis && (
            <p className="text-xs text-blue-600 mt-1 font-semibold">
              💡 {salesTips.analysis}
            </p>
          )}
          <p className="text-xs text-blue-600 mt-1">
            Generated at {new Date(salesTips.timestamp).toLocaleTimeString()}
          </p>
        </div>

        {/* Tips */}
        <div className="p-6">
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
            {salesTips.tips.map((tip, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-6 border">
                <div className="flex items-center mb-4">
                  <div className="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full">
                    Option {index + 1}
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {tip.strategy}
                </h3>
                
                <p className="text-sm text-gray-600 mb-4">
                  {tip.focus}
                </p>
                
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded border-l-4 border-blue-500">
                    <p className="text-sm font-medium text-gray-700 mb-1">Primary Question:</p>
                    <p className="text-sm text-gray-900 italic">"{tip.question}"</p>
                  </div>
                  
                  <div className="bg-white p-3 rounded border-l-4 border-green-500">
                    <p className="text-sm font-medium text-gray-700 mb-1">Follow-up:</p>
                    <p className="text-sm text-gray-900 italic">"{tip.followUp}"</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
}
