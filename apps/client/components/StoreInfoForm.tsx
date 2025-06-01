import * as z from "zod";
import { getCookie } from "cookies-next";
import TagsInput from "react-select/async-creatable";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, Transition } from "@headlessui/react";
import { useFieldArray, useForm } from "react-hook-form";
import React, { Fragment, useEffect, useState } from "react";

import {
  XMarkIcon,
  TrashIcon,
  PlusCircleIcon,
} from "@heroicons/react/20/solid";

import { toast } from "@/shadcn/hooks/use-toast";
import { useQuery } from "react-query";

const requiredString = (message: string) =>
  z.string({ message }).trim().min(1, message);

const formSchema = z.object({
  name: requiredString("Please provide the name of the store."),
  address: requiredString("Please enter the address of the store."),
  manager: requiredString("Please enter the name of the store's manager."),
  email: requiredString(
    "Please enter the email address of the store's manager.",
  ).email("Please enter a valid email address"),
  phone: requiredString(
    "Please enter the phone number of the store's manager.",
  ),
  tags: z.array(requiredString("Please provide a valid tag.")).optional(),
  notes: z.array(z.string())
});

type FormSchema = z.infer<typeof formSchema>;

type StoreInfoFormProps = {
  clientId: string;
  refetch: () => void;
  type?: "add" | "update";
  store?: FormSchema & { id: string };
};

const fetchTagsForClient = async (clientId: string) => {
  if (!clientId) return [];

  const res = await fetch(`/api/v1/tags/${clientId}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getCookie("session")}`,
    },
  });

  if(!res.ok) return [];
  const json = await res.json();

  if(!json?.tags) return [];
  return json.tags.map(t => ({ label: t.value, value: t.id }));
};

