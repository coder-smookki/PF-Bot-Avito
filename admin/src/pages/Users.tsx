import { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Tag,
  Typography,
  Badge,
  Popconfirm,
  Drawer,
  Descriptions,
  Avatar,
  Space,
  Card,
  notification,
} from 'antd';
import {
  SearchOutlined,
  StopOutlined,
  CheckCircleOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { getUsers, banUser, unbanUser } from '../api/client';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface User {
  id: number;
  username: string;
  telegramId: string;
  role: string;
  balance: number;
  isBanned: boolean;
  createdAt: string;
  firstName?: string;
  lastName?: string;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getUsers({ page, limit: 20, search, role });
      const list = data.users || data;
      const filtered = statusFilter
        ? list.filter((u: User) =>
            statusFilter === 'banned' ? u.isBanned : !u.isBanned,
          )
        : list;
      setUsers(filtered);
      setTotal(data.total || list.length);
    } catch {
      notification.error({ message: 'Ошибка загрузки пользователей' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, search, role, statusFilter]);

  const handleBan = async (id: number) => {
    try {
      await banUser(id);
      notification.success({ message: 'Пользователь заблокирован' });
      fetchUsers();
    } catch {
      notification.error({ message: 'Ошибка блокировки' });
    }
  };

  const handleUnban = async (id: number) => {
    try {
      await unbanUser(id);
      notification.success({ message: 'Пользователь разблокирован' });
      fetchUsers();
    } catch {
      notification.error({ message: 'Ошибка разблокировки' });
    }
  };

  const columns: ColumnsType<User> = [
    {
      title: 'Пользователь',
      key: 'user',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar
            size={36}
            icon={<UserOutlined />}
            style={{
              background:
                record.role === 'customer'
                  ? 'linear-gradient(135deg, #3b82f6, #6366f1)'
                  : 'linear-gradient(135deg, #10b981, #059669)',
              flexShrink: 0,
            }}
          />
          <div>
            <Text strong style={{ display: 'block', lineHeight: 1.3 }}>
              {record.username || 'Без имени'}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              ID: {record.telegramId}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Роль',
      dataIndex: 'role',
      key: 'role',
      width: 130,
      render: (r: string) => (
        <Tag
          color={r === 'customer' ? 'blue' : 'green'}
          style={{ borderRadius: 6, fontWeight: 500 }}
        >
          {r === 'customer' ? 'Заказчик' : 'Исполнитель'}
        </Tag>
      ),
    },
    {
      title: 'Баланс',
      dataIndex: 'balance',
      key: 'balance',
      width: 120,
      render: (v: number) => (
        <Text style={{ fontWeight: 600 }}>{(v ?? 0).toLocaleString('ru-RU')} \u20BD</Text>
      ),
    },
    {
      title: 'Статус',
      dataIndex: 'isBanned',
      key: 'isBanned',
      width: 130,
      render: (banned: boolean) =>
        banned ? (
          <Tag color="red" style={{ borderRadius: 6 }}>Заблокирован</Tag>
        ) : (
          <Tag color="green" style={{ borderRadius: 6 }}>Активен</Tag>
        ),
    },
    {
      title: 'Дата регистрации',
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
      width: 160,
      render: (_, record) =>
        record.isBanned ? (
          <Popconfirm
            title="Разблокировать пользователя?"
            onConfirm={() => handleUnban(record.id)}
            okText="Да"
            cancelText="Нет"
          >
            <Button size="small" icon={<CheckCircleOutlined />} style={{ borderRadius: 6 }}>
              Разблокировать
            </Button>
          </Popconfirm>
        ) : (
          <Popconfirm
            title="Заблокировать пользователя?"
            onConfirm={() => handleBan(record.id)}
            okText="Да"
            cancelText="Нет"
          >
            <Button
              size="small"
              danger
              icon={<StopOutlined />}
              style={{ borderRadius: 6 }}
            >
              Заблокировать
            </Button>
          </Popconfirm>
        ),
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
            Пользователи
          </Title>
          <Text type="secondary">Управление пользователями платформы</Text>
        </div>
        <Badge
          count={total}
          style={{ backgroundColor: '#6366f1' }}
          overflowCount={9999}
          showZero
        />
      </div>

      <Card bodyStyle={{ padding: 16 }} style={{ marginBottom: 16 }}>
        <Space wrap size="middle">
          <Input
            placeholder="Поиск по имени или ID..."
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{ width: 280, borderRadius: 8 }}
            allowClear
          />
          <Select
            placeholder="Все роли"
            value={role}
            onChange={(v) => {
              setRole(v);
              setPage(1);
            }}
            allowClear
            style={{ width: 160 }}
            options={[
              { label: 'Заказчики', value: 'customer' },
              { label: 'Исполнители', value: 'executor' },
            ]}
          />
          <Select
            placeholder="Все статусы"
            value={statusFilter}
            onChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
            allowClear
            style={{ width: 160 }}
            options={[
              { label: 'Активные', value: 'active' },
              { label: 'Заблокированные', value: 'banned' },
            ]}
          />
        </Space>
      </Card>

      <Card bodyStyle={{ padding: 0 }}>
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          onRow={(record) => ({
            onClick: () => setSelectedUser(record),
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

      <Drawer
        title="Профиль пользователя"
        open={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        width={420}
      >
        {selectedUser && (
          <div>
            <div
              style={{
                textAlign: 'center',
                marginBottom: 24,
                padding: 24,
                background: '#f8fafc',
                borderRadius: 12,
              }}
            >
              <Avatar
                size={64}
                icon={<UserOutlined />}
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  marginBottom: 12,
                }}
              />
              <Title level={5} style={{ margin: 0 }}>
                {selectedUser.username || 'Без имени'}
              </Title>
              <Tag
                color={selectedUser.role === 'customer' ? 'blue' : 'green'}
                style={{ marginTop: 8, borderRadius: 6 }}
              >
                {selectedUser.role === 'customer' ? 'Заказчик' : 'Исполнитель'}
              </Tag>
            </div>

            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="ID">{selectedUser.id}</Descriptions.Item>
              <Descriptions.Item label="Telegram ID">
                {selectedUser.telegramId}
              </Descriptions.Item>
              <Descriptions.Item label="Баланс">
                <Text strong>{(selectedUser.balance ?? 0).toLocaleString('ru-RU')} \u20BD</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Статус">
                {selectedUser.isBanned ? (
                  <Tag color="red">Заблокирован</Tag>
                ) : (
                  <Tag color="green">Активен</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Дата регистрации">
                {selectedUser.createdAt
                  ? dayjs(selectedUser.createdAt).format('DD.MM.YYYY HH:mm')
                  : '-'}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 24 }}>
              {selectedUser.isBanned ? (
                <Popconfirm
                  title="Разблокировать пользователя?"
                  onConfirm={() => {
                    handleUnban(selectedUser.id);
                    setSelectedUser(null);
                  }}
                  okText="Да"
                  cancelText="Нет"
                >
                  <Button icon={<CheckCircleOutlined />} block style={{ borderRadius: 8 }}>
                    Разблокировать
                  </Button>
                </Popconfirm>
              ) : (
                <Popconfirm
                  title="Заблокировать пользователя?"
                  onConfirm={() => {
                    handleBan(selectedUser.id);
                    setSelectedUser(null);
                  }}
                  okText="Да"
                  cancelText="Нет"
                >
                  <Button danger icon={<StopOutlined />} block style={{ borderRadius: 8 }}>
                    Заблокировать
                  </Button>
                </Popconfirm>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
