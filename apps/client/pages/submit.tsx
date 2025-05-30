// Check if the ID matches the id of the company
// If true then show ticket creation htmlForm else show access denied htmlForm
// API post request to creating a ticket with relevant client info
// Default to unassigned engineer
// Send Email to customer with ticket creation
// Send Email to Engineers with ticket creation if email notifications are turned on

import React from "react";
import { toast } from "@/shadcn/hooks/use-toast";
import { Listbox, Transition } from "@headlessui/react";
import {
  CheckCircleIcon,
  CheckIcon,
  ChevronUpDownIcon,
} from "@heroicons/react/20/solid";
import { getCookie } from "cookies-next";
import { useRouter } from "next/router";
import { Fragment, useState } from "react";
import { useQuery } from "react-query";
import { twJoin } from "tailwind-merge";

const type = [
  { id: 5, name: "Incident" },
  { id: 1, name: "Service" },
  { id: 2, name: "Feature" },
  { id: 3, name: "Bug" },
  { id: 4, name: "Maintenance" },
  { id: 6, name: "Access" },
  { id: 8, name: "Feedback" },
];

const pri = [
  { id: 7, name: "Low" },
  { id: 8, name: "Medium" },
  { id: 9, name: "High" },
];

const fetchAllClients = async () => {
  const res = await fetch(`/api/v1/clients/all`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getCookie("session")}`,
    },
  });
  const json = await res.json();
  return json?.clients || [];
};


const fetchAllStores = async (clientId: string) => {
  const res = await fetch(`/api/v1/clients/${clientId}/stores`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getCookie("session")}`,
    },
  });
  const json = await res.json();
  return json?.stores || [];
};


