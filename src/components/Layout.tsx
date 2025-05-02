
import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import NoteEditor from './NoteEditor';
import GraphVisualizer from './GraphVisualizer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Pencil } from 'lucide-react';
import useNoteStore from '@/store/noteStore';

const Layout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('editor');
  const { generateGraphData } = useNoteStore();

  // Generate graph data when component mounts
  useEffect(() => {
    generateGraphData();
  }, [generateGraphData]);

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 h-full border-r">
          <Sidebar />
        </div>
        
        <div className="flex-1 h-full flex flex-col">
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="flex flex-col h-full"
          >
            <div className="border-b px-4 py-2">
              <TabsList>
                <TabsTrigger value="editor" className="flex items-center gap-2">
                  <Pencil className="h-4 w-4" />
                  Editor
                </TabsTrigger>
                <TabsTrigger value="graph" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Graph
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="editor" className="flex-1 overflow-hidden m-0">
              <NoteEditor />
            </TabsContent>
            
            <TabsContent value="graph" className="flex-1 overflow-hidden m-0">
              <GraphVisualizer />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Layout;
