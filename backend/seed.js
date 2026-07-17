/**
 * seed.js - CRM Demo Data Seeder
 *
 * Usage:
 *   node seed.js
 *   npm run seed
 *
 * Safety:
 *   - Finds or creates the target user (realutkarshh@gmail.com)
 *   - Deletes ONLY that user's existing data before re-seeding
 *   - Never touches other users data
 *   - Never wipes the entire database
 */

import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// ─── Models ──────────────────────────────────────────────────────────────────
import { User } from "./models/User.js";
import { Lead } from "./models/Lead.js";
import { Contact } from "./models/Contact.js";
import { Note } from "./models/Note.js";
import { Task } from "./models/Task.js";

// ─── Seed Config ─────────────────────────────────────────────────────────────
const TARGET_EMAIL    = "realutkarshh@gmail.com";
const TARGET_PASSWORD = "helloworld";
const TARGET_NAME     = "Utkarsh Sharma";
const TARGET_COMPANY  = "TechPulse Solutions";

// ─── Enum Values (must match schema exactly) ─────────────────────────────────
const LEAD_STATUSES   = ["New", "Qualified", "Proposal", "Won", "Lost"];
const LEAD_PRIORITIES = ["Low", "Medium", "High"];
const LEAD_SOURCES    = ["Website", "Referral", "Cold Outreach", "Social", "Event", "Other"];
const TASK_STATUSES   = ["Pending", "In Progress", "Completed"];
const TASK_PRIORITIES = ["Low", "Medium", "High"];

// ─── Utilities ───────────────────────────────────────────────────────────────
const randInt  = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick     = (arr)      => arr[randInt(0, arr.length - 1)];
const randDate = (start, end) =>
  new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

const daysAgo   = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };
const daysAhead = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d; };

const weightedPick = (items, weights) => {
  const r = Math.random();
  let cum = 0;
  for (let i = 0; i < items.length; i++) {
    cum += weights[i];
    if (r <= cum) return items[i];
  }
  return items[items.length - 1];
};

// ─── Data Pools ───────────────────────────────────────────────────────────────
const FIRST_NAMES = [
  "Arjun","Priya","Ravi","Sneha","Karan","Ananya","Vikram","Pooja",
  "Rahul","Neha","Aditya","Deepika","Suresh","Kavita","Manish",
  "Shreya","Rohit","Nisha","Amit","Divya","Sanjay","Meera","Rajesh",
  "Sunita","Vijay","Lakshmi","Kunal","Tanya","Harsh","Preeti",
  "James","Sarah","Michael","Emily","David","Jessica","Robert","Ashley",
  "William","Amanda","Christopher","Stephanie","Matthew","Jennifer",
  "Ryan","Nicole","Kevin","Lauren","Brian","Samantha"
];

const LAST_NAMES = [
  "Sharma","Patel","Singh","Gupta","Kumar","Verma","Joshi","Mehta",
  "Agarwal","Chaudhary","Malhotra","Kapoor","Nair","Reddy","Iyer",
  "Bhat","Rao","Shah","Pandey","Tiwari","Mishra","Srivastava",
  "Smith","Johnson","Williams","Brown","Jones","Miller","Davis",
  "Wilson","Moore","Taylor","Anderson","Thomas","Jackson","Harris",
  "Martin","Thompson","White","Garcia","Martinez","Robinson","Clark"
];

const COMPANIES = [
  "Nexus Digital","CloudSphere Technologies","InnovateTech","DataForge Solutions",
  "PixelCraft Studios","BlueSky Ventures","Quantum Analytics","SkyBridge Systems",
  "VelocityNet","Apex Solutions Group","ClearPath Consulting","DeltaWave Media",
  "EchoTech Labs","FusionCore Software","GreenLeaf Digital","HorizonAI",
  "ImpactFirst Agency","JetStream Commerce","Keystone Dynamics","LightBridge Inc",
  "MomentumPro","NovaStar Retail","OmniLogic Systems","PeakPerformance Tech",
  "QuestBridge Ventures","RapidScale Solutions","StellarPath Group","TechVault",
  "UniCore Digital","VantagePoint Analytics","WaveRunner Systems","XcelPath",
  "YieldMax Finance","ZenithCloud","AlphaStream","BrightMind EdTech",
  "CatalystHub","DynaServe","EdgeForce Technology","FlowState Solutions",
  "GridPower Analytics","HeliX Biotech","IntelliSync","JumpStart Digital",
  "KineticEdge","LaunchPad Ventures","MegaTrend Systems","NodeCraft",
  "OrbitLink Commerce","PulseMetrics","QuickBuild Software","Reliant Dynamics",
  "Silverline Consulting","TerraData","UpSwing Media","Vivid Analytics",
  "WideScope Technologies","XactPath","ZeroFriction SaaS","CoreBlue Systems",
  "ArcLight AI","BenchMark Analytics","CloudRiver Inc","DriftWave Agency"
];

