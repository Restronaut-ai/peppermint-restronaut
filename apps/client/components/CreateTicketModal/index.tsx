import * as z from "zod";
import React from "react";
import { twJoin } from "tailwind-merge";
import { useQuery, useQueryClient } from "react-query";
import { getCookie } from "cookies-next";
import TagsInput from "react-select/async-creatable";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { Dialog, Listbox, Transition, Switch } from "@headlessui/react";
import { toast } from "@/shadcn/hooks/use-toast";
import dynamic from "next/dynamic";

import {
  XMarkIcon,
  TrashIcon,
  CheckIcon,
  PlusCircleIcon,
  CheckCircleIcon,
  ChevronUpDownIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
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
const fetchAllClients = async () => {
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

  const { data: allClients, isLoading: isClientsLoading } = useQuery({
    queryFn: fetchAllClients,
    queryKey: ["fetchAllClients"],
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
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background rounded-lg w-full sm:max-w-lg h-fit sm:max-h-[90%] overflow-auto text-left shadow-xl transition-all"
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

              <div className="grid md:grid-cols-2 gap-4">
                {/* Company */}
                <Listbox
                  value={values.company}
                  onChange={(val) => setValue("company", val)}
                >
                  {({ open, value }) => (
                    <div className="grid gap-1">
                      <Listbox.Label className="text-sm font-medium text-foreground/75">
                        Company<sup className="text-destructive">*</sup>
                      </Listbox.Label>
                      <div className="relative">
                        <Listbox.Button
                          aria-selected={!!value}
                          className="relative w-full cursor-default rounded-md bg-muted text-muted-foreground hover:text-foreground py-1.5 pl-4 pr-10 text-left shadow-sm ring-1 ring-inset ring-border font-medium text-sm aria-selected:!text-foreground"
                        >
                          <span className="block truncate">
                            {allClients?.find((c) => c.id === values.company)
                              ?.name ?? "Select a company."}
                          </span>
                          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 [&_svg]:size-5">
                            {isClientsLoading ? (
                              <ArrowPathIcon className="animate-spin" />
                            ) : (
                              <ChevronUpDownIcon />
                            )}
                          </span>
                        </Listbox.Button>
                        <Transition show={open} as={React.Fragment}>
                          <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-background p-1 shadow-lg ring-2 ring-border !outline-none text-sm">
                            {allClients?.map((client) => (
                              <Listbox.Option
                                key={client.id}
                                value={client.id}
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
                                        selected
                                          ? "font-semibold"
                                          : "font-normal",
                                        "block truncate",
                                      )}
                                    >
                                      {client.name}
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
                        </Transition>
                      </div>
                      {errors.company && (
                        <small className="text-xs font-medium text-destructive">
                          {errors.company.message}
                        </small>
                      )}
                    </div>
                  )}
                </Listbox>

                {/* Store */}
                <Listbox
                  value={values.store}
                  disabled={!values.company}
                  onChange={(v) => setValue("store", v)}
                >
                  {({ open, value }) => (
                    <div className="grid gap-1">
                      <Listbox.Label className="text-sm font-medium text-foreground/75">
                        Store/Department
                        <sup className="text-destructive">*</sup>
                      </Listbox.Label>
                      <div className="relative">
                        <Listbox.Button
                          aria-selected={!!value}
                          className={twJoin(
                            "relative w-full cursor-default rounded-md bg-muted text-muted-foreground hover:text-foreground py-1.5 pl-4 pr-10 text-left shadow-sm ring-1 ring-inset ring-border font-medium text-sm aria-selected:!text-foreground",
                            !values.company && "opacity-50 cursor-not-allowed",
                          )}
                        >
                          <span className="block truncate">
                            {allStores?.find((s) => s.id === values.store)
                              ?.name ?? "Select a store."}
                          </span>
                          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 [&_svg]:size-5">
                            {isStoresLoading ? (
                              <ArrowPathIcon className="animate-spin" />
                            ) : (
                              <ChevronUpDownIcon />
                            )}
                          </span>
                        </Listbox.Button>
                        <Transition show={open} as={React.Fragment}>
                          <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-background p-1 shadow-lg ring-2 ring-border !outline-none text-sm">
                            {allStores?.map((s) => (
                              <Listbox.Option
                                key={s.id}
                                value={s.id}
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
                                        selected
                                          ? "font-semibold"
                                          : "font-normal",
                                        "block truncate",
                                      )}
                                    >
                                      {s.name}
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
                        </Transition>
                      </div>
                      {errors.store && (
                        <small className="text-xs font-medium text-destructive">
                          {errors.store.message}
                        </small>
                      )}
                    </div>
                  )}
                </Listbox>
              </div>

              {/* Store */}
              <Listbox
                value={values.engineer}
                onChange={(v) => setValue("engineer", v)}
              >
                {({ open, value }) => (
                  <div className="grid gap-1">
                    <Listbox.Label className="text-sm font-medium text-foreground/75">
                      Engineer
                    </Listbox.Label>
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

                      <Listbox.Button
                        aria-selected={!!value}
                        className="relative w-full cursor-default rounded-md bg-muted text-muted-foreground hover:text-foreground py-1.5 pl-4 pr-10 text-left shadow-sm ring-1 ring-inset ring-border font-medium text-sm aria-selected:!text-foreground"
                      >
                        <span className="block truncate">
                          {engineerListboxLabel}
                        </span>

                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 [&_svg]:size-5">
                          {isEngineersLoading ? (
                            <ArrowPathIcon className="animate-spin" />
                          ) : (
                            <ChevronUpDownIcon />
                          )}
                        </span>
                      </Listbox.Button>
                      <Transition show={open} as={React.Fragment}>
                        <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-background p-1 shadow-lg ring-2 ring-border !outline-none text-sm">
                          <Listbox.Option
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
                          </Listbox.Option>

                          {allEngineers?.map((e) => (
                            <Listbox.Option
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
                                    <img
                                      src={
                                        e.image ??
                                        `https://ui-avatars.com/api/?name=${e.name}&background=random`
                                      }
                                      className="size-8 rounded-full shrink-0"
                                    />
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
                            </Listbox.Option>
                          ))}
                        </Listbox.Options>
                      </Transition>
                    </div>
                    {errors.engineer && (
                      <small className="text-xs font-medium text-destructive">
                        {errors.engineer.message}
                      </small>
                    )}
                  </div>
                )}
              </Listbox>

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
                      <Transition show={open} as={React.Fragment}>
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
                                      selected
                                        ? "font-semibold"
                                        : "font-normal",
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
                      </Transition>
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
                      <Transition show={open} as={React.Fragment}>
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
                                      selected
                                        ? "font-semibold"
                                        : "font-normal",
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
                      </Transition>
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
                <Editor setIssue={(v) => setValue("detail", v)} />
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

// import z from "zod";
// import { useForm } from "react-hook-form";
// import { Dialog, Listbox, Transition } from "@headlessui/react";
// import { CheckIcon } from "@heroicons/react/20/solid";
// import { ChevronUpDownIcon, XMarkIcon } from "@heroicons/react/24/outline";
// import { getCookie } from "cookies-next";
// import useTranslation from "next-translate/useTranslation";
// import { useRouter } from "next/router";
// import { Fragment, useEffect, useState } from "react";
// import { useUser } from "../../store/session";

// import dynamic from "next/dynamic";
// import { twMerge  } from "tailwind-merge";
// import { toast } from "@/shadcn/hooks/use-toast";
// import { useSidebar } from "@/shadcn/ui/sidebar";

// const Editor = dynamic(() => import("../BlockEditor"), { ssr: false });

// const type = [
//   { id: 5, name: "Incident" },
//   { id: 1, name: "Service" },
//   { id: 2, name: "Feature" },
//   { id: 3, name: "Bug" },
//   { id: 4, name: "Maintenance" },
//   { id: 6, name: "Access" },
//   { id: 8, name: "Feedback" },
// ];

// export default function CreateTicketModal({ keypress, setKeyPressDown }) {
//   const { t, lang } = useTranslation("peppermint");
//   const [open, setOpen] = useState(false);

//   const router = useRouter();
//   const { register, formState } = useForm({});

//   const token = getCookie("session");

//   const { user } = useUser();
//   const { state } = useSidebar();

//   const [name, setName] = useState("");
//   const [company, setCompany] = useState<any>();
//   const [engineer, setEngineer] = useState<any>();
//   const [email, setEmail] = useState("");
//   const [issue, setIssue] = useState<any>();
//   const [title, setTitle] = useState("");
//   const [priority, setPriority] = useState("medium");
//   const [options, setOptions] = useState<any>();
//   const [users, setUsers] = useState<any>();
//   const [selected, setSelected] = useState<any>(type[3]);

//   const fetchClients = async () => {
//     await fetch(`/api/v1/clients/all`, {
//       method: "GET",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${token}`,
//       },
//     })
//       .then((res) => res.json())
//       .then((res) => {
//         if (res) {
//           setOptions(res.clients);
//         }
//       });
//   };

//   async function fetchAllEngineers() {
//     try {
//       await fetch(`/api/v1/users/all`, {
//         method: "GET",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//       })
//         .then((res) => res.json())
//         .then((res) => {
//           if (res) {
//             // TODO: THINK ABOUT AUTO ASSIGN PREFERENCES
//             // setEngineer(user)
//             setUsers(res.users);
//           }
//         });
//     } catch (error) {
//       console.log(error);
//     }
//   }

//   async function createTicket() {
//     await fetch(`/api/v1/ticket/create`, {
//       method: "POST",
//       headers: {
//         "content-type": "application/json",
//         Authorization: `Bearer ${token}`,
//       },
//       body: JSON.stringify({
//         name,
//         title,
//         company,
//         email,
//         detail: issue,
//         priority,
//         engineer,
//         type: selected.name,
//         createdBy: {
//           id: user.id,
//           name: user.name,
//           role: user.role,
//           email: user.email,
//         },
//       }),
//     })
//       .then((res) => res.json())
//       .then((res) => {
//         if (res.success === true) {
//           toast({
//             variant: "default",
//             title: "Success",
//             description: "Ticket created succesfully",
//           });
//           router.push("/issues");
//         } else {
//           toast({
//             variant: "destructive",
//             title: `Error`,
//             description: res.message,
//           });
//         }
//       });
//   }

//   function checkPress() {
//     if (keypress) {
//       setOpen(true);
//       setKeyPressDown(false);
//     }
//   }

//   useEffect(() => {
//     fetchClients();
//     fetchAllEngineers();
//   }, []);

//   useEffect(() => checkPress(), [keypress]);

//   const [hideKeyboardShortcuts, setHideKeyboardShortcuts] = useState(false);
//   const [hideName, setHideName] = useState(false);
//   const [hideEmail, setHideEmail] = useState(false);

//   useEffect(() => {
//     const loadFlags = () => {
//       const savedFlags = localStorage.getItem("featureFlags");
//       if (savedFlags) {
//         const flags = JSON.parse(savedFlags);
//         const hideShortcuts = flags.find(
//           (f: any) => f.name === "Hide Keyboard Shortcuts",
//         )?.enabled;

//         const hideName = flags.find(
//           (f: any) => f.name === "Hide Name in Create",
//         )?.enabled;

//         const hideEmail = flags.find(
//           (f: any) => f.name === "Hide Email in Create",
//         )?.enabled;

//         setHideKeyboardShortcuts(hideShortcuts || false);
//         setHideName(hideName || false);
//         setHideEmail(hideEmail || false);
//       }
//     };

//     loadFlags();
//     window.addEventListener("storage", loadFlags);
//     return () => window.removeEventListener("storage", loadFlags);
//   }, []);

//   return (
//     <>
//       <Transition.Root show={open} as={React.Fragment}>
//         <Dialog as="div" className="fixed z-10 inset-0" onClose={setOpen}>
//           <div className="flex items-end justify-center min-h-screen align-middle pt-4 mx-4 md:mx-12 text-center -mt-[50%] sm:-mt-0 sm:block sm:p-0">
//             <Transition.Child
//               as={React.Fragment}
//               enter="ease-out duration-300"
//               enterFrom="opacity-0"
//               enterTo="opacity-100"
//               leave="ease-in duration-200"
//               leaveFrom="opacity-100"
//               leaveTo="opacity-0"
//             >
//               <Dialog.Overlay className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
//             </Transition.Child>

//             {/* This element is to trick the browser into centering the modal contents. */}
//             <span
//               className="hidden sm:inline-block sm:align-middle sm:h-screen"
//               aria-hidden="true"
//             >
//               &#8203;
//             </span>
//             <Transition.Child
//               as={React.Fragment}
//               enter="ease-out duration-300"
//               enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
//               enterTo="opacity-100 translate-y-0 sm:scale-100"
//               leave="ease-in duration-200"
//               leaveFrom="opacity-100 translate-y-0 sm:scale-100"
//               leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
//             >
//               <div className="inline-block bg-background rounded-lg px-4 pt-5 pb-4 text-left shadow-xl transform transition-all sm:my-8 align-middle md:max-w-3xl w-full ">
//                 <div className="flex flex-row w-full align-middle">
//                   <span className="text-md pb-2 font-semibold text-sm">
//                     New Issue
//                   </span>

//                   <button
//                     type="button"
//                     className="ml-auto mb-1.5 text-foreground font-bold text-xs rounded-md hover:text-primary outline-none"
//                     onClick={() => setOpen(false)}
//                   >
//                     <span className="sr-only">Close</span>
//                     <XMarkIcon className="h-5 w-5" aria-hidden="true" />
//                   </button>
//                 </div>

//                 <div className="grid gap-1">
//               <label
//                 htmlFor="title"
//                 className="block text-sm font-medium leading-6 text-foreground/75 select-none"
//               >
//                 Issue Title<sup className="text-destructive">*</sup>
//               </label>
//               <input
//                 id="title"
//                 {...register("title")}
//                 placeholder="eg: I can't login to my account."
//                 className="block w-full rounded-md border-none px-4 py-1.5 transition-colors bg-muted text-foreground hover:placeholder-foreground/75 shadow-sm focus:outline-none ring-1 ring-border placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-primary font-medium text-sm sm:leading-6"
//               />
//               {formState.errors.title && (
//                 <small className="text-xs font-medium text-destructive">
//                   {formState.errors.title.message}
//                 </small>
//               )}
//             </div>

//               <div className="relative pt-2 mt-4">
//                   <input
//                     id="name"
//                     type="text"
//                     name="name"
//                     maxLength={64}
//                     {...register("name")}
//                     placeholder="Name"
//                     className="peer w-full px-0 pb-0 text-sm font-medium text-foreground bg-background border-0 focus:outline-none focus:ring-0 focus:border-b-[1.5px] focus:border-primary"
//                   />
//                   <label htmlFor="name" className="text-sm font-medium text-foreground/85 peer-placeholder-shown:text-muted-foreground peer-hover:text-foreground/85 absolute peer-placeholder-shown:!left-0 peer-placeholder-shown:!top-4 peer-placeholder-shown:!scale-100 left-0 -top-1 scale-110 transition duration-200">
//                     Name
//                     <sup className="text-destructive">*</sup>
//                   </label>
//               </div>

//                 <div className="relative pt-2 mt-4">
//                   <input
//                     id="email"
//                     type="email"
//                     name="email"
//                     maxLength={64}
//                     {...register("email")}
//                     placeholder="Email Address"
//                     className="peer w-full px-0 pb-0 text-sm font-medium text-foreground bg-background border-0 focus:outline-none focus:ring-0 focus:border-b-[1.5px] focus:border-primary"
//                   />
//                   <label htmlFor="email" className="text-sm font-medium text-foreground/85 peer-placeholder-shown:text-muted-foreground peer-hover:text-foreground/85 absolute peer-placeholder-shown:!left-0 peer-placeholder-shown:!top-4 peer-placeholder-shown:!scale-100 left-1 -top-1 scale-110 transition duration-200">
//                     Email Address
//                     <sup className="text-destructive">*</sup>
//                   </label>
//               </div>

//                 <div className="mt-4">

//                   <div>
//                     <label>Description</label>
//                     <Editor setIssue={setIssue} />
//                   </div>

//                   <div className="flex flex-row space-x-4 pb-2 mt-2">
//                     {!user.external_user && (
//                       <>
//                         <Listbox value={company} onChange={setCompany}>
//                           {({ open }) => (
//                             <>
//                               <div className="relative">
//                                 <Listbox.Button className="relative w-full min-w-[172px] cursor-default rounded-md bg-white dark:bg-[#0A090C] dark:text-white py-1 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6">
//                                   <span className="block truncate">
//                                     {company === undefined
//                                       ? t("select_a_client")
//                                       : company === ""
//                                         ? t("select_a_client")
//                                         : company.name}
//                                   </span>
//                                   <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
//                                     <ChevronUpDownIcon
//                                       className="h-5 w-5 text-gray-400"
//                                       aria-hidden="true"
//                                     />
//                                   </span>
//                                 </Listbox.Button>

//                                 <Transition
//                                   show={open}
//                                   as={React.Fragment}
//                                   leave="transition ease-in duration-100"
//                                   leaveFrom="opacity-100"
//                                   leaveTo="opacity-0"
//                                 >
//                                   <Listbox.Options className="absolute z-10  max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-[#0A090C] dark:text-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
//                                     <Listbox.Option
//                                       className={({ active }) =>
//                                         twMerge(
//                                           active
//                                             ? "bg-indigo-600 text-white"
//                                             : "text-gray-900 dark:text-white",
//                                           "relative cursor-default select-none py-2 pl-3 pr-9",
//                                         )
//                                       }
//                                       value={undefined}
//                                     >
//                                       {({ selected, active }) => (
//                                         <>
//                                           <span
//                                             className={twMerge(
//                                               selected
//                                                 ? "font-semibold"
//                                                 : "font-normal",
//                                               "block truncate",
//                                             )}
//                                           >
//                                             Unassigned
//                                           </span>

//                                           {selected ? (
//                                             <span
//                                               className={twMerge(
//                                                 active
//                                                   ? "text-white"
//                                                   : "text-indigo-600",
//                                                 "absolute inset-y-0 right-0 flex items-center pr-4",
//                                               )}
//                                             >
//                                               <CheckIcon
//                                                 className="h-5 w-5"
//                                                 aria-hidden="true"
//                                               />
//                                             </span>
//                                           ) : null}
//                                         </>
//                                       )}
//                                     </Listbox.Option>
//                                     {options !== undefined &&
//                                       options.map((client: any) => (
//                                         <Listbox.Option
//                                           key={client.id}
//                                           className={({ active }) =>
//                                             twMerge(
//                                               active
//                                                 ? "bg-indigo-600 text-white"
//                                                 : "text-gray-900 dark:text-white",
//                                               "relative cursor-default select-none py-2 pl-3 pr-9",
//                                             )
//                                           }
//                                           value={client}
//                                         >
//                                           {({ selected, active }) => (
//                                             <>
//                                               <span
//                                                 className={twMerge(
//                                                   selected
//                                                     ? "font-semibold"
//                                                     : "font-normal",
//                                                   "block truncate",
//                                                 )}
//                                               >
//                                                 {client.name}
//                                               </span>

//                                               {selected ? (
//                                                 <span
//                                                   className={twMerge(
//                                                     active
//                                                       ? "text-white"
//                                                       : "text-indigo-600",
//                                                     "absolute inset-y-0 right-0 flex items-center pr-4",
//                                                   )}
//                                                 >
//                                                   <CheckIcon
//                                                     className="h-5 w-5"
//                                                     aria-hidden="true"
//                                                   />
//                                                 </span>
//                                               ) : null}
//                                             </>
//                                           )}
//                                         </Listbox.Option>
//                                       ))}
//                                   </Listbox.Options>
//                                 </Transition>
//                               </div>
//                             </>
//                           )}
//                         </Listbox>

//                         <Listbox value={engineer} onChange={setEngineer}>
//                           {({ open }) => (
//                             <>
//                               <div className="relative">
//                                 <Listbox.Button className="relative w-full min-w-[172px] cursor-default rounded-md bg-white dark:bg-[#0A090C] dark:text-white py-1 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6">
//                                   <span className="block truncate">
//                                     {engineer === undefined
//                                       ? t("select_an_engineer")
//                                       : engineer.name}
//                                   </span>
//                                   <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
//                                     <ChevronUpDownIcon
//                                       className="h-5 w-5 text-gray-400"
//                                       aria-hidden="true"
//                                     />
//                                   </span>
//                                 </Listbox.Button>

//                                 <Transition
//                                   show={open}
//                                   as={React.Fragment}
//                                   leave="transition ease-in duration-100"
//                                   leaveFrom="opacity-100"
//                                   leaveTo="opacity-0"
//                                 >
//                                   <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-[#0A090C] dark:text-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
//                                     <Listbox.Option
//                                       className={({ active }) =>
//                                         twMerge(
//                                           active
//                                             ? "bg-indigo-600 text-white"
//                                             : "text-gray-900 dark:text-white",
//                                           "relative cursor-default select-none py-2 pl-3 pr-9",
//                                         )
//                                       }
//                                       value={undefined}
//                                     >
//                                       {({ selected, active }) => (
//                                         <>
//                                           <span
//                                             className={twMerge(
//                                               selected
//                                                 ? "font-semibold"
//                                                 : "font-normal",
//                                               "block truncate",
//                                             )}
//                                           >
//                                             Unassigned
//                                           </span>

//                                           {selected ? (
//                                             <span
//                                               className={twMerge(
//                                                 active
//                                                   ? "text-white"
//                                                   : "text-indigo-600",
//                                                 "absolute inset-y-0 right-0 flex items-center pr-4",
//                                               )}
//                                             >
//                                               <CheckIcon
//                                                 className="h-5 w-5"
//                                                 aria-hidden="true"
//                                               />
//                                             </span>
//                                           ) : null}
//                                         </>
//                                       )}
//                                     </Listbox.Option>
//                                     {users !== undefined &&
//                                       users.map((user: any) => (
//                                         <Listbox.Option
//                                           key={user.id}
//                                           className={({ active }) =>
//                                             twMerge(
//                                               active
//                                                 ? "bg-indigo-600 text-white"
//                                                 : "text-gray-900 dark:text-white",
//                                               "relative cursor-default select-none py-2 pl-3 pr-9",
//                                             )
//                                           }
//                                           value={user}
//                                         >
//                                           {({ selected, active }) => (
//                                             <>
//                                               <span
//                                                 className={twMerge(
//                                                   selected
//                                                     ? "font-semibold"
//                                                     : "font-normal",
//                                                   "block truncate",
//                                                 )}
//                                               >
//                                                 {user.name}
//                                               </span>

//                                               {selected ? (
//                                                 <span
//                                                   className={twMerge(
//                                                     active
//                                                       ? "text-white"
//                                                       : "text-indigo-600",
//                                                     "absolute inset-y-0 right-0 flex items-center pr-4",
//                                                   )}
//                                                 >
//                                                   <CheckIcon
//                                                     className="h-5 w-5"
//                                                     aria-hidden="true"
//                                                   />
//                                                 </span>
//                                               ) : null}
//                                             </>
//                                           )}
//                                         </Listbox.Option>
//                                       ))}
//                                   </Listbox.Options>
//                                 </Transition>
//                               </div>
//                             </>
//                           )}
//                         </Listbox>

//                         <Listbox value={selected} onChange={setSelected}>
//                           {({ open }) => (
//                             <>
//                               <div className="relative">
//                                 <Listbox.Button className="relative w-full min-w-[172px] cursor-default rounded-md bg-white dark:bg-[#0A090C] dark:text-white py-1 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none sm:text-sm sm:leading-6">
//                                   <span className="block truncate">
//                                     {selected.name}
//                                   </span>
//                                   <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
//                                     <ChevronUpDownIcon
//                                       className="h-5 w-5 text-gray-400"
//                                       aria-hidden="true"
//                                     />
//                                   </span>
//                                 </Listbox.Button>

//                                 <Transition
//                                   show={open}
//                                   as={React.Fragment}
//                                   leave="transition ease-in duration-100"
//                                   leaveFrom="opacity-100"
//                                   leaveTo="opacity-0"
//                                 >
//                                   <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-[#0A090C] dark:text-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
//                                     {type.map((person) => (
//                                       <Listbox.Option
//                                         key={person.id}
//                                         className={({ active }) =>
//                                           twMerge(
//                                             active
//                                               ? "bg-gray-400 text-white"
//                                               : "text-gray-900 dark:text-white",
//                                             "relative cursor-default select-none py-2 pl-3 pr-9",
//                                           )
//                                         }
//                                         value={person}
//                                       >
//                                         {({ selected, active }) => (
//                                           <>
//                                             <span
//                                               className={twMerge(
//                                                 selected
//                                                   ? "font-semibold"
//                                                   : "font-normal",
//                                                 "block truncate",
//                                               )}
//                                             >
//                                               {person.name}
//                                             </span>

//                                             {selected ? (
//                                               <span
//                                                 className={twMerge(
//                                                   active
//                                                     ? "text-white"
//                                                     : "text-indigo-600",
//                                                   "absolute inset-y-0 right-0 flex items-center pr-4",
//                                                 )}
//                                               >
//                                                 <CheckIcon
//                                                   className="h-5 w-5"
//                                                   aria-hidden="true"
//                                                 />
//                                               </span>
//                                             ) : null}
//                                           </>
//                                         )}
//                                       </Listbox.Option>
//                                     ))}
//                                   </Listbox.Options>
//                                 </Transition>
//                               </div>
//                             </>
//                           )}
//                         </Listbox>
//                       </>
//                     )}
//                   </div>

//                   <div className="border-t border-gray-300 ">
//                     <div className="mt-2 float-right">
//                       <button
//                         onClick={() => {
//                           setOpen(false);
//                           createTicket();
//                         }}
//                         type="button"
//                         className="inline-flex justify-center rounded-md shadow-sm px-2.5 py-1.5 border border-transparent text-xs bg-green-600 font-medium text-white hover:bg-green-700 focus:outline-none "
//                       >
//                         Create Ticket
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </Transition.Child>
//           </div>
//         </Dialog>
//       </Transition.Root>
//     </>
//   );
// }
