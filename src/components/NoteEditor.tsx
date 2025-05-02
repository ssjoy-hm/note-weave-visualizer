
import React, { useState, useEffect, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Trash2 
} from 'lucide-react';
import useNoteStore from '@/store/noteStore';
import NoteContent from './NoteContent';
import BacklinksList from './BacklinksList';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { findMentions } from '@/lib/mentions';

const NoteEditor: React.FC = () => {
  const { notes, activeNoteId, updateNote, deleteNote, setActiveNote } = useNoteStore();
  const [editedContent, setEditedContent] = useState<string>('');
  const [editedTitle, setEditedTitle] = useState<string>('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeNote = notes.find((note) => note.id === activeNoteId);

  useEffect(() => {
    if (activeNote) {
      setEditedContent(activeNote.content);
      setEditedTitle(activeNote.title);
    }
  }, [activeNote]);

  const handleSaveChanges = () => {
    if (!activeNoteId) return;
    
    updateNote(activeNoteId, {
      title: editedTitle,
      content: editedContent,
    });
    
    toast.success("Note saved successfully");
  };

  const handleDeleteNote = () => {
    if (!activeNoteId) return;
    deleteNote(activeNoteId);
    toast.success("Note deleted successfully");
  };

  const handleNoteNavigation = (title: string) => {
    const targetNote = notes.find(
      (note) => note.title.toLowerCase() === title.toLowerCase()
    );

    if (targetNote) {
      setActiveNote(targetNote.id);
    } else {
      // Create a new note if one doesn't exist with this title
      const shouldCreateNote = window.confirm(
        `Note "${title}" doesn't exist. Create it?`
      );

      if (shouldCreateNote) {
        const store = useNoteStore.getState();
        store.createNote(title);
      }
    }
  };

  // Auto-save when user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeNoteId && (editedContent !== activeNote?.content || editedTitle !== activeNote?.title)) {
        handleSaveChanges();
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [editedContent, editedTitle]);

  if (!activeNote) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">No Note Selected</h2>
          <p className="text-muted-foreground">
            Select a note from the sidebar or create a new one.
          </p>
        </div>
      </div>
    );
  }

  const mentions = findMentions(activeNote.content);
  const hasMentions = mentions.length > 0;

  return (
    <div className="h-full flex flex-col">
      <div className="border-b p-4 bg-gradient-to-r from-secondary/80 to-background">
        <div className="flex items-center justify-between">
          <Input
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            className="text-xl font-semibold border-0 px-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
            onBlur={handleSaveChanges}
          />
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="icon" className="hover:bg-destructive/10">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Note</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{activeNote.title}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteNote} className="bg-destructive text-destructive-foreground">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <div className="text-xs text-muted-foreground mt-1 flex gap-3">
          <span>Created: {new Date(activeNote.createdAt).toLocaleString()}</span>
          <span>Updated: {new Date(activeNote.updatedAt).toLocaleString()}</span>
        </div>
        {hasMentions && (
          <div className="mt-2 text-xs">
            <span className="font-medium">Links: </span>
            {mentions.map((mention, i) => (
              <span 
                key={mention} 
                className="inline-block bg-secondary text-secondary-foreground rounded-md px-2 py-0.5 text-xs mr-2 cursor-pointer hover:bg-secondary/80"
                onClick={() => handleNoteNavigation(mention)}
              >
                {mention}
              </span>
            ))}
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 p-4 bg-gradient-to-b from-background to-secondary/10">
        <div className="pb-12 relative">
          <div className="bg-secondary/30 rounded-md p-3 mb-4 text-sm">
            <p className="font-medium">Creating Links:</p>
            <p>Type <code className="bg-muted px-1 rounded">[[Note Title]]</code> to link to another note.</p>
          </div>

          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="min-h-[60vh] font-mono text-sm resize-none border-muted rounded-lg shadow-inner bg-white/80 dark:bg-gray-800/80"
              placeholder="Start writing your note..."
            />
          </div>
          
          <BacklinksList noteId={activeNote.id} onLinkClick={handleNoteNavigation} />
        </div>
      </ScrollArea>
    </div>
  );
};

export default NoteEditor;
