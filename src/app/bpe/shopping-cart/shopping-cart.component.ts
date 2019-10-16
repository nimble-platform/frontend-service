import {Catalogue} from '../../catalogue/model/publish/catalogue';
import {Router} from '@angular/router';
import {Component, OnInit} from '@angular/core';
import {ShoppingCartDataService} from './shopping-cart-data-service';
import {selectDescription, selectName} from '../../common/utils';
/**
 * Created by suat on 11-Oct-19.
 */
@Component({
    selector: 'shopping-cart',
    templateUrl: './shopping-cart.component.html'
})
export class ShoppingCartComponent implements OnInit {
    shoppingCart: Catalogue;

    selectName = selectName;
    selectDescription = selectDescription;

    constructor(private shoppingCartDataService: ShoppingCartDataService,
                private router: Router) {}

    ngOnInit() {
        this.shoppingCartDataService.getShoppingCart().then(cart => {
            this.shoppingCart = cart;
        })
    }

    onNavigateToTheSearchPage(): void {
        this.router.navigate(['simple-search']);
    }

    onRemoveFromCart(cartLineHjid: number): void {
        this.shoppingCartDataService.removeItemFromCart(cartLineHjid).then(cartCatalogue => {
            this.shoppingCart = cartCatalogue;
        }).catch(error => {
            console.log('Failed to delete product from the shopping cart');
        })
    }
}
