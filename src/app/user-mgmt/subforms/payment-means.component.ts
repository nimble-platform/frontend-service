import { Component, Input } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { PaymentMeans } from '../model/payment-means';

@Component({
    moduleId: module.id,
    selector: 'payment-means-form',
    templateUrl: 'payment-means.component.html',
    styleUrls: ['payment-means.component.css']
})
export class PaymentMeansForm {

    @Input('group')
    public paymentMeansForm: FormGroup;


    public static update(form, paymentMeans: PaymentMeans) {

        if (paymentMeans) {
            form.controls.instructionNote.setValue(paymentMeans.instructionNote);
        }
    }

    public static generateForm(builder: FormBuilder) {
        return builder.group({
            instructionNote: [''],
        });
    }
}