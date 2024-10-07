import { load } from 'cheerio';

type Lessons = {
  discipline: string;
  room: string;
  teacher: string;
  replacement: string;
  time: string;
};

const parseHtml = (html: string) => {
  const $ = load(html);
  const pairs: { day: string; lessons: Lessons[] }[] = [];

  $('div.card').each((_, element) => {
    const day = $(element).find('h5.card-title').text().trim();
    const lessons: Lessons[] = [];

    $(element)
      .find('table tr')
      .each((i, row) => {
        if (i > 0) {
          const columns = $(row).find('td');
          if (columns.length > 0) {
            const fullDisciplineText = $(columns[1]).text().trim();
            const discipline = fullDisciplineText.replace(/гр\.\S+|РТК/g, '').trim();

            const lesson = {
              time: $(columns[0]).find('p').text().trim(),
              discipline: discipline,
              room: $(columns[2]).text().trim(),
              teacher: $(columns[3]).text().trim(),
              replacement: $(columns[4]).text().trim(),
            };
            lessons.push(lesson);
          }
        }
      });

    pairs.push({ day, lessons });
  });

  return pairs;
};

const parseGroups = (html: string) => {
  const map = new Map<string, string>();
  const $ = load(html);
  $('select#raspbasesearch-group_id option').each((_, element) => {
    const groupName = $(element).text().trim();
    const groupValue = $(element).attr('value');
    if (groupName && groupValue) {
      map.set(groupName, groupValue);
    }
  });

  return map;
};

export { parseHtml, parseGroups };
