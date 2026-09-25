import { createRoot } from 'react-dom/client';
import ProductList from './ProductList';

// Standalone mode: lets the product-listing team develop and test without the shell.
createRoot(document.getElementById('root')).render(<ProductList />);
