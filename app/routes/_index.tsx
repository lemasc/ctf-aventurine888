import { redirect, type LoaderFunctionArgs } from "react-router";
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await fetch(new URL("/api/user", request.url), request);
  if (user.status === 200) {
    return redirect("/app");
  }
  return redirect("/login");
};
