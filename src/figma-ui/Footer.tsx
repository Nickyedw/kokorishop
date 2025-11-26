import { Facebook, Instagram, Twitter, Youtube, Mail, Phone, MapPin, Heart } from "lucide-react";
import logo from "figma:asset/a2ef29499535b12cf557eae0cdd93f24079ffdb2.png";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-black via-purple-950 to-fuchsia-950 text-white border-t-2 border-fuchsia-500/20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* About */}
          <div>
            <div className="mb-4">
              <img 
                src={logo} 
                alt="Kokori Shop" 
                className="h-16 w-auto object-contain"
              />
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Tu tienda favorita de productos kawaii. 
              Hacemos que cada día sea más cute y especial. ✨
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                className="bg-fuchsia-500/10 hover:bg-fuchsia-500/20 border border-fuchsia-500/30 p-2 rounded-full transition-all hover:scale-110"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="bg-fuchsia-500/10 hover:bg-fuchsia-500/20 border border-fuchsia-500/30 p-2 rounded-full transition-all hover:scale-110"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="bg-fuchsia-500/10 hover:bg-fuchsia-500/20 border border-fuchsia-500/30 p-2 rounded-full transition-all hover:scale-110"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="bg-fuchsia-500/10 hover:bg-fuchsia-500/20 border border-fuchsia-500/30 p-2 rounded-full transition-all hover:scale-110"
                aria-label="YouTube"
              >
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-fuchsia-400">Enlaces Rápidos</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-gray-400 hover:text-fuchsia-400 transition-colors">
                  Sobre Nosotros
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-fuchsia-400 transition-colors">
                  Catálogo Completo
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-fuchsia-400 transition-colors">
                  Ofertas Especiales
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-fuchsia-400 transition-colors">
                  Blog Kawaii
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-fuchsia-400 transition-colors">
                  Programa de Lealtad
                </a>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="mb-4 text-fuchsia-400">Servicio al Cliente</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-gray-400 hover:text-fuchsia-400 transition-colors">
                  Centro de Ayuda
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-fuchsia-400 transition-colors">
                  Seguimiento de Pedido
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-fuchsia-400 transition-colors">
                  Envíos y Entregas
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-fuchsia-400 transition-colors">
                  Devoluciones
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-fuchsia-400 transition-colors">
                  Términos y Condiciones
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-fuchsia-400 transition-colors">
                  Política de Privacidad
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-pink-300">Contacto</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-pink-400 flex-shrink-0 mt-0.5" />
                <span className="text-pink-200">
                  Av. Kawaii 123, Lima, Perú
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-pink-400 flex-shrink-0" />
                <a href="tel:+51123456789" className="text-pink-200 hover:text-white transition-colors">
                  +51 1 234 5678
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-pink-400 flex-shrink-0" />
                <a href="mailto:hola@kokorishop.com" className="text-pink-200 hover:text-white transition-colors">
                  hola@kokorishop.com
                </a>
              </li>
            </ul>

            <div className="mt-4 p-3 bg-fuchsia-500/10 rounded-lg backdrop-blur-sm border border-fuchsia-500/20">
              <p className="text-sm text-fuchsia-300 mb-1">Horario de Atención</p>
              <p className="text-xs text-gray-400">Lun - Vie: 9:00 AM - 6:00 PM</p>
              <p className="text-xs text-gray-400">Sáb: 10:00 AM - 2:00 PM</p>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="border-t border-fuchsia-500/20 pt-8 mb-8">
          <p className="text-center text-sm text-fuchsia-300 mb-4">Métodos de Pago Aceptados</p>
          <div className="flex justify-center flex-wrap gap-4">
            {["Visa", "Mastercard", "PayPal", "Yape", "Plin"].map((method) => (
              <div
                key={method}
                className="bg-fuchsia-500/10 backdrop-blur-sm border border-fuchsia-500/20 px-4 py-2 rounded-lg text-sm text-gray-300"
              >
                {method}
              </div>
            ))}
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-fuchsia-500/20 pt-8 text-center">
          <p className="text-sm text-gray-400 flex items-center justify-center gap-2 flex-wrap">
            © {currentYear} Kokorishop. Todos los derechos reservados.
            <span className="flex items-center gap-1">
              Hecho con <Heart className="h-4 w-4 fill-fuchsia-400 text-fuchsia-400" /> en Perú
            </span>
          </p>
        </div>
      </div>

      <style>{`
        .kuromi-text {
          background: linear-gradient(90deg, #FF1493, #FF69B4, #BA55D3, #9370DB);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          font-weight: bold;
        }
      `}</style>
    </footer>
  );
}
