
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

// export const downloadMarkdownFile = (
//   markdown: string,
//   filename?: string
// ) => {
//   try {
//     const finalFileName =
//       filename?.trim()
//         ? filename.endsWith(".md")
//           ? filename
//           : `${filename}.md`
//         : "document.md"

//     const blob = new Blob([markdown], {
//       type: "text/markdown;charset=utf-8",
//     })

//     const url = URL.createObjectURL(blob)

//     const link = document.createElement("a")
//     link.href = url
//     link.download = finalFileName

//     document.body.appendChild(link)
//     link.click()
//     document.body.removeChild(link)

//     URL.revokeObjectURL(url)
//   } catch (error) {
//     console.error("Download markdown failed:", error)
//   }
// }