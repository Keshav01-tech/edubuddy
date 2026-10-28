// English chapter PDFs stay on this computer. The hosted site uses the extracted text copies.

const pdfFiles = import.meta.glob('./NCERT Books/English Medium/*/*/*/*.pdf', {
  query: '?url',
  import: 'default',
});

const textFiles = import.meta.glob('./chapterText/English Medium/*/*/*/*.txt', {
  query: '?url',
  import: 'default',
});

const library = {};
const index = new Map();

function chapterFor(path) {
  const parts = path.split('/');
  const file = parts[6];
  const match = file?.match(/^(\d+)\s*-\s*(.*)\.(pdf|txt)$/i);
  if (!match) return null;
  const className = parts[3].replace(/^Class 0?/, 'Class ');
  const subject = parts[4];
  const book = parts[5];
  const key = `${className}\0${subject}\0${book}\0${match[1]}`;
  let chapter = index.get(key);
  if (!chapter) {
    chapter = {
      book,
      number: Number(match[1]),
      title: match[2].trim(),
    };
    index.set(key, chapter);
    const subjects = (library[className] ??= {});
    (subjects[subject] ??= []).push(chapter);
  }
  return chapter;
}

for (const [path, load] of Object.entries(pdfFiles)) {
  const chapter = chapterFor(path);
  if (chapter) chapter.load = load;
}

for (const [path, load] of Object.entries(textFiles)) {
  const chapter = chapterFor(path);
  if (chapter) chapter.textLoad = load;
}

// These PDFs were named from the opening "Before You Read" note, not the chapter.
const REAL_TITLES = {
  'First Flight': {
    1: 'A Letter to God',
    2: 'Nelson Mandela: Long Walk to Freedom',
    3: 'Two Stories about Flying',
    4: 'From the Diary of Anne Frank',
    5: 'Glimpses of India',
    6: 'Mijbil the Otter',
    7: 'Madam Rides the Bus',
    8: 'The Sermon at Benares',
    9: 'The Proposal',
  },
};

for (const subjects of Object.values(library)) {
  for (const list of Object.values(subjects)) {
    list.sort((a, b) => a.book.localeCompare(b.book, undefined, { numeric: true }) || a.number - b.number);
    const several = new Set(list.map((chapter) => chapter.book)).size > 1;
    for (const chapter of list) {
      chapter.title = REAL_TITLES[chapter.book]?.[chapter.number] || chapter.title;
      chapter.label = `${several ? `${chapter.book} · ` : ''}Ch ${chapter.number} · ${chapter.title}`;
    }
  }
}

export const librarySubjects = (className) => Object.keys(library[className] || {});

export const libraryChapters = (className, subject) => library[className]?.[subject] || [];

export const findLibraryChapter = (className, subject, label) =>
  libraryChapters(className, subject).find((chapter) => chapter.label === label) || null;
