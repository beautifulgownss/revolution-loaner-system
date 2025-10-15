import { format, parseISO } from 'date-fns';

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return format(date, 'MMM dd, yyyy');
  } catch (error) {
    return 'Invalid date';
  }
};

export const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return format(date, 'MMM dd, yyyy HH:mm');
  } catch (error) {
    return 'Invalid date';
  }
};

export const getStatusColor = (status) => {
  const colors = {
    'reserved': 'bg-blue-100 text-blue-800',
    'in-use': 'bg-green-100 text-green-800',
    'returned': 'bg-gray-100 text-gray-800',
    'cancelled': 'bg-red-100 text-red-800',
    'available': 'bg-green-100 text-green-800',
    'maintenance': 'bg-yellow-100 text-yellow-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const getFuelLevelDisplay = (fuelLevel) => {
  const levels = {
    'full': 'Full',
    '3/4': '3/4',
    'half': '1/2',
    '1/4': '1/4',
    'empty': 'Empty',
  };
  return levels[fuelLevel] || fuelLevel;
};
