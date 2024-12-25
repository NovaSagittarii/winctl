export interface Window {
	/**
	 * calls `IsWindow`
	 */
	exists(): boolean;

	/**
	 * calls `IsWindowVisible`
	 */
	isVisible(): boolean;

	/**
	 * calls `GetWindowText`
	 */
	getTitle(): string;

	/**
	 * Returns the window handle
	 */
	getHwnd(): number;

	/**
	 * calls `GetClassName`
	 */
	getClassName(): string;

	/**
	 * calls `GetWindowThreadProcessId`
	 */
	getPid(): number;

	/**
	 * calls `GetParent`
	 * @return parent's window handle (HWND)
	 */
	getParent(): number;

	/**
	 * calls `GetAncestor`
	 * @return ancestor's window handle
	 */
	getAncestor(): number;

	/**
	 * calls `MonitorFromWindow`;
	 * @return monitor name, isPrimary, dimensions
	 */
	getMonitor(): Monitor;

	/**
	 * calls `SetForegroundWindow`
	 */
	setForegroundWindow(): void;

	/**
	 * calls `SetWindowPos`
	 */
	setWindowPos(x: number, y: number, width: number, height: number): void;
}

export interface Monitor {
	name: string;

	/**
	 * Whether the monitor is primary.
	 * evaluates to `mi.dwFlags & MONITORINFOF_PRIMARY`
	 */
	primary: boolean;

	dimensions: Dimensions;
}

export interface Dimensions {
	left: number;
	top: number;
	right: number;
	bottom: number;
}
