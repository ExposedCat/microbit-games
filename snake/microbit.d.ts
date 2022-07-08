export {}

interface Basic {
	showNumber: (num: number) => void
}

interface Led {
	plot: (x: number, y: number) => void
	unplot: (x: number, y: number) => void
}

type Callback = () => void

interface Loops {
	everyInterval: (interval: number, callback: Callback) => void
}

interface Input {
	onButtonPressed: (button: Button, callback: Callback) => void
	onLogoEvent: (event: TouchButtonEvent, callback: Callback) => void
	acceleration: (dimension: Dimension) => number
}

declare global {
	const basic: Basic
	const led: Led
	const loops: Loops
	const input: Input
	enum Button {
		A,
		B,
		AB
	}
	enum TouchButtonEvent {
		Touched,
		Pressed,
		Released,
		LongPressed
	}
	enum Dimension {
		X,
		Y,
		Z,
		Strength
	}
}
