import { MODES, PLANS } from "./plans";
import { FILES, USE_CASES, type UseCase } from "./use-cases";

// One page per thing people search for ("ai ppt maker", "text to ppt", ...). Each page has its
// own angle and its own facts, so no two pages repeat each other. Every sentence must stay true
// of the product: no invented numbers, users, ratings or speed claims. Plan numbers come from
// plans.ts so they can't go stale.

const free = PLANS.free;
const standardCards = Math.floor(free.monthlyCredits / MODES.standard.creditsPerCard);
const quickCards = Math.floor(free.monthlyCredits / MODES.quick.creditsPerCard);

export const SEARCH_PAGES: UseCase[] = [
  {
    slug: "ai-presentation-maker",
    name: "AI presentation maker",
    title: "AI presentation maker with sources",
    heading: "An AI presentation maker that shows where its facts come from",
    description:
      "Slidezza turns a topic, notes or a file into a designed presentation. It researches, lists its sources and checks numbers against two of them. Free to start.",
    intro: [
      "Slidezza is an AI presentation maker. You give it a topic, your notes or a file; it asks two quick questions, drafts an outline you can change, then writes and designs the slides.",
      "The difference is trust. Facts come from Wikipedia and independent web pages, they are listed with the deck, and a number is only used when two sources agree on it.",
    ],
    lead: "Type a topic or attach your material. Slidezza plans the story, writes every slide and designs it, and lists what it used.",
    steps: [
      { title: "Say what it's about", text: `Type a topic, paste notes, or attach ${FILES}.` },
      { title: "Answer two questions", text: "Who it's for and what to focus on. Then pick the length and detail, and edit the outline before anything is written." },
      { title: "Edit, present or download", text: "Change any slide by hand or by asking the assistant. Present full screen, share a link, or download a PDF." },
    ],
    points: [
      { title: "Sources listed", text: "Each factual deck ends with the sources it used, with links." },
      { title: "Numbers checked", text: "A number appears only when two independent sources agree. Figures from your own files are used as you gave them." },
      { title: "Real, credited photos", text: "Photos come from Wikimedia Commons and Openverse and carry their credit." },
      { title: "You stay in control", text: "Edit the outline first, then every slide. Nothing is locked." },
    ],
    prompts: [
      "How vaccines work, for a general audience, with a timeline of key discoveries",
      "The history of the Silk Road in 8 slides",
      "Quarterly update for the team: what shipped, what slipped, what's next",
    ],
    faq: [
      { q: "Is the content accurate?", a: "Factual decks are written from the sources the AI found, and numbers need two sources that agree. Mistakes are still possible, so read the sources list and check anything important before you present." },
      { q: "Do I need to design anything?", a: "No. Pick one of the themes; layouts such as bullets, columns, big numbers, timelines, tables and quotes are chosen to fit the content." },
      { q: "Is it free?", a: `Yes to start: ${free.monthlyCredits} credits a month, no card needed. See pricing for Pro and Max.` },
    ],
  },
  {
    slug: "ai-ppt-maker",
    name: "AI PPT maker",
    title: "AI PPT maker: topic to editable slides",
    heading: "An AI PPT maker that gives you slides you can still edit",
    description:
      "Make a PPT with AI: Slidezza writes and designs the slides from a topic or your files. Edit them online, present, share, or download a PDF or an editable .pptx on Pro.",
    intro: [
      "PPT is what people call a PowerPoint deck. Slidezza makes the deck for you from a topic or from your own material, and you can keep editing it in the browser.",
      "Free plans download a PDF and can present or share online. Pro and Max also download an editable .pptx, with real text boxes rather than flat pictures, so you can carry on in PowerPoint.",
    ],
    lead: "Describe the presentation you need. Slidezza builds the outline and the slides; you choose how to take it with you.",
    steps: [
      { title: "Describe it", text: "A topic, notes, or a file such as a report or an old .pptx to rework." },
      { title: "Check the outline", text: "Rename, reorder or cut cards before the slides are written." },
      { title: "Take it with you", text: "Present in the browser, share a view-only link, download a PDF, or (Pro and Max) download a .pptx." },
    ],
    points: [
      { title: "Editable PowerPoint file", text: "The .pptx has text you can change, in a 16:9 layout that mirrors what you see on screen." },
      { title: "Rework old decks", text: "Attach a PowerPoint (.pptx) and its text becomes the material for a new deck." },
      { title: "Themes", text: "Switch the look of the whole deck in one click, any time." },
      { title: "PDF on every plan", text: "Free decks download as PDF, so you can send or print them." },
    ],
    prompts: [
      "Turn the text of my old sales deck into a cleaner one for new clients",
      "A 10-slide intro to project management for new hires",
      "Product launch plan for a small bakery, with a timeline",
    ],
    faq: [
      { q: "Can I download a .pptx for free?", a: "No. PowerPoint download is part of Pro and Max. The Free plan downloads a PDF and can present and share online. Pricing shows what is open now." },
      { q: "Will it open in Google Slides or Keynote?", a: "A .pptx is the standard format those apps can import. How closely it matches depends on the app, so check the result there." },
      { q: "Does it look the same as on screen?", a: "The file is built to mirror the on-screen cards, and text is sized to fit. Fonts follow what your computer has, so small differences are possible." },
    ],
  },
  {
    slug: "ai-powerpoint-generator",
    name: "AI PowerPoint generator",
    title: "AI PowerPoint generator for any topic",
    heading: "Generate a PowerPoint-style presentation from one prompt",
    description:
      "Generate a presentation with AI from a prompt: pick the audience and length, edit the outline, and get designed slides with sources. PowerPoint download on Pro.",
    intro: [
      "Write one prompt and Slidezza generates the whole deck: outline first, then each slide with its text, layout and photo.",
      "You can open the result as a PowerPoint (.pptx) file on Pro and Max, or present it straight from the browser on any plan.",
    ],
    lead: "From a single prompt to a designed deck, with an outline step in between so you decide the story before the slides exist.",
    steps: [
      { title: "Write a prompt", text: "One or two sentences is enough. More detail gives a more specific deck." },
      { title: "Set the audience and length", text: "Choose who it's for, how many cards, and Low, Medium or High detail (High is on Pro and Max)." },
      { title: "Generate and refine", text: "Cards are written one by one. Ask the assistant to change a slide, or edit the text yourself." },
    ],
    points: [
      { title: "Eight layouts", text: "Title, section, bullets, columns, big numbers, timeline, table and quote, chosen to suit each slide." },
      { title: "Outline is free", text: "You only spend credits when cards are written, and failed cards are refunded." },
      { title: "Any language", text: "Write the prompt in your language and the deck follows." },
      { title: "Photos with credits", text: "Where a photo helps, a real one is added and credited." },
    ],
    prompts: [
      "Explain how electric cars work to people who have never driven one",
      "Annual review for a small design studio: wins, lessons, goals",
      "A beginner's guide to personal budgeting, 8 slides",
    ],
    faq: [
      { q: "How much does a deck cost in credits?", a: `Per card: Quick ${MODES.quick.creditsPerCard}, Standard ${MODES.standard.creditsPerCard}, Premium ${MODES.premium.creditsPerCard}. The Free plan has ${free.monthlyCredits} credits a month, about ${standardCards} Standard cards.` },
      { q: "Can I generate a PowerPoint file?", a: "Pro and Max download an editable .pptx. Every plan can present online, share a link and download a PDF." },
      { q: "Can I change a slide after it is generated?", a: "Yes. Edit the text yourself, or tell the assistant what to change, for example \"make slide 3 a timeline\"." },
    ],
  },
  {
    slug: "presentation-maker",
    name: "Presentation maker",
    title: "Online presentation maker",
    heading: "An online presentation maker you can type a topic into",
    description:
      "Make a presentation online: start from a topic, a template or your own file, edit every slide, then present full screen, share a link or download a PDF.",
    intro: [
      "Slidezza is a presentation maker that does the first draft for you. You still get everything you expect from one: themes, layouts, text editing, present mode and sharing.",
      "Use it from any browser. There is nothing to install, and the Free plan needs no card.",
    ],
    lead: "Start from a topic, a template or a file, and finish by editing like in any slide tool.",
    steps: [
      { title: "Pick a way to start", text: "Type a topic, choose a template, or attach your own material." },
      { title: "Shape it", text: "Edit text, swap layouts, change theme, add or remove slides." },
      { title: "Present or share", text: "Full-screen present mode with keyboard controls, a view-only link anyone can open, or a PDF." },
    ],
    points: [
      { title: "Themes", text: "Switch the look of every slide at once and keep your content." },
      { title: "Present mode", text: "Full screen with keyboard controls, no extra software." },
      { title: "Share links", text: "Viewers don't need an account. Keep a deck private when you prefer." },
      { title: "Templates", text: "Pitch, proposal, report, lesson, onboarding and talk starting points." },
    ],
    prompts: [
      "Our team's goals for next quarter, one slide per goal",
      "A 5-minute talk about my town for a school visit",
      "Welcome deck for new volunteers at our community garden",
    ],
    faq: [
      { q: "Do I have to use AI?", a: "AI writes the first version, but every slide can be edited by hand, and you can delete or rewrite anything it wrote." },
      { q: "Does it work on a phone?", a: "Yes for viewing and presenting. Building a deck is easier on a laptop." },
      { q: "What does it cost?", a: `The Free plan has ${free.monthlyCredits} credits a month. Pro and Max add more credits, all detail levels and PowerPoint download.` },
    ],
  },
  {
    slug: "ai-presentation-generator",
    name: "AI presentation generator",
    title: "AI presentation generator: how it works",
    heading: "An AI presentation generator with a plan, research and a check",
    description:
      "See what happens when you generate a presentation with Slidezza: setup questions, an editable outline, research with sources, then slides written one by one.",
    intro: [
      "Many generators go straight from your prompt to slides. Slidezza adds steps in between so the result fits you: it asks who the deck is for, shows you an outline, researches factual topics and writes each slide from what it found.",
      "Each step can be changed. That is why the deck is usually closer to what you meant.",
    ],
    lead: "Prompt, questions, outline, research, slides. You can step in at each stage.",
    steps: [
      { title: "Questions and outline", text: "Audience, focus, length and detail, then an outline you can reorder and edit. The outline is free." },
      { title: "Research", text: "For factual topics it reads Wikipedia and independent web pages and keeps a source list." },
      { title: "Writing and checking", text: "Cards are written from the sources. A number is used only when two sources agree; quotes must be word for word." },
    ],
    points: [
      { title: "Your files lead", text: "When you attach material, the slides follow it and use its figures as given." },
      { title: "Fallbacks", text: "If one AI provider is busy, another takes over, so a deck isn't lost halfway." },
      { title: "Refunds", text: "Cards that fail to generate are refunded to your credits." },
      { title: "Detail levels", text: "Low is short, Medium is presentation-ready, High packs in more facts and searches wider (Pro and Max)." },
    ],
    prompts: [
      "The causes and effects of inflation, for first-year economics students",
      "How a heat pump works, for homeowners deciding whether to buy one",
      "A short history of the printing press",
    ],
    faq: [
      { q: "Which AI does it use?", a: "Several providers, chosen per step and per plan, with automatic fallback. Your text is processed by them; the privacy policy lists which ones." },
      { q: "Why ask questions first?", a: "A deck for investors differs from one for a class. Two quick answers change the outline noticeably." },
      { q: "Can it still be wrong?", a: "Yes. Sources and number checks reduce errors but don't remove them. Read the sources list and check what matters." },
    ],
  },
  {
    slug: "ppt-generator",
    name: "PPT generator",
    title: "PPT generator from text or files",
    heading: "A PPT generator that starts from your text or files",
    description:
      "Generate a PPT from a topic, pasted text or a file (PDF, Word, Excel, PowerPoint, photos). Edit online, then download a PDF, or an editable .pptx on Pro.",
    intro: [
      "Paste text, describe a topic or attach a document, and Slidezza generates a deck you can edit. Tables, headings and figures in your files carry through to the slides.",
      "Download as PDF on any plan, or as an editable .pptx on Pro and Max.",
    ],
    lead: "The quickest route from material you already have to a deck you can present.",
    steps: [
      { title: "Add your material", text: `Paste text or attach ${FILES}. Up to 5 files per deck.` },
      { title: "Pick the shape", text: "Audience, number of cards, detail level and theme." },
      { title: "Generate and download", text: "Review the slides, fix anything, then download." },
    ],
    points: [
      { title: "Reads many formats", text: "PDF, Word, PowerPoint, Excel, CSV, text, Markdown and photos or scans." },
      { title: "Figures kept", text: "Numbers and table rows from your files are used as they are." },
      { title: "Editable .pptx", text: "Pro and Max download slides with real, editable text." },
      { title: "PDF for everyone", text: "Free decks download as PDF to email or print." },
    ],
    prompts: [
      "Summarise this PDF for a 10-minute briefing",
      "Turn this spreadsheet's results into a monthly update",
      "Make a training deck from this Word procedure",
    ],
    faq: [
      { q: "Is there a size limit?", a: "Files up to 15 MB. About 20,000 characters of text are used per file and 40,000 across the files in one deck." },
      { q: "Is the PPT download free?", a: "No, .pptx is on Pro and Max. The Free plan downloads PDF and can present and share online." },
      { q: "Are my files stored?", a: "Documents are read in your browser and the extracted text is stored with the deck. Photos and scans are sent to be read and the images are not stored." },
    ],
  },
  {
    slug: "text-to-ppt",
    name: "Text to PPT",
    title: "Text to PPT: turn notes into slides",
    heading: "Turn text into a PPT: paste notes, get slides",
    description:
      "Paste an article, notes or an essay and Slidezza turns it into a structured, designed presentation. Edit the outline, then present or download.",
    intro: [
      "Paste your text into the box, or attach it as a file. Slidezza reads it, works out the structure, and turns paragraphs into headlines, lists, big numbers, timelines and tables.",
      "Your wording and figures lead. The AI organises and shortens; it does not replace your facts with its own.",
    ],
    lead: "From a wall of text to a deck that someone will actually follow.",
    steps: [
      { title: "Paste or attach", text: "Paste notes, an article or an essay, or attach a document." },
      { title: "Choose the audience", text: "Tell it who will watch. A board update and a class talk need different slides." },
      { title: "Review the outline", text: "See how your text was split into slides and change it before generating." },
    ],
    points: [
      { title: "Structure from your text", text: "Headings and lists in your text become the outline." },
      { title: "Shorter on purpose", text: "Slides carry the point, not the paragraph." },
      { title: "Figures as given", text: "Numbers from your text are kept." },
      { title: "Any language", text: "Text in your language gives a deck in your language." },
    ],
    prompts: [
      "Here are my meeting notes. Make a 6-slide update for the team",
      "Turn this blog post into a talk with three key ideas",
      "Summarise this essay as a class presentation",
    ],
    faq: [
      { q: "How much text can I paste?", a: "About 20,000 characters per file or pasted block are used, and 40,000 across all material in one deck." },
      { q: "Can I get a .pptx?", a: "Yes on Pro and Max. Free decks download as PDF." },
      { q: "Will it change what my text says?", a: "It condenses and rearranges it into slides. Read the result and edit anything that no longer says what you meant." },
    ],
  },
  {
    slug: "ai-slide-generator",
    name: "AI slide generator",
    title: "AI slide generator: layouts and edits",
    heading: "An AI slide generator you can talk to slide by slide",
    description:
      "Generate slides with AI, then change any one by asking: make it a timeline, shorten it, add an example. Eight layouts, nine themes, credited photos.",
    intro: [
      "Generating the deck is half the job. Most of the work is changing a slide, and Slidezza has an assistant in the editor for that.",
      "Ask in plain words, for example \"turn slide 4 into a timeline\" or \"add a slide about costs\", and the slide changes.",
    ],
    lead: "Generate once, then adjust one slide at a time without starting over.",
    steps: [
      { title: "Generate the deck", text: "From a topic or files, with an outline you approve first." },
      { title: "Open the editor", text: "Slides sit in a rail on the side; click one to edit its text." },
      { title: "Ask the assistant", text: "Rewrite, shorten, add a slide, change layout or switch theme from a plain request." },
    ],
    points: [
      { title: "Eight layouts", text: "Title, section, bullets, columns, big numbers, timeline, table and quote." },
      { title: "Nine themes", text: "Change the look of every slide at once." },
      { title: "Photos that fit", text: "Photos are never cropped awkwardly; mismatched shapes show whole." },
      { title: "Per-slide control", text: "Rewrite one card without regenerating the deck." },
    ],
    prompts: [
      "A 12-slide onboarding for new support agents",
      "The water cycle, simply, for 8-year-olds",
      "Key results from our customer survey, with big numbers",
    ],
    faq: [
      { q: "Can I use my own material?", a: "Yes. Attach files such as a PDF or Word document and the slides follow them, then use the assistant to adjust any slide." },
      { q: "Can I change the photos?", a: "Yes. In the card editor you can search the free photo libraries and pick another one. Uploading your own pictures onto slides isn't supported yet." },
      { q: "Can I reorder slides?", a: "Yes, in the editor and in the outline before generating." },
    ],
  },
  {
    slug: "presentation-from-prompt",
    name: "Presentation from a prompt",
    title: "Create a presentation from a prompt",
    heading: "Create a presentation from one prompt, and write a better one",
    description:
      "How to get a good deck from a prompt: say the topic, audience and goal. Example prompts for talks, reports, pitches and lessons, ready to try in Slidezza.",
    intro: [
      "A good prompt says three things: what the deck is about, who will see it, and what you want them to do or remember.",
      "Below are prompts that work well. Click one to open Slidezza with it filled in, then change the details to your own.",
    ],
    lead: "Say the topic, the audience and the goal. Slidezza asks two follow-up questions and shows an outline before it writes.",
    steps: [
      { title: "Topic", text: "Be specific: \"Renewable energy policy in Germany since 2000\" beats \"energy\"." },
      { title: "Audience", text: "\"For year 9 students\", \"for investors\", \"for new hires\". The wording, depth and examples change." },
      { title: "Goal", text: "\"End with three action items\" or \"finish with a quiz\". The last slide follows." },
    ],
    points: [
      { title: "Templates have prompts", text: "Each template has a prompt with [brackets] to fill in." },
      { title: "Details you give are kept", text: "Names, numbers and dates in your prompt are used as given." },
      { title: "Outline before writing", text: "If the plan is off, change it before credits are spent on cards." },
      { title: "Any language", text: "Prompt in your language; the deck follows." },
    ],
    prompts: [
      "Pitch for a neighbourhood repair cafe: problem, plan, costs, the ask",
      "A 7-slide talk on why sleep matters for teenagers, ending with 3 tips",
      "Compare three note-taking apps for a small team, with a table",
      "Explain how the stock market works to a first-time investor",
    ],
    faq: [
      { q: "How long should a prompt be?", a: "One or two sentences work. Add the audience and any numbers or names you want kept." },
      { q: "Can I paste a long brief?", a: "Yes. A long brief or notes work well; see the text to PPT page." },
      { q: "What if the first result isn't right?", a: "Edit the outline, ask the assistant to change a slide, or regenerate with a more specific prompt." },
    ],
  },
  {
    slug: "presentation-maker-for-students",
    name: "Presentation maker for students",
    title: "Presentation maker for students",
    heading: "A presentation maker for students that shows its sources",
    description:
      "Make a school or university presentation with AI: researched facts from Wikipedia and the web, sources listed, numbers checked, and slides you can edit and present.",
    intro: [
      "For class talks, projects and competitions: Slidezza researches the topic, lists its sources and checks the numbers, so you can present with confidence and still make it your own.",
      "Always follow your school's rules on AI. Many allow it for research and drafting but expect your own words.",
    ],
    lead: "Start from the assignment, your notes or a photo of the board, and finish with slides in your own words.",
    steps: [
      { title: "Write your topic", text: "\"The water cycle for year 7\" or \"Causes of the French Revolution\". Or attach your notes, a worksheet or a photo of the board." },
      { title: "Choose the detail", text: "Medium is presentation-ready; High (Pro) adds more facts per slide and searches wider for each one." },
      { title: "Check and present", text: "Read the sources list, edit what you want in your own words, then present full screen." },
    ],
    points: [
      { title: "Sources you can cite", text: "Facts come from Wikipedia articles and web pages, listed with links at the end of the deck." },
      { title: "Numbers checked", text: "A number appears only when two independent sources agree on it." },
      { title: "Real photos, credited", text: "Photos come from Wikimedia Commons and Openverse with their credits." },
      { title: "Learn, don't copy", text: "Use the outline to understand the structure, and rewrite the slides in your own words where your school expects it." },
    ],
    prompts: [
      "A 5-minute talk on how volcanoes form, for a science class",
      "The life of Marie Curie for a history project, with a timeline",
      "Renewable energy in my country: pros, cons and the numbers",
    ],
    faq: [
      { q: "Can I trust the facts?", a: "Factual decks are written only from the sources the AI found, and numbers need two sources that agree. Mistakes are still possible, so check the sources list before you present." },
      { q: "Is it allowed at my school?", a: "Rules differ. Many schools allow AI for research and drafting but expect your own words; ask your teacher and say how you used it." },
      { q: "Do I need to pay?", a: `No. The Free plan gives ${free.monthlyCredits} credits every month, enough for about ${standardCards} Standard cards.` },
    ],
  },
  {
    slug: "business-presentation-maker",
    name: "Business presentation maker",
    title: "Business presentation maker with AI",
    heading: "A business presentation maker for reports, proposals and meetings",
    description:
      "Make business presentations with AI: reports, proposals, updates and onboarding decks from your notes or files, designed and ready to share. Templates included.",
    intro: [
      "Most business decks start from something that already exists: a spreadsheet, last month's report, a proposal draft. Slidezza starts there too.",
      "Attach the material, say who the audience is, and get a structured deck with your figures kept as given.",
    ],
    lead: "Reports, client proposals, team updates and onboarding, from the material you already have.",
    steps: [
      { title: "Start from a template or a file", text: "Sales proposal, monthly report, onboarding, or attach a spreadsheet, Word or PDF file." },
      { title: "Set the audience", text: "The board, a client or the team: the outline adapts." },
      { title: "Share it", text: "Send a view-only link, or download PDF (all plans) or an editable .pptx (Pro and Max)." },
    ],
    points: [
      { title: "Your figures stay yours", text: "Numbers from your files are used as given, and the AI is told not to invent statistics." },
      { title: "Tables and big numbers", text: "Results become table and big-number slides." },
      { title: "Remove the badge", text: "Paid plans remove the \"Made with Slidezza\" badge." },
      { title: "Private by default", text: "A deck is visible only through its link when you share it." },
    ],
    prompts: [
      "Monthly results report: key numbers, wins, problems, plan for next month",
      "Sales proposal for a mid-sized logistics client: problem, solution, scope, pricing",
      "Onboarding for new hires: mission, team, tools, first-week checklist",
    ],
    faq: [
      { q: "Is my business data safe?", a: "Decks stay private unless you share the link. Your text is processed by our AI providers, and some free tiers may use it to improve their models, so leave out confidential details. The privacy policy has the full list." },
      { q: "Can I use my company's colours?", a: "Not custom brand themes yet. Pick from the nine built-in themes." },
      { q: "Can my team edit the same deck?", a: "Not live. Share a view-only link, or download a .pptx on Pro and Max and edit it together elsewhere." },
    ],
  },
  {
    slug: "pitch-deck-generator",
    name: "Pitch deck generator",
    title: "AI pitch deck generator",
    heading: "A pitch deck generator that doesn't invent your numbers",
    description:
      "Make a pitch or client proposal deck with AI: problem, solution, market, pricing and next steps, written from your notes and designed in minutes.",
    intro: [
      "Describe the business or attach your notes, model or one-pager. Slidezza structures the pitch and designs it, and never invents traction or market numbers.",
      "Where a figure is missing, it is left for you to fill in, which beats a confident number that isn't true.",
    ],
    lead: "Structure and design for the pitch; the facts stay yours.",
    steps: [
      { title: "Describe or attach", text: "Paste your idea or attach a one-pager, spreadsheet or previous deck (.pptx)." },
      { title: "Choose the audience", text: "Investors, a client or a partner: the outline adapts to who will see it." },
      { title: "Polish and send", text: "Edit, pick a theme, then share a link or download PDF or PowerPoint (Pro)." },
    ],
    points: [
      { title: "No made-up numbers", text: "Without sources, the AI is told not to invent statistics; figures come from your files or are left for you to fill in." },
      { title: "Your figures as given", text: "Numbers from your spreadsheet or notes are used exactly as they are." },
      { title: "Premium writing", text: "Premium mode uses the strongest model for pitches and client work (Pro and Max)." },
      { title: "Remove the badge", text: "Paid plans remove the \"Made with Slidezza\" badge." },
    ],
    prompts: [
      "Seed pitch for a meal-prep subscription: problem, offer, pricing, go-to-market",
      "Proposal for a website redesign for a local dental clinic",
      "Partnership pitch to a gym chain for our nutrition app",
    ],
    faq: [
      { q: "Will it make up market size or traction?", a: "No. For personal or business topics without sources, the rules forbid invented statistics. Put your real numbers in the prompt or attach them." },
      { q: "Can I edit it in PowerPoint?", a: "Yes. Pro and Max download an editable .pptx." },
      { q: "Is my business information private?", a: "Decks stay private unless you share the link. Your text is processed by our AI providers, and some free tiers may use it to improve their models, so leave out confidential details. The privacy policy has the full list." },
    ],
  },
  {
    slug: "ai-presentation-maker-free",
    name: "Free AI presentation maker",
    title: "Free AI presentation maker",
    heading: "A free AI presentation maker: what the Free plan includes",
    description: `Slidezza's Free plan: ${free.monthlyCredits} credits a month, no card needed, sources listed, PDF download and share links. See exactly what is and isn't included.`,
    intro: [
      "You can make real decks on the Free plan. Here is exactly what it includes and what it doesn't, so there are no surprises.",
    ],
    lead: `${free.monthlyCredits} credits every month, no card needed. Quick and Standard quality, Medium detail, PDF download and share links.`,
    steps: [
      { title: "Sign up free", text: "An email and a password. No card." },
      { title: "Make a deck", text: `The outline is free. Cards cost credits: Quick ${MODES.quick.creditsPerCard}, Standard ${MODES.standard.creditsPerCard} per card, so ${free.monthlyCredits} credits is about ${quickCards} Quick cards or ${standardCards} Standard ones.` },
      { title: "Present and share", text: "Present full screen, share a link, or download a PDF." },
    ],
    points: [
      { title: "Included on Free", text: "Files as material, research with sources, number checks, all themes and layouts, present mode, share links, PDF download." },
      { title: "Not on Free", text: "Premium quality, Low and High detail levels, PowerPoint (.pptx) download, and removing the \"Made with Slidezza\" badge. Those are on Pro and Max." },
      { title: "Unused credits", text: "Unused credits carry over, up to one month's worth on Free." },
      { title: "No tricks", text: "Failed cards are refunded to your credits." },
    ],
    prompts: [
      "A 6-slide introduction to my favourite hobby",
      "Study notes on the causes of the First World War",
      "A short update for my club's committee",
    ],
    faq: [
      { q: "Is it really free?", a: "Yes. The Free plan costs nothing and needs no card. When credits run out you wait for next month or choose a paid plan." },
      { q: "What do I get by paying?", a: `Pro (${PLANS.pro.price}) has ${PLANS.pro.monthlyCredits.toLocaleString("en-US")} credits a month, all detail levels, Premium mode, PowerPoint download and no badge. Max (${PLANS.max.price}) has ${PLANS.max.monthlyCredits.toLocaleString("en-US")}. See the pricing page for what is open now.` },
      { q: "Is there a time limit?", a: "No. The Free plan doesn't expire." },
    ],
  },
];

export const findSearchPage = (slug: string) => SEARCH_PAGES.find((p) => p.slug === slug);

/** Pages linked from the footer and home page. */
export const FOOTER_SEARCH_SLUGS = [
  "ai-presentation-maker",
  "ai-ppt-maker",
  "ai-powerpoint-generator",
  "text-to-ppt",
  "presentation-from-prompt",
  "pitch-deck-generator",
  "ai-presentation-maker-free",
];

/** Every guide page, for "more ways to use" lists. */
export const guideLinks = (): { href: string; name: string }[] => [
  ...SEARCH_PAGES.map((p) => ({ href: `/${p.slug}`, name: p.name })),
  ...USE_CASES.map((u) => ({ href: `/make/${u.slug}`, name: u.name })),
];
