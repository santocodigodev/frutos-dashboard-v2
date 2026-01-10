"use client";
import Image from "next/image";
import Link from "next/link";
import { FiBox, FiCheckCircle, FiList, FiClock, FiSmartphone, FiBarChart2, FiSettings } from "react-icons/fi";

export default function AppArmadorPage() {
  const features = [
    {
      icon: <FiList className="w-8 h-8" />,
      title: "Gestión de Pedidos",
      description: "Visualiza y organiza todos los pedidos asignados para armar con una interfaz clara y ordenada."
    },
    {
      icon: <FiBox className="w-8 h-8" />,
      title: "Lista de Productos",
      description: "Accede al catálogo completo de productos con descripciones detalladas e imágenes de referencia."
    },
    {
      icon: <FiCheckCircle className="w-8 h-8" />,
      title: "Confirmación de Armado",
      description: "Marca productos como armados y confirma cuando un pedido está completo y listo para entrega."
    },
    {
      icon: <FiClock className="w-8 h-8" />,
      title: "Control de Tiempos",
      description: "Monitorea el tiempo empleado en cada pedido para optimizar tu productividad."
    },
    {
      icon: <FiBarChart2 className="w-8 h-8" />,
      title: "Estadísticas Personales",
      description: "Revisa tus métricas de rendimiento, pedidos completados y tu historial de trabajo."
    },
    {
      icon: <FiSettings className="w-8 h-8" />,
      title: "Personalización",
      description: "Configura notificaciones y preferencias según tu estilo de trabajo."
    }
  ];

  const benefits = [
    {
      title: "Eficiencia Mejorada",
      description: "Organiza tu trabajo de manera más eficiente con herramientas diseñadas para armadores."
    },
    {
      title: "Menos Errores",
      description: "Validación automática para asegurar que todos los productos estén correctamente incluidos."
    },
    {
      title: "Comunicación Directa",
      description: "Mantén comunicación fluida con el equipo y reporta cualquier inconveniente al instante."
    },
    {
      title: "Flexibilidad Total",
      description: "Trabaja a tu ritmo con una app que se adapta a tu flujo de trabajo personal."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
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
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
            <FiSmartphone className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            App para Armadores
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Simplifica tu trabajo diario como armador con una herramienta diseñada específicamente 
            para gestionar pedidos y optimizar tu productividad.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#"
              className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
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
              <div className="text-blue-600 mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Benefits Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 md:p-12 text-white mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">Ventajas de usar nuestra app</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-300 rounded-full mt-1 flex items-center justify-center">
                  <FiCheckCircle className="w-4 h-4 text-blue-800" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">{benefit.title}</h3>
                  <p className="text-blue-100">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works Section */}
        <div className="bg-white rounded-2xl p-8 md:p-12 shadow-xl mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">¿Cómo funciona?</h2>
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="flex-shrink-0 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-2xl">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Recibe pedidos asignados</h3>
                <p className="text-gray-600">
                  Los pedidos aparecen automáticamente en tu app cuando te son asignados para armar.
                </p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="flex-shrink-0 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-2xl">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Revisa la lista de productos</h3>
                <p className="text-gray-600">
                  Visualiza todos los productos que necesitas armar con detalles completos y cantidades.
                </p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="flex-shrink-0 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-2xl">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Marca productos armados</h3>
                <p className="text-gray-600">
                  Confirma cada producto a medida que lo vas armando para mantener un registro en tiempo real.
                </p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="flex-shrink-0 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-2xl">
                4
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Confirma pedido completo</h3>
                <p className="text-gray-600">
                  Una vez armado, confirma que el pedido está completo y listo para ser entregado.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Screenshots Section */}
        <div className="bg-white rounded-2xl p-8 md:p-12 shadow-xl mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Vista Previa</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl p-8 text-center">
              <div className="bg-white rounded-lg p-4 mb-4 shadow-lg">
                <FiList className="w-16 h-16 text-blue-600 mx-auto" />
              </div>
              <p className="font-semibold text-gray-700">Lista de Pedidos</p>
            </div>
            <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl p-8 text-center">
              <div className="bg-white rounded-lg p-4 mb-4 shadow-lg">
                <FiBox className="w-16 h-16 text-purple-600 mx-auto" />
              </div>
              <p className="font-semibold text-gray-700">Detalle de Productos</p>
            </div>
            <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-xl p-8 text-center">
              <div className="bg-white rounded-lg p-4 mb-4 shadow-lg">
                <FiCheckCircle className="w-16 h-16 text-green-600 mx-auto" />
              </div>
              <p className="font-semibold text-gray-700">Confirmación</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white rounded-2xl p-8 md:p-12 shadow-xl">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Comienza a trabajar de forma más eficiente
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Descarga la app ahora y transforma tu forma de trabajar como armador profesional.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#"
              className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
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
