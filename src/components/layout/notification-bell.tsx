"use client";

import { formatDistanceToNow } from "date-fns";
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  CheckCheck,
  CheckCircle2,
  ClipboardList,
  FileBarChart,
  Loader2,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNotifications } from "@/hooks/use-notifications";
import type { AppNotification, NotificationType } from "@/lib/notification-helpers";

const TYPE_CONFIG: Record<
  NotificationType,
  { icon: LucideIcon; color: string; bgColor: string }
> = {
  deadline: {
    icon: CalendarClock,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
  },
  supplier_data: {
    icon: Users,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
  },
  missing_supplier_data: {
    icon: AlertTriangle,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
  },
  report_ready: {
    icon: FileBarChart,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
  },
};

function NotificationItem({
  notification,
  onRead,
}: {
  notification: AppNotification;
  onRead: (id: string) => void;
}) {
  const cfg = TYPE_CONFIG[notification.type] ?? {
    icon: ClipboardList,
    color: "text-muted-foreground",
    bgColor: "bg-muted/20",
  };
  const Icon = cfg.icon;

  return (
    <button
      onClick={() => {
        if (!notification.read) onRead(notification.id);
      }}
      className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white/[0.03] ${
        !notification.read ? "bg-white/[0.02]" : ""
      }`}
    >
      {/* Icon */}
      <div
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${cfg.bgColor}`}
      >
        <Icon className={`h-4 w-4 ${cfg.color}`} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm leading-snug ${
            notification.read ? "text-muted-foreground" : "font-medium text-foreground"
          }`}
        >
          {notification.message}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground/70">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </p>
      </div>

      {/* Unread dot */}
      {!notification.read && (
        <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
      )}
    </button>
  );
}

export function NotificationBell() {
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } =
    useNotifications();

  const hasUnread = unreadCount > 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-foreground"
          aria-label={`Notifications${hasUnread ? ` — ${unreadCount} unread` : ""}`}
        >
          <Bell className="h-[18px] w-[18px]" />
          {hasUnread && (
            <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" sideOffset={8} className="w-[360px] p-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">Notifications</span>
            {hasUnread && (
              <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                {unreadCount} new
              </span>
            )}
          </div>
          {hasUnread && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void markAllAsRead()}
              className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
        </div>

        {/* List */}
        <div className="max-h-[420px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/20">
                <CheckCircle2 className="h-5 w-5 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">All caught up!</p>
              <p className="text-xs text-muted-foreground/60">
                Notifications will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onRead={(id) => void markAsRead([id])}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t border-border/60 px-4 py-2.5 text-center">
            <p className="text-[11px] text-muted-foreground/60">
              Showing last {notifications.length} notifications
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
