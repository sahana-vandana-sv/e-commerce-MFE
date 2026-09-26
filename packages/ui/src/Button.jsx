import { tokens } from './tokens';

export function Button({ style, ...props }) {
  return (
    <button
      type="button"
      style={{
        background: tokens.color.primary,
        color: tokens.color.onPrimary,
        border: 'none',
        borderRadius: tokens.radius.md,
        padding: `${tokens.space.xs}px ${tokens.space.md}px`,
        font: 'inherit',
        cursor: 'pointer',
        ...style,
      }}
      {...props}
    />
  );
}
