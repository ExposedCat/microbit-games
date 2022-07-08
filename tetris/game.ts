/*
======== Hardware Controls ========
*/

type Callback = () => void

class MicroBit {
	public static handleLeftButtonPress(callback: Callback) {
		input.onButtonPressed(Button.A, callback)
	}
	public static handleRightButtonPress(callback: Callback) {
		input.onButtonPressed(Button.B, callback)
	}
	public static handleBothButtonsPress(callback: Callback) {
		input.onButtonPressed(Button.AB, callback)
	}
	public static handleLogoPress(callback: Callback) {
		input.onLogoEvent(TouchButtonEvent.Touched, callback)
	}
	public static turnOn(x: number, y: number) {
		led.plot(x, y)
	}
	public static turnOff(x: number, y: number) {
		led.unplot(x, y)
	}
	public static showNumber(num: number) {
		basic.showNumber(num)
	}
}

/*
========= MicroBit Helpers ========
*/

function setInterval(interval: number, callback: Callback) {
	loops.everyInterval(interval, callback)
}

/*
======== ======== ======== ========
*/


enum Contents {
	Empty,
	Busy
}

enum MovementDirections {
	Left = -1,
	Right = 1
}

enum Forms {
	G = '1101',
	I = '1100'
}

enum FallResults {
	Stuck,
	Fell,
	Falling
}

type GameMap = Contents[][]

interface Point {
	x: number
	y: number
}

type Form = Point[]

class Block {
	private form: string
	private x: number
	private y: number
	private game: Game
	private steps: number

	constructor(game: Game) {
		this.x = randomNumber(0, 3)
		this.y = 0
		this.steps = 0
		this.game = game
		this.form = randomNumber(0, 1) ? Forms.G : Forms.I
		const direction = randomNumber(0, 3)
		for (let i = 0; i < direction; ++i) {
			this.rotate()
		}
	}

	public getForm(template?: string) {
		if (template === undefined) {
			template = this.form
		}
		let y = 0
		let x = 0
		let form: Form = []
		for (let i = 0; i < 4; ++i) {
			y = i === 2 || i === 3 ? 1 : 0
			x = i === 1 || i === 3 ? 1 : 0
			if (`${template}`[i] === '1') {
				form.push({
					y: y + this.y,
					x: x + this.x
				})
			}
		}
		return form
	}

	public rotate(right = true) {
		const t = `${this.form}`
		const template = right
			? t[2] + t[0] + t[3] + t[1]
			: t[1] + t[3] + t[0] + t[2]

		const form = this.getForm(template)
		if (this.game.isFit(form)) {
			this.form = template
		} else if (right) {
			this.rotate(false)
		}
	}

	public move(direction: MovementDirections) {
		this.x += direction
		const form = this.getForm()
		if (!this.game.isFit(form)) {
			this.x -= direction
		}
	}

	public fall() {
		const form = this.getForm()
		let left: Point = null
		let right: Point = null
		for (const point of form) {
			if (point.x - this.x === 0) {
				left = point
			} else {
				right = point
			}
		}

		if (
			(left && this.game.isBusy(left.y + 1, left.x)) ||
			(right && this.game.isBusy(right.y + 1, right.x))
		) {
			return this.steps > 0 ? FallResults.Fell : FallResults.Stuck
		}
		this.y++
		this.steps++
		return FallResults.Falling
	}
}

class Game {
	public over: boolean
	private score: number
	private map: GameMap
	private block: Block

	constructor() {
		this.over = false
		this.score = 0
		this.map = this.initMap()
	}

	// TODO: Move GameMap to separate class
	private initMap(): GameMap {
		let map: number[][] = []
		for (let y = 0; y < 5; ++y) {
			map[y] = []
			for (let x = 0; x < 5; ++x) {
				map[y][x] = Contents.Empty
			}
		}
		return map
	}

	// TODO: Move to GameMap separate class
	public freezeCurrentBlock() {
		const form = this.block.getForm()
		for (const point of form) {
			const { y, x } = point
			this.map[y][x] = Contents.Busy
		}
	}

	// TODO: Move to GameMap separate class
	public isBusy(y: number, x: number) {
		if (!this.map[y]) {
			return true
		}
		return this.map[y][x] === Contents.Busy
	}

	// TODO: Move to GameMap separate class
	public isFit(form: Form) {
		for (const point of form) {
			const { y, x } = point
			if (y < 0 || y > 4 || x < 0 || x > 4) {
				return false
			}
			if (this.isBusy(y, x)) {
				return false
			}
		}
		return true
	}

	// TODO: Move to GameMap separate class
	public drawMap() {
		for (let y = 0; y < 5; ++y) {
			for (let x = 0; x < 5; ++x) {
				if (this.isBusy(y, x)) {
					MicroBit.turnOn(x, y)
				} else {
					MicroBit.turnOff(x, y)
				}
			}
		}
		if (this.block) {
			const form = this.block.getForm()
			for (const point of form) {
				const { y, x } = point
				MicroBit.turnOn(x, y)
			}
		}
	}

	private step() {
		if (!this.block) {
			this.block = new Block(this)
			return
		}
		const result = this.block.fall()
		if (result === FallResults.Stuck) {
			this.over = true
			return
		}
		if (result === FallResults.Fell) {
			this.freezeCurrentBlock()
			this.block = new Block(this)
			const form = this.block.getForm()
			if (!this.isFit(form)) {
				this.over = true
			}
		}
	}

	// TODO: Move to GameMap separate class
	private flushLine(yPosition: number) {
		for (let x = 0; x < 5; ++x) {
			this.map[yPosition][x] = Contents.Empty
		}
		if (yPosition !== 0) {
			for (let y = yPosition - 1; y >= 0; --y) {
				for (let x = 0; x < 5; ++x) {
					this.map[y + 1][x] = this.map[y][x]
					this.map[y][x] = Contents.Empty
				}
			}
		}
	}

	// TODO: Move to GameMap separate class
	private flushFilledLines() {
		for (let y = 0; y < 5; ++y) {
			let flush = true
			for (let x = 0; x < 5; ++x) {
				if (!this.isBusy(y, x)) {
					flush = false
					break
				}
			}
			if (flush) {
				this.score++
				this.flushLine(y)
			}
		}
	}

	private handleButtons() {
		const onPress = (callback: Callback) => () => {
			if (!this.over) {
				callback()
				this.drawMap()
			}
		}
		MicroBit.handleLeftButtonPress(
			onPress(() => this.block.move(MovementDirections.Left))
		)
		MicroBit.handleRightButtonPress(
			onPress(() => this.block.move(MovementDirections.Right))
		)
		MicroBit.handleBothButtonsPress(onPress(() => this.block.rotate()))
	}

	public start(refreshRate: number) {
		this.handleButtons()
		this.drawMap()
		let skip = false
		let waiting = 0
		setInterval(refreshRate / 2 / 10, () => {
			if (!waiting) {
				waiting = 10 - Math.floor(this.score / 2)
				if (!this.over) {
					this.flushFilledLines()
					if (!skip) {
						this.step()
					}
					skip = !skip
					this.drawMap()
				} else {
					MicroBit.showNumber(this.score)
				}
			}
			waiting--
		})
	}
}

function randomNumber(min: number, max: number) {
	return Math.floor(Math.random() * (max + 1 - min)) + min
}

const tetris = new Game()
// Start speed is 1000ms (1s)
tetris.start(1000)
