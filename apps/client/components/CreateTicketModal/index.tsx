import * as z from "zod";
import React from "react";
import { twJoin } from "tailwind-merge";
import { useQuery, useQueryClient } from "react-query";
import { getCookie } from "cookies-next";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Dialog, Listbox, Transition, Combobox } from "@headlessui/react";
import { toast } from "@/shadcn/hooks/use-toast";
import dynamic from "next/dynamic";

import {
  XMarkIcon,
  CheckIcon,
  ChevronUpDownIcon,
  ArrowPathIcon,
  UserMinusIcon,
} from "@heroicons/react/20/solid";
import { useRouter } from "next/router";
import { useUser } from "../../store/session";

const Editor = dynamic(() => import("../BlockEditor"), { ssr: false });

// Priority and Type
const ISSUE_TYPES = [
  { id: 5, name: "Incident" },
  { id: 1, name: "Service" },
  { id: 2, name: "Feature" },
  { id: 3, name: "Bug" },
  { id: 4, name: "Maintenance" },
  { id: 6, name: "Access" },
  { id: 8, name: "Feedback" },
];

const PRIORITIES = [
  { id: 7, name: "Low" },
  { id: 8, name: "Medium" },
  { id: 9, name: "High" },
];

// Zod schema
const requiredString = (message: string) =>
  z.string({ message }).trim().min(1, message);

export const TicketSchema = z.object({
  name: requiredString("Please provide your name."),
  email: requiredString("Please provide your email address.").email(
    "Please provide a valid email address.",
  ),
  detail: z.any().optional(),
  title: requiredString("Please provide a subject of your issue."),

  engineer: z.string().optional(),

  company: requiredString("Please select a company."),
  store: requiredString("Please select a store."),
  type: requiredString("Please select an issue type."),
  priority: requiredString("Please select a priority."),
});

type TicketFormData = z.infer<typeof TicketSchema>;

// API functions
const fetchAllCompanies = async () => {
  const res = await fetch(`/api/v1/clients/all`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getCookie("session")}`,
    },
  });

  if (!res.ok) return [];
  const json = await res.json();

  if (!json?.clients) return [];
  return json.clients.map((client) => ({ id: client.id, name: client.name }));
};

const fetchAllStores = async (clientId: string) => {
  const res = await fetch(`/api/v1/clients/${clientId}/stores`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getCookie("session")}`,
    },
  });
  if (!res.ok) return [];
  const json = await res.json();

  if (!json?.stores) return [];
  return json.stores.map((store) => ({ id: store.id, name: store.name }));
};

