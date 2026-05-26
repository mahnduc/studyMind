"use client"

import { useEffect, useRef, useState } from "react"
import { EditorContent, EditorContext, useEditor } from "@tiptap/react"

// --- Tiptap Core Extensions ---
import { StarterKit } from "@tiptap/starter-kit"
import { Image } from "@tiptap/extension-image"
import { TaskItem, TaskList } from "@tiptap/extension-list"
import { TextAlign } from "@tiptap/extension-text-align"
import { Typography } from "@tiptap/extension-typography"
import { Highlight } from "@tiptap/extension-highlight"
import { Subscript } from "@tiptap/extension-subscript"
import { Superscript } from "@tiptap/extension-superscript"
import { Selection } from "@tiptap/extensions"

// --- UI Primitives ---
import { Button } from "../../tiptap-ui-primitive/button"
import { Spacer } from "../../tiptap-ui-primitive/spacer"
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "../../tiptap-ui-primitive/toolbar"

// --- Tiptap Node ---
import { ImageUploadNode } from "../../tiptap-node/image-upload-node/image-upload-node-extension"
import { HorizontalRule } from "../../tiptap-node/horizontal-rule-node/horizontal-rule-node-extension"
import "../../tiptap-node/blockquote-node/blockquote-node.scss"
import "../../tiptap-node/code-block-node/code-block-node.scss"
import "../../tiptap-node/horizontal-rule-node/horizontal-rule-node.scss"
import "../../tiptap-node/list-node/list-node.scss"
import "../../tiptap-node/image-node/image-node.scss"
import "../../tiptap-node/heading-node/heading-node.scss"
import "../../tiptap-node/paragraph-node/paragraph-node.scss"

// --- Tiptap UI ---
import { HeadingDropdownMenu } from "../../tiptap-ui/heading-dropdown-menu"
import { ImageUploadButton } from "../../tiptap-ui/image-upload-button"
import { ListDropdownMenu } from "../../tiptap-ui/list-dropdown-menu"
import { BlockquoteButton } from "../../tiptap-ui/blockquote-button"
import { CodeBlockButton } from "../../tiptap-ui/code-block-button"
import {
  ColorHighlightPopover,
  ColorHighlightPopoverContent,
  ColorHighlightPopoverButton,
} from "../../tiptap-ui/color-highlight-popover"
import {
  LinkPopover,
  LinkContent,
  LinkButton,
} from "../../tiptap-ui/link-popover"
import { MarkButton } from "../../tiptap-ui/mark-button"
import { TextAlignButton } from "../../tiptap-ui/text-align-button"
import { UndoRedoButton } from "../../tiptap-ui/undo-redo-button"

// --- Icons ---
import { ArrowLeftIcon } from "../../tiptap-icons/arrow-left-icon"
import { HighlighterIcon } from "../../tiptap-icons/highlighter-icon"
import { LinkIcon } from "../../tiptap-icons/link-icon"

// --- Hooks ---
import { useIsBreakpoint } from "@/app/simple/hooks/use-is-breakpoint"
import { useWindowSize } from "@/app/simple/hooks/use-window-size"
import { useCursorVisibility } from "@/app/simple/hooks/use-cursor-visibility"

// --- Components ---
import { ThemeToggle } from "../../tiptap-templates/simple/theme-toggle"

// --- Lib ---

import { handleImageUpload, MAX_FILE_SIZE } from "@/app/simple/lib/tiptap-utils"

// --- Styles ---
import "./simple-editor.scss"

import { Markdown } from "@tiptap/markdown"
import { openMarkdownFromPicker } from "./markdown-file"
import { FileDown, FileSearchCorner, FileUp, MenuSquare, Save, Text, Type } from "lucide-react"
import SaveFileModal from "./popupSave"
import { useEditorStore } from "@/stores/editorStore"

