import { Truck, Shield, CreditCard, HeadphonesIcon, Award, Heart } from "lucide-react";

export function TrustBadges() {
  const badges = [
    {
      icon: Truck,
      title: "Envío Rápido",
      description: "Gratis en compras +S/ 100",
      color: "text-fuchsia-600"
    },
    {
      icon: Shield,
      title: "Compra Segura",
      description: "Garantía de satisfacción",
      color: "text-purple-600"
    },
    {
      icon: CreditCard,
      title: "Pago Fácil",
      description: "Todos los métodos",
      color: "text-pink-600"
    },
    {
      icon: HeadphonesIcon,
      title: "Soporte 24/7",
      description: "Siempre aquí para ti",
      color: "text-fuchsia-600"
    },
    {
      icon: Award,
      title: "Calidad Premium",
      description: "Productos verificados",
      color: "text-purple-600"
    },
    {
      icon: Heart,
      title: "Hecho con Amor",
      description: "Selección cuidadosa",
      color: "text-pink-600"
    }
  ];

  return (
    <section className="py-12 pb-20 bg-black">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
          {badges.map((badge, index) => {
            const Icon = badge.icon;
            return (
              <div
                key={index}
                className="flex flex-col items-center text-center p-4 rounded-xl bg-gradient-to-br from-purple-900/50 to-fuchsia-900/50 backdrop-blur-sm border border-fuchsia-500/20 shadow-md hover:shadow-xl hover:border-fuchsia-500/50 transition-all duration-300 hover:scale-105 group"
              >
                <div className={`${badge.color} mb-3 transform group-hover:scale-110 transition-transform`}>
                  <Icon className="h-8 w-8" />
                </div>
                <h3 className="text-sm text-white mb-1">{badge.title}</h3>
                <p className="text-xs text-gray-400">{badge.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
