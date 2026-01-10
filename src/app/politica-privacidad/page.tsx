"use client";
import Image from "next/image";
import Link from "next/link";

export default function PoliticaPrivacidadPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-purple-100">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link href="/login" className="flex items-center gap-2 text-purple-700 hover:text-purple-800 transition-colors">
            <Image src="/assets/logo.png" alt="Logo" width={32} height={32} />
            <span className="font-bold text-lg">Frutos Congelados ZN</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-8 md:p-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Política de Privacidad</h1>
            <p className="text-purple-100 text-lg">Última actualización: {new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          {/* Content */}
          <div className="p-8 md:p-12 space-y-8 text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-purple-900 mb-4">1. Introducción</h2>
              <p className="mb-4">
                En Frutos Congelados ZN, nos comprometemos a proteger su privacidad y garantizar la seguridad de sus datos personales. 
                Esta política de privacidad explica cómo recopilamos, usamos, almacenamos y protegemos su información personal.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-purple-900 mb-4">2. Información que Recopilamos</h2>
              <p className="mb-4">Recopilamos los siguientes tipos de información:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Información de identificación:</strong> nombre, dirección de correo electrónico, número de teléfono</li>
                <li><strong>Información de ubicación:</strong> dirección de entrega, coordenadas GPS (con su consentimiento)</li>
                <li><strong>Información de pedidos:</strong> historial de compras, preferencias de productos</li>
                <li><strong>Información de dispositivo:</strong> tipo de dispositivo, sistema operativo, dirección IP</li>
                <li><strong>Información de pago:</strong> métodos de pago procesados de forma segura a través de terceros</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-purple-900 mb-4">3. Cómo Utilizamos su Información</h2>
              <p className="mb-4">Utilizamos su información personal para los siguientes fines:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Procesar y gestionar sus pedidos</li>
                <li>Comunicarnos con usted sobre su pedido</li>
                <li>Mejorar nuestros servicios y experiencia del usuario</li>
                <li>Enviar notificaciones importantes sobre nuestros servicios</li>
                <li>Cumplir con obligaciones legales y regulatorias</li>
                <li>Prevenir fraude y garantizar la seguridad</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-purple-900 mb-4">4. Compartir Información</h2>
              <p className="mb-4">
                No vendemos ni alquilamos su información personal a terceros. Solo compartimos su información en las siguientes circunstancias:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Proveedores de servicios:</strong> con empresas que nos ayudan a operar nuestro negocio (procesadores de pago, servicios de entrega)</li>
                <li><strong>Cumplimiento legal:</strong> cuando sea requerido por ley o para proteger nuestros derechos legales</li>
                <li><strong>Con su consentimiento:</strong> en cualquier otra situación con su autorización explícita</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-purple-900 mb-4">5. Seguridad de los Datos</h2>
              <p className="mb-4">
                Implementamos medidas de seguridad técnicas y organizativas para proteger su información personal contra 
                acceso no autorizado, alteración, divulgación o destrucción. Esto incluye:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Encriptación de datos en tránsito y en reposo</li>
                <li>Controles de acceso restringidos</li>
                <li>Monitoreo regular de nuestros sistemas</li>
                <li>Capacitación continua de nuestro personal</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-purple-900 mb-4">6. Sus Derechos</h2>
              <p className="mb-4">Usted tiene derecho a:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Acceder a su información personal</li>
                <li>Rectificar información inexacta o incompleta</li>
                <li>Solicitar la eliminación de sus datos personales</li>
                <li>Oponerse al procesamiento de sus datos</li>
                <li>Solicitar la portabilidad de sus datos</li>
                <li>Retirar su consentimiento en cualquier momento</li>
              </ul>
              <p className="mt-4">
                Para ejercer estos derechos, puede contactarnos a través de los medios indicados en la sección de contacto.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-purple-900 mb-4">7. Cookies y Tecnologías Similares</h2>
              <p className="mb-4">
                Utilizamos cookies y tecnologías similares para mejorar su experiencia, analizar el uso de nuestros servicios 
                y personalizar el contenido. Puede gestionar sus preferencias de cookies a través de la configuración de su navegador.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-purple-900 mb-4">8. Retención de Datos</h2>
              <p className="mb-4">
                Conservamos su información personal solo durante el tiempo necesario para cumplir con los fines descritos en esta política, 
                o según lo requiera la ley. Cuando ya no sea necesario, eliminaremos o anonimizaremos sus datos de forma segura.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-purple-900 mb-4">9. Cambios a esta Política</h2>
              <p className="mb-4">
                Nos reservamos el derecho de actualizar esta política de privacidad periódicamente. Le notificaremos sobre cualquier cambio 
                significativo publicando la nueva política en esta página y actualizando la fecha de "última actualización".
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-purple-900 mb-4">10. Contacto</h2>
              <p className="mb-4">
                Si tiene preguntas, inquietudes o solicitudes relacionadas con esta política de privacidad o el manejo de sus datos personales, 
                puede contactarnos:
              </p>
              <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
                <p className="font-semibold text-purple-900 mb-2">Frutos Congelados ZN</p>
                <p className="text-gray-700">Email: privacidad@frutoscongeladoszn.com</p>
                <p className="text-gray-700">Teléfono: +54 11 1234-5678</p>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 border-t border-gray-200 p-6 text-center text-gray-600">
            <Link href="/login" className="text-purple-600 hover:text-purple-700 font-medium">
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