const MainToolbarContent = ({
  onHighlighterClick,
  onLinkClick,
  isMobile,
}: {
  onHighlighterClick: () => void
  onLinkClick: () => void
  isMobile: boolean
}) => {
  return (
    <>
      <Spacer />

      <ToolbarGroup>
        <UndoRedoButton action="undo" />
        <UndoRedoButton action="redo" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <HeadingDropdownMenu modal={false} levels={[1, 2, 3, 4]} />
        <ListDropdownMenu
          modal={false}
          types={["bulletList", "orderedList", "taskList"]}
        />
        <BlockquoteButton />
        <CodeBlockButton />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="bold" />
        <MarkButton type="italic" />
        <MarkButton type="strike" />
        <MarkButton type="code" />
        <MarkButton type="underline" />
        {!isMobile ? (
          <ColorHighlightPopover />
        ) : (
          <ColorHighlightPopoverButton onClick={onHighlighterClick} />
        )}
        {!isMobile ? <LinkPopover /> : <LinkButton onClick={onLinkClick} />}
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="superscript" />
        <MarkButton type="subscript" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <TextAlignButton align="left" />
        <TextAlignButton align="center" />
        <TextAlignButton align="right" />
        <TextAlignButton align="justify" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <ImageUploadButton text="Add" />
      </ToolbarGroup>

      <Spacer />

      {isMobile && <ToolbarSeparator />}

      <ToolbarGroup>
        <ThemeToggle />
      </ToolbarGroup>
    </>
  )
}

const MobileToolbarContent = ({
  type,
  onBack,
}: {
  type: "highlighter" | "link"
  onBack: () => void
}) => (
  <>
    <ToolbarGroup>
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeftIcon className="tiptap-button-icon" />
        {type === "highlighter" ? (
          <HighlighterIcon className="tiptap-button-icon" />
        ) : (
          <LinkIcon className="tiptap-button-icon" />
        )}
      </Button>
    </ToolbarGroup>

    <ToolbarSeparator />

    {type === "highlighter" ? (
      <ColorHighlightPopoverContent />
    ) : (
      <LinkContent />
    )}
  </>
)


