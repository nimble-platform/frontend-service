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

import { TABS } from "../constants";
import { FEDERATIONID } from '../../catalogue/model/constants';

/**
 * The query parameters exactly as they appear in the dashboard's URL.
 */
export class DashboardQueryParameters {
    constructor(
        public tab: string = null,
        public arch: boolean = false,
        public pg: number = 1,
        public prd: string = "",
        public cat: string = "",
        public prt: string = "",
        public sts: string = "",
        public ins: string = FEDERATIONID()
    ) { }
}
