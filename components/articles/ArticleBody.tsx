/** Renders essay body as paragraph blocks from plain text / light markdown. */
export function ArticleBody({ content }: { content: string }) {
  const blocks = content
    .trim()
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <div className="space-y-5">
      {blocks.map((block, index) => {
        if (block.startsWith("## ")) {
          return (
            <h2
              key={index}
              className="font-heading pt-4 text-2xl font-semibold text-parchment"
            >
              {block.slice(3)}
            </h2>
          );
        }
        if (block.startsWith("# ")) {
          return (
            <h2
              key={index}
              className="font-heading pt-4 text-2xl font-semibold text-parchment"
            >
              {block.slice(2)}
            </h2>
          );
        }
        return (
          <p
            key={index}
            className="text-lg leading-relaxed whitespace-pre-line text-body-text/95"
          >
            {block}
          </p>
        );
      })}
    </div>
  );
}
