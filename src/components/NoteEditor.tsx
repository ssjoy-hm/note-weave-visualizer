
import React, { useState, useEffect, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent } from '@/components/ui/popover';
import { 
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
import { findMentions } from '@/lib/mentions';

const NoteEditor: React.FC = () => {
  const { notes, activeNoteId, updateNote, deleteNote, setActiveNote } = useNoteStore();
  const [editedContent, setEditedContent] = useState<string>('');
  const [editedTitle, setEditedTitle] = useState<string>('');
  const [mentionQuery, setMentionQuery] = useState<string>('');
  const [showMentionPopover, setShowMentionPopover] = useState<boolean>(false);
  const [mentionStartPos, setMentionStartPos] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const textAreaSelectionRef = useRef<{ start: number, end: number } | null>(null);

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

  // Handle input change and detect mention trigger
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setEditedContent(newContent);

    // Store current selection
    if (textareaRef.current) {
      textAreaSelectionRef.current = {
        start: textareaRef.current.selectionStart,
        end: textareaRef.current.selectionEnd
      };
    }

    // Check for @ character
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = newContent.substring(0, cursorPosition);
    const atIndex = textBeforeCursor.lastIndexOf('@');

    if (atIndex !== -1 && (atIndex === 0 || /\s/.test(textBeforeCursor[atIndex - 1]))) {
      // Found @ symbol preceded by whitespace or at beginning
      setShowMentionPopover(true);
      setMentionStartPos(atIndex);
      setMentionQuery(textBeforeCursor.substring(atIndex + 1));
    } else {
      setShowMentionPopover(false);
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

  // Filter notes for mention suggestions
  const filteredNotes = notes
    .filter(note => 
      note.title.toLowerCase().includes(mentionQuery.toLowerCase()) && 
      note.id !== activeNoteId
    )
    .slice(0, 5);

  // Handle selection of a mention
  const handleSelectMention = (noteTitle: string) => {
    if (mentionStartPos !== null && textareaRef.current) {
      const beforeMention = editedContent.substring(0, mentionStartPos);
      const afterMention = editedContent.substring(textAreaSelectionRef.current?.start || 0);
      
      // Replace @ with [[ ]]
      const newContent = `${beforeMention}[[${noteTitle}]]${afterMention}`;
      setEditedContent(newContent);
      
      // Reset mention state
      setShowMentionPopover(false);
      setMentionQuery('');
      
      // Move cursor after the inserted mention
      const newCursorPos = mentionStartPos + noteTitle.length + 4; // 4 for the [[ and ]]
      
      // Focus back on textarea and set cursor position
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
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

  const mentions = findMentions(activeNote.content);
  const hasMentions = mentions.length > 0;

  return (
    <div className="h-full flex flex-col">
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <Input
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            className="text-xl font-semibold border-0 px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            onBlur={handleSaveChanges}
          />
          
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

      <ScrollArea className="flex-1 p-4">
        <div className="pb-12 relative">
          <div className="bg-secondary/30 rounded-md p-3 mb-4 text-sm">
            <p className="font-medium">Mentioning notes:</p>
            <p>Type <code className="bg-muted px-1 rounded">@</code> to mention other notes. Select a note from the dropdown to create a link.</p>
            <p>You can also manually type <code className="bg-muted px-1 rounded">[[Note Title]]</code> to link to another note.</p>
          </div>

          <Popover open={showMentionPopover} onOpenChange={setShowMentionPopover}>
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={editedContent}
                onChange={handleContentChange}
                className="min-h-[60vh] font-mono text-sm resize-none border-muted"
                placeholder="Start writing your note..."
              />
              
              {showMentionPopover && (
                <div className="absolute z-50" style={{ top: 24 }}>
                  <PopoverContent className="w-64 p-0" forceMount>
                    <Command>
                      <CommandInput placeholder="Search notes..." value={mentionQuery} onValueChange={setMentionQuery} />
                      <CommandList>
                        <CommandEmpty>No notes found</CommandEmpty>
                        <CommandGroup>
                          {filteredNotes.map((note) => (
                            <CommandItem 
                              key={note.id} 
                              onSelect={() => handleSelectMention(note.title)}
                            >
                              <span>{note.title}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </div>
              )}
            </div>
            <BacklinksList noteId={activeNote.id} onLinkClick={handleNoteNavigation} />
          </Popover>
        </div>
      </ScrollArea>
    </div>
  );
};

export default NoteEditor;
