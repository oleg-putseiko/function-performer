<div align="center">

# function-performer

[![Latest Release](https://badgen.net/github/release/oleg-putseiko/function-performer?icon=github&cache=240)](https://github.com/oleg-putseiko/function-performer/releases)
[![Total Downloads](https://badgen.net/npm/dt/function-performer?icon=npm&cache=240)](https://www.npmjs.com/package/function-performer)
[![Install Size](https://badgen.net/packagephobia/install/function-performer?color=purple&cache=240)](https://www.npmjs.com/package/function-performer)
[![License](https://badgen.net/npm/license/function-performer?color=black&cache=240)](https://github.com/oleg-putseiko/function-performer/blob/main/LICENSE.md)

</div>

Performer providing API for debounce, throttle and deduplication functions.

## Installation

```bash
npm install function-performer

# or
pnpm install function-performer

# or
yarn add function-performer
```

## API

### constructor

Type: `new (config?: PerformerConfig): Performer`

#### Options

- `config` — Optional parameter providing the performer configuration.
  - `debounce` - An optional property that provides a debounce configuration.
    - `interval` - The time in milliseconds during which the target function execution will be discarded. _(default value is `0`)_
  - `throttle` - An optional property that provides a throttle configuration.
    - `interval` - The time in milliseconds during which the target function execution will be blocked. _(default value is `0`)_
  - `deduplication` - An optional property that provides a deduplication configuration.
    - `interval` - The time in milliseconds during which duplicate detection will occur after calling the target function. _(default value is `0`)_

#### Example

```js
import { Performer } from 'function-performer';

const performer = new Performer({
  debounce: { interval: 500 },
  throttle: { interval: 1000 },
  deduplication: { interval: 100 },
});
```

### debounce

Type: `(func: DebouncedFunction, ...args: unknown[]) => void`

Discards execution of operations performed within the specified interval.

#### Parameters

- `func` — A function whose call will be discarded.
- `...args` — A set of parameters for the function being performed.

#### Example

```js
import { Performer } from 'function-performer';

const performer = new Performer({
  debounce: { interval: 1000 },
});

const func = (arg: number) => {
  console.log(arg);
};

performer.debounce(func, 1); // will be discarded
performer.debounce(func, 2); // will be discarded
performer.debounce(func, 3); // logs `3`

setTimeout(() => {
  performer.debounce(func, 4); // logs `4`
}, 2000);
```

### throttle

Type: `(func: ThrottledFunction, ...args: unknown[]) => void`

Blocks execution of operations performed within the specified interval.

#### Parameters

- `func` — A function whose call will be blocked.
- `...args` — A set of parameters for the function being performed.

#### Example

```js
import { Performer } from 'function-performer';

const performer = new Performer({
  // Will only allow one call every 100 milliseconds
  throttle: { interval: 100 },
});

const func = (arg: number) => {
  console.log(arg);
};

let time = 0;
const interval = setInterval(() => {
  if(time === 1000) {
    clearInterval(interval);
    return;
  }

  performer.throttle(func, time); // logs `0`, `100`, `200`, `300`, …, `900`

  time += 10;

  // Will be called every 10 milliseconds
}, 10);
```

### deduplicate

Type: `(func: DeduplicatedFunction, ...args: unknown[]) => void`

Detects duplicate function calls and executes the function only once during the specified interval.

#### Parameters

- `func` — A function whose duplicate executions will be detected. The first parameter of the function should be the number of detected calls.
- `...args` — A set of parameters for the function being performed.

#### Example

```js
import { Performer } from 'function-performer';

const performer = new Performer({
  deduplication: { interval: 100 },
});

const func1 = (count: number, arg: number) => {
  console.log({ count, arg });
};

const func2 = (count: number, arg: object) => {
  console.log({ count, arg });
};

performer.deduplicate(func1, 1); // will be blocked
performer.deduplicate(func1, 1); // logs `{ count: 2, arg: 1 }`
performer.deduplicate(func2, { foo: { bar: 'baz' } }); // will be blocked
performer.deduplicate(func2, { foo: { bar: 'baz' } }); // will be blocked
performer.deduplicate(func2, { foo: { bar: 'baz' } }); // logs `{ count: 3, arg: { foo: { bar: 'baz' } } }`

setTimeout(() => {
  performer.deduplicate(func2, { foo: { bar: 'baz' } }); // logs `{ count: 1, arg: { foo: { bar: 'baz' } } }`
}, 1000);
```
