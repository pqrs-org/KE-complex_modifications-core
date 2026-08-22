import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import jsonLanguage from "react-syntax-highlighter/dist/esm/languages/hljs/json";
import javascriptLanguage from "react-syntax-highlighter/dist/esm/languages/hljs/javascript";
import githubStyle from "react-syntax-highlighter/dist/esm/styles/hljs/github";

SyntaxHighlighter.registerLanguage("json", jsonLanguage);
SyntaxHighlighter.registerLanguage("javascript", javascriptLanguage);

const CodeSyntaxHighlighter = ({
  children,
  language = "json",
}: {
  children: string;
  language?: "json" | "javascript";
}) => (
  <SyntaxHighlighter
    language={language}
    style={githubStyle}
    customStyle={{
      minHeight: "100px",
      maxHeight: "calc(90vh - 40px)",
      overflow: "auto",
    }}
  >
    {children}
  </SyntaxHighlighter>
);

export default CodeSyntaxHighlighter;
