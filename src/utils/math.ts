import katex from 'katex'

export function renderMath(text: string): string {
  let result = text

  // display math $$...$$
  result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) =>
    katex.renderToString(math.trim(), { displayMode: true, throwOnError: false })
  )

  // inline math $...$
  result = result.replace(/\$([^$\n]+?)\$/g, (_, math) =>
    katex.renderToString(math.trim(), { throwOnError: false })
  )

  // Bold **...**
  result = result.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')

  // Inline code `...`
  result = result.replace(/`([^`]+?)`/g, '<code>$1</code>')

  // literal \n (user-typed) and actual newline characters → <br>
  result = result.replace(/\\n|\n/g, '<br>')

  return result
}
