const ACCELERATION_THRESHOLD = 100

enum contents {
	EMPTY,
	SELF,
	FOOD
}

enum Directions {
	UP = 0,
	RIGHT = 1,
	DOWN = 2,
	LEFT = 3
}

let snake = {
	direction: Directions.UP,
	body: [{ x: 0, y: 0 }]
}

let over = false

let map: number[][] = []
for (let x = 0; x < 5; ++x) {
	map[x] = []
	for (let y = 0; y < 5; ++y) {
		map[x][y] = contents.EMPTY
	}
}
map[0][0] = contents.SELF

function getNextItemPosition(point: any) {
	const { x, y } = point
	if (snake.direction == Directions.LEFT) {
		return { x: x - 1, y }
	}
	if (snake.direction == Directions.RIGHT) {
		return { x: x + 1, y }
	}
	if (snake.direction == Directions.UP) {
		return { x, y: y - 1 }
	}
	if (snake.direction == Directions.DOWN) {
		return { x, y: y + 1 }
	}
	return { x, y }
}

function validateItemPosition(point: { x: number; y: number }) {
	const { x, y } = point
	if (map[x] === undefined) {
		const newX = x < 0 ? 4 : 0
		return { x: newX, y }
	}
	if (map[x][y] === undefined) {
		const newY = y < 0 ? 4 : 0
		return { x, y: newY }
	}
	return point
}

function getItem(point: { x: number; y: number }) {
	return {
		content: map[point.x][point.y],
		x: point.x,
		y: point.y
	}
}

interface Point {
	x: number
	y: number
}

function setItem(point: Point, content: number) {
	map[point.x][point.y] = content
}

function moveSnake(point: any, feed: boolean) {
	const tail = snake.body[snake.body.length - 1]
	if (!feed) {
		setItem(tail, contents.EMPTY)
		snake.body.pop()
	}
	setItem(point, contents.SELF)
	delete point.content
	snake.body.unshift(point)
	if (feed) {
		placeFood()
	}
}

function updateOneDirection(
	value: number,
	direction: Directions,
	opposite: Directions
) {
	if (value < -ACCELERATION_THRESHOLD) {
		if (snake.direction !== direction) {
			snake.direction = opposite
		}
	} else if (value > ACCELERATION_THRESHOLD) {
		if (snake.direction !== opposite) {
			snake.direction = direction
		}
	}
}

function updateDirection() {
	const accelerationX = input.acceleration(Dimension.X)
	const accelerationY = input.acceleration(Dimension.Y)
	if (Math.abs(accelerationX) > Math.abs(accelerationY)) {
		updateOneDirection(accelerationX, Directions.RIGHT, Directions.LEFT)
	} else {
		updateOneDirection(accelerationY, Directions.DOWN, Directions.UP)
	}
}

function makeStep() {
	/*
	======= COMMENT NEXT LINE FOR CONTROL VIA ACCELERATION ======= 
	*/
	updateDirection()
	const item = getItem(
		validateItemPosition(getNextItemPosition(snake.body[0]))
	)
	if (item.content === contents.SELF) {
		over = true
	} else {
		const feed = item.content === contents.FOOD
		moveSnake(item, feed)
	}
}

function drawMap() {
	for (let x = 0; x < 5; ++x) {
		for (let y = 0; y < 5; ++y) {
			if (map[x][y] === contents.EMPTY) {
				led.unplot(x, y)
			} else {
				led.plot(x, y)
			}
		}
	}
}

function runLifeCycle() {
	placeFood()
	loops.everyInterval(500, () => {
		if (over) {
			basic.showNumber(snake.body.length)
			return
		}
		makeStep()
		if (!over) {
			drawMap()
		}
	})
}

/*
======= UNCOMMENT FOR CONTROL VIA BUTTONS ======= 
*/

// input.onButtonPressed(Button.B, function turnRight() {
// 	if (over) {
// 		return
// 	}
// 	if (snake.direction === Directions.LEFT) {
// 		snake.direction = Directions.UP
// 	} else {
// 		snake.direction++
// 	}
// })

// input.onButtonPressed(Button.A, function turnLeft() {
// 	if (over) {
// 		return
// 	}
// 	if (snake.direction === Directions.UP) {
// 		snake.direction = Directions.LEFT
// 	} else {
// 		snake.direction--
// 	}
// })

runLifeCycle()

function placeFood() {
	const x = Math.floor(Math.random() * 5)
	const y = Math.floor(Math.random() * 5)
	const item = getItem({ x, y })
	if (item.content !== contents.EMPTY) {
		placeFood()
	} else {
		setItem({ x, y }, contents.FOOD)
	}
}
