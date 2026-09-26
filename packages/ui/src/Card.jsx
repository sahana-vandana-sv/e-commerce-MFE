import { tokens } from './tokens';

export function Card({ title, children, style }) {
  return (
    <div
      style={{
        border: `1px solid ${tokens.color.border}`,
        borderRadius: tokens.radius.md,
        padding: tokens.space.md,
        background: tokens.color.surface,
        ...style,
      }}
    >
      {title && <h3 style={{ margin: `0 0 ${tokens.space.sm}px` }}>{title}</h3>}
      {children}
    </div>
  );
}
