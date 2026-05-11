export const metadata = {
  title: 'Kart Fiesta — 3D Racing',
};

export default function KartPage() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0a0518' }}>
      <iframe
        src="/mario-kart.html"
        style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
        allow="autoplay; gamepad; fullscreen"
      />
    </div>
  );
}
