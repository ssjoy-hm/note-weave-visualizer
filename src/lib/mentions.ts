
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
 * Replace mentions in a note's content with links
 */
export function replaceMentionsWithLinks(
  content: string, 
  onClick: (title: string) => void
): React.ReactNode[] {
  const parts = content.split(/(\[\[.*?\]\])/g);
  
  return parts.map((part, index) => {
    const mentionMatch = part.match(/^\[\[(.*?)\]\]$/);
    
    if (mentionMatch) {
      const title = mentionMatch[1];
      return (
        <span 
          key={index}
          className="note-link"
          onClick={() => onClick(title)}
        >
          {title}
        </span>
      );
    }
    
    return <span key={index}>{part}</span>;
  });
}

/**
 * Parse and render markdown content with interactive note links
 */
export function parseMarkdownWithLinks(
  content: string,
  onLinkClick: (title: string) => void
): string {
  // Replace [[Note Title]] with <span class="note-link">Note Title</span>
  return content.replace(
    /\[\[(.*?)\]\]/g,
    (_, title) => `<span class="note-link" data-title="${title}">${title}</span>`
  );
}
