import { toast } from "@/shadcn/hooks/use-toast";
import { useRouter } from "next/router";
import { useState } from "react";

export default function Login({}) {
  const router = useRouter();

  const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [language, setLanguage] = useState("en");
  const [status, setStatus] = useState("idle");

  async function postData() {
    if (password === passwordConfirm && validateEmail(email)) {
      setStatus("loading");

      const response = await fetch("/api/v1/auth/user/register/external", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          passwordConfirm,
          language,
        }),
      }).then((res) => res.json());

      if (response.success) {
        setStatus("idle");
        router.push("/auth/login");
      } else {
        setStatus("idle");
        toast({
          variant: "destructive",
          title: "Error",
          description: response.message,
        });
      }
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Passwords do not match or email is invalid",
      });
    }
  }

  return (
    <div className="min-h-screen bg-muted flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
          Create your new account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {status === "loading" ? (
          <div className="text-center mr-4">{/* <Loader size={32} /> */}</div>
        ) : (
          <div className="bg-background py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="space-y-4">
              <div className="space-y-1">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-foreground/85"
                >
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Please enter your email address."
                    className="appearance-none block w-full px-3 py-2 bg-muted border-0 ring-1 ring-border rounded-md shadow-sm placeholder-muted-foreground hover:placeholder-foreground/85 focus:outline-none focus:ring-2 focus:ring-primary font-medium text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-foreground/85"
                >
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="password"
                    required
                    onChange={(e) => setPassword(e.target.value)}
                    value={password}
                    placeholder="Please enter your password."
                    className="appearance-none block w-full px-3 py-2 bg-muted border-0 ring-1 ring-border rounded-md shadow-sm placeholder-muted-foreground hover:placeholder-foreground/85 focus:outline-none focus:ring-2 focus:ring-primary font-medium text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-foreground/85"
                >
                  Confirm Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="password"
                  required
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="Please confirm your password."
                  className="appearance-none block w-full px-3 py-2 bg-muted border-0 ring-1 ring-border rounded-md shadow-sm placeholder-muted-foreground hover:placeholder-foreground/85 focus:outline-none focus:ring-2 focus:ring-primary font-medium text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-foreground/85">
                  Language
                </label>
                <div className="mt-1 rounded-md shadow-sm flex">
                  <select
                    id="language"
                    name="language"
                    className="appearance-none block w-full px-3 py-2 bg-muted border-0 ring-1 ring-border rounded-md shadow-sm placeholder-muted-foreground hover:placeholder-foreground/85 focus:outline-none focus:ring-2 focus:ring-primary font-medium text-sm"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    <option value="en">English</option>
                    <option value="de">German</option>
                    <option value="se">Swedish</option>
                    <option value="es">Spanish</option>
                    <option value="no">Norwegian</option>
                    <option value="fr">French</option>
                    <option value="pt">Tagalong</option>
                    <option value="da">Danish</option>
                    <option value="pt">Portuguese</option>
                    <option value="it">Italiano</option>
                    <option value="he">Hebrew</option>
                    <option value="tr">Turkish</option>
                    <option value="hu">Hungarian</option>
                    <option value="th">Thai (ภาษาไทย)</option>
                    <option value="zh-CN">Simplified Chinese (简体中文)</option>
                  </select>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  onClick={postData}
                  className="w-full rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-colors shadow-sm hover:bg-primary/85 disabled:cursor-not-allowed disabled:opacity-75"
                >
                  Create Account
                </button>

                <p className="mt-2 text-sm font-medium text-muted-foreground text-center">
                  Note this form is for external users only
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
