
import React, { useEffect } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { parseMarkdownWithLinks } from '@/lib/mentions';

interface NoteContentProps {
  content: string;
  onLinkClick: (title: string) => void;
}

const NoteContent: React.FC<NoteContentProps> = ({ content, onLinkClick }) => {
  // For server-side rendering support, we check if window is defined
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Add event listener for note links when the DOM is ready
    const handleNoteLinks = () => {
      document.querySelectorAll('.note-link').forEach((element) => {
        if (element instanceof HTMLElement && element.dataset.title) {
          element.addEventListener('click', () => {
            onLinkClick(element.dataset.title || '');
          });
        }
      });
    };

    // Execute after the component renders
    handleNoteLinks();

    // Clean up on unmount
    return () => {
      document.querySelectorAll('.note-link').forEach((element) => {
        if (element instanceof HTMLElement) {
          element.replaceWith(element.cloneNode(true));
        }
      });
    };
  }, [content, onLinkClick]);

  // Convert markdown to HTML - Fix the Promise<string> issue
  let rawHTML = '';
  try {
    // Use markdownString option to ensure synchronous parsing
    const options = { breaks: true, async: false };
    rawHTML = marked.parse(content, options) as string;
  } catch (error) {
    rawHTML = content;
    console.error('Error parsing markdown:', error);
  }
  
  // Process HTML with DOMPurify
  const sanitizedHTML = DOMPurify.sanitize(rawHTML);
  
  // Replace mentions with interactive links
  const processedHtml = parseMarkdownWithLinks(sanitizedHTML, onLinkClick);

  return (
    <div 
      className="markdown prose dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: processedHtml }}
    />
  );
};

export default NoteContent;
