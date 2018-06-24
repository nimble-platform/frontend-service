import { CallStatus } from "./call-status";

export interface ActionsRowSlot {
    type: "text" | "callStatus" | "button" | "back"
    slotClass: string
    contentClass?: string
    text?: string
    onclick?: Function
    callStatus?: CallStatus
    disabled?: boolean
}