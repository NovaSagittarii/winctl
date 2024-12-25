import { Window } from "./types";

export interface WinctlBinding {
    /**
     * calls `GetForegroundWindow`
     */
    GetActiveWindow(): Window;

    /**
     * calls `FindWindowEx`
     * @param className 
     */
    GetWindowByClassName(className: string): Window;

    /**
     * calls `FindWindow`
     * @param title 
     */
    GetWindowByTitleExact(title: string): Window;

    /**
     * calls `EnumWindows`
     * @param callback 
     */
    EnumerateWindows(callback: (window: Window) => boolean): void;
}

export default WinctlBinding;
