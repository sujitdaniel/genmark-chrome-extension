
import { createRoot } from 'react-dom/client';

function Popup() {
  return (
    <div style={{ width: '300px', padding: '16px' }}>
      <h2>LinkedIn Social Assistant</h2>
      <p>Extension is active and working!</p>
    </div>
  );
}

const root = createRoot(document.getElementById('popup-root')!);
root.render(<Popup />);
