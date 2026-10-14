import type { MDXComponents } from "mdx/types";

// Styling for MDX stories comes from the .prose-story wrapper in globals.css.
const components: MDXComponents = {};

export function useMDXComponents(): MDXComponents {
  return components;
}
