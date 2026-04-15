import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Icon } from '@/components/common/Icon';
import { Avatar } from '@/components/common/Avatar';
import { useMe } from '@/hooks/useUsers';
import { useUI } from '@/stores/ui';
import { useSearch } from '@/hooks/useSearch';

export function TopNav() {
  const nav = useNavigate();
  const { data: me } = useMe();
  const setCreateBoardOpen = useUI((s) => s.setCreateBoardOpen);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const { data: hits = [] } = useSearch({ q, limit: 8, enabled: q.trim().length > 1 });

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    setOpen(false);
    nav(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <header className="flex justify-between items-center w-full px-4 h-12 fixed top-0 z-50 bg-primary shadow-sm">
      <div className="flex items-center gap-4">
        <Link to="/boards" className="text-xl font-black text-white tracking-tight">
          Trello
        </Link>
        <nav className="hidden md:flex gap-4 items-center">
          <Link to="/boards" className="text-white/80 hover:text-white text-sm font-medium">
            Workspaces
          </Link>
          <Link to="/boards" className="text-white/80 hover:text-white text-sm font-medium">
            Recent
          </Link>
          <Link to="/boards" className="text-white/80 hover:text-white text-sm font-medium">
            Starred
          </Link>
          <button
            onClick={() => setCreateBoardOpen(true)}
            className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-sm text-sm font-medium"
          >
            Create
          </button>
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <form
          ref={wrapRef as unknown as React.RefObject<HTMLFormElement>}
          className="relative hidden lg:block"
          onSubmit={submit}
        >
          <input
            type="text"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search"
            className="bg-white/20 border-none rounded-md pl-8 pr-3 py-1 text-sm text-white placeholder-white/70 focus:ring-2 focus:ring-white/50 w-64 outline-none"
          />
          <Icon name="search" size={18} className="absolute left-2 top-1/2 -translate-y-1/2 text-white/80" />
          {open && q.trim().length > 1 && (
            <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-md shadow-popover overflow-hidden max-h-80 overflow-y-auto">
              {hits.length === 0 ? (
                <div className="p-4 text-sm text-on-surface-variant">No matches yet</div>
              ) : (
                hits.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      nav(`/boards/${c.boardId}?card=${c.id}`);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-surface-container-low"
                  >
                    <div className="text-sm text-on-surface font-medium line-clamp-1">{c.title}</div>
                    <div className="text-xs text-on-surface-variant">
                      {c.boardTitle} · {c.listTitle}
                    </div>
                  </button>
                ))
              )}
              <button
                type="submit"
                className="w-full text-left px-3 py-2 border-t border-outline text-sm font-medium text-primary hover:bg-surface-container-low"
              >
                See all results for "{q.trim()}"
              </button>
            </div>
          )}
        </form>
        <button className="text-white/80 hover:text-white" aria-label="Notifications">
          <Icon name="notifications" />
        </button>
        <button className="text-white/80 hover:text-white" aria-label="Help">
          <Icon name="help" />
        </button>
        {me && <Avatar member={me} size={32} ring="ring-2 ring-white/30" />}
      </div>
    </header>
  );
}
