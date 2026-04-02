import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, notification } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { login } from '../api/client';

const { Title, Text } = Typography;

export default function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      await login(values.username, values.password);
      notification.success({ message: 'Добро пожаловать!' });
      navigate('/dashboard');
    } catch {
      localStorage.removeItem('admin_username');
      localStorage.removeItem('admin_password');
      notification.error({
        message: 'Ошибка входа',
        description: 'Неверный логин или пароль',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          right: '-10%',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15), transparent 70%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-15%',
          left: '-5%',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1), transparent 70%)',
        }}
      />

      <Card
        style={{
          width: 420,
          borderRadius: 16,
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
          border: 'none',
          position: 'relative',
          zIndex: 1,
        }}
        bodyStyle={{ padding: '40px 32px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              boxShadow: '0 8px 16px rgba(99, 102, 241, 0.3)',
            }}
          >
            <span style={{ color: '#fff', fontSize: 22, fontWeight: 700 }}>PF</span>
          </div>
          <Title level={3} style={{ margin: 0, color: '#0f172a' }}>
            Панель управления
          </Title>
          <Text type="secondary" style={{ fontSize: 14 }}>
            Введите данные для входа
          </Text>
        </div>

        <Form onFinish={onFinish} size="large" layout="vertical">
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Введите логин' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#94a3b8' }} />}
              placeholder="Логин"
              style={{ borderRadius: 10, height: 48 }}
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Введите пароль' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
              placeholder="Пароль"
              style={{ borderRadius: 10, height: 48 }}
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{
                height: 48,
                borderRadius: 10,
                fontWeight: 600,
                fontSize: 15,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                border: 'none',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
              }}
            >
              Войти
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
