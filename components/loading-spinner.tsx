import Image from 'next/image'

interface LoadingSpinnerProps {
  title?: string
  message?: string
}

export function LoadingSpinner({ title, message }: LoadingSpinnerProps) {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50 p-4">
      <div className="text-center">
        {/* Logo animado */}
        <div className="w-24 h-24 mx-auto mb-6 bg-white flex items-center justify-center rounded-lg overflow-hidden">
          <Image src="/logo-gif.gif" alt="Logo" width={120} height={120} />
        </div>
        
        {/* Título */}
        {title && (
          <h2 className="text-xl font-semibold text-white mb-2">
            {title}
          </h2>
        )}
        
        {/* Mensaje */}
        {message && (
          <p className="text-gray-400">
            {message}
          </p>
        )}
      </div>
    </div>
  )
}

