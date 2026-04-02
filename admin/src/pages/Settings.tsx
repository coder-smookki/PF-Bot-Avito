import { useEffect, useState } from 'react';
import {
  Card,
  InputNumber,
  Button,
  Typography,
  Spin,
  Alert,
  notification,
} from 'antd';
import { SaveOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { getCommission, setCommission } from '../api/client';

const { Title, Text } = Typography;

export default function Settings() {
  const [current, setCurrent] = useState<number>(0);
  const [value, setValue] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getCommission()
      .then((data) => {
        const val = data.commission ?? data.amount ?? 0;
        setCurrent(val);
        setValue(val);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setCommission(value);
      setCurrent(value);
      notification.success({
        message: 'Сохранено',
        description: `Комиссия обновлена: ${value} руб.`,
        placement: 'topRight',
      });
    } catch {
      notification.error({ message: 'Ошибка сохранения' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 120 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          Настройки
        </Title>
        <Text type="secondary">Конфигурация платформы</Text>
      </div>

      <Card
        style={{ maxWidth: 560, borderRadius: 12 }}
        bodyStyle={{ padding: 32 }}
      >
        <div style={{ marginBottom: 24 }}>
          <Text
            type="secondary"
            style={{
              fontSize: 12,
              textTransform: 'uppercase',
              fontWeight: 600,
              letterSpacing: '0.05em',
            }}
          >
            Настройки комиссии
          </Text>
        </div>

        <div
          style={{
            padding: '24px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.06), rgba(139, 92, 246, 0.06))',
            borderRadius: 12,
            marginBottom: 24,
            textAlign: 'center',
          }}
        >
          <Text type="secondary" style={{ fontSize: 13 }}>
            Текущая комиссия
          </Text>
          <div
            style={{
              fontSize: 48,
              fontWeight: 700,
              color: '#6366f1',
              lineHeight: 1.2,
            }}
          >
            {current}
            <span style={{ fontSize: 24, color: '#94a3b8', marginLeft: 4 }}>руб.</span>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <Text style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
            Новое значение комиссии
          </Text>
          <InputNumber
            min={0}
            max={10000}
            value={value}
            onChange={(v) => setValue(v ?? 0)}
            style={{ width: '100%', borderRadius: 8 }}
            size="large"
            addonAfter="руб."
          />
        </div>

        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSave}
          loading={saving}
          block
          size="large"
          style={{
            borderRadius: 10,
            height: 48,
            fontWeight: 600,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none',
          }}
        >
          Сохранить
        </Button>

        <Alert
          type="info"
          showIcon
          icon={<InfoCircleOutlined style={{ color: '#6366f1' }} />}
          message="Как работает комиссия"
          description="Комиссия списывается с каждой успешной транзакции между заказчиком и исполнителем. Значение указывается в рублях и применяется к каждому выполнению задания."
          style={{
            marginTop: 20,
            borderRadius: 10,
            border: '1px solid rgba(99, 102, 241, 0.2)',
            background: 'rgba(99, 102, 241, 0.04)',
          }}
        />
      </Card>
    </div>
  );
}
