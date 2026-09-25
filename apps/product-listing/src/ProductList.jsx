import { version } from 'react';

const products = [
  { id: 1, name: 'Wireless Headphones', price: 89.99 },
  { id: 2, name: 'Mechanical Keyboard', price: 129.0 },
  { id: 3, name: 'USB-C Hub', price: 39.5 },
];

export default function ProductList() {
  return (
    <section style={{ border: '2px dashed #4f46e5', padding: 16, borderRadius: 8 }}>
      <h2 style={{ marginTop: 0 }}>Products</h2>
      <ul>
        {products.map((p) => (
          <li key={p.id}>
            {p.name} — ${p.price.toFixed(2)}
          </li>
        ))}
      </ul>
      <small>Rendered by product-listing remote · React {version}</small>
    </section>
  );
}
