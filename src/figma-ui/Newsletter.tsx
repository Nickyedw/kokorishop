import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Mail, Gift } from "lucide-react";

export function Newsletter() {
  return (
    <section className="py-16 bg-gradient-to-r from-purple-900 via-black to-fuchsia-900 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 text-6xl">💀</div>
        <div className="absolute bottom-10 right-20 text-6xl">💕</div>
        <div className="absolute top-1/2 left-1/4 text-5xl">✨</div>
        <div className="absolute bottom-20 left-1/3 text-5xl">🎀</div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white mb-4 border-2 border-fuchsia-500/30">
            <Gift className="h-4 w-4 text-fuchsia-400" />
            <span className="text-sm">Suscríbete y obtén 15% de descuento</span>
          </div>

          <h2 className="text-3xl md:text-4xl text-white">
            ¡Únete a Nuestra Comunidad Kawaii! 💕
          </h2>
          
          <p className="text-lg text-gray-300">
            Recibe ofertas exclusivas, nuevos productos y contenido adorable 
            directamente en tu correo. ¡Además, obtén un cupón de bienvenida! 🎁
          </p>

          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <div className="relative flex-1">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-purple-600" />
              <Input
                type="email"
                placeholder="tu@email.com"
                className="pl-12 pr-4 py-6 rounded-full border-2 border-fuchsia-500/30 bg-white/95 focus:bg-white focus:border-fuchsia-500 text-gray-900 placeholder:text-gray-500"
                required
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="bg-gradient-to-r from-fuchsia-600 to-pink-500 hover:from-fuchsia-700 hover:to-pink-600 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 rounded-full px-8 py-6 border-2 border-white/20"
            >
              Suscribirme ✨
            </Button>
          </form>

          <p className="text-xs text-gray-400">
            Al suscribirte, aceptas recibir emails de Kokorishop. 
            Puedes darte de baja en cualquier momento.
          </p>
        </div>
      </div>
    </section>
  );
}
