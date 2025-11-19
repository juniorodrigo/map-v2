# Ejemplo de uso del SessionContext con UserInfo

## Cómo acceder a los datos del usuario en tus componentes

```tsx
'use client';

import { useSession } from '@/contexts/SessionContext';

export function MyComponent() {
	const { session, isLoading, error } = useSession();

	if (isLoading) {
		return <div>Cargando sesión...</div>;
	}

	if (!session.isAuthenticated) {
		return <div>No autenticado</div>;
	}

	// Acceder a los datos del usuario
	const { userInfo } = session;

	return (
		<div>
			<h2>Información del Usuario</h2>

			{/* Datos básicos */}
			<p>ID: {userInfo?._id}</p>
			<p>Lead ID: {userInfo?.lead_id}</p>
			<p>Teléfono: {userInfo?.phone_number}</p>
			<p>Es agente: {userInfo?.is_agent ? 'Sí' : 'No'}</p>

			{/* Datos del propietario */}
			{userInfo?.owner_phone_number && (
				<div>
					<h3>Propietario</h3>
					<p>Teléfono: {userInfo.owner_phone_number}</p>
					<p>Firebase ID: {userInfo.owner_firebase_id}</p>
				</div>
			)}

			{/* Información de requerimientos */}
			{userInfo?.requirement_info && (
				<div>
					<h3>Requerimientos</h3>
					<p>Moneda: {userInfo.requirement_info.currency}</p>
					<p>Operaciones: {userInfo.requirement_info.operation.join(', ')}</p>
					<p>Tipos de propiedad: {userInfo.requirement_info.property_type.join(', ')}</p>
					{userInfo.requirement_info.location_geometry && <p>Geometría de ubicación disponible</p>}
				</div>
			)}
		</div>
	);
}
```

## Estructura de UserInfo disponible en la sesión

```typescript
interface UserInfo {
	_id: string;
	lead_id: string;
	phone_number: string;
	owner_phone_number: string;
	owner_firebase_id: string;
	is_agent: boolean;
	requirement_info: {
		currency: string;
		operation: Array<string>;
		property_type: Array<string>;
		location_geometry: any;
	} | null;
}
```

## Persistencia

Los datos se guardan automáticamente en:

- `localStorage.session_token` - El token de sesión
- `localStorage.user_info` - Toda la información del usuario en formato JSON

Al recargar la página, los datos se restauran automáticamente desde localStorage.

## Limpiar sesión

```tsx
const { clearSession } = useSession();

// Llamar cuando el usuario cierre sesión
clearSession();
```

Esto limpiará tanto el estado en memoria como localStorage.
