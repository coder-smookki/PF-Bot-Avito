import { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  Layout as AntLayout,
  Menu,
  Button,
  Typography,
  Avatar,
  Dropdown,
  Badge,
  Breadcrumb,
} from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  FileTextOutlined,
  DollarOutlined,
  SettingOutlined,
  NotificationOutlined,
  WalletOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  DownOutlined,
} from '@ant-design/icons';

const { Header, Sider, Content } = AntLayout;
const { Text } = Typography;

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Дашборд' },
  { key: '/users', icon: <UserOutlined />, label: 'Пользователи' },
  { key: '/tasks', icon: <FileTextOutlined />, label: 'Задания' },
  { key: '/finance', icon: <DollarOutlined />, label: 'Финансы' },
  { key: '/withdrawals', icon: <WalletOutlined />, label: 'Выводы' },
  { key: '/broadcast', icon: <NotificationOutlined />, label: 'Рассылки' },
  { key: '/settings', icon: <SettingOutlined />, label: 'Настройки' },
];

const breadcrumbNames: Record<string, string> = {
  dashboard: 'Дашборд',
  users: 'Пользователи',
  tasks: 'Задания',
  finance: 'Финансы',
  withdrawals: 'Выводы',
  broadcast: 'Рассылки',
  settings: 'Настройки',
};

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('admin_username');
    localStorage.removeItem('admin_password');
    navigate('/login');
  };

  const username = localStorage.getItem('admin_username') || 'admin';
  const pathSegments = location.pathname.split('/').filter(Boolean);

  const dropdownItems = {
    items: [
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: 'Выход',
        danger: true,
        onClick: handleLogout,
      },
    ],
  };

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={260}
        style={{
          background: '#0f172a',
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            gap: 10,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 700,
              color: '#fff',
              flexShrink: 0,
            }}
          >
            PF
          </div>
          {!collapsed && (
            <Text
              strong
              style={{
                color: '#fff',
                fontSize: 18,
                letterSpacing: '-0.02em',
                background: 'linear-gradient(135deg, #a5b4fc, #c4b5fd)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              PF Admin
            </Text>
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{
            background: 'transparent',
            borderRight: 'none',
            marginTop: 8,
            padding: '0 8px',
          }}
        />

        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          {!collapsed && (
            <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>
              PF Admin v2.0
            </Text>
          )}
        </div>
      </Sider>

      <AntLayout
        style={{
          marginLeft: collapsed ? 80 : 260,
          transition: 'margin-left 0.2s',
        }}
      >
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            position: 'sticky',
            top: 0,
            zIndex: 99,
            height: 64,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: 16, color: '#64748b' }}
            />
            <Breadcrumb
              items={[
                { title: 'Главная' },
                ...pathSegments.map((seg) => ({
                  title: breadcrumbNames[seg] || seg,
                })),
              ]}
              style={{ margin: 0 }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Badge count={3} size="small">
              <Button
                type="text"
                icon={<BellOutlined />}
                style={{ color: '#64748b', fontSize: 18 }}
              />
            </Badge>

            <Dropdown menu={dropdownItems} trigger={['click']}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: 8,
                  transition: 'background 0.2s',
                }}
              >
                <Avatar
                  size={32}
                  style={{
                    background:
                      'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    fontSize: 14,
                  }}
                >
                  {username.charAt(0).toUpperCase()}
                </Avatar>
                <Text strong style={{ color: '#334155', fontSize: 13 }}>
                  {username}
                </Text>
                <DownOutlined
                  style={{ fontSize: 10, color: '#94a3b8' }}
                />
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content
          style={{
            margin: 24,
            minHeight: 'calc(100vh - 64px - 48px)',
          }}
        >
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
}
