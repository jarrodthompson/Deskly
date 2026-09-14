import "dotenv/config";
import { PrismaClient, TicketPriority, TicketStatus, MessageAuthorType, TicketEventType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PERMISSIONS, ROLE_META, ROLE_PERMISSIONS, STAFF_ROLES } from "../src/lib/rbac";
import { DEFAULT_SLA_RULES, computeDueDates, computeSlaState, findRule } from "../src/lib/sla";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEMO_PASSWORD = "Helpdesk2026!";

function daysAgo(n: number, hour = 9) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
  return d;
}

function hoursAfter(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

async function main() {
  console.log("Seeding roles & permissions...");
  const permissionRecords = await Promise.all(
    PERMISSIONS.map((p) =>
      prisma.permission.upsert({
        where: { key: p.key },
        update: { category: p.category, description: p.description },
        create: { key: p.key, category: p.category, description: p.description },
      })
    )
  );
  const permByKey = new Map(permissionRecords.map((p) => [p.key, p.id]));

  for (const roleKey of STAFF_ROLES) {
    const role = await prisma.role.upsert({
      where: { key: roleKey },
      update: { name: ROLE_META[roleKey].name, description: ROLE_META[roleKey].description },
      create: { key: roleKey, name: ROLE_META[roleKey].name, description: ROLE_META[roleKey].description },
    });
    for (const permKey of ROLE_PERMISSIONS[roleKey]) {
      const permissionId = permByKey.get(permKey);
      if (!permissionId) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId } },
        update: {},
        create: { roleId: role.id, permissionId },
      });
    }
  }

  console.log("Seeding teams...");
  const teamDefs = [
    { name: "Technical Support", description: "Product, platform and technical troubleshooting" },
    { name: "Billing", description: "Invoicing, subscriptions and payment methods" },
    { name: "Payments", description: "Payment gateway, transactions and refunds" },
    { name: "Customer Service", description: "General account and customer questions" },
    { name: "Infrastructure", description: "Servers, networking, SSL and uptime" },
  ];
  const teams = new Map<string, string>();
  for (const t of teamDefs) {
    const team = await prisma.team.upsert({
      where: { name: t.name },
      update: { description: t.description },
      create: t,
    });
    teams.set(t.name, team.id);
  }

  console.log("Seeding staff users...");
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const userDefs = [
    { name: "Grace Chen", email: "superadmin@deskly.example", role: "SUPER_ADMIN", team: "Infrastructure", status: "ONLINE", title: "VP of Support" },
    { name: "Priya Sharma", email: "admin@deskly.example", role: "ADMIN", team: null, status: "ONLINE", title: "Support Operations Admin" },
    { name: "Marcus Webb", email: "manager@deskly.example", role: "MANAGER", team: null, status: "BUSY", title: "Support Manager" },
    { name: "Sofia Martinez", email: "leader@deskly.example", role: "TEAM_LEADER", team: "Technical Support", status: "ONLINE", title: "Technical Support Team Lead" },
    { name: "Ethan Brooks", email: "agent@deskly.example", role: "AGENT", team: "Technical Support", status: "ONLINE", title: "Support Agent" },
    { name: "Noah Kim", email: "noah.kim@deskly.example", role: "AGENT", team: "Billing", status: "AWAY", title: "Billing Support Agent" },
    { name: "Ava Patel", email: "ava.patel@deskly.example", role: "AGENT", team: "Payments", status: "ONLINE", title: "Payments Support Agent" },
    { name: "Liam O'Connor", email: "liam.oconnor@deskly.example", role: "AGENT", team: "Customer Service", status: "OFFLINE", title: "Customer Service Agent" },
    { name: "Daniel Osei", email: "readonly@deskly.example", role: "READ_ONLY", team: null, status: "OFFLINE", title: "Support Auditor" },
  ] as const;

  const users = new Map<string, { id: string; role: string }>();
  for (const u of userDefs) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        name: u.name,
        email: u.email,
        passwordHash,
        roleKey: u.role,
        teamId: u.team ? teams.get(u.team) : null,
        status: u.status,
        jobTitle: u.title,
      },
    });
    users.set(u.email, { id: user.id, role: u.role });
  }
  const agentPool = ["agent@deskly.example", "noah.kim@deskly.example", "ava.patel@deskly.example", "liam.oconnor@deskly.example", "leader@deskly.example"];

  console.log("Seeding categories...");
  const categoryDefs: Record<string, string[]> = {
    "Payment Integration": ["Gateway Errors", "Failed Transactions", "Refunds"],
    "Account & Access": ["Login Issues", "Password Reset", "Account Lockout"],
    "Email & Sync": ["Mailbox Sync", "Email Delivery", "Calendar Sync"],
    "Website & Checkout": ["Checkout Errors", "Cart Issues", "Page Performance"],
    "Infrastructure": ["Server Issues", "SSL Certificates", "Network/VPN"],
    "Security": ["Suspicious Activity", "Access Requests", "Vulnerability Reports"],
    "Billing": ["Invoices", "Subscription Changes", "Payment Methods"],
  };
  const categories = new Map<string, string>();
  const subcategories = new Map<string, string>();
  for (const [name, subs] of Object.entries(categoryDefs)) {
    const cat = await prisma.category.upsert({ where: { name }, update: {}, create: { name } });
    categories.set(name, cat.id);
    for (const sub of subs) {
      const s = await prisma.subcategory.upsert({
        where: { categoryId_name: { categoryId: cat.id, name: sub } },
        update: {},
        create: { name: sub, categoryId: cat.id },
      });
      subcategories.set(`${name}::${sub}`, s.id);
    }
  }

  console.log("Seeding tags...");
  const tagDefs = ["Payment Issue", "Urgent", "VIP", "Bug", "Feature Request", "Security", "Billing", "Outage"];
  const tags = new Map<string, string>();
  for (const name of tagDefs) {
    const tag = await prisma.tag.upsert({ where: { name }, update: {}, create: { name } });
    tags.set(name, tag.id);
  }

  console.log("Seeding SLA policies...");
  const standardSla = await prisma.sLAPolicy.upsert({
    where: { name: "Standard SLA" },
    update: {},
    create: { name: "Standard SLA", description: "Default policy for all customers", isDefault: true },
  });
  for (const rule of DEFAULT_SLA_RULES) {
    await prisma.sLARule.upsert({
      where: { slaPolicyId_priority: { slaPolicyId: standardSla.id, priority: rule.priority } },
      update: rule,
      create: { ...rule, slaPolicyId: standardSla.id },
    });
  }
  const enterpriseRules = [
    { priority: "CRITICAL" as TicketPriority, firstResponseMinutes: 10, resolutionMinutes: 60 },
    { priority: "URGENT" as TicketPriority, firstResponseMinutes: 20, resolutionMinutes: 120 },
    { priority: "HIGH" as TicketPriority, firstResponseMinutes: 30, resolutionMinutes: 240 },
    { priority: "MEDIUM" as TicketPriority, firstResponseMinutes: 120, resolutionMinutes: 720 },
    { priority: "LOW" as TicketPriority, firstResponseMinutes: 240, resolutionMinutes: 1440 },
  ];
  const enterpriseSla = await prisma.sLAPolicy.upsert({
    where: { name: "Enterprise SLA" },
    update: {},
    create: { name: "Enterprise SLA", description: "Faster response times for premium/enterprise accounts" },
  });
  for (const rule of enterpriseRules) {
    await prisma.sLARule.upsert({
      where: { slaPolicyId_priority: { slaPolicyId: enterpriseSla.id, priority: rule.priority } },
      update: rule,
      create: { ...rule, slaPolicyId: enterpriseSla.id },
    });
  }

  console.log("Seeding companies...");
  const companyDefs = [
    { name: "Acme Ltd", industry: "E-commerce", website: "acmeltd.com", plan: "PREMIUM", sla: enterpriseSla.id, manager: "manager@deskly.example" },
    { name: "Nimbus Cloud Systems", industry: "SaaS / Cloud Infrastructure", website: "nimbuscloud.io", plan: "ENTERPRISE", sla: enterpriseSla.id, manager: "manager@deskly.example" },
    { name: "Brightside Retail Co", industry: "Retail", website: "brightsideretail.com", plan: "STANDARD", sla: standardSla.id, manager: "admin@deskly.example" },
    { name: "Fintrust Bank", industry: "Financial Services", website: "fintrustbank.com", plan: "ENTERPRISE", sla: enterpriseSla.id, manager: "admin@deskly.example" },
    { name: "Harbor Logistics", industry: "Logistics & Freight", website: "harborlogistics.com", plan: "BASIC", sla: standardSla.id, manager: "manager@deskly.example" },
  ] as const;
  const companies = new Map<string, string>();
  for (const c of companyDefs) {
    const company = await prisma.company.upsert({
      where: { id: `seed-${c.name}` },
      update: {},
      create: {
        id: `seed-${c.name}`,
        name: c.name,
        industry: c.industry,
        website: `https://${c.website}`,
        // Reserved .example domain so demo data can never email a real mailbox.
        email: `support@${c.website.split(".")[0]}.example`,
        supportPlan: c.plan,
        slaPolicyId: c.sla,
        accountManagerId: users.get(c.manager)!.id,
      },
    });
    companies.set(c.name, company.id);
  }

  console.log("Seeding customers...");
  const customerDefs = [
    { name: "Jarrod Kim", email: "jarrod.kim@acmeltd.example", company: "Acme Ltd", phone: "+1 415 555 0142", location: "San Francisco, CA" },
    { name: "Isabella Cruz", email: "isabella.cruz@acmeltd.example", company: "Acme Ltd", phone: "+1 415 555 0198", location: "San Francisco, CA" },
    { name: "Marcus Lee", email: "marcus.lee@nimbuscloud.example", company: "Nimbus Cloud Systems", phone: "+1 206 555 0110", location: "Seattle, WA" },
    { name: "Hannah Foster", email: "hannah.foster@brightsideretail.example", company: "Brightside Retail Co", phone: "+1 312 555 0177", location: "Chicago, IL" },
    { name: "David Okafor", email: "david.okafor@fintrustbank.example", company: "Fintrust Bank", phone: "+1 212 555 0134", location: "New York, NY" },
    { name: "Elena Vasquez", email: "elena.vasquez@fintrustbank.example", company: "Fintrust Bank", phone: "+1 212 555 0189", location: "New York, NY" },
    { name: "Tom Whitfield", email: "tom.whitfield@harborlogistics.example", company: "Harbor Logistics", phone: "+1 713 555 0121", location: "Houston, TX" },
    { name: "Chloe Adams", email: "chloe.adams@mail.example", company: null, phone: "+1 480 555 0165", location: "Phoenix, AZ" },
    { name: "Ryan Mitchell", email: "ryan.mitchell@mail.example", company: null, phone: "+1 617 555 0143", location: "Boston, MA" },
    { name: "Priya Desai", email: "priya.desai@mail.example", company: null, phone: "+1 305 555 0187", location: "Miami, FL" },
  ] as const;
  const customers = new Map<string, string>();
  const customerPasswordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  for (const c of customerDefs) {
    const customer = await prisma.customer.upsert({
      where: { email: c.email },
      update: {},
      create: {
        name: c.name,
        email: c.email,
        passwordHash: customerPasswordHash,
        phone: c.phone,
        location: c.location,
        companyId: c.company ? companies.get(c.company)! : null,
      },
    });
    customers.set(c.email, customer.id);
  }
  await prisma.company.update({ where: { id: companies.get("Acme Ltd")! }, data: { primaryContactId: customers.get("jarrod.kim@acmeltd.example") } });
  await prisma.company.update({ where: { id: companies.get("Nimbus Cloud Systems")! }, data: { primaryContactId: customers.get("marcus.lee@nimbuscloud.example") } });
  await prisma.company.update({ where: { id: companies.get("Brightside Retail Co")! }, data: { primaryContactId: customers.get("hannah.foster@brightsideretail.example") } });
  await prisma.company.update({ where: { id: companies.get("Fintrust Bank")! }, data: { primaryContactId: customers.get("david.okafor@fintrustbank.example") } });
  await prisma.company.update({ where: { id: companies.get("Harbor Logistics")! }, data: { primaryContactId: customers.get("tom.whitfield@harborlogistics.example") } });

  console.log("Seeding tickets...");
  type Row = {
    subject: string;
    description: string;
    priority: TicketPriority;
    status: TicketStatus;
    category: string;
    subcategory: string;
    customer: string;
    daysAgo: number;
    tags?: string[];
  };

  const rows: Row[] = [
    { subject: "Payment gateway returning timeout", description: "Our customers are receiving a timeout error when trying to make payments through the checkout flow. This started roughly an hour ago and is affecting most transactions.", priority: "HIGH", status: "IN_PROGRESS", category: "Payment Integration", subcategory: "Gateway Errors", customer: "jarrod.kim@acmeltd.example", daysAgo: 1, tags: ["Payment Issue", "Urgent"] },
    { subject: "Customer unable to reset password", description: "A customer reports that the password reset email never arrives, even after multiple attempts and checking spam.", priority: "MEDIUM", status: "RESOLVED", category: "Account & Access", subcategory: "Password Reset", customer: "chloe.adams@mail.example", daysAgo: 12 },
    { subject: "Microsoft 365 mailbox not syncing", description: "Emails sent to our support inbox are not appearing in Outlook. Sync appears stuck as of this morning.", priority: "MEDIUM", status: "OPEN", category: "Email & Sync", subcategory: "Mailbox Sync", customer: "hannah.foster@brightsideretail.example", daysAgo: 2 },
    { subject: "Website checkout failing", description: "Multiple customers report the checkout page throws a 500 error right after entering shipping details.", priority: "CRITICAL", status: "IN_PROGRESS", category: "Website & Checkout", subcategory: "Checkout Errors", customer: "hannah.foster@brightsideretail.example", daysAgo: 0, tags: ["Bug", "Urgent"] },
    { subject: "API authentication returning 401", description: "Our integration started receiving 401 Unauthorized responses from your API this morning despite using the same API key.", priority: "HIGH", status: "NEW", category: "Infrastructure", subcategory: "Server Issues", customer: "marcus.lee@nimbuscloud.example", daysAgo: 0 },
    { subject: "VPN connection dropping", description: "Remote staff are experiencing intermittent VPN disconnects every 10-15 minutes since yesterday's maintenance window.", priority: "MEDIUM", status: "PENDING_CUSTOMER", category: "Infrastructure", subcategory: "Network/VPN", customer: "tom.whitfield@harborlogistics.example", daysAgo: 3 },
    { subject: "Invoice payment incorrectly allocated", description: "Our last payment was applied to the wrong invoice number, leaving the correct invoice showing as unpaid.", priority: "LOW", status: "RESOLVED", category: "Billing", subcategory: "Invoices", customer: "david.okafor@fintrustbank.example", daysAgo: 15, tags: ["Billing"] },
    { subject: "Customer account locked", description: "A customer was locked out after several failed login attempts and needs manual unlock.", priority: "HIGH", status: "OPEN", category: "Account & Access", subcategory: "Account Lockout", customer: "ryan.mitchell@mail.example", daysAgo: 1 },
    { subject: "Server disk space warning", description: "Monitoring is showing the primary application server at 92% disk usage and climbing.", priority: "URGENT", status: "IN_PROGRESS", category: "Infrastructure", subcategory: "Server Issues", customer: "marcus.lee@nimbuscloud.example", daysAgo: 0, tags: ["Outage"] },
    { subject: "SSL certificate expiring", description: "The SSL certificate for our checkout subdomain expires in 5 days and needs to be renewed before then.", priority: "MEDIUM", status: "NEW", category: "Infrastructure", subcategory: "SSL Certificates", customer: "hannah.foster@brightsideretail.example", daysAgo: 0 },
    { subject: "Payment gateway not processing transactions", description: "Our customers are receiving an error when trying to make payments. Attached is a screenshot of the failure.", priority: "HIGH", status: "IN_PROGRESS", category: "Payment Integration", subcategory: "Gateway Errors", customer: "jarrod.kim@acmeltd.example", daysAgo: 2, tags: ["Payment Issue"] },
    { subject: "Duplicate charge on customer card", description: "A customer was charged twice for the same order and is requesting an immediate refund of the duplicate.", priority: "URGENT", status: "PENDING_INTERNAL", category: "Payment Integration", subcategory: "Failed Transactions", customer: "isabella.cruz@acmeltd.example", daysAgo: 1, tags: ["Payment Issue", "VIP"] },
    { subject: "Refund not reflecting in customer account", description: "We processed a refund five days ago but the customer says it still hasn't appeared on their statement.", priority: "MEDIUM", status: "OPEN", category: "Payment Integration", subcategory: "Refunds", customer: "priya.desai@mail.example", daysAgo: 4 },
    { subject: "Unable to log in after password reset", description: "After resetting the password the new credentials are rejected with an invalid-password error.", priority: "LOW", status: "RESOLVED", category: "Account & Access", subcategory: "Login Issues", customer: "ryan.mitchell@mail.example", daysAgo: 9 },
    { subject: "Two-factor authentication codes not arriving", description: "SMS codes for 2FA are not being delivered, blocking the customer from logging in entirely.", priority: "HIGH", status: "NEW", category: "Account & Access", subcategory: "Login Issues", customer: "elena.vasquez@fintrustbank.example", daysAgo: 0, tags: ["Security"] },
    { subject: "Calendar events not syncing to mobile", description: "Calendar entries created on desktop are not showing up on the mobile app after several hours.", priority: "LOW", status: "OPEN", category: "Email & Sync", subcategory: "Calendar Sync", customer: "chloe.adams@mail.example", daysAgo: 3 },
    { subject: "Bulk email delivery delayed", description: "Our marketing newsletter sent this morning is still showing as queued for a large portion of recipients.", priority: "MEDIUM", status: "IN_PROGRESS", category: "Email & Sync", subcategory: "Email Delivery", customer: "hannah.foster@brightsideretail.example", daysAgo: 1 },
    { subject: "Shopping cart items disappearing", description: "Items added to the cart vanish after navigating between product pages on mobile Safari.", priority: "HIGH", status: "OPEN", category: "Website & Checkout", subcategory: "Cart Issues", customer: "jarrod.kim@acmeltd.example", daysAgo: 2, tags: ["Bug"] },
    { subject: "Checkout page loading slowly", description: "The checkout page is taking 8-10 seconds to load during peak hours, causing cart abandonment.", priority: "MEDIUM", status: "RESOLVED", category: "Website & Checkout", subcategory: "Page Performance", customer: "isabella.cruz@acmeltd.example", daysAgo: 18 },
    { subject: "Suspicious login attempts detected", description: "Our security monitoring flagged over 200 failed login attempts from a single IP range targeting admin accounts.", priority: "CRITICAL", status: "IN_PROGRESS", category: "Security", subcategory: "Suspicious Activity", customer: "david.okafor@fintrustbank.example", daysAgo: 0, tags: ["Security", "Urgent"] },
    { subject: "Request for elevated admin access", description: "A new team member needs temporary admin access to the billing dashboard for month-end reconciliation.", priority: "LOW", status: "PENDING_INTERNAL", category: "Security", subcategory: "Access Requests", customer: "marcus.lee@nimbuscloud.example", daysAgo: 2 },
    { subject: "Third-party vulnerability scan flagged outdated library", description: "Our annual security audit flagged an outdated dependency in the integration SDK you provided.", priority: "HIGH", status: "NEW", category: "Security", subcategory: "Vulnerability Reports", customer: "david.okafor@fintrustbank.example", daysAgo: 0, tags: ["Security"] },
    { subject: "Monthly invoice shows wrong tax amount", description: "This month's invoice applies the wrong tax rate for our region, overcharging us by roughly 4%.", priority: "MEDIUM", status: "OPEN", category: "Billing", subcategory: "Invoices", customer: "tom.whitfield@harborlogistics.example", daysAgo: 3, tags: ["Billing"] },
    { subject: "Need to upgrade subscription plan", description: "We'd like to move from the Standard plan to Premium ahead of our busy season.", priority: "LOW", status: "RESOLVED", category: "Billing", subcategory: "Subscription Changes", customer: "hannah.foster@brightsideretail.example", daysAgo: 20 },
    { subject: "Credit card on file expired", description: "Our card on file expired last week and the last auto-renewal attempt failed.", priority: "MEDIUM", status: "PENDING_CUSTOMER", category: "Billing", subcategory: "Payment Methods", customer: "priya.desai@mail.example", daysAgo: 5, tags: ["Billing"] },
    { subject: "Network latency spikes during peak hours", description: "We're seeing 300ms+ latency spikes on API calls between 2-4pm daily this week.", priority: "HIGH", status: "IN_PROGRESS", category: "Infrastructure", subcategory: "Server Issues", customer: "marcus.lee@nimbuscloud.example", daysAgo: 1 },
    { subject: "Integration webhook failing silently", description: "Our order-completed webhook stopped firing two days ago with no error logged on either side.", priority: "URGENT", status: "OPEN", category: "Payment Integration", subcategory: "Gateway Errors", customer: "jarrod.kim@acmeltd.example", daysAgo: 1, tags: ["Payment Issue", "Bug"] },
    { subject: "Mobile app crashing on login", description: "The iOS app crashes immediately after entering valid credentials, reproducible on iPhone 14 and 15.", priority: "HIGH", status: "NEW", category: "Account & Access", subcategory: "Login Issues", customer: "ryan.mitchell@mail.example", daysAgo: 0, tags: ["Bug"] },
    { subject: "Export report stuck at 0%", description: "Generating a CSV export of the last quarter's tickets has been stuck at 0% for over an hour.", priority: "LOW", status: "CLOSED", category: "Website & Checkout", subcategory: "Page Performance", customer: "elena.vasquez@fintrustbank.example", daysAgo: 22 },
    { subject: "Data export missing recent records", description: "The nightly data export is missing the last three days of transaction records.", priority: "MEDIUM", status: "RESOLVED", category: "Infrastructure", subcategory: "Server Issues", customer: "david.okafor@fintrustbank.example", daysAgo: 10 },
    { subject: "Spam emails bypassing filters", description: "We're seeing a noticeable increase in spam reaching inboxes despite filters being enabled.", priority: "LOW", status: "OPEN", category: "Security", subcategory: "Suspicious Activity", customer: "chloe.adams@mail.example", daysAgo: 4 },
    { subject: "Account merge request for duplicate customer", description: "A customer accidentally created two accounts and would like them merged into one.", priority: "LOW", status: "CANCELLED", category: "Account & Access", subcategory: "Account Lockout", customer: "priya.desai@mail.example", daysAgo: 14 },
    { subject: "Critical outage: entire platform unreachable", description: "The platform was completely unreachable for approximately 40 minutes this morning across all regions.", priority: "CRITICAL", status: "RESOLVED", category: "Infrastructure", subcategory: "Server Issues", customer: "marcus.lee@nimbuscloud.example", daysAgo: 7, tags: ["Outage", "Urgent"] },
  ];

  const agentReplies = [
    "Thanks for reporting this — I'm looking into it now and will update you shortly.",
    "I've reproduced the issue on our end and escalated it to engineering.",
    "Could you confirm which browser and device you were using when this happened?",
    "We've identified the root cause and are rolling out a fix now.",
    "This has been resolved on our end — could you confirm it's working for you now?",
    "I've applied a temporary workaround while we ship the permanent fix.",
  ];
  const customerFollowUps = [
    "Thanks for the quick response, still seeing the issue on my end though.",
    "That worked, thank you!",
    "Appreciate the update, let me know once it's fully resolved.",
    "Attached a screenshot of what I'm seeing.",
  ];
  const internalNotes = [
    "Confirmed with engineering — this is related to the deploy from last night, rollback in progress.",
    "Customer is on an Enterprise plan, please prioritize.",
    "Flagging for manager review before we respond — could be a billing dispute.",
    "Duplicate of an earlier report, linking tickets.",
  ];

  let ticketCount = 0;
  for (const row of rows) {
    const createdAt = daysAgo(row.daysAgo, 8 + Math.floor(Math.random() * 6));
    const customerId = customers.get(row.customer)!;
    const customer = await prisma.customer.findUniqueOrThrow({ where: { id: customerId } });
    const categoryId = categories.get(row.category)!;
    const subcategoryId = subcategories.get(`${row.category}::${row.subcategory}`)!;

    const teamName =
      row.category === "Payment Integration" ? "Payments" :
      row.category === "Billing" ? "Billing" :
      row.category === "Infrastructure" || row.category === "Security" ? "Infrastructure" :
      row.category === "Website & Checkout" ? "Customer Service" : "Technical Support";
    const teamId = teams.get(teamName)!;

    const agentEmail = row.status === "NEW" ? null : agentPool[ticketCount % agentPool.length];
    const agent = agentEmail ? users.get(agentEmail) : null;

    const slaPolicyId = customer.companyId ? (await prisma.company.findUnique({ where: { id: customer.companyId } }))?.slaPolicyId ?? standardSla.id : standardSla.id;
    const rules = slaPolicyId === enterpriseSla.id ? enterpriseRules : DEFAULT_SLA_RULES;
    const rule = findRule(rules, row.priority);
    const { firstResponseDueAt, resolutionDueAt } = computeDueDates(rule, createdAt);

    const isDone = row.status === "RESOLVED" || row.status === "CLOSED";
    const isCancelled = row.status === "CANCELLED";
    const firstRespondedAt = row.status !== "NEW" ? hoursAfter(createdAt, 0.5 + Math.random() * 3) : null;
    const resolvedAt = isDone || isCancelled ? hoursAfter(createdAt, 4 + Math.random() * 40) : null;
    const closedAt = row.status === "CLOSED" ? hoursAfter(resolvedAt!, 24) : null;

    const firstResponseSla = computeSlaState({ createdAt, dueAt: firstResponseDueAt, completedAt: firstRespondedAt });
    const resolutionSla = computeSlaState({ createdAt, dueAt: resolutionDueAt, completedAt: resolvedAt });

    const ticket = await prisma.ticket.create({
      data: {
        subject: row.subject,
        description: row.description,
        status: row.status,
        priority: row.priority,
        source: ["EMAIL", "PORTAL", "PHONE", "MANUAL"][ticketCount % 4] as never,
        customerId,
        companyId: customer.companyId,
        categoryId,
        subcategoryId,
        assignedAgentId: agent?.id ?? null,
        teamId,
        slaPolicyId,
        firstResponseDueAt,
        resolutionDueAt,
        firstRespondedAt,
        resolvedAt,
        closedAt,
        firstResponseSla,
        resolutionSla,
        createdAt,
        updatedAt: closedAt ?? resolvedAt ?? firstRespondedAt ?? createdAt,
      },
    });
    ticketCount++;

    await prisma.ticketMessage.create({
      data: { ticketId: ticket.id, authorType: "CUSTOMER", authorCustomerId: customerId, body: row.description, createdAt },
    });
    await prisma.ticketEvent.create({
      data: { ticketId: ticket.id, type: "CREATED", createdAt },
    });

    if (row.tags) {
      for (const tagName of row.tags) {
        const tagId = tags.get(tagName);
        if (tagId) await prisma.ticketTag.create({ data: { ticketId: ticket.id, tagId } });
      }
    }

    if (agent && row.status !== "NEW") {
      await prisma.ticketEvent.create({
        data: { ticketId: ticket.id, type: "AGENT_ASSIGNED", actorUserId: agent.id, toValue: agent.id, createdAt: hoursAfter(createdAt, 0.1) },
      });
      await prisma.ticketEvent.create({
        data: { ticketId: ticket.id, type: "STATUS_CHANGED", actorUserId: agent.id, fromValue: "NEW", toValue: row.status, createdAt: hoursAfter(createdAt, 0.2) },
      });
      await prisma.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          authorType: "AGENT",
          authorUserId: agent.id,
          body: agentReplies[ticketCount % agentReplies.length],
          createdAt: firstRespondedAt!,
        },
      });
      await prisma.ticketEvent.create({
        data: { ticketId: ticket.id, type: "AGENT_REPLIED", actorUserId: agent.id, createdAt: firstRespondedAt! },
      });

      if (row.status === "PENDING_CUSTOMER" || (ticketCount % 3 === 0 && !isDone)) {
        const followUpAt = hoursAfter(firstRespondedAt!, 1 + Math.random() * 3);
        await prisma.ticketMessage.create({
          data: { ticketId: ticket.id, authorType: "CUSTOMER", authorCustomerId: customerId, body: customerFollowUps[ticketCount % customerFollowUps.length], createdAt: followUpAt },
        });
        await prisma.ticketEvent.create({
          data: { ticketId: ticket.id, type: "CUSTOMER_REPLIED", createdAt: followUpAt },
        });
      }

      if (ticketCount % 2 === 0) {
        await prisma.ticketNote.create({
          data: { ticketId: ticket.id, authorId: agent.id, body: internalNotes[ticketCount % internalNotes.length], createdAt: hoursAfter(createdAt, 1) },
        });
        await prisma.ticketEvent.create({
          data: { ticketId: ticket.id, type: "NOTE_ADDED", actorUserId: agent.id, createdAt: hoursAfter(createdAt, 1) },
        });
      }

      if (isDone) {
        await prisma.ticketEvent.create({
          data: { ticketId: ticket.id, type: "RESOLVED", actorUserId: agent.id, createdAt: resolvedAt! },
        });
        if (closedAt) {
          await prisma.ticketEvent.create({
            data: { ticketId: ticket.id, type: "CLOSED", actorUserId: agent.id, createdAt: closedAt },
          });
        }
        if (ticketCount % 3 !== 0) {
          await prisma.customerSatisfaction.create({
            data: {
              ticketId: ticket.id,
              customerId,
              score: 3 + (ticketCount % 3),
              comment: ticketCount % 2 === 0 ? "Quick and helpful response, thank you!" : null,
              createdAt: hoursAfter(resolvedAt!, 2),
            },
          });
        }
      }
    }
  }

  console.log(`Seeded ${ticketCount} tickets.`);

  console.log("Seeding knowledge base articles...");
  const kbAuthor = users.get("leader@deskly.example")!.id;
  const kbArticles = [
    { title: "Getting started with your support portal", category: "GETTING_STARTED", slug: "getting-started-support-portal", content: "Learn how to submit tickets, track status and communicate with our support team through the customer portal." },
    { title: "How to reset your account password", category: "ACCOUNT", slug: "reset-account-password", content: "Step-by-step instructions for resetting a forgotten password, including troubleshooting for emails that don't arrive." },
    { title: "Understanding your monthly invoice", category: "BILLING", slug: "understanding-monthly-invoice", content: "A breakdown of every line item on your invoice, including taxes, prorated charges and subscription changes." },
    { title: "Troubleshooting payment gateway timeouts", category: "TECHNICAL_ISSUES", slug: "troubleshooting-gateway-timeouts", content: "Common causes of payment gateway timeouts and how to diagnose whether the issue is on your end or ours." },
    { title: "Fixing failed email sync in Outlook", category: "TROUBLESHOOTING", slug: "fixing-failed-email-sync-outlook", content: "Resolve mailbox sync issues in Microsoft 365 and Outlook, including cache clearing and re-authentication steps." },
    { title: "Setting up the webhook integration", category: "INTEGRATIONS", slug: "setting-up-webhook-integration", content: "How to configure and verify webhooks for order and payment events, with signature verification examples." },
    { title: "Renewing an SSL certificate", category: "TECHNICAL_ISSUES", slug: "renewing-ssl-certificate", content: "A checklist for renewing and installing SSL certificates without downtime." },
  ] as const;
  for (const [i, a] of kbArticles.entries()) {
    await prisma.knowledgeBaseArticle.upsert({
      where: { slug: a.slug },
      update: {},
      create: {
        title: a.title,
        slug: a.slug,
        category: a.category,
        content: a.content,
        authorId: kbAuthor,
        status: "PUBLISHED",
        views: 40 + i * 17,
        helpfulYes: 10 + i * 3,
        helpfulNo: i,
        publishedAt: daysAgo(20 - i),
      },
    });
  }

  console.log("Seeding automations...");
  await prisma.automation.upsert({
    where: { id: "seed-automation-payment-routing" },
    update: {},
    create: {
      id: "seed-automation-payment-routing",
      name: "Route payment issues to Payments team",
      description: "Automatically assigns tickets in the Payment Integration category to the Payments team.",
      triggerOn: "TICKET_CREATED",
      conditions: [{ field: "CATEGORY", operator: "equals", value: "Payment Integration" }],
      createdById: users.get("admin@deskly.example")!.id,
      actions: { create: [{ type: "ASSIGN_TEAM", value: { teamName: "Payments" }, order: 0 }] },
    },
  });
  await prisma.automation.upsert({
    where: { id: "seed-automation-critical-escalation" },
    update: {},
    create: {
      id: "seed-automation-critical-escalation",
      name: "Escalate critical tickets",
      description: "Critical tickets are routed to Technical Support and trigger an immediate notification.",
      triggerOn: "TICKET_CREATED",
      conditions: [{ field: "PRIORITY", operator: "equals", value: "CRITICAL" }],
      createdById: users.get("admin@deskly.example")!.id,
      actions: {
        create: [
          { type: "ASSIGN_TEAM", value: { teamName: "Technical Support" }, order: 0 },
          { type: "SEND_NOTIFICATION", value: { audience: "team_leads" }, order: 1 },
        ],
      },
    },
  });
  await prisma.automation.upsert({
    where: { id: "seed-automation-vip-tag" },
    update: {},
    create: {
      id: "seed-automation-vip-tag",
      name: "Tag Enterprise customer tickets as VIP",
      description: "Adds a VIP tag whenever a ticket comes from an Enterprise support plan company.",
      triggerOn: "TICKET_CREATED",
      isActive: false,
      conditions: [{ field: "COMPANY_PLAN", operator: "equals", value: "ENTERPRISE" }],
      createdById: users.get("manager@deskly.example")!.id,
      actions: { create: [{ type: "ADD_TAG", value: { tagName: "VIP" }, order: 0 }] },
    },
  });

  console.log("Seeding notifications...");
  const recentTickets = await prisma.ticket.findMany({ take: 5, orderBy: { createdAt: "desc" }, include: { assignedAgent: true } });
  for (const t of recentTickets) {
    if (!t.assignedAgentId) continue;
    await prisma.notification.create({
      data: {
        type: "TICKET_ASSIGNED",
        title: "New ticket assigned to you",
        body: `${t.subject} was assigned to you.`,
        userId: t.assignedAgentId,
        ticketId: t.id,
        isRead: Math.random() > 0.6,
      },
    });
  }
  const criticalAtRisk = await prisma.ticket.findMany({ where: { OR: [{ resolutionSla: "AT_RISK" }, { resolutionSla: "BREACHED" }] }, take: 4 });
  for (const t of criticalAtRisk) {
    await prisma.notification.create({
      data: {
        type: t.resolutionSla === "BREACHED" ? "SLA_BREACHED" : "SLA_AT_RISK",
        title: t.resolutionSla === "BREACHED" ? "SLA breached" : "SLA at risk",
        body: `${t.subject} resolution SLA is ${t.resolutionSla === "BREACHED" ? "breached" : "at risk"}.`,
        userId: t.assignedAgentId ?? users.get("manager@deskly.example")!.id,
        ticketId: t.id,
        isRead: false,
      },
    });
  }

  console.log("Seeding audit log...");
  const auditEntries = [
    { action: "user.sign_in", entityType: "User", actor: "admin@deskly.example" },
    { action: "ticket.status_changed", entityType: "Ticket", actor: "agent@deskly.example" },
    { action: "team.created", entityType: "Team", actor: "admin@deskly.example" },
    { action: "sla_policy.updated", entityType: "SLAPolicy", actor: "manager@deskly.example" },
    { action: "automation.executed", entityType: "Automation", actor: "admin@deskly.example" },
    { action: "role.permissions_updated", entityType: "Role", actor: "superadmin@deskly.example" },
  ];
  for (const [i, e] of auditEntries.entries()) {
    await prisma.auditLog.create({
      data: {
        action: e.action,
        entityType: e.entityType,
        actorUserId: users.get(e.actor)!.id,
        ipAddress: `10.0.0.${10 + i}`,
        createdAt: daysAgo(i),
      },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
