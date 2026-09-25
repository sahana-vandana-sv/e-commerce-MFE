import { Component, Suspense, lazy, version } from 'react';

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
      return <p style={{ color: '#b91c1c' }}>Product listing is unavailable right now.</p>;
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 640, margin: '0 auto', padding: 24 }}>
      <h1>Mini E-commerce Shell</h1>
      <p>Host app · React {version}</p>
      <RemoteBoundary>
        <Suspense fallback={<p>Loading products…</p>}>
          <ProductList />
        </Suspense>
      </RemoteBoundary>
    </main>
  );
}
