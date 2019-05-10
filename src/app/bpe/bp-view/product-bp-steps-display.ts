
export type ProductBpStepsDisplay =
    | "Order" // show steps for the order
    | "Transport" // show steps for transport only (no order)
    | "Transport_After_Order" // show transport with extra order steps
    | "Order_Before_Transport" // show order with ". . ." icon for transport
    | "Logistics"; // show steps for logistics services
