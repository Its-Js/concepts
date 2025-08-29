import { useState, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type Node,
  type Edge,
  type Connection,
  type NodeChange,
  type EdgeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';

// The electronAPI is exposed via the preload script
declare global {
  interface Window {
    electronAPI: {
      getNodes: () => Promise<Node[]>;
      addNode: (node: Node) => Promise<void>;
      updateNodeDescription: (id: string, description: string) => Promise<void>;
      renameNode: (id: string, name: string) => Promise<void>;
      deleteNode: (id: string) => Promise<void>;
    };
  }
}

export default function App() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedElement, setSelectedElement] = useState<Node | Edge | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [isAddNodeDialogOpen, setIsAddNodeDialogOpen] = useState(false);
  const [newNodeName, setNewNodeName] = useState('');
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [renameNodeName, setRenameNodeName] = useState('');

  useEffect(() => {
    window.electronAPI.getNodes().then((initialNodes) => {
      setNodes(initialNodes);
    });
  }, []);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );
  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    []
  );

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedElement(node);
    setDescription(node.data.description || '');
    setIsSidebarOpen(true);
  }, []);

  const onEdgeClick = useCallback((_event: React.MouseEvent, edge: Edge) => {
    setSelectedElement(edge);
    setIsSidebarOpen(true);
  }, []);

  const onPaneClick = useCallback(() => {
    setIsSidebarOpen(false);
    setSelectedElement(null);
  }, []);

  const onAddNode = useCallback(() => {
    setIsAddNodeDialogOpen(true);
  }, []);

  const onSaveNode = useCallback(() => {
    if (newNodeName) {
      const newNode: Node = {
        id: `n${nodes.length + 1}`,
        position: { x: Math.random() * 400, y: Math.random() * 400 },
        data: { label: newNodeName, description: '' },
      };
      window.electronAPI.addNode(newNode).then(() => {
        setNodes((nds) => [...nds, newNode]);
        setIsAddNodeDialogOpen(false);
        setNewNodeName('');
      });
    }
  }, [nodes, newNodeName]);

  const onDeleteNode = useCallback(() => {
    if (selectedElement && 'position' in selectedElement) {
      window.electronAPI.deleteNode(selectedElement.id).then(() => {
        setNodes((nds) => nds.filter((n) => n.id !== selectedElement.id));
        setIsSidebarOpen(false);
        setSelectedElement(null);
      });
    }
  }, [selectedElement]);

  const onRenameNode = useCallback(() => {
    if (selectedElement && 'position' in selectedElement) {
      setRenameNodeName(selectedElement.data.label);
      setIsRenameDialogOpen(true);
    }
  }, [selectedElement]);

  const onSaveRenameNode = useCallback(() => {
    if (selectedElement && 'position' in selectedElement && renameNodeName) {
      window.electronAPI.renameNode(selectedElement.id, renameNodeName).then(() => {
        setNodes((nds) =>
          nds.map((n) => {
            if (n.id === selectedElement.id) {
              return { ...n, data: { ...n.data, label: renameNodeName } };
            }
            return n;
          })
        );
        setIsRenameDialogOpen(false);
        setRenameNodeName('');
        setSelectedElement(null);
      });
    }
  }, [selectedElement, renameNodeName]);

  const onDeleteEdge = useCallback(() => {
    if (selectedElement && 'source' in selectedElement) {
      setEdges((eds) => eds.filter((e) => e.id !== selectedElement.id));
      setIsSidebarOpen(false);
      setSelectedElement(null);
    }
  }, [selectedElement]);

  const onDescriptionSave = useCallback(() => {
    if (selectedElement && 'position' in selectedElement) {
      window.electronAPI.updateNodeDescription(selectedElement.id, description).then(() => {
        setNodes((nds) =>
          nds.map((n) => {
            if (n.id === selectedElement.id) {
              return { ...n, data: { ...n.data, description } };
            }
            return n;
          })
        );
        setIsSidebarOpen(false);
        setSelectedElement(null);
      });
    }
  }, [selectedElement, description]);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10 }}>
        <Button onClick={onAddNode}>Add Node</Button>
      </div>
      <Sheet open={isAddNodeDialogOpen} onOpenChange={setIsAddNodeDialogOpen} className="z-[999]">
        <SheetContent side="right" className="border-2 border-red-500 overflow-hidden">
          <SheetHeader>
            <SheetTitle>Add Node</SheetTitle>
          </SheetHeader>
          <div className="p-4">
            <Textarea
              value={newNodeName}
              onChange={(e) => setNewNodeName(e.target.value)}
              className="mt-4 bg-white text-black"
              placeholder="Enter node name"
            />
            <Button onClick={onSaveNode} className="mt-4">Save</Button>
          </div>
        </SheetContent>
      </Sheet>
      <Sheet open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen} className="z-[999]">
        <SheetContent side="right" className="border-2 border-red-500 overflow-hidden">
          <SheetHeader>
            <SheetTitle>Rename Node</SheetTitle>
          </SheetHeader>
          <div className="p-4">
            <Textarea
              value={renameNodeName}
              onChange={(e) => setRenameNodeName(e.target.value)}
              className="mt-4 bg-white text-black"
              placeholder="Enter new node name"
            />
            <Button onClick={onSaveRenameNode} className="mt-4">Save</Button>
          </div>
        </SheetContent>
      </Sheet>
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen} className="z-[999]">
        <SheetContent side="right" className="border-2 border-red-500 overflow-hidden">
          <SheetHeader>
            <SheetTitle>Details</SheetTitle>
          </SheetHeader>
          {selectedElement && 'position' in selectedElement && (
            <div className="p-4">
              <SheetDescription>Node: {selectedElement.data.label}</SheetDescription>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-4 bg-white text-black"
              />
              <div className="flex space-x-2 mt-4">
                <Button onClick={onDescriptionSave}>Save</Button>
                <Button onClick={onRenameNode}>Rename</Button>
                <Button onClick={onDeleteNode}>Delete</Button>
              </div>
            </div>
          )}
          {selectedElement && 'source' in selectedElement && (
            <div className="p-4">
              <SheetDescription>Edge: {selectedElement.id}</SheetDescription>
              <Button onClick={onDeleteEdge} className="mt-4">Delete Edge</Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
