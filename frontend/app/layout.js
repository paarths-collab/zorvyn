import "./globals.css";

export const metadata = {
  title: "backend",
  description: "Role based finance dashboard"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
