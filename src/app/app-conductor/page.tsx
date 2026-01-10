"use client";
import Image from "next/image";
import Link from "next/link";
import { FiMapPin, FiNavigation, FiPackage, FiCheckCircle, FiSmartphone, FiClock, FiDollarSign } from "react-icons/fi";

export default function AppConductorPage() {
  const features = [
    {
      icon: <FiMapPin className="w-8 h-8" />,
      title: "Navegación Inteligente",
      description: "Sistema de GPS integrado con rutas optimizadas para realizar entregas de manera eficiente."
    },
    {
      icon: <FiPackage className="w-8 h-8" />,
      title: "Gestión de Pedidos",
      description: "Visualiza y gestiona todos tus pedidos asignados en tiempo real con actualizaciones instantáneas."
    },
    {
      icon: <FiNavigation className="w-8 h-8" />,
      title: "Seguimiento en Vivo",
      description: "Los clientes pueden seguir tu ubicación en tiempo real mientras realizas las entregas."
    },
    {
      icon: <FiCheckCircle className="w-8 h-8" />,
      title: "Confirmación de Entrega",
      description: "Confirma entregas con fotos y firma digital directamente desde tu dispositivo móvil."
    },
    {
      icon: <FiClock className="w-8 h-8" />,
      title: "Historial Completo",
      description: "Accede a tu historial de entregas, estadísticas y registros de todas tus rutas completadas."
    },
    {
      icon: <FiDollarSign className="w-8 h-8" />,
      title: "Gestión de Pagos",
      description: "Registra pagos en efectivo y consulta tus comisiones y pagos pendientes."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-purple-100">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Link href="/login" className="flex items-center gap-2 text-purple-700 hover:text-purple-800 transition-colors">
            <Image src="/assets/logo.png" alt="Logo" width={32} height={32} />
            <span className="font-bold text-lg">Frutos Congelados ZN</span>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 py-16 md:py-24">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-100 rounded-full mb-6">
            <FiSmartphone className="w-10 h-10 text-purple-600" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            App para Conductores
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            La herramienta perfecta para gestionar tus entregas de manera eficiente y profesional. 
            Diseñada para conductores que buscan optimizar su trabajo diario.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#"
              className="inline-flex items-center justify-center px-8 py-4 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors shadow-lg"
            >
              Descargar para Android
            </a>
            <a
              href="#"
              className="inline-flex items-center justify-center px-8 py-4 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors shadow-lg"
            >
              Descargar para iOS
            </a>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100"
            >
              <div className="text-purple-600 mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Benefits Section */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl p-8 md:p-12 text-white mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">¿Por qué elegir nuestra app?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-6 h-6 bg-purple-300 rounded-full mt-1 flex items-center justify-center">
                <FiCheckCircle className="w-4 h-4 text-purple-800" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Interfaz Intuitiva</h3>
                <p className="text-purple-100">Diseñada para ser fácil de usar, incluso mientras conduces.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-6 h-6 bg-purple-300 rounded-full mt-1 flex items-center justify-center">
                <FiCheckCircle className="w-4 h-4 text-purple-800" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Soporte 24/7</h3>
                <p className="text-purple-100">Asistencia técnica disponible en todo momento.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-6 h-6 bg-purple-300 rounded-full mt-1 flex items-center justify-center">
                <FiCheckCircle className="w-4 h-4 text-purple-800" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Actualizaciones Constantes</h3>
                <p className="text-purple-100">Mejoras y nuevas funcionalidades de forma regular.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-6 h-6 bg-purple-300 rounded-full mt-1 flex items-center justify-center">
                <FiCheckCircle className="w-4 h-4 text-purple-800" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Seguridad Garantizada</h3>
                <p className="text-purple-100">Tus datos y transacciones están protegidos con encriptación avanzada.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Screenshots Section */}
        <div className="bg-white rounded-2xl p-8 md:p-12 shadow-xl mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Capturas de Pantalla</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl p-8 text-center">
              <div className="bg-white rounded-lg p-4 mb-4 shadow-lg">
                <FiMapPin className="w-16 h-16 text-purple-600 mx-auto" />
              </div>
              <p className="font-semibold text-gray-700">Vista de Mapa</p>
            </div>
            <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl p-8 text-center">
              <div className="bg-white rounded-lg p-4 mb-4 shadow-lg">
                <FiPackage className="w-16 h-16 text-blue-600 mx-auto" />
              </div>
              <p className="font-semibold text-gray-700">Gestión de Pedidos</p>
            </div>
            <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-xl p-8 text-center">
              <div className="bg-white rounded-lg p-4 mb-4 shadow-lg">
                <FiCheckCircle className="w-16 h-16 text-green-600 mx-auto" />
              </div>
              <p className="font-semibold text-gray-700">Confirmación de Entrega</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white rounded-2xl p-8 md:p-12 shadow-xl">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            ¿Listo para empezar?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Descarga la app ahora y optimiza tu trabajo como conductor profesional.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#"
              className="inline-flex items-center justify-center px-8 py-4 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors shadow-lg"
            >
              Descargar para Android
            </a>
            <a
              href="#"
              className="inline-flex items-center justify-center px-8 py-4 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors shadow-lg"
            >
              Descargar para iOS
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-gray-600">
          <Link href="/login" className="text-purple-600 hover:text-purple-700 font-medium">
            ← Volver al inicio
          </Link>
        </div>
      </footer>
    </div>
  );
}
