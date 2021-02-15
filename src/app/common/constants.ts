/*
 * Copyright 2020
 * SRFG - Salzburg Research Forschungsgesellschaft mbH; Salzburg; Austria
   In collaboration with
 * SRDC - Software Research & Development Consultancy; Ankara; Turkey
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
       http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */

export const ALLOWED_EXTENSIONS = ['jpeg', 'png', 'gif', 'jpg'];
export const maximumDecimalsForPrice = 2;
export const deliveryPeriodUnitListId: string = 'time_quantity';
export const warrantyPeriodUnitListId: string = 'warranty_period';
export const frameContractDurationUnitListId: string = 'frame_contract_period';
export const defaultVatRate: number = 20;
export const FRAME_CONTRACT_DURATION_TERM_NAME = "FRAME_CONTRACT_DURATION";

// Cookie names for chat
export const chatToken: string = "rocket_chat_token";
export const chatUserID: string = "rocket_chat_userID";
export const chatUsername: string = "rocket_chat_username";
export const chatRCToken: string = "rc_token";
export const chatRCID: string = "rc_uid";
export const chatRCConnect: string = "connect.sid";

// default category uris for logistics and transport services
export const defaultLogisticsServiceCategoryUri = "nimble:category:LogisticsService";
export const defaultTransportServiceCategoryUri = "nimble:category:TransportService";

// field names
export const FIELD_NAME_QUANTITY_VALUE = 'quantity_value';
export const FIELD_NAME_PRODUCT_PRICE_AMOUNT = 'product_price_amount';
export const FIELD_NAME_PRODUCT_PRICE_BASE_QUANTITY = 'price_base_quantity';

// product search result fields
export const product_base_quantity = "baseQuantity";
export const product_base_quantity_unit = "baseQuantityUnit";

export const AEROSPACE_TAXONOMY_PART_NUMBER_PROPERTY_URI = "http://www.nimble-project.org/resource/aerospace#PartNumber";
export const MAX_INT = 2147483647;

export const CIRCULER_ECONOMY_CERTIFICATE_GROUP = '';

export const MONTHS = ["Jan", "Feb", "March", "April", "May", "June", "July", "Aug", "Sep", "Oct", "Nov", "Dec"];
