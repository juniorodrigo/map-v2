# Uso del SessionContext

## Descripción

El `SessionContext` proporciona un sistema de autenticación centralizado para toda la aplicación. Valida automáticamente tokens desde la URL o localStorage.

## Características

- ✅ Validación automática de tokens desde URL (`?token=xxx`)
- ✅ Persistencia en localStorage
- ✅ Estado global de sesión accesible desde cualquier componente
- ✅ Manejo de errores centralizado
- ✅ Provider global en `layout.tsx` - no necesitas agregarlo en cada página

## Uso en páginas que requieren autenticación

```tsx
'use client';

import { useSession } from '@/contexts/SessionContext';
import { notFound } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedPage() {
	const { session, isLoading } = useSession();

	// Redirigir a 404 si no está autenticado
	useEffect(() => {
		if (!isLoading && !session.isAuthenticated) {
			notFound();
		}
	}, [isLoading, session.isAuthenticated]);

	if (isLoading) {
		return <div>Validando sesión...</div>;
	}

	if (!session.isAuthenticated) {
		return null; // Evitar flash de contenido antes del redirect
	}

	return (
		<div>
			<h1>Bienvenido {session.userEmail}</h1>
			<p>User ID: {session.userId}</p>
		</div>
	);
}
```

## Uso en páginas públicas (sin autenticación requerida)

```tsx
'use client';

import { useSession } from '@/contexts/SessionContext';

export default function PublicPage() {
	const { session } = useSession();

	return (
		<div>{session.isAuthenticated ? <p>Sesión activa: {session.userEmail}</p> : <p>Usuario no autenticado</p>}</div>
	);
}
```

## Propiedades del hook `useSession()`

```typescript
const {
	session, // Datos de la sesión
	isLoading, // true mientras valida el token
	error, // Mensaje de error si falla la validación
	validateToken, // Función para validar un token manualmente
	clearSession, // Función para cerrar sesión
} = useSession();
```

## Propiedades de `session`

```typescript
{
	token: string | null,
	userId?: string,
	userEmail?: string,
	isAuthenticated: boolean,
}
```

## Cerrar sesión

```tsx
const { clearSession } = useSession()

<button onClick={clearSession}>Cerrar sesión</button>
```

## Validar token manualmente

```tsx
const { validateToken } = useSession();

const handleLogin = async (token: string) => {
	const isValid = await validateToken(token);
	if (isValid) {
		console.log('Login exitoso');
	} else {
		console.log('Token inválido');
	}
};
```

## Flujo de autenticación

1. Usuario accede a `/gu?token=abc123`
2. `SessionProvider` (del layout global) detecta el token en la URL
3. Valida el token llamando a `/api/mongo/process-token`
4. Si el token es válido → actualiza el estado y guarda en localStorage
5. En próximas visitas, restaura la sesión desde localStorage
6. La página verifica con `useEffect` si necesita autenticación y lanza 404 si no está autenticado

## Notas importantes

- ✅ El `SessionProvider` ya está en el layout global - **no lo agregues en páginas individuales**
- ✅ Usa `useSession()` directamente en cualquier componente
- ⚠️ **No uses** `searchParams.get('token')` manualmente en las páginas
- ⚠️ Para páginas protegidas, usa el patrón de `useEffect` + `notFound()` mostrado arriba
