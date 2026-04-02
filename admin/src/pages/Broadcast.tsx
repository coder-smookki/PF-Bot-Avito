import { useEffect, useState } from 'react';
import {
  Card,
  Input,
  Button,
  Typography,
  Modal,
  Tag,
  Timeline,
  Radio,
  notification,
} from 'antd';
import {
  SendOutlined,
  UserOutlined,
  TeamOutlined,
  UsergroupAddOutlined,
} from '@ant-design/icons';
import { getBroadcasts, sendBroadcast } from '../api/client';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface BroadcastRecord {
  id: number;
  target: string;
  message: string;
  sentAt: string;
  recipientsCount?: number;
}

const targetLabels: Record<string, string> = {
  all: 'Все',
  customers: 'Заказчики',
  executors: 'Исполнители',
};

const targetColors: Record<string, string> = {
  all: 'purple',
  customers: 'blue',
  executors: 'green',
};

const targetOptions = [
  {
    key: 'all',
    label: 'Все пользователи',
    desc: 'Сообщение получат все',
    icon: <UsergroupAddOutlined style={{ fontSize: 20, color: '#8b5cf6' }} />,
  },
  {
    key: 'customers',
    label: 'Заказчики',
    desc: 'Только заказчики',
    icon: <UserOutlined style={{ fontSize: 20, color: '#3b82f6' }} />,
  },
  {
    key: 'executors',
    label: 'Исполнители',
    desc: 'Только исполнители',
    icon: <TeamOutlined style={{ fontSize: 20, color: '#10b981' }} />,
  },
];

export default function Broadcast() {
  const [target, setTarget] = useState<string>('all');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<BroadcastRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = () => {
    getBroadcasts()
      .then((data) => setHistory(data.broadcasts || data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSend = () => {
    if (!message.trim()) {
      notification.warning({ message: 'Введите сообщение' });
      return;
    }
    Modal.confirm({
      title: 'Подтверждение рассылки',
      content: (
        <div>
          <p>
            Получатели:{' '}
            <Tag color={targetColors[target]}>{targetLabels[target]}</Tag>
          </p>
          <p style={{ color: '#64748b', fontSize: 13 }}>
            Сообщение: {message.slice(0, 100)}
            {message.length > 100 ? '...' : ''}
          </p>
        </div>
      ),
      okText: 'Отправить',
      cancelText: 'Отмена',
      okButtonProps: {
        style: {
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          border: 'none',
        },
      },
      onOk: async () => {
        setSending(true);
        try {
          await sendBroadcast(target, message);
          notification.success({ message: 'Рассылка отправлена' });
          setMessage('');
          fetchHistory();
        } catch {
          notification.error({ message: 'Ошибка отправки' });
        } finally {
          setSending(false);
        }
      },
    });
  };

  const MAX_CHARS = 4096;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          Рассылки
        </Title>
        <Text type="secondary">Отправка сообщений пользователям</Text>
      </div>

      <Card
        style={{ marginBottom: 24, borderRadius: 12 }}
        bodyStyle={{ padding: 28 }}
      >
        <div style={{ marginBottom: 20 }}>
          <Text
            style={{
              display: 'block',
              marginBottom: 12,
              fontWeight: 600,
              color: '#334155',
            }}
          >
            Получатели
          </Text>
          <Radio.Group
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            style={{ width: '100%' }}
          >
            <div style={{ display: 'flex', gap: 12 }}>
              {targetOptions.map((opt) => (
                <Radio.Button
                  key={opt.key}
                  value={opt.key}
                  style={{
                    height: 'auto',
                    padding: '16px 20px',
                    borderRadius: 10,
                    flex: 1,
                    display: 'flex',
                    textAlign: 'left',
                    lineHeight: 1.4,
                    background: target === opt.key ? 'rgba(99, 102, 241, 0.06)' : '#fff',
                    borderColor: target === opt.key ? '#6366f1' : '#e2e8f0',
                  }}
                >
                  <div>
                    <div style={{ marginBottom: 4 }}>{opt.icon}</div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{opt.label}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400 }}>
                      {opt.desc}
                    </div>
                  </div>
                </Radio.Button>
              ))}
            </div>
          </Radio.Group>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <Text style={{ fontWeight: 600, color: '#334155' }}>Сообщение</Text>
            <Text
              type="secondary"
              style={{
                fontSize: 12,
                color: message.length > MAX_CHARS ? '#ef4444' : '#94a3b8',
              }}
            >
              {message.length}/{MAX_CHARS}
            </Text>
          </div>
          <TextArea
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Текст рассылки..."
            maxLength={MAX_CHARS}
            style={{ borderRadius: 10, resize: 'none' }}
          />
        </div>

        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSend}
          loading={sending}
          disabled={!message.trim()}
          size="large"
          style={{
            borderRadius: 10,
            height: 48,
            fontWeight: 600,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none',
            paddingLeft: 32,
            paddingRight: 32,
          }}
        >
          Отправить рассылку
        </Button>
      </Card>

      <Card
        title="История рассылок"
        headStyle={{ border: 'none' }}
        style={{ borderRadius: 12 }}
        loading={loading}
      >
        {history.length === 0 ? (
          <Text type="secondary">Рассылок пока не было</Text>
        ) : (
          <Timeline
            items={history.map((item) => ({
              color: targetColors[item.target] || 'gray',
              children: (
                <div style={{ paddingBottom: 8 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 6,
                    }}
                  >
                    <Tag
                      color={targetColors[item.target] || 'default'}
                      style={{ borderRadius: 6 }}
                    >
                      {targetLabels[item.target] || item.target}
                    </Tag>
                    {item.recipientsCount != null && (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {item.recipientsCount} получателей
                      </Text>
                    )}
                  </div>
                  <Text style={{ display: 'block', fontSize: 13, lineHeight: 1.5 }}>
                    {item.message.length > 150
                      ? `${item.message.slice(0, 150)}...`
                      : item.message}
                  </Text>
                  <Text
                    type="secondary"
                    style={{ fontSize: 12, marginTop: 4, display: 'block' }}
                  >
                    {item.sentAt ? dayjs(item.sentAt).format('DD.MM.YYYY HH:mm') : '-'}
                  </Text>
                </div>
              ),
            }))}
          />
        )}
      </Card>
    </div>
  );
}
