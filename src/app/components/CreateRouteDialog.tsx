"use client";

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify'; // Example import
import { useSidebarRutas } from '../(protected)/rutas/SidebarContext';
import { getApiUrl, getAuthHeaders } from '../utils/api';

interface Zone {
  id: number;
  name: string;
}

interface TimeZone {
  id: number;
  name: string;
}

interface Delivery {
  id: number;
  name: string;
}

interface CreateRouteDialogProps {
  open: boolean;
  onClose: () => void;
  onRouteCreated: () => void;
}

export default function CreateRouteDialog({ open, onClose, onRouteCreated }: CreateRouteDialogProps) {
  const [zones, setZones] = useState<Zone[]>([]);
  const [timeZones, setTimeZones] = useState<TimeZone[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [selectedZone, setSelectedZone] = useState<number | string>('');
  const [selectedTimeZone, setSelectedTimeZone] = useState<number | string>('');
  const [selectedDelivery, setSelectedDelivery] = useState<number | string>('');
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [observations, setObservations] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const { refreshCounts } = useSidebarRutas();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const headers = getAuthHeaders();

        // Fetch Zones
        const zonesRes = await fetch(getApiUrl('/zone'), { headers });
        const zonesData = await zonesRes.json();
        setZones(zonesData);

        // Fetch TimeZones
        const timeZonesRes = await fetch(getApiUrl('/timezone'), { headers });
        const timeZonesData = await timeZonesRes.json();
        setTimeZones(timeZonesData);

        // Fetch Drivers
        const driversRes = await fetch(getApiUrl('/admin?filter=role||$in||driver'), { headers });
        const driversData = await driversRes.json();
        setDeliveries(driversData);

      } catch (error) {
        console.error('Error fetching data for new route dialog:', error);
        alert('Error al cargar datos necesarios para crear la ruta.');
        onClose(); // Close dialog on critical error
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchData();
      // Reset form state when dialog opens
      setSelectedZone('');
      setSelectedTimeZone('');
      setSelectedDelivery('');
      setScheduledDate('');
      setObservations('');

    }
  }, [open, onClose]); // Add onClose to dependencies

  const handleSubmit = async () => {
    if (!selectedZone || !selectedTimeZone || !scheduledDate) {
      // Replace alert with toast warning
      // alert('Por favor, completa los campos obligatorios (Zona, Horario, Fecha).');
      console.warn('Validation failed: required fields missing'); // Keep console log for debugging
      // @ts-ignore // Ignore TS error if toast is not yet installed/typed
      toast.warn('Por favor, completa los campos obligatorios (Zona, Horario, Fecha).');
      return;
    }

    setCreating(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const headers = { 'Content-Type': 'application/json', 'accept': 'application/json', 'token': user.token };

      // Combine date and a default time (e.g., 00:00:00) to create an ISO string
      // Or ideally, if timeZone gives a start time, use that.
      // For simplicity, let's just use the selected date for now, backend might handle time.
      // Based on your POST example, 'scheduledDate' looks like a full ISO string.
      // We need to select a time along with the date, but the current UI only has a date picker.
      // Let's assume the backend can handle a date string and use a default time zone start time, or require time input.
      // For now, I will append a default time and convert to ISO string.
      const dateObj = new Date(scheduledDate);
       // Find the selected time zone object to get its name, although backend expects ID
       const selectedTimeZoneObj = timeZones.find(tz => tz.id === selectedTimeZone);
       let scheduledDateTime = scheduledDate; // Default to just date string

       if(selectedTimeZoneObj) {
           // Attempt to parse time from timezone name (basic example, might need refinement)
           const timeMatch = selectedTimeZoneObj.name.match(/^De (\d{1,2}):(\d{2})/);
           if(timeMatch) {
               const hours = timeMatch[1].padStart(2, '0');
               const minutes = timeMatch[2];
               scheduledDateTime = `${scheduledDate}T${hours}:${minutes}:00Z`; // Construct ISO string
           } else {
                scheduledDateTime = `${scheduledDate}T00:00:00Z`; // Default to midnight UTC if time parse fails
           }
       } else {
            scheduledDateTime = `${scheduledDate}T00:00:00Z`; // Default to midnight UTC if no timezone selected
       }

       // Validate the constructed date string
        if (isNaN(new Date(scheduledDateTime).getTime())) {
            console.error('Invalid scheduled date time string:', scheduledDateTime);
            alert('Fecha u horario seleccionado no válido.');
            setCreating(false);
            return;
        }

      const newRoute: any = {
        zone: selectedZone,
        observations: observations,
        timeZone: selectedTimeZone,
        scheduledDate: scheduledDateTime, 
      };

      // Conditionally add delivery if selected
      if (selectedDelivery !== '') {
        newRoute.delivery = selectedDelivery;
      }

      const response = await fetch(getApiUrl('/route'), {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(newRoute),
      });

      if (!response.ok) {
         const errorBody = await response.json();
         console.error('Error response body:', errorBody);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await response.json(); // Process successful response if needed
      // Replace alert with toast success
      // alert('Ruta creada con éxito!');
      // @ts-ignore // Ignore TS error if toast is not yet installed/typed
      toast.success('Ruta creada con éxito!');
      
      // Actualizar los contadores del sidebar
      await refreshCounts();
      
      onRouteCreated(); // Refresh the list in the parent component
      onClose();
    } catch (error) {
      console.error('Error creating route:', error);
      // Replace alert with toast error
      // alert(`Error al crear la ruta: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      // @ts-ignore // Ignore TS error if toast is not yet installed/typed
      toast.error(`Error al crear la ruta: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setCreating(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="bg-white rounded-lg shadow-xl p-6 min-w-[600px] max-w-2xl w-full relative overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-3xl leading-none font-semibold">&times;</button>
        <h2 className="text-2xl font-bold text-center text-purple-800 mb-4">Nueva ruta</h2>
        <p className="text-center text-gray-600 mb-6">Selecciona los datos necesarios para crear una ruta nueva</p>

        {loading ? (
          <div className="text-center text-gray-500">Cargando datos del formulario...</div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="zone">Zona</label>
                <select id="zone" className="shadow-sm border border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-purple-500 focus:border-purple-500" value={selectedZone} onChange={e => setSelectedZone(Number(e.target.value))} required>
                  <option value="">Seleccionar Zona</option>
                  {zones.map(zone => (
                    <option key={zone.id} value={zone.id}>{zone.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="date">Fecha</label>
                <input id="date" type="date" className="shadow-sm border border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-purple-500 focus:border-purple-500" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} required />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="timeZone">Horario</label>
                <select id="timeZone" className="shadow-sm border border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-purple-500 focus:border-purple-500" value={selectedTimeZone} onChange={e => setSelectedTimeZone(Number(e.target.value))} required>
                  <option value="">Seleccionar Horario</option>
                  {timeZones.map(tz => (
                    <option key={tz.id} value={tz.id}>{tz.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="delivery">Delivery (Opcional)</label>
                <select id="delivery" className="shadow-sm border border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-purple-500 focus:border-purple-500" value={selectedDelivery} onChange={e => setSelectedDelivery(Number(e.target.value))}>
                  <option value="">Seleccionar Delivery</option>
                  {deliveries.map(del => (
                    <option key={del.id} value={del.id}>{del.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="observations">Observaciones</label>
              <textarea id="observations" className="shadow-sm border border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-purple-500 focus:border-purple-500" rows={4} value={observations} onChange={e => setObservations(e.target.value)}></textarea>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button type="button" onClick={onClose} className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">Volver</button>
              <button type="submit" disabled={creating} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50">
                {creating ? 'Creando...' : 'Crear ruta'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
} 