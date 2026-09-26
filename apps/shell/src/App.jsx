import { Component, Suspense, lazy, version } from 'react';
import { Card, tokens } from '@mfe/ui';

// 'productListing/ProductList' is not on disk: webpack resolves it at runtime
// by loading the remote's remoteEntry.js and asking it for './ProductList'.
const ProductList = lazy(() => import('productListing/ProductList'));

// If the remote is down or its code throws, only this slot fails, not the whole shell.
class RemoteBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return <Card style={{ color: tokens.color.danger }}>Product listing is unavailable right now.</Card>;
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <main style={{ fontFamily: tokens.font.family, color: tokens.color.text, maxWidth: 640, margin: '0 auto', padding: tokens.space.lg }}>
      <h1>Mini E-commerce Shell</h1>
      <p style={{ color: tokens.color.muted }}>Host app · React {version}</p>
      <RemoteBoundary>
        <Suspense fallback={<p>Loading products…</p>}>
          <ProductList />
        </Suspense>
      </RemoteBoundary>
    </main>
  );
}
