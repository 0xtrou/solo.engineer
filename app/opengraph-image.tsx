import { ImageResponse } from "next/og";

export const alt = "Signal — Personal Web Reader";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#f7f8f5",
          color: "#202426",
          display: "flex",
          height: "100%",
          padding: "72px",
          position: "relative",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", maxWidth: "880px" }}>
          <div style={{ alignItems: "center", color: "#68716c", display: "flex", fontSize: 24, fontWeight: 700, letterSpacing: 4 }}>
            <div style={{ display: "flex", height: 28, marginRight: 16, position: "relative", transform: "rotate(-12deg)", width: 28 }}>
              <div style={{ background: "#e8bd4d", borderRadius: "999px", bottom: 0, height: 13, left: 0, position: "absolute", width: 13 }} />
              <div style={{ background: "#f27252", borderRadius: "999px", bottom: 0, height: 13, position: "absolute", right: 0, width: 13 }} />
              <div style={{ background: "#263e52", borderRadius: "999px", height: 13, left: 8, position: "absolute", top: 0, width: 13 }} />
            </div>
            PERSONAL WEB READER
          </div>
          <div style={{ fontFamily: "serif", fontSize: 84, fontWeight: 700, letterSpacing: -4, lineHeight: 1.05, marginTop: 34 }}>
            Worth your attention.
          </div>
          <div style={{ color: "#68716c", fontSize: 31, lineHeight: 1.35, marginTop: 26 }}>
            AI research, science, SOTA technology, business growth, and policy signals — one calm feed.
          </div>
        </div>
        <div style={{ bottom: 70, color: "#d76346", display: "flex", fontSize: 24, fontWeight: 700, position: "absolute", right: 72 }}>
          signal
        </div>
      </div>
    ),
    size,
  );
}
