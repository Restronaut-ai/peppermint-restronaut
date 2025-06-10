import * as z from "zod";
import React from "react";
import { twJoin } from "tailwind-merge";
import { useQuery } from "react-query";
import { getCookie } from "cookies-next";
import TagsInput from "react-select/async-creatable";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { Dialog, Listbox, Transition, Switch } from "@headlessui/react";

import {
  XMarkIcon,
  TrashIcon,
  CheckIcon,
  PlusCircleIcon,
  CheckCircleIcon,
  ChevronUpDownIcon,
  EyeIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/20/solid";

import { useUser } from "../store/session";
import { toast } from "@/shadcn/hooks/use-toast";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "de", label: "German" },
  { value: "se", label: "Swedish" },
  { value: "es", label: "Spanish" },
  { value: "no", label: "Norwegian" },
  { value: "fr", label: "French" },
  { value: "tl", label: "Tagalog" },
  { value: "da", label: "Danish" },
  { value: "pt", label: "Portuguese" },
  { value: "it", label: "Italiano" },
  { value: "he", label: "Hebrew" },
  { value: "tr", label: "Turkish" },
  { value: "hu", label: "Hungarian" },
  { value: "th", label: "Thai (ภาษาไทย)" },
  { value: "zh-CN", label: "Simplified Chinese (简体中文)" },
] as const;

const requiredString = (message: string) =>
  z.string({ message }).trim().min(1, message);

const formSchema = z.object({
  name: requiredString("Please enter the user's full name."),
  email: requiredString("Please enter the email address of user.").email(
    "Please enter a valid email address"
  ),
  password: requiredString("Please enter a new password.").optional(),
  language: requiredString("Please select a language."),
  isAdmin: z.boolean().default(false),
});

type FormSchema = z.infer<typeof formSchema>;

type UserInfoFormProps = {
  clientId: string;
  refetch: () => void;
  type?: "add" | "update";
  user?: FormSchema & { id: string };
};

const fetchTagsForClient = async (clientId: string) => {
  if (!clientId) return [];

  const res = await fetch(`/api/v1/tags/${clientId}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getCookie("session")}`,
    },
  });

  if (!res.ok) return [];
  const json = await res.json();

  if (!json?.tags) return [];
  return json.tags.map((t) => ({ label: t.value, value: t.id }));
};

