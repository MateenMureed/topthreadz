export interface HostedCheckoutPayload {
  type: 'form' | 'redirect';
  url: string;
  method?: 'GET' | 'POST';
  fields?: Record<string, string>;
}

export const submitHostedCheckout = (checkout: HostedCheckoutPayload) => {
  if (typeof window === 'undefined') return;

  if (checkout.type === 'redirect') {
    window.location.href = checkout.url;
    return;
  }

  const form = document.createElement('form');
  form.method = checkout.method || 'POST';
  form.action = checkout.url;
  form.style.display = 'none';

  Object.entries(checkout.fields || {}).forEach(([name, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
};
