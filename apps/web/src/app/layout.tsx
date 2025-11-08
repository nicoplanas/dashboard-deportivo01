import './globals.css';

export const metadata = {
  title: 'Dashboard Deportivo',
  description: 'Panel deportivo con estilo oscuro',
}

export default function RootLayout({ children, }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container">{children}</div>
      </body>
    </html>
  )
}
