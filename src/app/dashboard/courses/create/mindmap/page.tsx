"use client";

import React, { useState, useEffect } from "react";
import { 
  ReactFlow, 
  MiniMap, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState, 
  Node, 
  Edge,
  useReactFlow,
  ReactFlowProvider
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { toPng } from "html-to-image";

import { getAllKnowledgeBases } from "../_lib/rag/api";
import { ProcessedChunk } from "../_lib/rag/markdownChunker";
import ControlPanel from "./_components/ControlPanel";
import DetailWindow from "./_components/DetailWindow";

interface TreeNode {
  id: string;
  label: string;
  children: Record<string, TreeNode>;
  chunkId?: string;
  content?: string;
}

async function loadChunksFromOPFS(folderName: string): Promise<ProcessedChunk[] | null> {
  try {
    const root = await navigator.storage.getDirectory();
    const knowledgeHandle = await root.getDirectoryHandle("knowledge");
    const folderHandle = await knowledgeHandle.getDirectoryHandle(folderName);
    const fileHandle = await folderHandle.getFileHandle("chunks.json");
    
    const file = await fileHandle.getFile();
    const content = await file.text();
    const parsedData = JSON.parse(content);
    return parsedData.chunks || [];
  } catch (error) {
    console.error("Lỗi khi đọc file chunks từ OPFS:", error);
    return null;
  }
}

function MindmapContent() {
  const [knowledgeBases, setKnowledgeBases] = useState<string[]>([]);
  const [selectedKB, setSelectedKB] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedChunk, setSelectedChunk] = useState<{ id: string; content: string } | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const { getNodes, getNodesBounds, fitView } = useReactFlow();

  useEffect(() => {
    async function fetchKBs() {
      const list = await getAllKnowledgeBases();
      setKnowledgeBases(list);
    //   if (list.length > 0) {
    //     setSelectedKB(list[0]);
    //   }
    }
    fetchKBs();
  }, []);

  useEffect(() => {
    if (selectedKB) {
      handleRenderMindmap(selectedKB);
    }
  }, [selectedKB]);

  const buildTreeFromChunks = (chunks: ProcessedChunk[], rootLabel: string): TreeNode => {
    const root: TreeNode = { id: "root", label: rootLabel, children: {} };
    const hasValidHeadings = chunks.some(c => c.metadata.headings && c.metadata.headings.length > 0);

    chunks.forEach((chunk, index) => {
      let currentNode = root;
      let targetHeadings: string[] = [];

      if (hasValidHeadings) {
        targetHeadings = chunk.metadata.headings && chunk.metadata.headings.length > 0 
          ? chunk.metadata.headings 
          : ["Nội dung bổ trợ"];
      } else {
        const groupSize = 5;
        const groupIndex = Math.floor(index / groupSize);
        const startChunkNum = groupIndex * groupSize + 1;
        const endChunkNum = Math.min((groupIndex + 1) * groupSize, chunks.length);
        
        const clusterLabel = `Đoạn ${startChunkNum} - ${endChunkNum}`;
        const typeLabel = chunk.metadata.contentType !== "text" ? ` (${chunk.metadata.contentType.toUpperCase()})` : "";
        
        targetHeadings = [clusterLabel + typeLabel];
      }

      targetHeadings.forEach((headingText, hIdx) => {
        if (!currentNode.children[headingText]) {
          currentNode.children[headingText] = {
            id: `node-${chunk.metadata.source}-${headingText.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${index}-${hIdx}`,
            label: headingText,
            children: {},
          };
        }
        currentNode = currentNode.children[headingText];
      });

      const leafId = `leaf-${chunk.metadata.chunkId}`;
      currentNode.children[leafId] = {
        id: leafId,
        label: chunk.content.trim().substring(0, 45).replace(/\n/g, " ") + "...",
        children: {},
        chunkId: chunk.metadata.chunkId,
        content: chunk.content,
      };
    });

    return root;
  };

  const generateFlowElements = (tree: TreeNode) => {
    const generatedNodes: Node[] = [];
    const generatedEdges: Edge[] = [];
    let rowCounters: Record<number, number> = {}; 

    const traverse = (node: TreeNode, depth: number = 0, parentId: string | null = null) => {
      if (!rowCounters[depth]) rowCounters[depth] = 0;
      
      const horizontalSpacing = 280; 
      const verticalSpacing = 85;    
      
      const posX = depth * horizontalSpacing;
      const posY = rowCounters[depth] * verticalSpacing;
      
      rowCounters[depth] += 1;

      const isLeaf = !!node.chunkId;
      const nodeStyle = isLeaf 
        ? "bg-emerald-50/90 border-emerald-300 text-emerald-800 text-xs italic"
        : depth === 0 
          ? "bg-slate-900 border-slate-950 text-white font-semibold text-sm rounded-xl"
          : "bg-white border-slate-200 text-slate-700 font-medium text-xs";

      generatedNodes.push({
        id: node.id,
        data: { 
          label: (
            <div className="p-2 text-center max-w-[200px] break-words leading-snug select-none">
              {node.label}
              {isLeaf && (
                <button 
                  onClick={() => setSelectedChunk({ id: node.chunkId!, content: node.content || "" })}
                  className="mt-1 block w-full text-center text-[10px] text-indigo-600 font-medium underline hover:text-indigo-800 cursor-pointer area-view-detail"
                >
                  Xem chi tiết
                </button>
              )}
            </div>
          )
        },
        position: { x: posX, y: posY },
        className: `shadow-sm rounded-lg border ${nodeStyle} transition-all duration-150 hover:shadow-md`,
      });

      if (parentId) {
        generatedEdges.push({
          id: `edge-${parentId}-${node.id}`,
          source: parentId,
          target: node.id,
          animated: isLeaf,
          style: { stroke: isLeaf ? "#10b981" : "#cbd5e1", strokeWidth: 1.5 },
        });
      }

      Object.values(node.children).forEach((child) => {
        traverse(child, depth + 1, node.id);
      });
    };

    traverse(tree);
    return { nodes: generatedNodes, edges: generatedEdges };
  };

  const handleRenderMindmap = async (targetKB: string) => {
    if (!targetKB) return;

    setIsLoading(true);
    setError(null);

    try {
      const chunks = await loadChunksFromOPFS(targetKB);
      
      if (!chunks || chunks.length === 0) {
        throw new Error("Không tìm thấy dữ liệu chunk hoặc file rỗng.");
      }

      const treeStructure = buildTreeFromChunks(chunks, targetKB);
      const { nodes: fNodes, edges: fEdges } = generateFlowElements(treeStructure);

      setNodes(fNodes);
      setEdges(fEdges);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Lỗi xử lý dữ liệu sơ đồ.");
      setNodes([]);
      setEdges([]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- ĐOẠN FIX CHI TIẾT ĐỂ CHỮ KHÔNG BỊ VỠ / MẤT KHI XUẤT ẢNH ---
  const handleExportImage = async () => {
    const nodesArray = getNodes();
    if (nodesArray.length === 0) return;

    setIsExporting(true);

    try {
      // 1. Fitview thật khít để lấy thông số tọa độ chính xác nhất
      await fitView({ padding: 0.1, duration: 50 });
      
      const flowViewport = document.querySelector(".react-flow__viewport") as HTMLElement;
      if (!flowViewport) throw new Error("Không tìm thấy phần tử canvas ReactFlow");

      const bounds = getNodesBounds(nodesArray);
      
      const dataUrl = await toPng(flowViewport, {
        backgroundColor: "#f8fafc",
        quality: 1.0,
        cacheBust: true,
        // Tăng mật độ pixel lên gấp 2 lần giúp chữ nét căng như màn Retina
        pixelRatio: 2, 
        filter: (node: HTMLElement) => {
          if (node.classList?.contains("area-view-detail")) {
            return false;
          }
          return true;
        },
        width: bounds.width + 150,
        height: bounds.height + 150,
        style: {
          width: `${bounds.width + 150}px`,
          height: `${bounds.height + 150}px`,
          transform: `translate(${-bounds.x + 75}px, ${-bounds.y + 75}px)`,
          // Khai báo rõ ràng cấu hình font chữ và chống răng cưa chống lỗi vỡ chữ hình khối
          fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        //   WebkitFontSmoothing: "antialiased",
        //   MozOsxFontSmoothing: "grayscale",
        },
      });

      const link = document.createElement("a");
      link.download = `mindmap-${selectedKB || "export"}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Lỗi khi kết xuất sơ đồ thành file ảnh:", err);
      alert("Xuất ảnh thất bại, vui lòng thử lại.");
    } finally {
      setIsExporting(false);
      fitView({ padding: 0.1 });
    }
  };

  return (
    <div className="relative h-screen w-screen bg-slate-50 overflow-hidden text-slate-900">
      
      <div className="w-full h-full">
        {nodes.length > 0 ? (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
          >
            <Controls position="bottom-left" />
            <MiniMap position="bottom-right" style={{ height: 120, width: 160 }} />
            <Background color="#cbd5e1" gap={18} size={1} />
          </ReactFlow>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-slate-50">
            <p className="text-sm font-medium text-slate-500">
              {isLoading ? "Đang truy xuất cấu trúc dữ liệu từ OPFS..." : ""}
            </p>
          </div>
        )}
      </div>

      {/* COMPONENT THANH ĐIỀU KHIỂN */}
      <ControlPanel
        knowledgeBases={knowledgeBases}
        selectedKB={selectedKB}
        setSelectedKB={setSelectedKB}
        isLoading={isLoading}
        error={error}
        hasNodes={nodes.length > 0}
        isExporting={isExporting}
        onExport={handleExportImage}
      />

      {/* COMPONENT CỬA SỔ POPUP XEM CHUNK DETAIL */}
      {selectedChunk && (
        <DetailWindow
          chunk={selectedChunk}
          onClose={() => setSelectedChunk(null)}
        />
      )}
    </div>
  );
}

export default function MindmapPage() {
  return (
    <ReactFlowProvider>
      <MindmapContent />
    </ReactFlowProvider>
  );
}