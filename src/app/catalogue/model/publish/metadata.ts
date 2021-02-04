/*
 * Copyright 2020
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

import { Text } from "./text";
import { DEFAULT_LANGUAGE } from '../constants';
import {Code} from './code';

export class Metadata {
    public hjid: number;
    public creationDate: string;
    public modificationDate: string;
    public ownerUser: string;
    public ownerCompany: string[];

    constructor(json: any) {
        this.hjid = json.hjid;
        this.creationDate = json.creationDate;
        this.modificationDate = json.modificationDate;
        this.ownerUser = json.ownerUser;
        this.ownerCompany = json.ownerCompany;
    }
}
