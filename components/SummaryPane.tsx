
import React from 'react';
import { AppState } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Users, Receipt } from 'lucide-react';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const SummaryPane: React.FC<{ state: AppState }> = ({ state }) => {
  const { receipt, assignments } = state;
  if (!receipt) return null;

  // Fix: Explicitly cast the flattened array to string[] to resolve 'unknown' index type error
  const people = Array.from(new Set(Object.values(assignments).flat())) as string[];
  
  // Calculate raw subtotal per person
  const personSubtotals: Record<string, number> = {};
  people.forEach(p => personSubtotals[p] = 0);

  receipt.items.forEach(item => {
    const splitters = assignments[item.id] || [];
    if (splitters.length > 0) {
      const share = item.price / splitters.length;
      splitters.forEach(p => {
        personSubtotals[p] += share;
      });
    }
  });

  const totalAssignedSubtotal = Object.values(personSubtotals).reduce((a, b) => a + b, 0);
  const realSubtotal = receipt.subtotal;
  
  // Proportional multiplier for tax and tip
  const multiplier = realSubtotal > 0 ? (realSubtotal + receipt.tax + receipt.tip) / realSubtotal : 1;

  const summary = people.map(person => ({
    name: person,
    // Fix: person is now correctly typed as string
    subtotal: personSubtotals[person],
    total: personSubtotals[person] * multiplier
  })).sort((a, b) => b.total - a.total);

  const chartData = summary.map(s => ({ name: s.name, value: s.total }));
  const grandTotal = summary.reduce((acc, s) => acc + s.total, 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 overflow-hidden">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-indigo-50 rounded-lg">
          <Users className="w-5 h-5 text-indigo-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Split Summary</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div className="h-[200px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Total']}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-300">
              <Receipt className="w-12 h-12 opacity-20 mb-2" />
              <p className="text-sm italic">Assign items to see split</p>
            </div>
          )}
        </div>

        <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2">
          {summary.length > 0 ? (
            summary.map((person, idx) => (
              <div key={person.name} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                  <span className="font-semibold text-slate-700">{person.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900">${person.total.toFixed(2)}</div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                    {((person.total / grandTotal) * 100 || 0).toFixed(0)}% Share
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-slate-400 py-8">
              No assignments yet.
            </div>
          )}
        </div>
      </div>

      {summary.length > 0 && (
        <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center">
          <div className="text-sm font-medium text-slate-500">Grand Total Accounted</div>
          <div className="text-2xl font-black text-indigo-600">${grandTotal.toFixed(2)}</div>
        </div>
      )}
    </div>
  );
};

export default SummaryPane;
