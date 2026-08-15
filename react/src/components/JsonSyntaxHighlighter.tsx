import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import jsonLanguage from "react-syntax-highlighter/dist/esm/languages/hljs/json";
import githubStyle from "react-syntax-highlighter/dist/esm/styles/hljs/github";

SyntaxHighlighter.registerLanguage("json", jsonLanguage);

const JsonSyntaxHighlighter = ({ children }: { children: string }) => (
  <SyntaxHighlighter
    language="json"
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

export default JsonSyntaxHighlighter;
