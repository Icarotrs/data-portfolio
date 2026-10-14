import { Background } from "@/components/background/Background";
import { RENDER_STILL_TIME } from "../still";

/** Background only — screenshot becomes public/fallback/bg-<theme>.webp. */
export default function RenderBackground() {
  return (
    <>
      <Background stillTime={RENDER_STILL_TIME} />
    </>
  );
}