export function StoreInfoForm({
  store,
  refetch,
  clientId,
  type = "add",
}: StoreInfoFormProps) {
  const [open, setOpen] = useState(false);
  const [isCreatingTag, setIsCreatingTag] = useState(false);

  const {
    reset,
    watch,
    control,
    register,
    setValue,
    formState,
    handleSubmit
  } = useForm<FormSchema>({
      mode: "onChange",
      resolver: zodResolver(formSchema),
      defaultValues: {
        ...store,
        notes: store?.notes,
        tags: store?.tags?.map((t: any) => t.id),
      },
    });

  const {
    data: tags,
    refetch: refetchTags,
    isFetching: isTagsFetching,
  } = useQuery({
    enabled: !!clientId,
    queryKey: ["tags", clientId],
    queryFn: () => fetchTagsForClient(clientId),
  });

  const { fields, append, remove } = useFieldArray({
    control,
    // @ts-expect-error
    name: "notes",
  });

  useEffect(() => {
    if(!store?.notes?.length) append("");
  }, []);

  const tagIds = watch().tags;
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center px-2.5 py-1.5 border font-semibold border-border shadow-sm text-xs rounded bg-muted hover:bg-muted/85 hover:text-foreground text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
      >
        {type === "add" ? "Add new store" : "Update"}
      </button>

      <Transition.Root show={open} as={Fragment}>
        <Dialog className="fixed inset-0 overflow-hidden" onClose={() => setOpen(false)}>

           <Transition.Child
              as={Dialog.Overlay}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
                className="fixed inset-0 bg-black/20 backdrop-blur-sm transition-all" />
            

           
              <Transition.Child
                  enter="ease-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                  className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background rounded-lg w-full sm:max-w-lg h-full sm:max-h-[90%] overflow-auto text-left shadow-xl transition-all">

                  <div className="px-4 sm:px-6 py-4 sticky top-0 bg-background/85 backdrop-blur-sm flex items-center justify-between border-b border-border">
                     
                    <Dialog.Title
                      as="h3"
                      className="capitalize text-lg leading-6 font-medium text-foreground"
                    >
                      {type} Store
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
                    try {
                      const response = await fetch(
                        type === "add"
                          ? `/api/v1/clients/${clientId}/stores`
                          : `/api/v1/clients/${clientId}/stores/${store.id}`,
                        {
                          method: type === "add" ? "POST" : "PATCH",
                          body: JSON.stringify(data),
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${getCookie("session")}`,
                          },
                        },
                      );
                      if (!response.ok) throw "";
                      toast({
                        title: `Store ${type === "add" ? "added" : "updated"!}`,
                        description:
                          type === "add"
                            ? "A new store has been added to the list."
                            : "Store details updated successfully.",
                      });

                      await refetch?.();

                      if (type === "add") {
                        reset();
                        setOpen(false);
                      }
                    } catch {
                      toast({
                        title: "Oops!",
                        variant: "destructive",
                        description: `Something went wrong while trying to ${type} store.`,
                      });
                    }
                  })}
                >
                  <strong className="text-foreground/85">
                    Store Information
                  </strong>
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
                      placeholder="Enter store name here."
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
                      htmlFor="address"
                      className="block text-sm font-medium leading-6 text-foreground/75 select-none"
                    >
                      Address<sup className="text-destructive">*</sup>
                    </label>

                    <input
                      type="text"
                      id="address"
                      placeholder="Enter store address here."
                      {...register("address", { required: true })}
                      aria-invalid={formState.errors.address ? true : undefined}
                      className="block w-full rounded-md border-none px-4 py-1.5 transition-colors bg-muted text-foreground hover:placeholder-foreground/75 shadow-sm focus:outline-none ring-1 ring-border placeholder:text-muted-foreground aria-invalid:bg-destructive/30 focus:ring-2 focus:ring-inset focus:ring-primary font-medium text-sm sm:leading-6"
                    />
                    {formState.errors.address ? (
                      <small className="text-destructive">
                        {formState.errors.address.message}
                      </small>
                    ) : null}
                  </div>

                  <div className="mt-4">
                    <strong className="text-foreground/85">
                      Manager Information
                    </strong>
                  </div>

                  <div className="grid gap-2">
                    <label
                      htmlFor="manager"
                      className="block text-sm font-medium leading-6 text-foreground/75 select-none"
                    >
                      Manager's Name<sup className="text-destructive">*</sup>
                    </label>

                    <input
                      required
                      type="text"
                      id="manager"
                      {...register("manager", { required: true })}
                      aria-invalid={formState.errors.manager ? true : undefined}
                      className="block w-full rounded-md border-none px-4 py-1.5 transition-colors bg-muted text-foreground hover:placeholder-foreground/75 shadow-sm focus:outline-none ring-1 ring-border placeholder:text-muted-foreground aria-invalid:bg-destructive/30 focus:ring-2 focus:ring-inset focus:ring-primary font-medium text-sm sm:leading-6"
                      placeholder="Enter store manager's name here."
                    />
                    {formState.errors.manager ? (
                      <small className="text-destructive">
                        {formState.errors.manager.message}
                      </small>
                    ) : null}
                  </div>

                  <div className="grid gap-2">
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium leading-6 text-foreground/75 select-none"
                    >
                      Manager's Phone Number
                      <sup className="text-destructive">*</sup>
                    </label>

                    <input
                      required
                      type="tel"
                      id="phone"
                      {...register("phone", { required: true })}
                      aria-invalid={formState.errors.phone ? true : undefined}
                      className="block w-full rounded-md border-none px-4 py-1.5 transition-colors bg-muted text-foreground hover:placeholder-foreground/75 shadow-sm focus:outline-none ring-1 ring-border placeholder:text-muted-foreground aria-invalid:bg-destructive/30 focus:ring-2 focus:ring-inset focus:ring-primary font-medium text-sm sm:leading-6"
                      placeholder="Enter store manager's phone number here."
                    />
                    {formState.errors.phone ? (
                      <small className="text-destructive">
                        {formState.errors.phone.message}
                      </small>
                    ) : null}
                  </div>

                  <div className="grid gap-2">
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium leading-6 text-foreground/75 select-none"
                    >
                      Manager's Email Address
                      <sup className="text-destructive">*</sup>
                    </label>

                    <input
                      required
                      id="email"
                      type="email"
                      {...register("email", { required: true })}
                      aria-invalid={formState.errors.email ? true : undefined}
                      className="block w-full rounded-md border-none px-4 py-1.5 transition-colors bg-muted text-foreground hover:placeholder-foreground/75 shadow-sm focus:outline-none ring-1 ring-border placeholder:text-muted-foreground aria-invalid:bg-destructive/30 focus:ring-2 focus:ring-inset focus:ring-primary font-medium text-sm sm:leading-6"
                      placeholder="Enter store manager's email address here."
                    />

                    {formState.errors.email ? (
                      <small className="text-destructive">
                        {formState.errors.email.message}
                      </small>
                    ) : null}
                  </div>

                  <div className="mt-4">
                    <strong className="text-foreground/85">
                      Additional Information
                    </strong>
                  </div>

                  <div className="grid gap-2">
                    <label
                      htmlFor="tags"
                      className="block text-sm font-medium leading-6 text-foreground/75 select-none"
                    >
                      Tags (Optional)
                    </label>

                    <TagsInput
                      isMulti
                      isClearable
                      inputId="tags"
                      defaultOptions
                      value={tagIds?.map(id => {
                        if(!tags?.length) return undefined;
                        return tags.find(t => t.value === id);
                      })}
                      createOptionPosition="first"
                      isLoading={isCreatingTag || isTagsFetching}
                      loadOptions={async function(input) {
                        if(!tags) return [];
                        return tags.filter(tag => {
                          return tag.label.toLowerCase().includes(input.toLowerCase());
                        });
                      }}
                      onChange={(tags) => {
                        const newTagIds = tags.map(tag => tag.value).filter(Boolean);
                        setValue("tags", newTagIds, { shouldTouch: true, shouldDirty: true });
                      }}
                      onCreateOption={async (value) => {
                        try {
                          setIsCreatingTag(true);
                          const response = await fetch(
                            `/api/v1/tags/${clientId}`,
                            {
                              method: "POST",
                              body: JSON.stringify({ value }),
                              headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${getCookie("session")}`,
                              },
                            },
                          );
                          if (!response.ok) throw "";

                          await refetchTags();
                          const json = await response.json();

                          setValue("tags", [json.tag.id, ...[tagIds??[]]], {
                            shouldDirty: true,
                            shouldTouch: true
                          });

                          toast({
                            title: "Tag created!",
                            description: `A new tag \`${value}\` is created successfully.`,
                          });
                        } catch(err) {
                          toast({
                            title: "Oops!",
                            variant: "destructive",
                            description: `Couldn't create the tag \`${value}\` at the moment.`,
                          });
                        } finally {
                          setIsCreatingTag(false);
                        }
                      }}
                      placeholder="Enter or create tags (if needed)"
                      classNames={{
                        control: ({ isFocused }) =>
                          `!text-sm !font-medium !bg-muted !border-none ${isFocused ? "!ring-2 ring-primary" : "!cursor-text !ring-1 !ring-border"}`,
                        menu: () =>
                          "!bg-background !text-foreground/85 !border-2 !border-border !shadow-sm !rounded-md",
                        menuList: () => "!bg-background !p-1 !rounded-md !max-h-full !overflow-auto",
                        option: ({ isFocused, isDisabled }) =>
                          `rounded-md !text-foreground/85 !text-sm !font-semibold ${isFocused ? "!bg-muted !text-foreground" : "!bg-background !text-foreground/85"} ${isDisabled ? "!cursor-not-allowed !opacity-70" : ""}`,
                        placeholder: () =>
                          "transition-all group-hover:text-foreground/85",
                        indicatorSeparator: () => "!hidden",
                        input: ({ value }) =>
                          `!text-sm !font-medium ${value ? "ring-1 ring-border bg-background px-1" : ""} rounded-md py-0 !max-w-fit [&_input]:!max-w-fit [&_input]:bg-transparent [&_input]:!border-0 [&_input]:rounded-md [&_input]:!ring-0`,
                        dropdownIndicator: () => "!hidden",
                        // multiValue: () => "!bg-background !text-foreground/85 !hover:text-foreground",
                        multiValue: ({ data }: any) =>
                          `!rounded-md !text-sm !font-medium ${data.__isNew__ ? "!bg-primary" : "!bg-foreground"}`,
                        multiValueLabel: ({ data }: any) =>
                          `!text-xs !font-medium ${data.__isNew__ ? "!text-primary-foreground" : "!text-background"}`,
                        multiValueRemove: ({ data }: any) =>
                          `!bg-transparent [&_svg]:size-4 ${data.__isNew__ ? "!text-primary-foreground/85 hover:!text-primary-foreground" : "!text-background/85 !hover:text-background"}`,
                        clearIndicator: () =>
                          `transition-all [&_svg]:text-muted-foreground hover:[&_svg]:text-destructive !cursor-pointer`,
                      }}
                    />
                  </div>

                  <div className="grid gap-2">
                    <label
                      htmlFor="notes"
                      className="block text-sm font-medium leading-6 text-foreground/75 select-none"
                    >
                      Note (Optional)
                    </label>

                    {fields.map((field, index) => (
                      <div key={field.id} className="flex items-start gap-2">
                        <textarea
                          {...register(`notes.${index}`)}
                          className="w-full min-h-16 max-h-48 field-sizing-content rounded-md border-none px-4 py-1.5 bg-muted text-foreground shadow-sm focus:outline-none ring-1 ring-border placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-primary hover:placeholder-foreground/75 text-sm"
                          placeholder={`Note ${index + 1}`}
                        />
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="text-sm text-destructive bg-background hover:bg-destructive hover:text-destructive-foreground rounded-md flex items-center justify-center shrink-0 size-8"
                        >
                          <TrashIcon className="size-5" />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => append("")}
                      className="my-2 text-sm text-foreground/85 hover:text-primary hover:bg-primary/10 hover:ring-1 hover:ring-primary/40 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background focus:outline-none py-2 rounded-md flex items-center justify-center gap-2"
                    >
                      <PlusCircleIcon className="size-4" /> Add Note
                    </button>
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={!formState.isValid || formState.isSubmitting}
                      className="capitalize rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-colors shadow-sm hover:bg-primary/85 disabled:cursor-not-allowed disabled:opacity-75"
                    >
                      {formState.isSubmitting ? "Loading..." : `${type} store`}
                    </button>
                  </div>
                </form>
              </Transition.Child>

        </Dialog>
      </Transition.Root>
    </div>
  );
}