export default function ClientTicketNew() {
  function classNames(...classes) {
    return classes.filter(Boolean).join(" ");
  }

  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState("new");
  const [ticketID, setTicketID] = useState("");

  const [selected, setSelected] = useState(type[2]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(pri[0]);

  const [restaurant, setRestaurant] = useState<{name: string; id: string;}>();
  const [store, setStore] = useState<{name: string; id: string;}>();

  const { data: allClients } = useQuery({
    queryKey: ["fetchAllClients"],
    queryFn: fetchAllClients,
  });

  const { data: allStores } = useQuery({
    enabled: !!restaurant?.id,
    queryKey: ["fetchAllStores", restaurant?.id],
    queryFn: () => fetchAllStores(restaurant?.id),
  });

  React.useEffect(() => {
    setStore(undefined);
  }, [restaurant, setStore])

  async function submitTicket() {
    setIsLoading(true);
    await fetch(`/api/v1/ticket/public/create`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        name,
        title: subject,
        company: router.query.id,
        email,
        detail: description,
        priority: priority.name,
        type: selected.name,
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.success === true) {
          toast({
            variant: "default",
            title: "Success",
            description: "Ticket created succesfully",
          });

          setView("success");
          setTicketID(res.id);
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: `Please fill out all information and try again`,
          });
        }
      });
    setIsLoading(false);
  }

  return (
    <div className="flex justify-center items-center content-center h-screen bg-gray-900">
      {view === "new" ? (
        <div className="max-w-2xl bg-background p-12 rounded-md">
          <h1 className="font-bold text-2xl">Submit a Ticket</h1>
          <span className="text-muted-foreground">
            Need help? Submit a ticket and our support team will get back to you
            as soon as possible.
          </span>

          <div className="my-4 flex flex-col space-y-4">
            <div className="grid gap-1">
              <label
                htmlFor="name"
                className="block text-sm font-medium leading-6 text-foreground/75 select-none"
              >
                Name
              </label>
              <div className="grid gap-1">
                <input
                  id="name"
                  type="name"
                  name="name"
                  className="block w-full rounded-md border-none px-4 py-1.5 transition-colors bg-muted text-foreground hover:placeholder-foreground/75 shadow-sm focus:outline-none ring-1 ring-border placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-primary invalid:bg-destructive/50 invalid:ring-2 invalid:!ring-destructive invalid:text-foreground font-medium text-sm sm:leading-6"
                  placeholder="John Doe"
                  onChange={(e) => setName(e.target.value)}
                  value={name}
                  autoComplete="off"
                />
              </div>
            </div>
            <div className="grid gap-1">
              <label
                htmlFor="email"
                className="block text-sm font-medium leading-6 text-foreground/75 select-none"
              >
                Email
              </label>
              <div className="grid gap-1">
                <input
                  type="email"
                  name="email"
                  id="email"
                  className="block w-full rounded-md border-none px-4 py-1.5 transition-colors bg-muted text-foreground hover:placeholder-foreground/75 shadow-sm focus:outline-none ring-1 ring-border placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-primary invalid:bg-destructive/50 invalid:ring-2 invalid:!ring-destructive invalid:text-foreground font-medium text-sm sm:leading-6"
                  placeholder="johnD@meta.com"
                  onChange={(e) => setEmail(e.target.value)}
                  value={email}
                  autoComplete="off"
                />
              </div>
            </div>
            <div className="grid gap-1">
              <label
                htmlFor="subject"
                className="block text-sm font-medium leading-6 text-foreground/75 select-none"
              >
                Subject
              </label>
              <div>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  className="block w-full rounded-md border-none px-4 py-1.5 transition-colors bg-muted text-foreground hover:placeholder-foreground/75 shadow-sm focus:outline-none ring-1 ring-border placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-primary invalid:bg-destructive/50 invalid:ring-2 invalid:!ring-destructive invalid:text-foreground font-medium text-sm sm:leading-6"
                  placeholder="I can't login to my account"
                  onChange={(e) => setSubject(e.target.value)}
                  value={subject}
                />
              </div>
            </div>

             <div className="grid sm:grid-cols-2 gap-x-4">
             <Listbox value={restaurant} onChange={setRestaurant}>
              {({ open }) => (
                <div className="grid gap-1">
                  <Listbox.Label className="block text-sm font-medium leading-6 text-foreground/75 select-none">
                    Restaurant <sup className="text-destructive">*</sup>
                  </Listbox.Label>
                  <div className="relative">
                    <Listbox.Button className="relative w-full cursor-default rounded-md bg-muted text-muted-foreground py-1.5 pl-4 pr-10 text-left hover:text-foreground/75 shadow-sm ring-1 ring-inset ring-border focus:outline-none font-medium text-sm sm:leading-6">
                      <span className="block truncate">{restaurant?.name || "Select a restaurant"}</span>
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <ChevronUpDownIcon
                          className="h-5 w-5 text-muted-foreground"
                          aria-hidden="true"
                        />
                      </span>
                    </Listbox.Button>

                    <Transition
                      show={open}
                      as={Fragment}
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                    >
                      <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-background p-1 text-base shadow-lg ring-2 ring-border focus:outline-none sm:text-sm">
                        {allClients?.map?.((client) => (
                          <Listbox.Option
                            key={client.id}
                            className={({ active }) =>
                              classNames(
                                active
                                  ? "bg-muted text-primary"
                                  : "text-muted-foreground",
                                "relative cursor-default select-none py-2 pl-3 pr-9 rounded-md",
                              )
                            }
                            value={{id: client.id, name: client.name}}
                          >
                            {({ selected, active }) => (
                              <>
                                <span
                                  className={classNames(
                                    selected ? "font-semibold" : "font-normal",
                                    "block truncate",
                                  )}
                                >
                                  {client.name}
                                </span>

                                {selected ? (
                                  <span
                                    className={classNames(
                                      active
                                        ? "text-muted-foreground"
                                        : "text-primary",
                                      "absolute inset-y-0 right-0 flex items-center pr-4",
                                    )}
                                  >
                                    <CheckIcon
                                      className="h-5 w-5"
                                      aria-hidden="true"
                                    />
                                  </span>
                                ) : null}
                              </>
                            )}
                          </Listbox.Option>
                        ))}
                      </Listbox.Options>
                    </Transition>
                  </div>
                </div>
              )}
            </Listbox>

             <Listbox value={store} onChange={setStore} disabled={!restaurant?.id}>
              {({ open }) => (
                <div className="grid gap-1">
                  <Listbox.Label className="block text-sm font-medium leading-6 text-foreground/75 select-none">
                    Store <sup className="text-destructive">*</sup>
                  </Listbox.Label>
                  <div className="relative">
                    <Listbox.Button className={twJoin("[data-headlessui-state=disabled]:cursor-not-allowed relative w-full cursor-default rounded-md bg-muted text-muted-foreground py-1.5 pl-4 pr-10 text-left hover:text-foreground/75 shadow-sm ring-1 ring-inset ring-border focus:outline-none font-medium text-sm sm:leading-6", [

                    ])}>
                      <span className="block truncate">{store?.name || "Select a store"}</span>
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <ChevronUpDownIcon
                          className="h-5 w-5 text-muted-foreground"
                          aria-hidden="true"
                        />
                      </span>
                    </Listbox.Button>

                    <Transition
                      show={open}
                      as={Fragment}
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                    >
                      <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-background p-1 text-base shadow-lg ring-2 ring-border focus:outline-none sm:text-sm">
                        {allStores?.map((store) => (
                          <Listbox.Option
                            key={store.id}
                            className={({ active }) =>
                              classNames(
                                active
                                  ? "bg-muted text-primary"
                                  : "text-muted-foreground",
                                "relative cursor-default select-none py-2 pl-3 pr-9 rounded-md",
                              )
                            }
                            value={{id: store.id, name: store.name}}
                          >
                            {({ selected, active }) => (
                              <>
                                <span
                                  className={classNames(
                                    selected ? "font-semibold" : "font-normal",
                                    "block truncate",
                                  )}
                                >
                                  {store.name}
                                </span>

                                {selected ? (
                                  <span
                                    className={classNames(
                                      active
                                        ? "text-muted-foreground"
                                        : "text-primary",
                                      "absolute inset-y-0 right-0 flex items-center pr-4",
                                    )}
                                  >
                                    <CheckIcon
                                      className="h-5 w-5"
                                      aria-hidden="true"
                                    />
                                  </span>
                                ) : null}
                              </>
                            )}
                          </Listbox.Option>
                        ))}
                      </Listbox.Options>
                    </Transition>
                  </div>
                </div>
              )}
            </Listbox>

            </div>

            <Listbox value={selected} onChange={setSelected}>
              {({ open }) => (
                <div className="grid gap-1">
                  <Listbox.Label className="block text-sm font-medium leading-6 text-foreground/75 select-none">
                    Issue Type
                  </Listbox.Label>
                  <div className="relative">
                    <Listbox.Button className="relative w-full cursor-default rounded-md bg-muted text-muted-foreground py-1.5 pl-4 pr-10 text-left hover:text-foreground/75 shadow-sm ring-1 ring-inset ring-border focus:outline-none font-medium text-sm sm:leading-6">
                      <span className="block truncate">{selected.name}</span>
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <ChevronUpDownIcon
                          className="h-5 w-5 text-muted-foreground"
                          aria-hidden="true"
                        />
                      </span>
                    </Listbox.Button>

                    <Transition
                      show={open}
                      as={Fragment}
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                    >
                      <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-background p-1 text-base shadow-lg ring-2 ring-border focus:outline-none sm:text-sm">
                        {type.map((person) => (
                          <Listbox.Option
                            key={person.id}
                            className={({ active }) =>
                              classNames(
                                active
                                  ? "bg-muted text-primary"
                                  : "text-muted-foreground",
                                "relative cursor-default select-none py-2 pl-3 pr-9 rounded-md",
                              )
                            }
                            value={person}
                          >
                            {({ selected, active }) => (
                              <>
                                <span
                                  className={classNames(
                                    selected ? "font-semibold" : "font-normal",
                                    "block truncate",
                                  )}
                                >
                                  {person.name}
                                </span>

                                {selected ? (
                                  <span
                                    className={classNames(
                                      active
                                        ? "text-muted-foreground"
                                        : "text-primary",
                                      "absolute inset-y-0 right-0 flex items-center pr-4",
                                    )}
                                  >
                                    <CheckIcon
                                      className="h-5 w-5"
                                      aria-hidden="true"
                                    />
                                  </span>
                                ) : null}
                              </>
                            )}
                          </Listbox.Option>
                        ))}
                      </Listbox.Options>
                    </Transition>
                  </div>
                </div>
              )}
            </Listbox>

            <Listbox value={priority} onChange={setPriority}>
              {({ open }) => (
                <div className="grid gap-1">
                  <Listbox.Label className="block text-sm font-medium leading-6 text-foreground/75 select-none">
                    Priority
                  </Listbox.Label>
                  <div className="relative">
                    <Listbox.Button className="relative w-full cursor-default rounded-md bg-muted text-muted-foreground py-1.5 pl-4 pr-10 text-left hover:text-foreground/75 shadow-sm ring-1 ring-inset ring-border focus:outline-none font-medium text-sm sm:leading-6">
                      <span className="block truncate">{priority.name}</span>
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <ChevronUpDownIcon
                          className="h-5 w-5 text-muted-foreground"
                          aria-hidden="true"
                        />
                      </span>
                    </Listbox.Button>

                    <Transition
                      show={open}
                      as={Fragment}
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                    >
                      <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-background p-1 text-base shadow-lg ring-2 ring-border focus:outline-none sm:text-sm">
                        {pri.map((person) => (
                          <Listbox.Option
                            key={person.id}
                            className={({ active }) =>
                              classNames(
                                active
                                  ? "bg-muted text-primary"
                                  : "text-muted-foreground",
                                "relative cursor-default select-none py-2 pl-3 pr-9 rounded-md",
                              )
                            }
                            value={person}
                          >
                            {({ selected, active }) => (
                              <>
                                <span
                                  className={classNames(
                                    selected ? "font-semibold" : "font-normal",
                                    "block truncate",
                                  )}
                                >
                                  {person.name}
                                </span>

                                {selected ? (
                                  <span
                                    className={classNames(
                                      active
                                        ? "text-muted-foreground"
                                        : "text-primary",
                                      "absolute inset-y-0 right-0 flex items-center pr-4",
                                    )}
                                  >
                                    <CheckIcon
                                      className="h-5 w-5"
                                      aria-hidden="true"
                                    />
                                  </span>
                                ) : null}
                              </>
                            )}
                          </Listbox.Option>
                        ))}
                      </Listbox.Options>
                    </Transition>
                  </div>
                </div>
              )}
            </Listbox>

            <div>
              <label
                htmlFor="comment"
                className="block text-sm font-medium leading-6 text-foreground/75 select-none"
              >
                Description of Issue
              </label>
              <div>
                <textarea
                  rows={4}
                  name="comment"
                  id="comment"
                  className="block w-full rounded-md border-0 min-h-32 max-h-72 field-sizing-content py-1.5 bg-muted text-foreground shadow-sm ring-1 ring-border placeholder:text-muted-foreground hover:placeholder-foreground/75 focus:ring-2 focus:ring-inset focus:ring-primary invalid:bg-destructive/50 invalid:ring-2 invalid:!ring-destructive invalid:text-foreground font-medium text-sm sm:leading-6"
                  defaultValue={""}
                  placeholder="I think i locked myself out!"
                  onChange={(e) => setDescription(e.target.value)}
                  value={description}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={submitTicket}
              disabled={isLoading}
              className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-colors shadow-sm hover:bg-primary/85 disabled:cursor-not-allowed disabled:opacity-75"
            >
              Submit Ticket
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="rounded-md bg-green-600 shadow-md p-12">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircleIcon
                  className="h-10 w-10 text-white"
                  aria-hidden="true"
                />
              </div>
              <div className="ml-3">
                <h3 className="text-4xl font-medium text-white">
                  Ticket Submitted
                </h3>
                <div className="mt-2 text-sm text-white">
                  <p>
                    A member of our team has been notified and will be in touch
                    shortly.
                  </p>
                </div>
                {/* <div className="mt-4">
                  <div className="-mx-2 -my-1.5 flex">
                    <Link
                      href={`/portal/${router.query.id}/ticket/${ticketID}`}
                      className="rounded-md bg-green-50 px-2 py-1.5 text-sm font-medium text-green-800 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 focus:ring-offset-green-50"
                    >
                      View status
                    </Link>
                  </div>
                </div> */}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
