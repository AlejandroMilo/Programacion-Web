
import PocketBase from 'https://cdn.jsdelivr.net/npm/pocketbase@0.26.2/dist/pocketbase.es.mjs';

// CONEXIÓN CON POCKETBASE
const PB_URL = localStorage.getItem('piston_pb_url') || 'http://127.0.0.1:8091';
const pb = new PocketBase(PB_URL);

pb.autoCancellation(false);

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const state = {
  page: 'inicio',
  user: null,
  cache: {},
  search: '',
  filter: ''
};

const collections = [
  'clientes',
  'vehiculos',
  'ordenes',
  'trabajos',
  'repuestos',
  'orden_repuestos',
  'pagos',
  'movimientos_inventario',
  'mecanicos',
  'configuracion',
  'users'
];

const statusLabels = {
  recibida: 'Recibida',
  diagnostico: 'En diagnóstico',
  reparacion: 'En reparación',
  lista: 'Lista para entregar',
  entregada: 'Entregada',
  cancelada: 'Cancelada'
};

const money = n =>
  new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2
  }).format(Number(n || 0));

const date = d => d ? new Date(d).toLocaleDateString('es-ES') : '—';

const esc = s =>
  String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));

const notify = (msg, bad = false) => {
  const t = $('#toast');
  t.textContent = msg;
  t.className = 'toast show' + (bad ? ' bad' : '');
  setTimeout(() => t.className = 'toast', 2600);
};

const isAdmin = () => state.user?.role === 'admin';
const canManageUsers = () => isAdmin();

const statusPill = s =>
  `<span class="pill ${
    s === 'entregada' ? 'green' :
    s === 'cancelada' ? 'red' :
    s === 'lista' ? 'blue' :
    s === 'reparacion' ? 'orange' : 'yellow'
  }">${esc(statusLabels[s] || s || '—')}</span>`;

// FUNCIONES GENERALES DE POCKETBASE

async function list(name, options = {}) {
  const rows = await pb.collection(name).getFullList({
    sort: '-created',
    ...options
  });

  state.cache[name] = rows;
  return rows;
}

async function get(name, id) {
  return pb.collection(name).getOne(id);
}

async function create(name, data) {
  return pb.collection(name).create(data);
}

async function update(name, id, data) {
  return pb.collection(name).update(id, data);
}

async function remove(name, id) {
  return pb.collection(name).delete(id);
}

function rel(row, collection) {
  return row?.expand?.[collection] || null;
}

function clientName(id) {
  return state.cache.clientes?.find(x => x.id === id)?.nombre || 'Cliente';
}

function vehicleLabel(v) {
  return v ? `${v.marca} ${v.modelo} · ${v.matricula}` : 'Vehículo';
}

function mechanicName(id) {
  return state.cache.mecanicos?.find(x => x.id === id)?.nombre ||
    state.cache.users?.find(x => x.id === id)?.nombre ||
    'Sin asignar';
}

async function refreshBase() {
  await Promise.all([
    'clientes',
    'vehiculos',
    'ordenes',
    'repuestos',
    'pagos',
    'users',
    'trabajos',
    'orden_repuestos',
    'mecanicos',
    'configuracion',
    'movimientos_inventario'
  ].map(async n => {
    try {
      await list(n, {
        expand: n === 'ordenes'
          ? 'vehiculo,vehiculo.cliente,mecanico,mecanico_taller'
          : undefined
      });
    } catch (e) {
      state.cache[n] = [];
    }
  }));
}

// MODALES Y FORMULARIOS

function openModal(title, body, onSubmit) {
  const d = $('#modal');
  const host = $('#modalContent');

  host.innerHTML = `
    <div class="modal-title">
      <h2>${title}</h2>
      <button type="button" class="icon-btn" id="closeModal">✕</button>
    </div>
    ${body}
  `;

  $('#closeModal').onclick = () => d.close();

  const form = $('form', host);

  if (form) {
    form.onsubmit = async e => {
      e.preventDefault();

      const fd = new FormData(form);
      const data = Object.fromEntries(fd.entries());

      try {
        await onSubmit(data, fd);
        d.close();
        await render();
      } catch (err) {
        notify(err.message || 'No se pudo guardar', true);
      }
    };
  }

  d.showModal();
}

function field(
  label,
  name,
  type = 'text',
  value = '',
  required = true,
  opts = []
) {
  if (type === 'select') {
    return `
      <label>
        ${label}
        <select name="${name}" ${required ? 'required' : ''}>
          <option value="">Seleccionar…</option>
          ${opts.map(o => `
            <option
              value="${esc(o.value)}"
              ${String(value) === String(o.value) ? 'selected' : ''}
            >${esc(o.label)}</option>
          `).join('')}
        </select>
      </label>
    `;
  }

  return `
    <label>
      ${label}
      <input
        name="${name}"
        type="${type}"
        value="${esc(value)}"
        ${required ? 'required' : ''}
      >
    </label>
  `;
}

function formShell(fields, button = 'Guardar') {
  return `
    <form>
      <div class="form-grid">
        ${fields.join('')}
      </div>

      <div class="modal-actions">
        <button type="button" class="btn secondary" id="cancelModal">
          Cancelar
        </button>

        <button class="btn primary">${button}</button>
      </div>
    </form>
  `;
}

