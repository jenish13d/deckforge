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
  faq: { q: string; a: string }[];
}

export const FILES = "PDF, Word (.docx), PowerPoint (.pptx), Excel (.xlsx), text and Markdown files, and photos or scans";

export const USE_CASES: UseCase[] = [
  {
    slug: "pdf-to-presentation",
    name: "PDF to presentation",
    title: "Turn a PDF into a presentation with AI",
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
    faq: [
      { q: "Does it keep my formatting?", a: "It keeps your content (headings, lists, tables, numbers) and redesigns it as slides in the theme you choose, rather than copying the document's layout." },
      { q: "What about Google Docs or Pages?", a: "Download them as .docx or PDF first, then attach the file." },
      { q: "Is it free?", a: "Yes, the Free plan includes 60 credits a month (about 30 cards at Standard quality). File uploads work on every plan." },
    ],
  },
  {
    slug: "lesson-slides",
    name: "Lesson slides for teachers",
    title: "Lesson slides in minutes for teachers",
    description:
      "Create lesson and lecture slides with AI from a topic or your own worksheet, notes or PDF. Pick the class level, edit the outline, present or export.",
    lead: "Start from a topic or from the material you already use (a worksheet, chapter PDF or your notes) and get slides pitched at your class.",
    steps: [
      { title: "Topic or material", text: `Type the lesson topic, or attach ${FILES}.` },
      { title: "Set the audience", text: "Tell it the class (\"10-year-olds\", \"first-year nursing students\") and the focus." },
      { title: "Teach from it", text: "Present full screen, share a view-only link with the class, or download a PDF handout." },
    ],
    points: [
      { title: "Your material leads", text: "When you attach files, slides follow their content and wording." },
      { title: "Sourced facts", text: "Background facts come from listed sources, with numbers checked." },
      { title: "Fast changes", text: "Ask the assistant to simplify a slide, add an example or turn a list into a timeline." },
      { title: "Share links", text: "Students open a view-only link on any device; keep decks private when you prefer." },
    ],
    prompts: [
      "Introduction to fractions for 9-year-olds, with everyday examples",
      "A lecture on the causes of World War I for first-year students",
      "Photosynthesis explained in 8 slides, ending with 3 quiz questions",
    ],
    faq: [
      { q: "Can students see the deck without an account?", a: "Yes. Share a view-only link; they can open it in any browser." },
      { q: "Can I use my own worksheets?", a: "Yes. Attach PDFs, Word or PowerPoint files, or a photo of a worksheet, and the deck is built from them." },
      { q: "Is there a school plan?", a: "Not yet. Teachers use the Free, Pro or Max plans; contact us if you need something for a whole school." },
    ],
  },
  {
    slug: "business-report-presentation",
    name: "Business reports",
    title: "Turn reports and spreadsheets into meeting slides",
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
    faq: [
      { q: "Does it calculate totals or charts?", a: "It reads the values in your file and puts them on slides; it doesn't run new calculations. Put totals you need in the sheet or the prompt." },
      { q: "Which spreadsheet formats work?", a: "Excel .xlsx and CSV. Old .xls files need saving as .xlsx first." },
      { q: "How many credits does a report take?", a: "Standard quality costs 2 credits per card, so a 10-card report uses 20 credits. Outlines are free." },
    ],
  },
];

export const findUseCase = (slug: string) => USE_CASES.find((u) => u.slug === slug);