export function UserInfoForm({
  user,
  refetch,
  clientId,
  type = "add",
}: UserInfoFormProps) {
  const { user: currentUser } = useUser();
  const [open, setOpen] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | undefined>();

  const {
    reset,
    watch,
    control,
    register,
    setValue,
    setError,
    formState,
    handleSubmit,
  } = useForm<FormSchema>({
    mode: "onChange",
    defaultValues: user,
    resolver: zodResolver(formSchema),
  });

  const values = watch();

  const {
    data: tags,
    refetch: refetchTags,
    isFetching: isTagsFetching,
  } = useQuery({
    enabled: !!clientId,
    queryKey: ["tags", clientId],
    queryFn: () => fetchTagsForClient(clientId),
  });

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center px-2.5 py-1.5 border font-semibold border-border shadow-sm text-xs rounded bg-muted hover:bg-muted/85 hover:text-foreground text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
      >
        {type === "add" ? "Add new user" : "Update"}
      </button>

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
                {type} User
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

            <form
              className="grid gap-4 p-4 sm:p-6"
              onSubmit={handleSubmit(async function (data) {
                setErrorMessage(null);

                try {
                  if (type === "add") {
                    const res = await fetch(`/api/v1/auth/user/register`, {
                      method: "POST",
                      body: JSON.stringify(data),
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${getCookie("session")}`,
                      },
                    });
                    if (res.ok) {
                      reset();
                      setOpen(false);
                      await refetch?.();
                      toast({
                        description: "A new user was created successfully!",
                      });
                    } else {
                      const json = await res.json();
                      throw new Error(json.message);
                    }
                  } else if (type === "update" && user) {
                    const res = await fetch(`/api/v1/auth/${user.id}`, {
                      method: "PUT",
                      body: JSON.stringify(data),
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${getCookie("session")}`,
                      },
                    });

                    if (res.ok) {
                      await refetch?.();
                      toast({
                        description: "User information updated successfully!",
                      });
                    } else {
                      const json = await res.json();
                      throw new Error(json.message);
                    }
                  }
                } catch (err) {
                  const message = err.message ?? "Something went wrong.";
                  setErrorMessage(err.message);
                  toast({ variant: "destructive", description: err.message });
                }
              })}
            >
              {errorMessage ? (
                <div className="bg-destructive text-destructive-foreground w-full p-4 text-base rounded-md flex items-center gap-4">
                  <ExclamationTriangleIcon className="size-8 shrink-0" />
                  <div className="flex flex-col">
                    <h1 className="text-base font-semibold">Oops!</h1>
                    <span className="font-medium text-sm text-destructive-foreground/75">
                      {errorMessage}
                    </span>
                  </div>
                </div>
              ) : null}

              <strong className="text-foreground/85">User Information</strong>
              <div className="grid gap-2">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium leading-6 text-foreground/75 select-none"
                >
                  Name<sup className="text-destructive">*</sup>
                </label>

                <input
                  id="name"
                  type="text"
                  placeholder="Eg: John Doe"
                  {...register("name", { required: true })}
                  aria-invalid={formState.errors.name ? true : undefined}
                  className="block w-3/4 rounded-md border-none px-4 py-1.5 transition-colors bg-muted text-foreground hover:placeholder-foreground/75 shadow-sm focus:outline-none ring-1 ring-border placeholder:text-muted-foreground aria-invalid:bg-destructive/50 focus:ring-2 focus:ring-inset focus:ring-primary font-medium text-sm sm:leading-6"
                />
                {formState.errors.name ? (
                  <small className="text-destructive">
                    {formState.errors.name.message}
                  </small>
                ) : null}
              </div>

              <div className="grid gap-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium leading-6 text-foreground/75 select-none"
                >
                  Email Address<sup className="text-destructive">*</sup>
                </label>

                <input
                  id="email"
                  type="email"
                  placeholder="Eg: johndoe@restronaut.ai"
                  {...register("email", { required: true })}
                  aria-invalid={formState.errors.email ? true : undefined}
                  className="block w-full rounded-md border-none px-4 py-1.5 transition-colors bg-muted text-foreground hover:placeholder-foreground/75 shadow-sm focus:outline-none ring-1 ring-border placeholder:text-muted-foreground aria-invalid:bg-destructive/30 focus:ring-2 focus:ring-inset focus:ring-primary font-medium text-sm sm:leading-6"
                />
                {formState.errors.email ? (
                  <small className="text-destructive">
                    {formState.errors.email.message}
                  </small>
                ) : null}
              </div>

              <div className="mt-4">
                <strong className="text-foreground/85">Account Settings</strong>
              </div>

              {type === "add" && (
                <div className="grid gap-2">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium leading-6 text-foreground/75 select-none"
                  >
                    Password<sup className="text-destructive">*</sup>
                  </label>

                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      {...register("password", { required: true })}
                      aria-invalid={
                        formState.errors.password ? true : undefined
                      }
                      className="block w-full rounded-md border-none px-4 py-1.5 transition-colors bg-muted text-foreground hover:placeholder-foreground/75 shadow-sm focus:outline-none ring-1 ring-border placeholder:text-muted-foreground aria-invalid:bg-destructive/30 focus:ring-2 focus:ring-inset focus:ring-primary font-medium text-sm sm:leading-6"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="absolute right-0 -translate-y-1/2 top-1/2 text-muted-foreground hover:text-foreground transition-colors p-3 [&_svg]:size-5"
                      onClick={() => setShowPassword((v) => !v)}
                    >
                      {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  {formState.errors.password ? (
                    <small className="text-destructive">
                      {formState.errors.password.message}
                    </small>
                  ) : null}
                </div>
              )}

              <Listbox
                value={values.language}
                onChange={(v) => setValue("language", v)}
              >
                {({ open }) => (
                  <div className="grid gap-1">
                    <Listbox.Label className="text-sm font-medium text-foreground/75">
                      Language<sup className="text-destructive">*</sup>
                    </Listbox.Label>
                    <div className="relative">
                      <Listbox.Button className="relative w-full cursor-default rounded-md bg-muted text-muted-foreground py-1.5 pl-4 pr-10 text-left shadow-sm ring-1 ring-inset ring-border font-medium text-sm">
                        <span className="block truncate">
                          {LANGUAGES.find((l) => l.value === values.language)
                            ?.label ?? "Select a language."}
                        </span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                          <ChevronUpDownIcon className="h-5 w-5" />
                        </span>
                      </Listbox.Button>
                      <Transition show={open} as={React.Fragment}>
                        <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-background p-1 shadow-lg ring-2 ring-border !outline-none text-sm">
                          {LANGUAGES.map((lang) => (
                            <Listbox.Option
                              key={lang.value}
                              value={lang.value}
                              className={({ active }) =>
                                twJoin(
                                  active
                                    ? "bg-muted text-primary"
                                    : "text-muted-foreground",
                                  "relative cursor-default select-none py-2 pl-3 pr-9 rounded-md"
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
                                      "block truncate"
                                    )}
                                  >
                                    {lang.label}
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
                    {formState.errors.language && (
                      <small className="text-xs font-medium text-destructive">
                        {formState.errors.language.message}
                      </small>
                    )}
                  </div>
                )}
              </Listbox>

              {currentUser.isAdmin && (
                <div className="grid gap-2">
                  <label
                    htmlFor="isAdmin"
                    className="block text-sm font-medium leading-6 text-foreground/75 select-none"
                  >
                    Is Admin
                  </label>

                  <Switch
                    id="isAdmin"
                    checked={values.isAdmin}
                    onChange={(v) => setValue("isAdmin", v)}
                    className="group relative inline-flex h-6 w-12 items-center rounded-full ring-[3px] bg-muted ring-border
                  aria-checked:ring-primary aria-checked:bg-primary !outline-none !border-0 transition-colors duration-200"
                  >
                    <span className="sr-only">Is Admin</span>
                    <span
                      className="
                          absolute left-0 h-6 w-6 transform rounded-full bg-background transition-all duration-200
                          group-active:w-9 group-aria-checked:right-0 group-aria-checked:left-auto"
                    />
                  </Switch>
                </div>
              )}

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={formState.isSubmitting}
                  className="capitalize rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-colors shadow-sm hover:bg-primary/85 disabled:cursor-not-allowed disabled:opacity-75"
                >
                  {formState.isSubmitting ? "Loading..." : `${type} user`}
                </button>
              </div>
            </form>
          </Transition.Child>
        </Dialog>
      </Transition.Root>
    </div>
  );
}