function bindCancel() {
  const b = $('#cancelModal');

  if (b) {
    b.onclick = () => $('#modal').close();
  }
}

function pageHeading(title, sub, button = '', action = '') {
  return `
    <div class="page-heading">
      <div>
        <h2>${title}</h2>
        <p>${sub}</p>
      </div>

      ${button
        ? `<button class="btn primary" id="${action}">${button}</button>`
        : ''
      }
    </div>
  `;
}

function table(headers, rows) {
  return `
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
        </thead>

        <tbody>
          ${rows.length
            ? rows.join('')
            : `<tr>
                <td colspan="${headers.length}">
                  <div class="empty">No hay registros para mostrar.</div>
                </td>
              </tr>`
          }
        </tbody>
      </table>
    </div>
  `;
}

function emptyPanel(text) {
  return `<div class="empty">${text}</div>`;
}

// INICIO / PANEL PRINCIPAL

async function dashboard() {
  const [orders, clients, vehicles, parts, payments] =
    await Promise.all([
      'ordenes',
      'clientes',
      'vehiculos',
      'repuestos',
      'pagos'
    ].map(n => list(n, n === 'ordenes'
      ? { expand: 'vehiculo,vehiculo.cliente,mecanico_taller' }
      : {}
    ).catch(() => [])));

  const open = orders.filter(o =>
    !['entregada', 'cancelada'].includes(o.estado)
  );

  const debt = orders.reduce(
    (s, o) => s + Math.max(
      0,
      Number(o.total || 0) - Number(o.pagado || 0)
    ),
    0
  );

  const low = parts.filter(
    p => Number(p.existencias) <= Number(p.minimo || 3)
  );

  const recent = [...orders]
    .sort((a, b) => b.created.localeCompare(a.created))
    .slice(0, 6);

  const rows = recent.map(o => `
    <div class="record">
      <div class="record-main">
        <b>
          ${esc(o.codigo || 'Orden')} ·
          ${esc(clientName(o.expand?.vehiculo?.cliente || ''))}
        </b>
        <small>
          ${esc(vehicleLabel(o.expand?.vehiculo))} ·
          ${date(o.fecha_entrada)}
        </small>
      </div>

      ${statusPill(o.estado)}
    </div>
  `);

  return `
    ${pageHeading(
      'Hola, ' + esc(state.user?.nombre || 'equipo'),
      'Resumen general del taller y actividad reciente'
    )}

    <div class="stats">
      <div class="stat">
        <span>Órdenes abiertas</span>
        <strong class="accent">${open.length}</strong>
      </div>

      <div class="stat">
        <span>Clientes registrados</span>
        <strong>${clients.length}</strong>
      </div>

      <div class="stat">
        <span>Vehículos</span>
        <strong>${vehicles.length}</strong>
      </div>

      <div class="stat">
        <span>Saldo pendiente</span>
        <strong>${money(debt)}</strong>
      </div>
    </div>

    <div class="columns">
      <section class="panel">
        <div class="panel-head">
          <h3>Órdenes recientes</h3>
          <button class="icon-btn" data-go="ordenes">Ver todas</button>
        </div>

        <div class="list">
          ${rows.length
            ? rows.join('')
            : emptyPanel('Todavía no hay órdenes registradas.')
          }
        </div>
      </section>

      <section>
        <div class="panel">
          <div class="panel-head">
            <h3>Inventario por agotarse</h3>
            <span class="pill ${low.length ? 'red' : 'green'}">
              ${low.length} alertas
            </span>
          </div>

          <div class="list">
            ${low.slice(0, 5).map(p => `
              <div class="record">
                <div class="record-main">
                  <b>${esc(p.nombre)}</b>
                  <small>Código: ${esc(p.codigo)}</small>
                </div>
                <span class="pill red">${p.existencias} uds.</span>
              </div>
            `).join('') ||
              emptyPanel('Todo el inventario está en niveles normales.')
            }
          </div>
        </div>

        <div class="panel">
          <h3>Accesos rápidos</h3>

          <div class="quick-grid">
            <button class="quick-link" data-go="ordenes">
              <b>＋ Nueva orden</b>
              <small>Registrar una visita</small>
            </button>

            <button class="quick-link" data-go="clientes">
              <b>♙ Cliente</b>
              <small>Agregar cliente</small>
            </button>

            <button class="quick-link" data-go="inventario">
              <b>▧ Repuesto</b>
              <small>Gestionar stock</small>
            </button>

            <button class="quick-link" data-go="pagos">
              <b>＄ Pago</b>
              <small>Registrar cobro</small>
            </button>
          </div>
        </div>
      </section>
    </div>
  `;
}

// ÓRDENES

