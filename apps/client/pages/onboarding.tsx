import { useRouter } from "next/router";

import { getCookie } from "cookies-next";
import Link from "next/link";
import { useUser } from "../store/session";

export default function Home() {
  const router = useRouter();

  const { user } = useUser();

  async function updateFirstLogin() {
    await fetch(`/api/v1/auth/user/${user.id}/first-login`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getCookie("session")}`,
      },
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          router.push("/");
        }
      });
  }

  return (
    <div className="bg-background">
      <div className="flex justify-center align-center h-screen items-center">
        <div className="bg-background shadow-xl rounded-lg lg:p-8 p-4 mx-4">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <h1 className="text-2xl text-foreground font-bold">
                Restronaut Support{" "}
              </h1>
              <p className="text-foreground">
                Welcome to Restronaut Support! Our ticket management and issues
                tracking system.
              </p>
            </div>
          </div>
          <div className="float-right mt-4">
            <button
              className="bg-green-500 hover:bg-green-600 text-white px-2.5 py-1.5 mr-6 text-sm font-semibold rounded-lg"
              onClick={() => updateFirstLogin()}
            >
              To Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
