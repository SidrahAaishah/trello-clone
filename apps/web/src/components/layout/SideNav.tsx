import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { Icon } from '@/components/common/Icon';
import { useBoards } from '@/hooks/useBoards';
import { useUI } from '@/stores/ui';

export function SideNav() {
  const { data: boards = [] } = useBoards();
  const starred = boards.filter((b) => b.starred);
  const mobileNavOpen = useUI((s) => s.mobileNavOpen);
  const setMobileNavOpen = useUI((s) => s.setMobileNavOpen);
  const location = useLocation();

  // Close mobile nav on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname, location.search, setMobileNavOpen]);

  const navContent = (
    <>
      <div className="flex items-center gap-3 px-3 py-2 mb-4">
        <div className="w-8 h-8 bg-primary-container rounded flex items-center justify-center text-white font-bold">
          W
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-on-surface">My Workspace</span>
          <span className="text-xs text-on-surface-variant">Free Plan</span>
        </div>
      </div>

      <nav className="flex-grow">
        <NavItem to="/boards" icon="dashboard" label="Boards" onClick={() => setMobileNavOpen(false)} />
        <NavItem to="/templates" icon="dashboard_customize" label="Templates" onClick={() => setMobileNavOpen(false)} />
        <NavItem to="/boards" icon="home" label="Home" onClick={() => setMobileNavOpen(false)} />

        {starred.length > 0 && (
          <div className="mt-6">
            <div className="px-3 text-[11px] font-bold uppercase tracking-wide text-on-surface-variant">
              Starred
            </div>
            <div className="mt-1">
              {starred.slice(0, 8).map((b) => (
                <NavLink
                  key={b.id}
                  to={`/boards/${b.id}`}
                  onClick={() => setMobileNavOpen(false)}
                  className={({ isActive }) =>
                    clsx(
                      'px-3 py-2 my-0.5 flex items-center gap-3 rounded-md transition-colors text-sm',
                      isActive
                        ? 'bg-blue-50 text-primary font-semibold'
                        : 'text-on-surface hover:bg-surface-container-low',
                    )
                  }
                >
                  <span
                    className="w-5 h-5 rounded flex-shrink-0"
                    style={{
                      backgroundColor:
                        b.background.type === 'color' ? b.background.value : undefined,
                      backgroundImage:
                        b.background.type === 'image'
                          ? `url(${b.background.value})`
                          : b.background.type === 'gradient'
                            ? b.background.value
                            : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                  <span className="truncate">{b.title}</span>
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </nav>

      <div className="mt-auto border-t border-outline pt-4">
        <NavItem to="/boards" icon="settings" label="Settings" onClick={() => setMobileNavOpen(false)} />
        <NavItem to="/boards" icon="group" label="Members" onClick={() => setMobileNavOpen(false)} />
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar — always visible on md+ */}
      <aside className="fixed left-0 top-12 bottom-0 w-[260px] hidden md:flex flex-col p-3 border-r border-outline bg-white z-40 overflow-y-auto">
        {navContent}
      </aside>

      {/* Mobile backdrop */}
      {mobileNavOpen && (
        <div
          className="md:hidden fixed inset-0 z-[45] bg-black/40"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile slide-in drawer */}
      <aside
        className={clsx(
          'md:hidden fixed left-0 top-12 bottom-0 w-[280px] flex flex-col p-3 border-r border-outline bg-white z-[46] overflow-y-auto transition-transform duration-300',
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {navContent}
      </aside>
    </>
  );
}

function NavItem({
  to,
  icon,
  label,
  onClick,
}: {
  to: string;
  icon: string;
  label: string;
  onClick?: () => void;
}) {
  return (
    <NavLink
      to={to}
      end
      onClick={onClick}
      className={({ isActive }) =>
        clsx(
          'px-3 py-2 my-1 flex items-center gap-3 rounded-md transition-colors text-sm',
          isActive
            ? 'bg-blue-50 text-primary font-semibold'
            : 'text-on-surface hover:bg-surface-container-low',
        )
      }
    >
      <Icon name={icon} size={20} />
      <span>{label}</span>
    </NavLink>
  );
}
