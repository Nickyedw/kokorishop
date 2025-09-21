--
-- PostgreSQL database dump
--

-- Dumped from database version 17.2
-- Dumped by pg_dump version 17.2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: carrito; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.carrito (
    id integer NOT NULL,
    usuario_id integer,
    estado character varying(20) DEFAULT 'activo'::character varying,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: carrito_detalle; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.carrito_detalle (
    id integer NOT NULL,
    carrito_id integer,
    producto_id integer,
    cantidad integer
);


--
-- Name: carrito_detalle_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.carrito_detalle_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: carrito_detalle_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.carrito_detalle_id_seq OWNED BY public.carrito_detalle.id;


--
-- Name: carrito_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.carrito_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: carrito_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.carrito_id_seq OWNED BY public.carrito.id;


--
-- Name: categorias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categorias (
    id integer NOT NULL,
    nombre character varying(50)
);


--
-- Name: categorias_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.categorias_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: categorias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.categorias_id_seq OWNED BY public.categorias.id;


--
-- Name: codigos_recuperacion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.codigos_recuperacion (
    id integer NOT NULL,
    correo character varying(100) NOT NULL,
    codigo character varying(6) NOT NULL,
    expiracion timestamp without time zone NOT NULL,
    usado boolean DEFAULT false,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: codigos_recuperacion_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.codigos_recuperacion_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: codigos_recuperacion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.codigos_recuperacion_id_seq OWNED BY public.codigos_recuperacion.id;


--
-- Name: comprobantes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comprobantes (
    id integer NOT NULL,
    venta_id integer,
    tipo character varying(20),
    serie character varying(10),
    numero character varying(10),
    pdf_url text,
    generado boolean DEFAULT false
);


--
-- Name: comprobantes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.comprobantes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: comprobantes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.comprobantes_id_seq OWNED BY public.comprobantes.id;


--
-- Name: configuracion_comprobante; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.configuracion_comprobante (
    id integer NOT NULL,
    ruc character varying(20),
    razon_social character varying(100),
    direccion_fiscal text,
    correo_facturacion character varying(100),
    logo_url text
);


--
-- Name: configuracion_comprobante_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.configuracion_comprobante_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: configuracion_comprobante_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.configuracion_comprobante_id_seq OWNED BY public.configuracion_comprobante.id;


--
-- Name: detalle_comprobante; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.detalle_comprobante (
    id integer NOT NULL,
    comprobante_id integer,
    descripcion text,
    monto numeric(10,2)
);


--
-- Name: detalle_comprobante_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.detalle_comprobante_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: detalle_comprobante_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.detalle_comprobante_id_seq OWNED BY public.detalle_comprobante.id;


--
-- Name: detalle_pedido; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.detalle_pedido (
    id integer NOT NULL,
    pedido_id integer,
    producto_id integer,
    cantidad integer NOT NULL,
    precio_unitario numeric(10,2) NOT NULL,
    subtotal numeric(10,2)
);


--
-- Name: detalle_pedido_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.detalle_pedido_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: detalle_pedido_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.detalle_pedido_id_seq OWNED BY public.detalle_pedido.id;


--
-- Name: detalle_venta; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.detalle_venta (
    id integer NOT NULL,
    venta_id integer,
    producto_id integer,
    cantidad integer,
    precio_unitario numeric(10,2)
);


--
-- Name: detalle_venta_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.detalle_venta_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: detalle_venta_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.detalle_venta_id_seq OWNED BY public.detalle_venta.id;


--
-- Name: favoritos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.favoritos (
    id integer NOT NULL,
    usuario_id integer,
    producto_id integer,
    agregado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: favoritos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.favoritos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: favoritos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.favoritos_id_seq OWNED BY public.favoritos.id;


--
-- Name: historial_estado_pedido; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.historial_estado_pedido (
    id integer NOT NULL,
    pedido_id integer,
    estado character varying(50),
    fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: historial_estado_pedido_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.historial_estado_pedido_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: historial_estado_pedido_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.historial_estado_pedido_id_seq OWNED BY public.historial_estado_pedido.id;


--
-- Name: historial_reposiciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.historial_reposiciones (
    id integer NOT NULL,
    producto_id integer,
    cantidad_agregada integer NOT NULL,
    stock_anterior integer NOT NULL,
    stock_nuevo integer NOT NULL,
    usuario_id integer,
    fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: historial_reposiciones_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.historial_reposiciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: historial_reposiciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.historial_reposiciones_id_seq OWNED BY public.historial_reposiciones.id;


--
-- Name: horarios_entrega; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.horarios_entrega (
    id integer NOT NULL,
    hora_inicio time without time zone NOT NULL,
    hora_fin time without time zone NOT NULL
);


--
-- Name: horarios_entrega_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.horarios_entrega_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: horarios_entrega_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.horarios_entrega_id_seq OWNED BY public.horarios_entrega.id;


--
-- Name: metodos_entrega; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.metodos_entrega (
    id integer NOT NULL,
    descripcion text,
    zona character varying(100),
    horario_disponible character varying(50)
);


--
-- Name: metodos_entrega_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.metodos_entrega_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: metodos_entrega_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.metodos_entrega_id_seq OWNED BY public.metodos_entrega.id;


--
-- Name: metodos_pago; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.metodos_pago (
    id integer NOT NULL,
    nombre character varying(50),
    instrucciones text,
    qr_url text
);


--
-- Name: metodos_pago_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.metodos_pago_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: metodos_pago_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.metodos_pago_id_seq OWNED BY public.metodos_pago.id;


--
-- Name: notificaciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notificaciones (
    id integer NOT NULL,
    usuario_id integer,
    tipo character varying(20),
    mensaje text,
    enviado boolean DEFAULT false,
    fecha_envio timestamp without time zone
);


--
-- Name: notificaciones_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notificaciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notificaciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notificaciones_id_seq OWNED BY public.notificaciones.id;


--
-- Name: pedidos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pedidos (
    id integer NOT NULL,
    usuario_id integer,
    fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    estado character varying(50) DEFAULT 'pendiente'::character varying,
    metodo_pago_id integer,
    zona_entrega_id integer,
    horario_entrega_id integer,
    notificado boolean DEFAULT false,
    total numeric(10,2),
    metodo_entrega_id integer,
    pago_confirmado boolean DEFAULT false,
    fecha_confirmacion_pago timestamp without time zone,
    comentario_pago text
);


--
-- Name: pedidos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pedidos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pedidos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pedidos_id_seq OWNED BY public.pedidos.id;


--
-- Name: producto_imagenes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.producto_imagenes (
    id integer NOT NULL,
    producto_id integer NOT NULL,
    url_imagen text NOT NULL,
    es_principal boolean DEFAULT false NOT NULL,
    orden integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: producto_imagenes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.producto_imagenes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: producto_imagenes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.producto_imagenes_id_seq OWNED BY public.producto_imagenes.id;


--
-- Name: productos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.productos (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text NOT NULL,
    precio numeric(10,2) NOT NULL,
    categoria_id integer NOT NULL,
    imagen_url text,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    stock_actual integer DEFAULT 0,
    stock_minimo integer DEFAULT 1,
    destacado boolean DEFAULT false,
    mas_vendido boolean DEFAULT false,
    en_oferta boolean DEFAULT false,
    precio_regular numeric(10,2)
);


--
-- Name: productos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.productos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: productos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.productos_id_seq OWNED BY public.productos.id;


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    nombre_completo character varying(100),
    correo character varying(100),
    telefono character varying(15),
    direccion text,
    es_admin boolean DEFAULT false,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    password character varying(255)
);


--
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- Name: ventas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ventas (
    id integer NOT NULL,
    usuario_id integer,
    fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    total numeric(10,2),
    estado_pago character varying(30) DEFAULT 'pendiente'::character varying,
    metodo_entrega_id integer,
    metodo_pago_id integer
);


--
-- Name: ventas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ventas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ventas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ventas_id_seq OWNED BY public.ventas.id;


--
-- Name: zonas_entrega; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.zonas_entrega (
    id integer NOT NULL,
    nombre_zona character varying(100) NOT NULL,
    descripcion text
);


--
-- Name: zonas_entrega_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.zonas_entrega_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: zonas_entrega_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.zonas_entrega_id_seq OWNED BY public.zonas_entrega.id;


--
-- Name: carrito id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carrito ALTER COLUMN id SET DEFAULT nextval('public.carrito_id_seq'::regclass);


--
-- Name: carrito_detalle id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carrito_detalle ALTER COLUMN id SET DEFAULT nextval('public.carrito_detalle_id_seq'::regclass);


--
-- Name: categorias id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias ALTER COLUMN id SET DEFAULT nextval('public.categorias_id_seq'::regclass);


--
-- Name: codigos_recuperacion id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.codigos_recuperacion ALTER COLUMN id SET DEFAULT nextval('public.codigos_recuperacion_id_seq'::regclass);


--
-- Name: comprobantes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comprobantes ALTER COLUMN id SET DEFAULT nextval('public.comprobantes_id_seq'::regclass);


--
-- Name: configuracion_comprobante id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuracion_comprobante ALTER COLUMN id SET DEFAULT nextval('public.configuracion_comprobante_id_seq'::regclass);


--
-- Name: detalle_comprobante id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_comprobante ALTER COLUMN id SET DEFAULT nextval('public.detalle_comprobante_id_seq'::regclass);


--
-- Name: detalle_pedido id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_pedido ALTER COLUMN id SET DEFAULT nextval('public.detalle_pedido_id_seq'::regclass);


--
-- Name: detalle_venta id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_venta ALTER COLUMN id SET DEFAULT nextval('public.detalle_venta_id_seq'::regclass);


--
-- Name: favoritos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favoritos ALTER COLUMN id SET DEFAULT nextval('public.favoritos_id_seq'::regclass);


--
-- Name: historial_estado_pedido id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_estado_pedido ALTER COLUMN id SET DEFAULT nextval('public.historial_estado_pedido_id_seq'::regclass);


--
-- Name: historial_reposiciones id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_reposiciones ALTER COLUMN id SET DEFAULT nextval('public.historial_reposiciones_id_seq'::regclass);


--
-- Name: horarios_entrega id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.horarios_entrega ALTER COLUMN id SET DEFAULT nextval('public.horarios_entrega_id_seq'::regclass);


--
-- Name: metodos_entrega id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metodos_entrega ALTER COLUMN id SET DEFAULT nextval('public.metodos_entrega_id_seq'::regclass);


--
-- Name: metodos_pago id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metodos_pago ALTER COLUMN id SET DEFAULT nextval('public.metodos_pago_id_seq'::regclass);


--
-- Name: notificaciones id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificaciones ALTER COLUMN id SET DEFAULT nextval('public.notificaciones_id_seq'::regclass);


--
-- Name: pedidos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pedidos ALTER COLUMN id SET DEFAULT nextval('public.pedidos_id_seq'::regclass);


--
-- Name: producto_imagenes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.producto_imagenes ALTER COLUMN id SET DEFAULT nextval('public.producto_imagenes_id_seq'::regclass);


--
-- Name: productos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.productos ALTER COLUMN id SET DEFAULT nextval('public.productos_id_seq'::regclass);


--
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- Name: ventas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ventas ALTER COLUMN id SET DEFAULT nextval('public.ventas_id_seq'::regclass);


--
-- Name: zonas_entrega id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zonas_entrega ALTER COLUMN id SET DEFAULT nextval('public.zonas_entrega_id_seq'::regclass);


--
-- Data for Name: carrito; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.carrito (id, usuario_id, estado, creado_en) FROM stdin;
\.


--
-- Data for Name: carrito_detalle; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.carrito_detalle (id, carrito_id, producto_id, cantidad) FROM stdin;
\.


--
-- Data for Name: categorias; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categorias (id, nombre) FROM stdin;
1	Tecnología
2	Accesorios Kawaii
3	Juguetes
4	Hogar
5	Papelería
\.


--
-- Data for Name: codigos_recuperacion; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.codigos_recuperacion (id, correo, codigo, expiracion, usado, creado_en) FROM stdin;
1	egonzalesedwin@gmail.com	381136	2025-07-29 18:07:07.772	f	2025-07-29 17:52:07.938774
2	egonzalesedwin@gmail.com	722302	2025-07-29 18:28:18.968	f	2025-07-29 18:13:19.144198
3	egonzalesedwin@gmail.com	299504	2025-07-29 18:39:03.025	f	2025-07-29 18:24:03.208079
4	egonzalesedwin@gmail.com	647179	2025-07-29 18:46:10.681	f	2025-07-29 18:31:10.847554
5	egonzalesedwin@gmail.com	973122	2025-07-29 18:57:12.525	t	2025-07-29 18:42:12.695521
\.


--
-- Data for Name: comprobantes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.comprobantes (id, venta_id, tipo, serie, numero, pdf_url, generado) FROM stdin;
\.


--
-- Data for Name: configuracion_comprobante; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.configuracion_comprobante (id, ruc, razon_social, direccion_fiscal, correo_facturacion, logo_url) FROM stdin;
\.


--
-- Data for Name: detalle_comprobante; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.detalle_comprobante (id, comprobante_id, descripcion, monto) FROM stdin;
\.


--
-- Data for Name: detalle_pedido; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.detalle_pedido (id, pedido_id, producto_id, cantidad, precio_unitario, subtotal) FROM stdin;
1	1	1	2	25.00	50.00
2	1	2	1	10.50	10.50
3	2	1	2	39.90	79.80
4	2	3	1	15.90	15.90
5	3	1	2	39.90	79.80
6	3	3	1	15.90	15.90
7	4	5	2	49.90	99.80
8	4	6	1	59.90	59.90
9	5	5	1	49.90	49.90
10	5	6	2	59.90	119.80
11	6	5	1	49.90	49.90
12	6	6	2	59.90	119.80
13	7	5	1	49.90	49.90
14	7	6	2	59.90	119.80
15	8	5	1	49.90	49.90
16	8	6	2	59.90	119.80
17	9	5	1	49.90	49.90
18	9	6	2	59.90	119.80
19	10	5	1	49.90	49.90
20	10	6	2	59.90	119.80
21	11	5	1	49.90	49.90
22	11	6	2	59.90	119.80
23	12	5	1	49.90	49.90
24	12	6	2	59.90	119.80
25	13	5	1	49.90	49.90
26	13	6	2	59.90	119.80
27	14	5	1	49.90	49.90
28	14	6	2	59.90	119.80
29	15	5	1	49.90	49.90
30	15	6	2	59.90	119.80
31	16	5	1	49.90	49.90
32	16	6	2	59.90	119.80
33	17	5	1	49.90	49.90
34	17	6	2	59.90	119.80
35	18	5	1	49.90	49.90
36	18	6	2	59.90	119.80
37	19	5	1	49.90	49.90
38	19	6	2	59.90	119.80
39	20	5	1	49.90	49.90
40	20	6	2	59.90	119.80
41	21	5	1	49.90	49.90
42	21	6	2	59.90	119.80
43	22	5	1	49.90	49.90
44	22	6	2	59.90	119.80
45	23	5	1	49.90	49.90
46	23	6	2	59.90	119.80
47	24	5	1	49.90	49.90
48	24	6	2	59.90	119.80
49	25	5	1	49.90	49.90
50	25	6	2	59.90	119.80
51	26	13	2	80.00	160.00
52	27	13	1	80.00	80.00
53	27	12	1	35.00	35.00
54	27	6	1	59.90	59.90
55	28	12	4	35.00	140.00
56	29	6	1	59.90	59.90
57	29	13	1	80.00	80.00
58	30	12	2	35.00	70.00
59	31	6	2	59.90	119.80
60	32	13	1	80.00	80.00
61	32	6	1	59.90	59.90
62	33	13	1	80.00	80.00
63	34	13	2	80.00	160.00
64	35	12	1	35.00	35.00
65	35	6	2	59.90	119.80
66	36	6	2	59.90	119.80
67	37	13	2	80.00	160.00
68	37	12	2	35.00	70.00
69	37	6	3	59.90	179.70
70	38	13	1	80.00	80.00
71	39	12	1	35.00	35.00
72	39	6	1	59.90	59.90
73	40	12	1	35.00	35.00
74	40	13	1	80.00	80.00
75	40	6	1	59.90	59.90
76	41	15	1	42.50	42.50
77	41	13	1	80.00	80.00
78	42	6	11	59.90	658.90
79	43	6	10	59.90	599.00
80	44	6	1	59.90	59.90
81	45	6	2	59.90	119.80
82	46	1	1	35.91	35.91
83	46	3	1	15.90	15.90
84	47	2	1	25.07	25.07
85	47	15	1	44.50	44.50
86	48	5	3	49.90	149.70
87	49	15	1	44.50	44.50
88	50	2	1	25.07	25.07
89	50	1	1	35.91	35.91
90	51	15	1	44.50	44.50
91	51	3	1	15.90	15.90
92	51	2	1	25.07	25.07
93	52	13	1	80.00	80.00
94	52	12	1	35.00	35.00
95	52	1	1	35.91	35.91
96	52	15	1	44.50	44.50
97	52	6	1	59.90	59.90
98	52	3	1	15.90	15.90
99	52	2	1	25.07	25.07
100	53	13	1	80.00	80.00
101	53	5	1	49.90	49.90
102	53	12	1	35.00	35.00
103	53	1	1	35.91	35.91
104	53	2	2	25.07	50.14
105	53	15	1	44.50	44.50
106	54	5	1	49.90	49.90
107	54	13	1	80.00	80.00
108	55	15	1	44.50	44.50
109	55	1	1	35.91	35.91
110	55	2	1	25.07	25.07
111	56	15	1	44.50	44.50
112	56	1	1	35.91	35.91
113	57	6	1	59.90	59.90
114	57	5	1	49.90	49.90
115	57	15	1	44.50	44.50
116	57	13	1	80.00	80.00
117	57	12	1	35.00	35.00
118	57	1	1	35.91	35.91
119	57	2	1	25.07	25.07
120	57	3	1	15.90	15.90
121	58	5	1	49.90	49.90
122	58	6	1	59.90	59.90
123	58	15	1	44.50	44.50
124	58	13	1	80.00	80.00
125	58	12	1	35.00	35.00
126	58	1	1	35.91	35.91
127	58	2	1	25.07	25.07
128	58	3	1	15.90	15.90
129	59	5	1	49.90	49.90
130	59	6	1	59.90	59.90
131	59	15	1	44.50	44.50
132	59	13	1	80.00	80.00
133	59	12	1	35.00	35.00
134	59	1	1	35.91	35.91
135	59	2	1	25.07	25.07
136	59	3	1	15.90	15.90
137	60	6	1	59.90	59.90
138	60	5	1	49.90	49.90
139	60	15	1	44.50	44.50
140	60	13	1	80.00	80.00
141	60	12	1	35.00	35.00
142	60	1	1	35.91	35.91
143	60	3	1	15.90	15.90
144	60	2	1	25.07	25.07
145	61	6	1	59.90	59.90
\.


--
-- Data for Name: detalle_venta; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.detalle_venta (id, venta_id, producto_id, cantidad, precio_unitario) FROM stdin;
\.


--
-- Data for Name: favoritos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.favoritos (id, usuario_id, producto_id, agregado_en) FROM stdin;
\.


--
-- Data for Name: historial_estado_pedido; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.historial_estado_pedido (id, pedido_id, estado, fecha) FROM stdin;
\.


--
-- Data for Name: historial_reposiciones; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.historial_reposiciones (id, producto_id, cantidad_agregada, stock_anterior, stock_nuevo, usuario_id, fecha) FROM stdin;
2	6	2	8	10	6	2025-08-06 00:46:54.335488
1	12	10	80	90	6	2025-08-06 00:15:55.661847
3	5	20	20	40	6	2025-08-06 01:03:59.958529
4	13	5	79	84	6	2025-08-08 01:21:39.609871
5	15	5	40	45	6	2025-08-10 01:35:31.735684
6	15	10	45	55	6	2025-08-29 11:24:07.616914
\.


--
-- Data for Name: horarios_entrega; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.horarios_entrega (id, hora_inicio, hora_fin) FROM stdin;
1	10:00:00	12:00:00
2	12:00:00	14:00:00
3	14:00:00	16:00:00
4	16:00:00	18:00:00
5	18:00:00	20:00:00
\.


--
-- Data for Name: metodos_entrega; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.metodos_entrega (id, descripcion, zona, horario_disponible) FROM stdin;
1	Recojo en punto céntrico de Lima	Centro de Lima	10:00 - 12:00
2	Entrega en puerta de casa	San Borja	12:00 - 14:00
3	Recojo en parque principal	Miraflores	14:00 - 16:00
4	Entrega en estación de bus	Los Olivos	16:00 - 18:00
5	Recojo en mall local	La Molina	18:00 - 20:00
\.


--
-- Data for Name: metodos_pago; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.metodos_pago (id, nombre, instrucciones, qr_url) FROM stdin;
1	Transferencia bancaria	Transfiere al BCP - Cta: 123-45678901-0-99 a nombre de KokoShop SAC. Enviar voucher a WhatsApp +51 912 345 678	\N
2	Yape	Escanea el QR o transfiere al número +51 912 345 678. Enviar captura por WhatsApp.	https://tuweb.com/qr/yape.png
3	Plin	Escanea el QR de Plin o transfiere a +51 912 345 678. Enviar captura.	https://tuweb.com/qr/plin.png
4	Efectivo al momento de entrega	Pago en efectivo al momento de entrega. Puedes indicar si necesitas vuelto.	\N
\.


--
-- Data for Name: notificaciones; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notificaciones (id, usuario_id, tipo, mensaje, enviado, fecha_envio) FROM stdin;
\.


--
-- Data for Name: pedidos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pedidos (id, usuario_id, fecha, estado, metodo_pago_id, zona_entrega_id, horario_entrega_id, notificado, total, metodo_entrega_id, pago_confirmado, fecha_confirmacion_pago, comentario_pago) FROM stdin;
1	1	2025-06-08 20:12:08.27847	pendiente	1	1	1	f	60.50	1	f	\N	\N
2	6	2025-06-09 00:20:54.818146	pendiente	1	1	1	f	95.70	1	f	\N	\N
3	6	2025-06-09 00:37:40.117454	pendiente	1	1	1	f	95.70	1	f	\N	\N
4	6	2025-06-10 00:07:28.36681	pendiente	1	1	1	f	159.70	1	f	\N	\N
27	6	2025-07-27 12:40:14.733246	pendiente	1	1	1	f	174.90	1	f	\N	\N
28	6	2025-07-27 13:01:51.382063	pendiente	1	1	1	f	140.00	1	f	\N	\N
29	6	2025-07-27 13:06:32.221131	pendiente	1	1	1	f	139.90	1	f	\N	\N
30	6	2025-07-27 13:45:38.832502	pendiente	1	1	1	f	70.00	1	f	\N	\N
31	6	2025-07-27 14:11:01.488331	pendiente	1	1	1	f	119.80	1	f	\N	\N
32	6	2025-07-27 14:15:47.285273	pendiente	1	1	1	f	139.90	1	f	\N	\N
33	6	2025-07-28 18:50:31.155222	pendiente	1	1	1	f	80.00	1	f	\N	\N
34	6	2025-07-28 22:22:55.127227	pendiente	2	1	1	f	160.00	4	f	\N	\N
35	6	2025-07-28 22:27:03.154125	pendiente	3	1	1	f	154.80	4	f	\N	\N
36	6	2025-07-28 22:39:55.153247	pendiente	4	1	2	f	119.80	1	f	\N	\N
37	6	2025-07-29 10:11:04.723238	pendiente	3	1	4	f	409.70	4	f	\N	\N
38	6	2025-07-30 23:56:24.030308	pendiente	4	1	1	f	80.00	1	f	\N	100
39	6	2025-07-31 00:00:17.619559	pendiente	1	1	1	f	94.90	4	f	\N	
40	6	2025-07-31 00:27:10.526067	pendiente	2	1	3	f	174.90	2	f	\N	Realiza el pago por Yape al número 987654321 o escanea el QR.
41	6	2025-08-03 19:59:36.292241	pendiente	1	1	4	f	122.50	2	f	\N	Transferir a la cuenta 123-456-789 del Banco XYZ y enviar el comprobante por WhatsApp.
42	6	2025-08-03 20:00:40.54504	pendiente	2	2	1	f	658.90	4	f	\N	Realiza el pago por Yape al número 987654321 o escanea el QR.
7	6	2025-06-10 00:23:25.584543	pago confirmado	1	1	1	f	169.70	1	t	2025-06-14 14:58:47.191	\N
6	6	2025-06-10 00:15:26.630064	pago confirmado	1	1	1	f	169.70	1	t	2025-06-14 16:16:59.832	\N
20	6	2025-06-17 00:06:08.258876	listo para entrega	1	1	1	f	169.70	1	t	2025-06-17 00:06:55.723	\N
19	6	2025-06-15 22:21:32.336144	listo para entrega	1	1	1	f	169.70	1	t	2025-06-15 22:22:31.282	\N
46	6	2025-09-07 19:18:20.139428	pedido entregado	1	1	3	f	51.81	4	t	2025-09-07 19:18:41.718	Transferir a la cuenta 123-456-789 del Banco XYZ y enviar el comprobante por WhatsApp.
43	6	2025-08-03 23:19:23.009836	pago confirmado	3	1	1	f	599.00	5	t	2025-08-12 21:42:57.451	Realiza el pago por Plin al número 987654321 o escanea el QR.
18	6	2025-06-15 22:16:08.887771	listo para entrega	1	1	1	f	169.70	1	t	2025-06-15 22:18:29.944	\N
17	7	2025-06-15 01:17:22.663144	listo para entrega	1	1	1	f	169.70	1	t	2025-06-15 01:19:09.296	\N
21	6	2025-06-18 21:39:05.692219	listo para entrega	1	1	1	f	169.70	1	t	2025-06-18 21:41:26.987	\N
44	6	2025-08-14 22:00:09.631078	pedido entregado	2	1	4	f	59.90	1	t	2025-08-29 11:24:33.466	Realiza el pago por Yape al número 987654321 o escanea el QR.
16	6	2025-06-15 01:11:47.243501	listo para entrega	1	1	1	f	169.70	1	t	2025-06-15 01:12:13.152	\N
22	6	2025-06-18 21:43:05.267644	pedido entregado	1	1	1	f	169.70	1	t	2025-06-18 21:43:24.058	\N
15	6	2025-06-15 01:03:21.943631	pago confirmado	1	1	1	f	169.70	1	t	2025-06-15 01:04:09.434	\N
14	6	2025-06-15 00:56:59.757842	pago confirmado	1	1	1	f	169.70	1	t	2025-06-15 00:57:57.523	\N
13	6	2025-06-14 23:42:10.090163	pago confirmado	1	1	1	f	169.70	1	t	2025-06-15 00:42:00.703	\N
12	6	2025-06-12 02:00:31.779015	pago confirmado	1	1	1	f	169.70	1	t	2025-06-13 00:54:33.731	\N
5	6	2025-06-10 00:14:13.068943	pendiente	1	1	1	f	169.70	1	t	2025-07-05 18:02:31.545	\N
25	6	2025-07-05 18:11:32.880987	pendiente	1	1	1	f	169.70	1	f	\N	\N
47	6	2025-09-07 19:24:00.069523	pedido entregado	3	3	3	f	69.57	2	t	2025-09-07 19:24:27.133	Realiza el pago por Plin al número 987654321 o escanea el QR.
53	6	2025-09-07 22:16:05.872945	pedido entregado	1	2	3	f	295.45	4	t	2025-09-07 22:16:23.692	Transferir a la cuenta 123-456-789 del Banco XYZ y enviar el comprobante por WhatsApp.
23	6	2025-06-18 22:53:57.243628	pago confirmado	1	1	1	f	169.70	1	t	2025-07-05 18:08:11.415	\N
11	6	2025-06-12 01:55:59.163768	pago confirmado	1	1	1	f	169.70	1	t	2025-06-14 03:08:07.891	\N
10	6	2025-06-12 01:34:36.865956	pago confirmado	1	1	1	f	169.70	1	t	2025-06-14 13:01:17.106	\N
9	6	2025-06-12 01:17:08.813094	pago confirmado	1	1	1	f	169.70	1	t	2025-06-14 14:43:34.435	\N
8	6	2025-06-12 01:14:59.546168	pago confirmado	1	1	1	f	169.70	1	t	2025-06-14 14:54:45.88	\N
49	6	2025-09-07 19:47:52.661242	pedido entregado	1	5	4	f	44.50	3	t	2025-09-07 19:48:06.534	Transferir a la cuenta 123-456-789 del Banco XYZ y enviar el comprobante por WhatsApp.
50	6	2025-09-07 21:14:33.421599	pedido entregado	1	2	1	f	60.98	4	t	2025-09-07 21:14:50.864	Transferir a la cuenta 123-456-789 del Banco XYZ y enviar el comprobante por WhatsApp.
24	6	2025-07-05 18:03:52.831349	pedido entregado	1	1	1	f	169.70	1	t	2025-07-05 18:11:51.598	\N
26	6	2025-07-26 00:28:01.721796	pendiente	1	1	1	f	160.00	1	f	\N	\N
48	6	2025-09-07 19:39:47.398295	pedido entregado	3	4	4	f	149.70	4	t	2025-09-07 19:40:26.217	Realiza el pago por Plin al número 987654321 o escanea el QR.
45	6	2025-09-07 19:11:57.936946	pedido entregado	4	1	1	f	119.80	4	t	2025-09-07 19:13:14.117	llevare 120 soles
51	6	2025-09-07 21:29:34.506639	pedido entregado	2	1	4	f	85.47	4	t	2025-09-07 21:29:54.78	Realiza el pago por Yape al número 987654321 o escanea el QR.
57	6	2025-09-07 22:37:21.383248	pedido entregado	1	2	3	f	346.18	5	t	2025-09-07 22:37:41.715	Transferir a la cuenta 123-456-789 del Banco XYZ y enviar el comprobante por WhatsApp.
52	6	2025-09-07 21:59:15.988011	pedido entregado	1	2	1	f	296.28	2	t	2025-09-07 21:59:37.271	Transferir a la cuenta 123-456-789 del Banco XYZ y enviar el comprobante por WhatsApp.
55	6	2025-09-07 22:24:18.315382	pedido entregado	2	2	2	f	105.48	2	t	2025-09-07 22:24:35.618	Realiza el pago por Yape al número 987654321 o escanea el QR.
54	6	2025-09-07 22:21:57.82596	pedido entregado	1	3	2	f	129.90	4	t	2025-09-07 22:22:12.264	Transferir a la cuenta 123-456-789 del Banco XYZ y enviar el comprobante por WhatsApp.
56	6	2025-09-07 22:29:24.472069	pedido entregado	3	2	2	f	80.41	5	t	2025-09-07 22:29:35.316	Realiza el pago por Plin al número 987654321 o escanea el QR.
58	6	2025-09-07 23:13:23.114361	pedido entregado	2	3	1	f	346.18	2	t	2025-09-07 23:13:49.729	Realiza el pago por Yape al número 987654321 o escanea el QR.
59	6	2025-09-07 23:18:18.816093	pedido entregado	3	4	2	f	346.18	4	t	2025-09-07 23:18:32.809	Realiza el pago por Plin al número 987654321 o escanea el QR.
60	6	2025-09-07 23:24:19.616046	pendiente	1	1	1	f	346.18	4	t	2025-09-07 23:24:32.793	Transferir a la cuenta 123-456-789 del Banco XYZ y enviar el comprobante por WhatsApp.
61	6	2025-09-07 23:32:24.271062	pendiente	1	3	2	f	59.90	3	t	2025-09-07 23:32:48.607	Transferir a la cuenta 123-456-789 del Banco XYZ y enviar el comprobante por WhatsApp.
\.


--
-- Data for Name: producto_imagenes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.producto_imagenes (id, producto_id, url_imagen, es_principal, orden, created_at) FROM stdin;
23	15	/uploads/productos/1755711102088-carro.jpg	f	0	2025-08-20 12:31:42.422503
24	15	/uploads/productos/1755713892749-images_dig.jpg	f	0	2025-08-20 13:18:12.759063
\.


--
-- Data for Name: productos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.productos (id, nombre, descripcion, precio, categoria_id, imagen_url, creado_en, stock_actual, stock_minimo, destacado, mas_vendido, en_oferta, precio_regular) FROM stdin;
5	Peluches Mini	Pack de 3 peluches suaves con diseño kawaii.	49.90	3	/uploads/productos/1755393659000-pack_peluches_mini.jpg	2025-06-07 23:04:17.04188	31	1	f	f	f	49.90
15	Linterna Marvel	Marvel	44.50	2	/uploads/productos/1755710766638-linterna_marvel.jpg	2025-08-03 19:47:21.684784	44	1	f	f	f	44.50
13	Carro NFS	Version premiun	80.00	3	/uploads/productos/1755393589880-carro_nfs.jpg	2025-07-24 23:18:16.013339	83	1	f	f	f	80.00
12	Peluches Stich y Lilo	peli 2025	35.00	3	/uploads/productos/1755393600602-peluche_stich_lilo.jpg	2025-07-23 18:59:03.452268	84	1	f	t	f	35.00
1	Mini Lámpara LED Panda	Lámpara kawaii recargable con forma de panda.	35.91	4	/uploads/productos/1755393710196-minilampara_kawaii.jpg	2025-06-07 23:04:17.04188	5	1	f	f	t	39.90
3	Cuaderno de Unicornio	Cuaderno con tapa dura y diseño de unicornio mágico.	15.90	5	/uploads/productos/1755393684502-cuaderno_unicornio.jpg	2025-06-07 23:04:17.04188	23	1	f	f	f	15.90
2	Mouse Inalámbrico Kawaii	Mouse ergonómico con diseño de gato.	25.07	1	/uploads/productos/1755393698431-mouse_inalambrico.jpg	2025-06-07 23:04:17.04188	14	1	f	f	t	29.50
6	Audífonos Bluetooth KUROMI	Audífonos con diseño de KUROMI	59.90	1	/uploads/productos/1755393634245-audifonos_kawaii.jpg	2025-06-07 23:04:17.04188	1	1	f	t	f	59.90
4	Set de Stickers Kawaii	Paquete con más de 100 stickers adorables.	12.00	5	/uploads/productos/1755393675381-stickers_kawaii.jpg	2025-06-07 23:04:17.04188	40	1	f	f	f	12.00
\.


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.usuarios (id, nombre_completo, correo, telefono, direccion, es_admin, creado_en, password) FROM stdin;
2	Carlos Torres	carlos.torres@example.com	912345678	Calle Falsa 456, Lima	f	2025-06-08 20:05:36.984416	\N
3	Lucía Fernández	lucia.fernandez@example.com	956781234	Jr. Las Gardenias 789, Arequipa	f	2025-06-08 20:05:36.984416	\N
4	Pedro Ramírez	pedro.ramirez@example.com	965432187	Pasaje Los Rosales 321, Trujillo	f	2025-06-08 20:05:36.984416	\N
5	Admin Usuario	admin@kokoshop.com	900111222	Sede Central, Lima	t	2025-06-08 20:05:36.984416	\N
7	Jenny Villalobos	jakeliny082016@gmail.com	+51926908626	Las Praderas 1206, Lima	f	2025-06-15 01:16:39.703553	$2b$10$NvI0lY1h7E7c2ToOtGvHDOl8FEIQBQe44uP3jbdy4WCNDKWusonJ6
10	Pepe Soto	probando2@gmail.com	+51977546073	Mz E block E29 dpto 1206	f	2025-07-28 18:53:04.68042	$2b$10$9AW01LteNmrnx0yC4bgn7e.gGVPvtPxl8L16ReSM0NeWycQR09I7W
11	Miguel Mateos	probando3@gmail.com	+51977546073	Mz E block E29 dpto 1206	f	2025-07-29 10:23:59.893351	$2b$10$kN9gWhg8GbsS5Oyr/N2zze5NdcQD9xhu76AfT79qCcm7Em.Jr9ZiC
6	Edwin Gonzales Estrada	egonzalesedwin@gmail.com	+51977546073	Las Praderas 1206, Lima	t	2025-06-08 22:43:23.640997	$2b$10$e.zGBL9jHlRMGGhkMM9KoemosaXQLOmz79sXKGlezyJ5qWspyjzUG
1	María López	maria.lopez@example.com	987654321	Av. Los Olivos 123, Lima	f	2025-06-08 20:05:36.984416	\N
12	Juanita Perez Salcedo	probando4@gmail.com	+51977546073	Mz E block E29 dpto 1206	t	2025-08-01 22:37:57.198205	$2b$10$V.3FPmUOkTgYzkJnVGFtje6ed9HUMK78Sz0v1P54wIMz757Clf.oK
13	Lupita Rojas Torres	probando5@gmail.com	+51977546073	Mz E block E29 dpto 1206	f	2025-08-01 22:59:19.128633	$2b$10$kQha5Z3UtHWHVPO1BnCbZuusfbvxZwwxohuDXAjiWA1AmMDYMi9/K
15	Cecilia Bazan Rivas	probando6@gmail.com	+51977546073	Mz E block E29 dpto 1206	f	2025-08-01 23:30:27.181491	$2b$10$ZcMVBLljOtVGmJsZ3F1kP.F.E3kNNYIrD0lKmvoCIfQYVa7N/M45.
16	Carlos Toribio	probando7@gmail.com	+51977546073	Mz E block E29 dpto 1206	f	2025-08-01 23:53:48.268498	$2b$10$T2Qg1YjGIlJodeYlpsazdOWcj5acD2Zniu0qwHwAAGEqgwJDl0HAC
17	Carolina Gutierrez	probando8@gmail.com	123456789	av ricardo palma 123	f	2025-08-29 10:55:19.985856	$2b$10$jcgLIS4B/0wy1iBqmtygUu3/mrQpciRNwWROoGKCZw2GhZ28eG12W
18	Pablo Escobar	probando9@gmail.com	+51456789632	av. pandora 523	f	2025-09-02 22:26:05.757335	$2b$10$x5Vr/BW/Vrii22u6VkPYxOiuP0w7YFpSwyzckey4.stNfpwD3/x/2
\.


--
-- Data for Name: ventas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ventas (id, usuario_id, fecha, total, estado_pago, metodo_entrega_id, metodo_pago_id) FROM stdin;
\.


--
-- Data for Name: zonas_entrega; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.zonas_entrega (id, nombre_zona, descripcion) FROM stdin;
1	Centro de Lima	Puntos de recojo en el centro histórico
2	San Borja	Entrega en estaciones principales
3	Miraflores	Entregas en parques o centros comerciales
4	Los Olivos	Zonas cercanas a la municipalidad
5	La Molina	Puntos seguros cerca de avenidas principales
\.


--
-- Name: carrito_detalle_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.carrito_detalle_id_seq', 1, false);


--
-- Name: carrito_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.carrito_id_seq', 1, false);


--
-- Name: categorias_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.categorias_id_seq', 5, true);


--
-- Name: codigos_recuperacion_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.codigos_recuperacion_id_seq', 5, true);


--
-- Name: comprobantes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.comprobantes_id_seq', 1, false);


--
-- Name: configuracion_comprobante_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.configuracion_comprobante_id_seq', 1, false);


--
-- Name: detalle_comprobante_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.detalle_comprobante_id_seq', 1, false);


--
-- Name: detalle_pedido_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.detalle_pedido_id_seq', 145, true);


--
-- Name: detalle_venta_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.detalle_venta_id_seq', 1, false);


--
-- Name: favoritos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.favoritos_id_seq', 1, false);


--
-- Name: historial_estado_pedido_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.historial_estado_pedido_id_seq', 1, false);


--
-- Name: historial_reposiciones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.historial_reposiciones_id_seq', 6, true);


--
-- Name: horarios_entrega_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.horarios_entrega_id_seq', 5, true);


--
-- Name: metodos_entrega_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.metodos_entrega_id_seq', 5, true);


--
-- Name: metodos_pago_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.metodos_pago_id_seq', 4, true);


--
-- Name: notificaciones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notificaciones_id_seq', 1, false);


--
-- Name: pedidos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.pedidos_id_seq', 61, true);


--
-- Name: producto_imagenes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.producto_imagenes_id_seq', 24, true);


--
-- Name: productos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.productos_id_seq', 15, true);


--
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 18, true);


--
-- Name: ventas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ventas_id_seq', 1, false);


--
-- Name: zonas_entrega_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.zonas_entrega_id_seq', 5, true);


--
-- Name: carrito_detalle carrito_detalle_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carrito_detalle
    ADD CONSTRAINT carrito_detalle_pkey PRIMARY KEY (id);


--
-- Name: carrito carrito_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carrito
    ADD CONSTRAINT carrito_pkey PRIMARY KEY (id);


--
-- Name: categorias categorias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias
    ADD CONSTRAINT categorias_pkey PRIMARY KEY (id);


--
-- Name: codigos_recuperacion codigos_recuperacion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.codigos_recuperacion
    ADD CONSTRAINT codigos_recuperacion_pkey PRIMARY KEY (id);


--
-- Name: comprobantes comprobantes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comprobantes
    ADD CONSTRAINT comprobantes_pkey PRIMARY KEY (id);


--
-- Name: configuracion_comprobante configuracion_comprobante_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuracion_comprobante
    ADD CONSTRAINT configuracion_comprobante_pkey PRIMARY KEY (id);


--
-- Name: detalle_comprobante detalle_comprobante_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_comprobante
    ADD CONSTRAINT detalle_comprobante_pkey PRIMARY KEY (id);


--
-- Name: detalle_pedido detalle_pedido_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_pedido
    ADD CONSTRAINT detalle_pedido_pkey PRIMARY KEY (id);


--
-- Name: detalle_venta detalle_venta_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_venta
    ADD CONSTRAINT detalle_venta_pkey PRIMARY KEY (id);


--
-- Name: favoritos favoritos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favoritos
    ADD CONSTRAINT favoritos_pkey PRIMARY KEY (id);


--
-- Name: historial_estado_pedido historial_estado_pedido_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_estado_pedido
    ADD CONSTRAINT historial_estado_pedido_pkey PRIMARY KEY (id);


--
-- Name: historial_reposiciones historial_reposiciones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_reposiciones
    ADD CONSTRAINT historial_reposiciones_pkey PRIMARY KEY (id);


--
-- Name: horarios_entrega horarios_entrega_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.horarios_entrega
    ADD CONSTRAINT horarios_entrega_pkey PRIMARY KEY (id);


--
-- Name: metodos_entrega metodos_entrega_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metodos_entrega
    ADD CONSTRAINT metodos_entrega_pkey PRIMARY KEY (id);


--
-- Name: metodos_pago metodos_pago_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metodos_pago
    ADD CONSTRAINT metodos_pago_pkey PRIMARY KEY (id);


--
-- Name: notificaciones notificaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificaciones
    ADD CONSTRAINT notificaciones_pkey PRIMARY KEY (id);


--
-- Name: pedidos pedidos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_pkey PRIMARY KEY (id);


--
-- Name: producto_imagenes producto_imagenes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.producto_imagenes
    ADD CONSTRAINT producto_imagenes_pkey PRIMARY KEY (id);


--
-- Name: productos productos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_correo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_correo_key UNIQUE (correo);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: ventas ventas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ventas
    ADD CONSTRAINT ventas_pkey PRIMARY KEY (id);


--
-- Name: zonas_entrega zonas_entrega_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zonas_entrega
    ADD CONSTRAINT zonas_entrega_pkey PRIMARY KEY (id);


--
-- Name: idx_prod_img_orden; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_prod_img_orden ON public.producto_imagenes USING btree (producto_id, orden);


--
-- Name: idx_prod_img_producto_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_prod_img_producto_id ON public.producto_imagenes USING btree (producto_id);


--
-- Name: ux_producto_imagenes_prod_url; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_producto_imagenes_prod_url ON public.producto_imagenes USING btree (producto_id, url_imagen);


--
-- Name: carrito_detalle carrito_detalle_carrito_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carrito_detalle
    ADD CONSTRAINT carrito_detalle_carrito_id_fkey FOREIGN KEY (carrito_id) REFERENCES public.carrito(id);


--
-- Name: carrito_detalle carrito_detalle_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carrito_detalle
    ADD CONSTRAINT carrito_detalle_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id);


--
-- Name: carrito carrito_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carrito
    ADD CONSTRAINT carrito_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: comprobantes comprobantes_venta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comprobantes
    ADD CONSTRAINT comprobantes_venta_id_fkey FOREIGN KEY (venta_id) REFERENCES public.ventas(id);


--
-- Name: detalle_comprobante detalle_comprobante_comprobante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_comprobante
    ADD CONSTRAINT detalle_comprobante_comprobante_id_fkey FOREIGN KEY (comprobante_id) REFERENCES public.comprobantes(id);


--
-- Name: detalle_pedido detalle_pedido_pedido_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_pedido
    ADD CONSTRAINT detalle_pedido_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES public.pedidos(id) ON DELETE CASCADE;


--
-- Name: detalle_pedido detalle_pedido_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_pedido
    ADD CONSTRAINT detalle_pedido_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id);


--
-- Name: detalle_venta detalle_venta_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_venta
    ADD CONSTRAINT detalle_venta_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id);


--
-- Name: detalle_venta detalle_venta_venta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_venta
    ADD CONSTRAINT detalle_venta_venta_id_fkey FOREIGN KEY (venta_id) REFERENCES public.ventas(id);


--
-- Name: favoritos favoritos_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favoritos
    ADD CONSTRAINT favoritos_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id);


