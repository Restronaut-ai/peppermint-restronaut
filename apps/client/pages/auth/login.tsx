import { toast } from "@/shadcn/hooks/use-toast";
import { setCookie } from "cookies-next";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function Login({}) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("idle");
  const [auth, setAuth] = useState("oauth");
  const [url, setUrl] = useState("");

  async function postData() {
    try {
      await fetch(`/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
        .then((res) => res.json())
        .then(async (res) => {
          if (res.user) {
            setCookie("session", res.token);
            if (res.user.external_user) {
              router.push("/portal");
            } else {
              if (res.user.firstLogin) {
                router.push("/onboarding");
              } else {
                router.push("/");
              }
            }
          } else {
            toast({
              variant: "destructive",
              title: "Error",
              description:
                "There was an error logging in, please try again. If this issue persists, please contact support via the discord.",
            });
          }
        });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Database Error",
        description:
          "This is an issue with the database, please check the docker logs or contact support via discord.",
      });
    }
  }

  async function oidcLogin() {
    await fetch(`/api/v1/auth/check`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.url) {
          setUrl(res.url);
        }
      });
  }

  useEffect(() => {
    oidcLogin();
  }, []);

  useEffect(() => {
    if (router.query.error) {
      toast({
        variant: "destructive",
        title: "Account Error - No Account Found",
        description:
          "It looks like you have tried to use SSO with an account that does not exist. Please try again or contact your admin to get you set up first.",
      });
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 select-none">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
          Welcome to Restronaut Support
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {status === "loading" ? (
          <div className="text-center mr-4">{/* <Loader size={32} /> */}</div>
        ) : (
          <div className="bg-background py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="space-y-4">
              <div>
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
                    className="block w-full rounded-md border-none px-4 py-1.5 transition-colors bg-muted text-foreground hover:placeholder-foreground/75 shadow-sm focus:outline-none ring-1 ring-border placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-primary font-medium text-sm sm:leading-6"
                    onKeyPress={(event) => {
                      if (event.key === "Enter") {
                        postData();
                      }
                    }}
                  />
                </div>
              </div>

              <div>
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
                    placeholder="Please enter your password."
                    className="block w-full rounded-md border-none px-4 py-1.5 transition-colors bg-muted text-foreground hover:placeholder-foreground/75 shadow-sm focus:outline-none ring-1 ring-border placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-primary font-medium text-sm sm:leading-6"
                    onKeyPress={(event) => {
                      if (event.key === "Enter") {
                        postData();
                      }
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <Link
                    href="/auth/forgot-password"
                    className="font-medium text-foreground/75 hover:text-primary hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
              </div>

              <div className="flex flex-col space-y-4">
                <button
                  type="submit"
                  onClick={postData}
                  className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-colors shadow-sm hover:bg-primary/85 disabled:cursor-not-allowed disabled:opacity-75"
                >
                  Sign In
                </button>

                {url && (
                  <button
                    type="submit"
                    onClick={() => router.push(url)}
                    className="w-full flex justify-center py-2 px-4 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Sign in with OIDC
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
