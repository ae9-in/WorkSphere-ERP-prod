import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal/Modal';
import { Input } from '@/components/ui/Input/Input';
import { useUIStore } from '@/store/uiStore';
import { searchService } from '@/services/api.service';
import { MagnifyingGlass, User, CurrencyInr, FileText, ArrowRight } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from '@/components/ui/Badge/Badge';

export function GlobalSearch() {
  const { globalSearchOpen, setGlobalSearchOpen } = useUIStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setGlobalSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setGlobalSearchOpen]);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      setIsLoading(true);
      const res = await searchService.search(query);
      setResults(res);
      setIsLoading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (url: string) => {
    setGlobalSearchOpen(false);
    setQuery('');
    navigate(url);
  };

  return (
    <Modal
      isOpen={globalSearchOpen}
      onClose={() => setGlobalSearchOpen(false)}
      maxWidth="xl"
      showClose={false}
    >
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Input
            autoFocus
            placeholder="Search employees, payroll runs, documents... (CMD + K)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            icon={<MagnifyingGlass size={20} />}
            className="h-12 text-base shadow-sm"
          />
        </div>

        {isLoading && (
          <div className="py-8 text-center text-sm text-ag-ink-3">Searching enterprise records...</div>
        )}

        {!isLoading && results && (
          <div className="max-h-96 overflow-y-auto space-y-4 pr-1 no-scrollbar">
            {results.employees.length > 0 && (
              <div>
                <div className="text-xs font-bold text-ag-ink-3 uppercase tracking-wider mb-2 px-2">
                  EMPLOYEES ({results.employees.length})
                </div>
                <div className="space-y-1">
                  {results.employees.map((emp: any) => (
                    <div
                      key={emp.id}
                      onClick={() => handleSelect(emp.url)}
                      className="ag-search-result-item"
                    >
                      <div className="w-8 h-8 rounded-full bg-ag-primary-light text-ag-primary flex items-center justify-center font-bold text-xs">
                        <User size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-ag-ink truncate">{emp.title}</p>
                        <p className="text-xs text-ag-ink-3 truncate">{emp.subtitle}</p>
                      </div>
                      <StatusBadge status={emp.badge} size="sm" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.payroll.length > 0 && (
              <div>
                <div className="text-xs font-bold text-ag-ink-3 uppercase tracking-wider mb-2 px-2">
                  PAYROLL ({results.payroll.length})
                </div>
                <div className="space-y-1">
                  {results.payroll.map((pay: any) => (
                    <div
                      key={pay.id}
                      onClick={() => handleSelect(pay.url)}
                      className="ag-search-result-item"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#E6FAF4] text-ag-mint flex items-center justify-center">
                        <CurrencyInr size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-ag-ink truncate">{pay.title}</p>
                        <p className="text-xs text-ag-ink-3 truncate">{pay.subtitle}</p>
                      </div>
                      <StatusBadge status={pay.badge} size="sm" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.total === 0 && (
              <div className="py-8 text-center text-sm text-ag-ink-3">
                No matching enterprise records found for "{query}".
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