async function ordersPage() {
  const orders = await list('ordenes', {
    expand: 'vehiculo,vehiculo.cliente,mecanico,mecanico_taller'
  });

  const rows = orders
    .filter(o =>
      !state.search ||
      `${o.codigo} ${o.problema} ${o.expand?.vehiculo?.matricula}`
        .toLowerCase()
        .includes(state.search.toLowerCase())
    )
    .map(o => `
      <tr>
        <td>
          <b>${esc(o.codigo || o.id.slice(0, 6))}</b>
          <small>${date(o.fecha_entrada)}</small>
        </td>

        <td>
          ${esc(
            o.expand?.vehiculo?.expand?.cliente?.nombre ||
            clientName(o.expand?.vehiculo?.cliente)
          )}
          <small>${esc(vehicleLabel(o.expand?.vehiculo))}</small>
        </td>

        <td>
          ${esc(
            o.expand?.mecanico_taller?.nombre ||
            o.expand?.mecanico?.nombre ||
            mechanicName(o.mecanico_taller || o.mecanico)
          )}
        </td>

        <td>${statusPill(o.estado)}</td>
        <td>${money(o.total)}</td>

        <td>
          <div class="table-actions">
            <button class="icon-btn" data-detail="${o.id}">Abrir</button>
            <button class="icon-btn" data-status="${o.id}">Estado</button>
          </div>
        </td>
      </tr>
    `);

  return `
    ${pageHeading(
      'Órdenes de servicio',
      'Controla las visitas, asignaciones y estados.',
      '＋ Nueva orden',
      'newOrder'
    )}

    <div class="toolbar">
      <input
        id="searchBox"
        placeholder="Buscar por código, matrícula o problema…"
        value="${esc(state.search)}"
      >

      <select id="statusFilter">
        <option value="">Todos los estados</option>
        ${Object.entries(statusLabels).map(([v, l]) =>
          `<option value="${v}">${l}</option>`
        ).join('')}
      </select>
    </div>

    ${table(
      ['Orden / fecha', 'Cliente / vehículo', 'Mecánico', 'Estado', 'Total', 'Acciones'],
      rows
    )}
  `;
}

async function newOrder() {
  const clients = await list('clientes');
  const vehicles = await list('vehiculos');

  const mechanics = (await list('mecanicos'))
    .filter(m => m.activo !== false);

  const f = [
    field(
      'Vehículo',
      'vehiculo',
      'select',
      '',
      true,
      vehicles.map(v => ({
        value: v.id,
        label: `${vehicleLabel(v)} — ${clientName(v.cliente)}`
      }))
    ),

    field(
      'Mecánico asignado',
      'mecanico_taller',
      'select',
      '',
      false,
      mechanics.map(m => ({
        value: m.id,
        label: m.nombre
      }))
    ),

    field(
      'Fecha de entrada',
      'fecha_entrada',
      'date',
      new Date().toISOString().slice(0, 10)
    ),

    `<label class="wide">
      Problema reportado
      <textarea name="problema" required></textarea>
    </label>`
  ];

  openModal(
    'Nueva orden de servicio',
    formShell(f, 'Crear orden'),
    async d => {
      d.codigo = 'OS-' + Date.now().toString().slice(-6);
      d.estado = 'recibida';
      d.fecha_entrada = new Date(
        d.fecha_entrada + 'T12:00:00'
      ).toISOString();
      d.total = 0;
      d.pagado = 0;

      await create('ordenes', d);
      notify('Orden creada correctamente');
    }
  );

  bindCancel();
}

async function orderDetail(id) {
  const o = await get('ordenes', id);
  const veh = await get('vehiculos', o.vehiculo);

  const works = await pb.collection('trabajos').getFullList({
    filter: `orden="${id}"`
  });

  const used = await pb.collection('orden_repuestos').getFullList({
    filter: `orden="${id}"`,
    expand: 'repuesto'
  });

  const pay = await pb.collection('pagos').getFullList({
    filter: `orden="${id}"`
  });

  const labor = works.reduce(
    (s, w) => s + Number(w.precio || 0),
    0
  );

  const parts = used.reduce(
    (s, r) => s + Number(r.cantidad) * Number(r.precio_unitario || 0),
    0
  );

  const total = labor + parts;

  const paid = pay.reduce(
    (s, p) => s + Number(p.importe || 0),
    0
  );

  await update('ordenes', id, {
    total,
    pagado: paid
  });

  const body = `
    <div class="stats">
      <div class="stat">
        <span>Mano de obra</span>
        <strong>${money(labor)}</strong>
      </div>

      <div class="stat">
        <span>Repuestos</span>
        <strong>${money(parts)}</strong>
      </div>

      <div class="stat">
        <span>Total</span>
        <strong class="accent">${money(total)}</strong>
      </div>

      <div class="stat">
        <span>Saldo</span>
        <strong>${money(total - paid)}</strong>
      </div>
    </div>

    <div class="panel">
      <h3>${esc(o.codigo)} · ${esc(vehicleLabel(veh))}</h3>
      <p class="muted">${esc(o.problema)}</p>

      <p>
        ${statusPill(o.estado)}
        &nbsp; Entrada: ${date(o.fecha_entrada)}
      </p>

      <div class="toolbar">
        <button class="btn secondary" id="addWork">＋ Trabajo</button>
        <button class="btn secondary" id="addPart">＋ Repuesto</button>
        <button class="btn secondary" id="addPayment">＋ Registrar pago</button>
        <button class="btn secondary" id="changeStatus">Cambiar estado</button>
      </div>
    </div>

    <div class="panel">
      <h3>Trabajos realizados</h3>

      ${works.map(w => `
        <div class="record">
          <b>${esc(w.descripcion)}</b>
          <b>${money(w.precio)}</b>
        </div>
      `).join('') || emptyPanel('No se han registrado trabajos.')}
    </div>

    <div class="panel">
      <h3>Repuestos utilizados</h3>

      ${used.map(r => `
        <div class="record">
          <div>
            <b>${esc(r.expand?.repuesto?.nombre || 'Repuesto')}</b>
            <small>${r.cantidad} × ${money(r.precio_unitario)}</small>
          </div>
          <b>${money(r.cantidad * r.precio_unitario)}</b>
        </div>
      `).join('') || emptyPanel('No se han utilizado repuestos.')}
    </div>

    <div class="panel">
      <h3>Pagos recibidos</h3>

      ${pay.map(p => `
        <div class="record">
          <div>
            <b>${money(p.importe)}</b>
            <small>${date(p.fecha)} · ${esc(p.metodo)}</small>
          </div>
          <span class="pill green">Registrado</span>
        </div>
      `).join('') || emptyPanel('No hay pagos registrados.')}
    </div>
  `;

  openModal(
    `Detalle ${esc(o.codigo)}`,
    body,
    async () => {}
  );

  $('#modalContent').querySelector('#addWork').onclick = () => addWork(id);
  $('#modalContent').querySelector('#addPart').onclick = () => addPart(id);
  $('#modalContent').querySelector('#addPayment').onclick = () =>
    addPayment(id, total - paid);
  $('#modalContent').querySelector('#changeStatus').onclick = () =>
    changeStatus(id);
}

