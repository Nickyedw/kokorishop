// src/figma-ui/Header.tsx
import {
  Search,
  Heart,
  ShoppingCart,
  User,
  Menu,
  Mic,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "./ui/sheet";
import { Badge } from "./ui/badge";
import { useState, useContext, useEffect, useRef, useCallback } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

import { CartContext } from "../context/CartContext";
import { FavoritesContext } from "../context/FavoritesContext";
import { logout } from "../utils/logout";

type ProductoSuggestion = {
  id: number;
  nombre: string;
  precio?: number;
  // soportamos varios posibles nombres de campo de imagen
  imagen_url?: string;
  imagen?: string;
  image?: string;
  foto?: string;
  url_imagen?: string;
  categoria?: string;
};

type MenuCategory = {
  id: string;
  nombre: string;
};

export function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const avatarRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<number | null>(null);

  const { cartItems } = useContext(CartContext);
  const { favorites } = useContext(FavoritesContext);

  const navigate = useNavigate();

  const cartCount = (cartItems || []).reduce(
    (sum: number, item: { quantity?: number }) => sum + (item?.quantity ?? 0),
    0
  );
  const wishlistCount = favorites?.length ?? 0;

  const usuarioNombre = localStorage.getItem("usuario_nombre") || "Invitado";
  const isLogged = usuarioNombre !== "Invitado";
  const userInitial = isLogged
    ? usuarioNombre.trim().charAt(0).toUpperCase()
    : null;

  // 🔧 FIX tipos de import.meta.env
  const base = (import.meta as any).env.BASE_URL || "/";
  const API_APP =
    (import.meta as any).env.VITE_API_URL || "http://localhost:3001";
  const API_BASE = `${API_APP}/api`;

  const WHATSAPP_HELP =
    (import.meta as any).env.VITE_SOCIAL_WHATSAPP ||
    "https://wa.me/51977546073?text=Hola%20KokoriShop%20💜%2C%20no%20encuentro%20un%20producto%20y%20necesito%20ayuda.";

  // 🚀 Categorías para el menú (vienen de la BD)
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/categorias`, { cache: "no-store" });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        if (!alive || !Array.isArray(data)) return;

        const cats: MenuCategory[] = data.map((c: any) => ({
          id: String(c.id),
          nombre: c.nombre,
        }));
        setMenuCategories(cats);
      } catch (err) {
        console.error("❌ Error cargando categorías para el header:", err);
        setMenuCategories([]);
      }
    })();

    return () => {
      alive = false;
    };
  }, [API_BASE]);

  const goToCategory = (catId: string) => {
    if (!catId) return;
    // HashRouter se encarga de poner el # automáticamente
    navigate(`/catalogo?categoria=${encodeURIComponent(catId)}`);
  };

  /* =========================
     Helper para imágenes (miniaturas del buscador)
     ========================= */
  const getSuggestionImageSrc = (p: ProductoSuggestion): string | undefined => {
    const raw =
      p.imagen_url || p.image || p.imagen || p.foto || p.url_imagen;
    if (!raw) return undefined;

    // Si ya viene como URL absoluta, la usamos tal cual
    if (/^https?:\/\//i.test(raw)) return raw;

    // Si empieza con "/", lo pegamos al dominio de la API
    if (raw.startsWith("/")) return `${API_APP}${raw}`;

    // Si es sólo el nombre de archivo, asumimos carpeta /uploads
    return `${API_APP}/uploads/${raw}`;
  };

  /* =========================
     ESTADO DEL BUSCADOR
     ========================= */
  const [searchTerm, setSearchTerm] = useState("");
  const placeholderOptions = [
    "Busca peluches de panda 🐼",
    "Encuentra accesorios kawaii ✨",
    "Escribe: Kuromi, Sanrio, anime…",
    "Busca regalos para alguien especial 🎁",
  ];
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  const [suggestions, setSuggestions] = useState<{
    productos: ProductoSuggestion[];
    populares: ProductoSuggestion[];
  }>({ productos: [], populares: [] });

  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  /* =========================
     ROTAR PLACEHOLDER
     ========================= */
  useEffect(() => {
    const id = window.setInterval(() => {
      setPlaceholderIndex((prev) =>
        prev + 1 >= placeholderOptions.length ? 0 : prev + 1
      );
    }, 5000);
    return () => window.clearInterval(id);
  }, []);

  /* =========================
     BÚSQUEDAS RECIENTES (localStorage)
     ========================= */
  useEffect(() => {
    try {
      const raw = localStorage.getItem("kokori_search_recent");
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) setRecentSearches(arr);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const saveRecentSearch = useCallback((term: string) => {
    const clean = term.trim();
    if (!clean) return;

    setRecentSearches((prev) => {
      const next = [clean, ...prev.filter((t) => t !== clean)].slice(0, 6);
      localStorage.setItem("kokori_search_recent", JSON.stringify(next));
      return next;
    });
  }, []);

  /* =========================
     FETCH DE SUGERENCIAS
     ========================= */
  const fetchSuggestions = useCallback(
    async (term: string) => {
      const q = term.trim();
      if (q.length < 2) {
        setSuggestions((prev) => ({ ...prev, productos: [] }));
        return;
      }

      try {
        setLoadingSuggestions(true);
        // ⚠️ Ajusta esta ruta si tu endpoint es distinto
        const res = await fetch(
          `${API_BASE}/productos/buscar?q=${encodeURIComponent(q)}`
        );
        if (!res.ok) throw new Error("Error en búsqueda");
        const data = await res.json();

        const productos: ProductoSuggestion[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
          ? data.items
          : [];

        setSuggestions((prev) => ({ ...prev, productos }));
      } catch (err) {
        console.error("Error al buscar productos:", err);
      } finally {
        setLoadingSuggestions(false);
      }
    },
    [API_BASE]
  );

  // Debounce al teclear
  useEffect(() => {
    if (!showSuggestions) return;

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(() => {
      fetchSuggestions(searchTerm);
    }, 280);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [searchTerm, showSuggestions, fetchSuggestions]);

  // Cargar “populares” una sola vez (cuando abre el dropdown sin texto)
  const loadPopularOnce = useCallback(async () => {
    if (suggestions.populares.length > 0) return;
    try {
      // ⚠️ Ajusta esta ruta a tu API real de productos populares/destacados
      const res = await fetch(`${API_BASE}/productos/destacados`);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) {
        setSuggestions((prev) => ({ ...prev, populares: data.slice(0, 6) }));
      }
    } catch (err) {
      console.error("Error cargando populares:", err);
    }
  }, [API_BASE, suggestions.populares.length]);

  /* =========================
     SUBMIT DE BÚSQUEDA
     ========================= */
  const performSearch = useCallback(
    (term?: string) => {
      const finalTerm = (term ?? searchTerm).trim();
      if (!finalTerm) return;

      // Guardamos para recientes y para que el catálogo pueda leer el último término
      saveRecentSearch(finalTerm);
      try {
        localStorage.setItem("kokori_last_search_term", finalTerm);
      } catch {
        /* ignore */
      }

      setShowSuggestions(false);
      setIsSearchOpen(false);

      // Navegación a tu página de catálogo con filtro
      window.location.hash = `#/catalogo?search=${encodeURIComponent(
        finalTerm
      )}`;
    },
    [saveRecentSearch, searchTerm]
  );

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      performSearch();
    }
  };

  const handleSearchFocus = () => {
    setShowSuggestions(true);
    if (!searchTerm.trim()) {
      loadPopularOnce();
    }
  };

  /* =========================
     BÚSQUEDA POR VOZ
     ========================= */
  const handleVoiceSearch = async () => {
    try {
      const w = window as any;
      const SpeechRecognition =
        w.SpeechRecognition || w.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        toast.info("Tu navegador no soporta búsqueda por voz 💜");
        return;
      }

      const recog = new SpeechRecognition();
      recog.lang = "es-PE";
      recog.interimResults = false;
      recog.maxAlternatives = 1;

      recog.onresult = (event: any) => {
        const text = event.results[0][0].transcript || "";
        setSearchTerm(text);
        setShowSuggestions(true);
        fetchSuggestions(text);
      };

      recog.onerror = () => {
        toast.error("No se pudo usar el micrófono 😿");
      };

      recog.start();
    } catch (err) {
      console.error(err);
      toast.error("No se pudo iniciar la búsqueda por voz.");
    }
  };

  /* =========================
     Cierre por clic fuera
     ========================= */
  useEffect(() => {
    if (!showSuggestions && !isSearchOpen) return;

    const handler = (e: Event) => {
      const target = e.target as Node | null;
      const insideSearch =
        searchRef.current && target && searchRef.current.contains(target);
      const insideMobileToggle =
        (e.target as HTMLElement | null)?.closest?.("[data-search-toggle]");

      if (!insideSearch && !insideMobileToggle) {
        setShowSuggestions(false);
        setIsSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [showSuggestions, isSearchOpen]);

  /* =========================
     LOGOUT
     ========================= */
  const handleLogout = () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setIsUserMenuOpen(false);

    toast.success("Sesión cerrada correctamente 💖", {
      position: "top-center",
      autoClose: 2200,
      hideProgressBar: false,
    });

    setTimeout(() => {
      logout();
    }, 650);
  };

  /* =========================
     CLIC FUERA DEL MENÚ DE USUARIO
     ========================= */
  useEffect(() => {
    if (!isUserMenuOpen) return;

    const handleClickOutside = (event: Event) => {
      const target = event.target as Node | null;
      if (avatarRef.current && target && !avatarRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isUserMenuOpen]);

  /* =========================
     RENDER SUGERENCIAS
     ========================= */
  const renderSearchDropdown = () => {
    if (!showSuggestions) return null;

    const hasQuery = searchTerm.trim().length >= 2;
    const productos = suggestions.productos || [];
    const populares = suggestions.populares || [];

    const noResults = hasQuery && !loadingSuggestions && productos.length === 0;

    return (
      <div className="absolute left-0 right-0 mt-2 bg-black/95 text-white rounded-2xl shadow-2xl border border-fuchsia-500/40 max-h-[420px] overflow-y-auto z-40 text-sm">
        {/* Sugerencias de productos */}
        {hasQuery && (
          <div className="p-3 border-b border-white/10">
            <p className="text-xs uppercase text-fuchsia-300 mb-2">
              Resultados para “{searchTerm.trim()}”
            </p>

            {loadingSuggestions && (
              <p className="text-xs text-gray-300">Buscando productos…</p>
            )}

            {!loadingSuggestions && productos.length > 0 && (
              <ul className="space-y-2">
                {productos.slice(0, 6).map((p) => {
                  const imgSrc = getSuggestionImageSrc(p);
                  return (
                    <li
                      key={p.id}
                      className="flex items-center gap-2 p-2 rounded-xl hover:bg-white/10 cursor-pointer"
                      // Al hacer click usamos el nombre del producto como término de búsqueda
                      onClick={() => performSearch(p.nombre)}
                    >
                      {imgSrc && (
                        <img
                          src={imgSrc}
                          alt={p.nombre}
                          className="w-10 h-10 rounded-lg object-cover bg-white/10 flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{p.nombre}</p>
                        {p.precio != null && (
                          <p className="text-xs text-fuchsia-200">
                            S/ {Number(p.precio).toFixed(2)}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {noResults && (
              <div className="space-y-2 text-xs text-gray-200">
                <p className="font-semibold text-fuchsia-200">
                  No encontramos resultados 😿
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Revisa la ortografía de lo que escribiste.</li>
                  <li>Prueba con un término más general (ej. “peluche”).</li>
                </ul>
                <a
                  href={WHATSAPP_HELP}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex mt-2 px-3 py-1.5 rounded-full bg-emerald-500 text-white font-semibold hover:bg-emerald-600 text-xs"
                >
                  ¿No encuentras lo que buscas? ¡Te ayudamos por WhatsApp!
                </a>
              </div>
            )}
          </div>
        )}

        {/* Búsquedas recientes y populares (cuando el input está vacío) */}
        {!hasQuery && (
          <div className="grid md:grid-cols-2 gap-0">
            <div className="p-3 border-b md:border-b-0 md:border-r border-white/10">
              <p className="text-xs uppercase text-fuchsia-300 mb-2">
                Búsquedas recientes
              </p>
              {recentSearches.length === 0 && (
                <p className="text-xs text-gray-300">
                  Aún no tienes búsquedas. Empieza escribiendo algo kawaii 💜
                </p>
              )}
              <ul className="space-y-1">
                {recentSearches.map((term) => (
                  <li key={term}>
                    <button
                      type="button"
                      onClick={() => performSearch(term)}
                      className="w-full text-left px-2 py-1 rounded-lg hover:bg-white/10 text-xs"
                    >
                      {term}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3">
              <p className="text-xs uppercase text-fuchsia-300 mb-2">
                Productos populares
              </p>
              {populares.length === 0 && (
                <p className="text-xs text-gray-300">
                  Cargando productos destacados…
                </p>
              )}
              <ul className="space-y-1">
                {populares.map((p) => {
                  const imgSrc = getSuggestionImageSrc(p);
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => performSearch(p.nombre)}
                        className="w-full text-left px-2 py-1 rounded-lg hover:bg-white/10 flex items-center gap-2"
                      >
                        {imgSrc && (
                          <img
                            src={imgSrc}
                            alt={p.nombre}
                            className="w-7 h-7 rounded-lg object-cover bg-white/10 flex-shrink-0"
                          />
                        )}
                        <span className="text-xs truncate">{p.nombre}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-purple-900 via-black to-fuchsia-900 shadow-2xl">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-fuchsia-600 to-pink-500 text-white text-center py-2 px-4">
        <p className="flex items-center justify-center gap-2 flex-wrap text-sm">
          ✨ <span>¡Envío gratis en compras mayores a S/ 100!</span> ✨
        </p>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4 gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <a
              href="#/"
              className="flex items-center hover:opacity-90 transition-opacity"
            >
              <img
                src={`${base}img/logo_kokorishop.png`}
                alt="Kokorishop"
                className="h-10 sm:h-12 md:h-14 w-auto object-contain drop-shadow-[0_0_8px_rgba(255,255,255,.7)]"
              />
            </a>
          </div>

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-6" ref={searchRef}>
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-purple-600" />
              <Input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={handleSearchFocus}
                onKeyDown={handleSearchKeyDown}
                placeholder={placeholderOptions[placeholderIndex]}
                className="
                  pl-10 pr-12 py-6 rounded-full
                  border-2 border-fuchsia-500/40
                  bg-white/95 focus:bg-white focus:border-fuchsia-500
                  text-sm
                  text-purple-900 placeholder:text-purple-400
                  transition-all
                "
              />
              {/* Micrófono */}
              <button
                type="button"
                onClick={handleVoiceSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-fuchsia-600 hover:text-fuchsia-700"
                aria-label="Búsqueda por voz"
              >
                <Mic className="h-5 w-5" />
              </button>

              {renderSearchDropdown()}
            </div>
          </div>

          {/* Actions + saludo */}
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2 md:gap-3">
              {/* Mobile Search Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-white hover:bg-white/20"
                onClick={() => {
                  setIsSearchOpen(true);
                  setShowSuggestions(true);
                  loadPopularOnce();
                }}
                data-search-toggle
              >
                <Search className="h-5 w-5" />
              </Button>

              {/* Wishlist */}
              <Button
                variant="ghost"
                size="icon"
                className="relative text-white hover:bg-white/20 hidden sm:flex"
                onClick={() => navigate("/favorites")}
                aria-label="Ver favoritos"
              >
                <Heart className="h-5 w-5" />
                {wishlistCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-fuchsia-500 hover:bg-fuchsia-500 border-2 border-white text-[11px]">
                    {wishlistCount}
                  </Badge>
                )}
              </Button>


              {/* User / Avatar */}
              {!isLogged ? (
                <a href="#/login" aria-label="Iniciar sesión">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                  >
                    <User className="h-5 w-5" />
                  </Button>
                </a>
              ) : (
                <div className="relative" ref={avatarRef}>
                  <button
                    type="button"
                    aria-label="Mi cuenta"
                    title={usuarioNombre}
                    onClick={() =>
                      setIsUserMenuOpen((prev: boolean) => !prev)
                    }
                    className={`relative grid place-items-center w-8 h-8 sm:w-9 sm:h-9 rounded-full
                      bg-violet-800 text-yellow-300 shadow
                      ring-2 ring-fuchsia-300/70 hover:brightness-110 transition
                      ${isLoggingOut ? "animate-kawaii-pop" : ""}`}
                  >
                    <span className="font-black text-xs sm:text-sm">
                      {userInitial}
                    </span>

                    {!isLoggingOut && (
                      <>
                        <span className="pointer-events-none absolute -inset-1 rounded-full ring-2 ring-fuchsia-400/40" />
                        <span className="pointer-events-none absolute -inset-1 rounded-full ring-2 ring-fuchsia-400/70 animate-ping-slow" />
                      </>
                    )}
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-44 bg-black/90 border border-fuchsia-400/40 rounded-lg shadow-xl z-50 overflow-hidden">
                      <a
                        href="#/menu"
                        className="block px-4 py-2 text-sm text-white hover:bg-white/10"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Mi Cuenta
                      </a>

                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-300 hover:bg-red-700/30"
                      >
                        Cerrar sesión
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Cart */}
              <Button
                variant="ghost"
                size="icon"
                className="relative text-white hover:bg-white/20"
                onClick={() => navigate("/cart")}
                aria-label="Ver carrito"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-fuchsia-500 text-white hover:bg-fuchsia-500 border-2 border-white text-[11px]">
                    {cartCount}
                  </Badge>
                )}
              </Button>


              {/* Mobile Menu */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden text-white hover:bg-white/20"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="bg-gradient-to-b from-purple-900 via-black to-fuchsia-900 text-white border-l-4 border-fuchsia-500">
                  <nav className="flex flex-col gap-4 mt-8">
                    <p className="text-sm text-fuchsia-300 uppercase tracking-wider">
                      Categorías
                    </p>

                    {menuCategories.map((cat) => (
                      <SheetClose asChild key={cat.id}>
                        <button
                          type="button"
                          onClick={() => goToCategory(cat.id)}
                          className="text-lg hover:text-fuchsia-300 transition-colors py-2 border-b border-white/10 text-left"
                        >
                          {cat.nombre}
                        </button>
                      </SheetClose>
                    ))}

                    <a
                      href="#/favorites"
                      className="text-lg hover:text-fuchsia-300 transition-colors py-2 border-b border-white/10 flex items-center gap-2"
                    >
                      <Heart className="h-5 w-5" /> Mis Favoritos (
                      {wishlistCount})
                    </a>

                    <a
                      href={isLogged ? "#/menu" : "#/login"}
                      className="text-lg hover:text-fuchsia-300 transition-colors py-2"
                    >
                      {isLogged ? "Mi Cuenta" : "Iniciar sesión"}
                    </a>

                    {isLogged && (
                      <button
                        onClick={handleLogout}
                        className="mt-4 text-lg bg-red-600/30 hover:bg-red-600/40 px-4 py-2 rounded-lg text-red-200 border border-red-400/40"
                      >
                        Cerrar sesión
                      </button>
                    )}
                  </nav>
                </SheetContent>
              </Sheet>
            </div>

            <p className="text-[11px] sm:text-xs text-fuchsia-100">
              {isLogged ? (
                <>
                  Bienvenido,{" "}
                  <span className="font-semibold">{usuarioNombre}</span>
                </>
              ) : (
                "Bienvenido, Invitado"
              )}
            </p>
          </div>
        </div>

        {/* Mobile Search overlay */}
        {isSearchOpen && (
          <div className="md:hidden fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm">
            <div className="px-4 pt-16" ref={searchRef}>
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-purple-600" />
                <Input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  onFocus={handleSearchFocus}
                  placeholder={placeholderOptions[placeholderIndex]}
                  autoFocus
                  className="
                    pl-10 pr-12 py-5 rounded-full
                    border-2 border-fuchsia-500/40
                    bg-white/95 focus:bg-white focus:border-fuchsia-500
                    text-sm
                    text-purple-900 placeholder:text-purple-400
                  "
                />
                <button
                  type="button"
                  onClick={handleVoiceSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-fuchsia-600 hover:text-fuchsia-700"
                  aria-label="Búsqueda por voz"
                >
                  <Mic className="h-5 w-5" />
                </button>

                {renderSearchDropdown()}
              </div>

              <button
                type="button"
                className="mt-4 text-xs text-fuchsia-200 underline"
                onClick={() => {
                  setIsSearchOpen(false);
                  setShowSuggestions(false);
                }}
              >
                Cerrar búsqueda
              </button>
            </div>
          </div>
        )}

        {/* Desktop Categories */}
        <nav className="hidden md:flex items-center gap-1 pb-3 overflow-x-auto">
          {menuCategories.map((cat) => (
            <Button
              key={cat.id}
              variant="ghost"
              className="text-white hover:bg-white/20 hover:text-fuchsia-300 transition-colors whitespace-nowrap rounded-full"
              onClick={() => goToCategory(cat.id)}
            >
              {cat.nombre}
            </Button>
          ))}
        </nav>
      </div>

      <style>{`
        .kuromi-text {
          background: linear-gradient(90deg, #FF1493, #FF69B4, #BA55D3, #9370DB);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          font-weight: bold;
        }

        @keyframes ping-slow {
          0%   { transform: scale(1);    opacity: .65; }
          70%  { transform: scale(1.35); opacity: 0;   }
          100% { opacity: 0; }
        }
        .animate-ping-slow {
          animation: ping-slow 2.4s cubic-bezier(0,0,.2,1) infinite;
        }

        @keyframes kawaii-pop {
          0% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
            filter: hue-rotate(0deg);
          }
          25% {
            transform: scale(1.15) rotate(-6deg);
            filter: hue-rotate(20deg);
          }
          50% {
            transform: scale(1.15) rotate(6deg);
            filter: hue-rotate(-20deg);
          }
          80% {
            transform: scale(1.2) translateY(-4px);
            opacity: .9;
          }
          100% {
            transform: scale(0) translateY(-10px);
            opacity: 0;
          }
        }
        .animate-kawaii-pop {
          animation: kawaii-pop 0.6s ease-in-out forwards;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-ping-slow { animation: none !important; }
          .animate-kawaii-pop { animation: none !important; }
        }
      `}</style>
    </header>
  );
}
