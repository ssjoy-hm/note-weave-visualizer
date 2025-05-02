
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  FileText, 
  Plus, 
  Search, 
  ChevronRight,
  Calendar,
  Link,
} from 'lucide-react';
import useNoteStore from '@/store/noteStore';
import { findMentions } from '@/lib/mentions';
import { formatDistanceToNow } from 'date-fns';

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
    getBacklinks,
  } = useNoteStore();
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);

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

  const toggleExpand = (noteId: string) => {
    setExpandedNoteId(expandedNoteId === noteId ? null : noteId);
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return "Unknown date";
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
            filteredNotes.map((note) => {
              const mentions = findMentions(note.content);
              const backlinks = getBacklinks(note.id);
              const isExpanded = expandedNoteId === note.id;
              const isActive = activeNoteId === note.id;
              
              return (
                <div key={note.id} className="mb-1">
                  <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      className={`w-full justify-start flex items-center ${
                        isActive ? 'bg-accent' : ''
                      }`}
                      onClick={() => setActiveNote(note.id)}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      <span className="truncate">{note.title}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(note.id);
                      }}
                    >
                      <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'transform rotate-90' : ''}`} />
                    </Button>
                  </div>
                  
                  {isExpanded && (
                    <div className="ml-7 mt-1 mb-2 text-xs space-y-2 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> 
                        <span>Created: {formatDate(note.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> 
                        <span>Updated: {formatDate(note.updatedAt)}</span>
                      </div>
                      
                      {mentions.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            <Link className="h-3 w-3" /> 
                            <span className="font-medium">Links:</span>
                          </div>
                          <div className="ml-4">
                            {mentions.map((mention) => (
                              <div 
                                key={mention}
                                className="truncate cursor-pointer hover:text-foreground"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const targetNote = notes.find(
                                    n => n.title.toLowerCase() === mention.toLowerCase()
                                  );
                                  if (targetNote) setActiveNote(targetNote.id);
                                }}
                              >
                                {mention}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {backlinks.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            <Link className="h-3 w-3 transform rotate-180" /> 
                            <span className="font-medium">Backlinks:</span>
                          </div>
                          <div className="ml-4">
                            {backlinks.map((backlink) => (
                              <div 
                                key={backlink.noteId}
                                className="truncate cursor-pointer hover:text-foreground"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveNote(backlink.noteId);
                                }}
                              >
                                {backlink.noteTitle}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
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