async function addWork(id) {
  const f = [
    `<label class="wide">
      Descripción del trabajo
      <input name="descripcion" required>
    </label>`,

    field('Precio de mano de obra (USD)', 'precio', 'number', '', true)
  ];

  openModal(
    'Agregar trabajo',
    formShell(f),
    async d => {
      d.orden = id;
      d.precio = Number(d.precio);

      await create('trabajos', d);
      notify('Trabajo agregado');
    }
  );

  bindCancel();
}

async function addPart(id) {
  const parts = await list('repuestos');

  const f = [
    field(
      'Repuesto',
      'repuesto',
      'select',
      '',
      true,
      parts.map(p => ({
        value: p.id,
        label: `${p.nombre} (${p.existencias} disponibles)`
      }))
    ),

    field('Cantidad', 'cantidad', 'number', '1')
  ];

  openModal(
    'Agregar repuesto',
    formShell(f),
    async d => {
      const p = await get('repuestos', d.repuesto);
      const qty = Number(d.cantidad);

      if (qty < 1 || qty > Number(p.existencias)) {
        throw new Error(
          'Cantidad inválida o existencias insuficientes.'
        );
      }

      await create('orden_repuestos', {
        orden: id,
        repuesto: p.id,
        cantidad: qty,
        precio_unitario: p.precio_venta
      });

      await update('repuestos', p.id, {
        existencias: Number(p.existencias) - qty
      });

      notify('Repuesto añadido y existencias actualizadas');
    }
  );

  bindCancel();
}

async function addPayment(id, balance) {
  const f = [
    field('Importe (USD)', 'importe', 'number', '', true),

    field(
      'Método',
      'metodo',
      'select',
      'efectivo',
      true,
      ['efectivo', 'transferencia', 'tarjeta'].map(x => ({
        value: x,
        label: x[0].toUpperCase() + x.slice(1)
      }))
    ),

    field(
      'Fecha',
      'fecha',
      'date',
      new Date().toISOString().slice(0, 10)
    )
  ];

  openModal(
    'Registrar pago',
    formShell(f),
    async d => {
      const amount = Number(d.importe);

      if (amount <= 0 || amount > balance + 0.001) {
        throw new Error(
          'El importe debe ser positivo y no superar el saldo pendiente.'
        );
      }

      d.orden = id;
      d.fecha = new Date(d.fecha + 'T12:00:00').toISOString();

      await create('pagos', d);
      notify('Pago registrado');
    }
  );

  bindCancel();
}

async function changeStatus(id) {
  const f = [
    field(
      'Nuevo estado',
      'estado',
      'select',
      '',
      true,
      Object.entries(statusLabels).map(([value, label]) => ({
        value,
        label
      }))
    )
  ];

  openModal(
    'Actualizar estado',
    formShell(f),
    async d => {
      await update('ordenes', id, d);
      notify('Estado actualizado');
    }
  );

  bindCancel();
}

// CLIENTES

async function clientsPage() {
  const rows = (await list('clientes'))
    .filter(c =>
      !state.search ||
      `${c.nombre} ${c.telefono}`
        .toLowerCase()
        .includes(state.search.toLowerCase())
    )
    .map(c => `
      <tr>
        <td>
          <b>${esc(c.nombre)}</b>
          <small>${esc(c.direccion || 'Sin dirección')}</small>
        </td>

        <td>${esc(c.telefono)}</td>

        <td>
          ${(state.cache.vehiculos || []).filter(v => v.cliente === c.id).length}
        </td>

        <td>
          <button class="icon-btn" data-client="${c.id}">Ver ficha</button>
          <button class="icon-btn" data-edit-client="${c.id}">Editar</button>
        </td>
      </tr>
    `);

  return `
    ${pageHeading(
      'Clientes',
      'Directorio de clientes y sus vehículos.',
      '＋ Nuevo cliente',
      'newClient'
    )}

    <div class="toolbar">
      <input
        id="searchBox"
        placeholder="Buscar cliente o teléfono…"
        value="${esc(state.search)}"
      >
    </div>

    ${table(['Cliente', 'Teléfono', 'Vehículos', 'Acciones'], rows)}
  `;
}

