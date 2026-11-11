"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Renders assistant answers. Raw HTML is not allowed (react-markdown default). */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Open links in a new tab safely; wrap tables so they scroll on small screens.
          a: (props) => (
            <a {...props} target="_blank" rel="noopener noreferrer" />
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
