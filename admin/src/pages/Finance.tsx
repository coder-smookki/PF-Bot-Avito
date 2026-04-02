import { useEffect, useState } from 'react';
import { Row, Col, Card, Typography, Spin, Table, Tag } from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  PercentageOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { getFinanceStats } from '../api/client';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const DONUT_COLORS = ['#22c55e', '#f59e0b', '#6366f1', '#8b5cf6'];

interface FinanceData {
  totalDeposits: number;
  totalWithdrawals: number;
  totalCommissions: number;
  netRevenue: number;
  transactionTypes?: { name: string; value: number }[];
  dailyRevenue?: { date: string; amount: number }[];
  recentTransactions?: {
    id: number;
    type: string;
    amount: number;
    username?: string;
    createdAt: string;
  }[];
}

interface FinanceCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bg: string;
}

function FinanceCard({ title, value, icon, color, bg }: FinanceCardProps) {
  return (
    <Card bodyStyle={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            color: color,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div>
          <Text type="secondary" style={{ fontSize: 13, display: 'block' }}>
            {title}
          </Text>
          <span style={{ fontSize: 26, fontWeight: 700, color: '#0f172a' }}>
            {value.toLocaleString('ru-RU')}
          </span>
          <span style={{ fontSize: 16, color: '#64748b', marginLeft: 4 }}>{'\u20BD'}</span>
        </div>
      </div>
    </Card>
  );
}

export default function Finance() {
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFinanceStats()
      .then(setData)
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

  const transactionTypes = data?.transactionTypes || [
    { name: 'Депозиты', value: data?.totalDeposits ?? 0 },
    { name: 'Выплаты', value: data?.totalWithdrawals ?? 0 },
    { name: 'Комиссия', value: data?.totalCommissions ?? 0 },
  ];

  const dailyRevenue = data?.dailyRevenue || [];
  const recentTransactions = data?.recentTransactions || [];

  const txTypeLabels: Record<string, { label: string; color: string }> = {
    deposit: { label: 'Депозит', color: 'green' },
    withdraw: { label: 'Вывод', color: 'orange' },
    payment: { label: 'Оплата', color: 'blue' },
    earning: { label: 'Заработок', color: 'purple' },
    commission: { label: 'Комиссия', color: 'geekblue' },
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          Финансы
        </Title>
        <Text type="secondary">Финансовая аналитика платформы</Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <FinanceCard
            title="Депозиты"
            value={data?.totalDeposits ?? 0}
            icon={<ArrowUpOutlined />}
            color="#22c55e"
            bg="rgba(34, 197, 94, 0.1)"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <FinanceCard
            title="Выплаты"
            value={data?.totalWithdrawals ?? 0}
            icon={<ArrowDownOutlined />}
            color="#f59e0b"
            bg="rgba(245, 158, 11, 0.1)"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <FinanceCard
            title="Комиссия"
            value={data?.totalCommissions ?? 0}
            icon={<PercentageOutlined />}
            color="#6366f1"
            bg="rgba(99, 102, 241, 0.1)"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <FinanceCard
            title="Чистая прибыль"
            value={data?.netRevenue ?? 0}
            icon={<TrophyOutlined />}
            color="#8b5cf6"
            bg="rgba(139, 92, 246, 0.1)"
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={10}>
          <Card
            title="Распределение транзакций"
            headStyle={{ border: 'none', paddingBottom: 0 }}
          >
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={transactionTypes}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={4}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {transactionTypes.map((_, i) => (
                    <Cell
                      key={i}
                      fill={DONUT_COLORS[i % DONUT_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => [`${v.toLocaleString('ru-RU')} \u20BD`]}
                  contentStyle={{
                    borderRadius: 8,
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card
            title="Доход за 30 дней"
            headStyle={{ border: 'none', paddingBottom: 0 }}
          >
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailyRevenue}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip
                  formatter={(v: number) => [`${v.toLocaleString('ru-RU')} \u20BD`, 'Доход']}
                  contentStyle={{
                    borderRadius: 8,
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  name="Доход"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Card
        title="Последние транзакции"
        headStyle={{ border: 'none' }}
        style={{ marginTop: 24 }}
      >
        <Table
          dataSource={recentTransactions}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: 'Нет транзакций' }}
          columns={[
            {
              title: 'Тип',
              dataIndex: 'type',
              key: 'type',
              width: 130,
              render: (t: string) => {
                const info = txTypeLabels[t] || { label: t, color: 'default' };
                return <Tag color={info.color} style={{ borderRadius: 6 }}>{info.label}</Tag>;
              },
            },
            {
              title: 'Пользователь',
              dataIndex: 'username',
              key: 'username',
              render: (v: string) => v || '-',
            },
            {
              title: 'Сумма',
              dataIndex: 'amount',
              key: 'amount',
              width: 130,
              render: (v: number) => (
                <Text
                  style={{
                    fontWeight: 600,
                    color: v > 0 ? '#22c55e' : '#ef4444',
                  }}
                >
                  {v > 0 ? '+' : ''}
                  {v.toLocaleString('ru-RU')} {'\u20BD'}
                </Text>
              ),
            },
            {
              title: 'Дата',
              dataIndex: 'createdAt',
              key: 'createdAt',
              width: 150,
              render: (d: string) => (
                <Text type="secondary" style={{ fontSize: 13 }}>
                  {d ? dayjs(d).format('DD.MM.YYYY HH:mm') : '-'}
                </Text>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
