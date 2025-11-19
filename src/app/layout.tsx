import type { Metadata } from 'next';
import './ui/globals.css';
import { geistSans, geistMono } from './ui/fonts';
import { QueryProvider } from '@/providers/QueryProvider';
import { DatabaseProvider } from '@/contexts/DatabaseContext';
import { SessionProvider } from '@/contexts/SessionProvider';
import { Suspense } from 'react';

export const metadata: Metadata = {
	title: 'Busca propiedades | Ungga Map',
	description: 'Encuentra tu propiedad ideal con Ungga Map',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="es" className={`${geistSans.variable} ${geistMono.variable}`}>
			<body className="antialiased" suppressHydrationWarning={true}>
				<Suspense fallback={null}>
					<SessionProvider>
						<DatabaseProvider>
							<QueryProvider>{children}</QueryProvider>
						</DatabaseProvider>
					</SessionProvider>
				</Suspense>
			</body>
		</html>
	);
}