const INDUSTRIES = [
  "SaaS","E-commerce","Healthcare","FinTech","EdTech","Logistics",
  "Real Estate","Manufacturing","Retail","Media & Entertainment",
  "Cybersecurity","AI & ML","Consulting","Legal Tech","InsurTech"
];

const CITIES = [
  "Mumbai","Delhi","Bangalore","Hyderabad","Chennai","Pune",
  "Ahmedabad","Kolkata","New York","San Francisco","Austin",
  "Seattle","Boston","Chicago","London","Singapore","Dubai","Toronto"
];

const DESIGNATIONS = [
  "CEO","CTO","CFO","COO","VP of Sales","VP of Marketing",
  "Head of Product","Director of Engineering","Sales Manager",
  "Business Development Manager","Account Manager","Marketing Manager",
  "Product Manager","Operations Manager","IT Manager",
  "Founder","Co-Founder","MD","President","General Manager"
];

const AI_SUMMARIES = [
  "Strong enterprise prospect with clear budget authority. Technical team aligned with our solution. High probability of closing within Q3.",
  "Mid-market opportunity with significant expansion potential. Champion identified, but legal review may extend timeline.",
  "Warm lead from referral. Decision maker engaged and expressed urgency. Recommend fast-tracking demo.",
  "Budget confirmed. Competitive evaluation in progress. Position our ROI calculator to differentiate.",
  "Initial interest high but stalled at evaluation stage. Re-engage with case study from similar industry.",
  "Strong fit — their pain points map directly to our core features. Nurture with targeted content.",
  "Prospect evaluating three vendors. Price sensitivity noted. Consider offering a pilot program.",
  "Key stakeholder on vacation until month end. Schedule follow-up for first week of next month.",
  "Deal at risk — competitor offered aggressive pricing. Escalate to senior sales for strategic discount.",
  "Technical POC completed successfully. Procurement process initiated. Expected close: 3-4 weeks."
];

const DEAL_VALUES = {
  small:      [15000, 25000, 45000, 65000, 85000, 95000],
  medium:     [150000, 250000, 450000, 650000, 850000, 950000],
  large:      [1200000, 2500000, 3500000, 5000000, 7500000, 9500000],
  enterprise: [12000000, 25000000, 50000000]
};

const getDealValue = () => {
  const tier = weightedPick(
    ["small","medium","large","enterprise"],
    [0.30,0.40,0.25,0.05]
  );
  return pick(DEAL_VALUES[tier]);
};

const NOTE_TEMPLATES = [
  (n,c) => `Initial call with ${n} from ${c}. They expressed strong interest in our enterprise plan. Requested a detailed pricing sheet.`,
  (n,c) => `Follow-up email sent to ${n}. ${c} is currently evaluating 2 other vendors. Our key differentiator pitched: AI-powered analytics.`,
  (n)   => `${n} confirmed budget availability. Approval expected from CFO by end of month. Timeline looks good.`,
  (n,c) => `Demo conducted with ${c} team — 8 participants. ${n} was very impressed with the pipeline view and AI summaries.`,
  (n)   => `${n} requested a 2-week trial extension. They want to test the API integration with their existing stack.`,
  (n,c) => `Decision maker at ${c} changed. ${n} introduced us to the new VP of Engineering. Restructuring our proposal accordingly.`,
  (n)   => `Contract reviewed by ${n}'s legal team. Minor redlines on data privacy clauses. Our legal team is addressing them.`,
  (n,c) => `${n} mentioned ${c} just closed a Series B. This significantly expands their budget. Re-qualifying as high-priority.`,
  (n)   => `Call with ${n} — comparing us with Salesforce and HubSpot. Highlighted our pricing advantage and dedicated support model.`,
  (n,c) => `${c} onboarding roadmap reviewed with ${n}. They have a 60-day implementation window. All requirements documented.`,
  (n)   => `${n} shared positive feedback from their team trial. Only concern is mobile app availability — noted for product roadmap.`,
  (n,c) => `Sent ROI calculator to ${n}. Based on ${c}'s current team size, projected savings: ~₹4L/year.`,
  (n)   => `${n} is the influencer, not the decision maker. Identified CFO as economic buyer. Scheduling executive-level call next week.`,
  (n,c) => `${c} procurement team requested security compliance documentation (SOC 2, ISO 27001). Forwarded to our compliance team.`,
  (n)   => `Negotiations at 85% — ${n} wants a 10% discount for 2-year commitment. Checking with sales director for approval.`,
  (n,c) => `${c} pilot extended for 2 more weeks at ${n}'s request. Success metrics: 30% reduction in lead response time.`,
  (n)   => `${n} unresponsive for 3 weeks. Sending breakup email this week. Will archive if no response.`,
  (n,c) => `${c} signed the NDA. Moving to technical evaluation phase. ${n} is coordinating their IT team.`,
  (n)   => `Proposal sent to ${n} — 3 tiers: Starter, Pro, Enterprise. Awaiting feedback within 5 business days.`,
  (n,c) => `Met ${n} at SaaS Summit. ${c} is actively looking to replace their legacy CRM before Q4.`,
];

