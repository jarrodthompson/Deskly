"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CalendarIcon, Loader2, X } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { CustomerCombobox, type CustomerOption } from "@/components/tickets/customer-combobox";
import { AttachmentUploader, type UploadedFile } from "@/components/shared/attachment-uploader";
import { CustomFieldsInput, type CustomFieldDef } from "@/components/tickets/custom-fields-input";
import { createTicket } from "@/lib/actions/tickets";
import { createCustomerQuick } from "@/lib/actions/customers";
import { PRIORITY_META } from "@/lib/ticket-meta";
import { cn } from "cn";

type Option = { id: string; name: string };
type CategoryOption = Option & { subcategories: Option[] };

export function CreateTicketForm({
  customers,
  companies,
  categories,
  teams,
  agents,
  tags,
  customFields,
}: {
  customers: CustomerOption[];
  companies: Option[];
  categories: CategoryOption[];
  teams: Option[];
  agents: Option[];
  tags: Option[];
  customFields: CustomFieldDef[];
}) {
  const [allCustomers, setAllCustomers] = useState(customers);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", email: "", phone: "", companyId: "" });
  const [categoryId, setCategoryId] = useState<string>("");
  const [subcategoryId, setSubcategoryId] = useState<string>("");
  const [priority, setPriority] = useState("MEDIUM");
  const [teamId, setTeamId] = useState<string>("");
  const [agentId, setAgentId] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const selectedCustomer = allCustomers.find((c) => c.id === customerId);

  async function handleCreateCustomer() {
    if (!newCustomer.name || !newCustomer.email) {
      toast.error("Name and email are required.");
      return;
    }
    try {
      const customer = await createCustomerQuick({
        name: newCustomer.name,
        email: newCustomer.email,
        phone: newCustomer.phone,
        companyId: newCustomer.companyId || null,
      });
      const companyName = companies.find((c) => c.id === customer.companyId)?.name ?? null;
      setAllCustomers((prev) => [...prev, { id: customer.id, name: customer.name, email: customer.email, companyName }]);
      setCustomerId(customer.id);
      setAddingCustomer(false);
      setNewCustomer({ name: "", email: "", phone: "", companyId: "" });
      toast.success("Customer created.");
    } catch {
      toast.error("Could not create customer. The email may already exist.");
    }
  }

  function toggleTag(id: string) {
    setSelectedTags((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      toast.error("Subject and description are required.");
      return;
    }
    if (!customerId) {
      toast.error("Please select or create a customer.");
      return;
    }
    const missingRequired = customFields.find((f) => f.required && !customFieldValues[f.id]?.trim());
    if (missingRequired) {
      toast.error(`"${missingRequired.name}" is required.`);
      return;
    }
    startTransition(async () => {
      try {
        await createTicket({
          subject,
          description,
          customerId,
          categoryId: categoryId || null,
          subcategoryId: subcategoryId || null,
          priority: priority as never,
          teamId: teamId || null,
          assignedAgentId: agentId || null,
          tagIds: selectedTags,
          dueDate: dueDate ? dueDate.toISOString() : null,
          attachments,
          customFieldValues: Object.entries(customFieldValues).map(([fieldId, value]) => ({ fieldId, value })),
        });
      } catch (err) {
        if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
        toast.error("Something went wrong creating the ticket.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <Card className="shadow-none">
          <CardHeader><CardTitle className="text-sm font-medium">Ticket details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Payment gateway returning timeout" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the issue in detail…" rows={6} required />
            </div>
            <div className="space-y-1.5">
              <Label>Attachments</Label>
              <p className="text-xs text-muted-foreground">Images, PDFs, documents, screenshots or log files (max 15MB each).</p>
              <AttachmentUploader files={attachments} onChange={setAttachments} />
            </div>
          </CardContent>
        </Card>

        {customFields.length > 0 && (
          <Card className="shadow-none">
            <CardHeader><CardTitle className="text-sm font-medium">Additional Information</CardTitle></CardHeader>
            <CardContent>
              <CustomFieldsInput
                fields={customFields}
                values={customFieldValues}
                onChange={(fieldId, value) => setCustomFieldValues((prev) => ({ ...prev, [fieldId]: value }))}
              />
            </CardContent>
          </Card>
        )}

        <Card className="shadow-none">
          <CardHeader><CardTitle className="text-sm font-medium">Customer</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {!addingCustomer ? (
              <>
                <CustomerCombobox customers={allCustomers} value={customerId} onChange={setCustomerId} onCreateNew={() => setAddingCustomer(true)} />
                {selectedCustomer && (
                  <div className="grid grid-cols-2 gap-3 text-sm rounded-lg border bg-muted/30 p-3">
                    <div><div className="text-xs text-muted-foreground">Email</div>{selectedCustomer.email}</div>
                    <div><div className="text-xs text-muted-foreground">Company</div>{selectedCustomer.companyName ?? "—"}</div>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-3 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">New customer</span>
                  <button type="button" onClick={() => setAddingCustomer(false)} className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Name</Label>
                    <Input value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email</Label>
                    <Input type="email" value={newCustomer.email} onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Phone</Label>
                    <Input value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Company</Label>
                    <Select items={{ none: "No company", ...Object.fromEntries(companies.map((c) => [c.id, c.name])) }} value={newCustomer.companyId || "none"} onValueChange={(v) => setNewCustomer({ ...newCustomer, companyId: v === "none" ? "" : v })}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No company</SelectItem>
                        {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="button" size="sm" onClick={handleCreateCustomer}>Save customer</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="shadow-none">
          <CardHeader><CardTitle className="text-sm font-medium">Classification</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select items={Object.fromEntries(Object.entries(PRIORITY_META).map(([k, m]) => [k, m.label]))} value={priority} onValueChange={setPriority}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_META).map(([key, meta]) => <SelectItem key={key} value={key}>{meta.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select items={{ none: "Uncategorized", ...Object.fromEntries(categories.map((c) => [c.id, c.name])) }} value={categoryId || "none"} onValueChange={(v) => { setCategoryId(v === "none" ? "" : v); setSubcategoryId(""); }}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Uncategorized</SelectItem>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {selectedCategory && selectedCategory.subcategories.length > 0 && (
              <div className="space-y-1.5">
                <Label>Subcategory</Label>
                <Select items={{ none: "None", ...Object.fromEntries(selectedCategory.subcategories.map((s) => [s.id, s.name])) }} value={subcategoryId || "none"} onValueChange={(v) => setSubcategoryId(v === "none" ? "" : v)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {selectedCategory.subcategories.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <button type="button" key={tag.id} onClick={() => toggleTag(tag.id)}>
                    <Badge variant={selectedTags.includes(tag.id) ? "default" : "outline"} className={cn(selectedTags.includes(tag.id) && "bg-cyan-600 text-white")}>
                      {tag.name}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader><CardTitle className="text-sm font-medium">Assignment</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>Team</Label>
              <Select items={{ none: "Unassigned", ...Object.fromEntries(teams.map((t) => [t.id, t.name])) }} value={teamId || "none"} onValueChange={(v) => setTeamId(v === "none" ? "" : v)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {teams.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Agent</Label>
              <Select items={{ none: "Unassigned", ...Object.fromEntries(agents.map((a) => [a.id, a.name])) }} value={agentId || "none"} onValueChange={(v) => setAgentId(v === "none" ? "" : v)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {agents.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger render={<Button type="button" variant="outline" className="w-full justify-start font-normal" />}>
                  <CalendarIcon className="size-4" />
                  {dueDate ? format(dueDate, "PPP") : <span className="text-muted-foreground">No due date</span>}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={dueDate} onSelect={setDueDate} />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={isPending} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white">
          {isPending && <Loader2 className="size-4 animate-spin" />}
          Create Ticket
        </Button>
      </div>
    </form>
  );
}