async function clientForm(id) {
  const c = id ? await get('clientes', id) : {};

  const f = [
    field('Nombre completo', 'nombre', 'text', c.nombre || ''),
    field('Teléfono', 'telefono', 'tel', c.telefono || ''),

    `<label class="wide">
      Dirección
      <input name="direccion" value="${esc(c.direccion || '')}">
    </label>`
  ];

  openModal(
    id ? 'Editar cliente' : 'Nuevo cliente',
    formShell(f),
    async d => {
      if (id) {
        await update('clientes', id, d);
      } else {
        await create('clientes', d);
      }

      notify('Cliente guardado');
    }
  );

  bindCancel();
}

async function clientDetail(id) {
  const c = await get('clientes', id);

  const vehicles = await pb.collection('vehiculos').getFullList({
    filter: `cliente="${id}"`
  });

  const orders = await pb.collection('ordenes').getFullList({
    expand: 'vehiculo',
    sort: '-created'
  });

  const history = orders.filter(o =>
    vehicles.some(v => v.id === o.vehiculo)
  );

  const body = `
    <div class="panel">
      <h3>${esc(c.nombre)}</h3>
      <p>
        ${esc(c.telefono)} ·
        ${esc(c.direccion || 'Sin dirección')}
      </p>
    </div>

    <div class="panel">
      <h3>Vehículos</h3>

      ${vehicles.map(v => `
        <div class="record">
          <b>${esc(vehicleLabel(v))}</b>
          <small>${v.kilometraje || 0} km</small>
        </div>
      `).join('') || emptyPanel('No tiene vehículos registrados.')}
    </div>

    <div class="panel">
      <h3>Historial de órdenes</h3>

      ${history.map(o => `
        <div class="record">
          <b>${esc(o.codigo)}</b>
          ${statusPill(o.estado)}
        </div>
      `).join('') || emptyPanel('Sin historial todavía.')}
    </div>
  `;

  openModal('Ficha del cliente', body, async () => {});
}

// VEHÍCULOS

async function vehiclesPage() {
  const rows = (await list('vehiculos')).map(v => `
    <tr>
      <td>
        <b>${esc(vehicleLabel(v))}</b>
        <small>${esc(v.matricula)}</small>
      </td>

      <td>${esc(clientName(v.cliente))}</td>
      <td>${v.anio || '—'}</td>

      <td>
        ${Number(v.kilometraje || 0).toLocaleString('es-ES')} km
      </td>

      <td>
        <button class="icon-btn" data-edit-vehicle="${v.id}">
          Editar
        </button>
      </td>
    </tr>
  `);

  return `
    ${pageHeading(
      'Vehículos',
      'Vehículos registrados y kilometraje de llegada.',
      '＋ Nuevo vehículo',
      'newVehicle'
    )}

    ${table(
      ['Vehículo', 'Propietario', 'Año', 'Kilometraje', 'Acciones'],
      rows
    )}
  `;
}

async function vehicleForm(id) {
  const v = id ? await get('vehiculos', id) : {};
  const clients = await list('clientes');

  const f = [
    field(
      'Propietario',
      'cliente',
      'select',
      v.cliente || '',
      true,
      clients.map(c => ({
        value: c.id,
        label: c.nombre
      }))
    ),

    field('Matrícula', 'matricula', 'text', v.matricula || ''),
    field('Marca', 'marca', 'text', v.marca || ''),
    field('Modelo', 'modelo', 'text', v.modelo || ''),
    field('Año', 'anio', 'number', v.anio || ''),
    field('Kilometraje', 'kilometraje', 'number', v.kilometraje || '0')
  ];

  openModal(
    id ? 'Editar vehículo' : 'Nuevo vehículo',
    formShell(f),
    async d => {
      d.anio = Number(d.anio);
      d.kilometraje = Number(d.kilometraje);

      if (id) {
        await update('vehiculos', id, d);
      } else {
        await create('vehiculos', d);
      }

      notify('Vehículo guardado');
    }
  );

  bindCancel();
}

// INVENTARIO

