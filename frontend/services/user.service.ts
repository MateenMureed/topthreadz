import api from './api';

export interface CreateAddressInput {
  label?: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode?: string;
  isDefault?: boolean;
}

export const userService = {
  getAddresses: () =>
    api.get('/users/addresses').then(r => r.data),

  addAddress: (data: CreateAddressInput) => {
    const payload: CreateAddressInput = {
      fullName: data.fullName.trim(),
      phone: data.phone.trim(),
      address: data.address.trim(),
      city: data.city.trim(),
      province: data.province.trim(),
      isDefault: Boolean(data.isDefault),
    };

    const label = data.label?.trim();
    const postalCode = data.postalCode?.trim();
    if (label) payload.label = label;
    if (postalCode) payload.postalCode = postalCode;

    return api.post('/users/addresses', payload).then(r => r.data);
  },
};
