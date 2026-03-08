import { ArrowDown, ArrowUp, Download, FileSpreadsheet, Search } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { type IFileElement } from '@chainlit/react-client';

import { useTranslation } from '@/components/i18n/Translator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

type FileElementWithContent = IFileElement & { content?: string };

const DISPLAY_ROW_LIMIT = 368;

interface XLSXData {
  columns: string[];
  rows: (string | number | null)[][];
}

const formatCell = (value: string | number | null): string => {
  if (value == null || value === '') return '';
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return value.toLocaleString();
    return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return String(value);
};

const SpreadsheetGrid = ({ data, t }: { data: XLSXData; t: (key: string, options?: Record<string, unknown>) => string }) => {
  const { columns, rows } = data;
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [filters, setFilters] = useState<Record<number, string>>({});

  // Determine column type once from all rows — consistent alignment per column
  const numericCols = useMemo(() => {
    const result = new Set<number>();
    for (let colIdx = 0; colIdx < columns.length; colIdx++) {
      const allNumeric = rows.every((row) => {
        const v = row[colIdx];
        return v == null || v === '' || typeof v === 'number';
      });
      if (allNumeric) result.add(colIdx);
    }
    return result;
  }, [columns.length, rows]);

  const filteredRows = useMemo(() => {
    const activeFilters = Object.entries(filters)
      .filter(([, v]) => v !== '')
      .map(([k, v]) => [Number(k), v.toLowerCase()] as const);
    if (activeFilters.length === 0) return rows;
    return rows.filter((row) =>
      activeFilters.every(([colIdx, query]) => {
        const cell = row[colIdx];
        if (cell == null) return false;
        return String(cell).toLowerCase().includes(query);
      })
    );
  }, [rows, filters]);

  const sortedRows = useMemo(() => {
    if (sortCol === null) return filteredRows;
    return [...filteredRows].sort((a, b) => {
      const av = a[sortCol];
      const bv = b[sortCol];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortAsc ? av - bv : bv - av;
      }
      const cmp = String(av).localeCompare(String(bv));
      return sortAsc ? cmp : -cmp;
    });
  }, [filteredRows, sortCol, sortAsc]);

  const isLimited = sortedRows.length > DISPLAY_ROW_LIMIT;
  const displayRows = isLimited ? sortedRows.slice(0, DISPLAY_ROW_LIMIT) : sortedRows;

  const handleSort = (colIdx: number) => {
    if (sortCol === colIdx) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(colIdx);
      setSortAsc(true);
    }
  };

  const handleFilter = (colIdx: number, value: string) => {
    setFilters((prev) => ({ ...prev, [colIdx]: value }));
  };

  return (
    <div className="flex flex-col gap-0 h-full">
      {/* Table with vertical scroll only — no horizontal scroll */}
      <div className="overflow-y-auto overflow-x-hidden rounded-md border border-border/60 flex-1 min-h-0">
        <table className="w-full border-separate border-spacing-0 text-xs font-mono table-fixed">
          <thead>
            <tr>
              {/* Row number header — sticky both top and left */}
              <th className="sticky top-0 left-0 z-30 bg-muted w-10 px-2 py-1.5 text-center text-muted-foreground font-semibold border-b border-r border-border/40">
                #
              </th>
              {columns.map((col, i) => (
                <th
                  key={i}
                  onClick={() => handleSort(i)}
                  title={col}
                  className="sticky top-0 z-10 bg-muted px-3 py-1.5 text-left font-semibold text-card-foreground border-b border-border/40 cursor-pointer select-none hover:bg-accent"
                >
                  <div className="flex items-center gap-1">
                    <span className="truncate">{col}</span>
                    {sortCol === i ? (
                      sortAsc
                        ? <ArrowUp className="h-3 w-3 text-primary shrink-0" />
                        : <ArrowDown className="h-3 w-3 text-primary shrink-0" />
                    ) : (
                      <ArrowUp className="h-3 w-3 text-muted-foreground/30 shrink-0" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
            {/* Per-column filter row — sticky below header row */}
            <tr>
              <th className="sticky top-[30px] left-0 z-30 bg-muted border-b border-r border-border/40" />
              {columns.map((_, i) => (
                <th key={i} className="sticky top-[30px] z-10 bg-muted px-1.5 py-1 border-b border-border/40">
                  <div className="relative flex items-center">
                    <Search className="absolute left-1.5 h-3 w-3 text-muted-foreground/50 pointer-events-none" />
                    <input
                      type="text"
                      value={filters[i] || ''}
                      onChange={(e) => handleFilter(i, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full pl-6 pr-1.5 py-0.5 text-xs font-normal rounded border border-border/40 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, rowIdx) => {
              const striped = rowIdx % 2 === 1;
              return (
                <tr
                  key={rowIdx}
                  className={`${striped ? 'bg-muted/30' : ''} hover:bg-primary/5 transition-colors`}
                >
                  {/* Row number */}
                  <td className="sticky left-0 z-10 w-10 px-2 py-1 text-center text-muted-foreground border-r border-border/40 bg-background font-normal tabular-nums">
                    {rowIdx + 1}
                  </td>
                  {columns.map((_, colIdx) => {
                    const value = row[colIdx];
                    const numeric = numericCols.has(colIdx);
                    return (
                      <td
                        key={colIdx}
                        className={`px-3 py-1 border-b border-border/20 overflow-hidden text-ellipsis whitespace-nowrap ${numeric ? 'text-right tabular-nums' : 'text-left'
                          }`}
                      >
                        {formatCell(value)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {displayRows.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  {t('elements.xlsx.noData')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const parseCsvToXlsxData = (csv: string): XLSXData => {
  const workbook = XLSX.read(csv, { type: 'string' });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonRows: (string | number | null)[][] = XLSX.utils.sheet_to_json(
    firstSheet,
    { header: 1 }
  );
  if (jsonRows.length === 0) return { columns: [], rows: [] };
  const columns = (jsonRows[0] as (string | number)[]).map(String);
  const rows = jsonRows.slice(1);
  return { columns, rows };
};

const XLSXFileElement = ({ element }: { element: IFileElement }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [xlsxData, setXlsxData] = useState<XLSXData | null>(null);

  const elementContent = (element as FileElementWithContent).content;
  const totalRows = (element as unknown as { props?: { totalRows?: number } }).props?.totalRows;
  const triggerRef = useRef<HTMLDivElement>(null);
  const [dialogLeft, setDialogLeft] = useState<string>('50%');
  const [dialogWidth, setDialogWidth] = useState<string>('100%');

  const ensureData = useCallback(async (): Promise<XLSXData | null> => {
    if (xlsxData) return xlsxData;

    // Same pattern as SQLFileElement: use inlined content first
    if (elementContent) {
      const parsed = parseCsvToXlsxData(elementContent);
      setXlsxData(parsed);
      return parsed;
    }

    // Fallback: fetch from URL
    if (!element.url) return null;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(element.url);
      if (!response.ok) {
        throw new Error(t('elements.xlsx.fetchError', { status: response.status, statusText: response.statusText }));
      }
      const text = await response.text();
      const parsed = parseCsvToXlsxData(text);
      setXlsxData(parsed);
      return parsed;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [element.url, elementContent, xlsxData, t]);

  const handleView = useCallback(async () => {
    if (triggerRef.current) {
      const chatPanel = triggerRef.current.closest('[data-panel]') as HTMLElement | null;
      if (chatPanel) {
        const rect = chatPanel.getBoundingClientRect();
        setDialogLeft(`${rect.left + rect.width / 2}px`);
        setDialogWidth(`${rect.width * 0.9}px`);
      }
    }
    setOpen(true);
    await ensureData();
  }, [ensureData]);

  const handleDownload = useCallback(async () => {
    const data = await ensureData();
    if (!data) return;
    const ws = XLSX.utils.aoa_to_sheet([data.columns, ...data.rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const downloadName = element.name.endsWith('.xlsx')
      ? element.name
      : `${element.name.replace(/\.[^.]+$/, '')}.xlsx`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = downloadName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [ensureData, element.name]);

  return (
    <>
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div ref={triggerRef} className="inline-flex items-center h-[32px] rounded-full border border-border/80 bg-secondary/50 overflow-hidden">
              {/* View button */}
              <button
                type="button"
                onClick={handleView}
                className="flex items-center gap-1 pl-3 pr-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer transition-colors duration-150"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-green-600" />
              </button>
              {/* Divider */}
              <div className="w-px h-4 bg-border/60" />
              {/* Download button */}
              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-1 px-2 pr-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer transition-colors duration-150"
              >
                <Download className="h-3 w-3" />
              </button>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{element.name}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-none h-[85vh] p-0 gap-0 overflow-hidden border-border/80 bg-card shadow-xl [&>button]:hidden flex flex-col" style={{ width: dialogWidth, left: dialogLeft }}>
          <DialogHeader className="flex flex-row items-center justify-between px-5 pt-4 pb-2 shrink-0">
            <DialogTitle className="flex items-center gap-2.5 text-sm font-semibold text-card-foreground">
              {totalRows && totalRows > DISPLAY_ROW_LIMIT ? (
                <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                  {t('elements.xlsx.rowLimitReached', { limit: DISPLAY_ROW_LIMIT, total: totalRows })}
                </span>
              ) : null}
            </DialogTitle>
            <button
              type="button"
              onClick={handleDownload}
              disabled={!xlsxData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-green-50 hover:bg-green-100 dark:bg-green-950 dark:hover:bg-green-900 text-green-700 dark:text-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
            >
              <Download className="h-3.5 w-3.5" />
              {t('elements.xlsx.download')}
            </button>
          </DialogHeader>
          <div className="px-5 pb-5 flex-1 min-h-0 flex flex-col">
            {isLoading ? (
              <Skeleton className="flex-1 w-full rounded-[var(--radius)]" />
            ) : error ? (
              <div className="text-sm text-destructive p-4">{error}</div>
            ) : xlsxData ? (
              <SpreadsheetGrid data={xlsxData} t={t} />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export { XLSXFileElement };
