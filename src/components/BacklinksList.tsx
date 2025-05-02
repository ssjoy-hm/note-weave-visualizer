
import React from 'react';
import useNoteStore from '@/store/noteStore';
import { Link2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface BacklinksListProps {
  noteId: string;
  onLinkClick: (title: string) => void;
}

const BacklinksList: React.FC<BacklinksListProps> = ({ noteId, onLinkClick }) => {
  const { getBacklinks } = useNoteStore();
  const backlinks = getBacklinks(noteId);

  if (!backlinks.length) return null;

  return (
    <div className="mt-10">
      <Separator className="my-4" />
      <div className="flex items-center gap-2 text-sm text-noteweave-600 dark:text-noteweave-400 mb-2">
        <Link2 className="h-4 w-4" />
        <h3 className="font-semibold">
          {backlinks.length} {backlinks.length === 1 ? 'Mention' : 'Mentions'}
        </h3>
      </div>
      <div className="space-y-3">
        {backlinks.map((backlink) => (
          <div 
            key={backlink.noteId}
            className="p-3 rounded-md bg-muted/50 cursor-pointer hover:bg-muted"
            onClick={() => onLinkClick(backlink.noteTitle)}
          >
            <div className="font-medium mb-1">{backlink.noteTitle}</div>
            <div 
              className="text-sm text-muted-foreground"
              dangerouslySetInnerHTML={{ 
                __html: backlink.excerpt.replace(
                  /\[\[(.*?)\]\]/g, 
                  (_, title) => `<span class="note-link">${title}</span>`
                )
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default BacklinksList;
