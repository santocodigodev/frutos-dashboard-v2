"use client";

interface Route {
  id: number;
  name?: string;
  localStatus: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  orders: any[];
  zone: {
    name: string;
  };
  timeZone: {
    name: string;
  };
  delivery: {
    name: string;
  } | null;
}

interface RouteTableProps {
  routes: Route[];
  onRouteClick?: (route: Route) => void;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (field: string) => void;
}

function SortableTh({ label, fieldKey, sortField, sortOrder, onSort }: { label: string; fieldKey: string; sortField?: string; sortOrder?: 'asc' | 'desc'; onSort?: (f: string) => void }) {
  if (!onSort) {
    return <th className="py-2 px-3">{label}</th>;
  }
  const active = sortField === fieldKey;
  return (
    <th className="py-2 px-3">
      <button type="button" onClick={() => onSort(fieldKey)} className="text-left font-medium hover:text-purple-600 flex items-center gap-1">
        {label}
        {active && <span className="text-purple-600">{sortOrder === 'asc' ? ' ↑' : ' ↓'}</span>}
      </button>
    </th>
  );
}

export default function RouteTable({ routes, onRouteClick, sortField, sortOrder, onSort }: RouteTableProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4 w-full overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500">
            <SortableTh label="Nombre" fieldKey="name" sortField={sortField} sortOrder={sortOrder} onSort={onSort} />
            <SortableTh label="Código" fieldKey="id" sortField={sortField} sortOrder={sortOrder} onSort={onSort} />
            <th className="py-2 px-3">Zona</th>
            <SortableTh label="Fecha" fieldKey="scheduledDate" sortField={sortField} sortOrder={sortOrder} onSort={onSort} />
            <th className="py-2 px-3">Horarios</th>
            <th className="py-2 px-3">Pedidos</th>
            <th className="py-2 px-3">Repartidor</th>
            {onRouteClick && <th className="py-2 px-3"></th>}
          </tr>
        </thead>
        <tbody>
          {routes.map((ruta) => (
            <tr key={ruta.id} className="border-t text-gray-500">
              <td className="py-2 px-3">{ruta.name || '—'}</td>
              <td className="py-2 px-3">#{ruta.id}</td>
              <td className="py-2 px-3">{ruta.zone?.name || 'N/A'}</td>
              <td className="py-2 px-3">{new Date(ruta.scheduledDate).toLocaleDateString()}</td>
              <td className="py-2 px-3">{ruta.timeZone?.name || 'N/A'}</td>
              <td className="py-2 px-3">{ruta.orders?.length || 0}</td>
              <td className="py-2 px-3">{ruta.delivery?.name || 'Sin asignar'}</td>
              {onRouteClick && (
                <td className="py-2 px-3">
                  <button
                    className="bg-purple-600 text-white px-3 py-1 rounded text-xs"
                    onClick={() => {
                      onRouteClick(ruta);
                    }}
                  >
                    Detalle
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 