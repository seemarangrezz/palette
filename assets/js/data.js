/* ==========================================================================
   SITE DATA
   This file is the single source of truth for every page on the site.
   Nothing about artwork content is hard-coded into the HTML — every page
   reads from SITE_DATA and ARTWORKS below (or from the Admin-exported
   overrides that layer on top of this file, see /admin.html).

   You can edit this file directly by hand, OR use /admin.html to edit
   everything through a visual dashboard and export an updated copy of
   this file when you're ready to publish. See README.md.
   ========================================================================== */

const SITE_DATA = {
  artistName: "Your Name",
  artistNameShort: "Y.N.",
  tagline: "Painter of memory, myth and material — working between Dubai and the world.",
  heroImage: "assets/images/artworks/hero-artwork.svg",
  heroImageCredit: "Featured: “Interior With No One”, oil on canvas, 2025",

  seo: {
    title: "Your Name — Contemporary Visual Artist",
    description: "Contemporary visual artist working across oil, acrylic, charcoal, clay sculpture, Tanjore and Lippan mud-mirror art. Based in Dubai, exhibiting internationally.",
  },

  bio: {
    intro: "I am a contemporary visual artist working across painting, drawing, sculpture and traditional Indian art forms — building a practice that moves deliberately between the classical and the experimental.",
    paragraphs: [
      "My work began, as it does for many artists, with a pencil and the quiet obsession of getting a likeness right. Over the years that obsession widened into a full practice: oil and acrylic painting, charcoal and graphite drawing, hand-built clay sculpture, and two art forms I return to again and again — Tanjore painting, with its gold leaf and jewel-toned devotion, and Lippan, the mud-and-mirror relief work of Kutch.",
      "I don't think of these as separate disciplines so much as different vocabularies for the same handful of questions: what does it mean to hold onto something — a memory, a myth, a person, a place — long enough to render it in gold leaf, or graphite, or wet clay. Every medium answers that question differently, and I've never wanted to give any of them up.",
      "My studio practice today moves between traditional commissioned works — portraits, Tanjore panels, restoration-conscious mixed media pieces — and a more experimental, personal body of work shown in galleries and group exhibitions. I'm based between Dubai and India, and I exhibit, take commissions and collaborate internationally.",
    ],
  },

  philosophy: "I believe a painting should slow a person down. In a world of fast images, I want my work to ask for time — to reward a second and third look the way a devotional Tanjore panel does, or a wall of mirrored Lippan clay catching the light differently through the day. Technique, for me, is never the point; it's the discipline that earns the right to say something quietly and mean it.",

  statement: "Across every medium I work in, I keep returning to thresholds — the moment before a gesture completes, the line between the sacred and the domestic, the space between memory and invention. My practice is patient by necessity: gold leaf, clay and graphite all demand a kind of attention that can't be rushed. I want the finished work to carry that attention forward into the room it hangs in.",

  mediums: [
    "Oil Painting", "Acrylic Painting", "Charcoal & Graphite Drawing",
    "3D Clay Sculpture", "Tanjore Gold-Leaf Painting", "Lippan Mud & Mirror Art",
    "Mixed Media & Experimental Work",
  ],

  education: [
    { year: "2016 — 2020", title: "Bachelor of Fine Arts, Painting", place: "College of Art, [University Name]", detail: "Focused on classical figurative painting and contemporary studio practice; thesis exhibition on memory and domestic space." },
    { year: "2021", title: "Traditional Tanjore Painting Apprenticeship", place: "Thanjavur, Tamil Nadu", detail: "Trained under a master practitioner in gold-leaf gilding, gesso relief and traditional pigment work." },
    { year: "2022", title: "Lippan Kaam Residency", place: "Kutch, Gujarat", detail: "Studied traditional mud-and-mirror relief techniques directly within the craft community of origin." },
  ],

  experience: [
    { year: "2024 — Present", title: "Independent Studio Artist", place: "Dubai, UAE", detail: "Full-time studio practice producing commissioned and gallery work across painting, sculpture and traditional art forms; accepting private and interior-design commissions." },
    { year: "2022 — 2024", title: "Visiting Art Instructor", place: "[Studio / Institution Name], Dubai", detail: "Taught painting and traditional art technique workshops for adult and youngtner students." },
    { year: "2020 — 2022", title: "Studio Assistant", place: "[Senior Artist / Gallery Name]", detail: "Assisted on large-scale commissions, gallery installation and archival documentation of a working studio practice." },
  ],

  exhibitions: [
    { year: "2026", title: "Threshold — Solo Exhibition", place: "[Gallery Name], Dubai", detail: "A solo presentation of new paintings and mixed-media work exploring memory and domestic space." },
    { year: "2025", title: "Gold & Ground — Group Exhibition", place: "[Gallery Name], Alserkal Avenue, Dubai", detail: "Group show pairing contemporary painters with traditional gold-leaf and relief practices." },
    { year: "2024", title: "New Voices in Contemporary Practice", place: "[Institution Name], Mumbai", detail: "Juried group exhibition of early-career contemporary artists." },
  ],

  workshops: [
    { year: "2025", title: "Tanjore Technique Masterclass", place: "Dubai, UAE", detail: "A weekend intensive on gesso relief and gold-leaf gilding for practising artists." },
    { year: "2024", title: "Introduction to Lippan Art", place: "Dubai, UAE", detail: "Community workshop introducing mud-and-mirror relief technique to beginners." },
  ],

  skills: [
    "Classical & contemporary figurative painting", "Colour theory and pigment mixing",
    "Gold-leaf gilding & gesso relief", "Hand-built and wheel clay sculpture",
    "Large-scale mural and commission planning", "Studio and archival documentation",
    "Client and gallery liaison", "Teaching and workshop facilitation",
  ],

  achievements: [
    { year: "2025", detail: "Selected artist, [Award / Fair Name], Dubai." },
    { year: "2024", detail: "Commissioned mural for [Client / Company Name], UAE." },
    { year: "2023", detail: "Work acquired by private collectors across UAE, India and the UK." },
  ],

  cv: {
    title: "Contemporary Visual Artist",
    profile: "A contemporary visual artist working across oil and acrylic painting, charcoal drawing, clay sculpture, and the traditional Indian art forms of Tanjore and Lippan. Based in Dubai and exhibiting internationally, available for gallery representation, private and interior-design commissions, and collaborative projects.",
  },

  contact: {
    email: "hello@yourname-art.com",
    phone: "+971 50 000 0000",
    location: "Dubai, United Arab Emirates",
    instagram: "https://instagram.com/yourname.art",
    linkedin: "https://linkedin.com/in/yourname",
    facebook: "",
    pinterest: "",
    whatsapp: "https://wa.me/971500000000",
    formEndpoint: "",
    /* ^ Paste a Formspree (or similar) endpoint URL here to make the
       contact form send real emails once the site is live. See README. */
  },
};

