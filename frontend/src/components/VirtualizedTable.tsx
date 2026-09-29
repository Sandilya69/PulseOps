"use client";

import { List as ReactWindowList, Grid as ReactWindowGrid } from 'react-window';
import { memo, ReactNode, useCallback, useMemo } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const List = ReactWindowList as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Grid = ReactWindowGrid as any;

interface Column<T> {
  key: string;
  header: string;
  width: number | 'auto';
  render: (row: T, index: number) => ReactNode;
  align?: 'left' | 'center' | 'right';
}

interface VirtualizedTableProps<T> {
  data: T[];
  columns: Column<T>[];
  height?: number;
  rowHeight?: number;
  width?: number | string;
  overscanCount?: number;
  emptyMessage?: string;
  loading?: boolean;
  loadingHeight?: number;
  className?: string;
  onRowClick?: (row: T, index: number) => void;
}

function VirtualizedTableRow<T>({
  index,
  style,
  data,
  columns,
  onRowClick,
}: {
  index: number;
  style: React.CSSProperties;
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T, index: number) => void;
}) {
  const row = data[index];
  const handleClick = useCallback(() => {
    if (onRowClick && row) {
      onRowClick(row, index);
    }
  }, [onRowClick, row, index]);

  return (
    <div
      style={style}
      className="flex items-center border-b border-[#334155]/50 hover:bg-[#334155]/30 transition-colors cursor-pointer"
      onClick={handleClick}
      role="row"
    >
      {columns.map((col) => (
        <div
          key={col.key}
          style={{
            width: col.width,
            flex: col.width === 'auto' ? 1 : 0,
            textAlign: col.align || 'left',
            padding: '0 16px',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
          }}
        >
          {col.render(row, index)}
        </div>
      ))}
    </div>
  );
}

function VirtualizedTableHeader<T>({ columns }: { columns: Column<T>[] }) {
  return (
    <div className="flex border-b border-[#334155] bg-[#0c0f1d]/50">
      {columns.map((col) => (
        <div
          key={col.key}
          style={{
            width: col.width,
            flex: col.width === 'auto' ? 1 : 0,
            textAlign: col.align || 'left',
            padding: '0 16px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#64748b',
          }}
        >
          {col.header}
        </div>
      ))}
    </div>
  );
}

export function VirtualizedTable<T>({
  data,
  columns,
  height = 600,
  rowHeight = 48,
  width = '100%',
  overscanCount = 5,
  emptyMessage = 'No data available',
  loading = false,
  loadingHeight = 600,
  className = '',
  onRowClick,
}: VirtualizedTableProps<T>) {
  const totalWidth = useMemo(
    () => columns.reduce((sum, col) => sum + (col.width === 'auto' ? 0 : col.width), 0),
    [columns]
  );

  const hasAutoWidth = columns.some((col) => col.width === 'auto');

  if (loading) {
    return (
      <div className={`bg-[#1e293b]/50 rounded-2xl border border-[#334155] ${className}`} style={{ height: loadingHeight }}>
        <div className="flex items-center justify-center h-full">
          <div className="w-8 h-8 border-2 border-[#06b6d4] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={`bg-[#1e293b]/50 rounded-2xl border border-[#334155] ${className}`} style={{ height }}>
        <div className="flex flex-col items-center justify-center h-full text-[#64748b]">
          <div className="w-12 h-12 text-[#334155] mb-4" />
          <p className="text-lg font-medium text-[#94a3b8]">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  const Row = memo(({ index, style, data, columns, onRowClick }: { index: number; style: React.CSSProperties; data: T[]; columns: Column<T>[]; onRowClick?: (row: T, index: number) => void }) => (
    <VirtualizedTableRow index={index} style={style} data={data} columns={columns} onRowClick={onRowClick} />
  ));
  Row.displayName = 'VirtualizedTableRowWrapper';

  return (
    <div className={`bg-[#1e293b]/50 rounded-2xl border border-[#334155] overflow-hidden ${className}`} style={{ height }}>
      <VirtualizedTableHeader columns={columns} />
      <div style={{ height: `calc(100% - 40px)`, overflow: 'auto' }}>
        <List
          defaultHeight={height - 40}
          itemCount={data.length}
          itemSize={rowHeight}
          width={hasAutoWidth ? '100%' : totalWidth}
          overscanCount={overscanCount}
          itemData={{ data, columns, onRowClick }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          rowComponent={Row as any}
        >
          {((props: { index: number; style: React.CSSProperties }) => (
            <Row index={props.index} style={props.style} data={data} columns={columns} onRowClick={onRowClick} />
          )) as unknown as React.ReactNode}
        </List>
      </div>
    </div>
  );
}

interface VirtualizedGridProps<T> {
  data: T[];
  columns: Column<T>[];
  height: number;
  rowHeight: number;
  columnWidth: number;
  columnCount: number;
  overscanCount?: number;
  emptyMessage?: string;
  loading?: boolean;
  className?: string;
}

export function VirtualizedGrid<T>({
  data,
  columns,
  height,
  rowHeight,
  columnWidth,
  columnCount,
  overscanCount = 5,
  emptyMessage = 'No data available',
  loading = false,
  className = '',
}: VirtualizedGridProps<T>) {
  if (loading) {
    return (
      <div className={`bg-[#1e293b]/50 rounded-2xl border border-[#334155] ${className}`} style={{ height }}>
        <div className="flex items-center justify-center h-full">
          <div className="w-8 h-8 border-2 border-[#06b6d4] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={`bg-[#1e293b]/50 rounded-2xl border border-[#334155] ${className}`} style={{ height }}>
        <div className="flex flex-col items-center justify-center h-full text-[#64748b]">
          <div className="w-12 h-12 text-[#334155] mb-4" />
          <p className="text-lg font-medium text-[#94a3b8]">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  const Cell = memo(({ 
    columnIndex, 
    rowIndex, 
    style,
    data,
    columns
  }: { 
    columnIndex: number; 
    rowIndex: number; 
    style: React.CSSProperties;
    data: T[];
    columns: Column<T>[];
  }) => {
    const row = data[rowIndex];
    const col = columns[columnIndex];
    return (
      <div
        style={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          borderRight: columnIndex < columnCount - 1 ? '1px solid rgba(51, 65, 85, 0.5)' : 'none',
          borderBottom: '1px solid rgba(51, 65, 85, 0.3)',
        }}
      >
        {col.render(row, rowIndex)}
      </div>
    );
  });
  Cell.displayName = 'VirtualizedGridCell';

  return (
    <div className={`bg-[#1e293b]/50 rounded-2xl border border-[#334155] ${className}`} style={{ height }}>
      <Grid
        height={height}
        width={columnWidth * columnCount}
        columnCount={columnCount}
        columnWidth={columnWidth}
        rowCount={data.length}
        rowHeight={rowHeight}
        overscanCount={overscanCount}
        cellComponent={Cell}
      >
        {((props: { columnIndex: number; rowIndex: number; style: React.CSSProperties }) => (
          <Cell columnIndex={props.columnIndex} rowIndex={props.rowIndex} style={props.style} data={data} columns={columns} />
        )) as unknown as React.ReactNode}
      </Grid>
    </div>
  );
}

export function createColumn<T>(
  key: string,
  header: string,
  render: (row: T, index: number) => ReactNode,
  width: number,
  align: 'left' | 'center' | 'right' = 'left'
): Column<T> {
  return { key, header, width, render, align };
}

export function autoWidthColumn<T>(
  key: string,
  header: string,
  render: (row: T, index: number) => ReactNode
): Column<T> {
  return { key, header, width: 'auto', render };
}