export function SimpleEditor() {
  const isMobile = useIsBreakpoint()
  const { height } = useWindowSize()
  const [mobileView, setMobileView] = useState<"main" | "highlighter" | "link">(
    "main"
  )
  const [showSavePopup, setShowSavePopup] = useState(false)
  const [fileName, setFileName] = useState("")
  const toolbarRef = useRef<HTMLDivElement>(null)
  const [opfsHandle, setOpfsHandle] = useState<FileSystemFileHandle | null>(null)
  const filePath = useEditorStore((s) => s.filePath)

  const editor = useEditor({
    immediatelyRender: false,
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        "aria-label": "Main content area, start typing to enter text.",
        class: "simple-editor",
      },
    },
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
        link: {
          openOnClick: false,
          enableClickSelection: true,
        },
      }),
      Markdown,
      HorizontalRule,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      Image,
      Typography,
      Superscript,
      Subscript,
      Selection,
      ImageUploadNode.configure({
        accept: "image/*",
        maxSize: MAX_FILE_SIZE,
        limit: 3,
        upload: handleImageUpload,
        onError: (error) => console.error("Upload failed:", error),
      }),
    ],
    content: "",
  })
  // open file 
  useEffect(() => {
    const loadFileFromOPFS = async () => {
      if (!editor || !filePath) return

      try {
        const root = await navigator.storage.getDirectory()
        const parts = filePath.split("/").filter(Boolean)

        let currentDir: FileSystemDirectoryHandle = root
        let fileHandle: FileSystemFileHandle | null = null

        for (let i = 0; i < parts.length; i++) {
          const part = parts[i]
          const isLast = i === parts.length - 1

          if (isLast) {
            fileHandle = await currentDir.getFileHandle(part)
          } else {
            currentDir = await currentDir.getDirectoryHandle(part)
          }
        }

        if (!fileHandle) return

        const file = await fileHandle.getFile()
        const content = await file.text()
        //-------đừng động đến cái này------------
        editor.commands.setContent(content, {
          contentType: "markdown",
          emitUpdate: false,
        })
        //----------------------------------------
        setOpfsHandle(fileHandle)

        const cleanName =
          fileHandle.name.replace(".md", "")

        setFileName(cleanName)

        console.log("Loaded:", filePath)
      } catch (err) {
        console.error("Không đọc được file OPFS:", err)
      }
    }

    loadFileFromOPFS()
  }, [filePath, editor])
  // Hàm mở rộng
  const saveMarkdown = async () => {
    if (!editor) return

    try {
      const markdown = editor.getMarkdown()
      const baseName = (fileName.trim() || "document").replace(/[<>:"/\\|?*]/g, "")
      
      const root = await navigator.storage.getDirectory()
      const workspaceDir = await root.getDirectoryHandle("my-workspace", {
        create: true,
      })

      let handle = opfsHandle
      
      if (!handle) {
        let finalName = `${baseName}.md`
        let counter = 1
        
        while (true) {
          try {
            // Thử lấy file handle với tên hiện tại
            await workspaceDir.getFileHandle(finalName)
            
            finalName = `${baseName} (${counter}).md`
            counter++
          } catch (err) {
            break
          }
        }

        handle = await workspaceDir.getFileHandle(finalName, { create: true })
        setOpfsHandle(handle)
        // Cập nhật lại UI tên file nếu cần (tùy chọn)
        // setFileName(finalName.replace(".md", "")) 
      }

      // Tiến hành ghi file
      const writable = await handle.createWritable()
      await writable.write(markdown)
      await writable.close()
      
      setShowSavePopup(false)
      console.log("Đã lưu thành công:", handle.name)

    } catch (err) {
      console.error("Lỗi khi lưu file:", err)
    }
  }

  const openMarkdownFile = async () => {
    if (!editor) return
    const result = await openMarkdownFromPicker()
    if (!result) return

    console.log(result.content)
    // const cleanContent = result.content.replace(/^\uFEFF/, "")

    editor.commands.setContent(result.content, {
      contentType: "markdown",
      emitUpdate: false,
    })

    setFileName(result.fileName.replace(".md", ""))
    setOpfsHandle(null)
  }

  // const downloadMarkdown = () => {
  //   if (!editor) return
  //   const markdown = editor.getMarkdown()
  //   downloadMarkdownFile(markdown, fileName)
  // }
  
// --------------------------------
  const rect = useCursorVisibility({
    editor,
    overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
  })

  useEffect(() => {
    if (!isMobile && mobileView !== "main") {
      setMobileView("main")
    }
  }, [isMobile, mobileView])

  return (
    <div className="simple-editor-wrapper flex">
      <aside 
        className="w-12 border-r h-screen sticky top-0 hidden sm:flex flex-col items-center py-5.5"
        style={{ 
          backgroundColor: 'var(--tt-bg-color)', 
          borderColor: 'var(--tt-scrollbar-color)',
          color: 'var(--tt-theme-text)' 
        }}
      >
        <div className="mb-8">
          <Type size={18} />
        </div>

        <div className="flex flex-col gap-y-4 w-full items-center">
          <div className="relative group flex justify-center">
            <button className="p-2 rounded-md hover:bg-gray-100" onClick={() => setShowSavePopup(true)}>
              <Save size={18}/>
            </button>
            <span className="absolute left-12 scale-0 transition-all rounded bg-black p-2 text-xs text-white group-hover:scale-100 whitespace-nowrap">
              Save
            </span>
          </div>
          <div className="relative group flex justify-center">
            <button className="p-2 rounded-md hover:bg-gray-100" onClick={openMarkdownFile}>
              <FileUp size={18}/>
            </button>
            <span className="absolute left-12 scale-0 transition-all rounded bg-black p-2 text-xs text-white group-hover:scale-100 whitespace-nowrap">
              Upload
            </span>
          </div>
          {/* <div className="relative group flex justify-center">
            <button className="p-2 rounded-md hover:bg-gray-100" onClick={downloadMarkdown}>
              <FileDown size={18}/>
            </button>
            <span className="absolute left-12 scale-0 transition-all rounded bg-black p-2 text-xs text-white group-hover:scale-100 whitespace-nowrap">
              Download
            </span>
          </div> */}
        </div>

      </aside>
      <main className="flex-1 flex flex-col min-w-0">
      <EditorContext.Provider value={{ editor }}>
        <Toolbar
          ref={toolbarRef}
          style={{
            ...(isMobile
              ? {
                  bottom: `calc(100% - ${height - rect.y}px)`,
                }
              : {}),
          }}
        >
          {mobileView === "main" ? (
            <MainToolbarContent
              onHighlighterClick={() => setMobileView("highlighter")}
              onLinkClick={() => setMobileView("link")}
              isMobile={isMobile}
            />
          ) : (
            <MobileToolbarContent
              type={mobileView === "highlighter" ? "highlighter" : "link"}
              onBack={() => setMobileView("main")}
            />
          )}
        </Toolbar>

        <main className="flex-1 overflow-auto bg-neutral-45 py-10">
          <div className="mx-auto">
            <EditorContent
              editor={editor}
              className="editor-page"
            />
          </div>
        </main>

      </EditorContext.Provider>
      </main>

      <SaveFileModal
        open={showSavePopup}
        fileName={fileName}
        setFileName={setFileName}
        onClose={() => setShowSavePopup(false)}
        onSave={saveMarkdown}
      />
    </div>
  )
}

