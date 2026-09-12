"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TicketDetailHeader } from "@/components/tickets/detail/header";
import { ConversationPanel } from "@/components/tickets/detail/conversation-panel";
import { ActivityTimeline } from "@/components/tickets/detail/activity-timeline";
import { TicketDetailSidebar } from "@/components/tickets/detail/sidebar";
import { TicketPickerDialog } from "@/components/tickets/detail/ticket-picker-dialog";
import { CustomFieldsCard } from "@/components/tickets/detail/custom-fields-card";
import { linkTicket, mergeTicket } from "@/lib/actions/tickets";
import type { TicketDetail } from "@/lib/ticket-detail";
import type { CustomFieldType } from "@prisma/client";

type Option = { id: string; name: string };
type CustomFieldOption = { id: string; name: string; fieldType: CustomFieldType; options: string[] };

export function TicketWorkspace({
  ticket,
  customerTicketCount,
  agents,
  teams,
  allTags,
  customFields,
}: {
  ticket: TicketDetail;
  customerTicketCount: number;
  agents: Option[];
  teams: Option[];
  allTags: Option[];
  customFields: CustomFieldOption[];
}) {
  const [mergeOpen, setMergeOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);

  const entries = [
    ...ticket.messages.map((m) => ({
      id: m.id,
      kind: "message" as const,
      createdAt: m.createdAt,
      authorType: m.authorType,
      authorName: m.authorUser?.name ?? m.authorCustomer?.name ?? "System",
      authorAvatar: m.authorUser?.avatarUrl ?? m.authorCustomer?.avatarUrl ?? null,
      body: m.body,
      attachments: m.attachments,
    })),
    ...ticket.notes.map((n) => ({
      id: n.id,
      kind: "note" as const,
      createdAt: n.createdAt,
      authorName: n.author.name,
      authorAvatar: n.author.avatarUrl,
      body: n.body,
      attachments: n.attachments,
    })),
  ];

  const linkedTickets = [
    ...ticket.linksFrom.map((l) => l.linkedTicket),
    ...ticket.linksTo.map((l) => l.ticket),
  ];

  return (
    <div className="flex flex-col h-[calc(100svh-4rem)]">
      <TicketDetailHeader
        ticketId={ticket.id}
        number={ticket.number}
        subject={ticket.subject}
        status={ticket.status}
        priority={ticket.priority}
        onOpenMerge={() => setMergeOpen(true)}
        onOpenLink={() => setLinkOpen(true)}
      />

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-0 lg:gap-4 overflow-hidden">
        <div className="lg:col-span-2 flex flex-col min-h-0 border-r">
          <Tabs defaultValue="conversation" className="flex flex-col h-full">
            <div className="px-4 md:px-5 pt-3">
              <TabsList>
                <TabsTrigger value="conversation">Conversation</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="conversation" className="flex-1 min-h-0">
              <ConversationPanel ticketId={ticket.id} entries={entries} agents={agents} />
            </TabsContent>
            <TabsContent value="activity" className="flex-1 min-h-0 overflow-y-auto">
              <ActivityTimeline events={ticket.events} />
            </TabsContent>
          </Tabs>
        </div>

        <div className="overflow-y-auto p-4 md:p-5">
          <TicketDetailSidebar
            ticketId={ticket.id}
            number={ticket.number}
            customer={ticket.customer}
            customerTicketCount={customerTicketCount}
            category={ticket.category?.name ?? null}
            subcategory={ticket.subcategory?.name ?? null}
            source={ticket.source}
            createdAt={ticket.createdAt}
            updatedAt={ticket.updatedAt}
            tags={ticket.tags.map((t) => t.tag)}
            allTags={allTags}
            assignedAgentId={ticket.assignedAgentId}
            teamId={ticket.teamId}
            agents={agents}
            teams={teams}
            firstResponseDueAt={ticket.firstResponseDueAt}
            resolutionDueAt={ticket.resolutionDueAt}
            firstResponseSla={ticket.firstResponseSla}
            resolutionSla={ticket.resolutionSla}
            slaPolicyName={ticket.slaPolicy?.name ?? null}
            linkedTickets={linkedTickets}
          />
          <div className="mt-4">
            <CustomFieldsCard
              ticketId={ticket.id}
              fields={customFields}
              values={Object.fromEntries(ticket.customFieldValues.map((v) => [v.fieldId, v.value]))}
            />
          </div>
        </div>
      </div>

      <TicketPickerDialog
        open={linkOpen}
        onOpenChange={setLinkOpen}
        title="Link related ticket"
        description="Search for a ticket to link as related to this one."
        excludeTicketId={ticket.id}
        confirmLabel="Link ticket"
        onConfirm={(id) => linkTicket(ticket.id, id)}
      />
      <TicketPickerDialog
        open={mergeOpen}
        onOpenChange={setMergeOpen}
        title="Merge into another ticket"
        description="This ticket will be closed and marked as merged into the selected ticket."
        excludeTicketId={ticket.id}
        confirmLabel="Merge ticket"
        onConfirm={(id) => mergeTicket(ticket.id, id)}
      />
    </div>
  );
}