--
-- Name: favoritos favoritos_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favoritos
    ADD CONSTRAINT favoritos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: historial_estado_pedido historial_estado_pedido_pedido_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_estado_pedido
    ADD CONSTRAINT historial_estado_pedido_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES public.pedidos(id);


--
-- Name: historial_reposiciones historial_reposiciones_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_reposiciones
    ADD CONSTRAINT historial_reposiciones_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id);


--
-- Name: historial_reposiciones historial_reposiciones_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_reposiciones
    ADD CONSTRAINT historial_reposiciones_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: notificaciones notificaciones_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificaciones
    ADD CONSTRAINT notificaciones_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: pedidos pedidos_horario_entrega_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_horario_entrega_id_fkey FOREIGN KEY (horario_entrega_id) REFERENCES public.horarios_entrega(id);


--
-- Name: pedidos pedidos_metodo_entrega_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_metodo_entrega_id_fkey FOREIGN KEY (metodo_entrega_id) REFERENCES public.metodos_entrega(id);


--
-- Name: pedidos pedidos_metodo_pago_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_metodo_pago_id_fkey FOREIGN KEY (metodo_pago_id) REFERENCES public.metodos_pago(id);


--
-- Name: pedidos pedidos_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: pedidos pedidos_zona_entrega_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_zona_entrega_id_fkey FOREIGN KEY (zona_entrega_id) REFERENCES public.zonas_entrega(id);


--
-- Name: producto_imagenes producto_imagenes_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.producto_imagenes
    ADD CONSTRAINT producto_imagenes_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id) ON DELETE CASCADE;


--
-- Name: productos productos_categoria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.categorias(id);


--
-- Name: ventas ventas_metodo_entrega_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ventas
    ADD CONSTRAINT ventas_metodo_entrega_id_fkey FOREIGN KEY (metodo_entrega_id) REFERENCES public.metodos_entrega(id);


--
-- Name: ventas ventas_metodo_pago_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ventas
    ADD CONSTRAINT ventas_metodo_pago_id_fkey FOREIGN KEY (metodo_pago_id) REFERENCES public.metodos_pago(id);


--
-- Name: ventas ventas_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ventas
    ADD CONSTRAINT ventas_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- PostgreSQL database dump complete
--

