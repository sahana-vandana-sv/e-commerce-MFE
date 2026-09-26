import { version } from 'react';
import { Button, Card, tokens } from '@mfe/ui';

const products = [
  { id: 1, name: 'Wireless Headphones', price: 89.99 },
  { id: 2, name: 'Mechanical Keyboard', price: 129.0 },
  { id: 3, name: 'USB-C Hub', price: 39.5 },
];

export default function ProductList() {
  return (
    <section style={{ border: `2px dashed ${tokens.color.primary}`, padding: tokens.space.md, borderRadius: tokens.radius.md }}>
      <h2 style={{ marginTop: 0 }}>Products</h2>
      <div style={{ display: 'grid', gap: tokens.space.sm }}>
        {products.map((p) => (
          <Card key={p.id} title={p.name}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>${p.price.toFixed(2)}</span>
              {/* Does nothing yet: the cart remote and event bus arrive on Day 5. */}
              <Button>Add to cart</Button>
            </div>
          </Card>
        ))}
      </div>
      <small style={{ color: tokens.color.muted }}>Rendered by product-listing remote · React {version}</small>
    </section>
  );
}
