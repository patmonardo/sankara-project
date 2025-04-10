//@/form/table/renderer.tsx
import { ReactNode } from "react";
import { TableShape, TableColumn } from "@/form/schema/table";
import { Table } from "@/form/table/table";
import Link from "next/link";
import Search from "@/form/search/search";
import Pagination from "@/form/list/pagination";
import { PlusIcon } from "@heroicons/react/24/outline";

/**
 * TableRenderer
 */
export function TableRenderer<T extends TableShape>({
  table,
  shape,
  data,
}: {
  table: Table<T>;
  shape: T;
  data: any[];
}): ReactNode {
  // Make sure we have layout with defaults
  const layout = shape.layout || {};
  const title = layout.title || "Table";
  const state = shape.state || { status: "idle", page: 1, totalPages: 1 };

  return (
    <div className="flex flex-col w-full">
      {" "}
      {/* Add this container */}
      {/* Header section */}
      <div className="flex w-full items-center justify-between">
        <h1 className="text-2xl">{title}</h1>
        {layout.addButton && (
          <Link
            href={layout.addButton.href || "#"}
            className="btn-primary flex items-center gap-2"
          >
            <span>{layout.addButton.label || "Add New"}</span>
            <PlusIcon className="h-5 w-5" />
          </Link>
        )}
      </div>
      {/* Search */}
      {layout.searchable && (
        <div className="mt-4 mb-8">
          <Search placeholder={`Search ${title.toLowerCase()}...`} />
        </div>
      )}
      {/* Table */}
      <TableComponent table={table} shape={shape} data={data} />
      {/* Pagination */}
      {layout.paginated && state.totalPages > 0 && (
        <div className="mt-5 flex w-full justify-center">
          <Pagination totalPages={state.totalPages} />
        </div>
      )}
    </div>
  );
}

/**
 * Internal component for rendering the actual table
 */
function TableComponent<T extends TableShape>({
  table,
  shape,
  data,
}: {
  table: Table<T>;
  shape: T;
  data: any[];
}) {
  // Safe access to shape properties
  const columns = shape.columns || [];
  const layout = shape.layout || {};
  const actions = shape.actions || [];

  // Handle empty state
  if (data.length === 0) {
    return (
      <div className="mt-6 text-center py-10 bg-gray-50 rounded-md">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  return (
    <div className="mt-6 flow-root">
      <div className="overflow-x-auto">
        <table
          className={`min-w-full divide-y divide-gray-300 ${
            layout.striped ? "table-striped" : ""
          }`}
        >
          {/* Table Header */}
          <thead>
            <tr>
              {columns.map((column, i) => (
                <th
                  key={i}
                  className={`px-3 py-3.5 text-sm font-semibold text-gray-900 ${
                    column.className || "text-left"
                  }`}
                >
                  {column.label}
                </th>
              ))}
              {actions.length > 0 && (
                <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Actions</span>
                </th>
              )}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-gray-200 bg-white">
            {data.map((item, rowIndex) => (
              <tr
                key={rowIndex}
                className={layout.hoverable ? "hover:bg-gray-50" : ""}
              >
                {columns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    className="whitespace-nowrap px-3 py-4 text-sm text-gray-500"
                  >
                    {table.renderCell(column, item)}
                  </td>
                ))}

                {actions.length > 0 && (
                  <td className="whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <div className="flex justify-end gap-3">
                      {table.renderActions(item, actions)}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
