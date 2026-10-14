import { Background } from "@/components/background/Background";
import { ShapeScope } from "@/components/background/ShapeScope";
import { RENDER_STILL_TIME } from "../still";

/** Background only — screenshot becomes public/fallback/bg-<theme>.webp. */
export default function RenderBackground() {
  return (
    <>
      <ShapeScope shape="home" />
      <Background stillTime={RENDER_STILL_TIME} />
    </>
  );
}
