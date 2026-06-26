"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { Loader2, Mail, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import type { TeamMember } from "@/app/api/team/route";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TeamMembersTabProps {
  canManage: boolean;
}

export function TeamMembersTab({ canManage }: TeamMembersTabProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<TeamMember | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const loadMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/team");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to load team members.");
      }
      const data = await res.json();
      setMembers(data.members ?? []);
      setCurrentUserId(data.currentUserId ?? null);
    } catch (error) {
      toast.error("Could not load team", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  async function handleInvite(event: React.FormEvent) {
    event.preventDefault();
    if (!inviteEmail.trim()) return;

    setIsInviting(true);
    try {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send invitation.");

      toast.success("Invitation sent", {
        description: `${inviteEmail} will receive an email to join your organization.`,
      });
      setInviteEmail("");
      setInviteOpen(false);
      await loadMembers();
    } catch (error) {
      toast.error("Invite failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsInviting(false);
    }
  }

  async function handleRemove() {
    if (!removeTarget) return;

    setIsRemoving(true);
    try {
      const res = await fetch(`/api/team/members/${removeTarget.userId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to remove member.");

      toast.success(
        removeTarget.status === "pending" ? "Invitation revoked" : "Member removed"
      );
      setRemoveTarget(null);
      await loadMembers();
    } catch (error) {
      toast.error("Remove failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsRemoving(false);
    }
  }

  return (
    <>
      <Card className="border-border/80 bg-charcoal/40">
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="normal-case tracking-normal text-foreground">
              Team Members
            </CardTitle>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Manage who can access your CBAM compliance workspace.
            </p>
          </div>
          {canManage && (
            <Button onClick={() => setInviteOpen(true)} className="shrink-0 gap-2">
              <UserPlus className="h-4 w-4" />
              Invite Team Member
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : members.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No team members yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => {
                  const isSelf = member.userId === currentUserId;
                  const canRemove =
                    canManage &&
                    !isSelf &&
                    (member.status === "pending" || member.role !== "owner");

                  return (
                    <TableRow key={`${member.status}-${member.userId}`}>
                      <TableCell className="font-medium text-foreground">
                        {member.name}
                        {isSelf && (
                          <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{member.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {member.role}
                          </Badge>
                          {member.status === "pending" && (
                            <Badge
                              variant="outline"
                              className="border-amber-500/30 bg-amber-500/10 text-amber-400"
                            >
                              Pending
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(member.joinedAt), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell>
                        {canRemove && member.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => setRemoveTarget(member)}
                            aria-label={`Revoke invite for ${member.email}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        {canRemove &&
                          member.status === "active" &&
                          member.role !== "owner" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => setRemoveTarget(member)}
                              aria-label={`Remove ${member.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {!canManage && (
            <p className="mt-4 text-xs text-muted-foreground">
              Only organization owners can invite or remove team members.
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an email invitation. They will join your organization when they accept and
              create their account.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inviteEmail">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="inviteEmail"
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="pl-9"
                  required
                  disabled={isInviting}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setInviteOpen(false)}
                disabled={isInviting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isInviting}>
                {isInviting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  "Send invitation"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!removeTarget} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {removeTarget?.status === "pending" ? "Revoke invitation?" : "Remove team member?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {removeTarget?.status === "pending"
                ? `This will cancel the pending invitation for ${removeTarget?.email}.`
                : `${removeTarget?.name} will lose access to this organization's workspace.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleRemove();
              }}
              disabled={isRemoving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemoving ? "Removing…" : removeTarget?.status === "pending" ? "Revoke" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
