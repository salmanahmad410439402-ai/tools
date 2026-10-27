import type { Tool } from "@/lib/tool-types";

/** Small browser utilities: QR codes, counting, casing, filler text. */
export const utilityTools: Tool[] = [
  {
    slug: "qr-code-generator",
    name: "QR Code Generator",
    shortName: "QR Code",
    category: "utilities",
    widget: "qr-code",
    icon: "QrCode",
    tagline: "A real QR code for your text or link — vector SVG and exact-size PNG, with no redirect in between.",
    bestFor: "A menu, a poster, a business card or a Wi-Fi handoff that must still work in five years.",
    seoTitle: "QR Code Generator — SVG and PNG Free",
    metaDescription:
      "Generate a QR code for any URL or text in your browser. Download a vector SVG or a PNG at an exact size, choose error correction, no redirects or tracking.",
    h1: "QR Code Generator That Never Uploads Your Link",
    intro: [
      "Type a link, a piece of text or a Wi-Fi string and a scannable code appears immediately. Download it as a true vector SVG that prints sharply on a poster, or as a PNG at the exact pixel size your layout needs.",
      "The code is built in your tab by a standards-compliant encoder (ISO/IEC 18004, versions 1–40). Nothing is sent to a server, there is no short-link service in the middle, and no account is needed — which also means the code keeps working for as long as the destination does.",
    ],
    bullets: [
      {
        title: "Genuine QR codes, not pictures of them",
        text: "The output is a standards-compliant symbol with the correct finder patterns, timing patterns, format information and Reed–Solomon error correction. Every phone camera and every dedicated scanner reads it, including the ones that refuse stylised codes.",
      },
      {
        title: "A vector SVG export",
        text: "The SVG contains one rectangle per dark module inside a single group, with a viewBox in module units. It is genuinely resolution-independent: the same file works at 20 mm on a business card and two metres on a wall, and it can be recoloured in Illustrator or Figma.",
      },
      {
        title: "PNG at the size you actually need",
        text: "Choose 256, 512, 1024 or 2048 pixels. Module sizes are floored to whole pixels so no edge is blurred by sub-pixel rounding, which matters on cheap laser printers.",
      },
      {
        title: "Error correction you can reason about",
        text: "Levels L, M, Q and H recover from roughly 7%, 15%, 25% and 30% damage. Higher levels hold less data and produce a denser symbol, so the right choice depends on whether the label will be scratched or pristine.",
      },
      {
        title: "Contrast checked before you print",
        text: "Pick any module and background colour. If the pair is too close together the tool says so, and if you invert the usual dark-on-light scheme it warns you that older readers may struggle.",
      },
      {
        title: "Quiet zone under your control",
        text: "The margin defaults to the four modules the specification asks for. You can raise it for print or set it to zero when a design demands a tight crop — with a note that some scanners will then fail.",
      },
    ],
    steps: [
      {
        title: "Enter the content",
        text: "A URL, plain text, an email address, a phone number with a tel: prefix or a Wi-Fi string. Shorter content produces a sparser, easier-to-scan symbol, so use a direct link rather than a long tracking URL.",
      },
      {
        title: "Choose error correction",
        text: "Keep M for most uses. Switch to Q or H for stickers, labels or outdoor signs where damage is likely, and to L when you need to fit an unusually long payload.",
      },
      {
        title: "Set colours, size and margin",
        text: "Dark modules on a light background scan best. Check the contrast warning, then pick the PNG size you need for print or web.",
      },
      {
        title: "Download and test",
        text: "Take the SVG for print work, the PNG for documents and slides. Scan the result with two different phones before you send it to a printer — that is the only test that counts.",
      },
    ],
    limits: [
      {
        title: "The code is static",
        text: "Everything lives inside the symbol, so you cannot change the destination later without generating a new code. Editing a printed code means reprinting it. Anything that promises otherwise is a redirect service, which is a different product with different privacy costs.",
      },
      {
        title: "No scan analytics",
        text: "Because there is no server in the middle, there is nothing to count. If you need to know how many people scanned, that requires a redirect — and then the redirect operator sees every visitor you send.",
      },
      {
        title: "Capacity has a ceiling",
        text: "Byte mode tops out around 2,950 characters at level L and around 1,270 at level H. Beyond that the encoder refuses with an explanation instead of producing a symbol no phone can read.",
      },
      {
        title: "No logo overlay or rounded modules",
        text: "This tool does not embed a logo or reshape the modules. Both reduce readability, and doing them badly is the most common reason a printed code fails at the venue. If you need a logo, use error correction H and leave the centre truly empty.",
      },
    ],
    tips: [
      {
        title: "Print small codes large enough",
        text: "A useful rule: the printed code should be at least a tenth of the scanning distance. A one-metre poster wants a code around 10 cm wide; a business card wants at least 2 cm.",
      },
      {
        title: "Prefer a short URL",
        text: "Fewer characters mean fewer modules, which means bigger individual squares at the same print size. A short, stable URL scans faster and survives worse printing than a 200-character tracking link.",
      },
      {
        title: "Test on the material, not the screen",
        text: "Matte paper, glossy laminate and screens all behave differently. Scan a printed proof before a full run — a code that reads perfectly on a monitor can fail on a dark label.",
      },
      {
        title: "Keep the quiet zone",
        text: "The empty border is part of the specification, not padding. Cutting it to fit a design is the second most common cause of failed scans after low contrast.",
      },
    ],
    faqs: [
      {
        q: "Does this QR code expire?",
        a: "No. There is no server component and no redirect, so the symbol works for as long as the URL or text inside it is valid. A code pointing at a page you later delete will still scan — it will simply lead to a missing page.",
      },
      {
        q: "Is my link uploaded anywhere?",
        a: "No. Encoding happens in your browser using a bundled encoder, and the download is generated locally. Nothing about the content, your IP address or your device is sent anywhere.",
      },
      {
        q: "Which is better, SVG or PNG?",
        a: "SVG for print and anything that will be resized, because it is vector and stays sharp. PNG when the destination expects a bitmap: a slide deck, a word processor, a marketplace listing or a CMS upload field.",
      },
      {
        q: "Why will my QR code not scan?",
        a: "In order of likelihood: too little contrast between modules and background, the quiet zone was cropped, the code is printed too small for the distance, or the surface is glossy and reflects light. Error correction cannot fix any of those — it only helps with physical damage.",
      },
      {
        q: "Can I put my logo in the middle?",
        a: "Not with this tool, and it is worth being careful with the idea. A logo covers modules, and every covered module is damage the code must recover from. With error correction H you have roughly 30% to spare, but a large centre logo can exceed that and fail only in dim light.",
      },
      {
        q: "Can I use the code commercially?",
        a: "Yes. The QR Code standard is free to use; the words QR Code are a registered trademark of DENSO WAVE, so avoid implying you invented or certify the format. Codes you generate here can be printed on products, packaging and signage without a licence from this site.",
      },
      {
        q: "What data can I encode apart from links?",
        a: "Anything textual: a Wi-Fi string such as WIFI:T:WPA;S:Network;P:password;;, an email with mailto:, a phone number with tel:, a vCard block, or plain instructions. The scanner decides what it can act on — a plain text code simply displays the text.",
      },
    ],
    related: ["image-to-base64", "word-counter", "case-converter"],
    inputFormats: ["URL", "Plain text", "Wi-Fi string", "vCard", "Email / phone"],
    outputFormats: ["SVG (vector)", "PNG (256–2048 px)"],
    keywords: ["qr code generator", "create qr code", "qr code png", "qr code svg", "free qr code", "url to qr"],
    popular: true,
    isNew: true,
    phase: 5,
    updated: "2026-10-27",
  },
  {
    slug: "word-counter",
    name: "Word Counter",
    shortName: "Word Counter",
    category: "utilities",
    widget: "word-counter",
    icon: "Hash",
    tagline: "Words, characters, sentences, paragraphs and reading time — with the limits people actually hit.",
    bestFor: "Fitting a caption, an abstract, a meta description or a thesis into a hard limit.",
    seoTitle: "Word Counter — Characters and Time",
    metaDescription:
      "Count words, characters, sentences and paragraphs as you type, see reading and speaking time, and check your text against real platform limits. No upload.",
    h1: "Word Counter — Words, Characters and Reading Time",
    intro: [
      "Paste anything and the counts update as you type: words, characters with and without spaces, sentences, paragraphs and lines, plus reading and speaking time based on published average speeds.",
      "The part most counters skip is the reason people search for one — a hard limit. This page checks your text against the limits that actually reject submissions: a 280-character post, a 155-character meta description, a 160-character SMS, a 60-character SEO title.",
    ],
    bullets: [
      {
        title: "Counts that match how people edit",
        text: "Words are runs of letters and digits, so a line break does not create an empty word and a hyphenated compound counts once. Sentences split on terminal punctuation and paragraph breaks. Paragraphs are separated by blank lines, the way a writer thinks about them.",
      },
      {
        title: "Characters with and without spaces",
        text: "Both numbers matter: forms usually count spaces, translators often bill without them, and some databases count neither the way you expect. Seeing both side by side prevents the classic “but it looked short enough” problem.",
      },
      {
        title: "Reading and speaking time",
        text: "Reading time uses 225 words per minute, the usual silent-reading average for adults. Speaking time uses 130 words per minute, a comfortable presentation pace. Both are estimates and labelled as such, not promises.",
      },
      {
        title: "A live limit panel",
        text: "Eight real destinations — X, a meta description, an SEO title, an email subject, an SMS, a YouTube title, an Instagram caption and a LinkedIn post — each with a progress bar and an over-by count.",
      },
      {
        title: "Repetition, not keyword stuffing",
        text: "A short list of the words you use most, with common stop words removed. It is framed as “what am I repeating”, because keyword density is a weak signal and chasing a percentage is a good way to make writing worse.",
      },
      {
        title: "Nothing leaves the tab",
        text: "Unpublished drafts are the most sensitive text many people handle. The counting runs entirely in the browser, so a client's press release never touches a server.",
      },
    ],
    steps: [
      {
        title: "Paste your text",
        text: "Anything works: an article, a caption, an abstract, a cover letter, a script. Use “Try a sample” to see how the counters behave before pasting your own work.",
      },
      {
        title: "Read the counts",
        text: "Words and characters first, then sentences and paragraphs. Reading time is the number to quote when an editor asks whether a piece is too long.",
      },
      {
        title: "Check the limits",
        text: "Find the destination you are writing for. A red bar means you are over; the line underneath tells you by how much, so trimming is a measurable job rather than a guess.",
      },
      {
        title: "Copy the summary",
        text: "One button copies words, characters, sentences, paragraphs and both time estimates — useful for submissions that ask for a word count in the cover field.",
      },
    ],
    limits: [
      {
        title: "Word counts are heuristic, not linguistic",
        text: "Splitting on whitespace works well for English, French, German and most space-separated languages. Chinese, Japanese, Thai and other scripts without spaces between words need a dictionary-based segmenter, which this tool does not ship — their character counts are accurate, their word counts are not meaningful.",
      },
      {
        title: "Characters are Unicode code points",
        text: "That is the number most databases store and most platforms enforce. A skin-toned emoji is two code points here and may count as two, four or one depending on the platform. For emoji-heavy captions, leave a margin.",
      },
      {
        title: "Markup counts as characters",
        text: "Paste Markdown or HTML and the syntax is counted, because the tool cannot know which parts you intend to be invisible after rendering. Strip formatting first if you need the rendered length.",
      },
      {
        title: "The limit panel is a guide",
        text: "Platforms change their rules, and some count links as fixed lengths regardless of actual characters. Treat the bars as a sanity check and the platform's own counter as the final word.",
      },
    ],
    tips: [
      {
        title: "Write, then measure",
        text: "Editing to a live counter produces short, clipped sentences. Draft normally and use the counts at the end — the limit panel is for the last pass, not the first.",
      },
      {
        title: "Trim sentences, not words",
        text: "When you are 40 characters over, deleting a whole clause almost always reads better than removing adjectives one at a time. The counter tells you the size of the problem; you decide what goes.",
      },
      {
        title: "Meta descriptions are about the cut",
        text: "Google truncates by pixel width, not characters, so 155 is an approximation that varies with letter shapes. Front-load the point and assume anything past the first 120 characters is a bonus.",
      },
      {
        title: "Quote the reading time, not the words",
        text: "When pitching an article, “a four-minute read” is more useful to an editor than “900 words”. Both numbers are on the page for that reason.",
      },
    ],
    faqs: [
      {
        q: "Is my text uploaded or saved?",
        a: "No. The counters run in your browser and the text is never sent anywhere. Closing the tab discards it, and there is no draft history to recover.",
      },
      {
        q: "How are words counted?",
        a: "A word is a run of letters or digits separated by whitespace, so hyphenated compounds count once and a stray dash does not count at all. Apostrophes stay inside the word: “don't” is one word.",
      },
      {
        q: "Why do different tools give different word counts?",
        a: "Because they disagree about hyphenated words, numbers, URLs and punctuation-only tokens. Word and Google Docs count similarly but not identically, and academic submission systems vary again. This page states its rule so you can compare like with like.",
      },
      {
        q: "Does it work for languages other than English?",
        a: "Character, sentence and paragraph counts are reliable in any script. Word counts are reliable for languages that separate words with spaces. For Chinese or Japanese, use the character count and treat the word count as a rough guide.",
      },
      {
        q: "What reading speed do you use?",
        a: "225 words per minute for silent reading, which is the figure most readability research converges on for adults reading prose on screen. Speaking uses 130 words per minute, a pace that leaves room for pauses.",
      },
      {
        q: "Can I count words in a PDF or Word file?",
        a: "Open the file, select all and paste the text here. This page reads text, not documents — for PDFs you can also use the PDF to text tool first, which extracts selectable text without uploading the file.",
      },
    ],
    related: ["case-converter", "lorem-ipsum-generator", "pdf-to-txt"],
    inputFormats: ["Typed text", "Pasted text", "Markdown", "Code"],
    outputFormats: ["Word count", "Character count", "Reading time", "Limit check"],
    keywords: ["word counter", "character counter", "word count tool", "count words", "reading time", "twitter character count"],
    popular: true,
    isNew: true,
    phase: 5,
    updated: "2026-10-27",
  },
  {
    slug: "case-converter",
    name: "Case Converter",
    shortName: "Case Converter",
    category: "utilities",
    widget: "case-converter",
    icon: "Type",
    tagline: "Sentence, Title, UPPER, lower, camelCase, snake_case, kebab-case and more — one click each.",
    bestFor: "Renaming a variable across a codebase, fixing a SHOUTING headline, or making a title consistent.",
    seoTitle: "Case Converter — Title, camelCase Free",
    metaDescription:
      "Convert text to sentence case, Title Case, UPPER, lower, camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE or a slug. Runs locally.",
    h1: "Case Converter for Sentence, Title and Code Case",
    intro: [
      "Paste text, pick a case, copy the result. Thirteen conversions cover the cases people actually need: the five writing cases, the six programming conventions, a URL slug and two deliberately silly ones.",
      "The programming cases split the input into words first, so “user account settings”, “userAccountSettings” and “user-account-settings” all convert to the same snake_case output. The input style does not matter — only the words do.",
    ],
    bullets: [
      {
        title: "Sentence case done properly",
        text: "Everything is lowercased, then the first letter after a full stop, question mark, exclamation mark or line break is capitalised. Acronyms in the source are normalised, because a sentence case headline with random capitals is not sentence case.",
      },
      {
        title: "Title Case with the small-word rule",
        text: "Articles, conjunctions and short prepositions stay lowercase unless they start or end the title, so “The State of the Art” beats “The State Of The Art”. Hyphenated compounds are handled part by part.",
      },
      {
        title: "Acronyms survive Title Case",
        text: "A word that is already all capitals is left alone, so “PDF and SEO tools” becomes “PDF and SEO Tools” rather than “Pdf and Seo Tools”. Most converters get this wrong.",
      },
      {
        title: "Every programming convention",
        text: "camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE and dot.case, all derived from the same word split that understands existing camel humps, underscores, hyphens and spaces.",
      },
      {
        title: "A real URL slug",
        text: "The slug conversion lowercases, strips accents, removes punctuation and collapses spaces into hyphens — so “Crème Brûlée & 100% Good!” becomes creme-brulee-100-good. That is what a CMS expects.",
      },
      {
        title: "Two for fun, one for cleanup",
        text: "aLtErNaTiNg case and inverted case are there because people ask for them. Inverting is also genuinely useful for fixing text typed with caps lock on.",
      },
    ],
    steps: [
      {
        title: "Paste the text",
        text: "A heading, a list of column names, a sentence that needs re-casing, or an identifier that needs converting to another convention.",
      },
      {
        title: "Choose the target case",
        text: "The result updates immediately, and the button labels double as a preview: you can see the pattern before you click.",
      },
      {
        title: "Copy or chain",
        text: "Copy puts the result on the clipboard. “Use as input” pushes it back into the source field, which is handy for building a slug from a title and then a kebab identifier from the same words.",
      },
    ],
    limits: [
      {
        title: "Casing is a Latin-script concept",
        text: "Arabic, Hebrew, Chinese, Japanese, Korean and Thai have no upper and lower case. Those texts pass through unchanged, which is correct behaviour rather than a bug.",
      },
      {
        title: "Title Case is English-centric",
        text: "The small-word list follows English style guides. German capitalises all nouns, and French title conventions differ again — no rule-based converter can satisfy every language, so check the result for anything published.",
      },
      {
        title: "Acronyms inside camelCase are flattened",
        text: "HTTP becomes Http when it lands in the middle of an identifier, because that is what most style guides ask for. Constants keep their capitals, which is why CONSTANT_CASE is the right choice for an initialism.",
      },
      {
        title: "Slugs transliterate, they do not translate",
        text: "Accents are stripped (é → e) so the URL stays ASCII. Characters with no Latin equivalent are removed entirely, so a fully non-Latin title produces a shorter slug than you might expect.",
      },
    ],
    tips: [
      {
        title: "Convert once, at the end",
        text: "Running text through three converters in a row loses information — sentence case destroys the original capitals. Convert from the clean source each time.",
      },
      {
        title: "Use the slug case before publishing",
        text: "A URL is permanent-ish, so generate the slug before the post goes live. Changing it afterwards means redirects and lost links.",
      },
      {
        title: "Keep identifiers consistent",
        text: "A codebase with camelCase in one file and snake_case in the next is a daily papercut. Pick the convention your language expects and convert new names to match rather than mixing.",
      },
      {
        title: "Check names with brand capitals",
        text: "iPhone, eBay and macOS resist automatic casing. Any convertor will mangle them; fix those words by hand after converting.",
      },
    ],
    faqs: [
      {
        q: "Does this change my original text?",
        a: "No. Your input stays in the top box and the conversion appears below it. Nothing is written back until you press “Use as input”, and nothing is stored anywhere.",
      },
      {
        q: "How does Title Case decide which words to capitalise?",
        a: "The first and last word always take a capital. Articles, coordinating conjunctions and short prepositions (a, an, the, and, but, or, for, of, in, on, to, with and similar) stay lowercase in the middle. Words already in all capitals are treated as acronyms and left alone.",
      },
      {
        q: "Will it handle my existing code identifiers?",
        a: "Yes — the splitter understands camel humps, underscores, hyphens and spaces. “myHTTPServer-config” becomes my_http_server_config, myHttpServerConfig and MY_HTTP_SERVER_CONFIG from the same input.",
      },
      {
        q: "Why is my accented text changed in the slug?",
        a: "URLs are safest in ASCII, so accents are decomposed and removed: é becomes e, ü becomes u. Search engines handle both forms, but plain ASCII survives copy-paste, email clients and older systems without percent-encoding.",
      },
      {
        q: "Can I convert a whole file at once?",
        a: "Not here — this page works on text you paste. Converting a file would mean editing its contents in place, which is a different job with different risks. Paste the section you need, or use your editor's own case commands.",
      },
      {
        q: "Is there a character limit?",
        a: "No hard limit; the conversion runs locally and is instant at the size of a long article. Very large pastes are limited by your browser's memory rather than by this page.",
      },
    ],
    related: ["word-counter", "lorem-ipsum-generator", "image-to-base64"],
    inputFormats: ["Typed text", "Pasted text", "Identifiers", "Headlines"],
    outputFormats: ["13 cases", "URL slug"],
    keywords: ["case converter", "title case converter", "camelcase converter", "snake case", "uppercase to lowercase", "sentence case"],
    isNew: true,
    phase: 5,
    updated: "2026-10-27",
  },
  {
    slug: "lorem-ipsum-generator",
    name: "Lorem Ipsum Generator",
    shortName: "Lorem Ipsum",
    category: "utilities",
    widget: "lorem-ipsum",
    icon: "FileText",
    tagline: "Filler paragraphs in plain text, HTML or Markdown — exactly as many as the layout needs.",
    bestFor: "Designing a page or a slide before the real copy exists, without being distracted by words.",
    seoTitle: "Lorem Ipsum Generator — HTML Free",
    metaDescription:
      "Generate lorem ipsum filler text by paragraphs and sentences, as plain text, HTML paragraphs or Markdown, with or without the classic opening line.",
    h1: "Lorem Ipsum Generator for Paragraphs, HTML and Markdown",
    intro: [
      "Choose how many paragraphs you need and how long each one should be, and the filler appears immediately — as plain text, as HTML paragraphs, or as Markdown, ready to paste where it is going.",
      "The words come from the classical Latin filler text derived from Cicero's De finibus, which has been used by typesetters since the 1500s precisely because it is unreadable enough to stop anyone reading it and start them looking at the layout.",
    ],
    bullets: [
      {
        title: "Length you control",
        text: "One to twenty paragraphs, one to twelve sentences each, with sentences between eight and sixteen words. That range covers a single card and a full long-form article without producing the same word count every time.",
      },
      {
        title: "Three output formats",
        text: "Plain text for design tools, HTML with each paragraph wrapped in a <p> tag for a template, and Markdown with blank lines between paragraphs for a README or a CMS that speaks Markdown.",
      },
      {
        title: "Optional classic opening",
        text: "The first paragraph can start with the canonical “Lorem ipsum dolor sit amet, consectetur adipiscing elit.” Turn it off when you want filler that does not announce itself as filler.",
      },
      {
        title: "Regenerate rather than re-type",
        text: "One button produces a different arrangement with the same settings, so you can scan several shapes quickly. A quick-shapes row jumps straight to a short block, three paragraphs or a long page.",
      },
      {
        title: "Copy or download",
        text: "Copy puts the exact output on the clipboard, formatting included. Download saves it as .txt or .html, which is easier than copying a very long passage out of a textarea.",
      },
      {
        title: "No account, no tracking, no queue",
        text: "The generator runs in the tab. There is nothing to sign up for, nothing to rate-limit and nothing stored.",
      },
    ],
    steps: [
      {
        title: "Set the shape",
        text: "Pick the paragraph count and the sentences per paragraph, or use a quick shape. The word and character counts under the box update as you go.",
      },
      {
        title: "Choose the format",
        text: "Plain text for Figma, Word or InDesign; HTML when you are filling a template; Markdown for documentation.",
      },
      {
        title: "Regenerate until the shape is right",
        text: "Different word lengths change how a layout breathes. Regenerating is faster than hunting for the one paragraph that happens to have a long word where you need one.",
      },
      {
        title: "Copy and replace it later",
        text: "Paste into the design, then make “replace lorem with real copy” an explicit task. Filler that survives to production is a known and embarrassing failure mode.",
      },
    ],
    limits: [
      {
        title: "It is not grammatical Latin",
        text: "Words are sampled from the classical filler and arranged for rhythm, not meaning. That is why it reads like Latin without being a sentence — and why nobody should quote it as if it were.",
      },
      {
        title: "No lists, headings or tables",
        text: "Output is paragraphs only. Generating a bulleted list or a table of filler is a different job and this page deliberately does not pretend to do it.",
      },
      {
        title: "Word counts are approximate",
        text: "Sentences are generated to a length range, so a request for “about 500 words” lands close but not exact. Read the live word count if the number matters.",
      },
      {
        title: "Not for accessibility testing",
        text: "Filler text tells you nothing about how real content behaves with screen readers, long German compounds or right-to-left scripts. Test the real thing before launch — lorem ipsum hides every content-driven layout bug.",
      },
    ],
    tips: [
      {
        title: "Use it to judge rhythm, not meaning",
        text: "Lorem ipsum is good for checking line length, heading proportion and card balance. It is bad for checking whether your design survives a long unbroken URL or a 40-character German noun.",
      },
      {
        title: "Vary the length on purpose",
        text: "Real paragraphs differ in size. Generate two shapes and mix them, or your grid will look suspiciously regular when the copy arrives.",
      },
      {
        title: "Keep the HTML version handy",
        text: "Pasting structured <p> tags into a template saves a step when the CMS or component library expects markup rather than plain text.",
      },
      {
        title: "Search for it before you ship",
        text: "A grep for “lorem” across the repository is a five-second check that catches filler left in a production template. It has happened to nearly every team.",
      },
    ],
    faqs: [
      {
        q: "Where does lorem ipsum come from?",
        a: "From Cicero's De finibus bonorum et malorum, written in 45 BC. Typesetters extracted and shuffled its words in the 1500s to create filler that looks like language but means nothing, and the scrambled version has survived essentially unchanged.",
      },
      {
        q: "Is lorem ipsum a real language?",
        a: "No. It is Latin vocabulary in non-Latin order with invented word endings. Someone who reads Latin recognises the words and finds the sentences meaningless — which is exactly the intended effect.",
      },
      {
        q: "Can I choose exactly how many words I get?",
        a: "Not exactly — you set paragraphs and sentences per paragraph, and sentences vary between eight and sixteen words. The live word count tells you what you actually received, and you can regenerate or adjust the paragraph count to land near a target.",
      },
      {
        q: "Why would I want the HTML version?",
        a: "Because many templates and CMS fields expect markup. The HTML output wraps each paragraph in a <p> element, so pasting it into a rich-text field produces real paragraphs instead of one long block.",
      },
      {
        q: "Is the text safe to use in a published page?",
        a: "Only as a placeholder. Publishing lorem ipsum is a well-known mistake that makes a site look unfinished and can hurt trust with readers and reviewers. Replace it before launch, and search the repository for the word first.",
      },
      {
        q: "Does it work offline?",
        a: "Yes, once the page has loaded. The word list and the generator are part of the page, so nothing is fetched and nothing is sent.",
      },
    ],
    related: ["word-counter", "case-converter", "qr-code-generator"],
    inputFormats: ["Paragraph count", "Sentences per paragraph"],
    outputFormats: ["Plain text", "HTML paragraphs", "Markdown"],
    keywords: ["lorem ipsum generator", "filler text", "placeholder text", "lorem ipsum html", "dummy text"],
    isNew: true,
    phase: 5,
    updated: "2026-10-27",
  },
];
