import React, {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Calendar,
  SlotInfo,
  View,
  Views,
} from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { dayjsLocalizer } from 'react-big-calendar';
import dayjs from 'dayjs';
import { AxiosError } from 'axios';
import { io, Socket } from 'socket.io-client';
import {
  createReservation,
  deleteReservation as deleteReservationApi,
  getAdvisors,
  getCustomers,
  getReservations,
  getVehicles,
  updateReservation as updateReservationApi,
} from '../services/api';

import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

const localizer = dayjsLocalizer(dayjs);
const DnDCalendar = withDragAndDrop(Calendar as any);

type CalendarMode = 'create' | 'edit';

interface ApiReservation {
  reservation_id: string;
  vehicle_id: string;
  customer_id: string;
  assigned_advisor_id: string;
  start_date: string;
  end_date: string;
  status: string;
  customer?: {
    customerId?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  vehicle?: {
    vehicleId?: string;
    year?: number;
    model?: string;
    licensePlate?: string;
  };
  advisor?: {
    advisorId?: string;
    firstName?: string;
    lastName?: string;
  };
}

interface ReservationEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  status: string;
  vehicleId: string;
  customerId: string;
  advisorId: string;
  vehicleLabel?: string;
  customerName?: string;
  tooltip?: string;
}

interface ReservationFormState {
  reservationId?: string;
  vehicleId: string;
  customerId: string;
  assignedAdvisorId: string;
  startDate: string;
  endDate: string;
  status: string;
}

interface Customer {
  customer_id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface Vehicle {
  vehicle_id: string;
  year: number;
  model: string;
  license_plate: string;
  status: string;
}

interface Advisor {
  advisor_id: string;
  first_name: string;
  last_name: string;
}

interface BannerState {
  type: 'success' | 'error';
  message: string;
}

interface DragEventArgs {
  event: ReservationEvent;
  start: Date;
  end: Date;
}

const STATUS_LABELS: Record<string, string> = {
  reserved: 'Reserved',
  'in-use': 'In Use',
  returned: 'Returned',
  cancelled: 'Cancelled',
};

const STATUS_COLOR: Record<string, string> = {
  reserved: '#facc15', // yellow
  'in-use': '#ef4444', // red
  returned: '#22c55e', // green
  cancelled: '#94a3b8', // slate
};

const DEFAULT_FORM_STATE: ReservationFormState = {
  vehicleId: '',
  customerId: '',
  assignedAdvisorId: '',
  startDate: dayjs().format('YYYY-MM-DD'),
  endDate: dayjs().add(1, 'day').format('YYYY-MM-DD'),
  status: 'reserved',
};

const SOCKET_EVENT = 'reservation_update';

const buildSocketUrl = (): string => {
  const socketEnv = process.env.REACT_APP_SOCKET_URL;
  if (socketEnv) {
    return socketEnv;
  }

  const apiBase = process.env.REACT_APP_API_URL || '/api';
  if (apiBase.startsWith('http')) {
    return apiBase.replace(/\/api\/?$/, '');
  }

  return window.location.origin;
};

const toEvent = (reservation: ApiReservation): ReservationEvent => {
  const start = dayjs(reservation.start_date).startOf('day').toDate();
  const end = dayjs(reservation.end_date).add(1, 'day').startOf('day').toDate();
  const vehicleLabel = reservation.vehicle
    ? `${reservation.vehicle.year ?? ''} ${reservation.vehicle.model ?? ''}`.trim()
    : '';
  const customerName = reservation.customer
    ? `${reservation.customer.firstName ?? ''} ${reservation.customer.lastName ?? ''}`.trim()
    : '';

  return {
    id: reservation.reservation_id,
    title: vehicleLabel ? `${vehicleLabel} • ${customerName || 'Unassigned'}` : customerName || 'Reservation',
    start,
    end,
    allDay: true,
    status: reservation.status,
    vehicleId: reservation.vehicle?.vehicleId || reservation.vehicle_id,
    customerId: reservation.customer?.customerId || reservation.customer_id,
    advisorId: reservation.advisor?.advisorId || reservation.assigned_advisor_id,
    vehicleLabel,
    customerName,
    tooltip: `${vehicleLabel || 'Vehicle TBD'} • ${customerName || 'Customer TBD'}`,
  };
};

const toApiRange = (start: Date, end: Date) => {
  const startDate = dayjs(start).startOf('day');
  let endDate = dayjs(end).startOf('day').subtract(1, 'day');

  if (endDate.isBefore(startDate)) {
    endDate = startDate;
  }

  return {
    startDate: startDate.format('YYYY-MM-DD'),
    endDate: endDate.format('YYYY-MM-DD'),
  };
};

const eventStyleGetter = (event: ReservationEvent) => {
  const baseColor = STATUS_COLOR[event.status] || '#2563eb';
  const textColor =
    event.status === 'in-use' ? '#ffffff' : event.status === 'reserved' ? '#422006' : '#0f172a';

  return {
    style: {
      backgroundColor: baseColor,
      borderRadius: '0.75rem',
      border: 'none',
      color: textColor,
      fontWeight: 600,
      padding: '6px 10px',
      boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)',
    },
  };
};

