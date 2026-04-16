import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from '@/components/layout/AppShell';
import BoardsHome from '@/routes/BoardsHome';
import BoardPage from '@/routes/BoardPage';
import SearchResultsPage from '@/routes/SearchResultsPage';
import TemplatesPage from '@/routes/TemplatesPage';
import NotFoundPage from '@/routes/NotFoundPage';

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/boards" replace />} />
        <Route path="/boards" element={<BoardsHome />} />
        <Route path="/boards/:boardId" element={<BoardPage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="/search" element={<SearchResultsPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