const CATEGORIES = [
  "Paintings", "Portraits", "Abstract", "Nature", "Sketches",
  "Sculptures", "Tanjore Art", "Lippan Art", "Mixed Media",
];

/* Each artwork:
   id           unique url-safe slug
   title, year, medium, dimensions, category, status: "available"|"sold"|"not-for-sale"
   image        primary image path
   images       optional array of additional image paths
   description  the story behind the piece
   inspiration  what sparked it
   interpretation  the artist's own reading of the finished work
   featured     shown in the homepage featured strip
*/
const ARTWORKS = [
  {
    id: "interior-with-no-one",
    title: "Interior With No One",
    year: 2025, medium: "Oil on canvas", dimensions: "120 × 150 cm",
    category: "Paintings", status: "available", featured: true,
    image: "assets/images/artworks/interior-with-no-one.svg", images: [],
    description: "An empty room, painted from a memory of my grandmother's house the year after she left it. I wanted the light to do the work the figure usually does — falling across an armchair the way it might fall across a shoulder.",
    inspiration: "The particular quality of afternoon light in homes that are about to be sold, still full of furniture but already emptied of the people who arranged it.",
    interpretation: "I think of this less as a painting of absence and more as a painting of everything a room remembers, whether or not anyone is there to see it.",
  },
  {
    id: "silence-in-gold",
    title: "Silence in Gold",
    year: 2024, medium: "Tanjore painting — gold leaf, gesso relief, natural pigment on wood",
    dimensions: "60 × 75 cm", category: "Tanjore Art", status: "available", featured: true,
    image: "assets/images/artworks/silence-in-gold.svg", images: [],
    description: "A devotional-scale Tanjore panel built the traditional way — layered gesso relief, 22k gold leaf, hand-ground pigment — but composed around a moment of stillness rather than a fixed iconography.",
    inspiration: "Evening arti at a small family shrine, and the way gold leaf holds candlelight differently than it holds daylight.",
    interpretation: "Gold, here, isn't decoration — it's a way of saying that stillness itself deserves to be gilded.",
  },
  {
    id: "mirror-of-monsoon",
    title: "Mirror of Monsoon",
    year: 2025, medium: "Lippan — clay, mirror inlay on wood panel",
    dimensions: "90 × 90 cm", category: "Lippan Art", status: "available", featured: true,
    image: "assets/images/artworks/mirror-of-monsoon.svg", images: [],
    description: "A Lippan relief piece built entirely by hand from local clay and cut mirror, tracing the radiating pattern of rain rings on standing water.",
    inspiration: "Learning Lippan technique directly from artisans in Kutch, and their instinct for pattern as a form of weather-watching.",
    interpretation: "The mirrors scatter light unevenly across the day — the piece is never quite finished changing.",
  },
  {
    id: "the-weight-of-blue",
    title: "The Weight of Blue",
    year: 2023, medium: "Oil on linen", dimensions: "100 × 100 cm",
    category: "Abstract", status: "sold",
    image: "assets/images/artworks/the-weight-of-blue.svg", images: [],
    description: "A large abstract field painting built from dozens of thin, patient layers of blue and umber, worked and reworked over several months.",
    inspiration: "The colour of the sea in winter, seen from a plane window, and the strange comfort of a colour with no edges.",
    interpretation: "Some feelings don't have a shape. This painting is my attempt to give one a weight instead.",
  },
  {
    id: "study-in-graphite-i",
    title: "Study in Graphite I",
    year: 2024, medium: "Graphite and charcoal on paper", dimensions: "42 × 59 cm",
    category: "Sketches", status: "available",
    image: "assets/images/artworks/study-in-graphite-i.svg", images: [],
    description: "Part of an ongoing series of hand studies, drawn from life in a single uninterrupted sitting.",
    inspiration: "The idea that hands, more than faces, tell the truth about a person's life.",
    interpretation: "A drawing practice I return to whenever a larger painting stalls — it resets my eye.",
  },
  {
    id: "clay-vessel-of-memory",
    title: "Vessel of Memory",
    year: 2024, medium: "Hand-built terracotta clay sculpture", dimensions: "38 cm height",
    category: "Sculptures", status: "available",
    image: "assets/images/artworks/clay-vessel-of-memory.svg", images: [],
    description: "A coil-built vessel left deliberately imperfect — every thumbprint from the building process left visible in the fired clay.",
    inspiration: "The idea of a vessel as a kind of container for time rather than liquid.",
    interpretation: "I wanted an object that admitted, honestly, to having been made by hand.",
  },
  {
    id: "harvest-acrylic",
    title: "Harvest",
    year: 2025, medium: "Acrylic on canvas", dimensions: "80 × 100 cm",
    category: "Nature", status: "available",
    image: "assets/images/artworks/harvest-acrylic.svg", images: [],
    description: "A high-saturation study of a wheat field at the edge of harvest, built with palette-knife texture rather than brushwork.",
    inspiration: "A single afternoon spent watching a field change colour as the wind moved through it.",
    interpretation: "Texture, here, is doing the job usually left to detail — you feel the field before you read it.",
  },
  {
    id: "mother-and-child-tanjore",
    title: "Mother and Child",
    year: 2023, medium: "Tanjore painting — gold leaf on wood",
    dimensions: "50 × 65 cm", category: "Tanjore Art", status: "sold",
    image: "assets/images/artworks/mother-and-child-tanjore.svg", images: [],
    description: "A commissioned devotional Tanjore panel, built using traditional relief and gilding technique over roughly six weeks.",
    inspiration: "A private commission for a family shrine, guided by the client's own family history.",
    interpretation: "Commission work like this keeps me honest about craft — there's no shortcut through the gilding.",
  },
  {
    id: "fracture-no-4",
    title: "Fracture No. 4",
    year: 2025, medium: "Mixed media — acrylic, charcoal, plaster on board",
    dimensions: "70 × 90 cm", category: "Mixed Media", status: "available",
    image: "assets/images/artworks/fracture-no-4.svg", images: [],
    description: "Part of an experimental series combining plaster relief, charcoal and thin acrylic washes to build up a cracked, wall-like surface.",
    inspiration: "Old plaster walls in restored heritage buildings, layered with decades of repainting.",
    interpretation: "I wanted a surface that looked excavated rather than painted.",
  },
  {
    id: "desert-threshold-lippan",
    title: "Desert Threshold",
    year: 2024, medium: "Lippan — clay, mirror inlay on wood panel",
    dimensions: "75 × 100 cm", category: "Lippan Art", status: "available",
    image: "assets/images/artworks/desert-threshold-lippan.svg", images: [],
    description: "A large-scale Lippan piece adapting traditional Kutch motifs to a Gulf desert palette, made for a private residence in Dubai.",
    inspiration: "The visual kinship between the Kutch desert and the UAE desert, and the migration of craft traditions across both.",
    interpretation: "A deliberate bridge between the tradition I trained in and the place I now call home.",
  },
  {
    id: "seated-figure-terracotta",
    title: "Seated Figure",
    year: 2023, medium: "Terracotta clay sculpture", dimensions: "45 cm height",
    category: "Sculptures", status: "not-for-sale",
    image: "assets/images/artworks/seated-figure-terracotta.svg", images: [],
    description: "A hand-built seated figure study, part of a personal series never intended for sale — kept in the studio as a reference piece.",
    inspiration: "Classical seated-figure sculpture, reworked with a deliberately rough, unfinished surface.",
    interpretation: "Some work exists to teach me something rather than to leave the studio.",
  },
  {
    id: "study-in-graphite-ii",
    title: "Study in Graphite II",
    year: 2024, medium: "Charcoal on paper", dimensions: "50 × 65 cm",
    category: "Portraits", status: "available",
    image: "assets/images/artworks/study-in-graphite-ii.svg", images: [],
    description: "A charcoal portrait study built up in loose, confident marks, left visibly unfinished at the edges.",
    inspiration: "A single 90-minute life-drawing session — no corrections, no erasing.",
    interpretation: "I like when a portrait admits to the time it took, rather than hiding it.",
  },
  {
    id: "archive-of-small-things",
    title: "Archive of Small Things",
    year: 2025, medium: "Mixed media assemblage — acrylic, fabric, found objects on panel",
    dimensions: "100 × 120 cm", category: "Mixed Media", status: "available", featured: true,
    image: "assets/images/artworks/archive-of-small-things.svg", images: [],
    description: "An assemblage piece incorporating fragments of fabric and small found objects collected over several years, unified with layered acrylic.",
    inspiration: "The impulse to keep small, seemingly worthless objects — ticket stubs, fabric scraps — because of who was there when they were collected.",
    interpretation: "A personal archive made public — the objects matter less than the fact of having kept them.",
  },
];
