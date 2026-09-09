/* =========================================================
   Job Search Command Center — constants & seed data
   Loaded before app.js. Attaches to window.JSCC_DATA
   ========================================================= */
(function () {
  "use strict";

  var STORAGE_KEY = "jscc_data_v1";

  var STATUSES = [
    "Researching", "Interested", "Contacted", "Applied", "Conversation",
    "Interview", "Negotiating", "Offer", "Accepted"
  ];
  var SIDELINE_STATUSES = ["Rejected", "Withdrawn", "On Hold", "Archived"];
  var ALL_STATUSES = STATUSES.concat(SIDELINE_STATUSES);

  var TYPES = [
    "Contract", "Freelance", "Consulting", "Temporary", "Part-time",
    "Full-time", "Fractional", "Direct Client", "Agency Collaboration"
  ];

  var SOURCES = [
    "LinkedIn", "Wellfound", "Y Combinator", "Contra", "Toptal", "Braintrust",
    "Aquent", "Creative Circle", "24 Seven", "Artisan", "Onward Search",
    "Robert Half", "Company Website", "Referral", "Personal Network",
    "Direct Outreach", "Microsoft Ecosystem", "B Corp", "Climatebase",
    "Tech Jobs for Good", "Idealist", "Other"
  ];

  var CATEGORIES = [
    "Visual Design", "Brand / Identity", "Product Design", "UX/UI",
    "Design Systems", "Creative Direction", "Design Consulting",
    "Data Visualization", "Print / Editorial", "Other"
  ];

  var COMPANY_TYPES = [
    "Startup", "Small Business", "Mid-size Company", "Enterprise", "Agency",
    "Nonprofit", "Social Enterprise", "B Corp", "Microsoft Partner",
    "Microsoft Vendor", "Other"
  ];

  var IMPACT_AREAS = [
    "Climate", "Sustainability", "Education", "Healthcare", "Social Justice",
    "Community", "Accessibility", "Ethical Technology", "Conservation", "Other"
  ];

  var RELATIONSHIP_TYPES = [
    "Recruiter", "Hiring Manager", "Founder", "Creative Director",
    "Design Director", "Former Colleague", "Client", "Agency Contact",
    "Referral", "Friend / Professional Network", "Other"
  ];

  var ACTIVITY_TYPES = [
    "Added", "Researched", "Applied", "Email Sent", "LinkedIn Message",
    "Recruiter Conversation", "Interview", "Follow-up", "Portfolio Sent",
    "Proposal Sent", "Negotiation", "Rejected", "Accepted", "Note"
  ];

  var PRIORITIES = ["High", "Medium", "Low"];

  var COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-1000", "1000+"];

  var EVAL_DIMENSIONS = [
    { key: "roleFit", label: "Role Fit" },
    { key: "compensation", label: "Compensation" },
    { key: "companySize", label: "Company Size Fit" },
    { key: "values", label: "Values / Impact" },
    { key: "interesting", label: "Interesting Work" },
    { key: "remoteCompat", label: "Remote Compatibility" },
    { key: "geoCompat", label: "Geo / Timezone Fit" },
    { key: "consultingPotential", label: "Consulting Potential" }
  ];

  var STATUS_ORDER = ALL_STATUSES.reduce(function (m, s, i) { m[s] = i; return m; }, {});

  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function isoDaysFromNow(n) {
    var d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() + n);
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  function uid(prefix) {
    return prefix + "_" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
  }

  // ---------------------------------------------------------------
  // Seed data generator — builds a fresh realistic dataset relative
  // to "today" so overdue/upcoming logic always looks correct.
  // ---------------------------------------------------------------
  function buildSeedData() {
    var companies = [
      { id: "c1", name: "Meridian Cloud Partners", website: "meridiancloudpartners.com", industry: "Cloud & IT Services", size: "201-1000", location: "Seattle, WA (remote-friendly)", type: "Microsoft Partner", mission: "Helps mid-market enterprises modernize on Microsoft Azure and Dynamics.", bCorp: false, impactArea: "Other", notes: "Gold-tier Microsoft Partner. Warm intro via former Microsoft colleague." },
      { id: "c2", name: "Lumen Analytics", website: "lumenanalytics.io", industry: "SaaS / Data Tools", size: "11-50", location: "Austin, TX", type: "Startup", mission: "Analytics dashboards for mid-market operations teams.", bCorp: false, impactArea: "Other", notes: "Seed-stage, ~24 people. Design team of one." },
      { id: "c3", name: "Verdant Works", website: "verdantworks.co", industry: "Climate / ESG Software", size: "51-200", location: "Portland, OR", type: "B Corp", mission: "Carbon accounting and ESG reporting software for manufacturers.", bCorp: true, impactArea: "Sustainability", notes: "Certified B Corp since 2019. Strong design culture." },
      { id: "c4", name: "Kindred Studio", website: "kindred.studio", industry: "Creative Agency", size: "11-50", location: "Remote / Distributed", type: "Agency", mission: "Brand and digital experiences for mission-driven consumer brands.", bCorp: false, impactArea: "Other", notes: "Frequently brings on senior freelance visual/brand talent for campaigns." },
      { id: "c5", name: "Solstice Climate", website: "solsticeclimate.com", industry: "Climate Tech", size: "51-200", location: "London, UK", type: "Startup", mission: "Carbon accounting platform for supply chains.", bCorp: false, impactArea: "Climate", notes: "Series B, hiring a senior product design lead." },
      { id: "c6", name: "Anders & Vale", website: "andersandvale.com", industry: "Brand Consulting", size: "1-10", location: "Copenhagen, DK", type: "Small Business", mission: "Boutique brand consultancy for founder-led companies.", bCorp: false, impactArea: "Other", notes: "Principal is a former agency creative director — potential ongoing retainer." },
      { id: "c7", name: "Brightpath Recruiting", website: "brightpathrecruiting.com", industry: "Design Staffing", size: "11-50", location: "Remote (US)", type: "Agency", mission: "Specialist staffing agency for design and creative talent.", bCorp: false, impactArea: "Other", notes: "Recruiter keeps me in mind for senior contract roles." },
      { id: "c8", name: "Northlight Health", website: "northlighthealth.com", industry: "Digital Health", size: "51-200", location: "Denver, CO", type: "Startup", mission: "Accessible telehealth scheduling for underserved communities.", bCorp: false, impactArea: "Healthcare", notes: "Accessibility-first product. Marketing site refresh." },
      { id: "c9", name: "Tandem Devices", website: "tandemdevices.com", industry: "Consumer Hardware", size: "11-50", location: "San Francisco, CA", type: "Startup", mission: "Connected hardware + companion app for home wellness.", bCorp: false, impactArea: "Other", notes: "Physical + digital product design overlap." },
      { id: "c10", name: "Fieldnote Editorial", website: "fieldnoteeditorial.com", industry: "Editorial / Print Studio", size: "1-10", location: "Remote (US)", type: "Small Business", mission: "Independent publishing studio producing print journals and identity work.", bCorp: false, impactArea: "Other", notes: "Small, craft-focused. Good print/editorial portfolio fit." },
      { id: "c11", name: "Harbor & Finch", website: "harborandfinch.com", industry: "Sustainable Furniture", size: "51-200", location: "Portland, ME", type: "B Corp", mission: "Sustainably sourced furniture and home goods.", bCorp: true, impactArea: "Sustainability", notes: "Looking for a fractional creative/design lead 2 days/week." },
      { id: "c12", name: "Northstar Fintech", website: "northstarfintech.com", industry: "Fintech", size: "11-50", location: "New York, NY", type: "Startup", mission: "Banking tools for freelancers and independent workers.", bCorp: false, impactArea: "Other", notes: "Applied via Toptal, withdrew after scope changed." },
      { id: "c13", name: "Aurora Retail Group", website: "auroraretailgroup.com", industry: "Retail", size: "1000+", location: "Chicago, IL", type: "Enterprise", mission: "Multi-brand retail holding company.", bCorp: false, impactArea: "Other", notes: "Interim brand designer role via Robert Half." }
    ];

    var contacts = [
      { id: "p1", name: "Priya Anand", role: "Talent Partner", companyId: "c1", relationshipType: "Recruiter", email: "priya.anand@meridiancloudpartners.com", linkedin: "linkedin.com/in/priyaanand", location: "Seattle, WA", lastContact: isoDaysFromNow(-4), nextFollowUp: isoDaysFromNow(0), notes: "Coordinating scope for partner-portal brand refresh proposal." },
      { id: "p2", name: "Jonas Whitfield", role: "Founder & CEO", companyId: "c2", relationshipType: "Founder", email: "jonas@lumenanalytics.io", linkedin: "linkedin.com/in/jonaswhitfield", location: "Austin, TX", lastContact: isoDaysFromNow(-9), nextFollowUp: isoDaysFromNow(-2), notes: "Wants a senior contractor who can own product design end to end." },
      { id: "p3", name: "Dana Ruiz", role: "Head of Design", companyId: "c3", relationshipType: "Hiring Manager", email: "dana.ruiz@verdantworks.co", linkedin: "linkedin.com/in/danaruiz", location: "Portland, OR", lastContact: isoDaysFromNow(-2), nextFollowUp: isoDaysFromNow(3), notes: "Panel interview scheduled — design systems consultant role." },
      { id: "p4", name: "Theo Marsh", role: "Creative Director", companyId: "c4", relationshipType: "Creative Director", email: "theo@kindred.studio", linkedin: "linkedin.com/in/theomarsh", location: "Remote", lastContact: isoDaysFromNow(-1), nextFollowUp: isoDaysFromNow(0), notes: "Negotiating day rate for campaign freelance work." },
      { id: "p5", name: "Ingrid Solberg", role: "Design Director", companyId: "c5", relationshipType: "Design Director", email: "ingrid@solsticeclimate.com", linkedin: "linkedin.com/in/ingridsolberg", location: "London, UK", lastContact: isoDaysFromNow(-6), nextFollowUp: isoDaysFromNow(6), notes: "First call went well, timezone overlap is workable (3-4 hrs)." },
      { id: "p6", name: "Marcus Vale", role: "Principal", companyId: "c6", relationshipType: "Client", email: "marcus@andersandvale.com", linkedin: "linkedin.com/in/marcusvale", location: "Copenhagen, DK", lastContact: isoDaysFromNow(-14), nextFollowUp: isoDaysFromNow(1), notes: "Open to an ongoing brand consulting retainer, needs a proposal." },
      { id: "p7", name: "Carla Jimenez", role: "Senior Recruiter", companyId: "c7", relationshipType: "Recruiter", email: "carla@brightpathrecruiting.com", linkedin: "linkedin.com/in/carlajimenez", location: "Remote (US)", lastContact: isoDaysFromNow(-11), nextFollowUp: isoDaysFromNow(-3), notes: "Sends contract roles a few times a month, worth staying warm." },
      { id: "p8", name: "Sam O'Rourke", role: "Product Lead", companyId: "c8", relationshipType: "Hiring Manager", email: "sam@northlighthealth.com", linkedin: "linkedin.com/in/samorourke", location: "Denver, CO", lastContact: isoDaysFromNow(-5), nextFollowUp: isoDaysFromNow(4), notes: "Reviewing application for contract visual designer role." },
      { id: "p9", name: "Wei Chen", role: "Founder", companyId: "c9", relationshipType: "Founder", email: "wei@tandemdevices.com", linkedin: "linkedin.com/in/weichen", location: "San Francisco, CA", lastContact: isoDaysFromNow(-20), nextFollowUp: isoDaysFromNow(10), notes: "Early conversation, still researching fit before applying." },
      { id: "p10", name: "Renee Okafor", role: "Managing Editor", companyId: "c10", relationshipType: "Agency Contact", email: "renee@fieldnoteeditorial.com", linkedin: "linkedin.com/in/reneeokafor", location: "Remote (US)", lastContact: isoDaysFromNow(-8), nextFollowUp: isoDaysFromNow(5), notes: "Introduced by a former colleague — identity refresh project." },
      { id: "p11", name: "Bill Harmon", role: "Principal Consultant", companyId: "c1", relationshipType: "Former Colleague", email: "bill.harmon@example.com", linkedin: "linkedin.com/in/billharmon", location: "Redmond, WA", lastContact: isoDaysFromNow(-30), nextFollowUp: isoDaysFromNow(-6), notes: "Former Microsoft colleague, now at a Microsoft partner. Made the Meridian intro." },
      { id: "p12", name: "Aisha Rahman", role: "Design Lead (network contact)", companyId: null, relationshipType: "Friend / Professional Network", email: "aisha.rahman@example.com", linkedin: "linkedin.com/in/aisharahman", location: "Singapore", lastContact: isoDaysFromNow(-18), nextFollowUp: isoDaysFromNow(12), notes: "APAC-based former colleague — good source of referrals for regional remote roles." }
    ];

    var opportunities = [
      {
        id: "o1", title: "Brand Refresh — Partner Portal", companyId: "c1", url: "meridiancloudpartners.com", jobUrl: "",
        contactId: "p1", location: "Seattle, WA", timezone: "PT (UTC-8)", compensation: "$140/hr, ~6 weeks",
        dateDiscovered: isoDaysFromNow(-12), applicationDeadline: "",
        types: ["Consulting", "Direct Client"], source: "Microsoft Ecosystem", sourceOther: "",
        categories: ["Brand / Identity", "Design Systems"],
        resumeVersion: "Consulting one-pager", portfolioVersion: "Brand + Systems case studies", coverLetter: "Custom intro email",
        dateApplied: isoDaysFromNow(-10), applicationUrl: "", applicationStatus: "Proposal in review",
        recruiter: "", hiringManager: "Priya Anand", referral: "Bill Harmon", appNotes: "Sent scoped proposal for partner portal rebrand.",
        status: "Conversation", priority: "High", nextAction: "Follow up on proposal", nextFollowUp: isoDaysFromNow(0),
        notes: "Warm intro through Bill. Strong Microsoft-ecosystem fit and good rate.",
        scores: { roleFit: 4, compensation: 5, companySize: 4, values: 3, interesting: 4, remoteCompat: 5, geoCompat: 5, consultingPotential: 5 },
        dateAdded: isoDaysFromNow(-12)
      },
      {
        id: "o2", title: "Senior Product Designer (Contract)", companyId: "c2", url: "lumenanalytics.io", jobUrl: "lumenanalytics.io/careers/senior-product-designer",
        contactId: "p2", location: "Remote (US preferred)", timezone: "CT (UTC-6)", compensation: "$95/hr, 3-month contract",
        dateDiscovered: isoDaysFromNow(-15), applicationDeadline: "",
        types: ["Contract"], source: "Wellfound", sourceOther: "",
        categories: ["Product Design", "Data Visualization"],
        resumeVersion: "Product Design v3", portfolioVersion: "SaaS dashboards", coverLetter: "Standard intro",
        dateApplied: isoDaysFromNow(-13), applicationUrl: "lumenanalytics.io/careers/senior-product-designer", applicationStatus: "Awaiting response",
        recruiter: "", hiringManager: "Jonas Whitfield", referral: "", appNotes: "Applied directly, followed up once.",
        status: "Applied", priority: "High", nextAction: "Send follow-up email", nextFollowUp: isoDaysFromNow(-2),
        notes: "Small design team, would own product design end-to-end. Good data-viz fit.",
        scores: { roleFit: 4, compensation: 4, companySize: 3, values: 3, interesting: 4, remoteCompat: 5, geoCompat: 3, consultingPotential: 3 },
        dateAdded: isoDaysFromNow(-15)
      },
      {
        id: "o3", title: "Design Systems Consultant", companyId: "c3", url: "verdantworks.co", jobUrl: "verdantworks.co/careers",
        contactId: "p3", location: "Remote (US)", timezone: "PT (UTC-8)", compensation: "$130/hr, fractional 2 days/wk",
        dateDiscovered: isoDaysFromNow(-20), applicationDeadline: "",
        types: ["Consulting", "Fractional"], source: "Climatebase", sourceOther: "",
        categories: ["Design Systems"],
        resumeVersion: "Consulting one-pager", portfolioVersion: "Design systems case study", coverLetter: "Custom intro",
        dateApplied: isoDaysFromNow(-18), applicationUrl: "", applicationStatus: "Interview scheduled",
        recruiter: "", hiringManager: "Dana Ruiz", referral: "", appNotes: "Panel interview scheduled with design + eng leads.",
        status: "Interview", priority: "High", nextAction: "Prepare for panel interview", nextFollowUp: isoDaysFromNow(3),
        notes: "Certified B Corp, strong values alignment. Design system is early-stage and needs real ownership.",
        scores: { roleFit: 5, compensation: 4, companySize: 4, values: 5, interesting: 5, remoteCompat: 5, geoCompat: 4, consultingPotential: 5 },
        dateAdded: isoDaysFromNow(-20)
      },
      {
        id: "o4", title: "Freelance Visual Designer — Campaign Work", companyId: "c4", url: "kindred.studio", jobUrl: "",
        contactId: "p4", location: "Remote", timezone: "Flexible", compensation: "$85/hr, project-based",
        dateDiscovered: isoDaysFromNow(-9), applicationDeadline: "",
        types: ["Freelance", "Agency Collaboration"], source: "Referral", sourceOther: "",
        categories: ["Visual Design"],
        resumeVersion: "Visual Design v2", portfolioVersion: "Campaign & identity work", coverLetter: "Referral intro",
        dateApplied: isoDaysFromNow(-8), applicationUrl: "", applicationStatus: "Negotiating rate",
        recruiter: "", hiringManager: "Theo Marsh", referral: "Personal network", appNotes: "Discussing day rate and project scope.",
        status: "Negotiating", priority: "Medium", nextAction: "Confirm day rate", nextFollowUp: isoDaysFromNow(0),
        notes: "Agency brings recurring freelance work — good to build the relationship even if this project is small.",
        scores: { roleFit: 4, compensation: 3, companySize: 3, values: 3, interesting: 4, remoteCompat: 5, geoCompat: 4, consultingPotential: 4 },
        dateAdded: isoDaysFromNow(-9)
      },
      {
        id: "o5", title: "Senior UX/UI Designer", companyId: "c5", url: "solsticeclimate.com", jobUrl: "solsticeclimate.com/jobs/senior-ux-ui",
        contactId: "p5", location: "Remote (UK/EU hours preferred)", timezone: "GMT (UTC+0)", compensation: "£70k or contract equivalent",
        dateDiscovered: isoDaysFromNow(-7), applicationDeadline: isoDaysFromNow(20),
        types: ["Full-time", "Contract"], source: "Tech Jobs for Good", sourceOther: "",
        categories: ["UX/UI"],
        resumeVersion: "UX/UI v2", portfolioVersion: "Climate/data products", coverLetter: "",
        dateApplied: "", applicationUrl: "", applicationStatus: "",
        recruiter: "", hiringManager: "Ingrid Solberg", referral: "", appNotes: "Intro call complete, deciding whether to formally apply.",
        status: "Contacted", priority: "High", nextAction: "Decide on contract vs full-time ask", nextFollowUp: isoDaysFromNow(2),
        notes: "Climate mission is a strong fit. Timezone overlap workable with a later start.",
        scores: { roleFit: 4, compensation: 3, companySize: 4, values: 5, interesting: 4, remoteCompat: 4, geoCompat: 3, consultingPotential: 2 },
        dateAdded: isoDaysFromNow(-7)
      },
      {
        id: "o6", title: "Ongoing Brand Consulting Retainer", companyId: "c6", url: "andersandvale.com", jobUrl: "",
        contactId: "p6", location: "Remote", timezone: "CET (UTC+1)", compensation: "TBD — proposing $6k/mo retainer",
        dateDiscovered: isoDaysFromNow(-16), applicationDeadline: "",
        types: ["Consulting", "Direct Client"], source: "Direct Outreach", sourceOther: "",
        categories: ["Design Consulting", "Brand / Identity"],
        resumeVersion: "Consulting one-pager", portfolioVersion: "Brand strategy work", coverLetter: "Custom proposal",
        dateApplied: "", applicationUrl: "", applicationStatus: "",
        recruiter: "", hiringManager: "Marcus Vale", referral: "", appNotes: "Drafting retainer proposal.",
        status: "Researching", priority: "Medium", nextAction: "Draft retainer proposal", nextFollowUp: isoDaysFromNow(1),
        notes: "Marcus is a boutique brand consultant looking for overflow support — good long-term consulting fit.",
        scores: { roleFit: 4, compensation: 3, companySize: 2, values: 3, interesting: 3, remoteCompat: 5, geoCompat: 4, consultingPotential: 5 },
        dateAdded: isoDaysFromNow(-16)
      },
      {
        id: "o7", title: "General Contract Pipeline", companyId: "c7", url: "brightpathrecruiting.com", jobUrl: "",
        contactId: "p7", location: "Remote (US)", timezone: "Flexible", compensation: "Varies by placement",
        dateDiscovered: isoDaysFromNow(-25), applicationDeadline: "",
        types: ["Contract"], source: "Referral", sourceOther: "",
        categories: ["Other"],
        resumeVersion: "General v1", portfolioVersion: "Full portfolio", coverLetter: "",
        dateApplied: "", applicationUrl: "", applicationStatus: "",
        recruiter: "Carla Jimenez", hiringManager: "", referral: "", appNotes: "Keeping the relationship warm for future placements.",
        status: "Interested", priority: "Low", nextAction: "Check in for new roles", nextFollowUp: isoDaysFromNow(-3),
        notes: "Specialist design staffing agency — worth a quarterly check-in even without an active role.",
        scores: { roleFit: 3, compensation: 3, companySize: 3, values: 2, interesting: 2, remoteCompat: 4, geoCompat: 3, consultingPotential: 2 },
        dateAdded: isoDaysFromNow(-25)
      },
      {
        id: "o8", title: "Contract Visual Designer — Marketing Site", companyId: "c8", url: "northlighthealth.com", jobUrl: "northlighthealth.com/careers/visual-designer",
        contactId: "p8", location: "Remote (US)", timezone: "MT (UTC-7)", compensation: "$90/hr, 6-8 weeks",
        dateDiscovered: isoDaysFromNow(-6), applicationDeadline: "",
        types: ["Contract"], source: "LinkedIn", sourceOther: "",
        categories: ["Visual Design"],
        resumeVersion: "Visual Design v2", portfolioVersion: "Marketing/web work", coverLetter: "Standard intro",
        dateApplied: isoDaysFromNow(-5), applicationUrl: "northlighthealth.com/careers/visual-designer", applicationStatus: "Under review",
        recruiter: "", hiringManager: "Sam O'Rourke", referral: "", appNotes: "Applied with tailored accessibility-forward portfolio pieces.",
        status: "Applied", priority: "Medium", nextAction: "Check application status", nextFollowUp: isoDaysFromNow(4),
        notes: "Accessibility-first product mission, straightforward marketing-site scope.",
        scores: { roleFit: 3, compensation: 3, companySize: 3, values: 4, interesting: 3, remoteCompat: 4, geoCompat: 3, consultingPotential: 2 },
        dateAdded: isoDaysFromNow(-6)
      },
      {
        id: "o9", title: "Product Designer — Hardware Companion App", companyId: "c9", url: "tandemdevices.com", jobUrl: "tandemdevices.com/jobs",
        contactId: "p9", location: "Remote (US, occasional SF travel)", timezone: "PT (UTC-8)", compensation: "$110/hr or FTE DOE",
        dateDiscovered: isoDaysFromNow(-3), applicationDeadline: "",
        types: ["Full-time", "Contract"], source: "Company Website", sourceOther: "",
        categories: ["Product Design"],
        resumeVersion: "", portfolioVersion: "", coverLetter: "",
        dateApplied: "", applicationUrl: "", applicationStatus: "",
        recruiter: "", hiringManager: "Wei Chen", referral: "", appNotes: "",
        status: "Researching", priority: "Medium", nextAction: "Research company + product line", nextFollowUp: isoDaysFromNow(6),
        notes: "Hardware + app crossover is interesting, but occasional SF travel may be a constraint.",
        scores: { roleFit: 3, compensation: 3, companySize: 3, values: 2, interesting: 4, remoteCompat: 3, geoCompat: 2, consultingPotential: 2 },
        dateAdded: isoDaysFromNow(-3)
      },
      {
        id: "o10", title: "Branding Project — Identity Refresh", companyId: "c10", url: "fieldnoteeditorial.com", jobUrl: "",
        contactId: "p10", location: "Remote", timezone: "Flexible", compensation: "$12k flat, 4-week project",
        dateDiscovered: isoDaysFromNow(-8), applicationDeadline: "",
        types: ["Freelance"], source: "Personal Network", sourceOther: "",
        categories: ["Brand / Identity", "Print / Editorial"],
        resumeVersion: "Visual Design v2", portfolioVersion: "Print & editorial", coverLetter: "Referral intro",
        dateApplied: "", applicationUrl: "", applicationStatus: "",
        recruiter: "", hiringManager: "Renee Okafor", referral: "Former colleague", appNotes: "",
        status: "Interested", priority: "Medium", nextAction: "Send proposal", nextFollowUp: isoDaysFromNow(5),
        notes: "Small, craft-driven studio — strong print/editorial portfolio fit.",
        scores: { roleFit: 4, compensation: 3, companySize: 2, values: 3, interesting: 4, remoteCompat: 5, geoCompat: 4, consultingPotential: 3 },
        dateAdded: isoDaysFromNow(-8)
      },
      {
        id: "o11", title: "Fractional Design Lead", companyId: "c11", url: "harborandfinch.com", jobUrl: "harborandfinch.com/careers",
        contactId: null, location: "Remote (US East preferred)", timezone: "ET (UTC-5)", compensation: "$9k/mo, 2 days/week",
        dateDiscovered: isoDaysFromNow(-22), applicationDeadline: "",
        types: ["Fractional", "Consulting"], source: "B Corp", sourceOther: "",
        categories: ["Creative Direction", "Product Design"],
        resumeVersion: "Consulting one-pager", portfolioVersion: "Full portfolio", coverLetter: "Custom intro",
        dateApplied: isoDaysFromNow(-20), applicationUrl: "", applicationStatus: "Offer extended",
        recruiter: "", hiringManager: "", referral: "", appNotes: "Verbal offer received, reviewing agreement terms.",
        status: "Offer", priority: "High", nextAction: "Review and confirm fractional agreement", nextFollowUp: isoDaysFromNow(0),
        notes: "Certified B Corp, sustainable furniture brand. Great values fit and manageable weekly commitment.",
        scores: { roleFit: 5, compensation: 4, companySize: 4, values: 5, interesting: 4, remoteCompat: 5, geoCompat: 4, consultingPotential: 5 },
        dateAdded: isoDaysFromNow(-22)
      },
      {
        id: "o12", title: "Data Visualization Designer — Carbon Dashboard", companyId: "c5", url: "solsticeclimate.com", jobUrl: "",
        contactId: "p5", location: "Remote (UK/EU hours)", timezone: "GMT (UTC+0)", compensation: "$70/hr, part-time",
        dateDiscovered: isoDaysFromNow(-30), applicationDeadline: "",
        types: ["Part-time"], source: "LinkedIn", sourceOther: "",
        categories: ["Data Visualization"],
        resumeVersion: "Product Design v3", portfolioVersion: "Data viz", coverLetter: "",
        dateApplied: isoDaysFromNow(-28), applicationUrl: "", applicationStatus: "Closed — role paused",
        recruiter: "", hiringManager: "Ingrid Solberg", referral: "", appNotes: "Team decided to pause this specific part-time req.",
        status: "Rejected", priority: "Low", nextAction: "", nextFollowUp: "",
        notes: "Not a fit right now, but stayed in touch — led to opportunity o5.",
        scores: { roleFit: 3, compensation: 2, companySize: 3, values: 4, interesting: 3, remoteCompat: 4, geoCompat: 3, consultingPotential: 1 },
        dateAdded: isoDaysFromNow(-30)
      },
      {
        id: "o13", title: "Design Systems Audit", companyId: "c2", url: "lumenanalytics.io", jobUrl: "",
        contactId: "p2", location: "Remote", timezone: "CT (UTC-6)", compensation: "$8k flat, 2-week audit",
        dateDiscovered: isoDaysFromNow(-40), applicationDeadline: "",
        types: ["Consulting"], source: "Direct Outreach", sourceOther: "",
        categories: ["Design Systems"],
        resumeVersion: "", portfolioVersion: "", coverLetter: "",
        dateApplied: "", applicationUrl: "", applicationStatus: "",
        recruiter: "", hiringManager: "Jonas Whitfield", referral: "", appNotes: "Paused while budget is reassessed next quarter.",
        status: "On Hold", priority: "Low", nextAction: "Check back next quarter", nextFollowUp: isoDaysFromNow(25),
        notes: "Separate smaller engagement proposed alongside the contract role.",
        scores: { roleFit: 3, compensation: 2, companySize: 3, values: 3, interesting: 3, remoteCompat: 5, geoCompat: 3, consultingPotential: 4 },
        dateAdded: isoDaysFromNow(-40)
      },
      {
        id: "o14", title: "Creative Director — Part-time Engagement", companyId: "c4", url: "kindred.studio", jobUrl: "",
        contactId: "p4", location: "Remote", timezone: "Flexible", compensation: "$7.5k/mo, ~15 hrs/week",
        dateDiscovered: isoDaysFromNow(-45), applicationDeadline: "",
        types: ["Part-time", "Fractional"], source: "Referral", sourceOther: "",
        categories: ["Creative Direction"],
        resumeVersion: "Consulting one-pager", portfolioVersion: "Full portfolio", coverLetter: "",
        dateApplied: isoDaysFromNow(-42), applicationUrl: "", applicationStatus: "Accepted",
        recruiter: "", hiringManager: "Theo Marsh", referral: "Personal network", appNotes: "Signed agreement, starting next month.",
        status: "Accepted", priority: "High", nextAction: "Onboard and set cadence", nextFollowUp: isoDaysFromNow(14),
        notes: "Great long-term fit — recurring part-time creative direction across client accounts.",
        scores: { roleFit: 5, compensation: 4, companySize: 3, values: 3, interesting: 5, remoteCompat: 5, geoCompat: 4, consultingPotential: 5 },
        dateAdded: isoDaysFromNow(-45)
      },
      {
        id: "o15", title: "UX Designer, Fintech Onboarding", companyId: "c12", url: "northstarfintech.com", jobUrl: "",
        contactId: null, location: "Remote (US)", timezone: "ET (UTC-5)", compensation: "$100/hr, 3-month contract",
        dateDiscovered: isoDaysFromNow(-35), applicationDeadline: "",
        types: ["Contract"], source: "Toptal", sourceOther: "",
        categories: ["UX/UI"],
        resumeVersion: "UX/UI v2", portfolioVersion: "Fintech/onboarding", coverLetter: "",
        dateApplied: isoDaysFromNow(-33), applicationUrl: "", applicationStatus: "Withdrawn by candidate",
        recruiter: "", hiringManager: "", referral: "", appNotes: "Scope shifted to full-time only after screening — withdrew.",
        status: "Withdrawn", priority: "Low", nextAction: "", nextFollowUp: "",
        notes: "Not pursuing — scope changed to require full relocation-equivalent availability.",
        scores: { roleFit: 3, compensation: 3, companySize: 2, values: 2, interesting: 2, remoteCompat: 3, geoCompat: 2, consultingPotential: 2 },
        dateAdded: isoDaysFromNow(-35)
      },
      {
        id: "o16", title: "Interim Brand Designer", companyId: "c13", url: "auroraretailgroup.com", jobUrl: "",
        contactId: null, location: "Remote (US)", timezone: "CT (UTC-6)", compensation: "$85/hr, 4-6 months",
        dateDiscovered: isoDaysFromNow(-5), applicationDeadline: "",
        types: ["Contract", "Temporary"], source: "Robert Half", sourceOther: "",
        categories: ["Brand / Identity"],
        resumeVersion: "Visual Design v2", portfolioVersion: "Brand/retail work", coverLetter: "",
        dateApplied: isoDaysFromNow(-4), applicationUrl: "", applicationStatus: "Interview scheduled",
        recruiter: "", hiringManager: "", referral: "", appNotes: "Staffing agency submitted profile, interview confirmed.",
        status: "Interview", priority: "Medium", nextAction: "Prep interview questions", nextFollowUp: isoDaysFromNow(1),
        notes: "Large enterprise, less mission alignment but solid rate and clear scope.",
        scores: { roleFit: 3, compensation: 4, companySize: 2, values: 2, interesting: 2, remoteCompat: 4, geoCompat: 3, consultingPotential: 2 },
        dateAdded: isoDaysFromNow(-5)
      }
    ];

    // ---- Activity timeline entries (auto-generated per opportunity) ----
    var activityScript = {
      o1: [["Researched", -12, "Learned about the partner-portal rebrand need through Bill."], ["Email Sent", -11, "Sent introductory email to Priya Anand."], ["Proposal Sent", -10, "Sent scoped proposal for partner portal rebrand."], ["Recruiter Conversation", -3, "Priya said leadership is reviewing budget this week."]],
      o2: [["Researched", -15, "Reviewed Lumen's product and design team size."], ["Applied", -13, "Applied directly through careers page."], ["Follow-up", -6, "Sent a polite follow-up email."]],
      o3: [["Researched", -20, "Read Verdant's B Corp impact report."], ["Applied", -18, "Submitted application with design systems case study."], ["Recruiter Conversation", -9, "30-minute call with Dana Ruiz."], ["Interview", 3, "Panel interview with design + engineering leads."]],
      o4: [["Researched", -9, "Theo shared campaign brief via referral."], ["LinkedIn Message", -8, "Exchanged messages with Theo Marsh."], ["Negotiation", -1, "Discussing day rate for the campaign scope."]],
      o5: [["Researched", -7, "Reviewed Solstice Climate's product and mission."], ["LinkedIn Message", -6, "Connected with Ingrid Solberg."], ["Recruiter Conversation", -2, "Intro call — discussed contract vs. full-time."]],
      o6: [["Researched", -16, "Reviewed Anders & Vale's client roster."], ["Email Sent", -14, "Reached out directly to Marcus Vale."], ["Follow-up", -2, "Marcus confirmed interest in a retainer."]],
      o7: [["Recruiter Conversation", -25, "Initial call with Carla Jimenez."], ["Follow-up", -11, "Quarterly check-in call."]],
      o8: [["Researched", -6, "Reviewed Northlight's accessibility guidelines."], ["Applied", -5, "Applied with accessibility-forward case studies."]],
      o9: [["Added", -3, "Found opening on Tandem's careers page."]],
      o10: [["Researched", -8, "Renee shared the identity refresh brief."], ["Portfolio Sent", -7, "Sent print/editorial portfolio samples."]],
      o11: [["Researched", -22, "Learned about Harbor & Finch through B Corp directory."], ["Applied", -20, "Submitted fractional lead proposal."], ["Interview", -10, "Two rounds of interviews completed."], ["Negotiation", -2, "Discussed terms of fractional agreement."], ["Note", 0, "Verbal offer extended — reviewing written agreement."]],
      o12: [["Researched", -30, "Found part-time data viz req on LinkedIn."], ["Applied", -28, "Applied for part-time role."], ["Rejected", -19, "Team paused the part-time req."]],
      o13: [["Researched", -40, "Proposed a design systems audit alongside the contract role."], ["Note", -38, "Jonas said budget needs board approval."]],
      o14: [["Researched", -45, "Theo proposed a recurring creative direction engagement."], ["Proposal Sent", -44, "Sent part-time engagement proposal."], ["Negotiation", -43, "Agreed on scope and cadence."], ["Accepted", -42, "Signed agreement for part-time creative direction."]],
      o15: [["Researched", -35, "Found fintech onboarding contract via Toptal."], ["Applied", -33, "Applied through Toptal."], ["Note", -25, "Scope shifted to full-time only."], ["Rejected", -24, "Withdrew from consideration."]],
      o16: [["Researched", -5, "Robert Half recruiter shared the interim brand designer role."], ["Applied", -4, "Submitted profile through agency."], ["Recruiter Conversation", -1, "Interview confirmed for next week."]]
    };

    var activities = [];
    Object.keys(activityScript).forEach(function (oppId) {
      activityScript[oppId].forEach(function (row) {
        activities.push({
          id: uid("act"),
          opportunityId: oppId,
          type: row[0],
          note: row[2],
          date: isoDaysFromNow(row[1])
        });
      });
    });
    // sort activities chronologically
    activities.sort(function (a, b) { return a.date < b.date ? -1 : 1; });

    var tasks = [
      { id: "t1", task: "Follow up with Priya on proposal status", dueDate: isoDaysFromNow(0), priority: "High", opportunityId: "o1", contactId: "p1", completed: false },
      { id: "t2", task: "Send updated portfolio to Jonas", dueDate: isoDaysFromNow(-2), priority: "High", opportunityId: "o2", contactId: "p2", completed: false },
      { id: "t3", task: "Prepare for Verdant Works panel interview", dueDate: isoDaysFromNow(3), priority: "High", opportunityId: "o3", contactId: "p3", completed: false },
      { id: "t4", task: "Confirm day rate with Theo", dueDate: isoDaysFromNow(0), priority: "Medium", opportunityId: "o4", contactId: "p4", completed: false },
      { id: "t5", task: "Research Solstice Climate leadership team", dueDate: isoDaysFromNow(-9), priority: "Medium", opportunityId: "o5", contactId: "p5", completed: true },
      { id: "t6", task: "Send retainer proposal to Marcus", dueDate: isoDaysFromNow(1), priority: "Medium", opportunityId: "o6", contactId: "p6", completed: false },
      { id: "t7", task: "Reply to Carla's check-in message", dueDate: isoDaysFromNow(-3), priority: "Low", opportunityId: "o7", contactId: "p7", completed: false },
      { id: "t8", task: "Check application status with Sam", dueDate: isoDaysFromNow(4), priority: "Medium", opportunityId: "o8", contactId: "p8", completed: false },
      { id: "t9", task: "Send proposal to Renee for identity refresh", dueDate: isoDaysFromNow(5), priority: "Medium", opportunityId: "o10", contactId: "p10", completed: false },
      { id: "t10", task: "Review and sign Harbor & Finch fractional agreement", dueDate: isoDaysFromNow(0), priority: "High", opportunityId: "o11", contactId: null, completed: false },
      { id: "t11", task: "Send thank-you note after Solstice call", dueDate: isoDaysFromNow(-5), priority: "Low", opportunityId: "o5", contactId: "p5", completed: true },
      { id: "t12", task: "Reconnect with Bill Harmon", dueDate: isoDaysFromNow(-6), priority: "Low", opportunityId: "o1", contactId: "p11", completed: false },
      { id: "t13", task: "Prep interview questions for Aurora Retail Group", dueDate: isoDaysFromNow(1), priority: "High", opportunityId: "o16", contactId: null, completed: false },
      { id: "t14", task: "Send thank-you note after Tandem intro call", dueDate: isoDaysFromNow(-1), priority: "Low", opportunityId: "o9", contactId: "p9", completed: true },
      { id: "t15", task: "Refresh UX/UI resume version", dueDate: isoDaysFromNow(4), priority: "Low", opportunityId: null, contactId: null, completed: false },
      { id: "t16", task: "Check in with Aisha for APAC referrals", dueDate: isoDaysFromNow(12), priority: "Low", opportunityId: null, contactId: "p12", completed: false }
    ];

    return {
      version: 1,
      companies: companies,
      contacts: contacts,
      opportunities: opportunities,
      tasks: tasks,
      activities: activities
    };
  }

  window.JSCC_DATA = {
    STORAGE_KEY: STORAGE_KEY,
    STATUSES: STATUSES,
    SIDELINE_STATUSES: SIDELINE_STATUSES,
    ALL_STATUSES: ALL_STATUSES,
    STATUS_ORDER: STATUS_ORDER,
    TYPES: TYPES,
    SOURCES: SOURCES,
    CATEGORIES: CATEGORIES,
    COMPANY_TYPES: COMPANY_TYPES,
    IMPACT_AREAS: IMPACT_AREAS,
    RELATIONSHIP_TYPES: RELATIONSHIP_TYPES,
    ACTIVITY_TYPES: ACTIVITY_TYPES,
    PRIORITIES: PRIORITIES,
    COMPANY_SIZES: COMPANY_SIZES,
    EVAL_DIMENSIONS: EVAL_DIMENSIONS,
    uid: uid,
    isoDaysFromNow: isoDaysFromNow,
    buildSeedData: buildSeedData
  };
})();
