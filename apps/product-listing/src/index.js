// Async boundary: the dynamic import gives Module Federation a chance to
// negotiate shared modules (react, react-dom) before any of them are used.
import('./bootstrap');
