
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Plus, 
  Search 
} from 'lucide-react';
import useNoteStore from '@/store/noteStore';

const Sidebar: React.FC = () => {
  const { 
    notes, 
    activeNoteId, 
    searchQuery,
    isCreatingNewNote,
    setActiveNote, 
    setSearchQuery,
    setIsCreatingNewNote,
    createNote,
  } = useNoteStore();
  const [newNoteTitle, setNewNoteTitle] = useState('');

  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateNote = () => {
    if (newNoteTitle.trim()) {
      createNote(newNoteTitle.trim());
      setNewNoteTitle('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateNote();
    } else if (e.key === 'Escape') {
      setIsCreatingNewNote(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-sidebar p-4 border-r">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-noteweave-600 dark:text-noteweave-400">
          NoteWeave
        </h1>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search notes..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="mb-4">
        <Button 
          variant="outline"
          className="w-full justify-start"
          onClick={() => setIsCreatingNewNote(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Note
        </Button>
      </div>

      {isCreatingNewNote && (
        <div className="mb-4 p-2 bg-card rounded-md border">
          <Input 
            placeholder="Note title..."
            value={newNoteTitle}
            onChange={(e) => setNewNoteTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsCreatingNewNote(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="default" 
              size="sm"
              onClick={handleCreateNote}
              disabled={!newNoteTitle.trim()}
            >
              Create
            </Button>
          </div>
        </div>
      )}

      <ScrollArea className="flex-1 -mx-2">
        <div className="px-2 space-y-1">
          {filteredNotes.length > 0 ? (
            filteredNotes.map((note) => (
              <Button
                key={note.id}
                variant="ghost"
                className={`w-full justify-start flex items-center ${
                  activeNoteId === note.id ? 'bg-accent' : ''
                }`}
                onClick={() => setActiveNote(note.id)}
              >
                <FileText className="mr-2 h-4 w-4" />
                <span className="truncate">{note.title}</span>
              </Button>
            ))
          ) : (
            <div className="py-4 text-center text-muted-foreground">
              {searchQuery ? 'No matching notes found' : 'No notes yet'}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default Sidebar;
