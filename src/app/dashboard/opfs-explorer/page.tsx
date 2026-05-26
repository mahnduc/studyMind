"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Folder,
  FileText,
  Trash2,
  ChevronRight,
  Edit2Icon,
} from "lucide-react";
import { opfsApi } from "../../lib/opfs/opfsApis";

import { useEditorStore } from "@/stores/editorStore";
import Link from "next/link";
import { SimpleView } from "@/app/simple/components/tiptap-templates/simple/SimpleView";

type NodeType = "file" | "folder";

interface FileNode {
  name: string;
  type: NodeType;
  path: string;
  children?: FileNode[];
}

export default function OPFSExplorer() {
  const [tree, setTree] = useState<FileNode[]>([]);
  const [currentPath, setCurrentPath] = useState<string>("/");
  const [expanded, setExpanded] = useState<string[]>(["/"]);
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<FileNode | null>(null);
  const [sidebarWidth] = useState(260);
  const setFileOpen = useEditorStore((s) => s.setFilePath)

  // Nội dung file markdown
  const [fileContent, setFileContent] = useState<string>("");

  const loadTree = useCallback(async () => {
    setLoading(true);

    try {
      const data = await opfsApi.getTree("/");

      const mapNodes = (items: any[]): FileNode[] => {
        return items.map((item) => ({
          name: item.name,
          type: item.kind === "directory" ? "folder" : "file",
          path: item.path,
          children: item.children ? mapNodes(item.children) : undefined,
        }));
      };

      setTree(mapNodes(data));
    } catch (error) {
      console.error("Lỗi tải cây thư mục:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTree();
  }, [loadTree]);

  const openFile = async (node: FileNode) => {
    try {
      const content = await opfsApi.readAsText(node.path);

      setSelectedNode(node);
      setCurrentPath(node.path);

      // truyền content sang editor
      setFileContent(content);
    } catch (err) {
      alert("Lỗi đọc tệp: " + err);
    }
  };

  const handleDelete = async () => {
    if (!selectedNode) {
      alert("Vui lòng chọn file hoặc thư mục để xóa");
      return;
    }

    if (selectedNode.path === "/") return;

    const isFolder = selectedNode.type === "folder";

    const confirmed = confirm(
      `${isFolder ? "Xóa thư mục và toàn bộ nội dung" : "Xóa file"}:\n${selectedNode.path}?`
    );

    if (!confirmed) return;

    try {
      await opfsApi.delete(selectedNode.path, isFolder);

      setSelectedNode(null);
      setCurrentPath("/");
      setFileContent("");

      await loadTree();
    } catch (err) {
      alert("Lỗi xóa: " + err);
    }
  };

  const toggleFolder = (node: FileNode) => {
    setSelectedNode(node);
    setCurrentPath(node.path);

    setExpanded((prev) =>
      prev.includes(node.path)
        ? prev.filter((p) => p !== node.path)
        : [...prev, node.path]
    );
  };

  const renderTree = (nodes: FileNode[]) => {
    const sorted = [...nodes].sort((a, b) =>
      a.type === b.type
        ? a.name.localeCompare(b.name)
        : a.type === "folder"
        ? -1
        : 1
    );

    return sorted.map((node) => {
      const isExpanded = expanded.includes(node.path);
      const isSelected = selectedNode?.path === node.path;

      return (
        <div key={node.path} className="flex flex-col">
          <div
            onClick={() => node.type === "folder" ? toggleFolder(node) : openFile(node)}
            className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-all duration-200 group rounded-lg mb-0.5 ${isSelected ? "bg-[#FFF0F7] text-[#FF3399]" : "hover:bg-[#F7F9FB] text-[#2D3436] font-bold"}`}>
            
            {node.type === "folder" ? (
              <Folder size={16} className={isExpanded ? "text-[#FF3399] fill-[#FF3399]/10" : "text-[#B2BEC3]"}/>
            ) : (
              <FileText size={16} className={isSelected ? "text-[#FF3399]" : "text-[#B2BEC3]"}/>
            )}

            <span className="text-[13px] truncate flex-1">{node.name}</span>

            {node.type === "folder" && (
              <ChevronRight size={12} className={`transition-transform ${isExpanded ? "rotate-90" : ""} text-[#B2BEC3]`}/>
            )}
          </div>

          {node.type === "folder" && isExpanded && node.children && (
            <div className="ml-4 border-l border-[#E5E5E5] pl-2 flex flex-col">
              {node.children.length > 0 ? (
                renderTree(node.children)
              ) : (
                <span className="text-[10px] text-[#B2BEC3] py-1 pl-4 font-bold">
                  TRỐNG
                </span>
              )}
            </div>
          )}
        </div>
      );
    });
  };

  const handleEdit = () => {
    if (!selectedNode) {
      alert("Vui lòng chọn một tệp tin để chỉnh sửa!");
      return;
    }

    if (selectedNode.type === "folder") {
      console.log("Đây là thư mục: ", selectedNode.path);
      return;
    }

    setFileOpen(selectedNode.path)
    console.log("File được chọn:", selectedNode.path);
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-white">
      <aside
        style={{ width: `${sidebarWidth}px` }}
        className="flex flex-col bg-white border-r border-[#F0F0F0] shrink-0"
      >
        <div className="p-5 flex-1 overflow-y-auto custom-scrollbar">
          <h2 className="text-[10px] text-[#B2BEC3] mb-4 font-black uppercase tracking-widest">
            Hệ thống tệp tin
          </h2>
          <div className="space-y-0.5">{renderTree(tree)}</div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col bg-white min-w-0 overflow-hidden">
        <SimpleView mdContent={fileContent} />
      </main>

      <aside className="w-16 flex flex-col items-center py-6 gap-3 bg-[#F7F9FB] border-l border-[#F0F0F0] shrink-0">
        <Link href="/simple" >
        <button 
          onClick={handleEdit}
          className="p-3 rounded-xl border-b-2 active:translate-y-0.5 active:border-b-0 transition-all bg-[#00CEC9] text-white border-[#00A8A5] shadow-md" 
        >
          <Edit2Icon size={20} strokeWidth={2.5} />
        </button>
        </Link>
        <div className="w-8 h-px bg-[#E5E5E5] my-1" />

        <div className="mt-auto">
          <button onClick={handleDelete} className="p-3 text-[#B2BEC3] hover:text-[#FF3399] hover:bg-[#FFF0F7] rounded-xl transition-all">
            <Trash2 size={20} strokeWidth={2.5} />
          </button>
        </div>
      </aside>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #eee;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
