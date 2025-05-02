
/**
 * Find all mentions in a note's content
 * Mentions are enclosed in double brackets like [[Note Title]]
 */
export function findMentions(content: string): string[] {
  const mentionRegex = /\[\[(.*?)\]\]/g;
  const mentions: string[] = [];
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1]);
  }

  // Return unique mentions only
  return Array.from(new Set(mentions));
}

/**
 * Parse and render markdown content with interactive note links
 */
export function parseMarkdownWithLinks(
  content: string,
  onLinkClick: (title: string) => void
): string {
  // Replace [[Note Title]] with <span class="note-link" data-title="Note Title">Note Title</span>
  return content.replace(
    /\[\[(.*?)\]\]/g,
    (_, title) => `<span class="note-link" data-title="${title}">${title}</span>`
  );
}
