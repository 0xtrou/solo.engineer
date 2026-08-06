import { ImageResponse } from "next/og";

export const alt = "Signal — AI Infrastructure Intelligence";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#071014",
          color: "#edf6f5",
          display: "flex",
          height: "100%",
          padding: "72px",
          position: "relative",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", maxWidth: "880px" }}>
          <div style={{ alignItems: "center", color: "#8da6a2", display: "flex", fontSize: 24, fontWeight: 700, letterSpacing: 4 }}>
            <div style={{ display: "flex", gap: 5, height: 28, marginRight: 16, width: 28 }}>
              <div style={{ alignSelf: "flex-end", background: "#64ddef", height: 13, width: 6 }} />
              <div style={{ alignSelf: "flex-end", background: "#64ddef", height: 26, width: 6 }} />
              <div style={{ alignSelf: "flex-end", background: "#b2e46c", height: 18, width: 6 }} />
            </div>
            AI INFRASTRUCTURE INTELLIGENCE
          </div>
          <div style={{ fontFamily: "serif", fontSize: 84, fontWeight: 700, letterSpacing: -4, lineHeight: 1.05, marginTop: 34 }}>
            Infrastructure in motion.
          </div>
          <div style={{ color: "#8da6a2", fontSize: 31, lineHeight: 1.35, marginTop: 26 }}>
            Power, policy, hardware, land, labor, and capital signals across US, Vietnam, and China.
          </div>
        </div>
        <div style={{ bottom: 70, color: "#64ddef", display: "flex", fontSize: 24, fontWeight: 700, position: "absolute", right: 72 }}>
          signal
        </div>
      </div>
    ),
    size,
  );
}
