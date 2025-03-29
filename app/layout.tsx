import { inter } from '@/ui/graphics/font/inter';
import '@/ui/graphics/style/global.css';

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={`${inter.className} antialiased bg-gray-50 dark:bg-gray-900`}>
                <div className="min-h-screen">
                    {children}
                </div>
            </body>
        </html>
    );
}
