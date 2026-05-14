/*
 * HCDP-05-04 — Replace Logistics Providers
 *
 * Carrier directory configuration. The authoritative list is served by
 * catalog-service at GET /logistics-providers (see LogisticsProvidersController);
 * the array below is a hardcoded **fallback** used only when the backend is
 * unreachable. See specs/HCDP-05-04-replace-logistics-provider-spec.md §3.3.
 *
 * Cross-references:
 *  - HCDP-05-01 OVERDUE_DAYS_THRESHOLD = 5  (delivery-late SIGNAL)
 *  - HCDP-05-04 CANCELLATION_WINDOW_DAYS = 10 (carrier-replace AFFORDANCE)
 *    Two distinct concepts; the 5-day gap lets the buyer act AFTER a
 *    delivery becomes overdue (matches the UC trigger "delay occurs").
 */

export interface LogisticsProvider {
    id: string;            // stable slug
    name: string;          // display name (also written into UBL carrierParty.partyName)
    country: string;       // ISO-2 country code
    transitTimeHint: string; // human-readable estimate
}

/**
 * Fallback list — used only when the catalog-service /logistics-providers
 * endpoint is unreachable. The same EU-leaning carrier set the seed inserts.
 */
export const LOGISTICS_PROVIDERS_FALLBACK: LogisticsProvider[] = [
    { id: 'dhl-freight', name: 'DHL Freight', country: 'DE', transitTimeHint: '2-4 days' },
    { id: 'dpd',         name: 'DPD',         country: 'DE', transitTimeHint: '1-3 days' },
    { id: 'gls',         name: 'GLS',         country: 'NL', transitTimeHint: '2-4 days' },
    { id: 'hermes',      name: 'Hermes',      country: 'DE', transitTimeHint: '3-5 days' },
    { id: 'geodis',      name: 'Geodis',      country: 'FR', transitTimeHint: '3-5 days' },
];

/** Days a buyer can replace the carrier after dispatch. See spec §2.4. */
export const CANCELLATION_WINDOW_DAYS = 10;

/** Document type tag stored in additionalDocumentReference[i].documentType
 *  for carrier-replacement audit entries. */
export const CARRIER_CHANGE_DOC_TYPE = 'CARRIER_CHANGE';

/** Shape of the JSON payload embedded inside each CARRIER_CHANGE doc reference's
 *  Attachment.embeddedDocumentBinaryObject. */
export interface CarrierChangeRecord {
    oldProvider: string;
    newProvider: string;
    timestamp: string;        // ISO 8601
    reason: string | null;    // free text, optional
    actor: string;            // user_email cookie, falls back to 'unknown'
}
