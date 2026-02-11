import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import QuestionPage from './pages/QuestionPage';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import { injectSpeedInsights } from "@vercel/speed-insights";
import { Analytics } from "@vercel/analytics/react"

// 오류 발생 시 전체 에러 로그를 콘솔에 출력
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error || event.message);
});
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

injectSpeedInsights();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/question" element={<QuestionPage />} />
      </Routes>
    </BrowserRouter>
    <Analytics />
  </StrictMode>
);
