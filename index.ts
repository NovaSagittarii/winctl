import bindings from 'bindings';
import EventEmitter from 'node:events';

import { Window } from './types';
import WinctlBinding from './winctl';

const winctl = bindings('winctl') as WinctlBinding;
export const {
	EnumerateWindows,
	GetActiveWindow,
	GetWindowByClassName,
	GetWindowByTitleExact,
} = winctl;

export function FindWindows(validateFunc: (window: Window) => boolean | any) {
	return new Promise<Window[]>(resolve => {
		const result: Window[] = [];
		EnumerateWindows(function (win: Window) {
			if (validateFunc == null || validateFunc(win)) {
				result.push(win);
			}
			return true;
		});

		resolve(result);
	});
};

export function FindByTitle(title: string | RegExp) {
	const pattern = typeof title === "string" ? new RegExp(title) : title;

	const FindByTitlePromise = new Promise<Window>((resolve, reject) => {
		let result: Window | null = null;
		EnumerateWindows(function (win: Window) {
			const title = win.getTitle();
			if (pattern.test(title)) {
				result = win;
				return false;
			}
			return true;
		});

		if (result) {
			resolve(result);
		} else {
			reject();
		}
	});

	return FindByTitlePromise;
};

export enum WindowStates {
	HIDE = 0,
	SHOWNORMAL = 1,
	SHOWMINIMIZED = 2,
	MAXIMIZE = 3,
	SHOWMAXIMIZED = 3,
	SHOWNOACTIVATE = 4,
	SHOW = 5,
	MINIMIZE = 6,
	SHOWMINNOACTIVE = 7,
	SHOWNA = 8,
	RESTORE = 9,
	SHOWDEFAULT = 10,
	FORCEMINIMIZE = 11,
};

export enum AncestorFlags {
	PARENT = 1,
	ROOT = 2,
	ROOTOWNER = 3,
};

export enum HWND {
	NOTOPMOST = -2,
	TOPMOST = -1,
	TOP = 0,
	BOTTOM = 1,
};

export enum SWP {
	NOSIZE = 0x0001,
	NOMOVE = 0x0002,
	NOZORDER = 0x0004,
	NOREDRAW = 0x0008,
	NOACTIVATE = 0x0010,
	DRAWFRAME = 0x0020,
	FRAMECHANGED = 0x0020,
	SHOWWINDOW = 0x0040,
	HIDEWINDOW = 0x0080,
	NOCOPYBITS = 0x0100,
	NOOWNERZORDER = 0x0200,
	NOREPOSITION = 0x0200,
	NOSENDCHANGING = 0x0400,
	DEFERERASE = 0x2000,
	ASYNCWINDOWPOS = 0x4000,
};

interface EventLoop {
	func: any;
	events: ("active-window" | "open-window" | "close-window")[];
	interval: number;
	id?: NodeJS.Timeout | null;
}

interface WindowEventsEmitter extends EventEmitter {
	activeWindow: Window;
	existingWindows: Record<string, boolean> | null;
	eventLoops: Record<"active-window" | "window-list", EventLoop>;
}

interface WindowEvents {
	// https://stackoverflow.com/a/61609010
	'active-window': (currentWindow: Window, activeWindow: Window) => void;
	'open-window': (window: Window) => void;
}

class WindowEventsEmitter extends EventEmitter {
	constructor() {
		super();

		this.activeWindow = GetActiveWindow();
		this.existingWindows = null;

		this.eventLoops = {
			"active-window": {
				func: this.checkActiveWindow.bind(this),
				events: ["active-window"],
				interval: 50
			},
			"window-list": {
				func: this.checkNewWindow.bind(this),
				events: ["open-window", "close-window"],
				interval: 50
			}
		};
	}

	addListener<U extends keyof WindowEvents, V extends WindowEvents[U]>(evt: U, listener: V) {
		super.addListener(evt, listener);
		this.updatePollingLoops();
		return this;
	}

	removeAllListeners(evt: string) {
		super.removeAllListeners(evt);
		this.updatePollingLoops();
		return this;
	}

	removeListener<U extends keyof WindowEvents, V extends WindowEvents[U]>(evt: U, listener: V) {
		super.removeListener(evt, listener);
		this.updatePollingLoops();
		return this;
	}

	updatePollingLoops() {
		Object.entries(this.eventLoops).forEach(([_loopName, props]) => {
			var listenerCount = props.events.reduce((prev, curr) => prev + this.listenerCount(curr), 0);
			if (listenerCount > 0 && props.id == null) {
				props.id = setInterval(props.func, props.interval);
			} else if (listenerCount == 0 && props.id != null) {
				clearInterval(props.id);
				props.id = null;
			}
		});
	}

	checkActiveWindow() {
		var currentWindow = GetActiveWindow();
		if (currentWindow.getHwnd() != this.activeWindow.getHwnd()) {
			this.emit("active-window", currentWindow, this.activeWindow);
			this.activeWindow = currentWindow;
		}
	}

	checkNewWindow() {
		var isFirst = false;
		if (this.existingWindows == null) {
			isFirst = true;
			this.existingWindows = {};
		}

		FindWindows(win => win.isVisible() && win.getTitle()).then(windows => {
			windows.forEach(window => {
				if (this.existingWindows![window.getHwnd()] == null) {
					// New window
					this.existingWindows![window.getHwnd()] = true;
					if (!isFirst) {
						this.emit("open-window", window);
					}
				}
			});
		});
	}
}

export const Events = new WindowEventsEmitter();
