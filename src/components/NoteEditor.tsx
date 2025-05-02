
import React, { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Pencil, 
  Check, 
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

const NoteEditor: React.FC = () => {
  const { notes, activeNoteId, updateNote, deleteNote, setActiveNote } = useNoteStore();
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedContent, setEditedContent] = useState<string>('');
  const [editedTitle, setEditedTitle] = useState<string>('');

  const activeNote = notes.find((note) => note.id === activeNoteId);

  useEffect(() => {
    if (activeNote) {
      setEditedContent(activeNote.content);
      setEditedTitle(activeNote.title);
    }
    setIsEditing(false);
  }, [activeNote]);

  const handleSaveChanges = () => {
    if (!activeNoteId) return;
    
    updateNote(activeNoteId, {
      title: editedTitle,
      content: editedContent,
    });
    
    setIsEditing(false);
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

  return (
    <div className="h-full flex flex-col">
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          {isEditing ? (
            <Input
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="text-xl font-semibold"
            />
          ) : (
            <h1 className="text-xl font-semibold">{activeNote.title}</h1>
          )}
          <div className="flex gap-2">
            {isEditing ? (
              <Button variant="outline" size="icon" onClick={handleSaveChanges}>
                <Check className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="outline" size="icon" onClick={() => setIsEditing(true)}>
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="icon">
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
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Last updated: {new Date(activeNote.updatedAt).toLocaleString()}
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        {isEditing ? (
          <Textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="min-h-[60vh] font-mono text-sm"
          />
        ) : (
          <div className="pb-12">
            <NoteContent 
              content={activeNote.content} 
              onLinkClick={handleNoteNavigation} 
            />
            <BacklinksList noteId={activeNote.id} onLinkClick={handleNoteNavigation} />
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default NoteEditor;