const TASK_TEMPLATES = [
  (n)   => `Call ${n} to discuss proposal`,
  (n,c) => `Schedule product demo with ${c}`,
  (n)   => `Send follow-up email to ${n}`,
  (n,c) => `Prepare customized quote for ${c}`,
  (n)   => `Review contract terms with ${n}`,
  (n,c) => `Conduct technical POC for ${c}`,
  (n)   => `Send case study to ${n}`,
  (n,c) => `Executive check-in call with ${c}`,
  (n)   => `Follow up on ${n}'s budget approval`,
  (n,c) => `Onboarding kickoff meeting with ${c}`,
  (n)   => `Address ${n}'s security compliance questions`,
  (n,c) => `Present ROI analysis to ${c} team`,
  (n)   => `Check in with ${n} post-demo`,
  (n,c) => `Re-engage ${c} after radio silence`,
  (n)   => `Send pricing options to ${n}`,
];

const TASK_DESCRIPTIONS = [
  "Prepare talking points and address previously raised objections before the call.",
  "Set up demo environment with industry-specific use case. Record session for stakeholders who cannot attend.",
  "Personalize email with their specific pain points. Include a one-pager with ROI metrics.",
  "Tailor quote based on team size and feature requirements. Add a comparison with competitor pricing.",
  "Highlight key clauses around data ownership and SLA before the review session.",
  "Configure sandbox environment. Coordinate with their IT team for access provisioning.",
  "Select the most relevant case study from a company in the same industry and deal size.",
  "Prepare executive summary: pipeline overview, ROI projections, and expansion roadmap.",
  "Send polite nudge email. Offer to loop in finance team if needed.",
  "Prepare welcome package, training schedule, and technical setup checklist.",
  "Compile SOC 2 report, penetration test summary, and data processing agreement.",
  "Model 3-year TCO and compare against their current solution costs.",
  "Send a short 3-question survey. Offer to schedule a Q&A call.",
  "Structure pricing email with 3 clear tiers. Highlight value at each level.",
  "Coordinate with our legal team. Expected turnaround: 48 hours.",
];

