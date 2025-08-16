# Design System Documentation

## Overview

This design system provides a comprehensive set of design tokens, components, and guidelines to ensure consistency and maintainability across the application. Built on top of Tailwind CSS with custom design tokens and React components.

## Design Principles

### 1. Consistency
- Use design tokens for all spacing, colors, and typography
- Maintain consistent patterns across components
- Follow established naming conventions

### 2. Accessibility
- Maintain WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text)
- Support keyboard navigation
- Provide proper ARIA labels and roles

### 3. Scalability
- Use semantic color names instead of specific values
- Build components with variants and responsive behavior
- Create reusable patterns and utilities

### 4. Performance
- Optimize for bundle size with tree-shaking
- Use CSS custom properties for theme switching
- Minimize layout shifts with consistent sizing

## Color System

### Brand Colors
\`\`\`css
--brand-primary: 221.2 83.2% 53.3%    /* Primary blue */
--brand-secondary: 168 76% 42%        /* Teal accent */
--brand-tertiary: 262 83% 58%         /* Purple accent */
\`\`\`

### Semantic Colors
\`\`\`css
--success: 142 76% 36%                /* Green for success states */
--warning: 48 96% 53%                 /* Amber for warnings */
--info: 199 89% 48%                   /* Blue for information */
--destructive: 0 84.2% 60.2%          /* Red for errors */
\`\`\`

### Usage Guidelines

**Do:**
- Use `text-brand-primary` for primary actions and links
- Use semantic colors (`text-green-600`) for status indicators
- Use `text-muted-foreground` for secondary text
- Test color combinations in both light and dark modes

**Don't:**
- Use hardcoded color values like `text-blue-500`
- Mix warm and cool accent colors in the same interface
- Use more than 3-4 colors in a single component

### Examples
\`\`\`tsx
// Good
<Button variant="brand">Primary Action</Button>
<StatusBadge variant="success">Completed</StatusBadge>
<Typography color="muted">Secondary text</Typography>

// Avoid
<Button className="bg-blue-500">Action</Button>
<div className="text-red-400">Error message</div>
\`\`\`

## Typography System

### Font Hierarchy
- **Display**: Large headings and hero text (display-2xl to display-sm)
- **Heading**: Section headings (heading-xl to heading-xs)
- **Body**: Paragraph text (body-xl to body-xs)
- **Label**: Form labels and UI text (label-lg to label-sm)
- **Caption**: Small descriptive text (caption-lg to caption-sm)

### Usage Guidelines

**Do:**
- Use semantic heading components (H1, H2, H3, etc.)
- Maintain consistent line heights with the typography scale
- Use `font-medium` or `font-semibold` for emphasis

**Don't:**
- Skip heading levels (H1 → H3)
- Use display text for body content
- Mix different font families in the same interface

### Examples
\`\`\`tsx
// Good
<H1>Page Title</H1>
<H2>Section Heading</H2>
<Typography variant="body-md">Paragraph text</Typography>
<Typography variant="caption-md" color="muted">Helper text</Typography>

// Avoid
<div className="text-4xl font-bold">Title</div>
<p className="text-xs text-gray-400">Helper text</p>
\`\`\`

## Component Library

### Button Variants
- `default`: Primary actions
- `brand`: Brand-specific actions
- `secondary`: Secondary actions
- `outline`: Subtle actions
- `ghost`: Minimal actions
- `destructive`: Dangerous actions

### Surface Components
- `Surface`: Container with consistent styling
- `Card`: Content cards with elevation
- `StatusBadge`: Status indicators with semantic colors

### Layout Components
- `Stack`: Vertical layouts with consistent spacing
- `Inline`: Horizontal layouts with alignment options
- `Container`: Responsive containers with max-widths
- `Grid`: CSS Grid layouts with responsive behavior

### Usage Examples
\`\`\`tsx
// Layout composition
<Container size="lg">
  <Stack spacing="lg">
    <H1>Page Title</H1>
    <Grid cols={3} gap="md" responsive={{ sm: 1, md: 2, lg: 3 }}>
      <Surface variant="elevated" padding="lg">
        <H3>Card Title</H3>
        <Typography variant="body-md">Card content</Typography>
      </Surface>
    </Grid>
  </Stack>
</Container>

// Form composition
<Stack spacing="md">
  <Label>Email Address</Label>
  <Input type="email" placeholder="Enter your email" />
  <Inline spacing="sm" justify="between">
    <Button variant="outline">Cancel</Button>
    <Button variant="brand">Submit</Button>
  </Inline>
</Stack>
\`\`\`

## Spacing System

### Spacing Scale
- `xs`: 4px - Tight spacing within components
- `sm`: 8px - Small gaps between related elements
- `md`: 16px - Standard spacing between components
- `lg`: 24px - Large spacing between sections
- `xl`: 32px - Extra large spacing for major sections
- `2xl`: 48px - Section dividers
- `3xl`: 64px - Page-level spacing

### Layout Patterns

#### Sidebar Layout
\`\`\`tsx
<div className="grid grid-cols-[250px_1fr] gap-6">
  <aside>Sidebar content</aside>
  <main>Main content</main>
</div>
\`\`\`

#### Card Grid
\`\`\`tsx
<Grid cols={3} gap="lg" responsive={{ sm: 1, md: 2, lg: 3 }}>
  {items.map(item => (
    <Surface key={item.id} variant="elevated">
      {/* Card content */}
    </Surface>
  ))}
</Grid>
\`\`\`

#### Form Layout
\`\`\`tsx
<Stack spacing="lg">
  <Stack spacing="md">
    <Label>Field Label</Label>
    <Input />
  </Stack>
  <Inline spacing="sm" justify="end">
    <Button variant="outline">Cancel</Button>
    <Button variant="brand">Submit</Button>
  </Inline>
</Stack>
\`\`\`

## Responsive Design

### Breakpoints
- `xs`: 475px - Small phones
- `sm`: 640px - Large phones
- `md`: 768px - Tablets
- `lg`: 1024px - Small laptops
- `xl`: 1280px - Large laptops
- `2xl`: 1536px - Desktops

### Responsive Patterns
\`\`\`tsx
// Responsive grid
<Grid 
  cols={1} 
  responsive={{ sm: 2, lg: 3, xl: 4 }}
  gap="md"
>

// Responsive typography
<Typography 
  variant="display-lg" 
  className="text-2xl sm:text-3xl lg:text-4xl"
>

// Responsive spacing
<div className="p-4 sm:p-6 lg:p-8">
\`\`\`

## Animation Guidelines

### Duration Scale
- `fast`: 150ms - Micro-interactions (hover, focus)
- `normal`: 300ms - Standard transitions (modal open/close)
- `slow`: 500ms - Complex animations (page transitions)

### Animation Patterns
\`\`\`tsx
// Hover effects
<Button className="transition-colors duration-fast hover:bg-primary/90">

// Modal animations
<Dialog className="animate-scale-in">

// Loading states
<LoadingSpinner size="md" />
<LoadingDots size="sm" />
\`\`\`

## Best Practices

### Component Composition
\`\`\`tsx
// Good: Composable and flexible
<Surface variant="elevated" padding="lg">
  <Stack spacing="md">
    <H3>Card Title</H3>
    <Typography variant="body-md">Content</Typography>
    <Inline spacing="sm" justify="end">
      <Button variant="outline">Cancel</Button>
      <Button variant="brand">Confirm</Button>
    </Inline>
  </Stack>
</Surface>

// Avoid: Rigid and hard to customize
<CustomCard 
  title="Card Title"
  content="Content"
  primaryAction="Confirm"
  secondaryAction="Cancel"
/>
\`\`\`

### Accessibility
\`\`\`tsx
// Good: Semantic and accessible
<Button 
  variant="destructive"
  aria-label="Delete item"
  onClick={handleDelete}
>
  <TrashIcon />
  Delete
</Button>

// Avoid: Poor accessibility
<div 
  className="bg-red-500 text-white p-2 cursor-pointer"
  onClick={handleDelete}
>
  Delete
</div>
\`\`\`

### Performance
\`\`\`tsx
// Good: Efficient re-renders
const MemoizedCard = memo(({ item }) => (
  <Surface variant="elevated">
    <Typography>{item.title}</Typography>
  </Surface>
))

// Good: Conditional loading
{isLoading ? (
  <LoadingSkeleton lines={3} avatar />
) : (
  <ContentComponent data={data} />
)}
\`\`\`

## Dark Mode Support

All components automatically support dark mode through CSS custom properties. The system switches between light and dark variants based on the `dark` class on the HTML element.

\`\`\`tsx
// Automatic dark mode support
<Surface variant="elevated">  {/* Adapts to theme */}
<Typography color="muted">   {/* Proper contrast in both modes */}
<Button variant="brand">     {/* Consistent branding */}
\`\`\`

## Migration Guide

### From Custom CSS
\`\`\`css
/* Before */
.custom-button {
  background: #3b82f6;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
}

/* After */
<Button variant="brand" size="default">
\`\`\`

### From Inline Styles
\`\`\`tsx
// Before
<div style={{ 
  display: 'flex', 
  gap: '16px', 
  flexDirection: 'column' 
}}>

// After
<Stack spacing="md">
\`\`\`

## Contributing

When adding new components or patterns:

1. Follow existing naming conventions
2. Use design tokens for all values
3. Support both light and dark modes
4. Include proper TypeScript types
5. Add documentation and examples
6. Test accessibility with screen readers
7. Ensure responsive behavior

## Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Radix UI Components](https://www.radix-ui.com/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Design Tokens Specification](https://design-tokens.github.io/community-group/format/)
