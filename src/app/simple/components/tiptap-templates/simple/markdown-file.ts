
type OpenMarkdownResult = {
  content: string
  fileName: string
  handle?: FileSystemFileHandle
}


export const openMarkdownFromPicker = async (): Promise<OpenMarkdownResult | null> => {
  try {
    const [handle] = await (window as any).showOpenFilePicker({
      types: [
        {
          description: "Markdown",
          accept: {
            "text/markdown": [".md"],
            "text/plain": [".md", ".txt"],
          },
        },
      ],
      multiple: false,
    })

    const file = await handle.getFile()
    const content = await file.text()
    
    return {
      content,
      fileName: file.name,
      handle,
    }
  } catch {
    return null
  }
}