import React from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "react-query";
import { useRouter } from "next/router";
import { getCookie } from "cookies-next";
import { toast } from "@/shadcn/hooks/use-toast";
import {
  useFilters,
  useGlobalFilter,
  usePagination,
  useTable,
} from "react-table";
import { StoreInfoForm } from "../../../../components/StoreInfoForm";

const fetchAllClientStores = async (clientId) => {
  const res = await fetch(`/api/v1/clients/${clientId}/stores`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getCookie("session")}`,
    },
  });
  const json = await res.json();
  return json?.stores || [];
};

function DefaultColumnFilter({
  column: { id, filterValue, setFilter, showFilter = true },
}: any) {
  if (!showFilter) return null;

  return (
    <input
      type="text"
      id={`filter-${id}`}
      className="shadow-sm bg-background ring-1 border-0 ring-border focus:outline-none focus:ring-primary focus:ring-2 block w-full sm:text-sm rounded-md mt-2"
      value={filterValue || ""}
      onChange={(e) => {
        setFilter(e.target.value || undefined); // Set undefined to remove the filter entirely
      }}
      placeholder="Type to filter"
    />
  );
}

function Table({ columns, data }: any) {
  const filterTypes = React.useMemo(
    () => ({
      // Add a new fuzzyTextFilterFn filter type.
      // fuzzyText: fuzzyTextFilterFn,
      // Or, override the default text filter to use
      // "startWith"
      text: (rows: any, id: any, filterValue: any) =>
        rows.filter((row: any) => {
          const rowValue = row.values[id];
          return rowValue !== undefined
            ? String(rowValue)
                .toLowerCase()
                .startsWith(String(filterValue).toLowerCase())
            : true;
        }),
    }),
    [],
  );

  const defaultColumn = React.useMemo(
    () => ({
      // Let's set up our default Filter UI
      Filter: DefaultColumnFilter,
    }),
    [],
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    //@ts-expect-error
    page,
    prepareRow,
    //@ts-expect-error
    canPreviousPage,
    //@ts-expect-error
    canNextPage,
    //@ts-expect-error
    pageCount,
    //@ts-expect-error
    gotoPage,
    //@ts-expect-error
    nextPage,
    //@ts-expect-error
    previousPage,
    //@ts-expect-error
    setPageSize,
    //@ts-expect-error
    state: { pageIndex, pageSize },
  } = useTable(
    {
      columns,
      data,
      //@ts-expect-error
      defaultColumn, // Be sure to pass the defaultColumn option
      filterTypes,
      initialState: {
        //@ts-expect-error
        pageIndex: 0,
      },
    },
    useFilters, // useFilters!
    useGlobalFilter,
    usePagination,
  );

  return (
    <div className="overflow-x-auto md:-mx-6 lg:-mx-8">
      <div className="py-2 align-middle inline-block min-w-full md:px-6 lg:px-8">
        <div className="shadow overflow-hidden border-b border-background md:rounded-lg">
          <table
            {...getTableProps()}
            className="min-w-full divide-y divide-muted-foreground/20"
          >
            <thead className="bg-secondary">
              {headerGroups.map((headerGroup: any) => (
                <tr
                  {...headerGroup.getHeaderGroupProps()}
                  key={headerGroup.headers.map((header: any) => header.id)}
                >
                  {headerGroup.headers.map((column: any, idx) =>
                    column.hideHeader === false ? null : (
                      <th
                        {...column.getHeaderProps()}
                        key={idx}
                        className="px-6 py-3 text-left text-xs font-medium text-foreground/75 uppercase tracking-wider"
                      >
                        {column.canFilter ? (
                          <>
                            <label htmlFor={`filter-${column.id}`}>
                              {column.render("Header")}
                            </label>
                            <div>{column.render("Filter")}</div>
                          </>
                        ) : (
                          <>{column.render("Header")}</>
                        )}
                      </th>
                    ),
                  )}
                </tr>
              ))}
            </thead>
            <tbody {...getTableBodyProps()}>
              {page.map((row: any, i: any) => {
                prepareRow(row);
                return (
                  <tr
                    {...row.getRowProps()}
                    key={row.original.id}
                    className="bg-secondary/50"
                  >
                    {row.cells.map((cell: any, idx) => (
                      <td
                        {...cell.getCellProps()}
                        key={idx}
                        className="px-6 py-2 whitespace-nowrap text-sm font-medium text-foreground/75"
                      >
                        {cell.render("Cell")}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {data.length > 10 && (
            <nav
              className="bg-secondary px-4 py-3 flex items-center justify-between border-t border-border sm:px-6"
              aria-label="Pagination"
            >
              <div className="hidden sm:block">
                <div className="flex flex-row flex-nowrap w-full space-x-2">
                  <p className="block text-sm font-medium text-muted-foreground mt-4">
                    Show
                  </p>
                  <select
                    id="location"
                    name="location"
                    className="block w-full pl-3 pr-10 text-sm bg-background text-foreground ring-1 ring-border border-none focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm rounded-md"
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                    }}
                  >
                    {[10, 20, 30, 40, 50].map((pageSize) => (
                      <option key={pageSize} value={pageSize}>
                        {pageSize}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex-1 flex justify-between sm:justify-end">
                <button
                  className="relative inline-flex items-center px-4 py-2 text-sm bg-background hover:bg-background/85 text-foreground ring-1 ring-border border-none focus:outline-none focus:ring-2 focus:ring-primary rounded-md disabled:cursor-not-allowed"
                  type="button"
                  onClick={() => previousPage()}
                  disabled={!canPreviousPage}
                >
                  Previous
                </button>
                <button
                  className="ms-3 relative inline-flex items-center px-4 py-2 text-sm bg-background hover:bg-background/85 text-foreground ring-1 ring-border border-none focus:outline-none focus:ring-2 focus:ring-primary rounded-md disabled:cursor-not-allowed"
                  type="button"
                  onClick={() => nextPage()}
                  disabled={!canNextPage}
                >
                  Next
                </button>
              </div>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ClientStoresPage() {
  const router = useRouter();
  const clientId = router.query.clientId as string;

  const {
    data: stores,
    status,
    refetch,
  } = useQuery({
    enabled: !!clientId,
    queryKey: ["fetchAllClientStores", clientId],
    queryFn: () => fetchAllClientStores(clientId),
  });

  const deleteStore = async (clientId: string, storeId: string) => {
    try {
      const res = await fetch(`/api/v1/clients/${clientId}/stores/${storeId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getCookie("session")}`,
        },
      });

      if (!res.ok) throw "";

      toast({
        title: "Store deleted",
        description: "Store deleted successfully!",
      });
    } catch {
      toast({
        title: "Oops!",
        variant: "destructive",
        description: "Something went wrong while trying to delete store.",
      });
    } finally {
      refetch();
    }
  };

  const columns = React.useMemo(
    () => [
      {
        Header: "Store Name",
        accessor: "name",
        width: 10,
        id: "store_name",
      },
      {
        Header: "Address",
        accessor: "address",
        id: "address",
        showFilter: false,
      },
      {
        Header: "Manager Name",
        accessor: "manager",
        id: "manager",
        showFilter: false,
      },
      {
        Header: "Actions",
        id: "actions",
        Cell: ({ row, value }: any) => {
          return (
            <div className="space-x-4 flex flex-row">
              <StoreInfoForm
                refetch={refetch}
                clientId={row.original.clientId}
                store={row.original}
                type="update"
              />
              <button
                type="button"
                onClick={() =>
                  deleteStore(row.original.clientId, row.original.id)
                }
                className="rounded bg-destructive text-destructive-foreground hover:bg-destructive/85 px-2.5 py-1.5 text-xs font-semibold shadow-sm ring-1 ring-inset ring-destructive"
              >
                Delete
              </button>
            </div>
          );
        },
      },
    ],
    [],
  );

  return (
    <main className="flex-1">
      <div className="relative max-w-4xl mx-auto md:px-8 xl:px-0">
        <div className="pt-10 pb-16 divide-y-2">
          <div className="px-4 sm:px-6 md:px-0">
            <h1 className="text-3xl font-extrabold text-foreground">Stores</h1>
          </div>
          <div className="px-4 sm:px-6 md:px-0">
            <div className="sm:flex sm:items-center">
              <div className="sm:flex-auto mt-4">
                <p className="mt-2 text-sm text-muted-foreground">
                  A list of all stores available for this client.
                </p>
              </div>
              <div className="sm:ml-16 mt-5 flex flex-row space-x-2">
                <Link
                  href={`/submit`}
                  type="button"
                  className="inline-flex items-center px-2.5 py-1.5 border font-semibold border-border shadow-sm text-xs rounded bg-muted hover:bg-muted/85 hover:text-foreground text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                >
                  Guest Ticket Url
                </Link>
                <Link
                  href={`/auth/register`}
                  type="button"
                  className="inline-flex items-center px-2.5 py-1.5 border font-semibold border-border shadow-sm text-xs rounded bg-muted hover:bg-muted/85 hover:text-foreground text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                >
                  Portal Register
                </Link>

                <StoreInfoForm refetch={refetch} clientId={clientId} />
              </div>
            </div>

            <div className="py-4">
              {status === "loading" && (
                <div className="min-h-screen flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8">
                  <h2> Loading data ... </h2>
                </div>
              )}

              {status === "error" && (
                <div className="min-h-screen flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8">
                  <h2 className="text-2xl font-bold">
                    {" "}
                    Error fetching data ...{" "}
                  </h2>
                </div>
              )}

              {status === "success" && (
                <div>
                  <div className="hidden sm:block">
                    <Table columns={columns} data={stores} />
                  </div>

                  <div className="sm:hidden">
                    {stores.map((store: any) => (
                      <div
                        key={store.id}
                        className="flex flex-col text-center bg-muted rounded-lg shadow mt-4"
                      >
                        <div className="flex-1 flex flex-col p-8">
                          <h3 className=" text-foreground text-sm font-medium">
                            {store.name}
                          </h3>
                          <dl className="mt-1 flex-grow flex flex-col justify-between">
                            <dd className="text-muted-foreground text-sm">
                              {store.phone}
                            </dd>
                            <dd className="text-muted-foreground text-sm">
                              {store.email}
                            </dd>
                            <dt className="sr-only">Manager</dt>
                            <dd className="font-medium text-muted-foreground text-sm mt-2">
                              <span>Manager - {store.manager}</span>
                            </dd>
                          </dl>
                        </div>
                        <div className="space-x-4 align-middle flex flex-row justify-center -mt-4 mb-4">
                          <button
                            type="button"
                            className="rounded bg-destructive text-destructive-foreground hover:bg-destructive/85 px-2.5 py-1.5 text-xs font-semibold shadow-sm ring-1 ring-inset ring-destructive"
                            onClick={() => deleteStore(clientId, store.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