async function fetchAllEngineers() {
  const res = await fetch(`/api/v1/users/all`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getCookie("session")}`,
    },
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json?.users || [];
}

export default function CreateTicketModal({ keypress, setKeyPressDown }) {
  const router = useRouter();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);

  const [storeQuery, setStoreQuery] = React.useState("");
  const [companyQuery, setCompanyQuery] = React.useState("");
  const [engineerQuery, setEngineerQuery] = React.useState("");

  const {
    watch,
    register,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<TicketFormData>({
    mode: "onChange",
    resolver: zodResolver(TicketSchema),
  });

  const values = watch();

  const { data: allCompanies, isLoading: isCompanyLoading } = useQuery({
    queryFn: fetchAllCompanies,
    queryKey: ["fetchAllCompanies"],
  });

  const { data: allEngineers, isLoading: isEngineersLoading } = useQuery({
    queryFn: fetchAllEngineers,
    queryKey: ["fetchAllEngineers"],
  });

  const { data: allStores, isLoading: isStoresLoading } = useQuery({
    enabled: !!values.company,
    queryKey: ["fetchAllStores", values.company],
    queryFn: () => fetchAllStores(values.company),
  });

  const filteredCompanies = React.useMemo(() => {
    return !companyQuery.trim()
      ? allCompanies
      : allCompanies?.filter((e) => {
          return e.name
            .toLowerCase()
            .replaceAll(" ", "")
            .includes(companyQuery.toLowerCase().replaceAll(" ", ""));
        });
  }, [companyQuery, allCompanies]);

  const filteredStores = React.useMemo(() => {
    return !storeQuery.trim()
      ? allStores
      : allStores?.filter((e) => {
          return e.name
            .toLowerCase()
            .replaceAll(" ", "")
            .includes(storeQuery.toLowerCase().replaceAll(" ", ""));
        });
  }, [storeQuery, allStores]);

  const filteredEngineers = React.useMemo(() => {
    return !engineerQuery.trim()
      ? allEngineers
      : allEngineers?.filter((e) => {
          return e.name
            .toLowerCase()
            .replaceAll(" ", "")
            .includes(engineerQuery.toLowerCase().replaceAll(" ", ""));
        });
  }, [engineerQuery, allEngineers]);

  const engineerListboxLabel = React.useMemo(() => {
    if (!allEngineers?.length || !values.engineer)
      return "Select an engineer ( Optional ).";
    const selected = allEngineers.find((e) => e.id === values.engineer);
    if (!selected) return "Select an engineer ( Optional ).";

    return `${selected.name} <${selected.email}> (${selected.isAdmin ? "admin" : "user"})`;
  }, [values.engineer, allEngineers]);

  const onSubmit = handleSubmit(async (data: TicketFormData) => {
    const res = await fetch(`/api/v1/ticket/public/create`, {
      method: "POST",
      body: JSON.stringify({
        ...data,
        createdBy: {
          id: user.id,
          name: user.name,
          role: user.role,
          email: user.email,
        },
      }),
      headers: { "Content-Type": "application/json" },
    });

    const json = await res.json();

    if (json.success) {
      setOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["allusertickets"] });
      router.push("/issues");

      toast({
        title: "Success",
        variant: "default",
        description: "Ticket created successfully",
      });
    } else {
      toast({
        title: "Error",
        variant: "destructive",
        description: "Please fill out all required fields",
      });
    }
  });

  React.useEffect(() => {
    if (keypress) {
      setOpen(true);
      setKeyPressDown(false);
    }
  }, [keypress, setKeyPressDown]);

  return (
    <Transition.Root show={open} as={React.Fragment}>
      <Dialog className="fixed inset-0" onClose={() => setOpen(false)}>
        <Transition.Child
          as={Dialog.Overlay}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          className="fixed inset-0 bg-black/20 backdrop-blur-sm transition-all"
        />

        <Transition.Child
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background rounded-lg w-full sm:max-w-xl overflow-x-clip h-fit sm:max-h-[90%] overflow-auto text-left shadow-xl transition-all"
        >
          <div className="px-4 sm:px-6 py-4 sticky top-0 bg-background/85 backdrop-blur-sm flex items-center justify-between border-b border-border">
            <Dialog.Title
              as="h3"
              className="capitalize text-lg leading-6 font-medium text-foreground"
            >
              Create new issue
            </Dialog.Title>

            <button
              type="button"
              className="hover:bg-muted text-muted-foreground hover:text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-2 focus:ring-offset-background"
              onClick={() => setOpen(false)}
            >
              <span className="sr-only">Close</span>
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <form onSubmit={onSubmit} className="p-6">
            <div className="flex flex-col space-y-4">
              {/* Name */}
              <div className="grid gap-1">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium leading-6 text-foreground/75 select-none"
                >
                  Name<sup className="text-destructive">*</sup>
                </label>
                <input
                  id="name"
                  {...register("name")}
                  placeholder="John Doe"
                  className="block w-full rounded-md border-none px-4 py-1.5 transition-colors bg-muted text-foreground hover:placeholder-foreground/75 shadow-sm focus:outline-none ring-1 ring-border placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-primary font-medium text-sm sm:leading-6"
                />
                {errors.name && (
                  <small className="text-xs font-medium text-destructive">
                    {errors.name.message}
                  </small>
                )}
              </div>

              {/* Email */}
              <div className="grid gap-1">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium leading-6 text-foreground/75 select-none"
                >
                  Email<sup className="text-destructive">*</sup>
                </label>
                <input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="john@example.com"
                  className="block w-full rounded-md border-none px-4 py-1.5 transition-colors bg-muted text-foreground hover:placeholder-foreground/75 shadow-sm focus:outline-none ring-1 ring-border placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-primary font-medium text-sm sm:leading-6"
                />
                {errors.email && (
                  <small className="text-xs font-medium text-destructive">
                    {errors.email.message}
                  </small>
                )}
              </div>

              {/* Subject */}
              <div className="grid gap-1">
                <label
                  htmlFor="title"
                  className="block text-sm font-medium leading-6 text-foreground/75 select-none"
                >
                  Subject<sup className="text-destructive">*</sup>
                </label>
                <input
                  id="title"
                  {...register("title")}
                  placeholder="Eg: I can't login to my account"
                  className="block w-full rounded-md border-none px-4 py-1.5 transition-colors bg-muted text-foreground hover:placeholder-foreground/75 shadow-sm focus:outline-none ring-1 ring-border placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-primary font-medium text-sm sm:leading-6"
                />
                {errors.title && (
                  <small className="text-xs font-medium text-destructive">
                    {errors.title.message}
                  </small>
                )}
              </div>

              <div className="grid items-start md:grid-cols-2 gap-4">
                {/* Company */}
                <Combobox
                  value={values.company}
                  disabled={isCompanyLoading}
                  onChange={(v) => setValue("company", v)}
                >
                  {({ open, value }) => (
                    <div className="grid gap-1">
                      <Combobox.Label
                        htmlFor="company"
                        className="text-sm font-medium text-foreground/75"
                      >
                        Company<sup className="text-destructive">*</sup>
                      </Combobox.Label>
                      <div className="relative">
                        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2 [&_svg]:size-5">
                          {isCompanyLoading ? (
                            <ArrowPathIcon className="animate-spin" />
                          ) : (
                            <ChevronUpDownIcon />
                          )}
                        </Combobox.Button>

                        <Combobox.Input
                          id="company"
                          placeholder="Select a company."
                          onBlur={() => setCompanyQuery("")}
                          onChange={(ev) =>
                            setCompanyQuery(ev.currentTarget.value)
                          }
                          displayValue={(value) => {
                            if (!value || !allCompanies?.length) return;
                            const selected = allCompanies.find(
                              (c) => c.id === value,
                            );
                            return selected?.name;
                          }}
                          className="block w-full rounded-md border-none px-4 py-1.5 transition-colors bg-muted text-foreground hover:placeholder-foreground/75 shadow-sm focus:outline-none ring-1 ring-border placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-primary font-medium text-sm sm:leading-6 disabled:cursor-not-allowed disabled:opacity-85 disabled:!placeholder-muted-foreground/75"
                        />

                        <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-background p-1 shadow-lg ring-2 ring-border !outline-none text-sm">
                          {filteredCompanies?.length ? (
                            filteredCompanies.map((e) => (
                              <Combobox.Option
                                key={e.id}
                                value={e.id}
                                className={({ active }) =>
                                  twJoin(
                                    active
                                      ? "bg-muted text-primary"
                                      : "text-muted-foreground",
                                    "relative cursor-default select-none py-2 pl-3 pr-9 rounded-md",
                                  )
                                }
                              >
                                {({ selected }) => (
                                  <>
                                    <div className="flex items-center gap-2">
                                      <div className="grid">
                                        <span
                                          className={twJoin(
                                            selected
                                              ? "font-semibold"
                                              : "font-normal",
                                            "block truncate",
                                          )}
                                        >
                                          {e.name}
                                        </span>
                                      </div>
                                    </div>
                                    {selected && (
                                      <span className="absolute inset-y-0 right-0 flex items-center pr-4">
                                        <CheckIcon className="h-5 w-5 text-primary" />
                                      </span>
                                    )}
                                  </>
                                )}
                              </Combobox.Option>
                            ))
                          ) : (
                            <div className="py-2 px-3">No company to show.</div>
                          )}
                        </Combobox.Options>
                      </div>
                      {errors.company && (
                        <small className="text-xs font-medium text-destructive">
                          {errors.company.message}
                        </small>
                      )}
                    </div>
                  )}
                </Combobox>
                {/* Store */}
                <Combobox
                  value={values.store}
                  disabled={!values.company || isStoresLoading}
                  onChange={(v) => setValue("store", v)}
                >
                  {({ open, value }) => (
                    <div className="grid gap-1">
                      <Combobox.Label
                        htmlFor="store"
                        className="text-sm font-medium text-foreground/75"
                      >
                        Store/Department
                        <sup className="text-destructive">*</sup>
                      </Combobox.Label>
                      <div className="relative">
                        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2 [&_svg]:size-5 disabled:opacity-85 disabled:cursor-not-allowed">
                          {isStoresLoading ? (
                            <ArrowPathIcon className="animate-spin" />
                          ) : (
                            <ChevronUpDownIcon />
                          )}
                        </Combobox.Button>

                        <Combobox.Input
                          id="company"
                          placeholder="Select a store/department."
                          onBlur={() => setStoreQuery("")}
                          onChange={(ev) =>
                            setStoreQuery(ev.currentTarget.value)
                          }
                          displayValue={(value) => {
                            if (!value || !allStores?.length) return;
                            const selected = allStores.find(
                              (c) => c.id === value,
                            );
                            return selected?.name;
                          }}
                          className="block w-full rounded-md border-none px-4 py-1.5 transition-colors bg-muted text-foreground hover:placeholder-foreground/75 shadow-sm focus:outline-none ring-1 ring-border placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-primary font-medium text-sm sm:leading-6 disabled:cursor-not-allowed disabled:opacity-85 disabled:!placeholder-muted-foreground/75"
                        />

                        <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-background p-1 shadow-lg ring-2 ring-border !outline-none text-sm">
                          {filteredStores?.length ? (
                            filteredStores.map((e) => (
                              <Combobox.Option
                                key={e.id}
                                value={e.id}
                                className={({ active }) =>
                                  twJoin(
                                    active
                                      ? "bg-muted text-primary"
                                      : "text-muted-foreground",
                                    "relative cursor-default select-none py-2 pl-3 pr-9 rounded-md",
                                  )
                                }
                              >
                                {({ selected }) => (
                                  <>
                                    <div className="flex items-center gap-2">
                                      <div className="grid">
                                        <span
                                          className={twJoin(
                                            selected
                                              ? "font-semibold"
                                              : "font-normal",
                                            "block truncate",
                                          )}
                                        >
                                          {e.name}
                                        </span>
                                      </div>
                                    </div>
                                    {selected && (
                                      <span className="absolute inset-y-0 right-0 flex items-center pr-4">
                                        <CheckIcon className="h-5 w-5 text-primary" />
                                      </span>
                                    )}
                                  </>
                                )}
                              </Combobox.Option>
                            ))
                          ) : (
                            <div className="py-2 px-3">
                              No store/department to show.
                            </div>
                          )}
                        </Combobox.Options>
                      </div>
                      {errors.store && (
                        <small className="text-xs font-medium text-destructive">
                          {errors.store.message}
                        </small>
                      )}
                    </div>
                  )}
                </Combobox>
              </div>

              {/* Engineer */}
              <Combobox
                value={values.engineer}
                disabled={isEngineersLoading}
                onChange={(v) => setValue("engineer", v)}
              >
                {({ open, value }) => (
                  <div className="grid gap-1">
                    <Combobox.Label
                      htmlFor="engineer"
                      className="text-sm font-medium text-foreground/75"
                    >
                      Engineer
                    </Combobox.Label>
                    <div className="relative">
                      {values.engineer ? (
                        <button
                          type="button"
                          onClick={() => setValue("engineer", null)}
                          className="absolute z-10 inset-y-0 right-7 flex items-center p-1 text-destructive hover:text-destructive/85 transition-colors"
                        >
                          <XMarkIcon className="size-5" />
                        </button>
                      ) : null}

                      <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2 [&_svg]:size-5">
                        {isEngineersLoading ? (
                          <ArrowPathIcon className="animate-spin" />
                        ) : (
                          <ChevronUpDownIcon />
                        )}
                      </Combobox.Button>

                      <Combobox.Input
                        id="engineer"
                        placeholder="Select an enginner ( Optional )"
                        onBlur={() => setEngineerQuery("")}
                        onChange={(ev) =>
                          setEngineerQuery(ev.currentTarget.value)
                        }
                        displayValue={(value) => {
                          if (!value || !allEngineers?.length) return;
                          const selected = allEngineers.find(
                            (e) => e.id === value,
                          );

                          if (!selected)
                            return "Select an engineer ( Optional ).";
                          return `${selected.name} <${selected.email}> (${selected.isAdmin ? "admin" : "user"})`;
                        }}
                        className="block w-full rounded-md border-none px-4 py-1.5 transition-colors bg-muted text-foreground hover:placeholder-foreground/75 shadow-sm focus:outline-none ring-1 ring-border placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-primary font-medium text-sm sm:leading-6"
                      />

                      <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-background p-1 shadow-lg ring-2 ring-border !outline-none text-sm">
                        <Combobox.Option
                          value={null}
                          className={({ active }) =>
                            twJoin(
                              active
                                ? "bg-muted text-primary"
                                : "text-muted-foreground",
                              "flex items-center gap-2 relative cursor-default select-none py-2 pl-3 pr-9 rounded-md",
                            )
                          }
                        >
                          <UserMinusIcon className="size-8" />
                          Unassign Engineer
                        </Combobox.Option>

                        {filteredEngineers?.map((e) => (
                          <Combobox.Option
                            key={e.id}
                            value={e.id}
                            className={({ active }) =>
                              twJoin(
                                active
                                  ? "bg-muted text-primary"
                                  : "text-muted-foreground",
                                "relative cursor-default select-none py-2 pl-3 pr-9 rounded-md",
                              )
                            }
                          >
                            {({ selected }) => (
                              <>
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center justify-center rounded-full size-8 bg-muted">
                                    <img
                                      src={
                                        e.image ??
                                        `https://ui-avatars.com/api/?name=${e.name}&background=random`
                                      }
                                      className="size-8 rounded-full shrink-0 bg-muted"
                                    />
                                  </div>
                                  <div className="grid">
                                    <span
                                      className={twJoin(
                                        selected
                                          ? "font-semibold"
                                          : "font-normal",
                                        "block truncate",
                                      )}
                                    >
                                      {e.name}&nbsp; (
                                      {e.isAdmin ? "admin" : "user"})
                                    </span>
                                    <span>{e.email}</span>
                                  </div>
                                </div>
                                {selected && (
                                  <span className="absolute inset-y-0 right-0 flex items-center pr-4">
                                    <CheckIcon className="h-5 w-5 text-primary" />
                                  </span>
                                )}
                              </>
                            )}
                          </Combobox.Option>
                        ))}
                      </Combobox.Options>
                    </div>
                    {errors.engineer && (
                      <small className="text-xs font-medium text-destructive">
                        {errors.engineer.message}
                      </small>
                    )}
                  </div>
                )}
              </Combobox>

              {/* Issue Type */}
              <Listbox
                value={values.type}
                onChange={(v) => setValue("type", v)}
              >
                {({ open }) => (
                  <div className="grid gap-1">
                    <Listbox.Label className="text-sm font-medium text-foreground/75">
                      Issue Type<sup className="text-destructive">*</sup>
                    </Listbox.Label>
                    <div className="relative">
                      <Listbox.Button className="relative w-full cursor-default rounded-md bg-muted text-muted-foreground hover:text-foreground py-1.5 pl-4 pr-10 text-left shadow-sm ring-1 ring-inset ring-border font-medium text-sm">
                        <span className="block truncate">
                          {ISSUE_TYPES.find((iss) => iss.name === values.type)
                            ?.name ?? "Issue Type"}
                        </span>

                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                          <ChevronUpDownIcon className="h-5 w-5" />
                        </span>
                      </Listbox.Button>
                      <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-background p-1 shadow-lg ring-2 ring-border !outline-none text-sm">
                        {ISSUE_TYPES.map((item) => (
                          <Listbox.Option
                            key={item.id}
                            value={item.name}
                            className={({ active }) =>
                              twJoin(
                                active
                                  ? "bg-muted text-primary"
                                  : "text-muted-foreground",
                                "relative cursor-default select-none py-2 pl-3 pr-9 rounded-md",
                              )
                            }
                          >
                            {({ selected }) => (
                              <>
                                <span
                                  className={twJoin(
                                    selected ? "font-semibold" : "font-normal",
                                    "block truncate",
                                  )}
                                >
                                  {item.name}
                                </span>
                                {selected && (
                                  <span className="absolute inset-y-0 right-0 flex items-center pr-4">
                                    <CheckIcon className="h-5 w-5 text-primary" />
                                  </span>
                                )}
                              </>
                            )}
                          </Listbox.Option>
                        ))}
                      </Listbox.Options>
                    </div>

                    {errors.type && (
                      <small className="text-xs font-medium text-destructive">
                        {errors.type.message}
                      </small>
                    )}
                  </div>
                )}
              </Listbox>

              {/* Priority */}
              <Listbox
                value={values.priority}
                onChange={(v) => setValue("priority", v)}
              >
                {({ open }) => (
                  <div className="grid gap-1">
                    <Listbox.Label className="text-sm font-medium text-foreground/75">
                      Priority<sup className="text-destructive">*</sup>
                    </Listbox.Label>
                    <div className="relative">
                      <Listbox.Button className="relative w-full cursor-default rounded-md bg-muted text-muted-foreground hover:text-foreground py-1.5 pl-4 pr-10 text-left shadow-sm ring-1 ring-inset ring-border font-medium text-sm">
                        <span className="block truncate">
                          {PRIORITIES.find(
                            (priority) => priority.name === values.priority,
                          )?.name ?? "Priority"}
                        </span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                          <ChevronUpDownIcon className="h-5 w-5" />
                        </span>
                      </Listbox.Button>
                      <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-background p-1 shadow-lg ring-2 ring-border !outline-none text-sm">
                        {PRIORITIES.map((item) => (
                          <Listbox.Option
                            key={item.id}
                            value={item.name}
                            className={({ active }) =>
                              twJoin(
                                active
                                  ? "bg-muted text-primary"
                                  : "text-muted-foreground",
                                "relative cursor-default select-none py-2 pl-3 pr-9 rounded-md",
                              )
                            }
                          >
                            {({ selected }) => (
                              <>
                                <span
                                  className={twJoin(
                                    selected ? "font-semibold" : "font-normal",
                                    "block truncate",
                                  )}
                                >
                                  {item.name}
                                </span>
                                {selected && (
                                  <span className="absolute inset-y-0 right-0 flex items-center pr-4">
                                    <CheckIcon className="h-5 w-5 text-primary" />
                                  </span>
                                )}
                              </>
                            )}
                          </Listbox.Option>
                        ))}
                      </Listbox.Options>
                      {errors.priority && (
                        <small className="text-xs font-medium text-destructive">
                          {errors.priority.message}
                        </small>
                      )}
                    </div>
                  </div>
                )}
              </Listbox>

              {/* detail */}
              <div className="grid gap-2">
                <label
                  htmlFor="detail"
                  className="block text-sm font-medium text-foreground/75"
                >
                  Description of Issue<sup className="text-destructive">*</sup>
                </label>
                <div className="bg-muted rounded-md ring-1 ring-border min-h-32">
                  <Editor setIssue={(v) => setValue("detail", v)} />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-colors shadow-sm hover:bg-primary/85"
              >
                Submit Ticket
              </button>
            </div>
          </form>
        </Transition.Child>
      </Dialog>
    </Transition.Root>
  );
}
