import {Injectable} from "@angular/core";

@Injectable()
export class UnshippedOrdersTransitionService {
    private _unShippedOrderIds: string[] = null;

    public setUnShippedOrderIds(orderIds:string[]):void{
        this._unShippedOrderIds = orderIds;
    }

    public getUnShippedOrderIds(): string[] {
        return this._unShippedOrderIds;
    }

    public clearUnShippedOrderIds(){
        this._unShippedOrderIds = null;
    }
}
