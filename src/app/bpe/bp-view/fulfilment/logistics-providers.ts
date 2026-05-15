/*
 * HCDP-05-05 — Logistics Provider directory (catalogue-consolidated).
 *
 * The list is served by catalog-service `GET /logistics-providers`, which
 * proxies indexing-service party search filtered to
 * `businessType="Logistics Provider"`. Each entry corresponds to a real
 * Nimble Party seeded by STEP 7c — discoverable via Find Logistics search
 * AND selectable in the Replace Provider modal, sharing one source of truth.
 *
 * Before HCDP-05-05 a parallel `logistics_provider_type` table backed this
 * endpoint and the modal stored only a string name in UBL on replacement.
 * Now every replacement also writes the real `partyId` (and
 * `federationInstanceID` when populated) into UBL carrierParty.
 *
 * No frontend fallback array — when indexing-service is unreachable the
 * modal surfaces an unavailable state and Replace is disabled. This keeps
 * "single source of truth" honest.
 *
 * Cross-references:
 *  - HCDP-05-01 OVERDUE_DAYS_THRESHOLD = 5  (delivery-late SIGNAL)
 *  - HCDP-05-04 CANCELLATION_WINDOW_DAYS = 10 (carrier-replace AFFORDANCE)
 *    Two distinct concepts; the 5-day gap lets the buyer act AFTER a
 *    delivery becomes overdue (matches the UC trigger "delay occurs").
 */

export interface LogisticsProvider {
    /** Stable slug — vatNumber.toLowerCase(), e.g. "de-dhl-logi-001". */
    slug: string;
    /** Display name (legalName from indexing-service). */
    name: string;
    /** ISO-3166-1 alpha-2 country code derived from vatNumber prefix. */
    country: string;
    /** Real Nimble Party ID — written into UBL carrierParty.partyIdentification[0].id on replacement. */
    partyId: string;
    /** Federation instance identifier — null in federation-OFF deployments. */
    federationInstanceID?: string | null;
}

/** Days a buyer can replace the carrier after dispatch. See HCDP-05-04 spec §2.4. */
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
