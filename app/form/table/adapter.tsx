import { ReactNode } from "react";
import { TableShape } from '@/form/schema/table';
import { Table } from '@/form/table/table';
import { TableRenderer } from './renderer';

/**
 * TableShapeAdapter - Server Component
 * Adapts table shapes into React components without client-side functionality
 */
export class TableShapeAdapter {
  static toJSX<T extends TableShape>(
    table: Table<T>,
    shape: T,
    data: any[]
  ): ReactNode {
    // Prepare any data transformations here - all server-side logic

    // Delegate actual rendering to the client component
    return (
      <TableRenderer
        table={table}
        shape={shape}
        data={data}
      />
    );
  }
}
