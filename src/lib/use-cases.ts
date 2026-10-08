// Landing pages for what people search for ("pdf to presentation", "pitch deck maker").
// Every sentence must stay true of the product: no invented numbers, users or reviews.

export interface UseCase {
  slug: string;
  /** On-page heading, when it should differ from the title. */
  heading?: string;
  /** Short paragraphs under the heading that say what the page is about. */
  intro?: string[];
  /** Short name for links. */
  name: string;
  /** Page title (also the <title>). */
  title: string;
  description: string;
  lead: string;
  steps: { title: string; text: string }[];
  points: { title: string; text: string }[];
  prompts: string[];
  /** Who it's for, what you can make and what it can't do: shown as "At a glance". */
  who?: string;
  makes?: string;
  limits?: string;
  /** Slugs of pages outside this page's topic group that are worth a link. */
  also?: string[];
  faq: { q: string; a: string }[];
}

export const FILES = "PDF, Word (.docx), PowerPoint (.pptx), Excel (.xlsx), text and Markdown files, and photos or scans";

export const USE_CASES: UseCase[] = [
  {
    slug: "pdf-to-presentation",
    name: "PDF to presentation",
    title: "Turn a PDF into a presentation with AI",
    intro: [
      "A PDF is often the starting point: a report, a paper, a handout, a scanned chapter. Slidezza reads it and writes slides from what it says, instead of from the AI's general knowledge.",
      "Text PDFs are read in your browser. Pages without a text layer are read by an AI model that sees images."
    ],
    description:
      "Attach a PDF (report, paper, handout or scan) and Slidezza turns it into a designed slide deck you can edit, present, and download as PDF or PowerPoint.",
    lead: "Attach a report, article, study or scanned handout. Slidezza reads it, plans the story and writes the slides from what the file actually says.",
    steps: [
      { title: "Attach your PDF", text: `Click Add files or drop it on the box. ${FILES} work too; up to 5 files per deck.` },
      { title: "Pick who it's for", text: "Answer two quick questions (audience and focus), choose the length and detail, then edit the outline." },
      { title: "Get the slides", text: "Each slide is written from your file. Figures from your file are used as given; anything added from the web is checked against two sources." },
    ],
    points: [
      { title: "Text PDFs and scans", text: "Text is read in your browser. Scanned pages without a text layer are read by an AI model that sees images." },
      { title: "Your numbers stay yours", text: "Names, figures and wording from your file are kept, so the deck matches the document." },
      { title: "Sources listed", text: "The deck lists the files and web sources its facts came from." },
      { title: "Edit everything", text: "Change any slide by hand, or ask the assistant: \"make slide 3 a timeline\"." },
    ],
    prompts: [
      "Summarise this report for my team meeting: key results, problems, next steps",
      "Turn this research paper into a 10-minute class presentation",
      "Make a client update from this PDF, focused on what changed this quarter",
    ],
    who: "Anyone with a report, paper, handout or scan to present: students, analysts, managers, teachers.",
    makes: "A summary deck, a class presentation or a client update built from what the PDF says.",
    limits: "Very long PDFs are cut to about 20,000 characters. Scanned pages are read by an AI that sees images, so poor scans can be misread. Check figures against the original.",
    also: ["/document-to-presentation", "/research-presentation-maker", "/text-to-ppt"],
    faq: [
      { q: "Is my PDF uploaded to your servers?", a: "Text PDFs are read in your browser and only the extracted text is sent to write the deck; it is stored with the deck so slides can be checked against it. Scanned pages are sent as images to be read, and the images are not stored." },
      { q: "How long can the PDF be?", a: "Files up to 15 MB. About 20,000 characters of text are used from each file and 40,000 across all files in one deck, which covers most reports and papers." },
      { q: "Can I download the result as PowerPoint?", a: "Yes on Pro and Max. Every plan can present online, share a link and download a PDF." },
    ],
  },
  {
    slug: "word-to-powerpoint",
    name: "Word to PowerPoint",
    title: "Turn a Word document into slides",
    intro: [
      "Slidezza reads a Word document (.docx) and redesigns its content as a presentation: headings become the story, tables become table slides, lists become short slides.",
      "It keeps your content and figures, not your page layout, so the result looks like slides rather than a document."
    ],
    description:
      "Convert a Word document (.docx) into a designed presentation with AI. Tables become table slides, headings become the story. Download as PowerPoint on Pro.",
    lead: "Notes, a draft, a proposal or meeting minutes in Word: attach the .docx and get a structured, designed deck instead of copy-pasting into slides.",
    steps: [
      { title: "Attach the .docx", text: "Tables are read row by row, so figures arrive intact. Old .doc files need saving as .docx first." },
      { title: "Shape the outline", text: "Choose the audience and focus, then rename, reorder or cut cards before anything is written." },
      { title: "Present or export", text: "Present full screen, share a link, or download PDF (all plans) or PowerPoint (.pptx, Pro and Max)." },
    ],
    points: [
      { title: "Structure, not a copy", text: "The AI turns paragraphs into headlines, lists, big numbers, timelines and tables." },
      { title: "Several files at once", text: "Combine a Word draft with a spreadsheet or PDF; up to 5 files per deck." },
      { title: "Any language", text: "Write in your language and the deck follows." },
      { title: "Themes", text: "Pick from nine themes and switch any time without losing content." },
    ],
    prompts: [
      "Turn these meeting notes into a short update for the board",
      "Make a training session from this procedure document",
      "Create a proposal deck from this Word draft for a new client",
    ],
    who: "People who write in Word first: managers, consultants, students, project leads.",
    makes: "A deck from a draft, proposal, procedure or meeting minutes, with tables kept as table slides.",
    limits: "Only .docx is read (save old .doc files as .docx). Your Word layout is not copied: the content is redesigned as slides.",
    also: ["/document-to-presentation", "/ai-ppt-maker", "/business-presentation-maker"],
    faq: [
      { q: "Does it keep my formatting?", a: "It keeps your content (headings, lists, tables, numbers) and redesigns it as slides in the theme you choose, rather than copying the document's layout." },
      { q: "What about Google Docs or Pages?", a: "Download them as .docx or PDF first, then attach the file." },
      { q: "Is it free?", a: "Yes, the Free plan includes 60 credits a month (about 30 cards at Standard quality). File uploads work on every plan." },
    ],
  },
  {
    slug: "business-report-presentation",
    name: "Business reports",
    title: "Turn reports and spreadsheets into meeting slides",
    intro: [
      "Reports and spreadsheets already hold the story. Slidezza turns them into meeting slides: headline numbers first, detail after, next steps last.",
      "Figures from your files are used exactly as they are, and the files are listed as the deck's sources."
    ],
    description:
      "Make monthly, quarterly or project report slides with AI from your spreadsheet, PDF or notes: key numbers, problems and next steps, ready for the meeting.",
    lead: "Attach the spreadsheet or report you already have and get a clear meeting deck: the headline numbers, what changed, what went wrong and what happens next.",
    steps: [
      { title: "Attach the data", text: "Excel (.xlsx), CSV, PDF or Word. Each sheet is read with its column headers." },
      { title: "Say who's in the room", text: "Your manager, the board or the whole team: the focus changes with the audience." },
      { title: "Present", text: "Big-number, table and timeline slides keep the meeting on the point." },
    ],
    points: [
      { title: "Figures used as given", text: "Numbers from your files go on slides exactly as written." },
      { title: "Table slides", text: "Comparisons and records become clean table slides." },
      { title: "High detail", text: "On Pro, High detail packs more facts into each slide for dense reviews." },
      { title: "Reuse monthly", text: "Duplicate last month's deck and update it, or start fresh from the new file." },
    ],
    prompts: [
      "Monthly sales review: results by region, best sellers, problems, next steps",
      "Quarterly project update for the steering committee",
      "Customer support report: volumes, response times and top issues",
    ],
    who: "Team leads, analysts and managers who report results to a team, board or client.",
    makes: "A monthly or quarterly report, a results update or a project review, with key figures as big-number slides.",
    limits: "It presents the figures you give it; it can't judge whether the numbers are right. Brand colours and logos aren't supported yet.",
    also: ["/business-presentation-maker", "/sales-presentation-maker", "/ppt-generator"],
    faq: [
      { q: "Does it calculate totals or charts?", a: "It reads the values in your file and puts them on slides; it doesn't run new calculations. Put totals you need in the sheet or the prompt." },
      { q: "Which spreadsheet formats work?", a: "Excel .xlsx and CSV. Old .xls files need saving as .xlsx first." },
      { q: "How many credits does a report take?", a: "Standard quality costs 2 credits per card, so a 10-card report uses 20 credits. Outlines are free." },
    ],
  },
];

export const findUseCase = (slug: string) => USE_CASES.find((u) => u.slug === slug);
