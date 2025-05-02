
import { create } from 'zustand';
import { Note, BacklinkReference, GraphData, NoteNode, NoteEdge } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { findMentions } from '@/lib/mentions';

// Function to get random position for graph nodes
const getRandomPosition = () => ({
  x: Math.random() * 500,
  y: Math.random() * 400,
});

interface NoteStore {
  notes: Note[];
  activeNoteId: string | null;
  searchQuery: string;
  isCreatingNewNote: boolean;
  graphData: GraphData;
  
  // Actions
  createNote: (title: string) => void;
  updateNote: (id: string, data: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  setActiveNote: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setIsCreatingNewNote: (isCreating: boolean) => void;
  generateGraphData: () => GraphData;
  getBacklinks: (noteId: string) => BacklinkReference[];
}

const useNoteStore = create<NoteStore>((set, get) => ({
  notes: [
    {
      id: '1',
      title: 'Welcome to NoteWeave',
      content: 
`# Welcome to NoteWeave!

This is your first note. You can **edit** it or create new notes.

## Features
- Create and edit notes with Markdown
- Link notes together using [[brackets]]
- View connections in the graph visualizer
- Search for notes quickly

## How to Link Notes
To create a link to another note, use double brackets like this: [[Sample Note]].

Try creating more notes and linking them together!`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['welcome'],
    },
    {
      id: '2',
      title: 'Sample Note',
      content: 
`# Sample Note

This is an example note that's linked from the [[Welcome to NoteWeave]] note.

You can create links between notes to build a network of connected ideas.

## Backlinks
Backlinks will automatically appear at the bottom of notes when other notes link to this one.`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['example'],
    },
  ],
  activeNoteId: '1',
  searchQuery: '',
  isCreatingNewNote: false,
  graphData: { nodes: [], edges: [] },

  createNote: (title) => {
    const id = uuidv4();
    const newNote: Note = {
      id,
      title,
      content: `# ${title}\n\nStart writing your note here...`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: [],
    };

    set((state) => ({
      notes: [...state.notes, newNote],
      activeNoteId: id,
      isCreatingNewNote: false,
    }));

    // Update graph after creating a note
    get().generateGraphData();
  },

  updateNote: (id, data) => {
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === id
          ? { ...note, ...data, updatedAt: new Date().toISOString() }
          : note
      ),
    }));

    // Update graph after updating a note as links might have changed
    get().generateGraphData();
  },

  deleteNote: (id) => {
    set((state) => {
      // If the active note is being deleted, set activeNoteId to the first available note or null
      const activeNoteId = 
        state.activeNoteId === id 
          ? state.notes.length > 1 
            ? state.notes.find(note => note.id !== id)?.id || null 
            : null 
          : state.activeNoteId;
      
      return {
        notes: state.notes.filter((note) => note.id !== id),
        activeNoteId,
      };
    });

    // Update graph after deleting a note
    get().generateGraphData();
  },

  setActiveNote: (id) => {
    set({ activeNoteId: id });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  setIsCreatingNewNote: (isCreating) => {
    set({ isCreatingNewNote: isCreating });
  },

  generateGraphData: () => {
    const { notes } = get();
    
    // Create nodes for each note
    const nodes: NoteNode[] = notes.map((note) => ({
      id: note.id,
      data: {
        label: note.title,
        noteId: note.id,
      },
      position: getRandomPosition(),
    }));

    // Create edges based on mentions in notes
    const edges: NoteEdge[] = [];
    
    notes.forEach((sourceNote) => {
      const mentions = findMentions(sourceNote.content);
      
      mentions.forEach((mention) => {
        // Find the target note by title
        const targetNote = notes.find(
          (note) => note.title.toLowerCase() === mention.toLowerCase()
        );

        if (targetNote) {
          const edgeId = `${sourceNote.id}-${targetNote.id}`;
          
          // Check if this edge already exists to avoid duplicates
          if (!edges.some(edge => edge.id === edgeId)) {
            edges.push({
              id: edgeId,
              source: sourceNote.id,
              target: targetNote.id,
            });
          }
        }
      });
    });

    const graphData = { nodes, edges };
    set({ graphData });
    return graphData;
  },

  getBacklinks: (noteId) => {
    const { notes } = get();
    const currentNote = notes.find(note => note.id === noteId);
    
    if (!currentNote) {
      return [];
    }

    const backlinks: BacklinkReference[] = [];

    notes.forEach(note => {
      if (note.id === noteId) return; // Skip the current note
      
      // Check if the note mentions the current note
      const mentions = findMentions(note.content);
      if (mentions.includes(currentNote.title)) {
        // Extract a short excerpt around the mention
        const excerpt = extractExcerpt(note.content, currentNote.title);
        
        backlinks.push({
          noteId: note.id,
          noteTitle: note.title,
          excerpt,
        });
      }
    });

    return backlinks;
  },
}));

// Helper function to extract a short excerpt around a mention
function extractExcerpt(content: string, mentionTitle: string): string {
  const mentionPattern = new RegExp(`\\[\\[${mentionTitle}\\]\\]`);
  const match = mentionPattern.exec(content);
  
  if (!match) return '';

  const startIndex = Math.max(0, match.index - 30);
  const endIndex = Math.min(content.length, match.index + match[0].length + 30);
  let excerpt = content.substring(startIndex, endIndex);
  
  // Add ellipsis if the excerpt doesn't start at the beginning or end at the end
  if (startIndex > 0) excerpt = '...' + excerpt;
  if (endIndex < content.length) excerpt = excerpt + '...';
  
  return excerpt;
}

export default useNoteStore;
