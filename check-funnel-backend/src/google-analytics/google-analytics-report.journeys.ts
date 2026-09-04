import { ga4Number } from './google-analytics-report.utils';

export function ga4PurchaseJourney(
  events: Record<string, number>,
  sessions?: number,
) {
  return [
    journeyStep('Sessions', 'session_start', events, sessions),
    journeyStep('View item', 'view_item', events),
    journeyStep('Add to cart', 'add_to_cart', events),
    journeyStep('Begin checkout', 'begin_checkout', events),
    journeyStep('Add shipping info', 'add_shipping_info', events),
    journeyStep('Add payment info', 'add_payment_info', events),
    journeyStep('Purchase', 'purchase', events),
  ];
}

export function ga4LeadJourney(
  events: Record<string, number>,
  sessions?: number,
) {
  return [
    journeyStep('Sessions', 'session_start', events, sessions),
    journeyStep('Form submits', 'form_submit', events),
    journeyStep('Leads generated', 'generate_lead', events),
    journeyStep('Qualified leads', 'qualify_lead', events),
    journeyStep('Working leads', 'working_lead', events),
    journeyStep('Converted leads', 'close_convert_lead', events),
  ];
}

export function ga4InquiryJourney(
  events: Record<string, number>,
  sessions?: number,
) {
  return [
    journeyStep('Sessions', 'session_start', events, sessions),
    journeyStep('Form starts', 'form_start', events),
    journeyStep('Enquiries submitted', 'contact', events),
  ];
}

function journeyStep(
  label: string,
  eventName: string,
  events: Record<string, number>,
  valueOverride?: number,
) {
  return {
    label,
    eventName,
    value: valueOverride ?? ga4Number(events[eventName]),
  };
}
