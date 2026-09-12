import React, { useEffect, useState } from 'react';
import { DashboardData } from '../types';
import { getDashboardData } from '../services/api';

interface DashboardProps {
  organizationId?: number;
}

const Dashboard: React.FC<DashboardProps> = ({ organizationId }) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [organizationId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await getDashboardData(organizationId);
      setData(result);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const cards = [
    {
      title: 'Роды за прошедшие сутки',
      subtitle: 'с 8:00 позавчера до 8:00 вчера',
      total: data.yesterday.total,
      cesarean: data.yesterday.cesarean,
      vacuum: data.yesterday.vacuum,
      icon: 'fa-clock',
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Роды за неделю',
      subtitle: 'с понедельника текущей недели',
      total: data.week.total,
      cesarean: data.week.cesarean,
      vacuum: data.week.vacuum,
      icon: 'fa-calendar-week',
      color: 'from-green-500 to-green-600',
    },
    {
      title: 'Роды с начала месяца',
      subtitle: 'с 1-го числа текущего месяца',
      total: data.month.total,
      cesarean: data.month.cesarean,
      vacuum: data.month.vacuum,
      icon: 'fa-calendar-alt',
      color: 'from-purple-500 to-purple-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {cards.map((card, index) => (
        <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className={`bg-gradient-to-r ${card.color} px-4 py-3`}>
            <div className="flex items-center justify-between">
              <h3 className="text-white font-medium text-sm">{card.title}</h3>
              <i className={`fas ${card.icon} text-white/70`}></i>
            </div>
            <p className="text-white/70 text-xs mt-1">{card.subtitle}</p>
          </div>
          <div className="p-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-800">{card.total}</p>
                <p className="text-sm text-gray-500">всего родов</p>
              </div>
              <div className="text-right space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="inline-block w-3 h-3 rounded-full bg-red-400"></span>
                  <span className="text-gray-600">КС: <strong>{card.cesarean}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="inline-block w-3 h-3 rounded-full bg-yellow-400"></span>
                  <span className="text-gray-600">Вакуум: <strong>{card.vacuum}</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Dashboard;
