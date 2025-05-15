import { rpc } from "~/lib/rpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { redirect, type ClientLoaderFunctionArgs } from "react-router";
import type { Route } from "./+types/app._index";
import { TransferCreditCard } from "~/components/transfer-credit";
import { NotificationPanel } from "~/components/notification-panel";

const fetchNotifications = async () => {
  const response = await rpc.api.notifications.$get();
  if (response.status === 200) {
    const { notifications } = await response.json();
    return notifications;
  } else {
    throw new Error("Failed to fetch notifications");
  }
};

export type Notifications = Awaited<ReturnType<typeof fetchNotifications>>;

export const clientLoader = async (args: ClientLoaderFunctionArgs) => {
  const response = await rpc.api.user.$get();
  if (response.status === 200) {
    const { user } = await response.json();
    return { user, notifications: await fetchNotifications() } as const;
  } else if (response.status === 500) {
    console.error(response);
    throw new Error("Failed to load user data");
  } else {
    return redirect("/login");
  }
};

export default function DashboardPage({
  loaderData: { user, notifications },
}: Route.ComponentProps) {
  return (
    <div className="text-white p-8 pt-0">
      <div className="max-w-4xl mx-auto flex flex-col gap-8 w-full">
        <div className="flex flex-row gap-8">
          <div className="flex flex-col gap-8">
            <Card className="bg-blue-50/70 backdrop-blur-sm gap-3 w-full">
              <CardHeader>
                <CardDescription className="text-md">
                  Welcome, {user.username}
                </CardDescription>
                <CardTitle className="text-2xl">Your Balance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-4xl font-bol">
                  {user.balance.toLocaleString()} Credits
                </div>
                <div className="flex gap-4 items-center">
                  <p>Your UID is:</p>
                  <div className="text-lg bg-[#27272a] px-3 py-1 text-white rounded-md font-bold select-all">
                    {user.userId}
                  </div>
                </div>
              </CardContent>
            </Card>
            <TransferCreditCard user={user} />
          </div>
        </div>
        <NotificationPanel notifications={notifications} />
      </div>
    </div>
  );
}
