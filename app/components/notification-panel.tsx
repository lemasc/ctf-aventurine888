import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Bell, ChevronDown, ChevronUp } from "lucide-react";
import type { Notifications } from "../routes/app._index";

interface NotificationPanelProps {
  notifications: Notifications;
}

export function NotificationPanel({ notifications }: NotificationPanelProps) {
  const [showAll, setShowAll] = useState(false);

  const unread = notifications.filter((n) => !n.hasRead);
  const unreadCount = unread.length;

  const displayedNotifications = showAll ? notifications : unread;

  return (
    <Card className="bg-blue-50/70 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
        {displayedNotifications.length === 0 ? (
          <p className="text-sm text-neutral-600 text-center py-4">
            No{notifications.length !== 0 ? " new " : ""}notifications
          </p>
        ) : (
          displayedNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-3 rounded-lg ${
                notification.hasRead
                  ? "bg-white/50"
                  : "bg-white/80 border border-red-600"
              }`}
            >
              <div
                className="text-sm"
                dangerouslySetInnerHTML={{ __html: notification.content }}
              />
              <div className="text-xs text-gray-500 mt-1">
                {new Date(notification.createdAt).toLocaleString()}
              </div>
            </div>
          ))
        )}
        {unread.length !== notifications.length && notifications.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowAll(!showAll)}
            className="w-full hover:bg-white/20 text-yellow-800 hover:text-yellow-700"
          >
            {showAll ? "Hide" : "Show"} Recent Notifications
            {showAll ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
