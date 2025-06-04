import { getCookie } from "cookies-next";
import Link from "next/link";
import React from "react";
import { useQuery } from "react-query";
import {
  useFilters,
  useGlobalFilter,
  usePagination,
  useTable,
} from "react-table";
import { toast } from "@/shadcn/hooks/use-toast";
import { TrashIcon } from "@heroicons/react/20/solid";
import { UserInfoForm } from "../../../../components/UserInfoForm";
import { useUser } from "../../../../store/session";

const fetchUsers = async (token) => {
  const res = await fetch(`/api/v1/users/all`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) return [];
  const json = await res.json();
  return json.users ?? [];
};

function DefaultColumnFilter({
  column: { id, filterValue, setFilter, showFilter = true },
}) {
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

function Table({ columns, data }) {
  const filterTypes = React.useMemo(
    () => ({
      // Add a new fuzzyTextFilterFn filter type.
      // fuzzyText: fuzzyTextFilterFn,
      // Or, override the default text filter to use
      // "startWith"
      text: (rows, id, filterValue) =>
        rows.filter((row) => {
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
              {headerGroups.map((headerGroup) => (
                <tr
                  {...headerGroup.getHeaderGroupProps()}
                  key={headerGroup.headers.map((header) => header.id)}
                >
                  {headerGroup.headers.map((column, idx) =>
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
              {page.map((row, i) => {
                prepareRow(row);
                return (
                  <tr
                    {...row.getRowProps()}
                    key={row.original.id}
                    className="bg-secondary/50"
                  >
                    {row.cells.map((cell, idx) => (
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

export default function UserAuthPanel() {
  const { user } = useUser();
  const token = getCookie("session");

  const {
    data: users,
    status,
    refetch,
  } = useQuery("fetchAuthUsers", () => fetchUsers(token));

  async function deleteUser(id) {
    try {
      await fetch(`/api/v1/auth/user/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((response) => response.json())
        .then(() => {
          toast({
            description: "User deleted successfully!",
          });
          refetch();
        });
    } catch (error) {
      console.log(error);
    }
  }

  const columns = React.useMemo(
    () => [
      {
        Header: "Name",
        accessor: "name",
        width: 10,
        id: "name",
      },
      {
        Header: "Email",
        accessor: "email",
        id: "email",
      },
      {
        Header: "Role",
        showFilter: false,
        accessor: "isAdmin",
        Cell: ({ row, value: isAdmin }) => (isAdmin ? "admin" : "user"),
      },
      {
        Header: "Actions",
        id: "actions",
        Cell: ({ row }) => {
          return (
            <div className="space-x-4 flex flex-row items-center justify-end">
              {user.isAdmin && user.id !== row.original.id && (
                <button
                  type="button"
                  onClick={() => deleteUser(row.original.id)}
                  className="text-sm text-destructive bg-background hover:bg-destructive hover:text-destructive-foreground rounded-md flex items-center justify-center shrink-0 size-8"
                >
                  <TrashIcon className="size-5" />
                </button>
              )}
              {(user.isAdmin || user.id === row.original.id) && (
                <UserInfoForm
                  type="update"
                  user={row.original}
                  refetch={refetch}
                />
              )}
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
            <h1 className="text-3xl font-extrabold text-foreground">Users</h1>
          </div>
          <div className="px-4 sm:px-6 md:px-0">
            <div className="flex flex-col lg:flex-row gap-y-4 lg:items-center lg:justify-between pt-2">
              <p className="mt-2 text-sm text-muted-foreground">
                A list of all internal users of your instance.
              </p>
              <div className="flex flex-row max-sm:flex-wrap gap-2">
                <UserInfoForm refetch={refetch} />
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
                    Error fetching data ...
                  </h2>
                </div>
              )}

              {status === "success" && (
                <div>
                  <div className="hidden sm:block">
                    <Table columns={columns} data={users} />
                  </div>

                  <div className="sm:hidden">
                    {users.map((store) => (
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
                          // DELETE
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

  // return (
  //   <main className="flex-1">
  //     <div className="relative max-w-4xl mx-auto md:px-8 xl:px-0">
  //       <div className="pt-10 pb-16 divide-y-2">
  //         <div className="px-4 sm:px-6 md:px-0">
  //           <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
  //             Internal Users
  //           </h1>
  //         </div>
  //         <div className="px-4 sm:px-6 md:px-0">
  //           <div className="sm:flex sm:items-center">
  //             <div className="sm:flex-auto mt-4">
  //               <p className="mt-2 text-sm text-gray-700  dark:text-white">
  //                 A list of all internal users of your instance.
  //               </p>
  //             </div>
  //             <div className="sm:ml-16 mt-5 sm:flex-none">
  //               <Link
  //                 href="/admin/users/internal/new"
  //                 className="rounded bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
  //               >
  //                 New User
  //               </Link>
  //             </div>
  //           </div>
  //           <div className="py-4">
  //             {status === "loading" && (
  //               <div className="min-h-screen flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8">
  //                 <h2> Loading data ... </h2>
  //               </div>
  //             )}

  //             {status === "error" && (
  //               <div className="min-h-screen flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8">
  //                 <h2 className="text-2xl font-bold">
  //                   {" "}
  //                   Error fetching data ...{" "}
  //                 </h2>
  //               </div>
  //             )}

  //             {status === "success" && (
  //               <div>
  //                 <div className="hidden sm:block">
  //                   <Table columns={columns} data={data.users} />
  //                 </div>
  //                 <div className="sm:hidden">
  //                   {data.users.map((user) => (
  //                     <div
  //                       key={user.id}
  //                       className="flex flex-col text-center bg-white rounded-lg shadow mt-4"
  //                     >
  //                       <div className="flex-1 flex flex-col p-8">
  //                         <h3 className=" text-gray-900 text-sm font-medium">
  //                           {user.name}
  //                         </h3>
  //                         <dl className="mt-1 flex-grow flex flex-col justify-between">
  //                           <dd className="text-gray-500 text-sm">
  //                             {user.email}
  //                           </dd>
  //                           <dt className="sr-only">Role</dt>
  //                           <dd className="mt-3">
  //                             <span className="px-2 py-1 text-green-800 text-xs font-medium bg-green-100 rounded-full">
  //                               {user.isAdmin ? "admin" : "user"}
  //                             </span>
  //                           </dd>
  //                         </dl>
  //                       </div>
  //                       <div className="space-x-4 flex flex-row justify-center -mt-8 mb-4">
  //                         <button
  //                           type="button"
  //                           className="text-sm text-destructive bg-background hover:bg-destructive hover:text-destructive-foreground rounded-md flex items-center justify-center shrink-0 size-8"
  //                         >
  //                           <TrashIcon className="size-5" />
  //                         </button>

  //                         <UpdateUserModal
  //                           user={user}
  //                           refetch={() => handleRefresh}
  //                         />
  //                         <ResetPassword user={user} />
  //                       </div>
  //                     </div>
  //                   ))}
  //                 </div>
  //               </div>
  //             )}
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //   </main>
  // );
}
