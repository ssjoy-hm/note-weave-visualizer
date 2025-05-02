
import React, { useEffect, useState } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  EdgeTypes,
  Node,
  Edge,
  NodeTypes,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import useNoteStore from '@/store/noteStore';

const nodeTypes: NodeTypes = {};

const edgeTypes: EdgeTypes = {};

interface NoteGraphProps {
  onNodeClick: (nodeId: string) => void;
}

const NoteGraph: React.FC<NoteGraphProps> = ({ onNodeClick }) => {
  const { notes, activeNoteId, setActiveNote, graphData } = useNoteStore();
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  const reactFlowInstance = useReactFlow();

  // Initialize or update the graph when graphData changes
  useEffect(() => {
    if (graphData) {
      // Create nodes with formatted data
      const formattedNodes = graphData.nodes.map(node => {
        // Check if this is the active note
        const isActive = node.data.noteId === activeNoteId;
        
        return {
          ...node,
          style: {
            background: isActive ? '#4338ca' : '#f9fafb', 
            color: isActive ? 'white' : 'black',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '10px',
            fontSize: '12px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            width: 150,
          },
        };
      });

      // Create edges with formatted data
      const formattedEdges = graphData.edges.map(edge => ({
        ...edge,
        animated: true,
        style: { stroke: '#4f46e5', strokeWidth: 2 },
      }));

      setNodes(formattedNodes);
      setEdges(formattedEdges);
    }
  }, [graphData, activeNoteId, setNodes, setEdges]);

  const onConnect = React.useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges]
  );

  const handleNodeClick = (_: React.MouseEvent, node: Node) => {
    // Fix the type issue by explicitly checking for the noteId property
    if (node.data && typeof node.data.noteId === 'string') {
      const noteId = node.data.noteId;
      onNodeClick(noteId);
    }
  };

  useEffect(() => {
    // If we have nodes, re-center the view
    if (nodes.length > 0) {
      reactFlowInstance.fitView({ padding: 0.2 });
    }
  }, [nodes, reactFlowInstance]);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        attributionPosition="bottom-right"
      >
        <Background color="#aaa" gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default NoteGraph;
