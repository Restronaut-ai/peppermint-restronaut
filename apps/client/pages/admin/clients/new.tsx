import { toast } from "@/shadcn/hooks/use-toast";
import { getCookie } from "cookies-next";
import { useRouter } from "next/router";
import { useState } from "react";

export default function CreateClientPage() {
  const router = useRouter();

  const token = getCookie("session");

  const [number, setNumber] = useState("");
  const [contactName, setContactName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const isEnabled =
    number.length > 0 &&
    contactName.length > 0 &&
    name.length > 0 &&
    email.length > 0;

  async function createClient() {
    await fetch(`/api/v1/client/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({
        number,
        contactName,
        name,
        email,
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.success === true) {
          toast({
            variant: "default",
            title: "Success",
            description: "Client created succesfully",
          });
          router.push("/admin/clients");
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Whoops! please wait and try again! 🤥",
          });
        }
      });
  }

  return (
    <div>
      <main className="flex-1">
        <div className="relative max-w-4xl mx-auto md:px-8 xl:px-0">
          <div className="pt-10 pb-16 divide-y-2">
            <div className="px-4 sm:px-6 md:px-0">
              <h1 className="text-3xl font-extrabold text-foreground">
                Register a new client
              </h1>
            </div>
            <div className="py-1">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                  <div className="sm:flex sm:items-start">
                    <div className="text-center sm:mt-0 sm:text-left w-full">
                      <h3 className="text-base font-normal text-muted-foreground">
                        All fields are required!
                      </h3>
                      <div className="mt-6 space-y-4">
                        <input
                          required
                          type="text"
                          className="block md:w-2/3 rounded-md border-none px-4 py-1.5 transition-colors bg-muted text-foreground hover:placeholder-foreground/75 shadow-sm focus:outline-none ring-1 ring-border placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-primary font-medium text-sm sm:leading-6"
                          placeholder="Enter client name here..."
                          name="name"
                          onChange={(e) => setName(e.target.value)}
                        />

                        <input
                          required
                          type="email"
                          className="block w-full rounded-md border-none px-4 py-1.5 transition-colors bg-muted text-foreground hover:placeholder-foreground/75 shadow-sm focus:outline-none ring-1 ring-border placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-primary font-medium text-sm sm:leading-6"
                          placeholder="Enter email here...."
                          onChange={(e) => setEmail(e.target.value)}
                        />

                        <input
                          required
                          type="text"
                          className="block w-full rounded-md border-none px-4 py-1.5 transition-colors bg-muted text-foreground hover:placeholder-foreground/75 shadow-sm focus:outline-none ring-1 ring-border placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-primary font-medium text-sm sm:leading-6"
                          placeholder="Enter client primary contact name here..."
                          onChange={(e) => setContactName(e.target.value)}
                        />

                        <input
                          required
                          type="text"
                          className="block w-full rounded-md border-none px-4 py-1.5 transition-colors bg-muted text-foreground hover:placeholder-foreground/75 shadow-sm focus:outline-none ring-1 ring-border placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-primary font-medium text-sm sm:leading-6"
                          placeholder="Enter client primary contact number here..."
                          onChange={(e) => setNumber(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-colors shadow-sm hover:bg-primary/85 disabled:cursor-not-allowed disabled:opacity-75"
                  onClick={() => {
                    createClient();
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
