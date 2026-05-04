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

export const TABS = {
    WELCOME: "WELCOME",
    PURCHASES: "PURCHASES",
    SALES: "SALES",
    CATALOGUE: "CATALOGUE",
    COLLABORATION: "COLLABORATION",
    FAVOURITE: "FAVOURITE",
    COMPARE: "COMPARE",
    PERFORMANCE: "PERFORMANCE",
    PROJECTS: "PROJECTS",
    DEMANDS: 'DEMANDS',
    FRAME_CONTRACTS: "FRAME_CONTRACTS",
    UNSHIPPED_ORDERS: "UNSHIPPED_ORDERS",
    PENDING_RECEIPTS: "PENDING_RECEIPTS",
    MONITOR: "MONITOR"
};

export const PAGE_SIZE = 5;

// HCDP-05-01 F1 / HCDP-05-02 F3 — shared threshold: a fulfilment with a despatch older
// than this and no receipt is rendered as "Overdue" on the timeline AND in the
// Pending Receipts inbox. Single source of truth for both surfaces.
export const OVERDUE_DAYS_THRESHOLD = 5;
