import React, { useState } from 'react';
import { Card, Badge, Button } from '../common/UIComponents';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, Briefcase } from 'lucide-react';

export const AttendanceVisualCalendar = ({ records = [], onSelectDate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Map date string YYYY-MM-DD -> record
  const recordMap = {};
  records.forEach((r) => {
    recordMap[r.date] = r;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'PRESENT':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'ABSENT':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'HALF_DAY':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'LEAVE':
        return 'bg-sky-100 text-sky-800 border-sky-300';
      case 'WORK_FROM_HOME':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'LATE':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-slate-50 text-slate-400 border-slate-100';
    }
  };

  const daysGrid = [];
  for (let i = 0; i < firstDayIndex; i++) {
    daysGrid.push(null);
  }
  for (let d = 1; d <= totalDays; d++) {
    daysGrid.push(d);
  }

  return (
    <Card className="p-6">
      {/* Month Navigator & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-extrabold text-slate-900">
            {monthNames[month]} {year}
          </h3>
          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="p-1 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              className="p-1 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 text-[11px] font-medium">
          <span className="flex items-center gap-1 text-emerald-700 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Present
          </span>
          <span className="flex items-center gap-1 text-purple-700 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> WFH
          </span>
          <span className="flex items-center gap-1 text-amber-700 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Half Day
          </span>
          <span className="flex items-center gap-1 text-sky-700 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> Leave
          </span>
          <span className="flex items-center gap-1 text-rose-700 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Absent
          </span>
        </div>
      </div>

      {/* Weekday Header */}
      <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-bold text-slate-400 uppercase mb-2">
        <span>Sun</span>
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
      </div>

      {/* Calendar Days Matrix */}
      <div className="grid grid-cols-7 gap-2">
        {daysGrid.map((dayNum, idx) => {
          if (!dayNum) {
            return <div key={`empty-${idx}`} className="h-20 bg-slate-50/40 rounded-xl border border-transparent" />;
          }

          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
          const rec = recordMap[dateStr];
          const isToday = new Date().toISOString().split('T')[0] === dateStr;

          return (
            <div
              key={dateStr}
              onClick={() => onSelectDate && rec && onSelectDate(rec)}
              className={`h-20 p-2 rounded-xl border transition flex flex-col justify-between cursor-pointer hover:shadow-xs ${
                rec ? getStatusColor(rec.status) : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
              } ${isToday ? 'ring-2 ring-brand-500' : ''}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">{dayNum}</span>
                {isToday && <span className="text-[9px] font-bold uppercase text-brand-600 bg-brand-50 px-1 rounded">Today</span>}
              </div>

              {rec && (
                <div className="text-[10px] truncate leading-tight">
                  <p className="font-extrabold">{rec.status.replace('_', ' ')}</p>
                  <p className="font-mono">{rec.working_hours} hrs</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};