async function inventoryPage() {
  const parts = await list('repuestos');

  const low = parts.filter(
    p => Number(p.existencias) <= Number(p.minimo || 3)
  );

  const rows = parts
    .filter(p =>
      !state.search ||
      `${p.nombre} ${p.codigo}`
        .toLowerCase()
        .includes(state.search.toLowerCase())
    )
    .map(p => `
      <tr>
        <td>
          <b>${esc(p.nombre)}</b>
          <small>${esc(p.codigo)}</small>
        </td>

        <td>${money(p.precio_venta)}</td>
        <td>${p.existencias}</td>
        <td>${p.minimo || 3}</td>

        <td>
          <span class="pill ${
            Number(p.existencias) <= Number(p.minimo || 3)
              ? 'red'
              : 'green'
          }">
            ${
              Number(p.existencias) <= Number(p.minimo || 3)
                ? 'Stock bajo'
                : 'Disponible'
            }
          </span>
        </td>

        <td>
          <button class="icon-btn" data-edit-part="${p.id}">
            Editar
          </button>
        </td>
      </tr>
    `);

  return `
    ${pageHeading(
      'Inventario',
      'Repuestos, precios y control de existencias.',
      '＋ Nuevo repuesto',
      'newPart'
    )}

    <div class="stats">
      <div class="stat">
        <span>Referencias</span>
        <strong>${parts.length}</strong>
      </div>

      <div class="stat">
        <span>Alertas de stock</span>
        <strong class="${low.length ? 'accent' : ''}">${low.length}</strong>
      </div>
    </div>

    <div class="toolbar">
      <input
        id="searchBox"
        placeholder="Buscar repuesto o código…"
        value="${esc(state.search)}"
      >
    </div>

    ${table(
      ['Repuesto / código', 'Precio venta', 'Existencias', 'Mínimo', 'Estado', 'Acciones'],
      rows
    )}
  `;
}

async function partForm(id) {
  const p = id ? await get('repuestos', id) : {};

  const f = [
    field('Nombre', 'nombre', 'text', p.nombre || ''),
    field('Código', 'codigo', 'text', p.codigo || ''),
    field('Precio de venta (USD)', 'precio_venta', 'number', p.precio_venta || ''),
    field('Existencias', 'existencias', 'number', p.existencias ?? '0'),
    field('Alerta mínima', 'minimo', 'number', p.minimo ?? '3')
  ];

  openModal(
    id ? 'Editar repuesto' : 'Nuevo repuesto',
    formShell(f),
    async d => {
      d.precio_venta = Number(d.precio_venta);
      d.existencias = Number(d.existencias);
      d.minimo = Number(d.minimo);

      if (id) {
        await update('repuestos', id, d);
      } else {
        await create('repuestos', d);
      }

      notify('Inventario actualizado');
    }
  );

  bindCancel();
}

// PAGOS

async function paymentsPage() {
  const [payments, orders] = await Promise.all([
    list('pagos', { expand: 'registrado_por' }),
    list('ordenes')
  ]);

  const rows = payments.map(p => `
    <tr>
      <td>
        <b>${money(p.importe)}</b>
        <small>${date(p.fecha)}</small>
      </td>

      <td>
        ${esc(orders.find(o => o.id === p.orden)?.codigo || 'Orden')}
      </td>

      <td>${esc(p.metodo)}</td>
      <td>${esc(p.expand?.registrado_por?.nombre || '—')}</td>
    </tr>
  `);

  const debt = orders.reduce(
    (s, o) => s + Math.max(
      0,
      Number(o.total || 0) - Number(o.pagado || 0)
    ),
    0
  );

  return `
    ${pageHeading(
      'Pagos',
      'Cobros recibidos y saldos pendientes.'
    )}

    <div class="stats">
      <div class="stat">
        <span>Pagos registrados</span>
        <strong>${payments.length}</strong>
      </div>

      <div class="stat">
        <span>Saldo pendiente</span>
        <strong class="accent">${money(debt)}</strong>
      </div>
    </div>

    ${table(
      ['Importe / fecha', 'Orden', 'Método', 'Registrado por'],
      rows
    )}
  `;
}

// HISTORIAL

async function historyPage() {
  const orders = await list('ordenes', {
    expand: 'vehiculo,vehiculo.cliente',
    sort: '-created'
  });

  const rows = orders.map(o => `
    <tr>
      <td>
        <b>${esc(o.codigo)}</b>
        <small>${date(o.fecha_entrada)}</small>
      </td>

      <td>${esc(clientName(o.expand?.vehiculo?.cliente))}</td>
      <td>${esc(vehicleLabel(o.expand?.vehiculo))}</td>
      <td>${statusPill(o.estado)}</td>
      <td>${money(o.total)}</td>

      <td>
        <button class="icon-btn" data-detail="${o.id}">
          Detalle
        </button>
      </td>
    </tr>
  `);

  return `
    ${pageHeading(
      'Historial',
      'Registro de servicios realizados y visitas anteriores.'
    )}

    ${table(
      ['Orden', 'Cliente', 'Vehículo', 'Estado', 'Total', ''],
      rows
    )}
  `;
}

// REPORTES

