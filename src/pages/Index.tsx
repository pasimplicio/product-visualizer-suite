import React from 'react';
import { WorkflowCanvas } from '@/components/workflow/WorkflowCanvas';
import { Sparkles, Share2, ChevronDown, LogOut, Coins, Sun, Moon, Library } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import { useAuth } from '@/context/auth-context';
import { useLibrary } from '@/context/library-context';
import { LibraryModal } from '@/components/library/LibraryModal';
import { useTheme } from 'next-themes';

const Index = () => {
  const { user, profile, signOut } = useAuth();
  const { openLibrary } = useLibrary();
  const { theme, setTheme } = useTheme();
  const [showMenu, setShowMenu] = React.useState(false);

  return (
    <div className="flex h-screen w-full flex-col bg-background text-foreground overflow-hidden">
      {/* Header */}
      <header className="z-20 flex h-12 items-center justify-between border-b border-border bg-muted/90 px-4 backdrop-blur-xl">
        {/* Left: Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-black tracking-tight text-foreground">
              Product<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">Suite</span>
            </h1>
            <span className="text-[9px] text-muted-foreground font-medium border border-border px-1.5 py-0.5 rounded">
              BETA
            </span>
          </div>
        </div>

        {/* Center: Workflow name (Removido para limpeza) */}

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-accent border border-transparent hover:border-border transition-all"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Credits (Em standby) */}

          {/* Share */}
          <button className="flex items-center gap-1.5 bg-accent border border-border rounded-lg px-3 h-8 text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-accent/80 transition-all">
            <Share2 className="w-3.5 h-3.5" />
            Share
          </button>

          {/* Upgrade */}
          <button className="flex items-center gap-1.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-lg px-3 h-8 text-[10px] font-bold text-white uppercase tracking-wider hover:from-violet-500 hover:to-fuchsia-500 transition-all shadow-lg shadow-violet-500/20">
            Upgrade
          </button>

          {/* User avatar */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-8 h-8 rounded-full overflow-hidden border-2 border-border hover:border-primary/50 transition-all"
            >
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center text-[11px] font-bold">
                  {user?.displayName?.charAt(0) || '?'}
                </div>
              )}
            </button>

            {/* Dropdown */}
            {showMenu && (
              <div className="absolute right-0 top-10 w-48 bg-popover border border-border rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-3 py-2 border-b border-border mb-1">
                  <p className="text-[11px] font-bold text-popover-foreground truncate">{user?.displayName}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                </div>
                {/* Créditos em Standby */}
                <div className="px-3 py-1.5 flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">Gerações</span>
                  <span className="text-[11px] font-bold text-muted-foreground">{profile?.totalGenerations ?? 0}</span>
                </div>
                <div className="border-t border-border mt-1 pt-1">
                  <button
                    onClick={() => { setShowMenu(false); openLibrary(); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-bold text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 transition-all mb-1"
                  >
                    <Library className="w-3.5 h-3.5" />
                    Minha Biblioteca
                  </button>
                  <button
                    onClick={() => { setShowMenu(false); signOut(); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] text-destructive hover:bg-destructive/10 transition-all"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sair
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Canvas */}
      <main className="relative flex-1 overflow-hidden">
        <WorkflowCanvas />
      </main>

      <LibraryModal />
      <Toaster />
    </div>
  );
};

export default Index;
