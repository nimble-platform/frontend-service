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

import { Price } from "../catalogue/model/publish/price";
import { Quantity } from "../catalogue/model/publish/quantity";
import { currencyToString, roundToTwoDecimals } from "./utils";

/**
 * Wrapper for the price of a single item (or at least, for the base quantity of this item).
 *
 * The aim of this class is to be a Quantity to be useable in all quantity based inputs.
 */
export class ItemPriceWrapper {
    /** hjid field from Quantity class */
    hjid: string = null;

    constructor(public price: Price,
                public hiddenPrice:boolean = false) {

    }

    get pricePerItem(): number {
        const amount = this.price.priceAmount;
        const qty = this.price.baseQuantity
        const baseQuantity = qty.value ||  1;

        if (!amount.value || !qty.value) {
            return 0;
        }

        return amount.value / qty.value;
    }

    get pricePerItemString(): string {
        const amount = this.price.priceAmount;
        const qty = this.price.baseQuantity
        const baseQuantity = qty.value ||  1;

        if (!amount.value || amount.value == 0 || !qty.value) {
            return "On demand";
        }

        if (baseQuantity === 1) {
            return `${roundToTwoDecimals(amount.value)} ${currencyToString(amount.currencyID)} per ${qty.unitCode}`
        }
        return `${roundToTwoDecimals(amount.value)} ${currencyToString(amount.currencyID)} for ${baseQuantity} ${qty.unitCode}`
    }

    get currency(): string {
        return currencyToString(this.price.priceAmount.currencyID);
    }

    set currency(currency: string) {
        this.price.priceAmount.currencyID = currency;
    }

    get baseQuantity(): number {
        return this.price.baseQuantity.value || 1;
    }

    hasPrice(): boolean {
        // != here gives "not null or undefined", which is the behaviour we want.
        return !this.hiddenPrice && this.price.priceAmount.value != null && !isNaN(this.price.priceAmount.value) && this.price.priceAmount.value != 0;
    }

    /**
     * Getters/Setters for quantity
     */

    get value(): number {
        return this.price.priceAmount.value / this.baseQuantity;
    }

    set value(value: number) {
        this.price.priceAmount.value = this.baseQuantity * value;
    }

    get unitCode(): string {
        return this.currency;
    }

    set unitCode(unitCode: string) {
        this.currency = unitCode;
    }
}
