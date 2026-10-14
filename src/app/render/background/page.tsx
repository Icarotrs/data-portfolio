import { Background } from "@/components/background/Background";
import { ThemeScope } from "@/components/background/ThemeScope";
import { RENDER_STILL_TIME } from "../still";

/** Background only — screenshot becomes public/fallback/bg-<theme>.webp. */
export default function RenderBackground() {
  return (
    <>
      <ThemeScope theme="intro" />
      <Background stillTime={RENDER_STILL_TIME} />
    </>
  );
}
