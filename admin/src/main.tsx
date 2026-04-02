import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import App from './App';

const customTheme = {
  token: {
    colorPrimary: '#6366f1',
    borderRadius: 8,
    colorBgContainer: '#ffffff',
    colorBgLayout: '#f1f5f9',
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  components: {
    Menu: {
      darkItemBg: '#0f172a',
      darkSubMenuItemBg: '#0f172a',
      darkItemSelectedBg: 'rgba(99, 102, 241, 0.25)',
      darkItemHoverBg: 'rgba(99, 102, 241, 0.15)',
      darkItemColor: 'rgba(255, 255, 255, 0.65)',
      darkItemSelectedColor: '#a5b4fc',
    },
    Button: {
      primaryShadow: '0 2px 8px rgba(99, 102, 241, 0.35)',
    },
    Card: {
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
      boxShadowTertiary: '0 1px 3px rgba(0, 0, 0, 0.04)',
    },
    Table: {
      headerBg: '#f8fafc',
      headerColor: '#475569',
    },
    Input: {
      activeBorderColor: '#6366f1',
      hoverBorderColor: '#818cf8',
    },
  },
};

const globalStyles = document.createElement('style');
globalStyles.textContent = `
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: #f1f5f9;
    -webkit-font-smoothing: antialiased;
  }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
  .ant-table-row { cursor: default; }
  .ant-card { transition: box-shadow 0.2s ease; }
  .ant-card:hover { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08) !important; }
`;
document.head.appendChild(globalStyles);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider locale={ruRU} theme={customTheme}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConfigProvider>
  </React.StrictMode>,
);