const CalendarView: React.FC = () => {
  const [events, setEvents] = useState<ReservationEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<CalendarMode>('create');
  const [formState, setFormState] = useState<ReservationFormState>(DEFAULT_FORM_STATE);
  const [formError, setFormError] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [activeEvent, setActiveEvent] = useState<ReservationEvent | null>(null);
  const [filters, setFilters] = useState<{ vehicleId: string; advisorId: string; status: string }>({
    vehicleId: 'all',
    advisorId: 'all',
    status: 'all',
  });
  const [banner, setBanner] = useState<BannerState | null>(null);
  const [liveMutation, setLiveMutation] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<View>(Views.WEEK);

  const showBanner = useCallback((type: BannerState['type'], message: string) => {
    setBanner({ type, message });
  }, []);

  useEffect(() => {
    if (!banner) {
      return;
    }
    const timeout = window.setTimeout(() => setBanner(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [banner]);

  const fetchReservations = useCallback(async () => {
    try {
      const response = await getReservations();
      const mapped = (response.data as ApiReservation[]).map(toEvent);
      setEvents(mapped);
    } catch (error) {
      console.error('Error fetching reservations:', error);
      showBanner('error', 'Unable to load reservations. Please refresh.');
    }
  }, [showBanner]);

  const fetchReferenceData = useCallback(async () => {
    try {
      const [vehiclesResponse, customersResponse, advisorsResponse] = await Promise.all([
        getVehicles(),
        getCustomers(),
        getAdvisors(),
      ]);

      setVehicles(vehiclesResponse.data || []);
      setCustomers(customersResponse.data || []);
      setAdvisors(advisorsResponse.data || []);
    } catch (error) {
      console.error('Error loading lookup data:', error);
      showBanner('error', 'Unable to load vehicles/customers/advisors.');
    }
  }, [showBanner]);

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      await Promise.all([fetchReservations(), fetchReferenceData()]);
      setLoading(false);
    };

    bootstrap();
  }, [fetchReferenceData, fetchReservations]);

  useEffect(() => {
    let socket: Socket | null = null;
    try {
      const socketUrl = buildSocketUrl();
      socket = io(socketUrl, {
        transports: ['websocket'],
        path: '/socket.io',
      });

      socket.on(SOCKET_EVENT, () => {
        fetchReservations();
      });
    } catch (error) {
      console.error('Socket connection failed:', error);
      showBanner('error', 'Live updates unavailable. Check your network settings.');
    }

    return () => {
      socket?.disconnect();
    };
  }, [fetchReservations, showBanner]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesVehicle =
        filters.vehicleId === 'all' || event.vehicleId === filters.vehicleId;
      const matchesAdvisor =
        filters.advisorId === 'all' || event.advisorId === filters.advisorId;
      const matchesStatus = filters.status === 'all' || event.status === filters.status;
      return matchesVehicle && matchesAdvisor && matchesStatus;
    });
  }, [events, filters]);

  const resetModal = useCallback(() => {
    setFormState(DEFAULT_FORM_STATE);
    setFormError(null);
    setActiveEvent(null);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    resetModal();
  }, [resetModal]);

  const openCreateModal = useCallback(
    (slotInfo: SlotInfo) => {
      const range = toApiRange(slotInfo.start, slotInfo.end);
      setModalMode('create');
      setActiveEvent(null);
      setFormState({
        ...DEFAULT_FORM_STATE,
        startDate: range.startDate,
        endDate: range.endDate,
      });
      setFormError(null);
      setModalOpen(true);
    },
    []
  );

  const openEditModal = useCallback((event: ReservationEvent) => {
    const endDate = dayjs(event.end).subtract(1, 'day').format('YYYY-MM-DD');
    setModalMode('edit');
    setActiveEvent(event);
    setFormState({
      reservationId: event.id,
      vehicleId: event.vehicleId,
      customerId: event.customerId,
      assignedAdvisorId: event.advisorId,
      startDate: dayjs(event.start).format('YYYY-MM-DD'),
      endDate,
      status: event.status,
    });
    setFormError(null);
    setModalOpen(true);
  }, []);

  const handleFormChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = event.target;
      setFormState((previous) => ({
        ...previous,
        [name]: value,
      }));
    },
    []
  );

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setFormError(null);

      if (!formState.vehicleId || !formState.customerId || !formState.assignedAdvisorId) {
        setFormError('Vehicle, customer, and advisor are required.');
        return;
      }

      if (dayjs(formState.endDate).isBefore(dayjs(formState.startDate))) {
        setFormError('End date cannot be before start date.');
        return;
      }

      const payload = {
        vehicleId: formState.vehicleId,
        customerId: formState.customerId,
        assignedAdvisorId: formState.assignedAdvisorId,
        startDate: formState.startDate,
        endDate: formState.endDate,
        status: formState.status,
      };

      try {
        setLiveMutation(true);
        if (modalMode === 'create') {
          await createReservation(payload);
          showBanner('success', 'Reservation created.');
        } else if (formState.reservationId) {
          await updateReservationApi(formState.reservationId, payload);
          showBanner('success', 'Reservation updated.');
        }

        closeModal();
        await fetchReservations();
      } catch (error) {
        const axiosError = error as AxiosError<{ error?: string }>;
        if (axiosError.response?.status === 409) {
          setFormError(axiosError.response.data?.error || 'Vehicle is already booked.');
        } else {
          setFormError('Request failed. Please try again.');
        }
      } finally {
        setLiveMutation(false);
      }
    },
    [closeModal, fetchReservations, formState, modalMode, showBanner]
  );

  const handleDelete = useCallback(async () => {
    if (!formState.reservationId) {
      return;
    }

    if (!window.confirm('Delete this reservation?')) {
      return;
    }

    try {
      setLiveMutation(true);
      await deleteReservationApi(formState.reservationId);
      showBanner('success', 'Reservation deleted.');
      closeModal();
      await fetchReservations();
    } catch (error) {
      console.error('Failed to delete reservation:', error);
      showBanner('error', 'Failed to delete reservation.');
    } finally {
      setLiveMutation(false);
    }
  }, [closeModal, fetchReservations, formState.reservationId, showBanner]);

  const mutateReservationSchedule = useCallback(
    async (reservation: ReservationEvent, start: Date, end: Date) => {
      const range = toApiRange(start, end);
      try {
        setLiveMutation(true);
        await updateReservationApi(reservation.id, {
          vehicleId: reservation.vehicleId,
          assignedAdvisorId: reservation.advisorId,
          startDate: range.startDate,
          endDate: range.endDate,
          status: reservation.status,
        });
        showBanner('success', 'Reservation rescheduled.');
        await fetchReservations();
      } catch (error) {
        const axiosError = error as AxiosError<{ error?: string }>;
        if (axiosError.response?.status === 409) {
          showBanner('error', axiosError.response.data?.error || 'Vehicle already booked.');
        } else {
          showBanner('error', 'Unable to reschedule reservation.');
        }
        // revert UI by refetching
        await fetchReservations();
      } finally {
        setLiveMutation(false);
      }
    },
    [fetchReservations, showBanner]
  );

  const handleEventDrop = useCallback(
    async (args: DragEventArgs) => {
      await mutateReservationSchedule(args.event, args.start, args.end);
    },
    [mutateReservationSchedule]
  );

  const handleEventResize = useCallback(
    async (args: DragEventArgs) => {
      await mutateReservationSchedule(args.event, args.start, args.end);
    },
    [mutateReservationSchedule]
  );

  const handleFilterChange = useCallback(
    (key: 'vehicleId' | 'advisorId' | 'status', value: string) => {
      setFilters((previous) => ({
        ...previous,
        [key]: value,
      }));
    },
    []
  );

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center rounded-3xl bg-white shadow-lg">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-revolution-primary border-t-transparent" />
          <p className="text-sm font-semibold text-gray-500">Loading calendar…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {banner && (
        <div
          className={`flex items-center justify-between rounded-2xl px-5 py-3 text-sm font-semibold shadow ${
            banner.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
          }`}
        >
          <span>{banner.message}</span>
          <button
            type="button"
            onClick={() => setBanner(null)}
            className="text-xs uppercase tracking-wide"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="rounded-3xl bg-white shadow-lg ring-1 ring-gray-100">
        <div className="sticky top-0 z-10 flex flex-col gap-4 border-b border-gray-100 bg-white/80 p-4 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-gray-900">Calendar Overview</h2>
              <p className="text-sm text-gray-500">
                Drag and drop reservations to reschedule. Double click an empty slot to create.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentView(Views.MONTH)}
                className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  currentView === Views.MONTH
                    ? 'bg-revolution-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Month
              </button>
              <button
                type="button"
                onClick={() => setCurrentView(Views.WEEK)}
                className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  currentView === Views.WEEK
                    ? 'bg-revolution-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Week
              </button>
              <button
                type="button"
                onClick={() => setCurrentView(Views.DAY)}
                className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  currentView === Views.DAY
                    ? 'bg-revolution-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Day
              </button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <label className="flex flex-col space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Vehicle
              </span>
              <select
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 shadow-sm focus:border-revolution-primary focus:outline-none focus:ring-2 focus:ring-revolution-primary/20"
                value={filters.vehicleId}
                onChange={(event) => handleFilterChange('vehicleId', event.target.value)}
              >
                <option value="all">All vehicles</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.vehicle_id} value={vehicle.vehicle_id}>
                    {vehicle.year} {vehicle.model} ({vehicle.license_plate})
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Advisor
              </span>
              <select
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 shadow-sm focus:border-revolution-primary focus:outline-none focus:ring-2 focus:ring-revolution-primary/20"
                value={filters.advisorId}
                onChange={(event) => handleFilterChange('advisorId', event.target.value)}
              >
                <option value="all">All advisors</option>
                {advisors.map((advisor) => (
                  <option key={advisor.advisor_id} value={advisor.advisor_id}>
                    {advisor.first_name} {advisor.last_name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Status
              </span>
              <select
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 shadow-sm focus:border-revolution-primary focus:outline-none focus:ring-2 focus:ring-revolution-primary/20"
                value={filters.status}
                onChange={(event) => handleFilterChange('status', event.target.value)}
              >
                <option value="all">All statuses</option>
                {Object.entries(STATUS_LABELS).map(([status, label]) => (
                  <option key={status} value={status}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="p-4">
          <DnDCalendar
            localizer={localizer}
            defaultView={Views.WEEK}
            view={currentView}
            onView={(view) => setCurrentView(view)}
            events={filteredEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '72vh' }}
            popup
            selectable
            resizable
            tooltipAccessor={(event) => (event as ReservationEvent).tooltip || ''}
            onSelectSlot={openCreateModal}
            onSelectEvent={openEditModal}
            onEventDrop={handleEventDrop}
            onEventResize={handleEventResize}
            eventPropGetter={eventStyleGetter}
            dayLayoutAlgorithm="no-overlap"
          />
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 px-4 py-8 backdrop-blur">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-xl font-black text-gray-900">
                  {modalMode === 'create' ? 'Create Reservation' : 'Update Reservation'}
                </h3>
                {activeEvent && (
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    {activeEvent.vehicleLabel} • {activeEvent.customerName}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-500"
              >
                Close
              </button>
            </div>

            <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Vehicle
                  </span>
                  <select
                    name="vehicleId"
                    value={formState.vehicleId}
                    onChange={handleFormChange}
                    className="rounded-xl border border-gray-200 px-3 py-3 text-sm font-medium text-gray-700 shadow-sm focus:border-revolution-primary focus:outline-none focus:ring-2 focus:ring-revolution-primary/20"
                    required
                  >
                    <option value="">Select vehicle</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle.vehicle_id} value={vehicle.vehicle_id}>
                        {vehicle.year} {vehicle.model} ({vehicle.license_plate})
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Customer
                  </span>
                  <select
                    name="customerId"
                    value={formState.customerId}
                    onChange={handleFormChange}
                    className="rounded-xl border border-gray-200 px-3 py-3 text-sm font-medium text-gray-700 shadow-sm focus:border-revolution-primary focus:outline-none focus:ring-2 focus:ring-revolution-primary/20"
                    required
                  >
                    <option value="">Select customer</option>
                    {customers.map((customer) => (
                      <option key={customer.customer_id} value={customer.customer_id}>
                        {customer.first_name} {customer.last_name} ({customer.email})
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Advisor
                  </span>
                  <select
                    name="assignedAdvisorId"
                    value={formState.assignedAdvisorId}
                    onChange={handleFormChange}
                    className="rounded-xl border border-gray-200 px-3 py-3 text-sm font-medium text-gray-700 shadow-sm focus:border-revolution-primary focus:outline-none focus:ring-2 focus:ring-revolution-primary/20"
                    required
                  >
                    <option value="">Select advisor</option>
                    {advisors.map((advisor) => (
                      <option key={advisor.advisor_id} value={advisor.advisor_id}>
                        {advisor.first_name} {advisor.last_name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </span>
                  <select
                    name="status"
                    value={formState.status}
                    onChange={handleFormChange}
                    className="rounded-xl border border-gray-200 px-3 py-3 text-sm font-medium text-gray-700 shadow-sm focus:border-revolution-primary focus:outline-none focus:ring-2 focus:ring-revolution-primary/20"
                  >
                    {Object.entries(STATUS_LABELS).map(([status, label]) => (
                      <option key={status} value={status}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Start Date
                  </span>
                  <input
                    type="date"
                    name="startDate"
                    value={formState.startDate}
                    onChange={handleFormChange}
                    className="rounded-xl border border-gray-200 px-3 py-3 text-sm font-medium text-gray-700 shadow-sm focus:border-revolution-primary focus:outline-none focus:ring-2 focus:ring-revolution-primary/20"
                    required
                  />
                </label>

                <label className="flex flex-col space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    End Date
                  </span>
                  <input
                    type="date"
                    name="endDate"
                    value={formState.endDate}
                    onChange={handleFormChange}
                    className="rounded-xl border border-gray-200 px-3 py-3 text-sm font-medium text-gray-700 shadow-sm focus:border-revolution-primary focus:outline-none focus:ring-2 focus:ring-revolution-primary/20"
                    required
                  />
                </label>
              </div>

              {formError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                  {formError}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                {modalMode === 'edit' ? (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                    disabled={liveMutation}
                  >
                    Delete
                  </button>
                ) : (
                  <span />
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
                    disabled={liveMutation}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-revolution-primary px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                    disabled={liveMutation}
                  >
                    {liveMutation ? 'Saving…' : modalMode === 'create' ? 'Create Reservation' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
