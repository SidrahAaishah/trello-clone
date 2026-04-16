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
  const mobileNavOpen = useUI((s) => s.mobileNavOpen);
  const setMobileNavOpen = useUI((s) => s.setMobileNavOpen);

  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const { data: hits = [] } = useSearch({ q, limit: 8, enabled: q.trim().length > 1 });

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    if (mobileSearchOpen) {
      setTimeout(() => mobileInputRef.current?.focus(), 50);
    }
  }, [mobileSearchOpen]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    setOpen(false);
    setMobileSearchOpen(false);
    nav(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <>
      <header className="flex justify-between items-center w-full px-3 sm:px-4 h-12 fixed top-0 z-50 bg-primary shadow-sm">
        {/* Left side */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="md:hidden text-white/80 hover:text-white p-1 rounded hover:bg-white/20"
            aria-label="Toggle menu"
          >
            <Icon name={mobileNavOpen ? 'close' : 'menu'} size={22} />
          </button>

          <Link to="/boards" className="text-xl font-black text-white tracking-tight">
            Trello
          </Link>

          {/* Desktop nav links */}
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

        {/* Right side */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Desktop search */}
          <form
            ref={wrapRef as unknown as React.RefObject<HTMLFormElement>}
            className="relative hidden lg:block"
            onSubmit={submit}
          >
            <input
              type="text"
              value={q}
              onChange={(e) => { setQ(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              placeholder="Search"
              className="bg-white/20 border-none rounded-md pl-8 pr-3 py-1 text-sm text-white placeholder-white/70 focus:ring-2 focus:ring-white/50 w-56 xl:w-64 outline-none"
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
                      onClick={() => { setOpen(false); nav(`/boards/${c.boardId}?card=${c.id}`); }}
                      className="w-full text-left px-3 py-2 hover:bg-surface-container-low"
                    >
                      <div className="text-sm text-on-surface font-medium line-clamp-1">{c.title}</div>
                      <div className="text-xs text-on-surface-variant">{c.boardTitle} · {c.listTitle}</div>
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

          {/* Mobile search icon */}
          <button
            onClick={() => setMobileSearchOpen(true)}
            className="lg:hidden text-white/80 hover:text-white p-1 rounded hover:bg-white/20"
            aria-label="Search"
          >
            <Icon name="search" size={22} />
          </button>

          {/* Mobile Create button */}
          <button
            onClick={() => setCreateBoardOpen(true)}
            className="md:hidden text-white/80 hover:text-white p-1 rounded hover:bg-white/20"
            aria-label="Create board"
          >
            <Icon name="add" size={22} />
          </button>

          <button className="hidden sm:block text-white/80 hover:text-white p-1 rounded hover:bg-white/20" aria-label="Notifications">
            <Icon name="notifications" />
          </button>
          <button className="hidden sm:block text-white/80 hover:text-white p-1 rounded hover:bg-white/20" aria-label="Help">
            <Icon name="help" />
          </button>
          {me && <Avatar member={me} size={32} ring="ring-2 ring-white/30" />}
        </div>
      </header>

      {/* Mobile full-screen search overlay */}
      {mobileSearchOpen && (
        <div className="lg:hidden fixed inset-0 z-[60] bg-primary flex flex-col">
          <form onSubmit={submit} className="flex items-center gap-2 px-3 h-12">
            <button
              type="button"
              onClick={() => { setMobileSearchOpen(false); setQ(''); }}
              className="text-white p-1"
              aria-label="Close search"
            >
              <Icon name="arrow_back" size={22} />
            </button>
            <input
              ref={mobileInputRef}
              type="text"
              value={q}
              onChange={(e) => { setQ(e.target.value); setOpen(true); }}
              placeholder="Search cards, boards…"
              className="flex-1 bg-white/20 border-none rounded-md px-3 py-1.5 text-sm text-white placeholder-white/70 outline-none"
            />
            {q && (
              <button type="button" onClick={() => setQ('')} className="text-white/80">
                <Icon name="close" size={18} />
              </button>
            )}
          </form>
          <div className="flex-1 bg-white overflow-y-auto">
            {q.trim().length < 2 ? (
              <div className="p-6 text-sm text-on-surface-variant text-center">Type at least 2 characters</div>
            ) : hits.length === 0 ? (
              <div className="p-6 text-sm text-on-surface-variant text-center">No matches for "{q}"</div>
            ) : (
              hits.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setMobileSearchOpen(false);
                    setQ('');
                    nav(`/boards/${c.boardId}?card=${c.id}`);
                  }}
                  className="w-full text-left px-4 py-3 border-b border-outline hover:bg-surface-container-low"
                >
                  <div className="text-sm text-on-surface font-medium line-clamp-1">{c.title}</div>
                  <div className="text-xs text-on-surface-variant mt-0.5">{c.boardTitle} · {c.listTitle}</div>
                </button>
              ))
            )}
            {q.trim().length >= 2 && (
              <button
                onClick={() => { setMobileSearchOpen(false); nav(`/search?q=${encodeURIComponent(q.trim())}`); }}
                className="w-full text-left px-4 py-3 text-sm font-medium text-primary"
              >
                See all results for "{q.trim()}"
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