async function reportsPage() {
  const orders = await list('ordenes');
  const payments = await list('pagos');
  const parts = await list('repuestos');

  const total = payments.reduce(
    (s, p) => s + Number(p.importe || 0),
    0
  );

  const debt = orders.reduce(
    (s, o) => s + Math.max(
      0,
      Number(o.total || 0) - Number(o.pagado || 0)
    ),
    0
  );

  const counts = Object.entries(statusLabels).map(([s, l]) => ({
    s,
    l,
    n: orders.filter(o => o.estado === s).length
  }));

  const max = Math.max(1, ...counts.map(x => x.n));

  return `
    ${pageHeading(
      'Reportes',
      'Indicadores del taller y facturación acumulada.'
    )}

    <div class="stats">
      <div class="stat">
        <span>Facturación cobrada</span>
        <strong class="accent">${money(total)}</strong>
      </div>

      <div class="stat">
        <span>Saldo por cobrar</span>
        <strong>${money(debt)}</strong>
      </div>

      <div class="stat">
        <span>Órdenes totales</span>
        <strong>${orders.length}</strong>
      </div>

      <div class="stat">
        <span>Repuestos en alerta</span>
        <strong>${parts.filter(p => p.existencias <= p.minimo).length}</strong>
      </div>
    </div>

    <div class="panel">
      <h3>Órdenes por estado</h3>

      ${counts.map(x => `
        <div class="bar-row">
          <span>${x.l}</span>
          <div class="bar">
            <i style="width:${x.n / max * 100}%"></i>
          </div>
          <b>${x.n}</b>
        </div>
      `).join('')}
    </div>

    <div class="panel">
      <h3>Facturación por período</h3>

      <p class="muted">
        Selecciona un período para consultar los pagos registrados.
      </p>

      <div class="toolbar">
        <input type="date" id="fromDate">
        <input type="date" id="toDate">
        <button class="btn primary" id="filterRevenue">Consultar</button>
      </div>

      <h2 id="revenueResult">${money(total)}</h2>
    </div>
  `;
}

// MECÁNICOS

async function mechanicsPage() {
  const mechanics = (await list('mecanicos'))
    .filter(m => m.activo !== false);

  const orders = await list('ordenes');

  const rows = mechanics.map(m => `
    <div class="record">
      <div class="record-main">
        <b>${esc(m.nombre)}</b>

        <small>
          ${esc(m.especialidad || 'Mecánico')} ·
          ${
            orders.filter(o =>
              o.mecanico_taller === m.id &&
              !['entregada', 'cancelada'].includes(o.estado)
            ).length
          } órdenes activas asignadas
        </small>
      </div>

      <span class="pill green">Mecánico</span>
    </div>
  `);

  return `
    ${pageHeading(
      'Mecánicos',
      'Carga de trabajo y asignaciones del equipo.'
    )}

    <div class="list">
      ${rows.join('') || emptyPanel('No hay mecánicos registrados.')}
    </div>
  `;
}

// USUARIOS

async function usersPage() {
  const users = await list('users');

  const rows = users.map(u => `
    <tr>
      <td>
        <b>${esc(u.nombre || u.email)}</b>
        <small>${esc(u.email)}</small>
      </td>

      <td>${esc(u.role || 'recepcionista')}</td>

      <td>
        <span class="pill green">Activo</span>
      </td>
    </tr>
  `);

  return `
    ${pageHeading(
      'Usuarios',
      'Personal autorizado para acceder al sistema.',
      '＋ Nuevo usuario',
      'newUser'
    )}

    ${table(['Usuario', 'Rol', 'Estado'], rows)}

    <p class="muted tiny">
      Los usuarios se crean mediante la colección de autenticación de PocketBase.
    </p>
  `;
}

async function userForm() {
  const f = [
    field('Nombre', 'nombre'),
    field('Correo', 'email', 'email'),
    field('Contraseña', 'password', 'password'),

    field(
      'Rol',
      'role',
      'select',
      'recepcionista',
      true,
      ['admin', 'recepcionista', 'mecanico'].map(x => ({
        value: x,
        label: x
      }))
    )
  ];

  openModal(
    'Crear usuario',
    formShell(f),
    async d => {
      await pb.collection('users').create({
        ...d,
        passwordConfirm: d.password
      });

      notify('Usuario creado');
    }
  );

  bindCancel();
}

// CONFIGURACIÓN

async function settingsPage() {
  return `
    ${pageHeading(
      'Configuración',
      'Conexión con el servidor PocketBase y datos del taller.'
    )}

    <div class="panel">
      <h3>Servidor</h3>

      <form id="settingsForm">
        <label>
          URL de PocketBase
          <input name="url" value="${esc(PB_URL)}" required>
        </label>

        <button class="btn primary">Guardar conexión</button>
      </form>

      <p class="muted tiny">
        Por defecto: http://127.0.0.1:8091
      </p>
    </div>

    <div class="panel">
      <h3>Información</h3>

      <p>El Pistón · Sistema de gestión automotriz</p>

      <p class="muted">
        Los datos se almacenan centralizados en PocketBase.
      </p>
    </div>
  `;
}

// NAVEGACIÓN

const pages = {
  inicio: dashboard,
  ordenes: ordersPage,
  clientes: clientsPage,
  vehiculos: vehiclesPage,
  inventario: inventoryPage,
  pagos: paymentsPage,
  historial: historyPage,
  reportes: reportsPage,
  mecanicos: mechanicsPage,
  usuarios: usersPage,
  configuracion: settingsPage
};

const titles = {
  inicio: 'Inicio',
  ordenes: 'Órdenes',
  clientes: 'Clientes',
  vehiculos: 'Vehículos',
  inventario: 'Inventario',
  pagos: 'Pagos',
  historial: 'Historial',
  reportes: 'Reportes',
  mecanicos: 'Mecánicos',
  usuarios: 'Usuarios',
  configuracion: 'Configuración'
};

