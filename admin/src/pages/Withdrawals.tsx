import { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Badge,
  Popconfirm,
  Card,
  Tabs,
  notification,
} from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { getPendingWithdrawals, processWithdrawal } from '../api/client';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface Withdrawal {
  id: number;
  userId: number;
  username?: string;
  amount: number;
  status: string;
  createdAt: string;
}

const statusStyles: Record<string, { color: string; label: string }> = {
  pending: { color: 'orange', label: 'Ожидание' },
  approved: { color: 'green', label: 'Одобрено' },
  rejected: { color: 'red', label: 'Отклонено' },
};

export default function Withdrawals() {
  const [items, setItems] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');

  const fetchData = () => {
    setLoading(true);
    getPendingWithdrawals()
      .then((data) => setItems(data.withdrawals || data || []))
      .catch(() => notification.error({ message: 'Ошибка загрузки' }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleProcess = async (id: number, approved: boolean) => {
    try {
      await processWithdrawal(id, approved);
      notification.success({
        message: approved ? 'Заявка одобрена' : 'Заявка отклонена',
      });
      fetchData();
    } catch {
      notification.error({ message: 'Ошибка обработки' });
    }
  };

  const filteredItems = items.filter((item) => {
    if (activeTab === 'pending') return item.status === 'pending';
    return item.status !== 'pending';
  });

  const pendingCount = items.filter((i) => i.status === 'pending').length;

  const columns: ColumnsType<Withdrawal> = [
    {
      title: 'Пользователь',
      key: 'user',
      render: (_, record) => (
        <div>
          <Text strong style={{ display: 'block' }}>
            {record.username || `ID: ${record.userId}`}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            #{record.id}
          </Text>
        </div>
      ),
    },
    {
      title: 'Сумма',
      dataIndex: 'amount',
      key: 'amount',
      width: 140,
      render: (v: number) => (
        <Text style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
          {v.toLocaleString('ru-RU')} {'\u20BD'}
        </Text>
      ),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (s: string) => {
        const info = statusStyles[s] || { color: 'default', label: s };
        return <Tag color={info.color} style={{ borderRadius: 6 }}>{info.label}</Tag>;
      },
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
    {
      title: 'Действия',
      key: 'actions',
      width: 220,
      render: (_, record) =>
        record.status === 'pending' ? (
          <Space>
            <Popconfirm
              title="Одобрить заявку на вывод?"
              onConfirm={() => handleProcess(record.id, true)}
              okText="Да"
              cancelText="Нет"
            >
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                style={{
                  borderRadius: 6,
                  background: '#22c55e',
                  borderColor: '#22c55e',
                }}
              >
                Одобрить
              </Button>
            </Popconfirm>
            <Popconfirm
              title="Отклонить заявку?"
              description="Средства вернутся на баланс пользователя."
              onConfirm={() => handleProcess(record.id, false)}
              okText="Да"
              cancelText="Нет"
            >
              <Button
                danger
                size="small"
                icon={<CloseOutlined />}
                style={{ borderRadius: 6 }}
              >
                Отклонить
              </Button>
            </Popconfirm>
          </Space>
        ) : null,
    },
  ];

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <div>
          <Title level={4} style={{ margin: 0 }}>
            Заявки на вывод
          </Title>
          <Text type="secondary">Управление выводом средств</Text>
        </div>
        {pendingCount > 0 && (
          <Badge
            count={`${pendingCount} ожидает`}
            style={{
              backgroundColor: '#f59e0b',
              fontSize: 13,
              fontWeight: 600,
              padding: '0 12px',
              borderRadius: 20,
            }}
          />
        )}
      </div>

      <Card bodyStyle={{ padding: 0 }} style={{ borderRadius: 12 }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          style={{ padding: '0 16px' }}
          items={[
            {
              key: 'pending',
              label: (
                <span>
                  Ожидающие{' '}
                  {pendingCount > 0 && (
                    <Badge
                      count={pendingCount}
                      size="small"
                      style={{ backgroundColor: '#f59e0b' }}
                    />
                  )}
                </span>
              ),
            },
            { key: 'processed', label: 'Обработанные' },
          ]}
        />
        <Table
          columns={columns}
          dataSource={filteredItems}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20, showTotal: (t) => `Всего ${t}` }}
        />
      </Card>
    </div>
  );
}
