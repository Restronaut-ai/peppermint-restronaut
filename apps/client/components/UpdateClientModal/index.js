import React, { useState, Fragment, useRef, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/router";
import { getCookie } from "cookies-next";

export default function UpdateClientModal({ client, refetch }) {
  const [open, setOpen] = useState(false);

  const abortController = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [number, setNumber] = useState(client.number);
  const [contactName, setContactName] = useState(client.contactName);
  const [name, setName] = useState(client.name);
  const [email, setEmail] = useState(client.email);

  const router = useRouter();

  useEffect(() => {
    return () => {
      abortController.current?.abort();
    };
  }, []);

  async function updateClient() {
    try {
      setIsLoading(true);

      if (abortController.current) abortController.current.abort();
      else abortController.current = new AbortController();

      await fetch("/api/v1/client/update", {
        method: "POST",
        signal: abortController.current.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getCookie("session")}`,
        },
        body: JSON.stringify({
          number,
          contactName,
          name,
          email,
          id: client.id,
        }),
      });
      await refetch();
    } finally {
      setIsLoading(false);
      abortController.current = null;
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center py-1.5 px-3 rounded-md text-primary hover:bg-primary/10 focus:outline-none"
      >
        <PencilSquareIcon className="size-5" />
      </button>

      <Transition.Root show={open} as={Fragment}>
        <Dialog
          as="div"
          className="fixed z-10 inset-0 overflow-y-auto"
          onClose={setOpen}
        >
          <div className="flex items-end justify-center min-h-screen p-4 text-center sm:block">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Overlay className="fixed inset-0 bg-black/20 backdrop-blur-sm transition-all" />
            </Transition.Child>

            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <div className="inline-block align-bottom bg-background rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all w-full sm:align-middle sm:max-w-lg sm:w-full">
                <div className="hidden sm:block absolute top-0 right-0 pt-4 pr-4">
                  <button
                    type="button"
                    className="hover:bg-muted text-muted-foreground hover:text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-2 focus:ring-offset-background"
                    onClick={() => setOpen(false)}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <form
                  className="sm:flex sm:items-center"
                  onSubmit={(ev) => {
                    ev.preventDefault();
                    updateClient();
                  }}
                >
                  <div className="mt-3 text-center sm:mt-0 px-4 py-2 sm:text-left w-full">
                    <Dialog.Title
                      as="h3"
                      className="text-lg leading-6 font-medium text-foreground mb-4"
                    >
                      Edit Client
                    </Dialog.Title>
                    <div className="mt-2 space-y-4">
                      <input
                        required
                        type="text"
                        className="block w-3/4 rounded-md border-none px-4 py-1.5 transition-colors bg-muted text-foreground hover:placeholder-foreground/75 shadow-sm focus:outline-none ring-1 ring-border placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-primary invalid:bg-destructive/50 invalid:ring-2 invalid:!ring-destructive invalid:text-foreground font-medium text-sm sm:leading-6"
                        placeholder="Enter client name here..."
                        name="name"
                        onChange={(e) => setName(e.target.value)}
                        value={name}
                      />

                      <input
                        required
                        type="email"
                        className="block w-full rounded-md border-none px-4 py-1.5 transition-colors bg-muted text-foreground hover:placeholder-foreground/75 shadow-sm focus:outline-none ring-1 ring-border placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-primary invalid:bg-destructive/50 invalid:ring-2 invalid:!ring-destructive invalid:text-foreground font-medium text-sm sm:leading-6"
                        placeholder="Enter email here...."
                        onChange={(e) => setEmail(e.target.value)}
                        value={email}
                      />

                      <input
                        required
                        type="text"
                        className="block w-full rounded-md border-none px-4 py-1.5 transition-colors bg-muted text-foreground hover:placeholder-foreground/75 shadow-sm focus:outline-none ring-1 ring-border placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-primary invalid:bg-destructive/50 invalid:ring-2 invalid:!ring-destructive invalid:text-foreground font-medium text-sm sm:leading-6"
                        placeholder="Enter client primary contact name here..."
                        onChange={(e) => setContactName(e.target.value)}
                        value={contactName}
                      />

                      <input
                        required
                        type="text"
                        className="block w-full rounded-md border-none px-4 py-1.5 transition-colors bg-muted text-foreground hover:placeholder-foreground/75 shadow-sm focus:outline-none ring-1 ring-border placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-primary invalid:bg-destructive/50 invalid:ring-2 invalid:!ring-destructive invalid:text-foreground font-medium text-sm sm:leading-6"
                        placeholder="Enter client primary contact number here..."
                        onChange={(e) => setNumber(e.target.value)}
                        value={number}
                      />
                    </div>
                    <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                      <button
                        type="submit"
                        disabled={isLoading}
                        onClick={() => updateClient()}
                        className="w-full md:w-fit rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-colors shadow-sm hover:bg-primary/85 disabled:cursor-not-allowed disabled:opacity-75"
                      >
                        {isLoading ? "Loading..." : "Update"}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  );
}
