export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold" style={{ color: '#8F7BBD' }}>
            404
          </h1>
        </div>
        <h2 className="text-3xl font-semibold text-gray-800 mb-4">
          Página no encontrada
        </h2>
        <p className="text-gray-600 text-lg mb-8">
          Lo sentimos, la página que buscas no está disponible.
        </p>
        <div className="inline-block">
          <div 
            className="w-16 h-1 rounded-full mx-auto"
            style={{ backgroundColor: '#8F7BBD' }}
          />
        </div>
      </div>
    </div>
  )
}