async function render() {
  if (!state.user) return;

  $('#pageTitle').textContent = titles[state.page] || 'El Pistón';

  $$('.nav-item').forEach(b =>
    b.classList.toggle('active', b.dataset.page === state.page)
  );

  $$('.admin-only').forEach(b =>
    b.classList.toggle('hidden', !isAdmin())
  );

  $('#pageContent').innerHTML =
    '<div class="empty">Cargando información…</div>';

  try {
    await refreshBase();

    $('#pageContent').innerHTML = await pages[state.page]();

  } catch (e) {
    $('#pageContent').innerHTML = `
      <div class="empty">
        No se pudo cargar esta sección:
        ${esc(e.message)}
        <br>
        Comprueba las colecciones y reglas de PocketBase.
      </div>
    `;
  }

  bindPageEvents();
}

function bindPageEvents() {
  $$('[data-go]').forEach(b =>
    b.onclick = () => go(b.dataset.go)
  );

  const search = $('#searchBox');

  if (search) {
    search.onchange = () => {
      state.search = search.value;
      render();
    };
  }

  $('#newOrder')?.addEventListener('click', newOrder);

  $('#newClient')?.addEventListener('click', () => clientForm());

  $('#newVehicle')?.addEventListener('click', () => vehicleForm());

  $('#newPart')?.addEventListener('click', () => partForm());

  $('#newUser')?.addEventListener('click', userForm);

  $$('[data-detail]').forEach(b =>
    b.onclick = () => orderDetail(b.dataset.detail)
  );

  $$('[data-status]').forEach(b =>
    b.onclick = () => changeStatus(b.dataset.status)
  );

  $$('[data-client]').forEach(b =>
    b.onclick = () => clientDetail(b.dataset.client)
  );

  $$('[data-edit-client]').forEach(b =>
    b.onclick = () => clientForm(b.dataset.editClient)
  );

  $$('[data-edit-vehicle]').forEach(b =>
    b.onclick = () => vehicleForm(b.dataset.editVehicle)
  );

  $$('[data-edit-part]').forEach(b =>
    b.onclick = () => partForm(b.dataset.editPart)
  );

  $('#filterRevenue')?.addEventListener('click', async () => {
    const from = $('#fromDate').value;
    const to = $('#toDate').value;

    const ps = await list('pagos');

    const n = ps
      .filter(p =>
        (!from || p.fecha.slice(0, 10) >= from) &&
        (!to || p.fecha.slice(0, 10) <= to)
      )
      .reduce((s, p) => s + Number(p.importe), 0);

    $('#revenueResult').textContent = money(n);
  });

  $('#settingsForm')?.addEventListener('submit', e => {
    e.preventDefault();

    localStorage.setItem(
      'piston_pb_url',
      new FormData(e.target).get('url').replace(/\/$/, '')
    );

    notify('URL guardada. Recarga la página para aplicar el cambio.');
  });
}

function go(page) {
  state.page = page;
  state.search = '';
  render();
}

$('#navigation').addEventListener('click', e => {
  const b = e.target.closest('[data-page]');

  if (b) {
    go(b.dataset.page);
  }
});

// CERRAR SESIÓN

$('#logoutBtn').onclick = () => {
  pb.authStore.clear();
  state.user = null;

  $('#workspace').classList.add('hidden');
  $('#loginView').classList.remove('hidden');
};

// INICIO DE SESIÓN
// Permite entrar con admin, recepcion o mecanico.

$('#loginForm').onsubmit = async e => {
  e.preventDefault();

  $('#loginError').textContent = '';

  const d = Object.fromEntries(new FormData(e.target));

  const usuarios = {
    admin: 'admin@elpiston.local',
    recepcion: 'recepcion@elpiston.local',
    mecanico: 'mecanico@elpiston.local'
  };

  const nombreUsuario = String(d.usuario || '')
    .trim()
    .toLowerCase();

  const correo = usuarios[nombreUsuario];

  if (!correo) {
    $('#loginError').textContent =
      'Usuario incorrecto. Utiliza admin, recepcion o mecanico.';
    return;
  }

  try {
    const auth = await pb.collection('users').authWithPassword(
      correo,
      d.password
    );

    state.user = auth.record;

    startWorkspace();

  } catch (err) {
    console.error('Error de inicio de sesión:', err);

    $('#loginError').textContent =
      'No se pudo iniciar sesión. Comprueba tu usuario y contraseña.';
  }
};

// INICIAR ESPACIO DE TRABAJO

function startWorkspace() {
  state.user = pb.authStore.record;

  $('#loginView').classList.add('hidden');
  $('#workspace').classList.remove('hidden');

  $('#userName').textContent =
    state.user.nombre || state.user.email;

  $('#userRole').textContent =
    state.user.role || 'Personal';

  $('#userAvatar').textContent =
    (state.user.nombre || state.user.email || 'U')
      .slice(0, 1)
      .toUpperCase();

  go('inicio');
}

// COMPROBAR CONEXIÓN CON POCKETBASE

async function checkApi() {
  try {
    const r = await fetch(PB_URL + '/api/health');

    $('#apiStatus').textContent = r.ok
      ? 'conectado'
      : 'PocketBase responde';

  } catch {
    $('#apiStatus').textContent = 'sin conexión';
  }
}

await checkApi();

// RESTAURAR SESIÓN SI YA EXISTE

if (pb.authStore.isValid) {
  try {
    await pb.collection('users').authRefresh();
    startWorkspace();

  } catch {
    pb.authStore.clear();
  }
}
