-- ============================================================
--  TechMaster Mérida — Supabase Schema
--  Ejecuta esto en el SQL Editor de tu proyecto Supabase
-- ============================================================

-- CLIENTES
create table if not exists clientes (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  telefono    text,
  email       text,
  direccion   text,
  notas       text,
  created_at  timestamptz default now()
);

-- EQUIPOS (pueden ser varios por cliente)
create table if not exists equipos (
  id          uuid primary key default gen_random_uuid(),
  cliente_id  uuid references clientes(id) on delete cascade,
  tipo        text not null,       -- PC, Laptop, Impresora, Tablet, Otro
  marca       text,
  modelo      text,
  serie       text,
  color       text,
  descripcion text,                -- descripción/condición al recibirlo
  created_at  timestamptz default now()
);

-- ÓRDENES DE SERVICIO
create table if not exists ordenes (
  id              uuid primary key default gen_random_uuid(),
  folio           text unique,     -- TM-0001, TM-0002, ...
  cliente_id      uuid references clientes(id) on delete restrict,
  equipo_id       uuid references equipos(id) on delete restrict,
  fecha_ingreso   date not null default current_date,
  fecha_entrega   date,
  estado          text not null default 'Recibido',
  -- estados: Recibido | Diagnóstico | En proceso | Listo | Entregado | Cancelado
  descripcion_problema text,
  descripcion_servicio text,       -- se llena durante/al terminar el servicio
  observaciones   text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- PARTIDAS DE COBRO (items de la nota de pago)
create table if not exists partidas (
  id          uuid primary key default gen_random_uuid(),
  orden_id    uuid references ordenes(id) on delete cascade,
  concepto    text not null,
  cantidad    numeric(10,2) not null default 1,
  precio_unit numeric(10,2) not null default 0,
  subtotal    numeric(10,2) generated always as (cantidad * precio_unit) stored
);

-- HISTORIAL DE CAMBIOS DE ESTADO
create table if not exists historial (
  id          uuid primary key default gen_random_uuid(),
  orden_id    uuid references ordenes(id) on delete cascade,
  estado      text not null,
  nota        text,
  created_at  timestamptz default now()
);

-- ── Trigger: auto-update updated_at en ordenes ──────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;$$;

drop trigger if exists trg_ordenes_updated on ordenes;
create trigger trg_ordenes_updated
  before update on ordenes
  for each row execute function set_updated_at();

-- ── Trigger: insertar historial automáticamente ─────────────
create or replace function log_estado()
returns trigger language plpgsql as $$
begin
  if (tg_op = 'INSERT') or (old.estado is distinct from new.estado) then
    insert into historial(orden_id, estado)
    values (new.id, new.estado);
  end if;
  return new;
end;$$;

drop trigger if exists trg_historial on ordenes;
create trigger trg_historial
  after insert or update on ordenes
  for each row execute function log_estado();

-- ── Función para generar folio correlativo ──────────────────
create or replace function next_folio()
returns text language plpgsql as $$
declare
  n int;
begin
  select count(*) + 1 into n from ordenes;
  return 'TM-' || lpad(n::text, 4, '0');
end;$$;

-- ── RLS (Row Level Security) — habilita si usas auth ────────
-- alter table clientes enable row level security;
-- alter table equipos   enable row level security;
-- alter table ordenes   enable row level security;
-- alter table partidas  enable row level security;
-- alter table historial enable row level security;

-- ── Índices ──────────────────────────────────────────────────
create index if not exists idx_equipos_cliente   on equipos(cliente_id);
create index if not exists idx_ordenes_cliente   on ordenes(cliente_id);
create index if not exists idx_ordenes_equipo    on ordenes(equipo_id);
create index if not exists idx_ordenes_estado    on ordenes(estado);
create index if not exists idx_historial_orden   on historial(orden_id);
create index if not exists idx_partidas_orden    on partidas(orden_id);
