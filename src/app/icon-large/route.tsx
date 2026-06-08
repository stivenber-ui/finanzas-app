import { ImageResponse } from "next/og";

export const runtime = "edge";

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          color: "#ededed",
          fontSize: 300,
          fontWeight: 700,
          fontFamily: "sans-serif",
          borderRadius: 110,
        }}
      >
        $
      </div>
    ),
    { width: 512, height: 512 },
  );
}
