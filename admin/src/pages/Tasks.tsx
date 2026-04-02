import { useEffect, useState } from 'react';
import {
  Table,
  Input,
  Tag,
  Typography,
  Modal,
  Descriptions,
  Progress,
  Card,
  Tabs,
  notification,
} from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { getTasks } from '../api/client';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface Task {
  id: number;
  title: string;
  description?: string;
  customerName?: string;
  price: number;
  status: string;
  executionsCount?: number;
  maxExecutions?: number;
  createdAt: string;
  instructions?: string;
  verificationType?: string;
  totalBudget?: number;
}

const statusMap: Record<string, { color: string; label: string }> = {
  active: { color: 'green', label: 'Активно' },
  completed: { color: 'blue', label: 'Завершено' },
  cancelled: { color: 'red', label: 'Отменено' },
  pending: { color: 'orange', label: 'Ожидание' },
  paused: { color: 'default', label: 'Пауза' },
};

const statusTabs = [
  { key: 'all', label: 'Все' },
  { key: 'active', label: 'Активные' },
  { key: 'pending', label: 'Ожидание' },
  { key: 'completed', label: 'Завершённые' },
  { key: 'cancelled', label: 'Отменённые' },
  { key: 'paused', label: 'На паузе' },
];

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [selected, setSelected] = useState<Task | null>(null);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20, search };
      if (status !== 'all') params.status = status;
      const data = await getTasks(params as any);
      setTasks(data.tasks || data);
      setTotal(data.total || (data.tasks || data).length);
    } catch {
      notification.error({ message: 'Ошибка загрузки заданий' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [page, search, status]);

  const columns: ColumnsType<Task> = [
    {
      title: 'Задание',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (v: string) => <Text strong style={{ color: '#0f172a' }}>{v}</Text>,
    },
    {
      title: 'Заказчик',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 150,
      render: (v: string) => <Text type="secondary">{v || '-'}</Text>,
    },
    {
      title: 'Цена',
      dataIndex: 'price',
      key: 'price',
      width: 110,
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
      width: 120,
      render: (s: string) => {
        const info = statusMap[s] || { color: 'default', label: s };
        return <Tag color={info.color} style={{ borderRadius: 6 }}>{info.label}</Tag>;
      },
    },
    {
      title: 'Прогресс',
      key: 'executions',
      width: 160,
      render: (_, r) => {
        const current = r.executionsCount ?? 0;
        const max = r.maxExecutions || 0;
        const percent = max > 0 ? Math.round((current / max) * 100) : 0;
        return max > 0 ? (
          <div>
            <Progress
              percent={percent}
              size="small"
              strokeColor="#6366f1"
              format={() => `${current}/${max}`}
            />
          </div>
        ) : (
          <Text type="secondary" style={{ fontSize: 13 }}>{current} вып.</Text>
        );
      },
    },
    {
      title: 'Дата',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (d: string) => (
        <Text type="secondary" style={{ fontSize: 13 }}>
          {d ? dayjs(d).format('DD.MM.YYYY HH:mm') : '-'}
        </Text>
      ),
    },
  ];

  const vtypeLabels: Record<string, string> = {
    screenshot: 'Скриншот',
    question: 'Контрольный вопрос',
    manual: 'Ручная проверка',
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          Задания
        </Title>
        <Text type="secondary">Управление заданиями платформы</Text>
      </div>

      <Card bodyStyle={{ padding: 0 }}>
        <div style={{ padding: '12px 16px 0' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <Tabs
              activeKey={status}
              onChange={(key) => {
                setStatus(key);
                setPage(1);
              }}
              items={statusTabs}
              style={{ marginBottom: 0 }}
            />
            <Input
              placeholder="Поиск..."
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              style={{ width: 250, borderRadius: 8 }}
              allowClear
            />
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={tasks}
          rowKey="id"
          loading={loading}
          onRow={(record) => ({
            onClick: () => setSelected(record),
            style: { cursor: 'pointer' },
          })}
          pagination={{
            current: page,
            total,
            pageSize: 20,
            onChange: setPage,
            showSizeChanger: false,
            showTotal: (t) => `Всего ${t}`,
          }}
        />
      </Card>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>Детали задания</span>
            {selected && (
              <Tag
                color={statusMap[selected.status]?.color || 'default'}
                style={{ borderRadius: 6 }}
              >
                {statusMap[selected.status]?.label || selected.status}
              </Tag>
            )}
          </div>
        }
        open={!!selected}
        onCancel={() => setSelected(null)}
        footer={null}
        width={640}
      >
        {selected && (
          <div>
            <Title level={5} style={{ marginTop: 8, marginBottom: 16 }}>
              {selected.title}
            </Title>

            <Descriptions
              column={2}
              bordered
              size="small"
              labelStyle={{ fontWeight: 500, color: '#64748b' }}
            >
              <Descriptions.Item label="ID">{selected.id}</Descriptions.Item>
              <Descriptions.Item label="Заказчик">
                {selected.customerName || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Цена за выполнение">
                <Text strong style={{ color: '#6366f1' }}>
                  {selected.price?.toLocaleString('ru-RU')} \u20BD
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Бюджет">
                {selected.totalBudget?.toLocaleString('ru-RU') ?? '-'} \u20BD
              </Descriptions.Item>
              <Descriptions.Item label="Выполнения">
                {selected.executionsCount ?? 0}
                {selected.maxExecutions ? ` / ${selected.maxExecutions}` : ''}
              </Descriptions.Item>
              <Descriptions.Item label="Проверка">
                {vtypeLabels[selected.verificationType || ''] || selected.verificationType || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Создано" span={2}>
                {dayjs(selected.createdAt).format('DD.MM.YYYY HH:mm')}
              </Descriptions.Item>
            </Descriptions>

            {selected.description && (
              <div style={{ marginTop: 16 }}>
                <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', fontWeight: 600 }}>
                  Описание
                </Text>
                <div
                  style={{
                    marginTop: 4,
                    padding: 12,
                    background: '#f8fafc',
                    borderRadius: 8,
                    fontSize: 13,
                    lineHeight: 1.6,
                  }}
                >
                  {selected.description}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
