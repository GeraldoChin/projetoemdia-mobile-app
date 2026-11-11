/* Configuração Tailwind partilhada por todos os ecrãs (extraída do Stitch).
   Serve de referência dos tokens de design: cores, espaçamento, raios e tipografia. */
tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "on-surface": "#191c1e", "on-background": "#191c1e", "surface-container": "#edeef0",
        "on-secondary-fixed": "#001d35", "secondary-fixed": "#d1e4ff", "on-tertiary-container": "#8b939a",
        "primary-container": "#102b4e", "tertiary-container": "#242c32", "surface-bright": "#f8f9fb",
        "inverse-surface": "#2e3132", "surface-variant": "#e1e2e4", "surface-container-low": "#f2f4f6",
        "background": "#f8f9fb", "error": "#ba1a1a", "secondary-container": "#a8cfff",
        "on-tertiary": "#ffffff", "on-surface-variant": "#44474e", "on-secondary": "#ffffff",
        "primary-fixed-dim": "#afc7f3", "tertiary-fixed": "#dbe3eb", "on-primary-fixed-variant": "#2f476c",
        "surface-tint": "#475f85", "surface-dim": "#d9dadc", "on-tertiary-fixed": "#151d22",
        "surface-container-highest": "#e1e2e4", "surface": "#f8f9fb", "tertiary": "#10181d",
        "on-primary-container": "#7b93bc", "secondary": "#38618b", "on-error": "#ffffff",
        "inverse-on-surface": "#f0f1f3", "tertiary-fixed-dim": "#bfc7cf", "surface-container-lowest": "#ffffff",
        "on-primary-fixed": "#001b3c", "outline-variant": "#c4c6cf", "on-secondary-fixed-variant": "#1d4972",
        "inverse-primary": "#afc7f3", "secondary-fixed-dim": "#a2cafa", "on-tertiary-fixed-variant": "#40484e",
        "outline": "#74777f", "on-secondary-container": "#2f5982", "on-primary": "#ffffff",
        "surface-container-high": "#e7e8ea", "primary": "#001633", "primary-fixed": "#d5e3ff",
        "error-container": "#ffdad6", "on-error-container": "#93000a"
      },
      borderRadius: { "DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "full": "9999px" },
      spacing: {
        "space-lg": "1.5rem", "space-xs": "0.25rem", "space-md": "1rem", "space-xl": "2rem",
        "gutter": "1rem", "margin": "1.25rem", "space-sm": "0.5rem"
      },
      fontFamily: {
        "headline-lg": ["Inter"], "headline-sm": ["Inter"], "headline-md": ["Inter"], "body-lg": ["Inter"],
        "body-md": ["Inter"], "label-lg": ["Inter"], "display-sm": ["Inter"], "body-sm": ["Inter"],
        "display-lg": ["Inter"], "label-sm": ["Inter"], "label-md": ["Inter"]
      },
      fontSize: {
        "headline-lg": ["20px", { lineHeight: "28px", letterSpacing: "-0.01em", fontWeight: "600" }],
        "headline-sm": ["16px", { lineHeight: "22px", fontWeight: "600" }],
        "headline-md": ["18px", { lineHeight: "24px", letterSpacing: "-0.005em", fontWeight: "600" }],
        "body-lg": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "body-md": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "label-lg": ["13px", { lineHeight: "16px", letterSpacing: "0.01em", fontWeight: "600" }],
        "display-sm": ["24px", { lineHeight: "32px", letterSpacing: "-0.015em", fontWeight: "600" }],
        "body-sm": ["13px", { lineHeight: "18px", fontWeight: "400" }],
        "display-lg": ["32px", { lineHeight: "40px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "label-sm": ["10px", { lineHeight: "12px", letterSpacing: "0.04em", fontWeight: "500" }],
        "label-md": ["11px", { lineHeight: "14px", letterSpacing: "0.02em", fontWeight: "600" }]
      }
    }
  }
};