// ─── Name / Email / Phone Helpers ─────────────────────────────────────────────
const generateName = () => `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;

const nameToEmail = (name, company) => {
  const [first, last] = name.toLowerCase().split(" ");
  const domain = company.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12);
  const tld = pick(["com","io","co","net","org"]);
  return `${first}.${last}@${domain}.${tld}`;
};

const generatePhone = () => pick([
  `+91 ${randInt(70000,99999)} ${randInt(10000,99999)}`,
  `+1 (${randInt(200,999)}) ${randInt(200,999)}-${randInt(1000,9999)}`,
  `+44 ${randInt(7000,7999)} ${randInt(100000,999999)}`,
]);

// ─── Main Seed Function ───────────────────────────────────────────────────────
const seed = async () => {
  try {
    // ── Connect ────────────────────────────────────────────────────────────────
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error("MONGO_URI not set in .env");

    console.log("\n🔌 Connecting to MongoDB...");
    mongoose.set("strictQuery", true);
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
    console.log("✅ Connected.\n");

    // ── Find or Create User ────────────────────────────────────────────────────
    console.log(`🔍 Looking up user: ${TARGET_EMAIL}`);
    let user = await User.findOne({ email: TARGET_EMAIL });

    if (user) {
      console.log(`✅ User found: ${user.name} (${user._id})\n`);
    } else {
      console.log("⚠️  User not found — creating...");
      user = await User.create({
        name:     TARGET_NAME,
        email:    TARGET_EMAIL,
        password: TARGET_PASSWORD, // pre-save hook will hash this
        company:  TARGET_COMPANY,
        role:     "owner",
      });
      console.log(`✅ User created: ${user.name} (${user._id})\n`);
    }

    const ownerId = user._id;

    // ── Clean This User's Demo Data ────────────────────────────────────────────
    console.log("🧹 Removing existing data for this user only...");
    const [dL, dC, dN, dT] = await Promise.all([
      Lead.deleteMany({ owner: ownerId }),
      Contact.deleteMany({ owner: ownerId }),
      Note.deleteMany({ owner: ownerId }),
      Task.deleteMany({ owner: ownerId }),
    ]);
    console.log(
      `   Deleted: ${dL.deletedCount} leads, ${dC.deletedCount} contacts, ` +
      `${dN.deletedCount} notes, ${dT.deletedCount} tasks\n`
    );

    const now           = new Date();
    const twelveMonAgo  = daysAgo(365);

    // ══════════════════════════════════════════════════════════════════════════
    // CONTACTS
    // ══════════════════════════════════════════════════════════════════════════
    console.log("👤 Creating contacts...");

    const shuffledCompanies = [...COMPANIES].sort(() => Math.random() - 0.5);
    const contactData = [];

    for (let i = 0; i < 60; i++) {
      const name    = generateName();
      const company = shuffledCompanies[i % shuffledCompanies.length];
      const created = randDate(twelveMonAgo, now);

      contactData.push({
        owner:     ownerId,
        name,
        email:     nameToEmail(name, company),
        phone:     generatePhone(),
        company,
        title:     pick(DESIGNATIONS),
        tags:      [pick(INDUSTRIES), pick(CITIES)].map(t => t.toLowerCase()),
        notes:     pick([
          `Met at ${pick(["SaaS Summit 2025","TechWorld Expo","B2B Sales Forum","Product Hunt Launch"])}. Very engaged.`,
          `Referred by a mutual connection. Strong relationship with the founder.`,
          `Inbound inquiry via website. High interest in enterprise plan.`,
          `Cold outreach successful. Warm response, intro call scheduled.`,
          `Previous customer at a competitor. Open to switching.`,
          "",
        ]),
        favourite: Math.random() < 0.15,
        createdAt: created,
        updatedAt: created,
      });
    }

    const contacts = await Contact.insertMany(contactData, { timestamps: false });
    console.log(`✅ Created ${contacts.length} contacts.\n`);

    // ══════════════════════════════════════════════════════════════════════════
    // LEADS  (110 leads spread across statuses with realistic timing)
    // ══════════════════════════════════════════════════════════════════════════
    console.log("🎯 Creating leads...");

    const leadData       = [];
    const usedCompanies  = new Set();

    for (let i = 0; i < 110; i++) {
      let company;
      let attempts = 0;
      do {
        company = pick(COMPANIES);
        attempts++;
      } while (usedCompanies.size < 40 && usedCompanies.has(company) && attempts < 20);
      usedCompanies.add(company);

      const name     = generateName();
      const status   = weightedPick(LEAD_STATUSES, [0.20, 0.25, 0.20, 0.20, 0.15]);
      const priority = weightedPick(LEAD_PRIORITIES, [0.25, 0.45, 0.30]);
      const source   = weightedPick(LEAD_SOURCES, [0.25, 0.20, 0.20, 0.15, 0.10, 0.10]);
      const value    = getDealValue();

      let created;
      if (status === "Won" || status === "Lost") {
        created = randDate(daysAgo(300), daysAgo(30));
      } else if (status === "Proposal" || status === "Qualified") {
        created = randDate(daysAgo(180), daysAgo(7));
      } else {
        created = randDate(daysAgo(90), now);
      }

      const updated      = randDate(created, now);
      const hasAiSummary = Math.random() < 0.35;
      const aiRiskScore  = hasAiSummary
        ? status === "Won"      ? randInt(10, 35)
        : status === "Lost"     ? randInt(65, 95)
        : status === "Proposal" ? randInt(25, 60)
        : randInt(20, 70)
        : null;

      const leadNotesOptions = [
        `${name} is the primary decision maker. Budget approved for this fiscal year.`,
        `Initial contact via ${source === "Website" ? "web form" : source.toLowerCase()}. Very responsive.`,
        `Evaluating us alongside 2 competitors. Price is a key factor.`,
        `Strong champion inside ${company}. Escalating to executive team.`,
        `Technical team aligned. Awaiting legal sign-off.`,
        `Lost to competitor — existing integration issues. Keep in pipeline for renewal cycle.`,
        "",
      ];

      leadData.push({
        owner:      ownerId,
        name,
        email:      nameToEmail(name, company),
        phone:      generatePhone(),
        company,
        status,
        priority,
        source,
        value,
        notes:      pick(leadNotesOptions),
        tags:       pick(["", pick(INDUSTRIES), `${pick(INDUSTRIES).toLowerCase()}, ${pick(CITIES).toLowerCase()}`]),
        aiSummary:  hasAiSummary ? pick(AI_SUMMARIES) : "",
        aiRiskScore,
        order:      i,
        createdAt:  created,
        updatedAt:  updated,
      });
    }

    const leads = await Lead.insertMany(leadData, { timestamps: false });
    console.log(`✅ Created ${leads.length} leads.\n`);

    // ══════════════════════════════════════════════════════════════════════════
    // NOTES  (2-5 per lead + some for contacts)
    // ══════════════════════════════════════════════════════════════════════════
    console.log("📝 Creating notes...");

    const noteData = [];

    for (const lead of leads) {
      const count = randInt(2, 5);
      for (let n = 0; n < count; n++) {
        const tpl      = pick(NOTE_TEMPLATES);
        const content  = tpl(lead.name, lead.company);
        const noteDate = randDate(new Date(lead.createdAt), now);

        noteData.push({
          owner:     ownerId,
          content,
          lead:      lead._id,
          contact:   null,
          pinned:    n === 0 && Math.random() < 0.2,
          createdAt: noteDate,
          updatedAt: noteDate,
        });
      }
    }

    // Notes on contacts
    for (const contact of contacts.slice(0, 35)) {
      if (Math.random() < 0.6) {
        const tpl      = pick(NOTE_TEMPLATES);
        const content  = tpl(contact.name, contact.company);
        const noteDate = randDate(new Date(contact.createdAt), now);

        noteData.push({
          owner:     ownerId,
          content,
          lead:      null,
          contact:   contact._id,
          pinned:    Math.random() < 0.1,
          createdAt: noteDate,
          updatedAt: noteDate,
        });
      }
    }

    const notes = await Note.insertMany(noteData, { timestamps: false });
    console.log(`✅ Created ${notes.length} notes.\n`);

    // ══════════════════════════════════════════════════════════════════════════
    // TASKS  (per lead + standalone + some per contact)
    // ══════════════════════════════════════════════════════════════════════════
    console.log("✅ Creating tasks...");

    const taskData = [];

    for (const lead of leads) {
      const count = randInt(1, 3);
      for (let t = 0; t < count; t++) {
        const titleTpl    = pick(TASK_TEMPLATES);
        const title       = titleTpl(lead.name, lead.company);
        const description = pick(TASK_DESCRIPTIONS);
        const priority    = weightedPick(TASK_PRIORITIES, [0.20, 0.50, 0.30]);

        const isClosed  = lead.status === "Won" || lead.status === "Lost";
        const status    = isClosed
          ? weightedPick(TASK_STATUSES, [0.10, 0.05, 0.85])
          : weightedPick(TASK_STATUSES, [0.45, 0.30, 0.25]);

        const created   = randDate(new Date(lead.createdAt), now);
        let dueDate, completedAt;

        if (status === "Completed") {
          dueDate     = randDate(new Date(lead.createdAt), now);
          completedAt = randDate(dueDate, now);
        } else {
          const isOverdue = status === "Pending" && Math.random() < 0.30;
          dueDate         = isOverdue ? daysAgo(randInt(1, 30)) : daysAhead(randInt(1, 45));
          completedAt     = null;
        }

        taskData.push({
          owner:          ownerId,
          title,
          description,
          dueDate,
          status,
          priority,
          relatedLead:    lead._id,
          relatedContact: null,
          completedAt,
          createdAt:      created,
          updatedAt:      created,
        });
      }
    }

    // Standalone (no lead/contact)
    const standaloneTitles = [
      "Update CRM pipeline review deck",
      "Prepare monthly sales report for Q2",
      "Review and update contact list",
      "CRM data cleanup — remove duplicates",
      "Research competitors' new pricing",
      "Update email templates for outreach",
      "Review SLA terms with legal team",
      "Plan Q3 outreach campaign",
      "Analyze win/loss report from last quarter",
      "Set up automated lead scoring rules",
      "Schedule quarterly business review with top clients",
      "Train new sales rep on CRM usage",
      "Audit pipeline for stale leads (>60 days inactive)",
      "Update product feature list for sales enablement",
      "Review and optimize email open rates",
    ];

    for (const title of standaloneTitles) {
      const status    = weightedPick(TASK_STATUSES, [0.40, 0.30, 0.30]);
      const isOverdue = status === "Pending" && Math.random() < 0.25;
      const dueDate   = isOverdue ? daysAgo(randInt(1, 20)) : daysAhead(randInt(1, 30));
      const completed = status === "Completed" ? randDate(daysAgo(30), now) : null;
      const created   = randDate(daysAgo(90), now);

      taskData.push({
        owner:          ownerId,
        title,
        description:    pick(TASK_DESCRIPTIONS),
        dueDate,
        status,
        priority:       weightedPick(TASK_PRIORITIES, [0.20, 0.50, 0.30]),
        relatedLead:    null,
        relatedContact: null,
        completedAt:    completed,
        createdAt:      created,
        updatedAt:      created,
      });
    }

    // Tasks linked to contacts
    for (const contact of contacts.slice(0, 25)) {
      if (Math.random() < 0.5) {
        const titleTpl  = pick(TASK_TEMPLATES);
        const title     = titleTpl(contact.name, contact.company);
        const status    = weightedPick(TASK_STATUSES, [0.45, 0.25, 0.30]);
        const isOverdue = status === "Pending" && Math.random() < 0.25;
        const dueDate   = isOverdue ? daysAgo(randInt(1, 15)) : daysAhead(randInt(1, 30));
        const completed = status === "Completed" ? randDate(daysAgo(30), now) : null;
        const created   = randDate(new Date(contact.createdAt), now);

        taskData.push({
          owner:          ownerId,
          title,
          description:    pick(TASK_DESCRIPTIONS),
          dueDate,
          status,
          priority:       weightedPick(TASK_PRIORITIES, [0.20, 0.50, 0.30]),
          relatedLead:    null,
          relatedContact: contact._id,
          completedAt:    completed,
          createdAt:      created,
          updatedAt:      created,
        });
      }
    }

    const tasks = await Task.insertMany(taskData, { timestamps: false });
    console.log(`✅ Created ${tasks.length} tasks.\n`);

    // ── Final Summary ──────────────────────────────────────────────────────────
    const statusCounts     = {};
    const taskStatusCounts = {};

    for (const l of leads) statusCounts[l.status] = (statusCounts[l.status] || 0) + 1;
    for (const t of tasks) taskStatusCounts[t.status] = (taskStatusCounts[t.status] || 0) + 1;

    const wonLeads       = leads.filter(l => l.status === "Won");
    const lostLeads      = leads.filter(l => l.status === "Lost");
    const totalWonValue  = wonLeads.reduce((s, l) => s + (l.value || 0), 0);
    const totalPipeline  = leads.reduce((s, l) => s + (l.value || 0), 0);
    const closed         = wonLeads.length + lostLeads.length;
    const winRate        = closed ? Math.round((wonLeads.length / closed) * 100) : 0;

    console.log("=".repeat(60));
    console.log("   SEEDING COMPLETE");
    console.log("=".repeat(60));
    console.log(`\n Data Summary for: ${user.email}`);
    console.log(`   User ID  : ${user._id}`);
    console.log(`\n   Leads    : ${leads.length}`);
    Object.entries(statusCounts).forEach(([s, c]) =>
      console.log(`     * ${s.padEnd(12)}: ${c}`)
    );
    console.log(`\n   Contacts : ${contacts.length}`);
    console.log(`   Notes    : ${notes.length}`);
    console.log(`\n   Tasks    : ${tasks.length}`);
    Object.entries(taskStatusCounts).forEach(([s, c]) =>
      console.log(`     * ${s.padEnd(12)}: ${c}`)
    );
    console.log(`\n Revenue`);
    console.log(`   Won Value      : ₹${totalWonValue.toLocaleString("en-IN")}`);
    console.log(`   Pipeline Total : ₹${totalPipeline.toLocaleString("en-IN")}`);
    console.log(`   Win Rate       : ${winRate}%`);
    console.log("\n" + "=".repeat(60));

  } catch (err) {
    console.error("\nSeeding failed:", err.message);
    if (err.stack) console.error(err.stack);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("\nMongoDB connection closed.\n");
  }
};

seed();
