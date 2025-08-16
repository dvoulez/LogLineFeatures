export const layoutSystem = {
  // Responsive breakpoints
  breakpoints: {
    xs: "475px",
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
    "3xl": "1600px",
    "4xl": "1920px",
  },

  // Container sizes
  containers: {
    xs: "max-w-xs", // 320px
    sm: "max-w-sm", // 384px
    md: "max-w-md", // 448px
    lg: "max-w-lg", // 512px
    xl: "max-w-xl", // 576px
    "2xl": "max-w-2xl", // 672px
    "3xl": "max-w-3xl", // 768px
    "4xl": "max-w-4xl", // 896px
    "5xl": "max-w-5xl", // 1024px
    "6xl": "max-w-6xl", // 1152px
    "7xl": "max-w-7xl", // 1280px
    full: "max-w-full",
    screen: "max-w-screen-2xl",
  },

  // Grid system
  grid: {
    cols: {
      1: "grid-cols-1",
      2: "grid-cols-2",
      3: "grid-cols-3",
      4: "grid-cols-4",
      5: "grid-cols-5",
      6: "grid-cols-6",
      12: "grid-cols-12",
    },
    gaps: {
      xs: "gap-1",
      sm: "gap-2",
      md: "gap-4",
      lg: "gap-6",
      xl: "gap-8",
      "2xl": "gap-12",
    },
  },

  // Flexbox utilities
  flex: {
    direction: {
      row: "flex-row",
      "row-reverse": "flex-row-reverse",
      col: "flex-col",
      "col-reverse": "flex-col-reverse",
    },
    wrap: {
      wrap: "flex-wrap",
      nowrap: "flex-nowrap",
      "wrap-reverse": "flex-wrap-reverse",
    },
    justify: {
      start: "justify-start",
      end: "justify-end",
      center: "justify-center",
      between: "justify-between",
      around: "justify-around",
      evenly: "justify-evenly",
    },
    align: {
      start: "items-start",
      end: "items-end",
      center: "items-center",
      baseline: "items-baseline",
      stretch: "items-stretch",
    },
  },

  // Spacing scale
  spacing: {
    none: "0",
    xs: "var(--space-1)", // 4px
    sm: "var(--space-2)", // 8px
    md: "var(--space-4)", // 16px
    lg: "var(--space-6)", // 24px
    xl: "var(--space-8)", // 32px
    "2xl": "var(--space-12)", // 48px
    "3xl": "var(--space-16)", // 64px
    "4xl": "var(--space-20)", // 80px
    "5xl": "var(--space-24)", // 96px
  },

  // Layout patterns
  patterns: {
    sidebar: {
      left: "grid grid-cols-[250px_1fr] gap-6",
      right: "grid grid-cols-[1fr_250px] gap-6",
      both: "grid grid-cols-[200px_1fr_200px] gap-6",
    },
    header: {
      simple: "flex items-center justify-between py-4",
      complex: "grid grid-cols-[1fr_auto_1fr] items-center py-4",
    },
    card: {
      simple: "bg-card rounded-lg border p-6",
      elevated: "bg-card rounded-lg border shadow-design-md p-6",
      interactive: "bg-card rounded-lg border shadow-design-sm hover:shadow-design-md transition-shadow p-6",
    },
  },
} as const

// Utility functions for responsive design
export const responsive = {
  // Generate responsive classes
  classes: (base: string, variants: Record<string, string>) => {
    return Object.entries(variants)
      .map(([breakpoint, value]) => (breakpoint === "base" ? base : `${breakpoint}:${value}`))
      .join(" ")
  },

  // Common responsive patterns
  text: {
    xs: "text-xs sm:text-sm",
    sm: "text-sm sm:text-base",
    base: "text-base sm:text-lg",
    lg: "text-lg sm:text-xl",
    xl: "text-xl sm:text-2xl",
    "2xl": "text-2xl sm:text-3xl",
    "3xl": "text-3xl sm:text-4xl",
  },

  padding: {
    sm: "p-4 sm:p-6",
    md: "p-6 sm:p-8",
    lg: "p-8 sm:p-12",
  },

  margin: {
    sm: "m-4 sm:m-6",
    md: "m-6 sm:m-8",
    lg: "m-8 sm:m-12",
  },
} as const

export type LayoutSystem = typeof layoutSystem
export type ResponsiveUtilities = typeof responsive
