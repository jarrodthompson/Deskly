import type { TicketEventType } from "@prisma/client";
import { STATUS_META, PRIORITY_META } from "@/lib/ticket-meta";
import {
  Plus,
  RefreshCw,
  Flag,
  UserCheck,
  UsersRound,
  FolderInput,
  MessageSquareText,
  MessageCircle,
  Reply,
  Paperclip,
  ArrowUpCircle,
  GitMerge,
  Link2,
  CheckCircle2,
  RotateCcw,
  Archive,
  Tag,
  TagIcon,
  PauseCircle,
  PlayCircle,
  type LucideIcon,
} from "lucide-react";

function statusLabel(value: string | null) {
  return value && value in STATUS_META ? STATUS_META[value as keyof typeof STATUS_META].label : value;
}
function priorityLabel(value: string | null) {
  return value && value in PRIORITY_META ? PRIORITY_META[value as keyof typeof PRIORITY_META].label : value;
}

export function describeEvent(event: {
  type: TicketEventType;
  actorUser: { name: string } | null;
  fromValue: string | null;
  toValue: string | null;
}): { text: string; icon: LucideIcon } {
  const actor = event.actorUser?.name ?? "System";

  switch (event.type) {
    case "CREATED":
      return { text: `${actor} created this ticket`, icon: Plus };
    case "STATUS_CHANGED":
      return { text: `${actor} changed status from ${statusLabel(event.fromValue)} to ${statusLabel(event.toValue)}`, icon: RefreshCw };
    case "PRIORITY_CHANGED":
      return { text: `${actor} changed priority from ${priorityLabel(event.fromValue)} to ${priorityLabel(event.toValue)}`, icon: Flag };
    case "AGENT_ASSIGNED":
      return { text: event.toValue ? `${actor} assigned this ticket` : `${actor} unassigned this ticket`, icon: UserCheck };
    case "TEAM_CHANGED":
      return { text: `${actor} changed the assigned team`, icon: UsersRound };
    case "CATEGORY_CHANGED":
      return { text: `${actor} changed the category`, icon: FolderInput };
    case "NOTE_ADDED":
      return { text: `${actor} added an internal note`, icon: MessageSquareText };
    case "CUSTOMER_REPLIED":
      return { text: `Customer replied`, icon: MessageCircle };
    case "AGENT_REPLIED":
      return { text: `${actor} replied to the customer`, icon: Reply };
    case "ATTACHMENT_UPLOADED":
      return { text: `${actor} uploaded an attachment`, icon: Paperclip };
    case "ESCALATED":
      return { text: `${actor} escalated this ticket`, icon: ArrowUpCircle };
    case "MERGED":
      return { text: `${actor} merged this ticket`, icon: GitMerge };
    case "LINKED":
      return { text: `${actor} linked a related ticket`, icon: Link2 };
    case "RESOLVED":
      return { text: `${actor} marked this ticket resolved`, icon: CheckCircle2 };
    case "REOPENED":
      return { text: `${actor} reopened this ticket`, icon: RotateCcw };
    case "CLOSED":
      return { text: `${actor} closed this ticket`, icon: Archive };
    case "TAG_ADDED":
      return { text: `${actor} added a tag`, icon: Tag };
    case "TAG_REMOVED":
      return { text: `${actor} removed a tag`, icon: TagIcon };
    case "SLA_PAUSED":
      return { text: `SLA paused`, icon: PauseCircle };
    case "SLA_RESUMED":
      return { text: `SLA resumed`, icon: PlayCircle };
    default:
      return { text: `${actor} updated the ticket`, icon: RefreshCw };
  }
}
