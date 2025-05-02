
import React from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import NoteGraph from './NoteGraph';
import useNoteStore from '@/store/noteStore';

const GraphVisualizer: React.FC = () => {
  const { setActiveNote } = useNoteStore();

  const handleNodeClick = (noteId: string) => {
    setActiveNote(noteId);
  };

  return (
    <div className="h-full">
      <ReactFlowProvider>
        <NoteGraph onNodeClick={handleNodeClick} />
      </ReactFlowProvider>
    </div>
  );
};

export default GraphVisualizer;
