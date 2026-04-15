import { Outlet } from 'react-router-dom';
import { TopNav } from './TopNav';
import { SideNav } from './SideNav';
import { CreateBoardDialog } from '@/components/boards/CreateBoardDialog';

export default function AppShell() {
  return (
    <div className="h-full">
      <TopNav />
      <SideNav />
      <main className="pt-12 md:pl-[260px] h-full flex flex-col">
        <Outlet />
      </main>
      <CreateBoardDialog />
    </div>
  );
}
