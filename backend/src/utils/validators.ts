import { ValidationError } from './errorHandler';

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

export const validateCsvRow = (row: any): void => {
  const requiredFields = ['name', 'email', 'phone', 'location'];
  
  for (const field of requiredFields) {
    if (!row[field] || row[field].toString().trim() === '') {
      throw new ValidationError(`Missing required field: ${field}`);
    }
  }

  if (!validateEmail(row.email)) {
    throw new ValidationError(`Invalid email format: ${row.email}`);
  }

  if (!validatePhoneNumber(row.phone)) {
    throw new ValidationError(`Invalid phone format: ${row.phone}`);
  }
};

export const validateFileType = (mimetype: string): void => {
  const allowedTypes = ['text/csv', 'application/vnd.ms-excel'];
  if (!allowedTypes.includes(mimetype)) {
    throw new ValidationError('File must be a CSV file');
  }
};
