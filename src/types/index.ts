
export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export interface NoteLink {
  sourceId: string;
  targetId: string;
}

export interface BacklinkReference {
  noteId: string;
  noteTitle: string;
  excerpt: string;
}

export interface NoteNode {
  id: string;
  data: {
    label: string;
    noteId: string;
  };
  position: {
    x: number;
    y: number;
  };
}

export interface NoteEdge {
  id: string;
  source: string;
  target: string;
}

export interface GraphData {
  nodes: NoteNode[];
  edges: NoteEdge[];
}
