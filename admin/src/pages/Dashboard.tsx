import { useEffect, useState } from 'react';
import { Row, Col, Card, Typography, Spin, Table, Tag } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  FileTextOutlined,
  DollarOutlined,
  RiseOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { getStats } from '../api/client';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface Stats {
  totalUsers: number;
  customers: number;
  executors: number;
  activeTasks: number;
  totalRevenue: number;
  todayCommission?: number;
  registrations?: { date: string; count: number }[];
  revenue?: { date: string; amount: number }[];
  recentUsers?: {
    id: number;
    username: string;
    role: string;
    createdAt: string;
  }[];
  recentTasks?: {
    id: number;
    title: string;
    price: number;
    status: string;
    createdAt: string;
  }[];
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  suffix?: string;
  trend?: number;
}

function StatCard({ title, value, icon, iconBg, iconColor, suffix, trend }: StatCardProps) {
  const trendUp = trend && trend > 0;
  return (
    <Card bodyStyle={{ padding: '20px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
            {title}
          </Text>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>
              {typeof value === 'number' ? value.toLocaleString('ru-RU') : value}
            </span>
            {suffix && (
              <span style={{ fontSize: 16, color: '#64748b', fontWeight: 500 }}>{suffix}</span>
            )}
          </div>
          {trend !== undefined && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                marginTop: 8,
                color: trendUp ? '#22c55e' : '#ef4444',
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              {trendUp ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              <span>{Math.abs(trend)}%</span>
              <span style={{ color: '#94a3b8', marginLeft: 2 }}>за неделю</span>
            </div>
          )}
        </div>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            color: iconColor,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 120 }}>
        <Spin size="large" />
      </div>
    );
  }

  const registrations = stats?.registrations || [];
  const revenue = stats?.revenue || [];
  const recentUsers = stats?.recentUsers || [];
  const recentTasks = stats?.recentTasks || [];

  const statCards: StatCardProps[] = [
    {
      title: 'Пользователи',
      value: stats?.totalUsers ?? 0,
      icon: <UserOutlined />,
      iconBg: 'rgba(99, 102, 241, 0.1)',
      iconColor: '#6366f1',
      trend: 12.5,
    },
    {
      title: 'Заказчики',
      value: stats?.customers ?? 0,
      icon: <TeamOutlined />,
      iconBg: 'rgba(59, 130, 246, 0.1)',
      iconColor: '#3b82f6',
      trend: 8.2,
    },
    {
      title: 'Исполнители',
      value: stats?.executors ?? 0,
      icon: <TeamOutlined />,
      iconBg: 'rgba(16, 185, 129, 0.1)',
      iconColor: '#10b981',
      trend: 15.1,
    },
    {
      title: 'Активные задания',
      value: stats?.activeTasks ?? 0,
      icon: <FileTextOutlined />,
      iconBg: 'rgba(245, 158, 11, 0.1)',
      iconColor: '#f59e0b',
      trend: 5.3,
    },
    {
      title: 'Оборот',
      value: stats?.totalRevenue ?? 0,
      icon: <DollarOutlined />,
      iconBg: 'rgba(139, 92, 246, 0.1)',
      iconColor: '#8b5cf6',
      suffix: '\u20BD',
      trend: 22.4,
    },
    {
      title: 'Комиссия за сегодня',
      value: stats?.todayCommission ?? 0,
      icon: <RiseOutlined />,
      iconBg: 'rgba(236, 72, 153, 0.1)',
      iconColor: '#ec4899',
      suffix: '\u20BD',
      trend: -3.1,
    },
  ];

  const statusMap: Record<string, { color: string; label: string }> = {
    active: { color: 'green', label: 'Активно' },
    completed: { color: 'blue', label: 'Завершено' },
    cancelled: { color: 'red', label: 'Отменено' },
    pending: { color: 'orange', label: 'Ожидание' },
    paused: { color: 'default', label: 'Пауза' },
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0, color: '#0f172a' }}>
          Дашборд
        </Title>
        <Text type="secondary">Обзор основных показателей</Text>
      </div>

      <Row gutter={[16, 16]}>
        {statCards.map((card, i) => (
          <Col xs={24} sm={12} lg={8} key={i}>
            <StatCard {...card} />
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card
            title="Регистрации за 30 дней"
            headStyle={{ border: 'none', paddingBottom: 0 }}
          >
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={registrations}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#6366f1' }}
                  activeDot={{ r: 5 }}
                  name="Регистрации"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title="Доход по дням"
            headStyle={{ border: 'none', paddingBottom: 0 }}
          >
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                  formatter={(v: number) => [`${v.toLocaleString('ru-RU')} \u20BD`, 'Доход']}
                />
                <Bar
                  dataKey="amount"
                  fill="#8b5cf6"
                  radius={[4, 4, 0, 0]}
                  name="Доход"
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card
            title="Последние пользователи"
            headStyle={{ border: 'none', paddingBottom: 0 }}
          >
            <Table
              dataSource={recentUsers.slice(0, 10)}
              rowKey="id"
              size="small"
              pagination={false}
              columns={[
                {
                  title: 'Имя',
                  dataIndex: 'username',
                  key: 'username',
                  render: (v: string) => <Text strong>{v || '-'}</Text>,
                },
                {
                  title: 'Роль',
                  dataIndex: 'role',
                  key: 'role',
                  render: (r: string) => (
                    <Tag color={r === 'customer' ? 'blue' : 'green'} style={{ borderRadius: 6 }}>
                      {r === 'customer' ? 'Заказчик' : 'Исполнитель'}
                    </Tag>
                  ),
                },
                {
                  title: 'Дата',
                  dataIndex: 'createdAt',
                  key: 'createdAt',
                  render: (d: string) => (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {d ? dayjs(d).format('DD.MM.YY HH:mm') : '-'}
                    </Text>
                  ),
                },
              ]}
              locale={{ emptyText: 'Нет данных' }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title="Последние задания"
            headStyle={{ border: 'none', paddingBottom: 0 }}
          >
            <Table
              dataSource={recentTasks.slice(0, 10)}
              rowKey="id"
              size="small"
              pagination={false}
              columns={[
                {
                  title: 'Название',
                  dataIndex: 'title',
                  key: 'title',
                  ellipsis: true,
                  render: (v: string) => <Text strong>{v}</Text>,
                },
                {
                  title: 'Цена',
                  dataIndex: 'price',
                  key: 'price',
                  width: 90,
                  render: (v: number) => (
                    <Text style={{ fontWeight: 600, color: '#6366f1' }}>
                      {(v ?? 0).toLocaleString('ru-RU')} \u20BD
                    </Text>
                  ),
                },
                {
                  title: 'Статус',
                  dataIndex: 'status',
                  key: 'status',
                  width: 110,
                  render: (s: string) => {
                    const info = statusMap[s] || { color: 'default', label: s };
                    return <Tag color={info.color} style={{ borderRadius: 6 }}>{info.label}</Tag>;
                  },
                },
              ]}
              locale={{ emptyText: 'Нет данных' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
