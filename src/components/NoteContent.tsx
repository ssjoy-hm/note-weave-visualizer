
import React from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { replaceMentionsWithLinks } from '@/lib/mentions';

interface NoteContentProps {
  content: string;
  onLinkClick: (title: string) => void;
}

const NoteContent: React.FC<NoteContentProps> = ({ content, onLinkClick }) => {
  // For server-side rendering support, we check if window is defined
  if (typeof window !== 'undefined') {
    // Add event listener for note links when the DOM is ready
    DOMPurify.addHook('afterSanitizeAttributes', function (node) {
      if (node.dataset && node.dataset.title) {
        node.addEventListener('click', () => {
          onLinkClick(node.dataset.title || '');
        });
      }
    });
  }

  // Convert markdown to HTML
  const rawHTML = marked(content, { breaks: true });
  
  // Process HTML with DOMPurify
  const sanitizedHTML = DOMPurify.sanitize(rawHTML);
  
  // Replace mentions with interactive links
  // Since this is a complex operation involving React elements,
  // we'll use dangerouslySetInnerHTML for the markdown conversion
  // and then handle mentions through the DOM
  
  // Format the content for rendering
  const processedHtml = sanitizedHTML.replace(
    /\[\[(.*?)\]\]/g,
    (match, title) => `<span class="note-link" data-title="${title}">${title}</span>`
  );

  return (
    <div 
      className="markdown prose dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: processedHtml }}
    />
  );
};

export default NoteContent;
