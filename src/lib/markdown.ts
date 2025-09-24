import { remark } from "remark";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import type { Root, Element } from "hast";
import DOMPurify from "isomorphic-dompurify";

export async function renderMarkdownToHtml(markdown: string): Promise<string> {
    const processed = await remark()
        .use(remarkRehype)
        .use(() => (tree: Root) => {
            visit(tree, "element", (node: Element) => {
                const element = node as Element & { properties?: Record<string, unknown> };
                if (element.tagName === "a") {
                    element.properties = element.properties || {};
                    (element.properties as Record<string, unknown>).target = "_blank";
                    (element.properties as Record<string, unknown>).rel = "noopener noreferrer";
                }
            });
        })
        .use(rehypeStringify)
        .process(markdown);
    
    const htmlString = String(processed);
    return DOMPurify.sanitize(htmlString, { ADD_ATTR: ["target", "rel"] });
}